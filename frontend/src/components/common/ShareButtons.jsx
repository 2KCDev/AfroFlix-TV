import React, { useState } from 'react';
import { FiCopy, FiFacebook, FiMessageCircle } from 'react-icons/fi';

const getCurrentUrl = () => window.location.href;

const ShareButtons = ({ title, compact = false }) => {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== 'undefined' ? getCurrentUrl() : '';
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title || 'AFROFLIX.TV');

  const copyLink = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const baseClass = compact
    ? 'inline-flex h-11 w-11 items-center justify-center rounded-full border transition'
    : 'inline-flex items-center gap-2 rounded-lg border px-3 py-2 transition';
  const itemClass = `${baseClass} border-gray-300 text-gray-700 hover:border-red-600 hover:text-red-600`;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
        target="_blank"
        rel="noreferrer"
        className={compact ? `${baseClass} border-blue-200 bg-blue-50 text-blue-700 hover:border-blue-600 hover:bg-blue-600 hover:text-white` : itemClass}
        aria-label="Partager sur Facebook"
        title="Facebook"
      >
        <FiFacebook size={18} />
        {!compact && 'Facebook'}
      </a>
      <a
        href={`https://wa.me/?text=${encodedTitle}%20${encodedUrl}`}
        target="_blank"
        rel="noreferrer"
        className={compact ? `${baseClass} border-green-200 bg-green-50 text-green-700 hover:border-green-600 hover:bg-green-600 hover:text-white` : itemClass}
        aria-label="Partager sur WhatsApp"
        title="WhatsApp"
      >
        <FiMessageCircle size={18} />
        {!compact && 'WhatsApp'}
      </a>
      <button
        type="button"
        onClick={copyLink}
        className={compact ? `${baseClass} border-gray-300 bg-white text-gray-700 hover:border-gray-900 hover:bg-gray-900 hover:text-white` : itemClass}
        aria-label={copied ? 'Lien copié' : 'Copier le lien'}
        title={copied ? 'Lien copié' : 'Copier'}
      >
        <FiCopy size={18} />
        {!compact && (copied ? 'Copié' : 'Copier')}
      </button>
    </div>
  );
};

export default ShareButtons;
