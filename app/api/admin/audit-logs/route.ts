// app/api/admin/audit-logs/route.ts

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/src/lib/prisma';
import { requireAdmin } from '@/src/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // 🔐 Sécurité : admin obligatoire
    await requireAdmin();

    // 🔍 Filtres depuis l’URL
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');
    const email = searchParams.get('email');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    const where: any = {};

    if (action) {
      where.action = action;
    }

    if (email) {
      where.performedByEmail = {
        contains: email,
        mode: 'insensitive',
      };
    }

    if (dateFrom || dateTo) {
      where.timestamp = {};
      if (dateFrom) {
        where.timestamp.gte = new Date(dateFrom);
      }
      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setDate(endDate.getDate() + 1);
        where.timestamp.lt = endDate;
      }
    }

    // 📜 Récupération des logs
    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: {
        timestamp: 'desc',
      },
      take: 100,
    });

    // 🎯 Format attendu par le frontend
    const formattedLogs = logs.map(log => ({
      id: log.id,
      action: log.action,
      performedByEmail: log.performedByEmail,
      performedByType: log.performedByType,
      targetId: log.targetId,
      targetType: log.targetType,
      details: log.details,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      timestamp: log.timestamp.toISOString(),
    }));

    return NextResponse.json(formattedLogs);
  } catch (error: any) {
    console.error('Erreur audit logs:', error);

    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
