import React, { useEffect, useState } from 'react';
import { FiEdit3, FiPlus, FiRefreshCw, FiSave, FiSearch, FiTrash2, FiX } from 'react-icons/fi';
import LoadingSpinner from '../common/LoadingSpinner';
import { api } from '../../services/api';
import { formatDate } from '../../utils/content';

const roles = ['user', 'editor', 'moderator', 'admin'];

const UserTableFilters = ({
  userSearch,
  setUserSearch,
  roleFilter,
  setRoleFilter,
  onSubmit,
}) => (
  <form onSubmit={onSubmit} className="w-full rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
    <h4 className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-900">
      <FiSearch className="text-red-600" />
      Recherche d'utilisateurs
    </h4>
    <div className="space-y-3">
      <div className="flex flex-row gap-2 sm:gap-3">
        <label className="block min-w-0 flex-grow">
          <span className="sr-only">Mots clés</span>
          <input
            type="search"
            value={userSearch}
            onChange={(event) => setUserSearch(event.target.value)}
            placeholder="Mots clés: nom, email, rôle..."
            className="w-full rounded-lg border-2 border-red-600 px-4 py-3 outline-none focus:ring-2 focus:ring-red-500"
          />
        </label>
        <button
          type="submit"
          className="inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-red-600 px-3 py-3 font-semibold text-white transition hover:bg-red-700 sm:px-6"
        >
          <FiSearch size={18} />
          <span>Rechercher</span>
        </button>
      </div>
      <label className="block">
        <span className="block text-sm font-semibold text-gray-700 mb-1">Rôle</span>
        <select
          value={roleFilter}
          onChange={(event) => setRoleFilter(event.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-red-500"
        >
          <option value="">Tous les rôles</option>
          {roles.map((role) => <option key={role} value={role}>{role}</option>)}
        </select>
      </label>
    </div>
  </form>
);

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [saving, setSaving] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState({
    email: '',
    username: '',
    role: 'editor',
    password: '',
  });

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.adminUsers({
        limit: 100,
        ...(userSearch.trim().length >= 2 && { q: userSearch.trim() }),
        ...(roleFilter && { role: roleFilter }),
      });
      setUsers(data.users || []);
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
  }, [userSearch, roleFilter]);

  const applyUserFilters = async (event) => {
    event.preventDefault();
    await load();
  };

  const updateRole = async (userId, role) => {
    try {
      await api.updateUserRole(userId, role);
      await load();
    } catch (err) {
      setMessage(err.message);
    }
  };

  const resetForm = () => {
    setEditingUser(null);
    setForm({ email: '', username: '', role: 'editor', password: '' });
  };

  const editUser = (user) => {
    setEditingUser(user);
    setForm({
      email: user.email || '',
      username: user.username || '',
      role: user.role || 'user',
      password: '',
    });
  };

  const submitUser = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const payload = {
        email: form.email.trim(),
        username: form.username.trim(),
        role: form.role,
        ...(form.password ? { password: form.password } : {}),
      };

      if (editingUser) {
        await api.updateUser(editingUser.id, payload);
      } else {
        await api.createUser(payload);
      }
      resetForm();
      await load();
      setMessage('Utilisateur enregistré avec succès.');
    } catch (err) {
      setMessage(err.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm('Supprimer cet utilisateur ? Cette action doit rester exceptionnelle.')) return;
    try {
      await api.deleteUser(userId);
      await load();
    } catch (err) {
      setMessage(err.message);
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Utilisateurs et rôles</h2>
          <p className="text-gray-600">Gestion des rôles administrateur, éditeur, modérateur et utilisateur.</p>
        </div>
        <button onClick={load} className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-semibold">
          <FiRefreshCw size={16} />
          Actualiser
        </button>
      </div>

      {message && <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">{message}</div>}

      <form onSubmit={submitUser} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-900">
          {editingUser ? <FiEdit3 className="text-red-600" /> : <FiPlus className="text-red-600" />}
          {editingUser ? 'Modifier un compte' : 'Ajouter un éditeur ou modérateur'}
        </h3>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-gray-700">Email</span>
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-red-500"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-gray-700">Nom</span>
            <input
              type="text"
              value={form.username}
              onChange={(event) => setForm((prev) => ({ ...prev, username: event.target.value }))}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-red-500"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-gray-700">Rôle</span>
            <select
              value={form.role}
              onChange={(event) => setForm((prev) => ({ ...prev, role: event.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-red-500"
            >
              {roles.map((role) => <option key={role} value={role}>{role}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-gray-700">
              {editingUser ? 'Nouveau mot de passe' : 'Mot de passe'}
            </span>
            <input
              type="password"
              value={form.password}
              onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
              required={!editingUser}
              minLength={8}
              placeholder={editingUser ? 'laisser vide si inchangé' : '8 caractères min.'}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-red-500"
            />
          </label>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700 disabled:opacity-50"
          >
            <FiSave size={16} />
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
          {editingUser && (
            <button type="button" onClick={resetForm} className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 font-semibold hover:bg-gray-50">
              <FiX size={16} />
              Annuler
            </button>
          )}
        </div>
      </form>

      <UserTableFilters
        userSearch={userSearch}
        setUserSearch={setUserSearch}
        roleFilter={roleFilter}
        setRoleFilter={setRoleFilter}
        onSubmit={applyUserFilters}
      />

      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="text-left px-4 py-3">Utilisateur</th>
                  <th className="text-left px-4 py-3">Rôle</th>
                  <th className="text-left px-4 py-3">Inscription</th>
                  <th className="text-right px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-t border-gray-100">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-900">{user.username || user.email}</p>
                      <p className="text-gray-500">{user.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={user.role}
                        onChange={(event) => updateRole(user.id, event.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                      >
                        {roles.map((role) => <option key={role} value={role}>{role}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(user.created_at)}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => editUser(user)}
                        className="mr-2 inline-flex items-center gap-2 px-3 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        <FiEdit3 size={16} />
                        Modifier
                      </button>
                      <button
                        onClick={() => deleteUser(user.id)}
                        className="inline-flex items-center gap-2 px-3 py-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
                      >
                        <FiTrash2 size={16} />
                        Supprimer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
};

export default AdminUsers;
