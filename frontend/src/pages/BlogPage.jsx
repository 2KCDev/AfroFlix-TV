import React, { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import Breadcrumbs from '../components/common/Breadcrumbs';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Pagination from '../components/common/Pagination';
import SEO from '../components/common/SEO';
import ShareButtons from '../components/common/ShareButtons';
import ArticleCard from '../components/blog/ArticleCard';
import { useArticles } from '../hooks/useFilms';
import { api } from '../services/api';

const BlogPage = () => {
  const { slug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get('page') || '1');
  const category = searchParams.get('category') || '';

  const [article, setArticle] = useState(null);
  const [categories, setCategories] = useState([]);
  const [articleLoading, setArticleLoading] = useState(Boolean(slug));

  const { data: listData, loading } = useArticles({
    page: slug ? undefined : page,
    limit: 10,
    category: category || undefined,
  });

  // Fetch single article if slug provided
  useEffect(() => {
    if (slug) {
      const fetchArticle = async () => {
        try {
          setArticleLoading(true);
          const data = await api.article(slug);
          setArticle(data);
        } catch (error) {
          console.error('Error fetching article:', error);
          setArticle(null);
        } finally {
          setArticleLoading(false);
        }
      };
      fetchArticle();
    }
  }, [slug]);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.articleCategories();
        setCategories(res.categories || []);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchCategories();
  }, []);

  if (slug && articleLoading) return <LoadingSpinner fullPage />;

  if (slug && !article) {
    return (
      <div className="max-w-3xl mx-auto rounded-lg border border-gray-200 bg-white p-10 text-center">
        <SEO title="Article non trouvé" description="Article AfroFlix.TV introuvable." />
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Article non trouvé</h1>
        <p className="text-gray-600 mb-6">
          Cet article n'existe pas ou n'est plus publié.
        </p>
        <Link to="/actualites" className="inline-block rounded-lg bg-red-600 px-5 py-3 font-semibold text-white hover:bg-red-700">
          Retour aux actualités
        </Link>
      </div>
    );
  }

  // Single article view
  if (slug && article) {
    const articleImage = article.featured_image || article.imageUrl;
    const articleDate = article.published_at || article.created_at || article.createdAt;
    const relatedArticles = (listData?.articles || [])
      .filter((item) => item.slug !== article.slug && item.category === article.category)
      .slice(0, 2);

    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <SEO
          title={article.title}
          description={(article.excerpt || article.content || '').slice(0, 155)}
          image={articleImage}
          type="article"
          jsonLd={{
            '@context': 'https://schema.org',
            '@type': 'BlogPosting',
            headline: article.title,
            image: articleImage,
            datePublished: articleDate,
            author: { '@type': 'Person', name: article.author || 'Rédaction AFROFLIX.TV' },
          }}
        />
        <Breadcrumbs items={[{ label: 'Actualités', to: '/actualites' }, { label: article.title }]} />

        <Link to="/actualites" className="text-red-600 hover:text-red-700 font-semibold">
          ← Retour au blog
        </Link>

        <article className="space-y-6">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">{article.title}</h1>
            <div className="flex gap-4 text-sm text-gray-600">
              <span className="bg-red-100 text-red-800 px-3 py-1 rounded font-semibold">
                {article.category}
              </span>
              <span>{new Date(articleDate).toLocaleDateString('fr-FR')}</span>
              <span>{article.readTime || '5'} min de lecture</span>
            </div>
          </div>

          {articleImage && (
            <img
              src={articleImage}
              alt={article.title}
              loading="eager"
              decoding="async"
              className="w-full rounded-lg shadow-lg max-h-96 object-cover"
            />
          )}

          <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed space-y-4">
            {article.content?.split('\n').map((paragraph, idx) => (
              <p key={idx}>{paragraph}</p>
            ))}
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h3 className="font-bold text-gray-900 mb-4">Partager cet article</h3>
            <ShareButtons title={article.title} />
          </div>

          <div className="border-t-2 border-gray-200 pt-6">
            <h3 className="font-bold text-gray-900 mb-4">Articles connexes</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {relatedArticles.length > 0 ? (
                relatedArticles.map((item) => (
                  <Link
                    key={item.id}
                    to={`/actualites/${item.slug}`}
                    className="rounded-lg border border-gray-200 bg-white p-4 hover:shadow-md transition"
                  >
                    <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded font-semibold">
                      {item.category}
                    </span>
                    <h4 className="mt-3 font-bold text-gray-900 hover:text-red-600">{item.title}</h4>
                    <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                      {item.excerpt || item.content?.substring(0, 120)}...
                    </p>
                  </Link>
                ))
              ) : (
                <p className="text-gray-600">Aucun article connexe publié pour le moment.</p>
              )}
            </div>
          </div>
        </article>
      </div>
    );
  }

  // Articles list view
  const articles = listData?.articles || [];
  const totalPages = listData?.totalPages || 1;

  return (
    <div className="space-y-8">
      <SEO
        title="Actualités AfroFlix.TV"
        description="Actualités, analyses, classements et conseils sur le cinéma AfroFlix.TV."
      />
      <Breadcrumbs items={[{ label: 'Actualités' }]} />

      <div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Blog AfroFlix.TV</h1>
        <p className="text-gray-600">Actualités, analyses et guides du cinéma africain</p>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 flex-wrap">
        <Link
          to="/actualites"
          className={`px-4 py-2 rounded-lg font-semibold transition ${
            !category
              ? 'bg-red-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Tous
        </Link>
        {categories.map((cat) => (
          <Link
            key={cat}
            to={`/actualites?category=${cat}`}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              category === cat
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {cat}
          </Link>
        ))}
      </div>

      {/* Articles List */}
      {loading ? (
        <LoadingSpinner />
      ) : articles.length > 0 ? (
        <>
          <div className="space-y-6">
            {articles.map((article) => (
              <ArticleCard key={article.id || article.slug} article={article} horizontal />
            ))}
          </div>
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={(newPage) => {
              const params = new URLSearchParams({ page: newPage });
              if (category) params.set('category', category);
              setSearchParams(params);
            }}
          />
        </>
      ) : (
        <div className="text-center py-16 bg-gray-50 rounded-lg">
          <p className="text-gray-600 text-lg font-semibold">Aucun article trouvé</p>
        </div>
      )}
    </div>
  );
};

export default BlogPage;
