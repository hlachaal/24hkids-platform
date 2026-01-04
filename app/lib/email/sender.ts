import { getReservationDeletedEmail, getWaitlistPromotedEmail } from './templates';

// Configuration simple pour commencer (Resend, SendGrid, ou NodeMailer)
export interface EmailConfig {
  provider: 'resend' | 'sendgrid' | 'nodemailer';
  apiKey?: string;
  fromEmail: string;
  fromName: string;
}

// Configuration depuis les variables d'environnement
const config: EmailConfig = {
  provider: (process.env.EMAIL_PROVIDER as any) || 'nodemailer',
  apiKey: process.env.EMAIL_API_KEY,
  fromEmail: process.env.EMAIL_FROM || 'noreply@24hkids.fr',
  fromName: process.env.EMAIL_FROM_NAME || '24hKids Platform',
};

/**
 * Service d'envoi d'emails (version simplifiée pour développement)
 */
export class EmailService {
  private static instance: EmailService;
  
  private constructor() {}
  
  static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }
  
  /**
   * Envoyer un email de suppression de réservation
   */
  async sendReservationDeletedEmail(
    toEmail: string,
    parentName: string,
    childName: string,
    workshopName: string,
    workshopDate: string,
    workshopTime: string,
    reason?: string
  ): Promise<boolean> {
    try {
      const { subject, html, text } = getReservationDeletedEmail(
        parentName,
        childName,
        workshopName,
        workshopDate,
        workshopTime,
        reason
      );
      
      return await this.sendEmail({
        to: toEmail,
        subject,
        html,
        text,
      });
    } catch (error) {
      console.error('Erreur envoi email suppression réservation:', error);
      return false;
    }
  }
  
  /**
   * Envoyer un email de promotion depuis la liste d'attente
   */
  async sendWaitlistPromotedEmail(
    toEmail: string,
    parentName: string,
    childName: string,
    workshopName: string,
    workshopDate: string,
    workshopTime: string
  ): Promise<boolean> {
    try {
      const { subject, html, text } = getWaitlistPromotedEmail(
        parentName,
        childName,
        workshopName,
        workshopDate,
        workshopTime
      );
      
      return await this.sendEmail({
        to: toEmail,
        subject,
        html,
        text,
      });
    } catch (error) {
      console.error('Erreur envoi email promotion liste attente:', error);
      return false;
    }
  }
  
  /**
   * Méthode générique d'envoi d'email
   * (À adapter selon votre provider : Resend, SendGrid, NodeMailer, etc.)
   */
  private async sendEmail(email: {
    to: string;
    subject: string;
    html: string;
    text: string;
  }): Promise<boolean> {
    // Pour le développement, on log juste l'email
    if (process.env.NODE_ENV === 'development') {
      console.log('📧 Email à envoyer:', {
        to: email.to,
        subject: email.subject,
        from: `${config.fromName} <${config.fromEmail}>`,
      });
      console.log('📝 Contenu HTML (extrait):', email.html.substring(0, 200) + '...');
      return true;
    }
    
    // Implémentation de production selon le provider
    switch (config.provider) {
      case 'resend':
        return await this.sendViaResend(email);
      case 'sendgrid':
        return await this.sendViaSendGrid(email);
      case 'nodemailer':
      default:
        return await this.sendViaNodeMailer(email);
    }
  }
  
  private async sendViaResend(email: any): Promise<boolean> {
    // Implémentation Resend.com
    return true;
  }
  
  private async sendViaSendGrid(email: any): Promise<boolean> {
    // Implémentation SendGrid
    return true;
  }
  
  private async sendViaNodeMailer(email: any): Promise<boolean> {
    // Implémentation NodeMailer (SMTP)
    return true;
  }
}

// Export singleton
export const emailService = EmailService.getInstance();