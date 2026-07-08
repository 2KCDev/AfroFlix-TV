const Joi = require('joi');

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d\s]).{8,128}$/;
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const STATUS_VALUES = ['published', 'draft', 'archived'];
const ARTICLE_CATEGORIES = ['Actualités', 'Classements', 'Analyses', 'Conseils'];

const trimString = (value) => (typeof value === 'string' ? value.trim() : value);

const cleanText = (value = '') => String(value).trim();

const normalizeEmail = (value = '') => cleanText(value).toLowerCase();

const isValidEmail = (value) => EMAIL_PATTERN.test(normalizeEmail(value));

const isStrongPassword = (value) => PASSWORD_PATTERN.test(String(value || ''));

const passwordPolicyMessage = 'Le mot de passe doit contenir au moins 8 caractères, une lettre, un chiffre et un caractère spécial.';

const validatePayload = (schema, payload) => {
  const { value, error } = schema.validate(payload, {
    abortEarly: false,
    allowUnknown: false,
    convert: true,
    stripUnknown: true,
  });

  if (!error) return { value };

  return {
    error: error.details.map((detail) => detail.message).join(' '),
  };
};

const parsePositiveInt = (value, fallback, { min = 1, max = 100 } = {}) => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed)) return fallback;
  return Math.min(Math.max(parsed, min), max);
};

const isHttpUrl = (value) => {
  if (!value) return true;
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol);
  } catch (err) {
    return false;
  }
};

const isPublicAssetUrl = (value) => {
  if (!value) return true;
  const clean = String(value).trim();
  return clean.startsWith('/uploads/') || isHttpUrl(clean);
};

const isOfficialYoutubeUrl = (value) => {
  if (!value) return true;
  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, '');
    return ['youtube.com', 'youtube-nocookie.com', 'youtu.be'].includes(host)
      || host.endsWith('.youtube.com')
      || host.endsWith('.youtube-nocookie.com');
  } catch (err) {
    return false;
  }
};

