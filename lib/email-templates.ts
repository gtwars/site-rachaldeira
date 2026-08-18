function formatDateBR(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        timeZone: 'America/Sao_Paulo',
    });
}

function formatTimeBR(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'America/Sao_Paulo',
    });
}

export function attendanceEmailTemplate(
    memberName: string,
    racha: { date: string; location: string },
    siteUrl: string
): string {
    const firstName = memberName.split(' ')[0];
    const dateFormatted = formatDateBR(racha.date);
    const timeFormatted = formatTimeBR(racha.date);
    const confirmUrl = `${siteUrl}/rachas/proximo`;

    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirme sua presença - Rachaldeira</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="580" cellpadding="0" cellspacing="0" style="max-width:580px;width:100%;background-color:#0f172a;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.3);">

          <!-- Header -->
          <tr>
            <td style="background-color:#0f172a;padding:28px 32px;text-align:center;border-bottom:1px solid #1e293b;">
              <img src="${siteUrl}/logo-new.png" alt="Rachaldeira" width="80" height="80" style="display:block;margin:0 auto;border-radius:12px;object-fit:contain;" />
              <p style="color:#475569;font-size:12px;margin:12px 0 0;text-transform:uppercase;letter-spacing:1.5px;">Confirmação de Presença</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <p style="color:#94a3b8;margin:0 0 4px;font-size:14px;">Olá,</p>
              <h2 style="color:#ffffff;margin:0 0 20px;font-size:20px;font-weight:bold;">${firstName}! 👋</h2>

              <p style="color:#cbd5e1;font-size:15px;line-height:24px;margin:0 0 24px;">
                O racha desta semana está confirmado. Precisamos saber se você vai comparecer!
              </p>

              <!-- Racha Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#1e293b;border-radius:8px;margin-bottom:28px;border-left:4px solid #af1c15;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:1.2px;margin:0 0 6px;font-weight:bold;">Próximo Racha</p>
                    <p style="color:#ffffff;font-size:17px;font-weight:bold;margin:0 0 14px;text-transform:capitalize;">${dateFormatted}</p>
                    <table cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td style="width:50%;vertical-align:top;">
                          <p style="color:#64748b;font-size:11px;margin:0 0 3px;text-transform:uppercase;letter-spacing:0.8px;">Horário</p>
                          <p style="color:#e2e8f0;font-size:14px;font-weight:600;margin:0;">🕐 ${timeFormatted}</p>
                        </td>
                        <td style="width:50%;vertical-align:top;">
                          <p style="color:#64748b;font-size:11px;margin:0 0 3px;text-transform:uppercase;letter-spacing:0.8px;">Local</p>
                          <p style="color:#e2e8f0;font-size:14px;font-weight:600;margin:0;">📍 ${racha.location}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding-bottom:16px;">
                    <a href="${confirmUrl}"
                       style="display:inline-block;background-color:#af1c15;color:#ffffff;text-decoration:none;padding:14px 44px;border-radius:8px;font-size:16px;font-weight:bold;">
                      ✅ Confirmar Presença
                    </a>
                  </td>
                </tr>
              </table>

              <p style="color:#475569;font-size:12px;text-align:center;margin:0;">
                Acesse também: <a href="${confirmUrl}" style="color:#af1c15;text-decoration:none;">${confirmUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#0a1020;padding:18px 32px;border-top:1px solid #1e293b;">
              <p style="color:#475569;font-size:11px;text-align:center;margin:0;line-height:18px;">
                Você recebe este email por ser membro da Rachaldeira.<br>
                Confirme sua presença com pelo menos <strong style="color:#64748b;">24h de antecedência</strong>.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
