// app/api/admin/exports/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/src/lib/prisma';
import { requireAdmin } from '@/src/lib/auth';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = req.nextUrl;
    const workshopId = searchParams.get('workshopId');
    const format = searchParams.get('format') || 'csv'; // csv or json

    let whereClause: any = {};
    if (workshopId) {
      const id = parseInt(workshopId, 10);
      if (isNaN(id)) {
        return new NextResponse('Invalid workshop ID', { status: 400 });
      }
      whereClause.workshopId = id;
    }

    const bookings = await prisma.booking.findMany({
      where: whereClause,
      include: {
        child: {
          include: {
            parent: true,
          },
        },
        workshop: true,
      },
      orderBy: [
        { workshop: { startTime: 'asc' } },
        { child: { lastName: 'asc' } },
      ],
    });

    if (format === 'json') {
      return NextResponse.json(bookings);
    }

    // Generate CSV
    const csvHeaders = [
      'Workshop Name',
      'Workshop Date',
      'Workshop Time',
      'Workshop Location',
      'Child First Name',
      'Child Last Name',
      'Child Birth Date',
      'Parent First Name',
      'Parent Last Name',
      'Parent Email',
      'Parent Phone',
      'Booking Status',
      'Booking Created',
      'Child Allergies',
      'Child Medical Note',
    ];

    const csvRows = bookings.map(booking => [
      booking.workshop.name,
      new Date(booking.workshop.startTime).toLocaleDateString('fr-FR'),
      `${new Date(booking.workshop.startTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} - ${new Date(booking.workshop.endTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`,
      booking.workshop.location || '',
      booking.child.firstName,
      booking.child.lastName,
      new Date(booking.child.birthDate).toLocaleDateString('fr-FR'),
      booking.child.parent.firstName,
      booking.child.parent.lastName,
      booking.child.parent.email,
      booking.child.parent.phone || '',
      booking.status,
      new Date(booking.createdAt).toLocaleString('fr-FR'),
      booking.child.allergies || '',
      booking.child.medicalNote || '',
    ]);

    const csvContent = [csvHeaders, ...csvRows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const filename = workshopId
      ? `workshop-${workshopId}-bookings-${new Date().toISOString().split('T')[0]}.csv`
      : `all-bookings-${new Date().toISOString().split('T')[0]}.csv`;

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('[API_ADMIN_EXPORTS_GET]', error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}