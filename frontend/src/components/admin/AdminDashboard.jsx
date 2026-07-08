import React from 'react';
import { FiBarChart2, FiExternalLink, FiFileText, FiFilm, FiMessageSquare, FiSearch, FiTrendingUp, FiUsers } from 'react-icons/fi';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const StatCard = ({ label, value, icon: Icon, accent = 'text-red-600' }) => (
  <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-semibold text-gray-600">{label}</p>
        <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
      </div>
      <Icon size={36} className={`${accent} opacity-25`} />
    </div>
  </div>
);

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-lg">
      <p className="mb-1 font-bold text-gray-900">{label || payload[0]?.name || 'Détail'}</p>
      {payload.map((item) => (
        <p key={item.dataKey || item.name} className="font-semibold" style={{ color: item.color }}>
          {item.name}: {Number(item.value || 0).toLocaleString('fr-FR')}
        </p>
      ))}
    </div>
  );
};

const MonthlyViewsChart = ({ rows = [], isEditor }) => {
  const data = rows.map((row) => ({
    ...row,
    name: row.label || row.month?.slice(5) || '',
    views: Number(row.views || 0),
  }));
  const totalViews = data.reduce((sum, row) => sum + row.views, 0);
  const bestMonth = data.reduce((best, row) => (row.views > (best?.views || 0) ? row : best), data[0] || null);
  const averageViews = data.length ? Math.round(totalViews / data.length) : 0;
  const recentViews = data.slice(-3).reduce((sum, row) => sum + row.views, 0);
  const earlierViews = Math.max(totalViews - recentViews, 0);
  const pieData = [
    { name: '3 derniers mois', value: recentViews, color: '#dc2626' },
    { name: 'Mois précédents', value: earlierViews, color: '#f59e0b' },
  ].filter((item) => item.value > 0);

  return (
    <section className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 bg-gray-50 px-5 py-4">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900">
              <FiBarChart2 className="text-red-600" />
              Vues mensuelles
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              {isEditor ? 'Statistiques non cumulées sur vos films.' : 'Statistiques non cumulées sur tous les films.'}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-right">
            <div className="rounded-lg bg-white px-3 py-2 shadow-sm">
              <p className="text-xs font-semibold text-gray-500">Total</p>
              <p className="text-sm font-bold text-red-700">{Number(totalViews).toLocaleString('fr-FR')}</p>
            </div>
            <div className="rounded-lg bg-white px-3 py-2 shadow-sm">
              <p className="text-xs font-semibold text-gray-500">Moyenne</p>
              <p className="text-sm font-bold text-gray-900">{averageViews.toLocaleString('fr-FR')}</p>
            </div>
            <div className="rounded-lg bg-white px-3 py-2 shadow-sm">
              <p className="text-xs font-semibold text-gray-500">Pic</p>
              <p className="text-sm font-bold text-orange-700">{Number(bestMonth?.views || 0).toLocaleString('fr-FR')}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 p-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,.85fr)]">
        <div className="min-h-64 rounded-lg border border-gray-200 p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-gray-800">Trafic par mois</h3>
              <p className="text-xs text-gray-500">Volume de vues, mois par mois.</p>
            </div>
            {bestMonth && (
              <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-orange-700">
                Pic {bestMonth.name}
              </span>
            )}
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="views" name="Vues" radius={[7, 7, 0, 0]}>
                {data.map((entry) => (
                  <Cell key={entry.name} fill={entry.name === bestMonth?.name ? '#f59e0b' : '#dc2626'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="min-h-64 rounded-lg border border-gray-200 p-4">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-gray-800">Tendance</h3>
            <p className="text-xs text-gray-500">Progression visuelle utile pour suivre la croissance organique.</p>
          </div>
          <ResponsiveContainer width="100%" height={172}>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="monthlyViews" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#dc2626" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#dc2626" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="views" name="Vues" stroke="#dc2626" fill="url(#monthlyViews)" strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
          {pieData.length > 0 ? (
            <div className="mt-4 grid grid-cols-[130px_minmax(0,1fr)] items-center gap-3 rounded-lg bg-gray-50 p-3">
              <ResponsiveContainer width="100%" height={118}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={35} outerRadius={52} paddingAngle={3}>
                    {pieData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {pieData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between gap-2 text-xs">
                    <span className="flex items-center gap-2 font-semibold text-gray-700">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      {item.name}
                    </span>
                    <strong className="text-gray-900">{item.value.toLocaleString('fr-FR')}</strong>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-4 rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center text-sm font-semibold text-gray-600">
              Les vues apparaîtront ici après les premières visites mesurées.
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

const AdminDashboard = ({ stats, user }) => {
  const overview = stats?.overview || {};
  const today = stats?.today || {};
  const trending = stats?.trending || {};
  const google = stats?.google;
  const isEditor = user?.role === 'editor';
  const isAdmin = user?.role === 'admin';

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label={isEditor ? 'Mes films publiés' : 'Films publiés'} value={overview.total_films || 0} icon={FiFilm} />
        <StatCard label={isEditor ? 'Mes articles publiés' : 'Articles publiés'} value={overview.total_articles || 0} icon={FiFileText} accent="text-orange-600" />
        <StatCard label="Utilisateurs" value={overview.total_users || 0} icon={FiUsers} accent="text-blue-600" />
        <StatCard label={isEditor ? 'Commentaires en attente sur mes films' : 'Commentaires en attente'} value={overview.pending_comments || 0} icon={FiMessageSquare} accent="text-red-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-1 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FiBarChart2 className="text-red-600" />
            Aujourd'hui
          </h2>
          <div className="space-y-4">
            <div className="flex justify-between border-b border-gray-100 pb-3">
              <span className="text-gray-600">{isEditor ? 'Mes films ajoutés' : 'Films ajoutés'}</span>
              <span className="font-bold text-gray-900">{today.films_added || 0}</span>
            </div>
            <div className="flex justify-between border-b border-gray-100 pb-3">
              <span className="text-gray-600">{isEditor ? 'Mes articles ajoutés' : 'Articles ajoutés'}</span>
              <span className="font-bold text-gray-900">{today.articles_added || 0}</span>
            </div>
            <div className="flex justify-between border-b border-gray-100 pb-3">
              <span className="text-gray-600">Nouveaux comptes</span>
              <span className="font-bold text-gray-900">{today.new_users || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">{isEditor ? 'Vues de mes films' : 'Vues totales films'}</span>
              <span className="font-bold text-gray-900">{Number(overview.total_views || 0).toLocaleString()}</span>
            </div>
          </div>
        </section>

        <section className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FiTrendingUp className="text-orange-600" />
            {isEditor ? 'Mes contenus les plus vus' : 'Top contenus'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-700 mb-3">{isEditor ? 'Mes films' : 'Films'}</h3>
              <div className="space-y-2">
                {(trending.top_films || []).map((film, index) => (
                  <div key={film.id} className="flex items-center justify-between gap-3 text-sm border-b border-gray-100 pb-2">
                    <span className="font-medium text-gray-900 truncate">{index + 1}. {film.title}</span>
                    <span className="text-gray-500">{Number(film.views || 0).toLocaleString()} vues</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-700 mb-3">{isEditor ? 'Mes articles' : 'Articles'}</h3>
              <div className="space-y-2">
                {(trending.top_articles || []).map((article, index) => (
                  <div key={article.id} className="flex items-center justify-between gap-3 text-sm border-b border-gray-100 pb-2">
                    <span className="font-medium text-gray-900 truncate">{index + 1}. {article.title}</span>
                    <span className="text-gray-500">{Number(article.views || 0).toLocaleString()} vues</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>

      <MonthlyViewsChart rows={stats?.monthly?.views || []} isEditor={isEditor} />

      {isAdmin && (
        <section className="bg-white rounded-lg shadow-md p-6">
          <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
            <div>
              <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900">
                <FiBarChart2 className="text-red-600" />
                Google Analytics et Search Console
              </h2>
              <p className="mt-1 text-sm text-gray-600">Vue unifiée réservée à l'administrateur.</p>
            </div>
            {!google?.connected && (
              <span className="rounded-full bg-orange-50 px-3 py-1 text-sm font-semibold text-orange-700">
                Non configuré
              </span>
            )}
          </div>

          {google?.connected ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <StatCard label="Utilisateurs actifs GA4" value={google.analytics?.active_users || 0} icon={FiUsers} accent="text-blue-600" />
                <StatCard label="Pages vues GA4" value={Number(google.analytics?.page_views || 0).toLocaleString()} icon={FiExternalLink} accent="text-green-600" />
                <StatCard label="Sessions GA4" value={Number(google.analytics?.sessions || 0).toLocaleString()} icon={FiTrendingUp} accent="text-orange-600" />
              </div>
              <div>
                <h3 className="mb-3 flex items-center gap-2 font-semibold text-gray-800">
                  <FiSearch className="text-red-600" />
                  Requêtes Search Console
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-600">
                      <tr>
                        <th className="px-3 py-2 text-left">Requête</th>
                        <th className="px-3 py-2 text-right">Clics</th>
                        <th className="px-3 py-2 text-right">Impressions</th>
                        <th className="px-3 py-2 text-right">Position</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(google.search_console?.top_queries || []).map((row) => (
                        <tr key={row.query} className="border-t border-gray-100">
                          <td className="px-3 py-2 font-medium text-gray-900">{row.query}</td>
                          <td className="px-3 py-2 text-right">{row.clicks}</td>
                          <td className="px-3 py-2 text-right">{row.impressions}</td>
                          <td className="px-3 py-2 text-right">{row.position.toFixed(1)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 text-sm text-orange-800">
              {google?.message || 'Les données Google seront affichées ici après configuration serveur.'}
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default AdminDashboard;
