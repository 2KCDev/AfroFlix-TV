import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FiArchive, FiEdit3, FiImage, FiPlus, FiRefreshCw, FiSave, FiSearch, FiUpload, FiX } from 'react-icons/fi';
import LoadingSpinner from '../common/LoadingSpinner';
import { api } from '../../services/api';
import { formatDate, truncateText } from '../../utils/content';

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
    birth_date: '',
    photo_url: '',
  },
  article: {
    title: '',
    content: '',
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

const categories = ['Actualités', 'Classements', 'Analyses', 'Conseils'];

const ContentTableFilters = ({
  search,
  setSearch,
  status,
  setStatus,
  onSubmit,
  placeholder,
}) => (
  <form onSubmit={onSubmit} className="w-full rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
    <h4 className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-900">
      <FiSearch className="text-red-600" />
      Recherche de contenus
    </h4>
    <div className="space-y-3">
      <div>
        <label className="block min-w-0">
          <span className="sr-only">Mots clés</span>
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
        <span className="block text-sm font-semibold text-gray-700 mb-1">Statut</span>
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-red-500"
        >
          <option value="">Tous les statuts</option>
          <option value="published">Publiés</option>
          <option value="draft">Brouillons</option>
          <option value="archived">Archives</option>
        </select>
      </label>
    </div>
  </form>
);

const AdminContentManager = ({ user }) => {
  const [activeType, setActiveType] = useState('film');
  const [forms, setForms] = useState(initialForms);
  const [data, setData] = useState({ films: [], actors: [], articles: [], genres: [] });
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
      const [films, actors, articles, genres] = await Promise.all([
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
        api.adminGenres(),
      ]);

      setData({
        films: films.data || films.films || [],
        actors: actors.actors || [],
        articles: articles.articles || [],
        genres: Array.isArray(genres) ? genres : genres.genres || [],
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
        birth_date: item.birth_date ? item.birth_date.slice(0, 10) : '',
        photo_url: item.photo_url || '',
      },
      article: {
        title: item.title || '',
        content: item.content || '',
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
        payload.slug = payload.slug?.trim().slice(0, 30) || '';
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
        if (!canManageGenres) throw new Error('Seul un administrateur peut gérer les genres.');
        editing ? await api.updateGenre(editing.id, payload) : await api.createGenre(payload);
      }

      resetForm();
      await load();
      setMessage('Contenu enregistré avec succès.');
    } catch (err) {
      setMessage(err.message);
    } finally {
      setSaving(false);
    }
  };

  const canManageAction = (type, item) => {
    if (type === 'film' && !canArchiveFilm) {
      setMessage('Seul un administrateur ou l’éditeur propriétaire peut archiver ce film.');
      return false;
    }
    if (type === 'article' && !canArchiveArticle) {
      setMessage('Seul un administrateur ou l’éditeur propriétaire peut archiver cet article.');
      return false;
    }
    if (type === 'actor' && !['admin', 'editor'].includes(user?.role)) {
      setMessage('Seul un administrateur ou l’éditeur propriétaire peut archiver cet acteur.');
      return false;
    }
    if (!['film', 'article', 'actor'].includes(type) && !canDelete) {
      setMessage('Seul un administrateur peut supprimer ou archiver ce contenu.');
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
      setMessage(mode === 'archive' ? 'Contenu archivé avec succès.' : 'Contenu désarchivé avec succès.');
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
          <h2 className="text-2xl font-bold text-gray-900">Gestion des contenus</h2>
          <p className="text-gray-600">Films, acteurs, articles et genres avec validation éditoriale minimale.</p>
        </div>
        <button onClick={load} className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-semibold">
          <FiRefreshCw size={16} />
          Actualiser
        </button>
      </div>

      {message && (
        <div className={`border rounded-lg p-4 ${message.includes('succès') ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
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
            {tab.label}
          </button>
        ))}
      </div>

      <div className="space-y-6">
        <form ref={formRef} onSubmit={submit} className="w-full bg-white rounded-lg shadow-md p-6 space-y-4">
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <FiPlus className="text-red-600" />
            {editing ? 'Modifier' : 'Ajouter'} {tabs.find((tab) => tab.id === activeType)?.label.toLowerCase()}
          </h3>

          {activeType === 'film' && (
            <>
              <TextInput label="Titre" value={currentForm.title} onChange={(value) => setField('title', value)} required />
              <SlugInput
                label="Identifiant URL"
                value={currentForm.slug}
                onChange={(value) => setField('slug', value)}
                required
              />
              <TextArea label="Description originale" value={currentForm.description} onChange={(value) => setField('description', value)} minLength={300} required />
              <ImageUpload
                label="Image d'affiche visible sur le site"
                file={imageFiles.film}
                imageUrl={currentForm.poster_url}
                onFileChange={(file) => setImageFiles((prev) => ({ ...prev, film: file }))}
                onUrlChange={(value) => setField('poster_url', value)}
              />
              <TextInput
                label="Réalisateur"
                value={currentForm.director}
                onChange={(value) => setField('director', value)}
                required
                placeholder="Saisir le nom du réalisateur"
              />
              <div className="grid grid-cols-2 gap-3">
                <TextInput label="Pays" value={currentForm.country} onChange={(value) => setField('country', value)} />
                <TextInput label="Année" type="number" value={currentForm.year} onChange={(value) => setField('year', value)} />
              </div>
              <TextInput
                label="Lien vidéo officiel (YouTube URL ou embed)"
                value={currentForm.youtube_embed_url}
                onChange={(value) => setField('youtube_embed_url', value)}
                placeholder="https://www.youtube.com/watch?v=..."
              />
              <MultiSelectDropdown
                label="Genres"
                options={data.genres}
                value={currentForm.genres}
                onChange={(value) => setField('genres', value)}
                placeholder="Sélectionner les genres"
                searchPlaceholder="Rechercher un genre..."
                emptyMessage="Aucun genre trouvé."
              />
              <MultiSelectDropdown
                label="Acteurs"
                options={data.actors}
                value={currentForm.actors}
                onChange={(value) => setField('actors', value)}
                valueKey="id"
                placeholder="Sélectionner les acteurs"
                searchPlaceholder="Rechercher un acteur..."
                emptyMessage="Aucun acteur trouvé."
              />
            </>
          )}

          {activeType === 'actor' && (
            <>
              <TextInput label="Nom" value={currentForm.name} onChange={(value) => setField('name', value)} required />
              <TextArea label="Biographie originale" value={currentForm.biography} onChange={(value) => setField('biography', value)} minLength={150} />
              <TextInput label="Date de naissance" type="date" value={currentForm.birth_date} onChange={(value) => setField('birth_date', value)} />
              <ImageUpload
                label="Photo de l'acteur"
                file={imageFiles.actor}
                imageUrl={currentForm.photo_url}
                onFileChange={(file) => setImageFiles((prev) => ({ ...prev, actor: file }))}
                onUrlChange={(value) => setField('photo_url', value)}
                previewClassName="aspect-square"
              />
            </>
          )}

          {activeType === 'article' && (
            <>
              <TextInput label="Titre" value={currentForm.title} onChange={(value) => setField('title', value)} required />
              <label className="block">
                <span className="block text-sm font-semibold text-gray-700 mb-1">Catégorie</span>
                <select
                  value={currentForm.category}
                  onChange={(event) => setField('category', event.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                >
                  {categories.map((category) => <option key={category} value={category}>{category}</option>)}
                </select>
              </label>
              <TextArea label="Contenu original" value={currentForm.content} onChange={(value) => setField('content', value)} minLength={600} required />
              <ImageUpload
                label="Image principale"
                file={imageFiles.article}
                imageUrl={currentForm.featured_image}
                onFileChange={(file) => setImageFiles((prev) => ({ ...prev, article: file }))}
                onUrlChange={(value) => setField('featured_image', value)}
                previewClassName="aspect-video"
              />
              <TextInput label="Auteur" value={currentForm.author} onChange={(value) => setField('author', value)} />
            </>
          )}

          {activeType === 'genre' && (
            <>
              <TextInput label="Nom" value={currentForm.name} onChange={(value) => setField('name', value)} required />
              <TextArea label="Introduction SEO du genre" value={currentForm.description} onChange={(value) => setField('description', value)} />
            </>
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-semibold"
            >
              <FiSave size={16} />
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
            {editing && (
              <button type="button" onClick={resetForm} className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-semibold">
                <FiX size={16} />
                Annuler
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
                placeholder="Mots clés: titre, acteur, réalisateur, genre..."
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
                placeholder="Mots clés: nom, biographie..."
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
                placeholder="Mots clés: titre, contenu, catégorie, auteur..."
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
            />
          )}
        </div>
      </div>
      <ArchiveConfirmDialog
        action={pendingAction}
        onCancel={() => setPendingAction(null)}
        onConfirm={executePendingAction}
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

const SlugInput = ({ label, value, onChange, required }) => {
  const slug = previewSlug(value);

  return (
    <label className="block">
      <span className="block text-sm font-semibold text-gray-700 mb-1">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        maxLength={30}
        placeholder="exemple: mon-film-special"
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
      />
      <span className="mt-1 block text-xs text-gray-500">
        URL finale: /films/{slug || 'votre-mot'} · {slug.length}/30
      </span>
    </label>
  );
};

const ImageUpload = ({ label, file, imageUrl, onFileChange, onUrlChange, previewClassName = 'aspect-[2/3]' }) => {
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
            <img src={previewUrl} alt="Aperçu image" className="h-full w-full object-cover" />
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
            Uploader une image
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
            placeholder="ou coller une URL d'image"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-red-500"
          />
          <p className="text-xs text-gray-500">JPG, PNG, WebP ou GIF, 5 Mo maximum.</p>
        </div>
      </div>
    </div>
  );
};

const TextArea = ({ label, value, onChange, minLength, required }) => (
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
    {minLength && <span className="text-xs text-gray-500">{value.length}/{minLength} caractères minimum</span>}
  </label>
);

const canManageRow = (type, item, user, canDelete) => {
  if (type !== 'actor') return canDelete;
  if (user?.role === 'admin') return true;
  return user?.role === 'editor' && String(item.created_by ?? item.createdBy ?? '') === String(user?.id ?? '');
};

const archiveActionLabels = {
  archive: {
    title: 'Confirmer l’archivage',
    warning: 'Ce contenu ne sera plus visible publiquement. Vous pourrez le désarchiver plus tard depuis cet espace.',
    firstLabel: 'Archiver ?',
    finalLabel: 'Archiver',
  },
  restore: {
    title: 'Confirmer le désarchivage',
    warning: 'Ce contenu redeviendra disponible selon ses règles de publication. Vérifiez qu’il est prêt à être restauré.',
    firstLabel: 'Désarchiver ?',
    finalLabel: 'Désarchiver',
  },
};

const ArchiveConfirmDialog = ({ action, onCancel, onConfirm }) => {
  if (!action) return null;

  const labels = archiveActionLabels[action.mode];

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
            Annuler
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

const ContentTable = ({ type, rows, user, onEdit, onArchive, onRestore, canDelete }) => (
  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-gray-600">
          <tr>
            <th className="text-left px-4 py-3">Contenu</th>
            <th className="text-left px-4 py-3">Détails</th>
            <th className="text-right px-4 py-3">Actions</th>
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
                {type === 'film' && <span>{item.year || 'Année ?'} · {item.status || 'published'} · {Number(item.views || 0).toLocaleString()} vues</span>}
                {type === 'actor' && <span>{item.status || 'published'} · {truncateText(item.biography || 'Biographie non renseignée', 90)}</span>}
                {type === 'article' && <span>{item.category} · {item.status || 'published'} · {formatDate(item.published_at || item.created_at)}</span>}
                {type === 'genre' && <span>{item.status || 'published'} · {truncateText(item.description || 'Introduction non renseignée', 90)}</span>}
              </td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => canManage && onEdit(item)}
                    disabled={!canManage}
                    className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white"
                  >
                    <FiEdit3 size={16} />
                    Modifier
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
                    {isArchived ? 'Désarchiver' : 'Archiver'}
                  </button>
                </div>
              </td>
            </tr>
            );
          })}
          {!rows.length && (
            <tr>
              <td colSpan="3" className="px-4 py-8 text-center text-gray-500">
                Aucun contenu disponible.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
);

export default AdminContentManager;
