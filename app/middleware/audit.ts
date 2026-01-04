// app/middleware/audit.ts (ou dans votre middleware existant)
import { NextRequest, NextResponse } from 'next/server';
import { auditLogger, AuditAction } from '@/lib/audit/logger';

export async function auditMiddleware(
  request: NextRequest,
  response: NextResponse,
  userId?: number,
  userEmail?: string,
  userType?: 'ADMIN' | 'PARENT'
) {
  // Capturer les suppressions de réservations
  if (request.method === 'DELETE' && request.nextUrl.pathname.includes('/api/admin/reservations/')) {
    const reservationId = parseInt(request.nextUrl.pathname.split('/').pop() || '0');
    
    // Vous devrez extraire les données de la réponse
    // Cela nécessite d'intercepter la réponse
  }
  
  // Capturer les créations
  if (request.method === 'POST') {
    // Loguer selon le endpoint
    const path = request.nextUrl.pathname;
    
    if (path.includes('/api/admin/reservations')) {
      await auditLogger.log({
        action: AuditAction.RESERVATION_CREATED,
        performedBy: {
          id: userId!,
          email: userEmail!,
          type: userType!,
        },
        ipAddress: request.ip || request.headers.get('x-forwarded-for') || 'N/A',
        userAgent: request.headers.get('user-agent') || 'N/A',
      });
    }
  }
}