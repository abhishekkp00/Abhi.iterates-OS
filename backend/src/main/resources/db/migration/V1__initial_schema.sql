-- =============================================================================
-- Flyway Migration V1: Initial Database Schema for AbhiIterates.OS
-- Represents the baseline PostgreSQL schema for users, authentication, resources,
-- marketplace, store, notifications, productivity, AI conversations, and audit logs.
-- =============================================================================

-- 1. Users Table
CREATE TABLE users (
    id UUID NOT NULL PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    soft_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

-- 2. Roles Table
CREATE TABLE roles (
    id UUID NOT NULL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

-- 3. Permissions Table
CREATE TABLE permissions (
    id UUID NOT NULL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

-- 4. User Roles Join Table
CREATE TABLE user_roles (
    role_id UUID NOT NULL REFERENCES roles(id),
    user_id UUID NOT NULL REFERENCES users(id),
    PRIMARY KEY (role_id, user_id)
);

-- 5. Role Permissions Join Table
CREATE TABLE role_permissions (
    permission_id UUID NOT NULL REFERENCES permissions(id),
    role_id UUID NOT NULL REFERENCES roles(id),
    PRIMARY KEY (permission_id, role_id)
);

-- 6. Email Verification Tokens Table
CREATE TABLE email_verification_tokens (
    id UUID NOT NULL PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE REFERENCES users(id),
    token VARCHAR(255) NOT NULL UNIQUE,
    expiry_date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

-- 7. Password Reset Tokens Table
CREATE TABLE password_reset_tokens (
    id UUID NOT NULL PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE REFERENCES users(id),
    token VARCHAR(255) NOT NULL UNIQUE,
    expiry_date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

-- 8. Refresh Tokens Table
CREATE TABLE refresh_tokens (
    id UUID NOT NULL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    token VARCHAR(255) NOT NULL UNIQUE,
    revoked BOOLEAN NOT NULL DEFAULT FALSE,
    expiry_date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

-- 9. User Sessions Table
CREATE TABLE user_sessions (
    id UUID NOT NULL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    ip_address VARCHAR(255),
    user_agent VARCHAR(255),
    device_type VARCHAR(255),
    last_active TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

-- 10. Resources Table
CREATE TABLE resources (
    id UUID NOT NULL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    description VARCHAR(1000),
    category VARCHAR(255) NOT NULL,
    priority VARCHAR(255) NOT NULL,
    status VARCHAR(255) NOT NULL,
    tags VARCHAR(255),
    is_starred BOOLEAN NOT NULL DEFAULT FALSE,
    deadline TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

-- 11. Resource Attachments Table
CREATE TABLE resource_attachments (
    id UUID NOT NULL PRIMARY KEY,
    resource_id UUID NOT NULL REFERENCES resources(id),
    file_name VARCHAR(255) NOT NULL,
    download_url VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL,
    content_type VARCHAR(255)
);

-- 12. Marketplace Listings Table
CREATE TABLE marketplace_listings (
    id UUID NOT NULL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    description VARCHAR(1000),
    price NUMERIC(10, 2) NOT NULL,
    category VARCHAR(255) NOT NULL,
    condition VARCHAR(255) NOT NULL,
    status VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    negotiable BOOLEAN NOT NULL DEFAULT FALSE,
    tags VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

-- 13. Marketplace Listing Images Table
CREATE TABLE marketplace_listing_images (
    id UUID NOT NULL PRIMARY KEY,
    listing_id UUID NOT NULL REFERENCES marketplace_listings(id),
    image_url VARCHAR(255) NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE
);

-- 14. Store Resources Table
CREATE TABLE store_resources (
    id UUID NOT NULL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(255) NOT NULL,
    price_in_rupees NUMERIC(10, 2) NOT NULL,
    file_url TEXT NOT NULL,
    preview_url TEXT,
    file_name VARCHAR(255),
    file_size BIGINT,
    uploaded_by_user_id UUID REFERENCES users(id),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    expiry_date TIMESTAMP WITH TIME ZONE,
    tags VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

-- 15. Resource Purchases Table
CREATE TABLE resource_purchases (
    id UUID NOT NULL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    store_resource_id UUID NOT NULL REFERENCES store_resources(id),
    amount_paid NUMERIC(10, 2) NOT NULL,
    payment_ref_id VARCHAR(255) NOT NULL,
    payment_method VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    CONSTRAINT uq_resource_purchase_user_resource UNIQUE (user_id, store_resource_id)
);

-- 16. Notifications Table
CREATE TABLE notifications (
    id UUID NOT NULL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    type VARCHAR(255) NOT NULL,
    message VARCHAR(512) NOT NULL,
    action_url VARCHAR(512),
    entity_id UUID,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

-- 17. Tasks Table
CREATE TABLE tasks (
    id UUID NOT NULL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(255) NOT NULL,
    priority VARCHAR(255) NOT NULL,
    category VARCHAR(255) NOT NULL,
    due_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

-- 18. Calendar Events Table
CREATE TABLE calendar_events (
    id UUID NOT NULL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    location VARCHAR(255),
    color VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

-- 19. AI Conversations Table
CREATE TABLE ai_conversations (
    id UUID NOT NULL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    preview VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

-- 20. AI Messages Table
CREATE TABLE ai_messages (
    id UUID NOT NULL PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES ai_conversations(id),
    role VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    token_count INTEGER,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

-- 21. Audit Logs Table
CREATE TABLE audit_logs (
    id UUID NOT NULL PRIMARY KEY,
    admin_email VARCHAR(255) NOT NULL,
    action VARCHAR(255) NOT NULL,
    target VARCHAR(255) NOT NULL,
    details VARCHAR(1000),
    ip_address VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- 22. System Settings Table
CREATE TABLE system_settings (
    id UUID NOT NULL PRIMARY KEY,
    setting_key VARCHAR(255) NOT NULL UNIQUE,
    setting_value VARCHAR(1000) NOT NULL,
    description VARCHAR(500)
);

-- Indexes for Query Performance and Security Isolation
CREATE INDEX idx_ai_conv_user_id ON ai_conversations (user_id);
CREATE INDEX idx_ai_conv_updated_at ON ai_conversations (updated_at);
CREATE INDEX idx_ai_msg_conversation_id ON ai_messages (conversation_id);
CREATE INDEX idx_ai_msg_created_at ON ai_messages (created_at);
CREATE INDEX idx_audit_logs_action ON audit_logs (action);
CREATE INDEX idx_audit_logs_admin_email ON audit_logs (admin_email);
CREATE INDEX idx_notifications_user_created ON notifications (user_id, created_at DESC);
CREATE INDEX idx_notifications_user_read ON notifications (user_id, is_read);
