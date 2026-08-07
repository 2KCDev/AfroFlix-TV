import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FiArchive, FiEdit3, FiImage, FiPlus, FiRefreshCw, FiSave, FiSearch, FiUpload, FiX } from 'react-icons/fi';
import LoadingSpinner from '../common/LoadingSpinner';
import { api } from '../../services/api';
import { formatDate, truncateText } from '../../utils/content';
import { useLocale } from '../../hooks/useLocale';

const initialForms = {
  film: {
    title: '',
    slug: '',
    description: '',
    poster_url: '',
    director: '',
    country: 'Nigeria',
    year: '',
    youtube_embed_url: '',
    genres: [],
    actors: [],
  },
  actor: {
    name: '',
    biography: '',
    biography_en: '',
    birth_date: '',
    photo_url: '',
  },
  article: {
    title: '',
    title_en: '',
    content: '',
    content_en: '',
    category: 'Actualités',
    featured_image: '',
    author: 'Rédaction AFROFLIX.TV',
  },
  genre: {
    name: '',
    description: '',
  },
};

const tabs = [
  { id: 'film', label: 'Films' },
  { id: 'actor', label: 'Acteurs' },
  { id: 'article', label: 'Articles' },
  { id: 'genre', label: 'Genres' },
];

const categories = ['Actualités', 'Classements', 'Analyses', 'Conseils', 'Dossiers', 'Portraits', 'Guides'];

const ContentTableFilters = ({
  search,
  setSearch,
  status,
  setStatus,
  onSubmit,
  placeholder,
  c,
}) => (
  <form onSubmit={onSubmit} className="w-full rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
    <h4 className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-900">
      <FiSearch className="text-red-600" />
      {c.searchContent}
    </h4>
    <div className="space-y-3">
      <div>
        <label className="block min-w-0">
          <span className="sr-only">{c.keywords}</span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={placeholder}
            className="w-full rounded-lg border-2 border-red-600 px-4 py-3 outline-none focus:ring-2 focus:ring-red-500"
          />
        </label>
      </div>
      <label className="block">
        <span className="block text-sm font-semibold text-gray-700 mb-1">{c.status}</span>
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-red-500"
        >
          <option value="">{c.allStatuses}</option>
          <option value="published">{c.published}</option>
          <option value="draft">{c.draft}</option>
          <option value="archived">{c.archived}</option>
        </select>
      </label>
    </div>
  </form>
);

