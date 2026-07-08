# 📚 API Documentation - AfroFlix.TV Platform

**Base URL**: `http://localhost:5000/api`  
**Version**: 1.0.0  
**Status**: Production-Ready

---

## 🔐 Authentication

### Register
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123",
  "username": "john_doe"
}

Response: 201 Created
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "username": "john_doe",
    "role": "user",
    "created_at": "2026-06-30T..."
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123"
}

Response: 200 OK
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "username": "john_doe",
    "role": "user"
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

### Forgot Password
```http
POST /auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}

Response: 200 OK
{
  "message": "Si ce compte est éligible, un email de réinitialisation vient d’être envoyé."
}
```

Notes:
- Disponible uniquement pour les rôles `user` et `admin`.
- Les comptes `editor` et `moderator` restent gérés par l’administrateur.
- La réponse reste volontairement générique pour éviter l’énumération des comptes.

### Reset Password
```http
POST /auth/reset-password
Content-Type: application/json

{
  "token": "reset-token-from-email",
  "password": "newSecurePassword123"
}

Response: 200 OK
{
  "message": "Mot de passe mis à jour. Vous pouvez maintenant vous connecter."
}
```

### Get Current User
```http
GET /auth/me
Authorization: Bearer {token}

Response: 200 OK
{
  "id": 1,
  "email": "user@example.com",
  "username": "john_doe",
  "role": "user",
  "created_at": "2026-06-30T..."
}
```

---

## 🎬 Films

### List Films
```http
GET /films?page=1&limit=12&genre=romance&year=2020&sortBy=trending

Query Parameters:
- page: 1-N (default: 1)
- limit: 1-48 (default: 12)
- genre: slug (romance, action, drame, etc)
- year: YYYY
- sortBy: latest|trending|popular|rated|oldest

Response: 200 OK
{
  "data": [
    {
      "id": 1,
      "title": "The Wedding Party",
      "slug": "the-wedding-party",
      "description": "...",
      "poster_url": "...",
      "director": "Kemi Adetiba",
      "country": "Nigeria",
      "year": 2016,
      "duration": 110,
      "youtube_embed_url": "...",
      "views": 1200,
      "average_rating": 4.5,
      "status": "published",
      "created_at": "...",
      "genres": [...],
      "actors": [...]
    }
  ],
  "pagination": {
    "total": 45,
    "page": 1,
    "limit": 12,
    "pages": 4
  }
}
```

### Get Film Details
```http
GET /films/the-wedding-party

Response: 200 OK
{
  "id": 1,
  "title": "The Wedding Party",
  "slug": "the-wedding-party",
  "description": "...",
  "poster_url": "...",
  "director": "Kemi Adetiba",
  "country": "Nigeria",
  "year": 2016,
  "duration": 110,
  "views": 1200,
  "average_rating": 4.5,
  "genres": [
    { "id": 2, "name": "Romance", "slug": "romance" },
    { "id": 3, "name": "Comédie", "slug": "comedie" }
  ],
  "actors": [
    { "id": 1, "name": "Mercy Johnson", "slug": "mercy-johnson", "character_name": "..." }
  ],
  "similar_films": [...],
  "stats": {
    "rating_count": 234,
    "average_rating": 4.5,
    "comments_count": 45
  }
}
```

### Create Film (Editor/Admin)
```http
POST /films
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "New Film",
  "description": "At least 300 characters...",
  "poster_url": "https://...",
  "director": "Director Name",
  "country": "Nigeria",
  "year": 2024,
  "duration": 120,
  "youtube_embed_url": "https://www.youtube.com/embed/...",
  "genres": ["romance", "drame"]
}

Response: 201 Created
{
  "message": "Film created successfully",
  "film": { ... }
}
```

### Update Film (Editor/Admin)
```http
PUT /films/1
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Updated Title",
  "description": "...",
  "status": "published"
}

Response: 200 OK
```

### Delete Film (Admin)
```http
DELETE /films/1
Authorization: Bearer {token}

Response: 200 OK
{
  "message": "Film archived successfully"
}
```

### Record View (Anti-Fraud)
```http
POST /films/1/vues
X-Forwarded-For: 192.168.1.1

Response: 200 OK
{
  "message": "View recorded",
  "views": 1201
}
```

### Get Trending Films
```http
GET /films/trending?limit=6

Response: 200 OK
[
  { ... film data ... }
]
```

### Search
```http
GET /search?q=mercy

Query Parameters:
- q: search term (min 2 characters)

Response: 200 OK
{
  "films": [
    { "id": 1, "title": "...", "slug": "...", "poster_url": "..." }
  ],
  "actors": [
    { "id": 1, "name": "Mercy Johnson", "slug": "...", "photo_url": "..." }
  ]
}
```

---

## 👥 Actors

### List Actors
```http
GET /acteurs?page=1&limit=12&search=mercy

Response: 200 OK
{
  "actors": [ ... ],
  "pagination": { ... }
}
```

### Get Actor Details
```http
GET /acteurs/mercy-johnson

Response: 200 OK
{
  "id": 1,
  "name": "Mercy Johnson",
  "slug": "mercy-johnson",
  "biography": "...",
  "birth_date": "1984-08-28",
  "photo_url": "...",
  "filmography": [
    { "id": 1, "title": "The Wedding Party", "year": 2016, "average_rating": 4.5 }
  ],
  "best_films": [ ... ],
  "film_count": 45
}
```

### Create Actor (Editor/Admin)
```http
POST /acteurs
Authorization: Bearer {token}

{
  "name": "New Actor",
  "biography": "At least 150 characters...",
  "birth_date": "1990-01-15",
  "photo_url": "https://..."
}
```

---

## 📰 Articles

