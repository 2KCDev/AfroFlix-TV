import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import FilmsPage from './pages/FilmsPage';
import FilmDetail from './pages/FilmDetail';
import ActorsPage from './pages/ActorsPage';
import ActorDetail from './pages/ActorDetail';
import BlogPage from './pages/BlogPage';
import SearchPage from './pages/SearchPage';
import AdminPanel from './pages/AdminPanel';
import AuthPage from './pages/AuthPage';
import NotFound from './pages/NotFound';
import LegalPage from './pages/LegalPage';
import FavoritesPage from './pages/FavoritesPage';
import RankingsPage from './pages/RankingsPage';
import ReviewsPage from './pages/ReviewsPage';
import CookieConsent from './components/common/CookieConsent';
import GoogleTags from './components/common/GoogleTags';
import PageJumpButton from './components/common/PageJumpButton';

function AppContent() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/films" element={<FilmsPage />} />
          <Route path="/films/:slug" element={<FilmDetail />} />
          <Route path="/genre/:genre" element={<FilmsPage />} />
          <Route path="/actors" element={<ActorsPage />} />
          <Route path="/actors/:slug" element={<ActorDetail />} />
          <Route path="/acteurs" element={<ActorsPage />} />
          <Route path="/acteurs/:slug" element={<ActorDetail />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/:slug" element={<BlogPage />} />
          <Route path="/actualites" element={<BlogPage />} />
          <Route path="/actualites/:slug" element={<BlogPage />} />
          <Route path="/classements" element={<RankingsPage />} />
          <Route path="/critiques" element={<ReviewsPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/recherche" element={<SearchPage />} />
          <Route
            path="/favoris"
            element={
              <ProtectedRoute>
                <FavoritesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute requireRole={['moderator', 'editor', 'admin']}>
                <AdminPanel />
              </ProtectedRoute>
            }
          />
          <Route path="/about" element={<LegalPage type="about" />} />
          <Route path="/contact" element={<LegalPage type="contact" />} />
          <Route path="/privacy" element={<LegalPage type="privacy" />} />
          <Route path="/terms" element={<LegalPage type="terms" />} />
          <Route path="/cookies" element={<LegalPage type="cookies" />} />
          <Route path="/copyright" element={<LegalPage type="copyright" />} />
          <Route path="/legal" element={<LegalPage type="legal" />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
      <GoogleTags />
      <PageJumpButton />
      <CookieConsent />
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
