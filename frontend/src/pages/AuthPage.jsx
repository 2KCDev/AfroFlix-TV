import React, { useState, useEffect, useLayoutEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import { FiAlertCircle, FiEye, FiEyeOff } from 'react-icons/fi';
import { useLocale } from '../hooks/useLocale';

const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d\s]).{8,128}$/;
const PASSWORD_MESSAGE = 'Le mot de passe doit contenir au moins 8 caractères, une lettre, un chiffre et un caractère spécial.';

const AuthPage = () => {
  const { language } = useLocale();
  const c = language === 'en' ? {
    passwordRule: 'Password must contain at least 8 characters, a letter, a number and a special character.', requiredPassword: 'Password is required', mismatch: 'Passwords do not match', requiredEmail: 'Email is required', invalidEmail: 'Invalid email', requiredUsername: 'Username is required', shortUsername: 'Username must contain at least 3 characters', resetSent: 'If this account is eligible, an email has been sent.', updated: 'Password updated.', loginError: 'Sign-in error', registerError: 'Registration error', forgotTitle: 'Reset your password', resetTitle: 'Create a new password', loginTitle: 'Sign in to your account', registerTitle: 'Create your account', sendLink: 'Send link', update: 'Update password', signIn: 'Sign in', signUp: 'Sign up', email: 'Email address', username: 'Username', newPassword: 'New password', password: 'Password', minPassword: 'Minimum 8 characters with a letter, a number and a special character.', confirm: 'Confirm password', processing: 'Processing…', forgot: 'Forgot your password?', or: 'Or', noAccount: "Don't have an account? ", haveAccount: 'Already have an account? ', back: 'Back to sign in', continue: 'By continuing, you agree to our', terms: 'Terms', policy: 'Privacy policy'
  } : {
    passwordRule: 'Le mot de passe doit contenir au moins 8 caractères, une lettre, un chiffre et un caractère spécial.', requiredPassword: 'Mot de passe requis', mismatch: 'Les mots de passe ne correspondent pas', requiredEmail: 'Email requis', invalidEmail: 'Email invalide', requiredUsername: "Nom d'utilisateur requis", shortUsername: "Nom d'utilisateur doit contenir au moins 3 caractères", resetSent: 'Si ce compte est éligible, un email vient d’être envoyé.', updated: 'Mot de passe mis à jour.', loginError: 'Erreur de connexion', registerError: "Erreur d'inscription", forgotTitle: 'Réinitialiser votre mot de passe', resetTitle: 'Créer un nouveau mot de passe', loginTitle: 'Connectez-vous à votre compte', registerTitle: 'Créez votre compte', sendLink: 'Envoyer le lien', update: 'Mettre à jour le mot de passe', signIn: 'Se connecter', signUp: "S'inscrire", email: 'Adresse e-mail', username: "Nom d'utilisateur", newPassword: 'Nouveau mot de passe', password: 'Mot de passe', minPassword: 'Minimum 8 caractères avec une lettre, un chiffre et un caractère spécial.', confirm: 'Confirmer le mot de passe', processing: 'Traitement…', forgot: 'Mot de passe oublié ?', or: 'Ou', noAccount: 'Pas encore de compte ? ', haveAccount: 'Vous avez déjà un compte ? ', back: 'Retour à la connexion', continue: 'En continuant, vous acceptez nos', terms: 'Conditions', policy: 'Politique'
  };
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

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, []);

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
      if (!formData.password) return c.requiredPassword;
      if (!PASSWORD_PATTERN.test(formData.password)) {
        return c.passwordRule;
      }
      if (formData.password !== formData.confirmPassword) {
        return c.mismatch;
      }
      return '';
    }

    if (!formData.email.trim()) return c.requiredEmail;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      return c.invalidEmail;
    }
    if (authMode === 'forgot') return '';

    if (!formData.password) return c.requiredPassword;
    if (!PASSWORD_PATTERN.test(formData.password)) {
      return c.passwordRule;
    }

    if (!isLogin && authMode === 'login') {
      if (!formData.username.trim()) return c.requiredUsername;
      if (formData.username.length < 3) {
        return c.shortUsername;
      }
      if (formData.password !== formData.confirmPassword) {
        return c.mismatch;
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
        setSuccess(response.message || c.resetSent);
      } else if (authMode === 'reset') {
        const token = new URLSearchParams(location.search).get('reset_token');
        const response = await api.resetPassword(token, formData.password);
        setSuccess(response.message || c.updated);
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
      setError(err.message || (isLogin ? c.loginError : c.registerError));
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
    ? c.forgotTitle
    : authMode === 'reset'
      ? c.resetTitle
      : isLogin
        ? c.loginTitle
        : c.registerTitle;

  const buttonLabel = authMode === 'forgot'
    ? c.sendLink
    : authMode === 'reset'
      ? c.update
      : isLogin
        ? c.signIn
        : c.signUp;

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
                {c.email}
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
                  {c.username}
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
                {authMode === 'reset' ? c.newPassword : c.password}
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
                {c.minPassword}
              </p>
            )}

            {/* Confirm Password */}
            {(!isLogin || authMode === 'reset') && authMode !== 'forgot' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {c.confirm}
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
              {loading ? c.processing : buttonLabel}
            </button>
          </form>

          {authMode === 'login' && isLogin && (
            <button
              type="button"
              onClick={() => switchMode('forgot')}
              className="mt-4 w-full text-center text-sm font-semibold text-red-600 hover:text-red-700"
            >
              {c.forgot}
            </button>
          )}

          {/* Divider */}
          {authMode !== 'reset' && (
          <div className="my-6 flex items-center">
            <div className="flex-grow border-t border-gray-300"></div>
            <span className="px-3 text-gray-400 text-sm">{c.or}</span>
            <div className="flex-grow border-t border-gray-300"></div>
          </div>
          )}

          {/* Toggle Form */}
          {authMode === 'login' ? (
            <p className="text-center text-gray-600 text-sm">
            {isLogin ? c.noAccount : c.haveAccount}
            <button
              type="button"
              onClick={() => {
                switchMode('login', !isLogin);
              }}
              className="text-red-600 hover:text-red-700 font-semibold"
            >
              {isLogin ? c.signUp : c.signIn}
            </button>
            </p>
          ) : (
            <p className="text-center text-gray-600 text-sm">
              <button
                type="button"
                onClick={() => switchMode('login', true)}
                className="font-semibold text-red-600 hover:text-red-700"
              >
                {c.back}
              </button>
            </p>
          )}
        </div>

        {/* Footer Links */}
        <div className="mt-6 text-center text-xs text-gray-500 space-y-1">
          <p>{c.continue}</p>
          <div className="flex justify-center gap-2">
            <a href="/terms" className="hover:text-red-600">{c.terms}</a>
            <span>•</span>
            <a href="/privacy" className="hover:text-red-600">{c.policy}</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
