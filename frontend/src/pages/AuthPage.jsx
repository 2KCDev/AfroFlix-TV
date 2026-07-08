import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import { FiAlertCircle, FiEye, FiEyeOff } from 'react-icons/fi';

const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d\s]).{8,128}$/;
const PASSWORD_MESSAGE = 'Le mot de passe doit contenir au moins 8 caractères, une lettre, un chiffre et un caractère spécial.';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [authMode, setAuthMode] = useState('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    confirmPassword: '',
  });

  const { login, register, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated && authMode !== 'reset') {
      const from = location.state?.from?.pathname || '/';
      navigate(from);
    }
  }, [authMode, isAuthenticated, navigate, location]);

  useEffect(() => {
    const token = new URLSearchParams(location.search).get('reset_token');
    if (token) {
      setAuthMode('reset');
      setIsLogin(true);
    } else if (authMode === 'reset') {
      setAuthMode('login');
    }
  }, [location.search]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (error) setError('');
    if (success) setSuccess('');
  };

  const validateForm = () => {
    if (authMode === 'reset') {
      if (!formData.password) return 'Mot de passe requis';
      if (!PASSWORD_PATTERN.test(formData.password)) {
        return PASSWORD_MESSAGE;
      }
      if (formData.password !== formData.confirmPassword) {
        return 'Les mots de passe ne correspondent pas';
      }
      return '';
    }

    if (!formData.email.trim()) return 'Email requis';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      return 'Email invalide';
    }
    if (authMode === 'forgot') return '';

    if (!formData.password) return 'Mot de passe requis';
    if (!PASSWORD_PATTERN.test(formData.password)) {
      return PASSWORD_MESSAGE;
    }

    if (!isLogin && authMode === 'login') {
      if (!formData.username.trim()) return 'Nom d\'utilisateur requis';
      if (formData.username.length < 3) {
        return 'Nom d\'utilisateur doit contenir au moins 3 caractères';
      }
      if (formData.password !== formData.confirmPassword) {
        return 'Les mots de passe ne correspondent pas';
      }
    }

    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (authMode === 'forgot') {
        const response = await api.forgotPassword(formData.email);
        setSuccess(response.message || 'Si ce compte est éligible, un email vient d’être envoyé.');
      } else if (authMode === 'reset') {
        const token = new URLSearchParams(location.search).get('reset_token');
        const response = await api.resetPassword(token, formData.password);
        setSuccess(response.message || 'Mot de passe mis à jour.');
        setAuthMode('login');
        navigate('/auth', { replace: true });
        setFormData({
          email: '',
          password: '',
          username: '',
          confirmPassword: '',
        });
      } else if (isLogin) {
        await login(formData.email, formData.password);
      } else {
        await register(formData.email, formData.password, formData.username);
      }
      // Navigation handled by useEffect
    } catch (err) {
      setError(err.message || (isLogin ? 'Erreur de connexion' : 'Erreur d\'inscription'));
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (nextMode, nextIsLogin = true) => {
    setAuthMode(nextMode);
    setIsLogin(nextIsLogin);
    setError('');
    setSuccess('');
    setShowPassword(false);
    setFormData({
      email: '',
      password: '',
      username: '',
      confirmPassword: '',
    });
    if (nextMode !== 'reset' && location.search) {
      navigate('/auth', { replace: true });
    }
  };

  const title = authMode === 'forgot'
    ? 'Réinitialiser votre mot de passe'
    : authMode === 'reset'
      ? 'Créer un nouveau mot de passe'
      : isLogin
        ? 'Connectez-vous à votre compte'
        : 'Créez votre compte';

  const buttonLabel = authMode === 'forgot'
    ? 'Envoyer le lien'
    : authMode === 'reset'
      ? 'Mettre à jour le mot de passe'
      : isLogin
        ? 'Se connecter'
        : 'S\'inscrire';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-red-600 mb-2">AFROFLIX.TV</h1>
          <p className="text-gray-600">{title}</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <FiAlertCircle className="text-red-600 mt-1 flex-shrink-0" size={20} />
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-800">
              {success}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            {authMode !== 'reset' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Adresse e-mail
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="exemple@email.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition"
                disabled={loading}
              />
            </div>
            )}

            {/* Username (Register only) */}
            {!isLogin && authMode === 'login' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom d'utilisateur
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="MonNom"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition"
                  disabled={loading}
                />
              </div>
            )}

            {/* Password */}
            {authMode !== 'forgot' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {authMode === 'reset' ? 'Nouveau mot de passe' : 'Mot de passe'}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition pr-10"
                  disabled={loading}
                  autoComplete={isLogin && authMode === 'login' ? 'current-password' : 'new-password'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>
            </div>
            )}

            {(!isLogin || authMode === 'reset') && authMode !== 'forgot' && (
              <p className="text-xs text-gray-500">
                Minimum 8 caractères avec une lettre, un chiffre et un caractère spécial.
              </p>
            )}

            {/* Confirm Password */}
            {(!isLogin || authMode === 'reset') && authMode !== 'forgot' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmer le mot de passe
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition"
                  disabled={loading}
                />
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-semibold py-2 rounded-lg transition duration-200 transform hover:scale-105 active:scale-95"
            >
              {loading ? 'Traitement...' : buttonLabel}
            </button>
          </form>

          {authMode === 'login' && isLogin && (
            <button
              type="button"
              onClick={() => switchMode('forgot')}
              className="mt-4 w-full text-center text-sm font-semibold text-red-600 hover:text-red-700"
            >
              Mot de passe oublié ?
            </button>
          )}

          {/* Divider */}
          {authMode !== 'reset' && (
          <div className="my-6 flex items-center">
            <div className="flex-grow border-t border-gray-300"></div>
            <span className="px-3 text-gray-400 text-sm">Ou</span>
            <div className="flex-grow border-t border-gray-300"></div>
          </div>
          )}

          {/* Toggle Form */}
          {authMode === 'login' ? (
            <p className="text-center text-gray-600 text-sm">
            {isLogin ? 'Pas encore de compte? ' : 'Vous avez déjà un compte? '}
            <button
              type="button"
              onClick={() => {
                switchMode('login', !isLogin);
              }}
              className="text-red-600 hover:text-red-700 font-semibold"
            >
              {isLogin ? 'S\'inscrire' : 'Se connecter'}
            </button>
            </p>
          ) : (
            <p className="text-center text-gray-600 text-sm">
              <button
                type="button"
                onClick={() => switchMode('login', true)}
                className="font-semibold text-red-600 hover:text-red-700"
              >
                Retour à la connexion
              </button>
            </p>
          )}
        </div>

        {/* Footer Links */}
        <div className="mt-6 text-center text-xs text-gray-500 space-y-1">
          <p>En continuant, vous acceptez nos</p>
          <div className="flex justify-center gap-2">
            <a href="/privacy" className="hover:text-red-600">Conditions</a>
            <span>•</span>
            <a href="/legal" className="hover:text-red-600">Politique</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
