import React, { useState } from 'react';
import { FiSend } from 'react-icons/fi';
import { api } from '../../services/api';
import { useLocale } from '../../hooks/useLocale';

const initialState = {
  name: '',
  email: '',
  subject: '',
  message: '',
};

const ContactForm = () => {
  const { language } = useLocale();
  const c = language === 'en' ? { sent: 'Your message has been sent.', error: 'Unable to send the message.', name: 'Name', subject: 'Subject', message: 'Message', placeholder: 'Question, partnership, report…', characters: 'characters', sending: 'Sending…', send: 'Send message' } : { sent: 'Votre message a bien été envoyé.', error: 'Impossible d’envoyer le message.', name: 'Nom', subject: 'Sujet', message: 'Message', placeholder: 'Question, partenariat, signalement…', characters: 'caractères', sending: 'Envoi…', send: 'Envoyer le message' };
  const [form, setForm] = useState(initialState);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [submitting, setSubmitting] = useState(false);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    if (status.message) setStatus({ type: '', message: '' });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      const response = await api.contact(form);
      setStatus({ type: 'success', message: response.message || c.sent });
      setForm(initialState);
    } catch (error) {
      setStatus({ type: 'error', message: error.message || c.error });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div>
          <label htmlFor="contact-name" className="mb-2 block text-sm font-semibold text-gray-800">
            {c.name}
          </label>
          <input
            id="contact-name"
            type="text"
            value={form.name}
            onChange={(event) => updateField('name', event.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100"
            minLength={2}
            required
          />
        </div>
        <div>
          <label htmlFor="contact-email" className="mb-2 block text-sm font-semibold text-gray-800">
            Email
          </label>
          <input
            id="contact-email"
            type="email"
            value={form.email}
            onChange={(event) => updateField('email', event.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100"
            required
          />
        </div>
      </div>

      <div>
        <label htmlFor="contact-subject" className="mb-2 block text-sm font-semibold text-gray-800">
          {c.subject}
        </label>
        <input
          id="contact-subject"
          type="text"
          value={form.subject}
          onChange={(event) => updateField('subject', event.target.value)}
          className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100"
          placeholder={c.placeholder}
        />
      </div>

      <div>
        <label htmlFor="contact-message" className="mb-2 block text-sm font-semibold text-gray-800">
          {c.message}
        </label>
        <textarea
          id="contact-message"
          value={form.message}
          onChange={(event) => updateField('message', event.target.value)}
          className="min-h-40 w-full resize-y rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100"
          minLength={20}
          maxLength={3000}
          required
        />
        <p className="mt-2 text-xs text-gray-500">{form.message.length}/3000 {c.characters}</p>
      </div>

      {status.message && (
        <div
          className={`rounded-lg px-4 py-3 text-sm font-semibold ${
            status.type === 'success'
              ? 'border border-green-200 bg-green-50 text-green-800'
              : 'border border-red-200 bg-red-50 text-red-800'
          }`}
        >
          {status.message}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-5 py-3 font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <FiSend size={18} />
        {submitting ? c.sending : c.send}
      </button>
    </form>
  );
};

export default ContactForm;
