import React, { useEffect, useState } from 'react';
import { FiArrowDown, FiArrowUp } from 'react-icons/fi';

const PageJumpButton = () => {
  const [nearBottom, setNearBottom] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const updatePosition = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
      const pageHeight = document.documentElement.scrollHeight;
      setVisible(pageHeight > viewportHeight * 1.4);
      setNearBottom(scrollTop + viewportHeight >= pageHeight - 240);
    };

    updatePosition();
    window.addEventListener('scroll', updatePosition, { passive: true });
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('scroll', updatePosition);
      window.removeEventListener('resize', updatePosition);
    };
  }, []);

  const jump = () => {
    window.scrollTo({
      top: nearBottom ? 0 : document.documentElement.scrollHeight,
      behavior: 'smooth',
    });
  };

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={jump}
      className="fixed bottom-5 right-5 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-red-600 text-white shadow-lg transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
      aria-label={nearBottom ? 'Remonter en haut de page' : 'Aller au pied de page'}
      title={nearBottom ? 'Remonter' : 'Aller en bas'}
    >
      {nearBottom ? <FiArrowUp size={22} /> : <FiArrowDown size={22} />}
    </button>
  );
};

export default PageJumpButton;
