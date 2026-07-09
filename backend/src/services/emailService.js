const RESEND_ENDPOINT = 'https://api.resend.com/emails';
const PLACEHOLDER_RESEND_KEY = /^re_x+$/i;

const EMAILS = {
  noreply: process.env.EMAIL_NOREPLY || 'noreply@afroflix-tv.com',
  info: process.env.EMAIL_INFO || 'info@afroflix-tv.com',
  admin: process.env.EMAIL_ADMIN || 'admin@afroflix-tv.com',
  support: process.env.EMAIL_SUPPORT || 'support@afroflix-tv.com',
  contact: process.env.EMAIL_CONTACT || 'contact@afroflix-tv.com',
};

const brandName = process.env.EMAIL_BRAND_NAME || 'AFROFLIX.TV';

const parseEmailList = (value, fallback = []) => {
  const rawItems = value ? String(value).split(',') : fallback;
  return [...new Set(
    rawItems
      .map((item) => String(item || '').trim())
      .filter(Boolean)
  )];
};

const CONTACT_RECIPIENTS = parseEmailList(process.env.EMAIL_CONTACT_RECIPIENTS, [
  EMAILS.contact,
  EMAILS.support,
  EMAILS.admin,
  EMAILS.info,
]);

const INTERNAL_RECIPIENTS = parseEmailList(process.env.EMAIL_INTERNAL_RECIPIENTS, CONTACT_RECIPIENTS);

const getFrontendUrl = () => (
  process.env.FRONTEND_URL || process.env.APP_URL || 'https://afroflix-tv.com'
).replace(/\/$/, '');

