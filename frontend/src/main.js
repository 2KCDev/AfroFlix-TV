// API Configuration
const API_URL = window.location.origin + '/api';

// Page Navigation
function showPage(pageName) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    const page = document.getElementById(pageName);
    if (page) {
        page.classList.add('active');
        
        if (pageName === 'films') loadFilms();
        if (pageName === 'actors') loadActors();
        if (pageName === 'articles') loadArticles();
        if (pageName === 'home') loadFilms('homeFeed');
    }
}

// Load Films
async function loadFilms(containerId = 'filmsList') {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = '<div class="loading">Chargement des films...</div>';
    
    try {
        const response = await fetch(`${API_URL}/films`);
        if (!response.ok) throw new Error('Erreur API');
        
        const films = await response.json();
        
        if (!films || films.length === 0) {
            container.innerHTML = '<p>Aucun film disponible</p>';
            return;
        }
        
        container.innerHTML = films.map(film => `
            <div class="film-card">
                <div class="film-poster">🎬</div>
                <div class="film-info">
                    <h3>${film.title || 'Sans titre'}</h3>
                    <p>${film.description || 'Pas de description'}</p>
                    <p><strong>Genre:</strong> ${film.genre || 'N/A'}</p>
                    <p><strong>Année:</strong> ${film.year || 'N/A'}</p>
                    <p class="rating">⭐ ${film.rating || 'N/A'}/10</p>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Erreur:', error);
        container.innerHTML = '<div class="error">Erreur lors du chargement des films</div>';
    }
}

// Load Actors
async function loadActors() {
    const container = document.getElementById('actorsList');
    container.innerHTML = '<div class="loading">Chargement des acteurs...</div>';
    
    try {
        const response = await fetch(`${API_URL}/actors`);
        if (!response.ok) throw new Error('Erreur API');
        
        const actors = await response.json();
        
        if (!actors || actors.length === 0) {
            container.innerHTML = '<p>Aucun acteur disponible</p>';
            return;
        }
        
        container.innerHTML = actors.map(actor => `
            <div class="actor-card">
                <h3>${actor.name || 'Sans nom'}</h3>
                <p>${actor.bio || 'Pas de bio disponible'}</p>
                <p><strong>Films:</strong> ${actor.filmCount || 0}</p>
            </div>
        `).join('');
    } catch (error) {
        console.error('Erreur:', error);
        container.innerHTML = '<div class="error">Erreur lors du chargement des acteurs</div>';
    }
}

// Load Articles
async function loadArticles() {
    const container = document.getElementById('articlesList');
    container.innerHTML = '<div class="loading">Chargement des articles...</div>';
    
    try {
        const response = await fetch(`${API_URL}/articles`);
        if (!response.ok) throw new Error('Erreur API');
        
        const articles = await response.json();
        
        if (!articles || articles.length === 0) {
            container.innerHTML = '<p>Aucun article disponible</p>';
            return;
        }
        
        container.innerHTML = articles.map(article => `
            <div class="article-card">
                <h2>${article.title || 'Sans titre'}</h2>
                <p class="date">${new Date(article.date).toLocaleDateString('fr-FR')}</p>
                <p>${article.content || 'Pas de contenu'}</p>
            </div>
        `).join('');
    } catch (error) {
        console.error('Erreur:', error);
        container.innerHTML = '<div class="error">Erreur lors du chargement des articles</div>';
    }
}

// Search Function
async function performSearch() {
    const query = document.getElementById('searchInput').value.trim();
    
    if (!query) {
        alert('Veuillez entrer un terme de recherche');
        return;
    }
    
    const container = document.getElementById('searchResultsList');
    container.innerHTML = '<div class="loading">Recherche en cours...</div>';
    
    try {
        const response = await fetch(`${API_URL}/search?q=${encodeURIComponent(query)}`);
        if (!response.ok) throw new Error('Erreur API');
        
        const results = await response.json();
        
        if (!results || results.length === 0) {
            container.innerHTML = '<p>Aucun résultat trouvé</p>';
        } else {
            container.innerHTML = results.map(film => `
                <div class="film-card">
                    <div class="film-poster">🎬</div>
                    <div class="film-info">
                        <h3>${film.title || 'Sans titre'}</h3>
                        <p>${film.description || 'Pas de description'}</p>
                        <p><strong>Genre:</strong> ${film.genre || 'N/A'}</p>
                        <p><strong>Année:</strong> ${film.year || 'N/A'}</p>
                    </div>
                </div>
            `).join('');
        }
        
        showPage('searchResults');
    } catch (error) {
        console.error('Erreur:', error);
        container.innerHTML = '<div class="error">Erreur lors de la recherche</div>';
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎬 AfroFlix.TV Platform loaded');
    console.log('API URL:', API_URL);
    loadFilms('homeFeed');
});
