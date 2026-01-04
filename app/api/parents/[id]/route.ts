// app/api/parents/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/src/lib/prisma';
import { requireAuth, requireAdmin } from '@/src/lib/auth';

// GET /api/parents/[id] - Récupérer un parent par son ID
export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth();
    const resolvedParams = await context.params;
    const id = parseInt(resolvedParams.id, 10);

    if (isNaN(id)) {
      return new NextResponse('Invalid ID', { status: 400 });
    }

    // Check if the session user is admin or requesting their own data
    if (session.type !== 'admin' && session.id !== id) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const parent = await prisma.parent.findUnique({
      where: { id },
      include: {
        children: true, // Inclure les enfants liés
      },
    });

    if (!parent) {
      return new NextResponse('Parent not found', { status: 404 });
    }

    return NextResponse.json(parent);
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    console.error('[API_PARENT_GET]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// PUT /api/parents/[id] - Mettre à jour un parent
export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth();
    const resolvedParams = await context.params;
    const id = parseInt(resolvedParams.id, 10);

    if (isNaN(id)) {
      return new NextResponse('Invalid ID', { status: 400 });
    }

    // Check if the session user is admin or updating their own data
    if (session.type !== 'admin' && session.id !== id) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const body = await req.json();
    const parent = await prisma.parent.update({
      where: { id },
      data: body,
    });

    return NextResponse.json(parent);
  } catch (error: any) {
    console.error('[API_PARENT_PUT]', error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    if (error.code === 'P2025') {
      return new NextResponse('Parent not found', { status: 404 });
    }
    if (error.code === 'P2002') {
      return new NextResponse('A parent with this email already exists', { status: 409 });
    }
    console.error('[API_PARENT_PUT]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// DELETE /api/parents/[id] - Supprimer un parent
export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth();
    const resolvedParams = await context.params;
    const id = parseInt(resolvedParams.id, 10);

    if (isNaN(id)) {
      return new NextResponse('Invalid ID', { status: 400 });
    }

    // Check if the session user is admin
    if (session.type !== 'admin') {
      return new NextResponse('Forbidden', { status: 403 });
    }

    // Fetch the parent first to run checks
    const parentRecord = await prisma.parent.findUnique({ where: { id } });
    if (!parentRecord) {
      return new NextResponse('Parent not found', { status: 404 });
    }

    // Do not allow deleting records that are marked as ADMIN in the parents table
    if (parentRecord.role === 'ADMIN') {
      return new NextResponse('Cannot delete administrator records from parents table', { status: 403 });
    }

    // Prevent an admin user from deleting their own account if somehow an admin account
    // exists as a parent row with the same email (safety check)
    const admin = await prisma.admin.findUnique({ where: { id: session.id } });
    if (admin && admin.email && admin.email === parentRecord.email) {
      return new NextResponse('Cannot delete your own account', { status: 403 });
    }

    // Note : La suppression d'un parent peut échouer s'il a des enfants
    // liés, en fonction de la configuration de votre base de données (ON DELETE CASCADE).
    // Prisma, par défaut, empêche la suppression si des relations existent.
    // Vous devez d'abord supprimer ou dissocier les enfants.
    await prisma.parent.delete({ where: { id } });

    return new NextResponse(null, { status: 204 }); // 204 No Content
  } catch (error: any) {
    console.error('[API_PARENT_DELETE]', error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    if (error.code === 'P2025') {
      return new NextResponse('Parent not found', { status: 404 });
    }
    // Gère le cas où des enregistrements liés (enfants) empêchent la suppression
    if (error.code === 'P2003') {
        return new NextResponse('Cannot delete parent. Please delete associated children first.', { status: 409 });
    }
    console.error('[API_PARENT_DELETE]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