const escapeHtml = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const renderLayout = ({ title, intro, children }) => `
<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="margin:0;background:#f6f7f9;color:#111827;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f6f7f9;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#ffffff;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
            <tr>
              <td style="padding:24px 28px;border-bottom:4px solid #dc2626;">
                <div style="font-size:22px;font-weight:700;color:#dc2626;">${brandName}</div>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;">
                <h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;color:#111827;">${escapeHtml(title)}</h1>
                <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#374151;">${escapeHtml(intro)}</p>
                ${children}
              </td>
            </tr>
            <tr>
              <td style="padding:18px 28px;background:#f9fafb;color:#6b7280;font-size:12px;line-height:1.5;">
                Email automatique de ${brandName}. Pour toute question, contactez ${EMAILS.support}.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

const normalizeRecipients = (value) => {
  const items = Array.isArray(value) ? value : [value];
  return [...new Set(items
    .map((item) => String(item || '').trim())
    .filter(Boolean))];
};

const hasUsableResendKey = () => {
  const key = getResendApiKey();
  return key.startsWith('re_') && !PLACEHOLDER_RESEND_KEY.test(key);
};

const getResendApiKey = () => String(process.env.RESEND_API_KEY || process.env.RESEND_API_KEY_BACKEND || '').trim();

const getEmailDeliveryMode = () => {
  const configured = String(process.env.EMAIL_DELIVERY_MODE || '').trim().toLowerCase();
  if (['resend', 'log', 'disabled'].includes(configured)) return configured;
  return hasUsableResendKey() ? 'resend' : 'log';
};

const sendEmail = async ({ from, to, subject, html, text, replyTo, cc, bcc }) => {
  const recipients = normalizeRecipients(to);
  if (!recipients.length) {
    throw new Error('Email recipient missing');
  }

  const deliveryMode = getEmailDeliveryMode();

  if (deliveryMode === 'disabled') {
    console.warn('[email] delivery disabled:', { subject, to: recipients });
    return { skipped: true, mode: deliveryMode };
  }

  if (deliveryMode === 'log') {
    console.info('[email] delivery log mode:', {
      from,
      to: recipients,
      subject,
      replyTo: replyTo || null,
      text,
    });
    return { skipped: true, mode: deliveryMode };
  }

  const resendApiKey = getResendApiKey();
  if (!hasUsableResendKey()) {
    throw new Error('RESEND_API_KEY is missing or invalid while EMAIL_DELIVERY_MODE=resend.');
  }

  const payload = {
    from,
    to: recipients,
    subject,
    html,
    text,
  };

  if (replyTo) payload.reply_to = replyTo;
  if (cc) payload.cc = normalizeRecipients(cc);
  if (bcc) payload.bcc = normalizeRecipients(bcc);

  const response = await fetch(RESEND_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || `Resend email error ${response.status}`);
  }

  console.info('[email] sent:', {
    subject,
    to: recipients,
    cc: payload.cc || [],
    bcc: payload.bcc || [],
    id: data.id || data.data?.id || null,
  });

  return data;
};

const sendPasswordResetEmail = ({ to, username, resetUrl }) => {
  const html = renderLayout({
    title: 'Réinitialisation de votre mot de passe',
    intro: `Bonjour ${username || ''}, nous avons reçu une demande de réinitialisation pour votre compte ${brandName}.`,
    children: `
      <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#374151;">Ce lien expire dans 1 heure. Si vous n'êtes pas à l'origine de cette demande, ignorez simplement cet email.</p>
      <p style="margin:28px 0;">
        <a href="${escapeHtml(resetUrl)}" style="display:inline-block;background:#dc2626;color:#ffffff;text-decoration:none;font-weight:700;padding:12px 18px;border-radius:6px;">Créer un nouveau mot de passe</a>
      </p>
      <p style="margin:0;font-size:12px;line-height:1.5;color:#6b7280;">Lien direct: ${escapeHtml(resetUrl)}</p>
    `,
  });

  return sendEmail({
    from: `${brandName} <${EMAILS.noreply}>`,
    to,
    subject: `${brandName} - Réinitialisation de mot de passe`,
    html,
    text: `Réinitialisez votre mot de passe: ${resetUrl}\nCe lien expire dans 1 heure.`,
  });
};

const sendWelcomeEmail = ({ to, username }) => {
  const html = renderLayout({
    title: 'Bienvenue sur AFROFLIX.TV',
    intro: `Bonjour ${username || ''}, votre compte a bien été créé.`,
    children: '<p style="margin:0;font-size:15px;line-height:1.6;color:#374151;">Vous pouvez maintenant profiter de vos favoris, notes et commentaires sur la plateforme.</p>',
  });

  return sendEmail({
    from: `${brandName} <${EMAILS.noreply}>`,
    to,
    subject: `Bienvenue sur ${brandName}`,
    html,
    text: `Bienvenue sur ${brandName}. Votre compte a bien été créé.`,
  });
};

const sendStaffAccountEmail = ({ to, username, role }) => {
  const html = renderLayout({
    title: 'Votre accès équipe AFROFLIX.TV',
    intro: `Bonjour ${username || ''}, un compte ${role} a été créé pour vous par l'administration.`,
    children: `<p style="margin:0;font-size:15px;line-height:1.6;color:#374151;">Connectez-vous avec le mot de passe transmis par l'administrateur. La récupération automatique de mot de passe reste désactivée pour les comptes éditeur et modérateur.</p>`,
  });

  return sendEmail({
    from: `${brandName} Admin <${EMAILS.admin}>`,
    to,
    subject: `${brandName} - Accès équipe`,
    html,
    text: `Un compte ${role} ${brandName} a été créé pour vous. Contactez l'administrateur pour le mot de passe.`,
  });
};

const sendContactNotification = ({ name, email, subject, message }) => {
  const safeSubject = subject || 'Message depuis le formulaire Contact';
  const recipients = normalizeRecipients(CONTACT_RECIPIENTS);
  const html = renderLayout({
    title: 'Nouveau message de contact',
    intro: `${name} a envoyé un message via le site.`,
    children: `
      <p style="margin:0 0 8px;font-size:14px;color:#374151;"><strong>Email:</strong> ${escapeHtml(email)}</p>
      <p style="margin:0 0 18px;font-size:14px;color:#374151;"><strong>Sujet:</strong> ${escapeHtml(safeSubject)}</p>
      <div style="white-space:pre-wrap;border:1px solid #e5e7eb;background:#f9fafb;border-radius:6px;padding:14px;font-size:14px;line-height:1.6;color:#111827;">${escapeHtml(message)}</div>
    `,
  });

  return sendEmail({
    from: `${brandName} Contact <${EMAILS.contact}>`,
    to: recipients,
    replyTo: email,
    subject: `[Contact ${brandName}] ${safeSubject}`,
    html,
    text: `Nouveau message de ${name} <${email}>\nDestinataires internes: ${recipients.join(', ')}\nSujet: ${safeSubject}\n\n${message}`,
  });
};

