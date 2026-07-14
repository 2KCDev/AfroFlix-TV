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

const allTabs = [
  { id: 'dashboard', label: 'Tableau de bord', icon: FiBarChart2, roles: ['admin', 'editor'] },
  { id: 'content', label: 'Contenus', icon: FiFileText, roles: ['admin', 'editor'] },
  { id: 'moderation', label: 'Modération', icon: FiMessageSquare, roles: ['admin', 'moderator'] },
  { id: 'users', label: 'Utilisateurs', icon: FiUsers, roles: ['admin'] },
  { id: 'compliance', label: 'AdSense', icon: FiShield, roles: ['admin', 'editor', 'moderator'] },
];

const roleLabels = {
  admin: 'Administrateur',
  editor: 'Éditeur',
  moderator: 'Modérateur',
};

const AdminPanel = () => {
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
          <h1 className="text-4xl font-bold text-gray-900">Administration AFROFLIX.TV</h1>
          <p className="text-gray-600 mt-1">
            {roleLabels[user?.role] || user?.role} · {user?.username || user?.email}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {user?.role === 'admin' && (
            <button
              type="button"
              onClick={() => setActiveTab('users')}
              title="Paramètres et gestion des profils"
              className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 shadow-sm transition hover:border-red-300 hover:bg-red-50 hover:text-red-600"
            >
              <FiSettings size={20} />
            </button>
          )}
          <div className="inline-flex items-center gap-2 bg-green-50 text-green-800 border border-green-200 rounded-lg px-4 py-2 text-sm font-semibold">
            <FiCheckSquare size={18} />
            Espace non indexé par les moteurs
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
                {tab.label}
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
