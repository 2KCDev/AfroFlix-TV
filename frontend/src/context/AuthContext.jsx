import React, { createContext, useReducer, useEffect, useCallback } from 'react';
import { api, getToken, setToken, removeToken } from '../services/api';

export const AuthContext = createContext();

const initialState = {
  user: null,
  token: null,
  loading: true,
  error: null,
  isAuthenticated: false,
};

function authReducer(state, action) {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, loading: true, error: null };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        loading: false,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        error: null,
      };
    case 'LOGIN_ERROR':
      return { ...state, loading: false, error: action.payload, isAuthenticated: false };
    case 'LOGOUT':
      return {
        ...initialState,
        loading: false,
      };
    case 'SET_USER':
      return { ...state, user: action.payload, loading: false };
    case 'RESTORE_TOKEN':
      return {
        ...state,
        token: action.payload,
        isAuthenticated: !!action.payload,
        loading: false,
      };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Restore token on mount
  useEffect(() => {
    const token = getToken();
    if (token) {
      dispatch({ type: 'RESTORE_TOKEN', payload: token });
      // Verify token is still valid
      api
        .profile()
        .then((user) => {
          dispatch({ type: 'SET_USER', payload: user });
        })
        .catch(() => {
          removeToken();
          dispatch({ type: 'LOGOUT' });
        });
    } else {
      dispatch({ type: 'LOGOUT' });
    }
  }, []);

  // Listen for logout from other tabs/windows
  useEffect(() => {
    const handleLogout = () => {
      dispatch({ type: 'LOGOUT' });
    };
    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, []);

  const register = useCallback(async (email, password, username) => {
    dispatch({ type: 'LOGIN_START' });
    try {
      const response = await api.register(email, password, username);
      setToken(response.token);
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: {
          user: response.user,
          token: response.token,
        },
      });
      window.dispatchEvent(new Event('auth:login'));
      return response;
    } catch (error) {
      dispatch({ type: 'LOGIN_ERROR', payload: error.message });
      throw error;
    }
  }, []);

  const login = useCallback(async (email, password) => {
    dispatch({ type: 'LOGIN_START' });
    try {
      const response = await api.login(email, password);
      setToken(response.token);
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: {
          user: response.user,
          token: response.token,
        },
      });
      window.dispatchEvent(new Event('auth:login'));
      return response;
    } catch (error) {
      dispatch({ type: 'LOGIN_ERROR', payload: error.message });
      throw error;
    }
  }, []);

  const logout = useCallback(() => {
    api.logout();
    dispatch({ type: 'LOGOUT' });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  const value = {
    state,
    register,
    login,
    logout,
    clearError,
    user: state.user,
    token: state.token,
    loading: state.loading,
    error: state.error,
    isAuthenticated: state.isAuthenticated,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
