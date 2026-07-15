const pool = require('./pool');

const ensureDatabaseReady = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS contact_messages (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      subject VARCHAR(255),
      message TEXT NOT NULL,
      status VARCHAR(50) DEFAULT 'new' CHECK (status IN ('new', 'read', 'archived')),
      ip_address VARCHAR(45),
      user_agent TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_contact_messages_status_created
    ON contact_messages(status, created_at DESC)
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS newsletter_subscribers (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      status VARCHAR(50) DEFAULT 'subscribed' CHECK (status IN ('subscribed', 'unsubscribed')),
      unsubscribe_token VARCHAR(64) UNIQUE NOT NULL,
      source VARCHAR(100) DEFAULT 'footer',
      subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      unsubscribed_at TIMESTAMP,
      last_notified_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_status
    ON newsletter_subscribers(status, subscribed_at DESC)
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS comment_reports (
      id SERIAL PRIMARY KEY,
      comment_id INTEGER NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
      reporter_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      ip_address VARCHAR(45),
      user_agent TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_comment_reports_comment_created
    ON comment_reports(comment_id, created_at DESC)
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_comment_reports_user_created
    ON comment_reports(reporter_user_id, created_at DESC)
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_comment_reports_ip_created
    ON comment_reports(ip_address, created_at DESC)
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash VARCHAR(64) UNIQUE NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      used_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_hash
    ON password_reset_tokens(token_hash)
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_expires
    ON password_reset_tokens(user_id, expires_at DESC)
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS email_outbox (
      id SERIAL PRIMARY KEY,
      type VARCHAR(80) NOT NULL,
      status VARCHAR(30) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'sending', 'sent', 'failed')),
      payload JSONB NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0,
      max_attempts INTEGER NOT NULL DEFAULT 8,
      last_error TEXT,
      provider_message_id VARCHAR(255),
      next_attempt_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      sent_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_email_outbox_status_next_attempt
    ON email_outbox(status, next_attempt_at, created_at)
  `);

  await pool.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_email_format_chk') THEN
        ALTER TABLE users
          ADD CONSTRAINT users_email_format_chk
          CHECK (email ~* '^[^[:space:]@]+@[^[:space:]@]+\\.[^[:space:]@]{2,}$') NOT VALID;
      END IF;

      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'films_year_chk') THEN
        ALTER TABLE films
          ADD CONSTRAINT films_year_chk
          CHECK (year IS NULL OR (year BETWEEN 1888 AND EXTRACT(YEAR FROM CURRENT_DATE)::INT + 5)) NOT VALID;
      END IF;

      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'films_duration_chk') THEN
        ALTER TABLE films
          ADD CONSTRAINT films_duration_chk
          CHECK (duration IS NULL OR (duration BETWEEN 1 AND 600)) NOT VALID;
      END IF;

      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'films_status_chk') THEN
        ALTER TABLE films
          ADD CONSTRAINT films_status_chk
          CHECK (status IN ('published', 'draft', 'archived')) NOT VALID;
      END IF;

      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'actors_status_chk') THEN
        ALTER TABLE actors
          ADD CONSTRAINT actors_status_chk
          CHECK (status IN ('published', 'draft', 'archived')) NOT VALID;
      END IF;

      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'articles_status_chk') THEN
        ALTER TABLE articles
          ADD CONSTRAINT articles_status_chk
          CHECK (status IN ('published', 'draft', 'archived')) NOT VALID;
      END IF;

      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'genres_status_chk') THEN
        ALTER TABLE genres
          ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'published';
        ALTER TABLE genres
          ADD CONSTRAINT genres_status_chk
          CHECK (status IN ('published', 'draft', 'archived')) NOT VALID;
      END IF;

      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'comments_email_format_chk') THEN
        ALTER TABLE comments
          ADD CONSTRAINT comments_email_format_chk
          CHECK (author_email IS NULL OR author_email ~* '^[^[:space:]@]+@[^[:space:]@]+\\.[^[:space:]@]{2,}$') NOT VALID;
      END IF;

      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'comments_content_length_chk') THEN
        ALTER TABLE comments
          ADD CONSTRAINT comments_content_length_chk
          CHECK (char_length(btrim(content)) BETWEEN 5 AND 2000) NOT VALID;
      END IF;

      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'contact_messages_email_format_chk') THEN
        ALTER TABLE contact_messages
          ADD CONSTRAINT contact_messages_email_format_chk
          CHECK (email ~* '^[^[:space:]@]+@[^[:space:]@]+\\.[^[:space:]@]{2,}$') NOT VALID;
      END IF;

      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'newsletter_subscribers_email_format_chk') THEN
        ALTER TABLE newsletter_subscribers
          ADD CONSTRAINT newsletter_subscribers_email_format_chk
          CHECK (email ~* '^[^[:space:]@]+@[^[:space:]@]+\\.[^[:space:]@]{2,}$') NOT VALID;
      END IF;
    END $$;
  `);

  await pool.query(`
    UPDATE users AS u
    SET email = CASE u.email
        WHEN 'admin@afroflix.tv' THEN 'admin@afroflix-tv.com'
        WHEN 'editor@afroflix.tv' THEN 'editor@afroflix-tv.com'
        WHEN 'moderator@afroflix.tv' THEN 'moderator@afroflix-tv.com'
        ELSE REPLACE(u.email, '@nollywood.com', '@afroflix-tv.com')
      END,
      updated_at = CURRENT_TIMESTAMP
    WHERE (
        u.email IN ('admin@afroflix.tv', 'editor@afroflix.tv', 'moderator@afroflix.tv')
        OR u.email LIKE '%@nollywood.com'
      )
      AND NOT EXISTS (
        SELECT 1
        FROM users existing
        WHERE existing.id <> u.id
          AND existing.email = CASE u.email
            WHEN 'admin@afroflix.tv' THEN 'admin@afroflix-tv.com'
            WHEN 'editor@afroflix.tv' THEN 'editor@afroflix-tv.com'
            WHEN 'moderator@afroflix.tv' THEN 'moderator@afroflix-tv.com'
            ELSE REPLACE(u.email, '@nollywood.com', '@afroflix-tv.com')
          END
      )
  `);
};

module.exports = { ensureDatabaseReady };
