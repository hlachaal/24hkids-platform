import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export enum AuditAction {
  // Réservations
  RESERVATION_CREATED = 'RESERVATION_CREATED',
  RESERVATION_DELETED = 'RESERVATION_DELETED',
  RESERVATION_STATUS_CHANGED = 'RESERVATION_STATUS_CHANGED',
  
  // Ateliers
  WORKSHOP_CREATED = 'WORKSHOP_CREATED',
  WORKSHOP_UPDATED = 'WORKSHOP_UPDATED',
  WORKSHOP_DELETED = 'WORKSHOP_DELETED',
  
  // Parents/Enfants
  PARENT_CREATED = 'PARENT_CREATED',
  PARENT_UPDATED = 'PARENT_UPDATED',
  PARENT_DELETED = 'PARENT_DELETED',
  CHILD_CREATED = 'CHILD_CREATED',
  CHILD_UPDATED = 'CHILD_UPDATED',
  CHILD_DELETED = 'CHILD_DELETED',
  
  // Système
  USER_LOGIN = 'USER_LOGIN',
  USER_LOGOUT = 'USER_LOGOUT',
  ADMIN_ACTION = 'ADMIN_ACTION',
}

export interface AuditLogData {
  action: AuditAction;
  performedBy: {
    id: number;
    email: string;
    type: 'ADMIN' | 'PARENT';
  };
  targetId?: number; // ID de l'entité concernée
  targetType?: 'RESERVATION' | 'WORKSHOP' | 'PARENT' | 'CHILD';
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export class AuditLogger {
  private static instance: AuditLogger;
  
  private constructor() {}
  
  static getInstance(): AuditLogger {
    if (!AuditLogger.instance) {
      AuditLogger.instance = new AuditLogger();
    }
    return AuditLogger.instance;
  }
  
  /**
   * Logger une action d'audit
   */
  async log(data: AuditLogData): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          action: data.action,
          performedById: data.performedBy.id,
          performedByEmail: data.performedBy.email,
          performedByType: data.performedBy.type,
          targetId: data.targetId,
          targetType: data.targetType,
          details: data.details || {},
          ipAddress: data.ipAddress || 'N/A',
          userAgent: data.userAgent || 'N/A',
          timestamp: new Date(),
        },
      });
      
      // Log en console pour le développement
      if (process.env.NODE_ENV === 'development') {
        console.log(`📝 AUDIT LOG: ${data.action} by ${data.performedBy.email}`, data.details || '');
      }
    } catch (error) {
      console.error('Erreur lors du logging audit:', error);
      // Ne pas propager l'erreur pour ne pas casser le flux principal
    }
  }
  
  /**
   * Logger la suppression d'une réservation
   */
  async logReservationDeletion(
    reservationId: number,
    performedBy: { id: number; email: string; type: 'ADMIN' | 'PARENT' },
    deletedReservation: any,
    promotedWaitlist?: any,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.log({
      action: AuditAction.RESERVATION_DELETED,
      performedBy,
      targetId: reservationId,
      targetType: 'RESERVATION',
      details: {
        reservationDetails: {
          id: deletedReservation.id,
          childName: `${deletedReservation.child?.firstName} ${deletedReservation.child?.lastName}`,
          workshopName: deletedReservation.workshop?.name,
          workshopDate: deletedReservation.workshop?.startTime,
          status: deletedReservation.status,
        },
        promotedFromWaitlist: promotedWaitlist ? {
          id: promotedWaitlist.id,
          childName: `${promotedWaitlist.child?.firstName} ${promotedWaitlist.child?.lastName}`,
          parentEmail: promotedWaitlist.child?.parent?.email,
        } : null,
        deletionTimestamp: new Date().toISOString(),
      },
      ipAddress,
      userAgent,
    });
  }
  
  /**
   * Récupérer les logs d'audit
   */
  async getLogs(filters?: {
    action?: AuditAction;
    performedByEmail?: string;
    targetType?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }) {
    const where: any = {};
    
    if (filters?.action) where.action = filters.action;
    if (filters?.performedByEmail) where.performedByEmail = { contains: filters.performedByEmail };
    if (filters?.targetType) where.targetType = filters.targetType;
    
    if (filters?.startDate || filters?.endDate) {
      where.timestamp = {};
      if (filters.startDate) where.timestamp.gte = filters.startDate;
      if (filters.endDate) where.timestamp.lte = filters.endDate;
    }
    
    return await prisma.auditLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: filters?.limit || 100,
    });
  }
  
  /**
   * Exporter les logs en CSV
   */
  async exportLogsToCSV(filters?: any): Promise<string> {
    const logs = await this.getLogs(filters);
    
    const headers = ['Timestamp', 'Action', 'Performed By', 'User Type', 'Target ID', 'Target Type', 'IP Address', 'Details'];
    const rows = logs.map(log => [
      log.timestamp.toISOString(),
      log.action,
      log.performedByEmail,
      log.performedByType,
      log.targetId || '',
      log.targetType || '',
      log.ipAddress,
      JSON.stringify(log.details),
    ]);
    
    return [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
  }
}

// Export singleton
export const auditLogger = AuditLogger.getInstance();