import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiMail, FiFacebook, FiTwitter, FiInstagram, FiYoutube } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import { api } from '../../services/api';
import { useLocale } from '../../hooks/useLocale';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterMessage, setNewsletterMessage] = useState('');
  const [newsletterError, setNewsletterError] = useState('');
  const [newsletterLoading, setNewsletterLoading] = useState(false);
  const { t } = useLocale();

  const handleNewsletterSubmit = async (event) => {
    event.preventDefault();
    if (newsletterLoading) return;

    setNewsletterLoading(true);
    setNewsletterMessage('');
    setNewsletterError('');

    try {
      await api.subscribeNewsletter(newsletterEmail);
      setNewsletterMessage(t('footer.newsletterSuccess'));
      setNewsletterEmail('');
    } catch (error) {
      setNewsletterError(error.message || t('footer.newsletterError'));
    } finally {
      setNewsletterLoading(false);
    }
  };

  return (
    <footer className="bg-gray-900 text-gray-300 mt-20">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <h3 className="text-2xl font-bold text-white mb-4">AFROFLIX.TV</h3>
            <p className="text-sm mb-6 text-justify">
              {t('footer.description')}
            </p>
            <div className="flex gap-5">
              <a href="https://www.facebook.com/afroflixTV" className="hover:text-red-600 transition" aria-label="Facebook AFROFLIX.TV" rel="noreferrer nofollow" target="_blank">
                <FiFacebook size={20} />
              </a>
              <a href="https://x.com/afroflixTV" className="hover:text-red-600 transition" aria-label="X AFROFLIX.TV" rel="noreferrer nofollow" target="_blank">
                <FiTwitter size={20} />
              </a>
              <a href="https://www.instagram.com/afroflix.tv" className="hover:text-red-600 transition" aria-label="Instagram AFROFLIX.TV" rel="noreferrer nofollow" target="_blank">
                <FiInstagram size={20} />
              </a>
              <a href="https://www.youtube.com/@afroflix_tv" className="hover:text-red-600 transition" aria-label="YouTube AFROFLIX.TV" rel="noreferrer nofollow" target="_blank">
                <FiYoutube size={20} />
              </a>
              <a href="https://whatsapp.com/channel/0029Vb8vQhG1iUxft7EbwQ1y" className="hover:text-red-600 transition" aria-label="WhatsApp AFROFLIX.TV" rel="noreferrer nofollow" target="_blank">
                <FaWhatsapp size={20} />
              </a>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-white font-bold mb-4">{t('footer.navigation')}</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="hover:text-red-600 transition">
                  {t('nav.home')}
                </Link>
              </li>
              <li>
                <Link to="/films" className="hover:text-red-600 transition">
                  {t('common.films')}
                </Link>
              </li>
              <li>
                <Link to="/acteurs" className="hover:text-red-600 transition">
                  {t('nav.actors')}
                </Link>
              </li>
              <li>
                <Link to="/actualites" className="hover:text-red-600 transition">
                  {t('nav.news')}
                </Link>
              </li>
              <li>
                <Link to="/classements" className="hover:text-red-600 transition">
                  {t('nav.rankings')}
                </Link>
              </li>
              <li>
                <Link to="/critiques" className="hover:text-red-600 transition">
                  {t('footer.reviews')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-white font-bold mb-4">{t('footer.resources')}</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/about" className="hover:text-red-600 transition">
                  {t('footer.about')}
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-red-600 transition">
                  {t('footer.contact')}
                </Link>
              </li>
              <li>
                <Link to="/actualites" className="hover:text-red-600 transition">
                  {t('footer.guide')}
                </Link>
              </li>
              <li>
                <Link to="/legal" className="hover:text-red-600 transition">
                  {t('footer.legalNotice')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-white font-bold mb-4">{t('footer.legal')}</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/privacy" className="hover:text-red-600 transition">
                  {t('footer.privacy')}
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-red-600 transition">
                  {t('footer.terms')}
                </Link>
              </li>
              <li>
                <Link to="/cookies" className="hover:text-red-600 transition">
                  {t('footer.cookies')}
                </Link>
              </li>
              <li>
                <Link to="/copyright" className="hover:text-red-600 transition">
                  {t('footer.copyright')}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Newsletter */}
        <div className="bg-red-600 bg-opacity-10 border border-red-600 border-opacity-30 rounded-lg p-6 mb-8">
          <h4 className="text-white font-bold mb-2">{t('footer.stayInformed')}</h4>
          <p className="text-sm mb-4 text-justify">
            {t('footer.newsletterDescription')}
          </p>
          <form className="flex gap-2" onSubmit={handleNewsletterSubmit}>
            <input
              type="email"
              value={newsletterEmail}
              onChange={(event) => setNewsletterEmail(event.target.value)}
              placeholder={t('footer.email')}
              className="flex-grow px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 outline-none focus:border-red-600 transition"
              disabled={newsletterLoading}
              required
            />
            <button
              type="submit"
              disabled={newsletterLoading}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:text-gray-300 rounded-lg font-semibold transition"
              aria-label={t('footer.subscribe')}
            >
              <FiMail size={20} />
            </button>
          </form>
          {newsletterMessage && (
            <p className="mt-3 text-sm text-gray-200">{newsletterMessage}</p>
          )}
          {newsletterError && (
            <p className="mt-3 text-sm font-semibold text-red-200">{newsletterError}</p>
          )}
        </div>

        {/* Bottom */}
        <div className="border-t border-gray-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
            <p className="text-justify">
              © {currentYear} AFROFLIX.TV. {t('footer.allRightsReserved')}
            </p>
            <div className="flex gap-6">
              <Link to="/privacy" className="hover:text-red-600 transition">
                {t('footer.privacyPolicy')}
              </Link>
              <Link to="/terms" className="hover:text-red-600 transition">
                {t('footer.termsOfUse')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
