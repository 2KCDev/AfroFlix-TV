import React, { useEffect } from 'react';
import ContactForm from '../components/forms/ContactForm';

const LegalPage = ({ type = 'about' }) => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [type]);

  const content = {
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
  };

  const page = content[type] || content.about;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">{page.title}</h1>
        <p className="text-gray-600">
          Dernière mise à jour: {new Date().toLocaleDateString('fr-FR')}
        </p>
      </div>

      {type === 'contact' ? (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1.25fr]">
          <div
            className="prose prose-lg max-w-none rounded-lg bg-white p-8 shadow-md"
            dangerouslySetInnerHTML={{ __html: page.content }}
          />
          <ContactForm />
        </div>
      ) : type === 'cookies' ? (
        <div className="space-y-4">
          <div
            className="prose prose-lg max-w-none bg-white rounded-lg shadow-md p-8"
            dangerouslySetInnerHTML={{ __html: page.content }}
          />
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event('cookie-consent:open'))}
            className="rounded-lg bg-red-600 px-5 py-3 font-semibold text-white transition hover:bg-red-700"
          >
            Gérer mes préférences cookies
          </button>
        </div>
      ) : (
        <div
          className="prose prose-lg max-w-none bg-white rounded-lg shadow-md p-8"
          dangerouslySetInnerHTML={{ __html: page.content }}
        />
      )}
    </div>
  );
};

export default LegalPage;
