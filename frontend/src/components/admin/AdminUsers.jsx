import React, { useEffect, useRef, useState } from 'react';
import { FiEdit3, FiPlus, FiRefreshCw, FiSave, FiSearch, FiTrash2, FiX } from 'react-icons/fi';
import LoadingSpinner from '../common/LoadingSpinner';
import { api } from '../../services/api';
import { formatDate } from '../../utils/content';
import { useLocale } from '../../hooks/useLocale';

const roles = ['user', 'editor', 'moderator', 'admin'];

const UserTableFilters = ({
  userSearch,
  setUserSearch,
  roleFilter,
  setRoleFilter,
  onSubmit,
  c,
}) => (
  <form onSubmit={onSubmit} className="w-full rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
    <h4 className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-900">
      <FiSearch className="text-red-600" />
      {c.searchTitle}
    </h4>
    <div className="space-y-3">
      <div>
        <label className="block min-w-0">
          <span className="sr-only">{c.keywords}</span>
          <input
            type="search"
            value={userSearch}
            onChange={(event) => setUserSearch(event.target.value)}
            placeholder={c.searchPlaceholder}
            className="w-full rounded-lg border-2 border-red-600 px-4 py-3 outline-none focus:ring-2 focus:ring-red-500"
          />
        </label>
      </div>
      <label className="block">
        <span className="block text-sm font-semibold text-gray-700 mb-1">{c.role}</span>
        <select
          value={roleFilter}
          onChange={(event) => setRoleFilter(event.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-red-500"
        >
          <option value="">{c.allRoles}</option>
          {roles.map((role) => <option key={role} value={role}>{role}</option>)}
        </select>
      </label>
    </div>
  </form>
);

const AdminUsers = () => {
  const { language } = useLocale();
  const c = language === 'en' ? {
    searchTitle: 'User search', keywords: 'Keywords', searchPlaceholder: 'Keywords: name, email, role...', role: 'Role', allRoles: 'All roles', saved: 'User saved successfully.', deleteConfirm: 'Delete this user? This action should remain exceptional.', title: 'Users and roles', intro: 'Manage administrator, editor, moderator and user roles.', refresh: 'Refresh', editAccount: 'Edit account', addAccount: 'Add an editor or moderator', email: 'Email', name: 'Name', newPassword: 'New password', password: 'Password', unchanged: 'leave empty to keep unchanged', minPassword: '8 characters min.', saving: 'Saving...', save: 'Save', cancel: 'Cancel', user: 'User', registration: 'Registration', actions: 'Actions', edit: 'Edit', delete: 'Delete', locale: 'en-US', emptyDate: 'Not provided',
  } : {
    searchTitle: "Recherche d'utilisateurs", keywords: 'Mots clés', searchPlaceholder: 'Mots clés: nom, email, rôle...', role: 'Rôle', allRoles: 'Tous les rôles', saved: 'Utilisateur enregistré avec succès.', deleteConfirm: 'Supprimer cet utilisateur ? Cette action doit rester exceptionnelle.', title: 'Utilisateurs et rôles', intro: 'Gestion des rôles administrateur, éditeur, modérateur et utilisateur.', refresh: 'Actualiser', editAccount: 'Modifier un compte', addAccount: 'Ajouter un éditeur ou modérateur', email: 'Email', name: 'Nom', newPassword: 'Nouveau mot de passe', password: 'Mot de passe', unchanged: 'laisser vide si inchangé', minPassword: '8 caractères min.', saving: 'Enregistrement...', save: 'Enregistrer', cancel: 'Annuler', user: 'Utilisateur', registration: 'Inscription', actions: 'Actions', edit: 'Modifier', delete: 'Supprimer', locale: 'fr-FR', emptyDate: 'Non renseigné',
  };
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
  const formRef = useRef(null);

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
    window.setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      formRef.current?.querySelector('input, select, textarea')?.focus({ preventScroll: true });
    }, 0);
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
      setMessage(c.saved);
    } catch (err) {
      setMessage(err.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm(c.deleteConfirm)) return;
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
          <h2 className="text-2xl font-bold text-gray-900">{c.title}</h2>
          <p className="text-gray-600">{c.intro}</p>
        </div>
        <button onClick={load} className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-semibold">
          <FiRefreshCw size={16} />
          {c.refresh}
        </button>
      </div>

      {message && <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">{message}</div>}

      <form ref={formRef} onSubmit={submitUser} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-900">
          {editingUser ? <FiEdit3 className="text-red-600" /> : <FiPlus className="text-red-600" />}
          {editingUser ? c.editAccount : c.addAccount}
        </h3>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-gray-700">{c.email}</span>
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-red-500"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-gray-700">{c.name}</span>
            <input
              type="text"
              value={form.username}
              onChange={(event) => setForm((prev) => ({ ...prev, username: event.target.value }))}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-red-500"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-gray-700">{c.role}</span>
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
              {editingUser ? c.newPassword : c.password}
            </span>
            <input
              type="password"
              value={form.password}
              onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
              required={!editingUser}
              minLength={8}
              placeholder={editingUser ? c.unchanged : c.minPassword}
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
            {saving ? c.saving : c.save}
          </button>
          {editingUser && (
            <button type="button" onClick={resetForm} className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 font-semibold hover:bg-gray-50">
              <FiX size={16} />
              {c.cancel}
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
        c={c}
      />

      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="text-left px-4 py-3">{c.user}</th>
                  <th className="text-left px-4 py-3">{c.role}</th>
                  <th className="text-left px-4 py-3">{c.registration}</th>
                  <th className="text-right px-4 py-3">{c.actions}</th>
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
                    <td className="px-4 py-3 text-gray-600">{formatDate(user.created_at, c.locale, c.emptyDate)}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => editUser(user)}
                        className="mr-2 inline-flex items-center gap-2 px-3 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        <FiEdit3 size={16} />
                        {c.edit}
                      </button>
                      <button
                        onClick={() => deleteUser(user.id)}
                        className="inline-flex items-center gap-2 px-3 py-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
                      >
                        <FiTrash2 size={16} />
                        {c.delete}
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
