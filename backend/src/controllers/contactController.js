const pool = require('../db/pool');
const { sendContactConfirmation, sendContactNotification } = require('../services/emailService');
const { cleanText, isValidEmail, normalizeEmail, parsePositiveInt } = require('../utils/validation');

const createContactMessage = async (req, res) => {
  try {
    const name = cleanText(req.body.name);
    const email = normalizeEmail(req.body.email);
    const subject = cleanText(req.body.subject || 'Message depuis le formulaire Contact');
    const message = cleanText(req.body.message);

    if (!name || name.length < 2) {
      return res.status(400).json({ error: 'Le nom doit contenir au moins 2 caractères.' });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Adresse email invalide.' });
    }

    if (!message || message.length < 20) {
      return res.status(400).json({ error: 'Le message doit contenir au moins 20 caractères.' });
    }

    if (message.length > 3000) {
      return res.status(400).json({ error: 'Le message ne peut pas dépasser 3000 caractères.' });
    }

    const result = await pool.query(
      `INSERT INTO contact_messages (name, email, subject, message, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, created_at`,
      [
        name,
        email,
        subject.slice(0, 255),
        message,
        req.ip,
        req.get('user-agent') || null,
      ]
    );

    const emailResults = await Promise.allSettled([
      sendContactNotification({ name, email, subject: subject.slice(0, 255), message }),
      sendContactConfirmation({ to: email, name, subject: subject.slice(0, 255) }),
    ]);

    const [notificationResult, confirmationResult] = emailResults;
    if (notificationResult.status === 'rejected') {
      console.error('[email] contact notification failed:', notificationResult.reason?.message || notificationResult.reason);
    }
    if (confirmationResult.status === 'rejected') {
      console.error('[email] contact confirmation failed:', confirmationResult.reason?.message || confirmationResult.reason);
    }

    res.status(201).json({
      message: 'Votre message a bien été reçu.',
      contact: result.rows[0],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Impossible d’enregistrer le message pour le moment.' });
  }
};

const getContactMessages = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const currentPage = parsePositiveInt(page, 1, { min: 1, max: 100000 });
    const pageSize = parsePositiveInt(limit, 20, { min: 1, max: 100 });
    const offset = (currentPage - 1) * pageSize;
    const params = [];
    let where = '';

    if (status) {
      params.push(status);
      where = `WHERE status = $${params.length}`;
    }

    const countResult = await pool.query(`SELECT COUNT(*) FROM contact_messages ${where}`, params);
    params.push(pageSize, offset);

    const result = await pool.query(
      `SELECT id, name, email, subject, message, status, created_at
       FROM contact_messages
       ${where}
       ORDER BY created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    res.json({
      messages: result.rows,
      pagination: {
        total: Number(countResult.rows[0].count),
        page: currentPage,
        limit: pageSize,
        pages: Math.ceil(Number(countResult.rows[0].count) / pageSize),
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  createContactMessage,
  getContactMessages,
};