const schemas = {
  register: Joi.object({
    email: Joi.string().custom((value, helpers) => {
      const email = normalizeEmail(value);
      return EMAIL_PATTERN.test(email) ? email : helpers.error('string.email');
    }).required().messages({ 'string.email': 'Adresse email invalide.' }),
    password: Joi.string().pattern(PASSWORD_PATTERN).required().messages({
      'string.pattern.base': passwordPolicyMessage,
      'any.required': 'Mot de passe requis.',
    }),
    username: Joi.string().trim().min(3).max(100).pattern(/^[\p{L}\p{N}_ .'-]+$/u).optional()
      .messages({ 'string.pattern.base': 'Le nom utilisateur contient des caractères non autorisés.' }),
  }),

  login: Joi.object({
    email: Joi.string().custom((value, helpers) => {
      const email = normalizeEmail(value);
      return EMAIL_PATTERN.test(email) ? email : helpers.error('string.email');
    }).required().messages({ 'string.email': 'Adresse email invalide.' }),
    password: Joi.string().min(1).max(128).required().messages({ 'any.required': 'Mot de passe requis.' }),
  }),

  resetPassword: Joi.object({
    token: Joi.string().trim().min(32).max(256).required(),
    password: Joi.string().pattern(PASSWORD_PATTERN).required().messages({
      'string.pattern.base': passwordPolicyMessage,
    }),
  }),

  film: Joi.object({
    title: Joi.string().trim().min(2).max(255).required(),
    slug: Joi.string().trim().lowercase().max(30).pattern(SLUG_PATTERN).optional(),
    description: Joi.string().trim().min(300).max(10000).required(),
    poster_url: Joi.string().trim().max(500).allow('', null).custom((value, helpers) => (
      isPublicAssetUrl(value) ? trimString(value) : helpers.message('URL affiche invalide.')
    )),
    director: Joi.string().trim().min(2).max(255).required(),
    country: Joi.string().trim().max(100).allow('', null),
    year: Joi.number().integer().min(1888).max(new Date().getFullYear() + 5).allow(null),
    duration: Joi.number().integer().min(1).max(600).allow(null),
    youtube_embed_url: Joi.string().trim().max(500).allow('', null).custom((value, helpers) => (
      isOfficialYoutubeUrl(value) ? trimString(value) : helpers.message('Seules les URL YouTube officielles sont acceptées.')
    )),
    genres: Joi.array().items(Joi.string().trim().max(100)).default([]),
    actors: Joi.array().items(Joi.number().integer().positive()).default([]),
  }),

  filmUpdate: Joi.object({
    title: Joi.string().trim().min(2).max(255),
    slug: Joi.string().trim().lowercase().max(30).pattern(SLUG_PATTERN),
    description: Joi.string().trim().min(300).max(10000),
    poster_url: Joi.string().trim().max(500).allow('', null).custom((value, helpers) => (
      isPublicAssetUrl(value) ? trimString(value) : helpers.message('URL affiche invalide.')
    )),
    director: Joi.string().trim().min(2).max(255),
    country: Joi.string().trim().max(100).allow('', null),
    year: Joi.number().integer().min(1888).max(new Date().getFullYear() + 5).allow(null),
    duration: Joi.number().integer().min(1).max(600).allow(null),
    youtube_embed_url: Joi.string().trim().max(500).allow('', null).custom((value, helpers) => (
      isOfficialYoutubeUrl(value) ? trimString(value) : helpers.message('Seules les URL YouTube officielles sont acceptées.')
    )),
    status: Joi.string().valid(...STATUS_VALUES),
    genres: Joi.array().items(Joi.string().trim().max(100)),
    actors: Joi.array().items(Joi.number().integer().positive()),
  }).min(1),

  actor: Joi.object({
    name: Joi.string().trim().min(2).max(255).required(),
    biography: Joi.string().trim().min(150).max(10000).allow('', null),
    birth_date: Joi.date().iso().max('now').allow('', null),
    photo_url: Joi.string().trim().max(500).allow('', null).custom((value, helpers) => (
      isPublicAssetUrl(value) ? trimString(value) : helpers.message('URL photo invalide.')
    )),
  }),

  actorUpdate: Joi.object({
    name: Joi.string().trim().min(2).max(255),
    biography: Joi.string().trim().min(150).max(10000).allow('', null),
    birth_date: Joi.date().iso().max('now').allow('', null),
    photo_url: Joi.string().trim().max(500).allow('', null).custom((value, helpers) => (
      isPublicAssetUrl(value) ? trimString(value) : helpers.message('URL photo invalide.')
    )),
  }).min(1),

  article: Joi.object({
    title: Joi.string().trim().min(5).max(255).required(),
    content: Joi.string().trim().min(600).max(50000).required(),
    category: Joi.string().valid(...ARTICLE_CATEGORIES).required(),
    featured_image: Joi.string().trim().max(500).allow('', null).custom((value, helpers) => (
      isPublicAssetUrl(value) ? trimString(value) : helpers.message('Image article invalide.')
    )),
    author: Joi.string().trim().max(255).allow('', null),
  }),

  articleUpdate: Joi.object({
    title: Joi.string().trim().min(5).max(255),
    content: Joi.string().trim().min(600).max(50000),
    category: Joi.string().valid(...ARTICLE_CATEGORIES),
    featured_image: Joi.string().trim().max(500).allow('', null).custom((value, helpers) => (
      isPublicAssetUrl(value) ? trimString(value) : helpers.message('Image article invalide.')
    )),
    author: Joi.string().trim().max(255).allow('', null),
    status: Joi.string().valid(...STATUS_VALUES),
  }).min(1),
};

module.exports = {
  ARTICLE_CATEGORIES,
  EMAIL_PATTERN,
  PASSWORD_PATTERN,
  STATUS_VALUES,
  cleanText,
  isStrongPassword,
  isValidEmail,
  normalizeEmail,
  parsePositiveInt,
  passwordPolicyMessage,
  schemas,
  validatePayload,
};