### List Articles
```http
GET /articles?page=1&limit=10&category=Actualités&search=afroflix.tv

Query Parameters:
- page: pagination
- limit: items per page
- category: Actualités|Classements|Analyses|Conseils
- search: text search

Response: 200 OK
{
  "articles": [ ... ],
  "pagination": { ... }
}
```

### Get Article
```http
GET /articles/pourquoi-afroflix.tv-seduit

Response: 200 OK
{
  "id": 1,
  "title": "Pourquoi AfroFlix.TV séduit...",
  "slug": "pourquoi-afroflix.tv-seduit",
  "content": "...",
  "category": "Actualités",
  "featured_image": "...",
  "author": "Rédaction AfroFlix.TV",
  "views": 234,
  "published_at": "2026-06-30T..."
}
```

### Create Article (Editor/Admin)
```http
POST /articles
Authorization: Bearer {token}

{
  "title": "New Article",
  "content": "At least 600 characters...",
  "category": "Analyses",
  "featured_image": "https://...",
  "author": "John Doe"
}
```

### Get Categories
```http
GET /articles/categories

Response: 200 OK
{
  "categories": ["Actualités", "Classements", "Analyses", "Conseils"]
}
```

---

## 🏷️ Genres

### List Genres
```http
GET /genres

Response: 200 OK
[
  {
    "id": 1,
    "name": "Romance",
    "slug": "romance",
    "description": "..."
  }
]
```

### Get Films by Genre
```http
GET /genres/romance/films?page=1&limit=12&sortBy=popular

Response: 200 OK
{
  "genre": { ... },
  "films": [ ... ],
  "pagination": { ... }
}
```

---

## 💬 Comments

### Submit Comment
```http
POST /comments/1/comment
Content-Type: application/json

{
  "content": "Great film!",
  "author_name": "John",
  "author_email": "john@example.com"
}

Response: 201 Created
{
  "message": "Comment submitted for moderation",
  "comment": { ... }
}
```

### Get Film Comments
```http
GET /comments/1?page=1&limit=10

Response: 200 OK
{
  "comments": [
    {
      "id": 1,
      "author_name": "John",
      "content": "Great film!",
      "created_at": "..."
    }
  ],
  "pagination": { ... }
}
```

### Report Comment
```http
POST /comments/1/report

Response: 200 OK
{
  "message": "Comment reported successfully"
}
```

### Get Moderation Queue (Moderator)
```http
GET /comments/moderation/queue?page=1&limit=20
Authorization: Bearer {token}

Response: 200 OK
{
  "comments": [ ... ],
  "pagination": { ... }
}
```

### Approve Comment (Moderator)
```http
PUT /comments/1/approve
Authorization: Bearer {token}

Response: 200 OK
```

---

## ⭐ Ratings

### Submit Rating
```http
POST /ratings/1
Authorization: Bearer {token}

{
  "rating_value": 5
}

Response: 201 Created
{
  "message": "Rating submitted successfully",
  "rating": { ... }
}
```

### Get Rating Stats
```http
GET /ratings/1/stats

Response: 200 OK
{
  "stats": {
    "total_ratings": 234,
    "average_rating": "4.50",
    "min_rating": 1,
    "max_rating": 5,
    "median_rating": 4.5
  },
  "distribution": [
    { "rating_value": 5, "count": 180 },
    { "rating_value": 4, "count": 40 }
  ]
}
```

### Get User's Rating
```http
GET /ratings/1/user
Authorization: Bearer {token}

Response: 200 OK
{
  "id": 45,
  "film_id": 1,
  "user_id": 10,
  "rating_value": 5,
  "created_at": "..."
}
```

---

## ❤️ Favorites

### Get Favorites
```http
GET /favoris?page=1&limit=12
Authorization: Bearer {token}

Response: 200 OK
{
  "films": [ ... ],
  "pagination": { ... }
}
```

### Add to Favorites
```http
POST /favoris/1
Authorization: Bearer {token}

Response: 201 Created
{
  "message": "Film added to favorites",
  "favorite": { ... }
}
```

### Remove from Favorites
```http
DELETE /favoris/1
Authorization: Bearer {token}

Response: 200 OK
{
  "message": "Film removed from favorites"
}
```

### Check Favorite Status
```http
GET /favoris/1/is-favorite
Authorization: Bearer {token}

Response: 200 OK
{
  "is_favorite": true
}
```

---

## 🛡️ Admin

### Get Dashboard Stats
```http
GET /admin/stats
Authorization: Bearer {token}

Response: 200 OK
{
  "overview": {
    "total_films": 150,
    "total_actors": 200,
    "total_articles": 50,
    "total_users": 500,
    "total_comments": 2000,
    "pending_comments": 15
  },
  "today": {
    "films_added": 2,
    "articles_added": 1,
    "new_comments": 5
  },
  "trending": {
    "top_films": [ ... ],
    "top_articles": [ ... ]
  }
}
```

### List Users (Admin)
```http
GET /admin/users?page=1&limit=20&role=editor
Authorization: Bearer {token}

Response: 200 OK
{
  "users": [ ... ],
  "pagination": { ... }
}
```

### Update User Role (Admin)
```http
PUT /admin/users/5/role
Authorization: Bearer {token}

{
  "role": "editor"
}

Response: 200 OK
{
  "message": "User role updated",
  "user": { ... }
}
```

---

## Error Responses

```json
{
  "error": "Error message here"
}
```

### Common Status Codes
- `200` - OK
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict (duplicate)
- `500` - Server Error

---

## Rate Limiting

- **Default**: 100 requests per 15 minutes per IP
- **Sensitive endpoints** (auth, comments): Additional limits

---

## Headers Required

```
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
```

---

**Last Updated**: June 30, 2026  
**Status**: Production Ready
