-- Seed Super Admin Account
-- Email: admin@groceryos.com
-- Password: admin123

INSERT INTO super_admins (full_name, email, password, is_active) VALUES 
('Super Admin', 'admin@groceryos.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5jzHq3qVjKK5a', true);

-- Note: The password hash above is for 'admin123'
-- In production, change this immediately after first login.
