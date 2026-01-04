// app/lib/email/sender-nodemailer.ts

import nodemailer from 'nodemailer';

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  fromEmail: string;
  fromName: string;
}

// Configuration pour MailDev
const config: EmailConfig = {
  host: 'localhost',
  port: 1025,
  secure: false,
  fromEmail: 'noreply@24hkids.local',
  fromName: '24hKids Platform',
};

export class EmailService {
  private transporter: nodemailer.Transporter;
  private static instance: EmailService;

  private constructor() {
    this.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      // Pas besoin d'authentification pour MailDev
    });
  }

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
      const html = this.getReservationDeletedEmailHTML(
        parentName,
        childName,
        workshopName,
        workshopDate,
        workshopTime,
        reason
      );

      const text = this.getReservationDeletedEmailText(
        parentName,
        childName,
        workshopName,
        workshopDate,
        workshopTime,
        reason
      );

      const info = await this.transporter.sendMail({
        from: `"${config.fromName}" <${config.fromEmail}>`,
        to: toEmail,
        subject: `Annulation de votre réservation à 24hKids`,
        html,
        text,
      });

      console.log('📧 Email envoyé via MailDev:', info.messageId);
      console.log('   Preview: http://localhost:1080');
      return true;
    } catch (error) {
      console.error('Erreur envoi email:', error);
      return false;
    }
  }

  /**
   * Envoyer un email de promotion de liste d'attente
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
      const html = this.getWaitlistPromotedEmailHTML(
        parentName,
        childName,
        workshopName,
        workshopDate,
        workshopTime
      );

      const text = this.getWaitlistPromotedEmailText(
        parentName,
        childName,
        workshopName,
        workshopDate,
        workshopTime
      );

      const info = await this.transporter.sendMail({
        from: `"${config.fromName}" <${config.fromEmail}>`,
        to: toEmail,
        subject: `🎉 Bonne nouvelle ! Votre réservation 24hKids est confirmée`,
        html,
        text,
      });

      console.log('📧 Email de promotion envoyé via MailDev:', info.messageId);
      console.log('   Preview: http://localhost:1080');
      return true;
    } catch (error) {
      console.error('Erreur envoi email promotion:', error);
      return false;
    }
  }

  /**
   * Envoyer un email générique
   */
  async sendEmail(options: {
    to: string;
    subject: string;
    html?: string;
    text?: string;
  }): Promise<boolean> {
    try {
      const info = await this.transporter.sendMail({
        from: `"${config.fromName}" <${config.fromEmail}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });

      console.log('📧 Email générique envoyé via MailDev:', info.messageId);
      return true;
    } catch (error) {
      console.error('Erreur envoi email générique:', error);
      return false;
    }
  }

  // =====================================================
  // Méthodes privées pour les templates HTML/Text
  // =====================================================

  private getReservationDeletedEmailHTML(
    parentName: string,
    childName: string,
    workshopName: string,
    workshopDate: string,
    workshopTime: string,
    reason?: string
  ): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4f46e5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .info-box { background-color: white; border-left: 4px solid #4f46e5; padding: 15px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>24hKids & Co</h1>
            <p>Plateforme d'ateliers éducatifs</p>
        </div>
        
        <div class="content">
            <h2>Cher(e) ${parentName},</h2>
            
            <p>Nous regrettons de vous informer que votre réservation pour l'atelier de votre enfant a été annulée par notre équipe administrative.</p>
            
            <div class="info-box">
                <h3>📋 Détails de la réservation annulée :</h3>
                <p><strong>👶 Enfant :</strong> ${childName}</p>
                <p><strong>🎨 Atelier :</strong> ${workshopName}</p>
                <p><strong>📅 Date :</strong> ${workshopDate}</p>
                <p><strong>⏰ Horaire :</strong> ${workshopTime}</p>
                ${reason ? `<p><strong>📝 Raison :</strong> ${reason}</p>` : ''}
            </div>
            
            <p>Nous comprenons que cette annulation peut être décevante et nous nous excusons pour tout désagrément occasionné.</p>
            
            <p>Nous espérons vous accueillir lors d'un prochain événement 24hKids.</p>
            
            <p>Avec nos sincères regrets,</p>
            <p><strong>L'équipe 24hKids</strong></p>
            
            <div class="footer">
                <p>Cet email a été envoyé automatiquement. Merci de ne pas y répondre.</p>
                <p>© ${new Date().getFullYear()} 24hKids & Co. Tous droits réservés.</p>
            </div>
        </div>
    </div>
</body>
</html>
    `;
  }

  private getReservationDeletedEmailText(
    parentName: string,
    childName: string,
    workshopName: string,
    workshopDate: string,
    workshopTime: string,
    reason?: string
  ): string {
    return `
Cher(e) ${parentName},

Nous regrettons de vous informer que votre réservation pour l'atelier de votre enfant a été annulée par notre équipe administrative.

DÉTAILS DE LA RÉSERVATION ANNULÉE :
- Enfant : ${childName}
- Atelier : ${workshopName}
- Date : ${workshopDate}
- Horaire : ${workshopTime}
${reason ? `- Raison : ${reason}\n` : ''}

Nous comprenons que cette annulation peut être décevante et nous nous excusons pour tout désagrément occasionné.

Nous espérons vous accueillir lors d'un prochain événement 24hKids.

Avec nos sincères regrets,
L'équipe 24hKids

---
Cet email a été envoyé automatiquement. Merci de ne pas y répondre.
© ${new Date().getFullYear()} 24hKids & Co.
    `;
  }

  private getWaitlistPromotedEmailHTML(
    parentName: string,
    childName: string,
    workshopName: string,
    workshopDate: string,
    workshopTime: string
  ): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #10b981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .info-box { background-color: white; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        .celebrate { text-align: center; font-size: 48px; margin: 20px 0; }
        .steps { background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 25px 0; }
        .steps h3 { color: #065f46; margin-top: 0; }
        .steps ul { padding-left: 20px; }
        .steps li { margin-bottom: 8px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>24hKids & Co</h1>
            <p>Plateforme d'ateliers éducatifs</p>
        </div>
        
        <div class="content">
            <div class="celebrate">🎉</div>
            <h2>Cher(e) ${parentName},</h2>
            
            <p>Nous avons une excellente nouvelle ! Une place s'est libérée et <strong>la réservation de ${childName} est maintenant confirmée</strong> !</p>
            
            <div class="info-box">
                <h3>📋 Détails de votre réservation confirmée :</h3>
                <p><strong>👶 Enfant :</strong> ${childName}</p>
                <p><strong>🎨 Atelier :</strong> ${workshopName}</p>
                <p><strong>📅 Date :</strong> ${workshopDate}</p>
                <p><strong>⏰ Horaire :</strong> ${workshopTime}</p>
                <p><strong>📝 Statut :</strong> <span style="color: #10b981; font-weight: bold;">CONFIRMÉ</span></p>
            </div>
            
            <p>Votre enfant était sur notre liste d'attente et une place s'est libérée. Nous sommes ravis de pouvoir l'accueillir !</p>
            
            <div class="steps">
                <h3>📋 Prochaines étapes :</h3>
                <ul>
                    <li><strong>⏰ Arrivée :</strong> Présentez-vous 10 minutes avant le début de l'atelier</li>
                    <li><strong>👕 Tenue :</strong> Prévoyez une tenue adaptée aux activités manuelles (qui peut être salie)</li>
                    <li><strong>💧 Hydratation :</strong> N'oubliez pas la bouteille d'eau</li>
                    <li><strong>🍎 Goûter :</strong> Apportez un petit goûter si besoin</li>
                    <li><strong>📱 Contact :</strong> En cas d'empêchement, prévenez-nous au plus vite</li>
                </ul>
            </div>
            
            <p><strong>📍 Lieu :</strong> Notre centre d'activités (adresse précisée dans votre confirmation initiale)</p>
            
            <p>Si vous avez des questions ou besoin d'informations supplémentaires, n'hésitez pas à nous contacter.</p>
            
            <p>Nous nous réjouissons d'accueillir ${childName} et lui souhaitons une excellente expérience !</p>
            
            <p>Cordialement,</p>
            <p><strong>L'équipe 24hKids</strong></p>
            
            <div class="footer">
                <p>Cet email a été envoyé automatiquement. Vous pouvez nous répondre pour toute question.</p>
                <p>© ${new Date().getFullYear()} 24hKids & Co. Tous droits réservés.</p>
            </div>
        </div>
    </div>
</body>
</html>
    `;
  }

  private getWaitlistPromotedEmailText(
    parentName: string,
    childName: string,
    workshopName: string,
    workshopDate: string,
    workshopTime: string
  ): string {
    return `
Cher(e) ${parentName},

🎉 EXCELLENTE NOUVELLE ! Votre réservation est confirmée 🎉

Une place s'est libérée et la réservation de ${childName} est maintenant confirmée !

DÉTAILS DE LA RÉSERVATION CONFIRMÉE :
- Enfant : ${childName}
- Atelier : ${workshopName}
- Date : ${workshopDate}
- Horaire : ${workshopTime}
- Statut : CONFIRMÉ

Votre enfant était sur notre liste d'attente et une place s'est libérée. Nous sommes ravis de pouvoir l'accueillir !

PROCHAINES ÉTAPES :
• ⏰ Arrivée : Présentez-vous 10 minutes avant le début de l'atelier
• 👕 Tenue : Prévoyez une tenue adaptée aux activités manuelles
• 💧 Hydratation : N'oubliez pas la bouteille d'eau
• 🍎 Goûter : Apportez un petit goûter si besoin
• 📱 Contact : En cas d'empêchement, prévenez-nous au plus vite

📍 Lieu : Notre centre d'activités (adresse précisée dans votre confirmation initiale)

Si vous avez des questions ou besoin d'informations supplémentaires, n'hésitez pas à nous contacter.

Nous nous réjouissons d'accueillir ${childName} et lui souhaitons une excellente expérience !

Cordialement,
L'équipe 24hKids

---
Cet email a été envoyé automatiquement. Vous pouvez nous répondre pour toute question.
© ${new Date().getFullYear()} 24hKids & Co.
    `;
  }

  /**
   * Template pour email d'inscription en liste d'attente
   * (Optionnel - pour usage futur)
   */
  private getWaitlistNotificationEmailHTML(
    parentName: string,
    childName: string,
    workshopName: string,
    workshopDate: string,
    workshopTime: string,
    position: number
  ): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f59e0b; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .info-box { background-color: white; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        .position { text-align: center; font-size: 36px; font-weight: bold; color: #f59e0b; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>24hKids & Co</h1>
            <p>Plateforme d'ateliers éducatifs</p>
        </div>
        
        <div class="content">
            <h2>Cher(e) ${parentName},</h2>
            
            <p>Votre inscription pour l'atelier "${workshopName}" a été enregistrée sur notre <strong>liste d'attente</strong>.</p>
            
            <div class="position">
                Position : #${position}
            </div>
            
            <div class="info-box">
                <h3>📋 Détails de votre inscription :</h3>
                <p><strong>👶 Enfant :</strong> ${childName}</p>
                <p><strong>🎨 Atelier :</strong> ${workshopName}</p>
                <p><strong>📅 Date :</strong> ${workshopDate}</p>
                <p><strong>⏰ Horaire :</strong> ${workshopTime}</p>
                <p><strong>📝 Statut :</strong> <span style="color: #f59e0b; font-weight: bold;">LISTE D'ATTENTE</span></p>
            </div>
            
            <p><strong>Comment ça fonctionne ?</strong></p>
            <ul>
                <li>Vous êtes positionné <strong>#${position}</strong> sur notre liste d'attente</li>
                <li>Si une place se libère, vous serez automatiquement promu et recevrez un email de confirmation</li>
                <li>La promotion suit l'ordre d'arrivée (premier inscrit, premier servi)</li>
                <li>Vous pouvez annuler votre inscription à tout moment depuis votre espace</li>
            </ul>
            
            <p>Nous vous tiendrons informé de toute évolution concernant votre position.</p>
            
            <p>Cordialement,</p>
            <p><strong>L'équipe 24hKids</strong></p>
            
            <div class="footer">
                <p>Cet email a été envoyé automatiquement. Merci de ne pas y répondre.</p>
                <p>© ${new Date().getFullYear()} 24hKids & Co. Tous droits réservés.</p>
            </div>
        </div>
    </div>
</body>
</html>
    `;
  }
}

export const emailService = EmailService.getInstance();