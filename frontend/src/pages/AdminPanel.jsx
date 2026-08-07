import React, { useEffect, useMemo, useState } from 'react';
import { FiBarChart2, FiCheckSquare, FiFileText, FiMessageSquare, FiSettings, FiShield, FiUsers } from 'react-icons/fi';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import AdminDashboard from '../components/admin/AdminDashboard';
import AdminContentManager from '../components/admin/AdminContentManager';
import AdminModerationQueue from '../components/admin/AdminModerationQueue';
import AdminUsers from '../components/admin/AdminUsers';
import AdminCompliance from '../components/admin/AdminCompliance';
import { useLocale } from '../hooks/useLocale';

const allTabs = [
  { id: 'dashboard', label: 'dashboard', icon: FiBarChart2, roles: ['admin', 'editor'] },
  { id: 'content', label: 'content', icon: FiFileText, roles: ['admin', 'editor'] },
  { id: 'moderation', label: 'moderation', icon: FiMessageSquare, roles: ['admin', 'moderator'] },
  { id: 'users', label: 'users', icon: FiUsers, roles: ['admin'] },
  { id: 'compliance', label: 'compliance', icon: FiShield, roles: ['admin', 'moderator'] },
];

const roleLabels = {
  admin: 'Administrateur',
  editor: 'Éditeur',
  moderator: 'Modérateur',
};

const AdminPanel = () => {
  const { language } = useLocale();
  const c = language === 'en' ? { dashboard: 'Dashboard', content: 'Content', moderation: 'Moderation', users: 'Users', compliance: 'AdSense', admin: 'Administrator', editor: 'Editor', moderator: 'Moderator', settings: 'Settings and profile management', private: 'Area not indexed by search engines', title: 'AFROFLIX.TV administration' } : { dashboard: 'Tableau de bord', content: 'Contenus', moderation: 'Modération', users: 'Utilisateurs', compliance: 'AdSense', admin: 'Administrateur', editor: 'Éditeur', moderator: 'Modérateur', settings: 'Paramètres et gestion des profils', private: 'Espace non indexé par les moteurs', title: 'Administration AFROFLIX.TV' };
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const visibleTabs = useMemo(
    () => allTabs.filter((tab) => tab.roles.includes(user?.role)),
    [user?.role]
  );
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    if (visibleTabs.length && !visibleTabs.some((tab) => tab.id === activeTab)) {
      setActiveTab(visibleTabs[0].id);
    }
  }, [visibleTabs, activeTab]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        if (user?.role === 'moderator') {
          setLoading(false);
          return;
        }
        const data = await api.adminStats();
        setStats(data);
        setError('');
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user?.role]);

  if (loading) return <LoadingSpinner fullPage />;

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">{c.title}</h1>
          <p className="text-gray-600 mt-1">
            {(user?.role === 'admin' ? c.admin : user?.role === 'editor' ? c.editor : user?.role === 'moderator' ? c.moderator : user?.role)} · {user?.username || user?.email}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {user?.role === 'admin' && (
            <button
              type="button"
              onClick={() => setActiveTab('users')}
              title={c.settings}
              className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 shadow-sm transition hover:border-red-300 hover:bg-red-50 hover:text-red-600"
            >
              <FiSettings size={20} />
            </button>
          )}
          <div className="inline-flex items-center gap-2 bg-green-50 text-green-800 border border-green-200 rounded-lg px-4 py-2 text-sm font-semibold">
            <FiCheckSquare size={18} />
            {c.private}
          </div>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">{error}</div>}

      <div className="bg-white rounded-lg shadow-md overflow-x-auto">
        <div className="flex min-w-max border-b border-gray-200">
          {visibleTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 px-5 py-4 font-semibold border-b-2 transition ${
                  activeTab === tab.id
                    ? 'border-red-600 text-red-600 bg-red-50'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Icon size={18} />
                {c[tab.label] || tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {activeTab === 'dashboard' && <AdminDashboard stats={stats} user={user} />}
      {activeTab === 'content' && <AdminContentManager user={user} />}
      {activeTab === 'moderation' && <AdminModerationQueue />}
      {activeTab === 'users' && <AdminUsers />}
      {activeTab === 'compliance' && <AdminCompliance />}
    </div>
  );
};

export default AdminPanel;
