-- =============================================================================
-- SwanyThree Platform - PostgreSQL Database Schema
-- =============================================================================
-- Version: 1.0.0
-- Description: Complete database schema for the SwanyThree streaming platform
-- Includes: 30+ tables, 40+ indexes, triggers, seed data
-- =============================================================================

-- =============================================================================
-- XP SYSTEM CONSTANTS
-- =============================================================================
-- XP_PER_STREAM_START      = 50
-- XP_PER_STREAM_MINUTE     = 2
-- XP_PER_TIP_SENT          = 10
-- XP_PER_TIP_RECEIVED      = 5
-- XP_PER_CHAT_MESSAGE       = 1  (max 50/day)
-- XP_PER_NEW_FOLLOWER      = 3
-- XP_PER_CHALLENGE_COMPLETE = varies (100-300)
-- XP_PER_BADGE_EARNED      = varies (25-5000)
-- STREAK_MULTIPLIER_BASE   = 1.0
-- STREAK_MULTIPLIER_INC    = 0.05 per day (max 2.0)
-- LEVEL_XP_FORMULA         = level * level * 100
-- LEVEL_TITLES:
--   1-2   = Newcomer
--   3-4   = Beginner
--   5-6   = Regular
--   7-8   = Enthusiast
--   9-10  = Veteran
--   11-12 = Expert
--   13-14 = Master
--   15-16 = Legend
--   17-18 = Mythic
--   19-20 = Transcendent
--   21+   = Immortal
-- PLATFORM_FEE_RATE        = 0.10  (10%)
-- =============================================================================

-- =============================================================================
-- EXTENSIONS
-- =============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =============================================================================
-- TRIGGER FUNCTION: Auto-update updated_at timestamp
-- =============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- TABLE 1: users
-- =============================================================================
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email           VARCHAR(255) UNIQUE NOT NULL,
    username        VARCHAR(50) UNIQUE NOT NULL,
    display_name    VARCHAR(100),
    password_hash   TEXT NOT NULL,
    avatar_url      TEXT,
    bio             TEXT,
    role            VARCHAR(20) NOT NULL DEFAULT 'creator'
                        CHECK (role IN ('admin', 'moderator', 'creator', 'viewer')),
    is_verified     BOOLEAN DEFAULT false,
    is_active       BOOLEAN DEFAULT true,
    email_verified  BOOLEAN DEFAULT false,
    stripe_customer_id  VARCHAR(255),
    stripe_connect_id   VARCHAR(255),
    onboarding_complete BOOLEAN DEFAULT false,
    follower_count  INTEGER DEFAULT 0,
    following_count INTEGER DEFAULT 0,
    last_login_at   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- TABLE 2: user_sessions
