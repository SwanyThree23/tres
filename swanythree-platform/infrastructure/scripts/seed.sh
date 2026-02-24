#!/bin/bash
set -euo pipefail
echo "Seeding database..."
echo "Note: Badges and challenges are seeded via init-db.sql automatically."
echo "This script creates test users for development."

docker exec -i st3-postgres psql -U st3user -d swanythree <<'SQL'
-- Create test admin user (password: admin123456)
INSERT INTO users (email, username, display_name, password_hash, role)
VALUES ('admin@swanythree.com', 'admin', 'Platform Admin',
        '$2b$12$LJ3m4ys1gkP.FJqMvPKhMeuHnNtNhV4HhXg0aUPJxKoXOuLyPnlHC',
        'admin')
ON CONFLICT (email) DO NOTHING;

-- Create test creator (password: creator123456)
INSERT INTO users (email, username, display_name, password_hash, role)
VALUES ('creator@swanythree.com', 'testcreator', 'Test Creator',
        '$2b$12$LJ3m4ys1gkP.FJqMvPKhMeuHnNtNhV4HhXg0aUPJxKoXOuLyPnlHC',
        'creator')
ON CONFLICT (email) DO NOTHING;

SELECT 'Seed complete: admin@swanythree.com / creator@swanythree.com';
SQL

echo "Database seeded."