const AdminContentManager = ({ user }) => {
  const { language } = useLocale();
  const c = language === 'en' ? {
    searchContent: 'Content search', keywords: 'Keywords', status: 'Status', allStatuses: 'All statuses', published: 'Published', draft: 'Drafts', archived: 'Archived', contentSaved: 'Content saved successfully.', archiveSuccess: 'Content archived successfully.', restoreSuccess: 'Content restored successfully.', genreAdmin: 'Only an administrator can manage genres.', archiveFilmDenied: 'Only an administrator or the owning editor can archive this film.', archiveArticleDenied: 'Only an administrator or the owning editor can archive this article.', archiveActorDenied: 'Only an administrator or the owning editor can archive this actor.', deleteDenied: 'Only an administrator can delete or archive this content.', title: 'Content management', intro: 'Films, actors, articles and genres with minimum editorial validation.', refresh: 'Refresh', warningTitle: 'Non-negotiable point', warning: 'If there is any doubt about a video’s source, do not publish the embed. The site must remain an editorial platform with original content, not a streaming platform.', edit: 'Edit', add: 'Add', titleLabel: 'Title', englishTitle: 'English title', slug: 'URL identifier', originalDescription: 'Original description', posterImage: 'Poster image displayed on the site', director: 'Director', directorPlaceholder: 'Enter the director’s name', country: 'Country', year: 'Year', videoUrl: 'Official video link (YouTube URL or embed)', genres: 'Genres', actors: 'Actors', selectGenres: 'Select genres', searchGenre: 'Search for a genre...', noGenre: 'No genre found.', selectActors: 'Select actors', searchActor: 'Search for an actor...', noActor: 'No actor found.', name: 'Name', originalBio: 'Original biography', englishBio: 'English biography', translationHint: 'Optional: if left empty, visitors will see the French version.', birthDate: 'Date of birth (optional)', birthHelp: 'Leave this blank if it has not been shared publicly.', actorPhoto: 'Actor photo', category: 'Category', originalContent: 'Original content', englishContent: 'English content', mainImage: 'Main image', author: 'Author', seoIntro: 'Genre SEO introduction', saving: 'Saving...', save: 'Save', cancel: 'Cancel', filmSearch: 'Keywords: title, actor, director, genre...', actorSearch: 'Keywords: name, biography...', articleSearch: 'Keywords: title, content, category, author...', content: 'Content', details: 'Details', actions: 'Actions', restore: 'Restore', archive: 'Archive', noContent: 'No content available.', views: 'views', unknownYear: 'Year?', missingBio: 'Biography not provided', missingIntro: 'Introduction not provided', imagePreview: 'Image preview', uploadImage: 'Upload an image', pasteImageUrl: 'or paste an image URL', imageHelp: 'JPG, PNG, WebP or GIF, 5 MB maximum.', minimumCharacters: 'characters minimum', finalUrl: 'Normalised final URL', yourWord: 'your-word', slugPlaceholder: 'example: my-special-film', confirmArchive: 'Confirm archive', archiveWarning: 'This content will no longer be publicly visible. You can restore it later from this area.', confirmRestore: 'Confirm restore', restoreWarning: 'This content will become available again according to its publication rules. Check that it is ready to be restored.', archiveQuestion: 'Archive?', restoreQuestion: 'Restore?', tabLabels: { film: 'Films', actor: 'Actors', article: 'Articles', genre: 'Genres' }, categoryLabels: { 'Actualités': 'News', 'Classements': 'Rankings', Analyses: 'Analysis', Conseils: 'Tips', Dossiers: 'Features', Portraits: 'Profiles', Guides: 'Guides' }, locale: 'en-US', emptyDate: 'Not provided',
  } : {
    searchContent: 'Recherche de contenus', keywords: 'Mots clés', status: 'Statut', allStatuses: 'Tous les statuts', published: 'Publiés', draft: 'Brouillons', archived: 'Archives', contentSaved: 'Contenu enregistré avec succès.', archiveSuccess: 'Contenu archivé avec succès.', restoreSuccess: 'Contenu désarchivé avec succès.', genreAdmin: 'Seul un administrateur peut gérer les genres.', archiveFilmDenied: 'Seul un administrateur ou l’éditeur propriétaire peut archiver ce film.', archiveArticleDenied: 'Seul un administrateur ou l’éditeur propriétaire peut archiver cet article.', archiveActorDenied: 'Seul un administrateur ou l’éditeur propriétaire peut archiver cet acteur.', deleteDenied: 'Seul un administrateur peut supprimer ou archiver ce contenu.', title: 'Gestion des contenus', intro: 'Films, acteurs, articles et genres avec validation éditoriale minimale.', refresh: 'Actualiser', warningTitle: 'Point non négociable', warning: "En cas de doute sur l'origine d'une vidéo, ne pas publier l'embed. Le site doit rester une plateforme éditoriale avec contenus originaux, pas une plateforme de streaming.", edit: 'Modifier', add: 'Ajouter', titleLabel: 'Titre', englishTitle: 'Titre anglais', slug: 'Identifiant URL', originalDescription: 'Description originale', posterImage: "Image d'affiche visible sur le site", director: 'Réalisateur', directorPlaceholder: 'Saisir le nom du réalisateur', country: 'Pays', year: 'Année', videoUrl: 'Lien vidéo officiel (YouTube URL ou embed)', genres: 'Genres', actors: 'Acteurs', selectGenres: 'Sélectionner les genres', searchGenre: 'Rechercher un genre...', noGenre: 'Aucun genre trouvé.', selectActors: 'Sélectionner les acteurs', searchActor: 'Rechercher un acteur...', noActor: 'Aucun acteur trouvé.', name: 'Nom', originalBio: 'Biographie originale', englishBio: 'Biographie anglaise', translationHint: 'Facultatif : si ce champ est vide, les visiteurs verront la version française.', birthDate: 'Date de naissance (facultative)', birthHelp: 'Laissez ce champ vide si elle n’est pas communiquée publiquement.', actorPhoto: "Photo de l'acteur", category: 'Catégorie', originalContent: 'Contenu original', englishContent: 'Contenu anglais', mainImage: 'Image principale', author: 'Auteur', seoIntro: 'Introduction SEO du genre', saving: 'Enregistrement...', save: 'Enregistrer', cancel: 'Annuler', filmSearch: 'Mots clés: titre, acteur, réalisateur, genre...', actorSearch: 'Mots clés: nom, biographie...', articleSearch: 'Mots clés: titre, contenu, catégorie, auteur...', content: 'Contenu', details: 'Détails', actions: 'Actions', restore: 'Désarchiver', archive: 'Archiver', noContent: 'Aucun contenu disponible.', views: 'vues', unknownYear: 'Année ?', missingBio: 'Biographie non renseignée', missingIntro: 'Introduction non renseignée', imagePreview: 'Aperçu image', uploadImage: 'Uploader une image', pasteImageUrl: "ou coller une URL d'image", imageHelp: 'JPG, PNG, WebP ou GIF, 5 Mo maximum.', minimumCharacters: 'caractères minimum', finalUrl: 'URL finale normalisée', yourWord: 'votre-mot', slugPlaceholder: 'exemple: mon-film-special', confirmArchive: 'Confirmer l’archivage', archiveWarning: 'Ce contenu ne sera plus visible publiquement. Vous pourrez le désarchiver plus tard depuis cet espace.', confirmRestore: 'Confirmer le désarchivage', restoreWarning: 'Ce contenu redeviendra disponible selon ses règles de publication. Vérifiez qu’il est prêt à être restauré.', archiveQuestion: 'Archiver ?', restoreQuestion: 'Désarchiver ?', tabLabels: { film: 'Films', actor: 'Acteurs', article: 'Articles', genre: 'Genres' }, locale: 'fr-FR', emptyDate: 'Non renseigné',
  };
  const [activeType, setActiveType] = useState('film');
  const [forms, setForms] = useState(initialForms);
  const [data, setData] = useState({ films: [], actors: [], articles: [], genres: [] });
  const [filmOptions, setFilmOptions] = useState({ actors: [], genres: [] });
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [imageFiles, setImageFiles] = useState({ film: null, actor: null, article: null });
  const [message, setMessage] = useState('');
  const [filmSearch, setFilmSearch] = useState('');
  const [filmStatus, setFilmStatus] = useState('');
  const [actorSearch, setActorSearch] = useState('');
  const [actorStatus, setActorStatus] = useState('');
  const [articleSearch, setArticleSearch] = useState('');
  const [articleStatus, setArticleStatus] = useState('');
  const [pendingAction, setPendingAction] = useState(null);
  const formRef = useRef(null);

  const canManageGenres = user?.role === 'admin';
  const canDelete = user?.role === 'admin';
  const canArchiveFilm = user?.role === 'admin' || user?.role === 'editor';
  const canArchiveArticle = user?.role === 'admin' || user?.role === 'editor';

  const load = async () => {
    setLoading(true);
    try {
      const [films, actors, articles, genres, actorOptions] = await Promise.all([
        api.adminFilms({
          page: 1,
          limit: 100,
          ...(filmSearch.trim().length >= 2 && { q: filmSearch.trim() }),
          ...(filmStatus && { status: filmStatus }),
        }),
        api.adminActors({
          page: 1,
          limit: 100,
          ...(actorSearch.trim().length >= 2 && { search: actorSearch.trim() }),
          ...(actorStatus && { status: actorStatus }),
        }),
        api.adminArticles({
          page: 1,
          limit: 100,
          ...(articleSearch.trim().length >= 2 && { q: articleSearch.trim() }),
          ...(articleStatus && { status: articleStatus }),
        }),
        user?.role === 'admin' ? api.adminGenres() : api.filmGenreOptions(),
        api.filmActorOptions(),
      ]);

      const genreList = Array.isArray(genres) ? genres : genres.genres || [];

      setData({
        films: films.data || films.films || [],
        actors: actors.actors || [],
        articles: articles.articles || [],
        genres: genreList,
      });
      setFilmOptions({
        actors: actorOptions.actors || [],
        genres: genreList,
      });
      setMessage('');
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      load();
    }, 350);

    return () => window.clearTimeout(timer);
  }, [filmSearch, filmStatus, actorSearch, actorStatus, articleSearch, articleStatus]);

  const applyTableFilters = async (event) => {
    event.preventDefault();
    await load();
  };

  const currentForm = forms[activeType];

  const setField = (field, value) => {
    setForms((prev) => ({
      ...prev,
      [activeType]: {
        ...prev[activeType],
        [field]: value,
      },
    }));
  };

  const resetForm = () => {
    setEditing(null);
    setImageFiles((prev) => ({ ...prev, [activeType]: null }));
    setForms((prev) => ({ ...prev, [activeType]: initialForms[activeType] }));
  };

  const editItem = (type, item) => {
    setActiveType(type);
    setEditing(item);
    setImageFiles((prev) => ({ ...prev, [type]: null }));
    const values = {
      film: {
        title: item.title || '',
        slug: item.slug || '',
        description: item.description || '',
        poster_url: item.poster_url || '',
        director: item.director || '',
        country: item.country || '',
        year: item.year || '',
        youtube_embed_url: item.youtube_embed_url || '',
        genres: item.genres?.map((genre) => genre.slug) || [],
        actors: item.actors?.map((actor) => String(actor.id)) || [],
      },
      actor: {
        name: item.name || '',
        biography: item.biography || '',
        biography_en: item.biography_en || '',
        birth_date: item.birth_date ? item.birth_date.slice(0, 10) : '',
        photo_url: item.photo_url || '',
      },
      article: {
        title: item.title || '',
        title_en: item.title_en || '',
        content: item.content || '',
        content_en: item.content_en || '',
        category: item.category || 'Actualités',
        featured_image: item.featured_image || '',
        author: item.author || 'Rédaction AFROFLIX.TV',
      },
      genre: {
        name: item.name || '',
        description: item.description || '',
      },
    };
    setForms((prev) => ({ ...prev, [type]: values[type] }));
    window.setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      formRef.current?.querySelector('input, select, textarea')?.focus({ preventScroll: true });
    }, 0);
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const payload = { ...currentForm };
      if (payload.year) payload.year = Number(payload.year);

      if (activeType === 'film') {
        if (imageFiles.film) {
          const upload = await api.uploadImage(imageFiles.film, 'film');
          payload.poster_url = upload.url;
        }
        payload.slug = payload.slug?.trim().slice(0, editing ? 255 : 30) || '';
        payload.poster_url = payload.poster_url?.trim() || '';
        payload.youtube_embed_url = payload.youtube_embed_url?.trim() || '';
        editing ? await api.updateFilm(editing.id, payload) : await api.createFilm(payload);
      }
      if (activeType === 'actor') {
        if (imageFiles.actor) {
          const upload = await api.uploadImage(imageFiles.actor, 'actor');
          payload.photo_url = upload.url;
        }
        payload.photo_url = payload.photo_url?.trim() || '';
        editing ? await api.updateActor(editing.id, payload) : await api.createActor(payload);
      }
      if (activeType === 'article') {
        if (imageFiles.article) {
          const upload = await api.uploadImage(imageFiles.article, 'article');
          payload.featured_image = upload.url;
        }
        payload.featured_image = payload.featured_image?.trim() || '';
        editing ? await api.updateArticle(editing.id, payload) : await api.createArticle(payload);
      }
      if (activeType === 'genre') {
        if (!canManageGenres) throw new Error(c.genreAdmin);
        editing ? await api.updateGenre(editing.id, payload) : await api.createGenre(payload);
      }

      resetForm();
      await load();
      setMessage(c.contentSaved);
    } catch (err) {
      setMessage(err.message);
    } finally {
      setSaving(false);
    }
  };

  const canManageAction = (type, item) => {
    if (type === 'film' && !canArchiveFilm) {
      setMessage(c.archiveFilmDenied);
      return false;
    }
    if (type === 'article' && !canArchiveArticle) {
      setMessage(c.archiveArticleDenied);
      return false;
    }
    if (type === 'actor' && !['admin', 'editor'].includes(user?.role)) {
      setMessage(c.archiveActorDenied);
      return false;
    }
    if (!['film', 'article', 'actor'].includes(type) && !canDelete) {
      setMessage(c.deleteDenied);
      return false;
    }
    if (type === 'actor') return canManageRow(type, item, user, true);
    return true;
  };

  const requestArchive = (type, item) => {
    if (!canManageAction(type, item)) return;
    setPendingAction({ mode: 'archive', type, item, step: 1 });
  };

  const requestRestore = (type, item) => {
    if (!canManageAction(type, item)) return;
    setPendingAction({ mode: 'restore', type, item, step: 1 });
  };

  const executePendingAction = async () => {
    if (!pendingAction) return;
    if (pendingAction.step === 1) {
      setPendingAction((current) => ({ ...current, step: 2 }));
      return;
    }

    const { mode, type, item } = pendingAction;
    try {
      if (mode === 'archive') {
        if (type === 'film') await api.deleteFilm(item.id);
        if (type === 'actor') await api.deleteActor(item.id);
        if (type === 'article') await api.deleteArticle(item.id);
        if (type === 'genre') await api.deleteGenre(item.id);
      } else {
        if (type === 'film') await api.restoreFilm(item.id);
        if (type === 'actor') await api.restoreActor(item.id);
        if (type === 'article') await api.restoreArticle(item.id);
        if (type === 'genre') await api.restoreGenre(item.id);
      }
      setPendingAction(null);
      await load();
      setMessage(mode === 'archive' ? c.archiveSuccess : c.restoreSuccess);
    } catch (err) {
      setMessage(err.message);
    }
  };

  const rows = useMemo(() => ({
    film: data.films,
    actor: data.actors,
    article: data.articles,
    genre: data.genres,
  }), [data]);

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{c.title}</h2>
          <p className="text-gray-600">{c.intro}</p>
        </div>
        <button onClick={load} className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-semibold">
          <FiRefreshCw size={16} />
          {c.refresh}
        </button>
      </div>

      {user?.role === 'editor' && (
        <div className="rounded-lg border border-orange-200 bg-orange-50 p-5">
          <h3 className="mb-2 font-bold text-gray-900">{c.warningTitle}</h3>
          <p className="text-sm text-gray-700">
            {c.warning}
          </p>
        </div>
      )}

      {message && (
        <div className={`border rounded-lg p-4 ${[c.contentSaved, c.archiveSuccess, c.restoreSuccess].includes(message) ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
          {message}
        </div>
      )}

      <div className="flex gap-2 flex-wrap border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveType(tab.id);
              setEditing(null);
            }}
            disabled={tab.id === 'genre' && !canManageGenres}
            className={`px-4 py-3 font-semibold border-b-2 transition ${
              activeType === tab.id
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            } disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            {c.tabLabels[tab.id]}
          </button>
        ))}
      </div>

      <div className="space-y-6">
        <form ref={formRef} onSubmit={submit} className="w-full bg-white rounded-lg shadow-md p-6 space-y-4">
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <FiPlus className="text-red-600" />
            {editing ? c.edit : c.add} {c.tabLabels[activeType].toLowerCase()}
          </h3>

          {activeType === 'film' && (
            <>
              <TextInput label={c.titleLabel} value={currentForm.title} onChange={(value) => setField('title', value)} required />
              <SlugInput
                label={c.slug}
                value={currentForm.slug}
                onChange={(value) => setField('slug', value)}
                required
                maxLength={editing ? 255 : 30}
                c={c}
              />
              <TextArea label={c.originalDescription} value={currentForm.description} onChange={(value) => setField('description', value)} minLength={300} required c={c} />
              <ImageUpload
                label={c.posterImage}
                file={imageFiles.film}
                imageUrl={currentForm.poster_url}
                onFileChange={(file) => setImageFiles((prev) => ({ ...prev, film: file }))}
                onUrlChange={(value) => setField('poster_url', value)}
                c={c}
              />
              <TextInput
                label={c.director}
                value={currentForm.director}
                onChange={(value) => setField('director', value)}
                required
                placeholder={c.directorPlaceholder}
              />
              <div className="grid grid-cols-2 gap-3">
                <TextInput label={c.country} value={currentForm.country} onChange={(value) => setField('country', value)} />
                <TextInput label={c.year} type="number" value={currentForm.year} onChange={(value) => setField('year', value)} />
              </div>
              <TextInput
                label={c.videoUrl}
                value={currentForm.youtube_embed_url}
                onChange={(value) => setField('youtube_embed_url', value)}
                placeholder="https://www.youtube.com/watch?v=..."
              />
              <MultiSelectDropdown
                label={c.genres}
                options={filmOptions.genres}
                value={currentForm.genres}
                onChange={(value) => setField('genres', value)}
                placeholder={c.selectGenres}
                searchPlaceholder={c.searchGenre}
                emptyMessage={c.noGenre}
              />
              <MultiSelectDropdown
                label={c.actors}
                options={filmOptions.actors}
                value={currentForm.actors}
                onChange={(value) => setField('actors', value)}
                valueKey="id"
                placeholder={c.selectActors}
                searchPlaceholder={c.searchActor}
                emptyMessage={c.noActor}
              />
            </>
          )}

          {activeType === 'actor' && (
            <>
              <TextInput label={c.name} value={currentForm.name} onChange={(value) => setField('name', value)} required />
              <TextArea label={c.originalBio} value={currentForm.biography} onChange={(value) => setField('biography', value)} minLength={150} c={c} />
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <TextArea label={c.englishBio} value={currentForm.biography_en} onChange={(value) => setField('biography_en', value)} minLength={150} c={c} />
                <p className="mt-2 text-xs text-blue-800">{c.translationHint}</p>
              </div>
              <div>
                <TextInput label={c.birthDate} type="date" value={currentForm.birth_date} onChange={(value) => setField('birth_date', value)} />
                <p className="mt-1 text-xs text-gray-500">{c.birthHelp}</p>
              </div>
              <ImageUpload
                label={c.actorPhoto}
                file={imageFiles.actor}
                imageUrl={currentForm.photo_url}
                onFileChange={(file) => setImageFiles((prev) => ({ ...prev, actor: file }))}
                onUrlChange={(value) => setField('photo_url', value)}
                previewClassName="aspect-square"
                c={c}
              />
            </>
          )}

          {activeType === 'article' && (
            <>
              <TextInput label={c.titleLabel} value={currentForm.title} onChange={(value) => setField('title', value)} required />
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <TextInput label={c.englishTitle} value={currentForm.title_en} onChange={(value) => setField('title_en', value)} />
                <p className="mt-2 text-xs text-blue-800">{c.translationHint}</p>
              </div>
              <label className="block">
                <span className="block text-sm font-semibold text-gray-700 mb-1">{c.category}</span>
                <select
                  value={currentForm.category}
                  onChange={(event) => setField('category', event.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                >
                  {categories.map((category) => <option key={category} value={category}>{c.categoryLabels?.[category] || category}</option>)}
                </select>
              </label>
              <TextArea label={c.originalContent} value={currentForm.content} onChange={(value) => setField('content', value)} minLength={600} required c={c} />
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <TextArea label={c.englishContent} value={currentForm.content_en} onChange={(value) => setField('content_en', value)} minLength={600} c={c} />
                <p className="mt-2 text-xs text-blue-800">{c.translationHint}</p>
              </div>
              <ImageUpload
                label={c.mainImage}
                file={imageFiles.article}
                imageUrl={currentForm.featured_image}
                onFileChange={(file) => setImageFiles((prev) => ({ ...prev, article: file }))}
                onUrlChange={(value) => setField('featured_image', value)}
                previewClassName="aspect-video"
                c={c}
              />
              <TextInput label={c.author} value={currentForm.author} onChange={(value) => setField('author', value)} />
            </>
          )}

          {activeType === 'genre' && (
            <>
              <TextInput label={c.name} value={currentForm.name} onChange={(value) => setField('name', value)} required />
              <TextArea label={c.seoIntro} value={currentForm.description} onChange={(value) => setField('description', value)} c={c} />
            </>
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-semibold"
            >
              <FiSave size={16} />
              {saving ? c.saving : c.save}
            </button>
            {editing && (
              <button type="button" onClick={resetForm} className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-semibold">
                <FiX size={16} />
                {c.cancel}
              </button>
            )}
          </div>

        </form>

        <div className="w-full">
          {activeType === 'film' && (
            <div className="mb-4">
              <ContentTableFilters
                search={filmSearch}
                setSearch={setFilmSearch}
                status={filmStatus}
                setStatus={setFilmStatus}
                onSubmit={applyTableFilters}
                placeholder={c.filmSearch}
                c={c}
              />
            </div>
          )}
          {activeType === 'actor' && (
            <div className="mb-4">
              <ContentTableFilters
                search={actorSearch}
                setSearch={setActorSearch}
                status={actorStatus}
                setStatus={setActorStatus}
                onSubmit={applyTableFilters}
                placeholder={c.actorSearch}
                c={c}
              />
            </div>
          )}
          {activeType === 'article' && (
            <div className="mb-4">
              <ContentTableFilters
                search={articleSearch}
                setSearch={setArticleSearch}
                status={articleStatus}
                setStatus={setArticleStatus}
                onSubmit={applyTableFilters}
                placeholder={c.articleSearch}
                c={c}
              />
            </div>
          )}
          {loading ? (
            <LoadingSpinner />
          ) : (
            <ContentTable
              type={activeType}
              rows={rows[activeType]}
              user={user}
              onEdit={(item) => editItem(activeType, item)}
              onArchive={(item) => requestArchive(activeType, item)}
              onRestore={(item) => requestRestore(activeType, item)}
              canDelete={activeType === 'film' ? canArchiveFilm : activeType === 'article' ? canArchiveArticle : activeType === 'actor' ? user?.role === 'admin' || user?.role === 'editor' : canDelete}
              c={c}
              locale={c.locale}
              emptyDate={c.emptyDate}
            />
          )}
        </div>
      </div>
      <ArchiveConfirmDialog
        action={pendingAction}
        onCancel={() => setPendingAction(null)}
        onConfirm={executePendingAction}
        c={c}
      />
    </section>
  );
};

const TextInput = ({ label, value, onChange, type = 'text', required, placeholder, onKeyDown, maxLength }) => (
  <label className="block min-w-0">
    <span className="block text-sm font-semibold text-gray-700 mb-1">{label}</span>
    <input
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      required={required}
      placeholder={placeholder}
      onKeyDown={onKeyDown}
      maxLength={maxLength}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
    />
  </label>
);

const MultiSelectDropdown = ({
  label,
  options = [],
  value = [],
  onChange,
  valueKey = 'slug',
  labelKey = 'name',
  placeholder = 'Sélectionner',
  searchPlaceholder = 'Rechercher...',
  emptyMessage = 'Aucun résultat trouvé.',
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const normalizedValue = value.map(String);
  const selectedLabels = options
    .filter((option) => normalizedValue.includes(String(option[valueKey])))
    .map((option) => option[labelKey]);
  const filtered = options.filter((option) => String(option[labelKey] || '').toLowerCase().includes(search.toLowerCase()));

  const toggleValue = (optionValue) => {
    const nextValue = String(optionValue);
    onChange(normalizedValue.includes(nextValue)
      ? normalizedValue.filter((item) => item !== nextValue)
      : [...normalizedValue, nextValue]);
  };

  return (
    <div className="relative">
      <span className="block text-sm font-semibold text-gray-700 mb-1">{label}</span>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between gap-3 rounded-lg border border-gray-300 bg-white px-3 py-2 text-left outline-none focus:ring-2 focus:ring-red-500"
      >
        <span className="min-w-0 truncate text-gray-800">
          {selectedLabels.length ? selectedLabels.join(', ') : placeholder}
        </span>
        <span className="text-gray-400">▾</span>
      </button>
      {open && (
        <div className="absolute z-20 mt-2 w-full rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={searchPlaceholder}
            className="mb-2 w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-red-500"
          />
          <div className="max-h-56 space-y-1 overflow-y-auto">
            {filtered.map((option) => (
              <label key={option.id} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 hover:bg-red-50">
                <input
                  type="checkbox"
                  checked={normalizedValue.includes(String(option[valueKey]))}
                  onChange={() => toggleValue(option[valueKey])}
                  className="h-4 w-4 accent-red-600"
                />
                <span className="text-sm font-medium text-gray-800">{option[labelKey]}</span>
              </label>
            ))}
            {!filtered.length && <p className="px-2 py-3 text-sm text-gray-500">{emptyMessage}</p>}
          </div>
        </div>
      )}
    </div>
  );
};

const previewSlug = (value = '') => value
  .toString()
  .trim()
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

const SlugInput = ({ label, value, onChange, required, maxLength = 255, c }) => {
  const slug = previewSlug(value);

  return (
    <label className="block">
      <span className="block text-sm font-semibold text-gray-700 mb-1">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        maxLength={maxLength}
        placeholder={c.slugPlaceholder}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
      />
      <span className="mt-1 block text-xs text-gray-500">
        {c.finalUrl}: /films/{previewSlug(slug) || c.yourWord} · {slug.length}/{maxLength}
      </span>
    </label>
  );
};

const ImageUpload = ({ label, file, imageUrl, onFileChange, onUrlChange, previewClassName = 'aspect-[2/3]', c }) => {
  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : imageUrl), [file, imageUrl]);

  useEffect(() => {
    return () => {
      if (file && previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [file, previewUrl]);

  return (
    <div className="space-y-2">
      <span className="block text-sm font-semibold text-gray-700">{label}</span>
      <div className="grid gap-3 sm:grid-cols-[96px_1fr]">
        <div className={`relative overflow-hidden rounded-lg border border-gray-200 bg-gray-100 ${previewClassName}`}>
          {previewUrl ? (
            <img src={previewUrl} alt={c.imagePreview} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-gray-400">
              <FiImage size={28} />
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-black/10">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-red-600 shadow">
              <FiUpload size={16} />
            </span>
          </div>
        </div>
        <div className="space-y-2">
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-red-300 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50">
            <FiUpload size={16} />
            {c.uploadImage}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={(event) => onFileChange(event.target.files?.[0] || null)}
              className="sr-only"
            />
          </label>
          <input
            type="url"
            value={imageUrl}
            onChange={(event) => onUrlChange(event.target.value)}
            placeholder={c.pasteImageUrl}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-red-500"
          />
          <p className="text-xs text-gray-500">{c.imageHelp}</p>
        </div>
      </div>
    </div>
  );
};

const TextArea = ({ label, value, onChange, minLength, required, c }) => (
  <label className="block">
    <span className="block text-sm font-semibold text-gray-700 mb-1">{label}</span>
    <textarea
      value={value}
      onChange={(event) => onChange(event.target.value)}
      minLength={minLength}
      required={required}
      rows={5}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none resize-y"
    />
    {minLength && <span className="text-xs text-gray-500">{value.length}/{minLength} {c.minimumCharacters}</span>}
  </label>
);

const canManageRow = (type, item, user, canDelete) => {
  if (type !== 'actor') return canDelete;
  if (user?.role === 'admin') return true;
  return user?.role === 'editor' && String(item.created_by ?? item.createdBy ?? '') === String(user?.id ?? '');
};

const ArchiveConfirmDialog = ({ action, onCancel, onConfirm, c }) => {
  if (!action) return null;

  const labels = action.mode === 'archive'
    ? { title: c.confirmArchive, warning: c.archiveWarning, firstLabel: c.archiveQuestion, finalLabel: c.archive }
    : { title: c.confirmRestore, warning: c.restoreWarning, firstLabel: c.restoreQuestion, finalLabel: c.restore };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-start gap-3">
          <span className="mt-1 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
            <FiArchive size={20} />
          </span>
          <div>
            <h3 className="text-lg font-bold text-gray-900">{labels.title}</h3>
            <p className="mt-1 text-sm text-gray-600">{labels.warning}</p>
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-gray-300 px-4 py-2 font-semibold text-gray-700 hover:bg-gray-50"
          >
            {c.cancel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-lg bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700"
          >
            {action.step === 1 ? labels.firstLabel : labels.finalLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

const ContentTable = ({ type, rows, user, onEdit, onArchive, onRestore, canDelete, c, locale, emptyDate }) => (
  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-gray-600">
          <tr>
            <th className="text-left px-4 py-3">{c.content}</th>
            <th className="text-left px-4 py-3">{c.details}</th>
            <th className="text-right px-4 py-3">{c.actions}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((item) => {
            const canManage = canManageRow(type, item, user, canDelete);
            const isArchived = item.status === 'archived';

            return (
            <tr key={item.id} className="border-t border-gray-100">
              <td className="px-4 py-3 min-w-64">
                <p className="font-bold text-gray-900">{item.title || item.name}</p>
                <p className="text-gray-500">{item.slug}</p>
              </td>
              <td className="px-4 py-3 text-gray-600">
                {type === 'film' && <span>{item.year || c.unknownYear} · {item.status || 'published'} · {Number(item.views || 0).toLocaleString()} {c.views}</span>}
                {type === 'actor' && <span>{item.status || 'published'} · {truncateText(item.biography || c.missingBio, 90)}</span>}
                {type === 'article' && <span>{item.category} · {item.status || 'published'} · {formatDate(item.published_at || item.created_at, locale, emptyDate)}</span>}
                {type === 'genre' && <span>{item.status || 'published'} · {truncateText(item.description || c.missingIntro, 90)}</span>}
              </td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => canManage && onEdit(item)}
                    disabled={!canManage}
                    className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white"
                  >
                    <FiEdit3 size={16} />
                    {c.edit}
                  </button>
                  <button
                    onClick={() => canManage && (isArchived ? onRestore(item) : onArchive(item))}
                    disabled={!canManage}
                    className={`inline-flex items-center gap-2 px-3 py-2 border rounded-lg disabled:opacity-40 disabled:cursor-not-allowed ${
                      isArchived
                        ? 'border-green-200 text-green-700 hover:bg-green-50'
                        : 'border-red-200 text-red-600 hover:bg-red-50'
                    }`}
                  >
                    <FiArchive size={16} />
                    {isArchived ? c.restore : c.archive}
                  </button>
                </div>
              </td>
            </tr>
            );
          })}
          {!rows.length && (
            <tr>
              <td colSpan="3" className="px-4 py-8 text-center text-gray-500">
                {c.noContent}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
);

export default AdminContentManager;
