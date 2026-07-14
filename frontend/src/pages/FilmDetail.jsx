import React, { useEffect, useRef, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiExternalLink, FiFlag, FiHeart, FiMessageSquare, FiPlay, FiRefreshCw, FiSend, FiStar, FiX } from 'react-icons/fi';
import Breadcrumbs from '../components/common/Breadcrumbs';
import LoadingSpinner from '../components/common/LoadingSpinner';
import SEO from '../components/common/SEO';
import ShareButtons from '../components/common/ShareButtons';
import StarRating from '../components/common/StarRating';
import { useFilmDetail } from '../hooks/useFilms';
import { api } from '../services/api';
import { useAuth } from '../hooks/useAuth';

const getYouTubeEmbedUrl = (value) => {
  if (!value) return '';
  const rawValue = value.trim();
  const iframeSrc = rawValue.match(/src=["']([^"']+)["']/i)?.[1];
  const candidate = iframeSrc || rawValue;

  try {
    const url = new URL(candidate);
    if (url.hostname.includes('youtube.com')) {
      if (url.pathname.startsWith('/embed/')) return url.href;
      const videoId = url.searchParams.get('v');
      if (videoId) return `https://www.youtube.com/embed/${videoId}`;
      if (url.pathname.startsWith('/shorts/')) {
        const videoId = url.pathname.split('/')[2];
        if (videoId) return `https://www.youtube.com/embed/${videoId}`;
      }
    }

    if (url.hostname === 'youtu.be') {
      const videoId = url.pathname.replace('/', '');
      if (videoId) return `https://www.youtube.com/embed/${videoId}`;
    }
  } catch {
    return candidate;
  }

  return candidate;
};

const withAutoplay = (value) => {
  if (!value) return '';

  try {
    const url = new URL(value);
    url.searchParams.set('autoplay', '1');
    url.searchParams.set('playsinline', '1');
    url.searchParams.set('rel', '0');
    url.searchParams.set('modestbranding', '1');
    return url.href;
  } catch {
    return value;
  }
};

const YOUTUBE_OFFLINE_MESSAGE = 'Veuillez vérifier votre connexion Internet, puis réessayer.';
const YOUTUBE_CONNECTIVITY_URL = 'https://www.youtube.com/generate_204';

const FilmDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { data: film, loading } = useFilmDetail(slug);
  const videoFrameRef = useRef(null);

  const [ratingStats, setRatingStats] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentTotal, setCommentTotal] = useState(0);
  const [userRating, setUserRating] = useState(0);
  const [commentText, setCommentText] = useState('');
  const [guestName, setGuestName] = useState(() => localStorage.getItem('afroflix_guest_name') || '');
  const [guestEmail, setGuestEmail] = useState(() => localStorage.getItem('afroflix_guest_email') || '');
  const [isFavorited, setIsFavorited] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [pendingCommentNotice, setPendingCommentNotice] = useState('');
  const [commentReportNotice, setCommentReportNotice] = useState('');
  const [reportedCommentIds, setReportedCommentIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('afroflix_reported_comments') || '[]');
    } catch {
      return [];
    }
  });
  const [reportingCommentId, setReportingCommentId] = useState(null);
  const [visibleSimilarCount, setVisibleSimilarCount] = useState(6);
  const [submittingRating, setSubmittingRating] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [isOnline, setIsOnline] = useState(() => (
    typeof navigator === 'undefined' ? true : navigator.onLine
  ));
  const [videoAccessStatus, setVideoAccessStatus] = useState('checking');
  const [videoRetryKey, setVideoRetryKey] = useState(0);

  const videoUrl = film ? getYouTubeEmbedUrl(film.youtube_embed_url || film.youtubeEmbedUrl || film.video_url) : '';

  useEffect(() => {
    const updateOnlineStatus = () => {
      const nextIsOnline = navigator.onLine;
      setIsOnline(nextIsOnline);
      if (nextIsOnline) {
        setVideoRetryKey((key) => key + 1);
      }
    };

    updateOnlineStatus();
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  useEffect(() => {
    if (!film) return undefined;

    const animationFrame = window.requestAnimationFrame(() => {
      if (videoFrameRef.current) {
        videoFrameRef.current.scrollIntoView({
          block: 'center',
          inline: 'nearest',
          behavior: 'auto',
        });
        return;
      }

      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    });

    return () => window.cancelAnimationFrame(animationFrame);
  }, [film?.id, slug]);

  useEffect(() => {
    if (!videoUrl) {
      setVideoAccessStatus('available');
      return undefined;
    }

    if (!isOnline) {
      setVideoAccessStatus('unavailable');
      return undefined;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 4500);

    setVideoAccessStatus('checking');

    fetch(YOUTUBE_CONNECTIVITY_URL, {
      cache: 'no-store',
      mode: 'no-cors',
      signal: controller.signal,
    })
      .then(() => setVideoAccessStatus('available'))
      .catch(() => setVideoAccessStatus('unavailable'))
      .finally(() => window.clearTimeout(timeoutId));

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [isOnline, videoRetryKey, videoUrl]);

  const handleRetryVideo = () => {
    setIsOnline(typeof navigator === 'undefined' ? true : navigator.onLine);
    setVideoRetryKey((key) => key + 1);
  };

  // Fetch rating stats and comments when film loads
  useEffect(() => {
    if (!film) return;

    // Fetch ratings
    api
      .getRatingStats(film.id)
      .then(setRatingStats)
      .catch(console.error);

    // Fetch comments
    api
      .comments(film.id)
      .then((res) => {
        setComments(res.comments || []);
        setCommentTotal(res.pagination?.total || res.comments?.length || 0);
      })
      .catch(console.error);

    // Check visitor/user rating
    api
      .getUserRating(film.id)
      .then((res) => setUserRating(res.rating_value || res.rating || 0))
      .catch(() => setUserRating(0));

    if (isAuthenticated) {
      // Check if favorited
      api
        .checkFavorite(film.id)
        .then((res) => setIsFavorited(res.is_favorite || res.isFavorited || false))
        .catch(() => setIsFavorited(false));
    }

    // Record view
    api.recordView(film.id).catch(console.error);
  }, [film, isAuthenticated]);

  useEffect(() => {
    if (!commentsOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setCommentsOpen(false);
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [commentsOpen]);

  const handleRateSubmit = async (rating) => {
    if (submittingRating || userRating > 0) return;

    setSubmittingRating(true);
    try {
      await api.submitRating(film.id, rating);
      setUserRating(rating);

      // Refresh rating stats
      const stats = await api.getRatingStats(film.id);
      setRatingStats(stats);
    } catch (error) {
      alert('Erreur lors de la notation: ' + error.message);
    } finally {
      setSubmittingRating(false);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();

    if (!commentText.trim()) return;
    if (!isAuthenticated && (!guestName.trim() || !guestEmail.trim())) {
      alert('Veuillez saisir votre nom et votre email pour commenter.');
      return;
    }

    setSubmittingComment(true);
    try {
      if (!isAuthenticated) {
        localStorage.setItem('afroflix_guest_name', guestName.trim());
        localStorage.setItem('afroflix_guest_email', guestEmail.trim());
      }
      await api.submitComment(film.id, commentText, {
        name: isAuthenticated ? user?.username || user?.email || 'Utilisateur AFROFLIX.TV' : guestName.trim(),
        email: isAuthenticated ? user?.email : guestEmail.trim(),
      });
      setPendingCommentNotice('Votre commentaire a été envoyé en modération. Il apparaîtra après validation.');
      setCommentText('');
    } catch (error) {
      alert('Erreur lors du post: ' + error.message);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleReportComment = async (commentId) => {
    if (reportingCommentId || reportedCommentIds.includes(commentId)) return;

    setReportingCommentId(commentId);
    setCommentReportNotice('');

    try {
      const response = await api.reportComment(commentId);
      const nextReported = [...new Set([...reportedCommentIds, commentId])];
      setReportedCommentIds(nextReported);
      localStorage.setItem('afroflix_reported_comments', JSON.stringify(nextReported));
      setCommentReportNotice(response.message || 'Merci. Le commentaire a été signalé à la modération.');

      if (response.status === 'hidden') {
        setComments((current) => current.filter((comment) => comment.id !== commentId));
        setCommentTotal((current) => Math.max(0, Number(current || 0) - 1));
      }
    } catch (error) {
      if (error.message?.includes('déjà été signalé')) {
        const nextReported = [...new Set([...reportedCommentIds, commentId])];
        setReportedCommentIds(nextReported);
        localStorage.setItem('afroflix_reported_comments', JSON.stringify(nextReported));
      }
      setCommentReportNotice(error.message || 'Impossible de signaler ce commentaire pour le moment.');
    } finally {
      setReportingCommentId(null);
    }
  };

  const handleToggleFavorite = async () => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }

    try {
      if (isFavorited) {
        await api.removeFavorite(film.id);
      } else {
        await api.addFavorite(film.id);
      }
      setIsFavorited(!isFavorited);
    } catch (error) {
      alert('Erreur: ' + error.message);
    }
  };

  if (loading) return <LoadingSpinner fullPage />;
  if (!film) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-bold text-gray-900">Film non trouvé</h2>
        <button
          onClick={() => navigate('/films')}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Retour aux films
        </button>
      </div>
    );
  }

  const posterUrl = film.poster_url || film.posterUrl || 'https://via.placeholder.com/300x450';
  const releaseYear = film.year || film.releaseYear || '—';
  const genres = film.genres?.map((genre) => genre.name).join(', ') || film.genre || '—';
  const actors = film.actors || film.cast || [];
  const averageRating = Number(ratingStats?.average || ratingStats?.stats?.average_rating || film.average_rating || 0);
  const ratingCount = Number(ratingStats?.stats?.total_ratings || ratingStats?.count || film.stats?.rating_count || 0);
  const commentCount = Number(commentTotal || film.stats?.comments_count || comments.length || 0);
  const similarFilms = film.similar_films || film.similarFilms || [];
  const visibleSimilarFilms = similarFilms.slice(0, visibleSimilarCount);
  const autoplayVideoUrl = withAutoplay(videoUrl);
  const hasUserRated = userRating > 0;

  const similarFilmsSection = (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <h2 className="mb-4 text-lg font-bold text-gray-900">Vidéos similaires</h2>
      {visibleSimilarFilms.length > 0 ? (
        <div className="space-y-3">
          {visibleSimilarFilms.map((similar) => {
            const similarPoster = similar.poster_url || similar.posterUrl || 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=900&q=80';
            const similarRating = Number(similar.average_rating || 0);

            return (
              <Link
                key={similar.id}
                to={`/films/${similar.slug}`}
                className="group grid grid-cols-[112px_minmax(0,1fr)] gap-3 rounded-lg p-2 transition hover:bg-gray-50"
              >
                <div className="relative aspect-video overflow-hidden rounded-md bg-gray-200">
                  <img
                    src={similarPoster}
                    alt={similar.title}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  />
                  <span className="absolute inset-0 flex items-center justify-center bg-black/10">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-red-600 shadow">
                      <FiPlay size={18} fill="currentColor" className="ml-0.5" />
                    </span>
                  </span>
                </div>
                <div className="min-w-0">
                  <h3 className="line-clamp-2 break-words text-sm font-bold leading-snug text-gray-900 group-hover:text-red-600">
                    {similar.title}
                  </h3>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-600">
                    <span>{similar.year || 'Année inconnue'}</span>
                    <span className="inline-flex items-center gap-1 text-orange-700">
                      <FiStar size={13} fill="currentColor" />
                      {similarRating > 0 ? similarRating.toFixed(1) : 'N/A'}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
          {visibleSimilarCount < similarFilms.length && (
            <button
              type="button"
              onClick={() => setVisibleSimilarCount((count) => count + 6)}
              className="mt-2 w-full rounded-lg border border-red-200 px-4 py-2 text-sm font-bold text-red-700 transition hover:bg-red-50"
            >
              Voir plus
            </button>
          )}
        </div>
      ) : (
        <p className="text-sm leading-relaxed text-gray-600">
          Les suggestions apparaîtront ici dès que des films du même genre seront publiés.
        </p>
      )}
    </div>
  );

  const ratingSection = (
    <section className="rounded-lg border border-orange-200 bg-orange-50 p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Notation</h2>
          <p className="mt-1 text-sm text-gray-700">
            {hasUserRated
              ? 'Votre note est enregistrée.'
              : 'Cliquez sur une étoile pour noter ce film.'}
          </p>
        </div>
        <div className="rounded-lg bg-white px-4 py-3 text-right shadow-sm">
          <div className="text-3xl font-bold text-orange-600">{averageRating.toFixed(1)}</div>
          <div className="text-xs font-semibold text-gray-600">
            {ratingCount} vote{ratingCount !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-sm font-semibold text-gray-700">
            {hasUserRated ? 'Votre note' : 'Noter ce film'}
          </p>
          <StarRating
            rating={hasUserRated ? userRating : 0}
            interactive={!hasUserRated}
            onRate={handleRateSubmit}
            size={28}
            disabled={submittingRating || hasUserRated}
          />
        </div>
        <p className="text-sm font-semibold text-gray-700">
          Moyenne: <span className="text-orange-700">{averageRating.toFixed(1)}/5</span>
        </p>
      </div>
      {submittingRating && (
        <p className="mt-3 text-sm font-semibold text-orange-700">Enregistrement de votre note...</p>
      )}
      {hasUserRated && (
        <p className="mt-3 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-gray-700">
          Merci, votre note est bloquée pour éviter les votes multiples.
        </p>
      )}
    </section>
  );

  const commentsPanel = commentsOpen && (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) setCommentsOpen(false);
      }}
    >
      <section
        className="flex h-[88vh] w-full flex-col overflow-hidden rounded-t-lg bg-white shadow-2xl sm:h-[min(720px,88vh)] sm:max-w-xl sm:rounded-lg"
        role="dialog"
        aria-modal="true"
        aria-labelledby="comments-dialog-title"
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <div>
            <h2 id="comments-dialog-title" className="flex items-center gap-2 text-lg font-bold text-gray-900">
              <FiMessageSquare size={20} className="text-red-600" />
              Commentaires
            </h2>
            <p className="text-xs font-semibold text-gray-500">
              {commentCount} validé{commentCount !== 1 ? 's' : ''} · modération active
            </p>
          </div>
          <button
            type="button"
            onClick={() => setCommentsOpen(false)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100"
            aria-label="Fermer les commentaires"
          >
            <FiX size={18} />
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto bg-gray-100 px-3 py-4 sm:px-4">
          {pendingCommentNotice && (
            <div className="rounded-lg border border-orange-200 bg-orange-50 p-3 text-sm font-semibold text-orange-800">
              {pendingCommentNotice}
            </div>
          )}
          {commentReportNotice && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm font-semibold text-blue-800">
              {commentReportNotice}
            </div>
          )}
          {comments.length > 0 ? (
            comments.map((comment) => {
              const isReported = reportedCommentIds.includes(comment.id);
              const isReporting = reportingCommentId === comment.id;

              return (
              <article key={comment.id} className="rounded-lg bg-white p-3 shadow-sm">
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-2">
                    <div className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-red-100 text-sm font-bold text-red-700">
                      {(comment.author_name || comment.username || 'L').charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="break-words text-sm font-bold text-gray-900">
                        {comment.author_name || comment.username || 'Lecteur'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(comment.created_at || comment.createdAt).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleReportComment(comment.id)}
                    disabled={isReporting || isReported}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-red-600 disabled:cursor-not-allowed disabled:text-gray-400"
                    aria-label={isReported ? 'Commentaire déjà signalé' : 'Signaler ce commentaire'}
                  >
                    <FiFlag size={13} />
                    {isReporting ? 'Signalement...' : isReported ? 'Signalé' : 'Signaler'}
                  </button>
                </div>
                <p className="break-words rounded-lg bg-gray-50 px-3 py-2 text-sm leading-relaxed text-gray-800">
                  {comment.content || comment.text}
                </p>
              </article>
              );
            })
          ) : (
            <div className="rounded-lg border border-dashed border-gray-300 bg-white px-4 py-10 text-center">
              <p className="font-semibold text-gray-800">Aucun commentaire validé pour le moment.</p>
              <p className="mt-1 text-sm text-gray-600">Les nouveaux commentaires passent en modération avant publication.</p>
            </div>
          )}
        </div>

        <form onSubmit={handleCommentSubmit} className="border-t border-gray-200 bg-white p-3">
          <div className="space-y-2">
            {!isAuthenticated && (
              <div className="grid gap-2 sm:grid-cols-2">
                <input
                  type="text"
                  value={guestName}
                  onChange={(event) => setGuestName(event.target.value)}
                  placeholder="Votre nom"
                  className="rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-red-500"
                  disabled={submittingComment}
                  required
                />
                <input
                  type="email"
                  value={guestEmail}
                  onChange={(event) => setGuestEmail(event.target.value)}
                  placeholder="Votre email"
                  className="rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-red-500"
                  disabled={submittingComment}
                  required
                />
              </div>
            )}
            <div className="flex items-end gap-2">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Écrire un commentaire..."
                className="min-h-11 flex-1 resize-none rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-red-500"
                rows="2"
                disabled={submittingComment}
              />
              <button
                type="submit"
                disabled={submittingComment || !commentText.trim()}
                className="inline-flex h-11 w-11 flex-none items-center justify-center rounded-full bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                aria-label={submittingComment ? 'Envoi du commentaire' : 'Poster le commentaire'}
              >
                <FiSend size={18} />
              </button>
            </div>
          </div>
        </form>
      </section>
    </div>
  );

  return (
    <div className="space-y-8">
      <SEO
        title={`${film.title} : résumé, acteurs et avis`}
        description={(film.description || `Découvrez ${film.title}, son casting, sa note et les avis des lecteurs.`).slice(0, 155)}
        image={posterUrl}
        type="video.movie"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'Movie',
          name: film.title,
          image: posterUrl,
          datePublished: film.year ? String(film.year) : undefined,
          director: film.director ? { '@type': 'Person', name: film.director } : undefined,
          actor: actors.map((actor) => ({ '@type': 'Person', name: actor.name || actor })),
          aggregateRating: averageRating > 0 ? {
            '@type': 'AggregateRating',
            ratingValue: averageRating,
            ratingCount,
            bestRating: 5,
            worstRating: 1,
          } : undefined,
        }}
      />
      <Breadcrumbs items={[{ label: 'Films', to: '/films' }, { label: film.title }]} />

      {/* Back Button */}
      <button
        onClick={() => navigate('/films')}
        className="flex items-center gap-2 text-red-600 hover:text-red-700 font-semibold"
      >
        <FiArrowLeft size={20} />
        Retour aux films
      </button>

      {/* Watch Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-6">
          <div>
            <h1 className="mb-2 break-words text-3xl font-bold text-gray-900 sm:text-4xl">{film.title}</h1>
            <div className="flex flex-wrap gap-3 text-sm text-gray-600">
              <span>{releaseYear}</span>
              <span>•</span>
              <span>{genres}</span>
              {film.duration && (
                <>
                  <span>•</span>
                  <span>{film.duration} min</span>
                </>
              )}
              <span>•</span>
              <span>{film.country || film.language || 'AfroFlix.TV'}</span>
            </div>
            <div className="mt-4 flex flex-wrap gap-3 text-sm">
              <span className="rounded-lg bg-gray-100 px-3 py-2 font-semibold text-gray-800">
                {Number(film.views || 0).toLocaleString()} vues
              </span>
              <span className="rounded-lg bg-orange-100 px-3 py-2 font-semibold text-orange-800">
                {averageRating.toFixed(1)}/5
              </span>
              <span className="rounded-lg bg-red-100 px-3 py-2 font-semibold text-red-800">
                {commentCount} commentaire{commentCount !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {videoUrl ? (
            <div ref={videoFrameRef} className="aspect-video w-full max-w-full overflow-hidden rounded-lg bg-black shadow-lg">
              {videoAccessStatus === 'available' ? (
                <iframe
                  key={`${videoUrl}-${videoRetryKey}`}
                  src={autoplayVideoUrl}
                  title={`Vidéo de ${film.title}`}
                  className="h-full w-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              ) : videoAccessStatus === 'checking' ? (
                <div className="flex h-full w-full items-center justify-center bg-gray-950 p-6 text-center">
                  <div>
                    <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-gray-700 border-t-red-600"></div>
                    <p className="mt-4 font-semibold text-white">Vérification de la connexion...</p>
                  </div>
                </div>
              ) : (
                <div className="relative h-full w-full overflow-hidden bg-gray-950">
                  <img
                    src={posterUrl}
                    alt={film.title}
                    loading="eager"
                    decoding="async"
                    className="h-full w-full object-cover opacity-40"
                  />
                  <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
                    <div className="max-w-md rounded-lg bg-black/75 px-5 py-4 text-white shadow-lg">
                      <p className="text-base font-semibold">{YOUTUBE_OFFLINE_MESSAGE}</p>
                      <button
                        type="button"
                        onClick={handleRetryVideo}
                        className="mt-4 inline-flex items-center gap-2 rounded-full bg-red-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-700"
                      >
                        <FiRefreshCw size={16} />
                        Réessayer
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div ref={videoFrameRef} className="relative aspect-video w-full max-w-full overflow-hidden rounded-lg bg-gray-900 shadow-lg">
              <img
                src={posterUrl}
                alt={film.title}
                loading="eager"
                decoding="async"
                className="h-full w-full object-cover opacity-70"
              />
              <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
                <p className="max-w-md rounded-lg bg-black/70 px-5 py-4 font-semibold text-white">
                  Aucune vidéo officielle vérifiée n'est associée à cette fiche.
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleToggleFavorite}
                className={`inline-flex min-h-11 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                  isFavorited
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'border border-red-200 bg-red-50 text-red-700 hover:border-red-600 hover:bg-red-600 hover:text-white'
                }`}
              >
                <FiHeart size={18} fill={isFavorited ? 'currentColor' : 'none'} />
                {isFavorited ? 'Favori' : 'Favoris'}
              </button>
              <button
                type="button"
                onClick={() => setCommentsOpen(true)}
                className={`relative inline-flex h-11 w-11 items-center justify-center rounded-full text-sm font-semibold transition ${
                  commentsOpen
                    ? 'bg-gray-900 text-white hover:bg-gray-800'
                    : 'border border-gray-200 bg-white text-gray-800 hover:border-red-600 hover:text-red-700'
                }`}
                aria-expanded={commentsOpen}
                aria-label={`Ouvrir les commentaires (${commentCount})`}
                title="Commentaires"
              >
                <FiMessageSquare size={18} />
                <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-red-600 px-1.5 py-0.5 text-center text-[10px] font-bold leading-none text-white">
                  {commentCount}
                </span>
              </button>
            </div>
            <ShareButtons title={film.title} compact />
          </div>

          {commentsPanel}

          {ratingSection}

          <div className="rounded-lg border border-green-200 bg-green-50 p-5">
            <h3 className="font-bold text-gray-900 mb-2">Où regarder légalement</h3>
            {videoUrl ? (
              <a
                href={film.youtube_embed_url || film.video_url || videoUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-green-800 font-semibold hover:text-green-900"
              >
                Vidéo officielle disponible <FiExternalLink size={16} />
              </a>
            ) : (
              <p className="text-gray-700">
                Aucune vidéo officielle vérifiée n'est associée à cette fiche pour le moment.
              </p>
            )}
          </div>
        </div>

        <aside className="hidden space-y-4 lg:sticky lg:top-24 lg:block lg:self-start">
          {similarFilmsSection}
        </aside>

        <div className="space-y-6">
          {/* Description */}
          <div>
            <h3 className="font-bold text-gray-900 mb-2">Synopsis</h3>
            <p className="break-words text-justify text-gray-700 leading-relaxed">{film.description}</p>
          </div>

          <div>
            <h3 className="font-bold text-gray-900 mb-2">Notre critique</h3>
            <p className="break-words text-gray-700 leading-relaxed">
              {film.editorial_review || film.review || film.critique || 'La critique éditoriale détaillée sera ajoutée après validation par la rédaction.'}
            </p>
          </div>

          {/* Key Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Réalisateur</p>
              <p className="font-semibold text-gray-900">{film.director || '—'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Producteur</p>
              <p className="font-semibold text-gray-900">{film.producer || '—'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Vues</p>
              <p className="font-semibold text-gray-900">{film.views || 0}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Statut</p>
              <p className="font-semibold text-gray-900 capitalize">{film.status}</p>
            </div>
          </div>

        </div>
      </div>

      {/* Cast Section */}
      {actors.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Distribution</h2>
          <div className="flex flex-wrap gap-3">
            {actors.map((actor, idx) => (
              <Link
                key={actor.id || idx}
                to={actor.slug ? `/acteurs/${actor.slug}` : '/acteurs'}
                className="break-words rounded-lg bg-gray-100 px-4 py-2 text-gray-700 transition hover:bg-red-50 hover:text-red-600"
              >
                {actor.name || actor}
                {actor.character_name ? ` (${actor.character_name})` : ''}
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="lg:hidden">
        {similarFilmsSection}
      </div>

    </div>
  );
};

export default FilmDetail;
