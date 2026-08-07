import React, { useEffect } from 'react';
import ContactForm from '../components/forms/ContactForm';
import { useLocale } from '../hooks/useLocale';

const LegalPage = ({ type = 'about' }) => {
  const { language } = useLocale();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [type]);

  const content = {
    fr: {
    about: {
      title: 'À propos de AFROFLIX.TV',
      content: `
        <h2>Qui sommes-nous?</h2>
        <p>AFROFLIX.TV est votre plateforme de référence en français pour découvrir, explorer et apprécier le cinéma africain. Notre mission est de rendre accessible le AfroFlix.TV au public francophone.</p>
        
        <h2>Notre vision</h2>
        <p>Nous croyons que le cinéma africain est une richesse culturelle mondiale qui mérite d'être célébrée et préservée. Nous nous engageons à promouvoir les films, les acteurs et les histoires du AfroFlix.TV.</p>
        
        <h2>Nos services</h2>
        <ul>
          <li>Base de données complète de films africains</li>
          <li>Profils détaillés des acteurs et réalisateurs</li>
          <li>Articles et analyses éducatifs</li>
          <li>Système de notation et commentaires</li>
          <li>Listes de favoris personnalisées</li>
        </ul>
      `,
    },
    privacy: {
      title: 'Politique de confidentialité',
      content: `
        <h2>Collecte de données</h2>
        <p>Nous collectons les informations que vous nous fournissez volontairement, notamment votre email, nom d'utilisateur et préférences.</p>
        
        <h2>Utilisation des données</h2>
        <p>Vos données sont utilisées pour:</p>
        <ul>
          <li>Maintenir votre compte utilisateur</li>
          <li>Personnaliser votre expérience</li>
          <li>Améliorer nos services</li>
          <li>Vous envoyer des mises à jour (si vous avez accepté)</li>
        </ul>
        
        <h2>Protection des données</h2>
        <p>Vos données personnelles sont protégées par des mesures de sécurité appropriées, y compris le chiffrement SSL et le stockage sécurisé des mots de passe.</p>
      `,
    },
    terms: {
      title: 'Conditions d\'utilisation',
      content: `
        <h2>Acceptation des conditions</h2>
        <p>En utilisant AFROFLIX.TV, vous acceptez ces conditions d'utilisation et notre politique de confidentialité.</p>
        
        <h2>Licence d'utilisation</h2>
        <p>Nous vous accordons une licence personnelle, non transférable et non exclusive pour accéder et utiliser AFROFLIX.TV.</p>
        
        <h2>Restrictions</h2>
        <ul>
          <li>Vous ne pouvez pas reproduire ou distribuer le contenu sans permission</li>
          <li>Vous ne pouvez pas utiliser le site à des fins commerciales sans autorisation</li>
          <li>Vous acceptez de ne pas poster de contenu offensant ou illégal</li>
        </ul>
        
        <h2>Limitation de responsabilité</h2>
        <p>AFROFLIX.TV est fourni "tel quel" sans garanties. Nous ne sommes pas responsables des dommages directs ou indirects.</p>
      `,
    },
    cookies: {
      title: 'Politique des cookies',
      content: `
        <h2>Qu'est-ce qu'un cookie?</h2>
        <p>Les cookies et technologies similaires permettent de mémoriser vos préférences, sécuriser la navigation et, uniquement avec votre accord, mesurer l'audience ou préparer l'affichage publicitaire.</p>
        
        <h2>Types de cookies utilisés</h2>
        <ul>
          <li><strong>Cookies essentiels:</strong> indispensables pour la sécurité, la connexion, les préférences de consentement et le fonctionnement du site.</li>
          <li><strong>Cookies de mesure d'audience:</strong> utilisés seulement après consentement pour analyser les performances et améliorer les contenus.</li>
          <li><strong>Cookies publicitaires:</strong> désactivés par défaut et activés uniquement avec votre accord, notamment pour les futures intégrations publicitaires.</li>
        </ul>

        <h2>Votre consentement</h2>
        <p>Le refus est aussi simple que l'acceptation. Vos choix sont conservés localement et peuvent être modifiés à tout moment depuis cette page.</p>
        
        <h2>Gestion des cookies</h2>
        <p>Vous pouvez contrôler les cookies depuis le panneau de préférences ci-dessous ou via les paramètres de votre navigateur. Les cookies essentiels ne peuvent pas être désactivés car ils sont nécessaires au service demandé.</p>
      `,
    },
    contact: {
      title: 'Nous contacter',
      content: `
        <h2>Informations de contact</h2>
        <p>Vous avez des questions ou des suggestions? Nous aimerions vous entendre!</p>
        
        <p><strong>Email:</strong> contact@afroflix-tv.com</p>
        <p><strong>Temps de réponse:</strong> 24-48 heures</p>
        
        <h2>Support</h2>
        <p>Pour les problèmes techniques ou les questions sur votre compte, veuillez utiliser le formulaire de contact ou envoyer un email à support@afroflix-tv.com</p>
      `,
    },
    copyright: {
      title: 'Droits d\'auteur / Signaler un contenu',
      content: `
        <h2>Propriété intellectuelle</h2>
        <p>Tout le contenu de AFROFLIX.TV, y compris les textes, images, logos et conception, est protégé par les droits d'auteur.</p>
        
        <h2>Contenu généré par les utilisateurs</h2>
        <p>En soumettant du contenu (commentaires, évaluations), vous accordez à AFROFLIX.TV une licence pour utiliser ce contenu sur le site.</p>
        
        <h2>Contenu de tiers</h2>
        <p>Les images de films et les informations sur les acteurs sont fournies à des fins éducatives. Si vous êtes propriétaire du contenu et souhaitez qu'il soit supprimé, veuillez nous contacter.</p>

        <h2>Procédure de signalement</h2>
        <p>Si vous représentez un ayant droit et pensez qu'une vidéo, image ou information publiée sur AFROFLIX.TV porte atteinte à vos droits, écrivez à contact@afroflix-tv.com avec l'URL concernée, la preuve de propriété et vos coordonnées. Toute demande complète est examinée en priorité.</p>
      `,
    },
    legal: {
      title: 'Mentions légales',
      content: `
        <h2>Éditeur du site</h2>
        <p>AFROFLIX.TV est une plateforme éditoriale francophone dédiée à la découverte du cinéma africain. Les informations définitives de l'éditeur devront être renseignées avant la mise en production officielle.</p>

        <h2>Contact</h2>
        <p>Email principal : contact@afroflix-tv.com</p>
        <p>Support technique : support@afroflix-tv.com</p>
        <p>Informations générales : info@afroflix-tv.com</p>

        <h2>Hébergement</h2>
        <p>Les informations de l'hébergeur seront publiées ici dès le choix du fournisseur de production.</p>

        <h2>Responsabilité éditoriale</h2>
        <p>Les contenus publiés sont rédigés à titre informatif et culturel. AFROFLIX.TV ne diffuse pas de films piratés, n'héberge aucun fichier vidéo et privilégie les liens ou intégrations officiellement publiés par les ayants droit.</p>
      `,
    },
    },
    en: {
      about: {
        title: 'About AFROFLIX.TV',
        content: `
          <h2>Who are we?</h2>
          <p>AFROFLIX.TV is your reference platform for discovering, exploring and appreciating African cinema. Our mission is to make African cinema accessible to a wider audience.</p>

          <h2>Our vision</h2>
          <p>We believe African cinema is a global cultural treasure that deserves to be celebrated and preserved. We are committed to promoting its films, artists and stories.</p>

          <h2>Our services</h2>
          <ul>
            <li>A comprehensive database of African films</li>
            <li>Detailed profiles of actors and directors</li>
            <li>Educational articles and analyses</li>
            <li>A rating and comments system</li>
            <li>Personalised favourites lists</li>
          </ul>
        `,
      },
      privacy: {
        title: 'Privacy policy',
        content: `
          <h2>Data collection</h2>
          <p>We collect the information you voluntarily provide, including your email address, username and preferences.</p>

          <h2>Use of data</h2>
          <p>Your data is used to:</p>
          <ul>
            <li>Maintain your user account</li>
            <li>Personalise your experience</li>
            <li>Improve our services</li>
            <li>Send you updates, where you have agreed to receive them</li>
          </ul>

          <h2>Data protection</h2>
          <p>Your personal data is protected by appropriate security measures, including SSL encryption and secure password storage.</p>
        `,
      },
      terms: {
        title: 'Terms of use',
        content: `
          <h2>Acceptance of the terms</h2>
          <p>By using AFROFLIX.TV, you agree to these terms of use and our privacy policy.</p>

          <h2>Licence to use</h2>
          <p>We grant you a personal, non-transferable and non-exclusive licence to access and use AFROFLIX.TV.</p>

          <h2>Restrictions</h2>
          <ul>
            <li>You may not reproduce or distribute content without permission</li>
            <li>You may not use the website for commercial purposes without authorisation</li>
            <li>You agree not to post unlawful or offensive content</li>
          </ul>

          <h2>Limitation of liability</h2>
          <p>AFROFLIX.TV is provided “as is”, without warranties. We are not liable for direct or indirect damages.</p>
        `,
      },
      cookies: {
        title: 'Cookie policy',
        content: `
          <h2>What is a cookie?</h2>
          <p>Cookies and similar technologies remember your preferences, secure browsing and, only with your consent, measure audiences or prepare advertising display.</p>

          <h2>Types of cookies used</h2>
          <ul>
            <li><strong>Essential cookies:</strong> required for security, sign-in, consent preferences and the website to function.</li>
            <li><strong>Audience measurement cookies:</strong> used only after consent to analyse performance and improve our content.</li>
            <li><strong>Advertising cookies:</strong> disabled by default and enabled only with your consent, including for future advertising integrations.</li>
          </ul>

          <h2>Your consent</h2>
          <p>Refusing is as easy as accepting. Your choices are stored locally and can be changed at any time from this page.</p>

          <h2>Managing cookies</h2>
          <p>You can control cookies from the preferences panel below or in your browser settings. Essential cookies cannot be disabled because they are required for the service you request.</p>
        `,
      },
      contact: {
        title: 'Contact us',
        content: `
          <h2>Contact information</h2>
          <p>Do you have questions or suggestions? We would love to hear from you.</p>
          <p><strong>Email:</strong> contact@afroflix-tv.com</p>
          <p><strong>Response time:</strong> 24–48 hours</p>
          <h2>Support</h2>
          <p>For technical issues or questions about your account, please use the contact form or email support@afroflix-tv.com.</p>
        `,
      },
      copyright: {
        title: 'Copyright / Report content',
        content: `
          <h2>Intellectual property</h2>
          <p>All AFROFLIX.TV content, including text, images, logos and design, is protected by copyright.</p>
          <h2>User-generated content</h2>
          <p>By submitting content, including comments and ratings, you grant AFROFLIX.TV a licence to use that content on the website.</p>
          <h2>Third-party content</h2>
          <p>Film images and actor information are provided for educational purposes. If you own content and would like it removed, please contact us.</p>
          <h2>Reporting procedure</h2>
          <p>If you represent a rights holder and believe a video, image or piece of information published on AFROFLIX.TV infringes your rights, email contact@afroflix-tv.com with the relevant URL, proof of ownership and your contact details. Complete requests are reviewed as a priority.</p>
        `,
      },
      legal: {
        title: 'Legal notice',
        content: `
          <h2>Website publisher</h2>
          <p>AFROFLIX.TV is an editorial platform dedicated to discovering African cinema. The publisher’s definitive information will be provided here.</p>
          <h2>Contact</h2>
          <p>Main email: contact@afroflix-tv.com</p>
          <p>Technical support: support@afroflix-tv.com</p>
          <p>General information: info@afroflix-tv.com</p>
          <h2>Hosting</h2>
          <p>The hosting provider’s information will be published here once the production provider has been selected.</p>
          <h2>Editorial responsibility</h2>
          <p>Published content is for information and cultural purposes. AFROFLIX.TV does not distribute pirated films, host video files or promote unauthorised content; it favours links or embeds officially published by rights holders.</p>
        `,
      },
    },
  };

  const page = content[language]?.[type] || content.fr[type] || content.fr.about;
  const dateLocale = language === 'en' ? 'en-GB' : 'fr-FR';

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">{page.title}</h1>
        <p className="text-gray-600">
          {language === 'en' ? 'Last updated:' : 'Dernière mise à jour:'} {new Date().toLocaleDateString(dateLocale)}
        </p>
      </div>

      {type === 'contact' ? (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1.25fr]">
          <div
            className="legal-content prose prose-lg max-w-none rounded-lg bg-white p-8 text-justify shadow-md"
            dangerouslySetInnerHTML={{ __html: page.content }}
          />
          <ContactForm />
        </div>
      ) : type === 'cookies' ? (
        <div className="space-y-4">
          <div
            className="legal-content prose prose-lg max-w-none rounded-lg bg-white p-8 text-justify shadow-md"
            dangerouslySetInnerHTML={{ __html: page.content }}
          />
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event('cookie-consent:open'))}
            className="rounded-lg bg-red-600 px-5 py-3 font-semibold text-white transition hover:bg-red-700"
          >
            {language === 'en' ? 'Manage my cookie preferences' : 'Gérer mes préférences cookies'}
          </button>
        </div>
      ) : (
        <div
          className="legal-content prose prose-lg max-w-none rounded-lg bg-white p-8 text-justify shadow-md"
          dangerouslySetInnerHTML={{ __html: page.content }}
        />
      )}
    </div>
  );
};

export default LegalPage;
