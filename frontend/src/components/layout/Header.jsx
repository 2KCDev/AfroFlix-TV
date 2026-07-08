import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiSearch, FiMenu, FiX, FiUser, FiLogOut, FiSettings } from 'react-icons/fi';
import { useAuth } from '../../hooks/useAuth';

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    setIsProfileOpen(false);
    setIsOpen(false);
    navigate('/');
  };

  const closeMobileMenu = () => {
    setIsOpen(false);
    setIsProfileOpen(false);
  };

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link to="/" onClick={closeMobileMenu} className="text-2xl font-bold text-red-600">
          AFROFLIX.TV
        </Link>
        
        <nav className="hidden md:flex gap-8">
          <Link to="/" className="text-gray-700 hover:text-red-600 transition font-medium">
            Accueil
          </Link>
          <Link to="/films" className="text-gray-700 hover:text-red-600 transition font-medium">
            Films
          </Link>
          <Link to="/acteurs" className="text-gray-700 hover:text-red-600 transition font-medium">
            Acteurs
          </Link>
          <Link to="/actualites" className="text-gray-700 hover:text-red-600 transition font-medium">
            Actualités
          </Link>
          <Link to="/classements" className="text-gray-700 hover:text-red-600 transition font-medium">
            Classements
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          <Link to="/recherche" className="text-2xl text-gray-700 hover:text-red-600 transition" aria-label="Recherche">
            <FiSearch />
          </Link>

          {/* User Menu */}
          {isAuthenticated && user ? (
            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition"
              >
                <FiUser size={20} className="text-red-600" />
                <span className="hidden sm:inline text-sm font-medium text-gray-700">
                  {user.username || user.email}
                </span>
              </button>

              {/* Dropdown */}
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-10">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-900">{user.username}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                  
                  <Link
                    to="/favoris"
                    className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-red-50 hover:text-red-600 transition"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    Mes favoris
                  </Link>

                  {['admin', 'moderator', 'editor'].includes(user.role) ? (
                    <Link
                      to="/admin"
                      className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-red-50 hover:text-red-600 transition"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <FiSettings size={16} />
                      Administration
                    </Link>
                  ) : null}
                  
                  <button
                    onClick={handleLogout}
                    className="w-full text-left flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-red-50 hover:text-red-600 transition"
                  >
                    <FiLogOut size={16} />
                    Déconnexion
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/auth"
              className="hidden sm:inline px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
            >
              Connexion
            </Link>
          )}

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden text-2xl text-gray-700"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <FiX /> : <FiMenu />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <nav className="md:hidden bg-gray-50 border-t px-4 py-4 flex flex-col gap-4">
          <Link to="/" onClick={closeMobileMenu} className="text-gray-700 hover:text-red-600 font-medium">
            Accueil
          </Link>
          <Link to="/films" onClick={closeMobileMenu} className="text-gray-700 hover:text-red-600 font-medium">
            Films
          </Link>
          <Link to="/acteurs" onClick={closeMobileMenu} className="text-gray-700 hover:text-red-600 font-medium">
            Acteurs
          </Link>
          <Link to="/actualites" onClick={closeMobileMenu} className="text-gray-700 hover:text-red-600 font-medium">
            Actualités
          </Link>
          <Link to="/classements" onClick={closeMobileMenu} className="text-gray-700 hover:text-red-600 font-medium">
            Classements
          </Link>
          {!isAuthenticated && (
            <Link
              to="/auth"
              onClick={closeMobileMenu}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium text-center"
            >
              Connexion
            </Link>
          )}
        </nav>
      )}
    </header>
  );
};

export default Header;
