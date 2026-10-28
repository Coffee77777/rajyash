-- Migration 001: add password_hash to users
ALTER TABLE users ADD COLUMN password_hash VARCHAR(255) NULL AFTER is_active;
