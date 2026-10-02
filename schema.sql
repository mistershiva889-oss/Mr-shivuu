-- ==============================================================================
-- StreamVibe Relational PostgreSQL Database Schema
-- Production DDL with Foreign Keys, Constraints, and Indexes
-- ==============================================================================

-- Enable UUID extension if available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. App Settings Table
CREATE TABLE IF NOT EXISTS app_settings (
    id VARCHAR(36) PRIMARY KEY DEFAULT 'current_settings',
    app_name VARCHAR(100) NOT NULL DEFAULT 'StreamVibe',
    app_logo TEXT NOT NULL DEFAULT '/src/assets/images/app_brand_logo_1790671540965.jpg',
    tagline VARCHAR(200) NOT NULL DEFAULT 'Watch & Enjoy',
    maintenance_mode BOOLEAN NOT NULL DEFAULT FALSE,
    terms_and_privacy TEXT NOT NULL DEFAULT 'StreamVibe values your privacy. No personal telemetry or unnecessary cookies collected.',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Categories Table
CREATE TABLE IF NOT EXISTS categories (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_order ON categories(display_order);

-- 3. Users Table (No passwords for normal mobile users)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name VARCHAR(150) NOT NULL,
    mobile_number VARCHAR(20) NOT NULL UNIQUE,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'blocked')),
    total_videos_watched INT NOT NULL DEFAULT 0,
    last_active_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_mobile ON users(mobile_number);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_last_active ON users(last_active_at);

-- 4. Admins Table (Passwords securely salted and hashed)
CREATE TABLE IF NOT EXISTS admins (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    salt VARCHAR(64) NOT NULL,
    name VARCHAR(150) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'superadmin' CHECK (role IN ('superadmin', 'admin', 'editor')),
    session_token VARCHAR(255),
    token_expires_at TIMESTAMP WITH TIME ZONE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);
CREATE INDEX IF NOT EXISTS idx_admins_session_token ON admins(session_token);

-- 5. Videos Table (Supports direct video and official YouTube embeds)
CREATE TABLE IF NOT EXISTS videos (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    title VARCHAR(300) NOT NULL,
    description TEXT,
    channel_name VARCHAR(150) NOT NULL,
    channel_avatar TEXT,
    thumbnail_url TEXT NOT NULL,
    video_url TEXT NOT NULL,
    source_type VARCHAR(20) NOT NULL CHECK (source_type IN ('youtube', 'direct')),
    youtube_id VARCHAR(50),
    duration_seconds INT NOT NULL DEFAULT 0,
    category_id VARCHAR(36) REFERENCES categories(id) ON DELETE SET NULL,
    views_count BIGINT NOT NULL DEFAULT 0,
    unique_viewers_count BIGINT NOT NULL DEFAULT 0,
    avg_watch_duration_seconds INT NOT NULL DEFAULT 0,
    completion_rate NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    is_published BOOLEAN NOT NULL DEFAULT TRUE,
    published_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_videos_category ON videos(category_id);
CREATE INDEX IF NOT EXISTS idx_videos_published ON videos(is_published, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_videos_views ON videos(views_count DESC);
CREATE INDEX IF NOT EXISTS idx_videos_source_type ON videos(source_type);

-- 6. Video Views & Analytics Table
CREATE TABLE IF NOT EXISTS video_views (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    video_id VARCHAR(36) NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    user_id VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL,
    watch_duration_seconds INT NOT NULL DEFAULT 0,
    completion_rate NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_video_views_video ON video_views(video_id);
CREATE INDEX IF NOT EXISTS idx_video_views_user ON video_views(user_id);
CREATE INDEX IF NOT EXISTS idx_video_views_time ON video_views(viewed_at);

-- 7. Admin Activity Logs Table
CREATE TABLE IF NOT EXISTS admin_activity_logs (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    admin_id VARCHAR(36) REFERENCES admins(id) ON DELETE SET NULL,
    admin_email VARCHAR(255) NOT NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(100),
    details TEXT,
    ip_address VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_admin_logs_admin ON admin_activity_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created ON admin_activity_logs(created_at DESC);

-- ==============================================================================
-- Seed Initial Category and Admin Setup
-- Password for initial admin is 'admin123'
-- Hash computed using scrypt/pbkdf2:
-- ==============================================================================
INSERT INTO categories (id, name, slug, description, display_order)
VALUES 
    ('cat_trending', 'Trending', 'trending', 'Top trending and viral videos', 1),
    ('cat_tech', 'Technology', 'technology', 'Latest gadgets, software, and future tech', 2),
    ('cat_nature', 'Nature & Travel', 'nature-travel', 'Documentaries, wildlife, and landscapes', 3),
    ('cat_music', 'Music & Live', 'music-live', 'Acoustic performances and musical showcases', 4),
    ('cat_education', 'Education', 'education', 'Science, engineering, and deep dives', 5)
ON CONFLICT (slug) DO NOTHING;
