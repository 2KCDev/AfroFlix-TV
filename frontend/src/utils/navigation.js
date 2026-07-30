import { useEffect, useLayoutEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

const scrollStorageKey = (location) => `afroflix:scroll:${location.pathname}${location.search}`;

export const ensureDirectDetailBackStack = ({ detailPath, listPath }) => {
  const state = window.history.state || {};
  const routerState = state.usr || {};
  const isDirectEntry = state.idx === 0 || (typeof state.idx !== 'number' && window.history.length <= 1);
  if (!isDirectEntry || routerState.afroflixDetailBackStack === detailPath) return;

  // A direct entry normally has no internal predecessor. Build the same
  // natural path a visitor would have taken: home → catalogue → detail.
  window.history.replaceState({ ...state, idx: 0, usr: { ...routerState, afroflixDetailBackStack: 'home' } }, '', '/');
  window.history.pushState({ ...state, idx: 1, usr: { afroflixDetailBackStack: listPath } }, '', listPath);
  window.history.pushState({ ...state, idx: 2, usr: { afroflixDetailBackStack: detailPath } }, '', detailPath);
};

// Restore a catalogue exactly where it was after browser Back. Waiting until
// data is rendered prevents restoration from occurring on an empty grid.
export const useListScrollRestoration = (ready) => {
  const location = useLocation();
  const navigationType = useNavigationType();
  const restoredKey = useRef(null);
  const key = scrollStorageKey(location);

  useEffect(() => {
    const save = () => sessionStorage.setItem(key, String(window.scrollY));
    window.addEventListener('scroll', save, { passive: true });
    window.addEventListener('pagehide', save);
    return () => {
      save();
      window.removeEventListener('scroll', save);
      window.removeEventListener('pagehide', save);
    };
  }, [key]);

  useLayoutEffect(() => {
    if (!ready || restoredKey.current === key) return;
    restoredKey.current = key;
    const savedPosition = Number(sessionStorage.getItem(key) || 0);
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: navigationType === 'POP' ? savedPosition : 0, left: 0, behavior: 'auto' });
    });
  }, [key, navigationType, ready]);

};