-- =============================================================================
CREATE TABLE user_sessions (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash          TEXT,
    refresh_token_hash  TEXT,
    device_info         JSONB,
    ip_address          INET,
    expires_at          TIMESTAMPTZ,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- TABLE 3: user_oauth
-- =============================================================================
CREATE TABLE user_oauth (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider        VARCHAR(50) NOT NULL,
    provider_id     VARCHAR(255) NOT NULL,
    access_token    TEXT,
    refresh_token   TEXT,
    token_expires   TIMESTAMPTZ,
    profile_data    JSONB,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (provider, provider_id)
);

-- =============================================================================
-- TABLE 4: user_settings
-- =============================================================================
CREATE TABLE user_settings (
    user_id             UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    notification_prefs  JSONB DEFAULT '{"email":true,"push":true,"streak_reminder":true}',
    stream_defaults     JSONB DEFAULT '{"quality":"1080p","mode":"solo","visibility":"public"}',
    chat_prefs          JSONB DEFAULT '{"show_badges":true,"compact_mode":false}',
    theme               VARCHAR(20) DEFAULT 'dark',
    language            VARCHAR(10) DEFAULT 'en',
    timezone            VARCHAR(50) DEFAULT 'UTC',
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER trg_user_settings_updated_at
    BEFORE UPDATE ON user_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- TABLE 5: streams
-- =============================================================================
CREATE TABLE streams (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title           VARCHAR(200) NOT NULL,
    description     TEXT,
    thumbnail_url   TEXT,
    category        VARCHAR(100),
    mode            VARCHAR(20) NOT NULL DEFAULT 'solo'
                        CHECK (mode IN ('solo', 'panel_video', 'panel_audio', 'watch_party', 'interview')),
    visibility      VARCHAR(20) NOT NULL DEFAULT 'public'
                        CHECK (visibility IN ('public', 'private', 'unlisted', 'subscribers', 'paywall')),
    status          VARCHAR(20) NOT NULL DEFAULT 'scheduled'
                        CHECK (status IN ('scheduled', 'live', 'ended', 'cancelled')),
    paywall_price   DECIMAL(10,2) DEFAULT 0,
    tip_minimum     DECIMAL(10,2) DEFAULT 1,
    stream_key      VARCHAR(255) UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
    rtmp_url        TEXT,
    hls_url         TEXT,
    dash_url        TEXT,
    webrtc_room_id  VARCHAR(255),
    vdoninja_room   VARCHAR(255),
    peak_viewers    INTEGER DEFAULT 0,
    total_viewers   INTEGER DEFAULT 0,
    total_revenue   DECIMAL(10,2) DEFAULT 0,
    chat_messages   INTEGER DEFAULT 0,
    started_at      TIMESTAMPTZ,
    ended_at        TIMESTAMPTZ,
    duration_seconds INTEGER DEFAULT 0,
    is_recording    BOOLEAN DEFAULT false,
    tags            TEXT[] DEFAULT '{}',
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER trg_streams_updated_at
    BEFORE UPDATE ON streams
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- TABLE 6: stream_guests
-- =============================================================================
CREATE TABLE stream_guests (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stream_id       UUID NOT NULL REFERENCES streams(id) ON DELETE CASCADE,
    user_id         UUID REFERENCES users(id),
    guest_name      VARCHAR(100),
    role            VARCHAR(20) NOT NULL DEFAULT 'guest'
                        CHECK (role IN ('co-host', 'guest', 'viewer')),
    status          VARCHAR(20) NOT NULL DEFAULT 'invited'
                        CHECK (status IN ('invited', 'connected', 'disconnected')),
    invite_token    VARCHAR(255) UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
    webrtc_peer_id  VARCHAR(255),
    join_method     VARCHAR(50) DEFAULT 'vdoninja',
    has_video       BOOLEAN DEFAULT true,
    has_audio       BOOLEAN DEFAULT true,
    is_muted_by_host BOOLEAN DEFAULT false,
    joined_at       TIMESTAMPTZ,
    left_at         TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- TABLE 7: stream_destinations
-- =============================================================================
CREATE TABLE stream_destinations (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stream_id           UUID NOT NULL REFERENCES streams(id) ON DELETE CASCADE,
    user_id             UUID REFERENCES users(id),
    platform            VARCHAR(20) NOT NULL
                            CHECK (platform IN ('youtube', 'twitch', 'kick', 'tiktok', 'facebook', 'x', 'custom')),
    display_name        VARCHAR(100),
    rtmp_url            TEXT,
    encrypted_stream_key TEXT NOT NULL,
    resolution          VARCHAR(20) DEFAULT '1920x1080',
    bitrate             INTEGER DEFAULT 5000,
    status              VARCHAR(20) NOT NULL DEFAULT 'idle'
                            CHECK (status IN ('idle', 'connecting', 'live', 'error', 'stopped')),
    ffmpeg_pid          INTEGER,
    error_message       TEXT,
    started_at          TIMESTAMPTZ,
    stopped_at          TIMESTAMPTZ,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER trg_stream_destinations_updated_at
    BEFORE UPDATE ON stream_destinations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- TABLE 8: recordings
-- =============================================================================
CREATE TABLE recordings (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stream_id           UUID NOT NULL REFERENCES streams(id) ON DELETE CASCADE,
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title               VARCHAR(200),
    file_url            TEXT,
    thumbnail_url       TEXT,
    storage_provider    VARCHAR(20) DEFAULT 'r2'
                            CHECK (storage_provider IN ('local', 'r2', 's3')),
    file_size_bytes     BIGINT DEFAULT 0,
    duration_seconds    INTEGER DEFAULT 0,
    format              VARCHAR(20) DEFAULT 'mp4',
    resolution          VARCHAR(20),
    is_multitrack       BOOLEAN DEFAULT false,
    is_processed        BOOLEAN DEFAULT false,
    transcode_status    VARCHAR(20) DEFAULT 'pending'
                            CHECK (transcode_status IN ('pending', 'processing', 'complete', 'failed')),
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER trg_recordings_updated_at
    BEFORE UPDATE ON recordings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- TABLE 9: transactions
-- =============================================================================
CREATE TABLE transactions (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stream_id               UUID REFERENCES streams(id),
    sender_id               UUID REFERENCES users(id),
    recipient_id            UUID NOT NULL REFERENCES users(id),
    type                    VARCHAR(20) NOT NULL
                                CHECK (type IN ('tip', 'paywall', 'subscription', 'payout')),
    gross_amount            DECIMAL(10,2) NOT NULL,
    platform_fee            DECIMAL(10,2),
    processor_fee           DECIMAL(10,2) DEFAULT 0,
    net_amount              DECIMAL(10,2),
    currency                VARCHAR(10) DEFAULT 'usd',
    status                  VARCHAR(20) NOT NULL DEFAULT 'pending'
                                CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    stripe_payment_intent_id VARCHAR(255),
    stripe_transfer_id      VARCHAR(255),
    source                  VARCHAR(20) DEFAULT 'stripe'
                                CHECK (source IN ('stripe', 'paypal', 'cashapp', 'crypto')),
    message                 TEXT,
    metadata                JSONB DEFAULT '{}',
    created_at              TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- TRIGGER FUNCTION: Calculate transaction fees (10% platform fee)
-- =============================================================================
CREATE OR REPLACE FUNCTION calculate_transaction_fees()
RETURNS TRIGGER AS $$
BEGIN
    NEW.platform_fee := ROUND(NEW.gross_amount * 0.10, 2);
    NEW.net_amount := NEW.gross_amount - NEW.platform_fee - COALESCE(NEW.processor_fee, 0);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_transactions_calculate_fees
    BEFORE INSERT ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION calculate_transaction_fees();

-- =============================================================================
-- TRIGGER FUNCTION: Update stream revenue on completed transaction
-- =============================================================================
CREATE OR REPLACE FUNCTION update_stream_revenue()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND NEW.stream_id IS NOT NULL THEN
        UPDATE streams
        SET total_revenue = total_revenue + NEW.gross_amount
        WHERE id = NEW.stream_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_transactions_update_stream_revenue
    AFTER INSERT ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_stream_revenue();

-- =============================================================================
-- TABLE 10: payouts
-- =============================================================================
CREATE TABLE payouts (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount              DECIMAL(10,2) NOT NULL,
    currency            VARCHAR(10) DEFAULT 'usd',
    status              VARCHAR(20) NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    stripe_payout_id    VARCHAR(255),
    period_start        DATE,
    period_end          DATE,
    transaction_count   INTEGER,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    processed_at        TIMESTAMPTZ
);

-- =============================================================================
-- TABLE 11: subscriptions
-- =============================================================================
CREATE TABLE subscriptions (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subscriber_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    creator_id              UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tier                    VARCHAR(20) NOT NULL DEFAULT 'basic'
                                CHECK (tier IN ('basic', 'premium', 'vip')),
    price_cents             INTEGER NOT NULL,
    currency                VARCHAR(10) DEFAULT 'usd',
    status                  VARCHAR(20) NOT NULL DEFAULT 'active'
                                CHECK (status IN ('active', 'cancelled', 'expired', 'past_due')),
    stripe_subscription_id  VARCHAR(255),
    current_period_start    TIMESTAMPTZ,
    current_period_end      TIMESTAMPTZ,
    cancelled_at            TIMESTAMPTZ,
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    updated_at              TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (subscriber_id, creator_id)
);

CREATE TRIGGER trg_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- TABLE 12: user_gamification
-- =============================================================================
CREATE TABLE user_gamification (
    user_id             UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    total_xp            INTEGER DEFAULT 0,
    level               INTEGER DEFAULT 1,
    level_title         VARCHAR(50) DEFAULT 'Newcomer',
    current_streak      INTEGER DEFAULT 0,
    best_streak         INTEGER DEFAULT 0,
    last_active_date    DATE,
    streak_multiplier   DECIMAL(3,2) DEFAULT 1.0,
    total_streams       INTEGER DEFAULT 0,
    total_stream_minutes INTEGER DEFAULT 0,
    total_tips_sent     INTEGER DEFAULT 0,
    total_tips_received INTEGER DEFAULT 0,
    badge_count         INTEGER DEFAULT 0,
    weekly_xp           INTEGER DEFAULT 0,
    monthly_xp          INTEGER DEFAULT 0,
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER trg_user_gamification_updated_at
    BEFORE UPDATE ON user_gamification
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- TABLE 13: xp_history
-- =============================================================================
CREATE TABLE xp_history (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action      VARCHAR(50) NOT NULL,
    xp_base     INTEGER NOT NULL,
    multiplier  DECIMAL(3,2) DEFAULT 1.0,
    xp_earned   INTEGER NOT NULL,
    stream_id   UUID REFERENCES streams(id),
    metadata    JSONB DEFAULT '{}',
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- TABLE 14: badges
-- =============================================================================
CREATE TABLE badges (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug                VARCHAR(100) UNIQUE NOT NULL,
    name                VARCHAR(100) NOT NULL,
    description         TEXT,
    icon                VARCHAR(10),
    category            VARCHAR(20) NOT NULL
                            CHECK (category IN ('streaming', 'social', 'revenue', 'achievement')),
    rarity              VARCHAR(20) NOT NULL
                            CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary')),
    requirement_type    VARCHAR(100),
    requirement_value   INTEGER,
    xp_reward           INTEGER DEFAULT 0,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- TABLE 15: user_badges
-- =============================================================================
CREATE TABLE user_badges (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    badge_id    UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
    earned_at   TIMESTAMPTZ DEFAULT NOW(),
    notified    BOOLEAN DEFAULT false,
    UNIQUE (user_id, badge_id)
);

-- =============================================================================
-- TABLE 16: weekly_challenges
-- =============================================================================
CREATE TABLE weekly_challenges (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title           VARCHAR(200) NOT NULL,
    description     TEXT,
    icon            VARCHAR(10),
    action_type     VARCHAR(50),
    target          INTEGER NOT NULL,
    xp_reward       INTEGER DEFAULT 100,
    bonus_badge_id  UUID REFERENCES badges(id),
    week_number     INTEGER NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- TABLE 17: user_challenge_progress
-- =============================================================================
CREATE TABLE user_challenge_progress (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    challenge_id        UUID NOT NULL REFERENCES weekly_challenges(id) ON DELETE CASCADE,
    current_progress    INTEGER DEFAULT 0,
    completed           BOOLEAN DEFAULT false,
    completed_at        TIMESTAMPTZ,
    xp_awarded          BOOLEAN DEFAULT false,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, challenge_id)
);

CREATE TRIGGER trg_user_challenge_progress_updated_at
    BEFORE UPDATE ON user_challenge_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- TABLE 18: chat_messages
-- =============================================================================
CREATE TABLE chat_messages (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stream_id           UUID NOT NULL REFERENCES streams(id) ON DELETE CASCADE,
    user_id             UUID REFERENCES users(id),
    username            VARCHAR(100) NOT NULL,
    content             TEXT NOT NULL,
    platform            VARCHAR(20) NOT NULL DEFAULT 'native'
                            CHECK (platform IN ('native', 'youtube', 'twitch', 'kick', 'tiktok',
                                                'discord', 'facebook', 'x', 'instagram', 'telegram', 'custom')),
    type                VARCHAR(20) NOT NULL DEFAULT 'message'
                            CHECK (type IN ('message', 'system', 'bot', 'tip', 'announcement')),
    is_pinned           BOOLEAN DEFAULT false,
    is_deleted          BOOLEAN DEFAULT false,
    moderation_status   VARCHAR(20) DEFAULT 'clean',
    moderation_flags    JSONB DEFAULT '{}',
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- TABLE 19: chat_bans
-- =============================================================================
CREATE TABLE chat_bans (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stream_id   UUID NOT NULL REFERENCES streams(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    banned_by   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason      TEXT,
    ban_type    VARCHAR(20) NOT NULL DEFAULT 'stream'
                    CHECK (ban_type IN ('stream', 'platform')),
    expires_at  TIMESTAMPTZ,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- TABLE 20: followers (junction table)
-- =============================================================================
CREATE TABLE followers (
    follower_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    followed_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (follower_id, followed_id)
);

-- =============================================================================
-- TRIGGER FUNCTIONS: Follower count management
-- =============================================================================
CREATE OR REPLACE FUNCTION increment_follower_counts()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE users SET following_count = following_count + 1 WHERE id = NEW.follower_id;
    UPDATE users SET follower_count = follower_count + 1 WHERE id = NEW.followed_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrement_follower_counts()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE users SET following_count = following_count - 1 WHERE id = OLD.follower_id;
    UPDATE users SET follower_count = follower_count - 1 WHERE id = OLD.followed_id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_followers_insert
    AFTER INSERT ON followers
    FOR EACH ROW
    EXECUTE FUNCTION increment_follower_counts();

CREATE TRIGGER trg_followers_delete
    AFTER DELETE ON followers
    FOR EACH ROW
    EXECUTE FUNCTION decrement_follower_counts();

-- =============================================================================
-- TABLE 21: notifications
-- =============================================================================
CREATE TABLE notifications (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type        VARCHAR(20) NOT NULL
                    CHECK (type IN ('follow', 'tip', 'badge', 'level_up', 'challenge', 'stream_live', 'system')),
    title       VARCHAR(255),
    body        TEXT,
    data        JSONB DEFAULT '{}',
    is_read     BOOLEAN DEFAULT false,
    read_at     TIMESTAMPTZ,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- TABLE 22: posts
-- =============================================================================
CREATE TABLE posts (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    stream_id       UUID REFERENCES streams(id),
    title           VARCHAR(200),
    content         TEXT,
    media_url       TEXT,
    thumbnail_url   TEXT,
    type            VARCHAR(20) NOT NULL DEFAULT 'clip'
                        CHECK (type IN ('clip', 'highlight', 'text', 'announcement')),
    like_count      INTEGER DEFAULT 0,
    comment_count   INTEGER DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER trg_posts_updated_at
    BEFORE UPDATE ON posts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- TABLE 23: post_likes (junction table)
-- =============================================================================
CREATE TABLE post_likes (
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id     UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, post_id)
);

-- =============================================================================
-- TABLE 24: post_comments
-- =============================================================================
CREATE TABLE post_comments (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id     UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content     TEXT NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- TABLE 25: ai_tasks
-- =============================================================================
CREATE TABLE ai_tasks (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stream_id       UUID REFERENCES streams(id),
    user_id         UUID REFERENCES users(id),
    task_type       VARCHAR(20) NOT NULL
                        CHECK (task_type IN ('moderation', 'transcription', 'summary', 'tts', 'chat_response')),
    input_data      JSONB NOT NULL,
    output_data     JSONB,
    status          VARCHAR(20) NOT NULL DEFAULT 'queued'
                        CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
    model_used      VARCHAR(100),
    tokens_used     INTEGER,
    latency_ms      INTEGER,
    cost_usd        DECIMAL(8,4),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    completed_at    TIMESTAMPTZ
);

-- =============================================================================
-- TABLE 26: stream_transcripts
-- =============================================================================
CREATE TABLE stream_transcripts (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stream_id       UUID NOT NULL REFERENCES streams(id) ON DELETE CASCADE,
    segment_start   INTEGER,
    segment_end     INTEGER,
    text            TEXT NOT NULL,
    language        VARCHAR(10) DEFAULT 'en',
    confidence      DECIMAL(3,2),
    speaker_label   VARCHAR(100),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- TABLE 27: stream_analytics
-- =============================================================================
CREATE TABLE stream_analytics (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stream_id           UUID NOT NULL REFERENCES streams(id) ON DELETE CASCADE,
    timestamp           TIMESTAMPTZ NOT NULL,
    viewer_count        INTEGER,
    chat_rate_per_min   INTEGER,
    new_followers       INTEGER,
    tips_total          DECIMAL(10,2),
    engagement_score    DECIMAL(5,2)
);

-- =============================================================================
-- TABLE 28: platform_metrics
-- =============================================================================
CREATE TABLE platform_metrics (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date                    DATE UNIQUE NOT NULL,
    total_users             INTEGER,
    new_users               INTEGER,
    active_users            INTEGER,
    total_streams           INTEGER,
    live_streams            INTEGER,
    total_stream_minutes    INTEGER,
    total_revenue           DECIMAL(10,2),
    total_tips              DECIMAL(10,2),
    total_paywall           DECIMAL(10,2),
    total_chat_messages     INTEGER,
    total_new_followers     INTEGER,
    created_at              TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- TABLE 29: vault_items
-- =============================================================================
CREATE TABLE vault_items (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item_type       VARCHAR(30) NOT NULL
                        CHECK (item_type IN ('stream_key', 'api_token', 'oauth_credential')),
    platform        VARCHAR(50),
    label           VARCHAR(100),
    encrypted_data  TEXT NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, item_type, platform)
);

CREATE TRIGGER trg_vault_items_updated_at
    BEFORE UPDATE ON vault_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- TABLE 30: embed_configs
-- =============================================================================
CREATE TABLE embed_configs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stream_id       UUID NOT NULL REFERENCES streams(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    theme           VARCHAR(20) DEFAULT 'dark',
    show_chat       BOOLEAN DEFAULT true,
    show_branding   BOOLEAN DEFAULT true,
    allowed_domains TEXT[] DEFAULT '{}',
    custom_css      TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER trg_embed_configs_updated_at
    BEFORE UPDATE ON embed_configs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- TRIGGER FUNCTION: Auto-create user_gamification + user_settings on user insert
-- =============================================================================
CREATE OR REPLACE FUNCTION create_user_defaults()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_gamification (user_id) VALUES (NEW.id);
    INSERT INTO user_settings (user_id) VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_create_defaults
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION create_user_defaults();

-- =============================================================================
-- INDEXES (40+)
-- =============================================================================

-- ---- users ----
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_active ON users(is_active);
CREATE INDEX idx_users_username_trgm ON users USING gin(username gin_trgm_ops);

-- ---- user_sessions ----
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_token_hash ON user_sessions(token_hash);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);

-- ---- user_oauth ----
CREATE INDEX idx_user_oauth_user_id ON user_oauth(user_id);
CREATE INDEX idx_user_oauth_provider ON user_oauth(provider, provider_id);

-- ---- streams ----
CREATE INDEX idx_streams_user_id ON streams(user_id);
CREATE INDEX idx_streams_status ON streams(status);
CREATE INDEX idx_streams_status_created ON streams(status, created_at DESC);
CREATE INDEX idx_streams_user_status ON streams(user_id, status);
CREATE INDEX idx_streams_category ON streams(category);
CREATE INDEX idx_streams_stream_key ON streams(stream_key);
CREATE INDEX idx_streams_visibility ON streams(visibility);
CREATE INDEX idx_streams_started_at ON streams(started_at DESC);

-- ---- stream_guests ----
CREATE INDEX idx_stream_guests_stream_id ON stream_guests(stream_id);
CREATE INDEX idx_stream_guests_user_id ON stream_guests(user_id);
CREATE INDEX idx_stream_guests_invite_token ON stream_guests(invite_token);

-- ---- stream_destinations ----
CREATE INDEX idx_stream_destinations_stream_id ON stream_destinations(stream_id);
CREATE INDEX idx_stream_destinations_user_id ON stream_destinations(user_id);
CREATE INDEX idx_stream_destinations_status ON stream_destinations(status);

-- ---- recordings ----
CREATE INDEX idx_recordings_stream_id ON recordings(stream_id);
CREATE INDEX idx_recordings_user_id ON recordings(user_id);
CREATE INDEX idx_recordings_transcode_status ON recordings(transcode_status);

-- ---- transactions ----
CREATE INDEX idx_transactions_stream_id ON transactions(stream_id);
CREATE INDEX idx_transactions_sender_id ON transactions(sender_id);
CREATE INDEX idx_transactions_recipient_id ON transactions(recipient_id);
CREATE INDEX idx_transactions_recipient_created ON transactions(recipient_id, created_at DESC);
CREATE INDEX idx_transactions_recipient_status_created ON transactions(recipient_id, status, created_at);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_stripe_pi ON transactions(stripe_payment_intent_id);

-- ---- payouts ----
CREATE INDEX idx_payouts_user_id ON payouts(user_id);
CREATE INDEX idx_payouts_status ON payouts(status);

-- ---- subscriptions ----
CREATE INDEX idx_subscriptions_subscriber_id ON subscriptions(subscriber_id);
CREATE INDEX idx_subscriptions_creator_id ON subscriptions(creator_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_stripe_id ON subscriptions(stripe_subscription_id);

-- ---- user_gamification ----
CREATE INDEX idx_user_gamification_total_xp ON user_gamification(total_xp DESC);
CREATE INDEX idx_user_gamification_weekly_xp ON user_gamification(weekly_xp DESC);
CREATE INDEX idx_user_gamification_level ON user_gamification(level DESC);
CREATE INDEX idx_user_gamification_current_streak ON user_gamification(current_streak DESC);

-- ---- xp_history ----
CREATE INDEX idx_xp_history_user_id ON xp_history(user_id);
CREATE INDEX idx_xp_history_user_created ON xp_history(user_id, created_at DESC);
CREATE INDEX idx_xp_history_stream_id ON xp_history(stream_id);
CREATE INDEX idx_xp_history_action ON xp_history(action);

-- ---- badges ----
CREATE INDEX idx_badges_slug ON badges(slug);
CREATE INDEX idx_badges_category ON badges(category);
CREATE INDEX idx_badges_rarity ON badges(rarity);

-- ---- user_badges ----
CREATE INDEX idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX idx_user_badges_badge_id ON user_badges(badge_id);
CREATE INDEX idx_user_badges_earned_at ON user_badges(earned_at DESC);

-- ---- weekly_challenges ----
CREATE INDEX idx_weekly_challenges_week_number ON weekly_challenges(week_number);
CREATE INDEX idx_weekly_challenges_action_type ON weekly_challenges(action_type);

-- ---- user_challenge_progress ----
CREATE INDEX idx_user_challenge_progress_user_id ON user_challenge_progress(user_id);
CREATE INDEX idx_user_challenge_progress_challenge_id ON user_challenge_progress(challenge_id);
CREATE INDEX idx_user_challenge_progress_completed ON user_challenge_progress(completed);

-- ---- chat_messages ----
CREATE INDEX idx_chat_messages_stream_id ON chat_messages(stream_id);
CREATE INDEX idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX idx_chat_messages_stream_created ON chat_messages(stream_id, created_at DESC);
CREATE INDEX idx_chat_messages_platform ON chat_messages(platform);
CREATE INDEX idx_chat_messages_content_trgm ON chat_messages USING gin(content gin_trgm_ops);

-- ---- chat_bans ----
CREATE INDEX idx_chat_bans_stream_id ON chat_bans(stream_id);
CREATE INDEX idx_chat_bans_user_id ON chat_bans(user_id);
CREATE INDEX idx_chat_bans_banned_by ON chat_bans(banned_by);

-- ---- followers ----
CREATE INDEX idx_followers_followed_id ON followers(followed_id);
CREATE INDEX idx_followers_follower_id ON followers(follower_id);
CREATE INDEX idx_followers_created_at ON followers(created_at DESC);

-- ---- notifications ----
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_user_read_created ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX idx_notifications_type ON notifications(type);

-- ---- posts ----
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_stream_id ON posts(stream_id);
CREATE INDEX idx_posts_type ON posts(type);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);

-- ---- post_likes ----
CREATE INDEX idx_post_likes_post_id ON post_likes(post_id);
CREATE INDEX idx_post_likes_user_id ON post_likes(user_id);

-- ---- post_comments ----
CREATE INDEX idx_post_comments_post_id ON post_comments(post_id);
CREATE INDEX idx_post_comments_user_id ON post_comments(user_id);

-- ---- ai_tasks ----
CREATE INDEX idx_ai_tasks_stream_id ON ai_tasks(stream_id);
CREATE INDEX idx_ai_tasks_user_id ON ai_tasks(user_id);
CREATE INDEX idx_ai_tasks_status ON ai_tasks(status);
CREATE INDEX idx_ai_tasks_task_type ON ai_tasks(task_type);

-- ---- stream_transcripts ----
CREATE INDEX idx_stream_transcripts_stream_id ON stream_transcripts(stream_id);
CREATE INDEX idx_stream_transcripts_segment ON stream_transcripts(stream_id, segment_start);

-- ---- stream_analytics ----
CREATE INDEX idx_stream_analytics_stream_id ON stream_analytics(stream_id);
CREATE INDEX idx_stream_analytics_stream_timestamp ON stream_analytics(stream_id, timestamp);
CREATE INDEX idx_stream_analytics_timestamp ON stream_analytics(timestamp);

-- ---- platform_metrics ----
CREATE INDEX idx_platform_metrics_date ON platform_metrics(date);

-- ---- vault_items ----
CREATE INDEX idx_vault_items_user_id ON vault_items(user_id);
CREATE INDEX idx_vault_items_user_type ON vault_items(user_id, item_type);

-- ---- embed_configs ----
CREATE INDEX idx_embed_configs_stream_id ON embed_configs(stream_id);
CREATE INDEX idx_embed_configs_user_id ON embed_configs(user_id);

-- =============================================================================
-- SEED DATA: Badges (22 badges)
-- =============================================================================
INSERT INTO badges (slug, name, description, icon, category, rarity, requirement_type, requirement_value, xp_reward) VALUES

-- Streaming badges
('first_light', 'First Light', 'Complete your first stream', '🌅', 'streaming', 'common', 'first_stream', 1, 25),
('marathon_streamer', 'Marathon Streamer', 'Stream for 120 minutes in a single session', '⏱️', 'streaming', 'uncommon', 'stream_duration_120', 120, 150),
('crowd_puller', 'Crowd Puller', 'Reach 100 concurrent viewers in a stream', '👥', 'streaming', 'rare', 'concurrent_viewers_100', 100, 200),
('night_owl', 'Night Owl', 'Start a stream after midnight', '🦉', 'streaming', 'common', 'stream_after_midnight', 1, 25),
('early_bird', 'Early Bird', 'Start a stream before 7am', '🐦', 'streaming', 'common', 'stream_before_7am', 1, 25),
('collaborator', 'Collaborator', 'Host 5 panel or interview streams', '🤝', 'streaming', 'uncommon', 'panel_streams_5', 5, 100),
('viral_moment', 'Viral Moment', 'Reach 500 concurrent viewers in a stream', '📈', 'streaming', 'epic', 'concurrent_viewers_500', 500, 1000),
('stream_machine', 'Stream Machine', 'Complete 100 total streams', '🤖', 'streaming', 'rare', 'total_streams_100', 100, 500),

-- Revenue badges
('first_dollar', 'First Dollar', 'Receive your first tip', '💵', 'revenue', 'common', 'first_tip_received', 1, 50),
('hundred_club', 'Hundred Club', 'Earn $100 in total revenue', '💰', 'revenue', 'rare', 'revenue_100', 100, 500),
('thousand_club', 'Thousand Club', 'Earn $1,000 in total revenue', '🏆', 'revenue', 'epic', 'revenue_1000', 1000, 2000),

-- Social badges
('social_butterfly', 'Social Butterfly', 'Gain 50 followers', '🦋', 'social', 'uncommon', 'followers_50', 50, 100),
('chat_king', 'Chat King', 'Send 1,000 chat messages', '💬', 'social', 'rare', 'chat_messages_1000', 1000, 200),
('generous_tipper', 'Generous Tipper', 'Send 50 tips to other creators', '🎁', 'social', 'uncommon', 'tips_sent_50', 50, 100),
('big_spender', 'Big Spender', 'Send $500 in total tips', '💎', 'social', 'rare', 'tips_sent_total_500', 500, 300),
('community_builder', 'Community Builder', 'Gain 500 followers', '🏘️', 'social', 'epic', 'followers_500', 500, 1000),

-- Achievement badges
('week_warrior', 'Week Warrior', 'Maintain a 7-day activity streak', '🔥', 'achievement', 'uncommon', 'streak_7', 7, 100),
('month_master', 'Month Master', 'Maintain a 30-day activity streak', '🔥', 'achievement', 'epic', 'streak_30', 30, 500),
('challenge_champion', 'Challenge Champion', 'Complete 10 weekly challenges', '🏅', 'achievement', 'rare', 'challenges_completed_10', 10, 300),
('legendary_icon', 'Legendary Icon', 'Reach level 15', '⭐', 'achievement', 'legendary', 'reach_level_15', 15, 5000),
('diamond_hands', 'Diamond Hands', 'Maintain a 60-day activity streak', '💠', 'achievement', 'legendary', 'streak_60', 60, 2000),
('pioneer', 'Pioneer', 'Be among the first 1,000 registered users', '🚀', 'achievement', 'legendary', 'first_1000_users', 1000, 3000);

-- =============================================================================
-- SEED DATA: Weekly Challenges (9 challenges, rotating by week_number % 3)
-- =============================================================================
INSERT INTO weekly_challenges (title, description, icon, action_type, target, xp_reward, week_number) VALUES

-- Week 0 challenges (week_number % 3 = 0)
(
    'Stream 3 Times',
    'Go live at least 3 times this week to earn bonus XP',
    '🎬',
    'stream_count',
    3,
    150,
    0
),
(
    'Accumulate 60 Minutes Streaming',
    'Stream for a combined total of 60 minutes this week',
    '⏰',
    'stream_minutes',
    60,
    200,
    0
),
(
    'Receive 5 Tips',
    'Get tipped by 5 different viewers this week',
    '💸',
    'tips_received',
    5,
    300,
    0
),

-- Week 1 challenges (week_number % 3 = 1)
(
    'Chat in 3 Different Streams',
    'Be an active participant by chatting in 3 different streams',
    '💬',
    'chat_in_streams',
    3,
    100,
    1
),
(
    'Earn 500 XP',
    'Accumulate 500 XP through any activities this week',
    '✨',
    'earn_xp',
    500,
    250,
    1
),
(
    'Invite 2 Guests',
    'Invite 2 guests to join your stream as co-hosts or guests',
    '👋',
    'invite_guests',
    2,
    200,
    1
),

-- Week 2 challenges (week_number % 3 = 2)
(
    'Start a Watch Party',
    'Host a watch party stream for your community',
    '🍿',
    'watch_party',
    1,
    150,
    2
),
(
    'Stream on 5 Different Days',
    'Show consistency by streaming on 5 separate days this week',
    '📅',
    'stream_days',
    5,
    300,
    2
),
(
    'Get 20 New Followers',
    'Attract 20 new followers to your channel this week',
    '🌟',
    'new_followers',
    20,
    250,
    2
);

-- =============================================================================
-- VERIFICATION: Count tables, indexes, triggers, and seed data
-- =============================================================================
-- To verify after running:
--   SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';
--   SELECT count(*) FROM pg_indexes WHERE schemaname = 'public';
--   SELECT count(*) FROM information_schema.triggers WHERE trigger_schema = 'public';
--   SELECT count(*) FROM badges;
--   SELECT count(*) FROM weekly_challenges;
-- =============================================================================
