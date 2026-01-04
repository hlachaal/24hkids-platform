/**
 * Template d'email pour notification de promotion depuis la liste d'attente
 */
export function getWaitlistPromotedEmail(
  parentName: string,
  childName: string,
  workshopName: string,
  workshopDate: string,
  workshopTime: string
) {
  const subject = `🎉 Bonne nouvelle ! Votre réservation est confirmée pour 24hKids`;
  
  const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #10b981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .success-box { background-color: white; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 24hKids & Co</h1>
            <p>Votre place est confirmée !</p>
        </div>
        
        <div class="content">
            <h2>Cher(e) ${parentName},</h2>
            
            <p>Nous avons une excellente nouvelle pour vous ! Une place s'est libérée pour l'atelier auquel vous étiez en liste d'attente.</p>
            
            <div class="success-box">
                <h3>✅ Votre réservation est maintenant CONFIRMÉE :</h3>
                <p><strong>👶 Enfant :</strong> ${childName}</p>
                <p><strong>🎨 Atelier :</strong> ${workshopName}</p>
                <p><strong>📅 Date :</strong> ${workshopDate}</p>
                <p><strong>⏰ Horaire :</strong> ${workshopTime}</p>
            </div>
            
            <p><strong>Informations pratiques :</strong></p>
            <ul>
                <li>Présentez-vous 10 minutes avant le début de l'atelier</li>
                <li>Pensez à apporter [matériel spécifique si nécessaire]</li>
                <li>L'adresse exacte vous sera communiquée par email séparément</li>
            </ul>
            
            <p>Nous sommes ravis de pouvoir accueillir ${childName} lors de cet atelier !</p>
            
            <p>À très bientôt,</p>
            <p><strong>L'équipe 24hKids</strong></p>
            
            <div class="footer">
                <p>Cet email a été envoyé automatiquement. Pour toute question, contactez-nous à contact@24hkids.fr</p>
                <p>© ${new Date().getFullYear()} 24hKids & Co.</p>
            </div>
        </div>
    </div>
</body>
</html>
  `;

  return { subject, html, text: `... version texte ...` };
}