/**
 * Template d'email pour notification de suppression par admin
 */
export function getReservationDeletedEmail(
  parentName: string,
  childName: string,
  workshopName: string,
  workshopDate: string,
  workshopTime: string,
  reason?: string
) {
  const subject = `Annulation de votre réservation à 24hKids`;
  
  const html = `
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

  const text = `
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

  return { subject, html, text };
}