const sendContactConfirmation = ({ to, name, subject }) => {
  const safeSubject = subject || 'Votre message';
  const html = renderLayout({
    title: 'Votre message a bien été reçu',
    intro: `Bonjour ${name || ''}, merci d'avoir contacté ${brandName}.`,
    children: `
      <p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#374151;">Notre équipe a reçu votre demande: <strong>${escapeHtml(safeSubject)}</strong>.</p>
      <p style="margin:0;font-size:15px;line-height:1.6;color:#374151;">Pour une urgence éditoriale, vous pouvez aussi écrire à ${EMAILS.support}.</p>
    `,
  });

  return sendEmail({
    from: `${brandName} Support <${EMAILS.support}>`,
    to,
    replyTo: EMAILS.support,
    subject: `${brandName} - Message reçu`,
    html,
    text: `Bonjour ${name || ''}, votre message "${safeSubject}" a bien été reçu. Support: ${EMAILS.support}`,
  });
};

const sendNewsletterConfirmation = ({ to, unsubscribeToken }) => {
  const unsubscribeUrl = `${getFrontendUrl()}/api/newsletter/unsubscribe/${encodeURIComponent(unsubscribeToken)}`;
  const html = renderLayout({
    title: 'Inscription confirmée',
    intro: `Bonjour, votre inscription aux actualités ${brandName} est confirmée.`,
    children: `
      <p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#374151;">Vous recevrez les nouveaux articles, critiques et annonces importantes publiés sur la plateforme.</p>
      <p style="margin:0;font-size:12px;line-height:1.5;color:#6b7280;">Désinscription: ${escapeHtml(unsubscribeUrl)}</p>
    `,
  });

  return sendEmail({
    from: `${brandName} <${EMAILS.noreply}>`,
    to,
    subject: `${brandName} - Inscription aux actualités`,
    html,
    text: `Votre inscription aux actualités ${brandName} est confirmée.\nDésinscription: ${unsubscribeUrl}`,
  });
};

const sendNewsletterInternalNotification = ({ email }) => sendEmail({
  from: `${brandName} Newsletter <${EMAILS.noreply}>`,
  to: INTERNAL_RECIPIENTS,
  subject: `[Newsletter ${brandName}] Nouvel abonné`,
  html: renderLayout({
    title: 'Nouvelle inscription newsletter',
    intro: `${email} vient de s'inscrire aux actualités ${brandName}.`,
    children: `<p style="margin:0;font-size:15px;line-height:1.6;color:#374151;">Cette adresse est enregistrée dans la base des abonnés newsletter.</p>`,
  }),
  text: `Nouvelle inscription newsletter: ${email}`,
});

const sendArticleNotificationEmail = ({ to, title, excerpt, url, unsubscribeToken }) => {
  const unsubscribeUrl = `${getFrontendUrl()}/api/newsletter/unsubscribe/${encodeURIComponent(unsubscribeToken)}`;
  const html = renderLayout({
    title,
    intro: `Nouvelle actualité publiée sur ${brandName}.`,
    children: `
      <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#374151;">${escapeHtml(excerpt || 'Un nouvel article est disponible sur AFROFLIX.TV.')}</p>
      <p style="margin:28px 0;">
        <a href="${escapeHtml(url)}" style="display:inline-block;background:#dc2626;color:#ffffff;text-decoration:none;font-weight:700;padding:12px 18px;border-radius:6px;">Lire l'article</a>
      </p>
      <p style="margin:0;font-size:12px;line-height:1.5;color:#6b7280;">Désinscription: ${escapeHtml(unsubscribeUrl)}</p>
    `,
  });

  return sendEmail({
    from: `${brandName} Actualités <${EMAILS.info}>`,
    to,
    subject: `${brandName} - ${title}`,
    html,
    text: `${title}\n${excerpt || ''}\nLire: ${url}\nDésinscription: ${unsubscribeUrl}`,
  });
};

module.exports = {
  CONTACT_RECIPIENTS,
  EMAILS,
  INTERNAL_RECIPIENTS,
  sendArticleNotificationEmail,
  sendContactConfirmation,
  sendContactNotification,
  sendNewsletterConfirmation,
  sendNewsletterInternalNotification,
  sendPasswordResetEmail,
  sendStaffAccountEmail,
  sendWelcomeEmail,
};
