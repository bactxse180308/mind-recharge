-- V15__fix_display_name_unicode.sql
-- Fix display_name to support Vietnamese (Unicode) characters
ALTER TABLE users ALTER COLUMN display_name NVARCHAR(100) NOT NULL;
