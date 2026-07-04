-- PostgreSQL schema definition for Render Managed Postgres or direct setup

-- Drop existing tables/types if they exist (clean setup)
DROP TABLE IF EXISTS "activity_logs" CASCADE;
DROP TABLE IF EXISTS "chat_logs" CASCADE;
DROP TABLE IF EXISTS "glossary_terms" CASCADE;
DROP TABLE IF EXISTS "activities" CASCADE;
DROP TABLE IF EXISTS "content" CASCADE;
DROP TABLE IF EXISTS "users" CASCADE;
DROP TABLE IF EXISTS "groups" CASCADE;

DROP TYPE IF EXISTS "Role" CASCADE;
DROP TYPE IF EXISTS "ContentType" CASCADE;
DROP TYPE IF EXISTS "ActivityStatus" CASCADE;

-- Create Custom Enum Types
CREATE TYPE "Role" AS ENUM ('ADMIN', 'STUDENT');
CREATE TYPE "ContentType" AS ENUM ('READING', 'LISTENING', 'VIDEO');
CREATE TYPE "ActivityStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED');

-- Create Tables

-- Groups table
CREATE TABLE "groups" (
    "id" SERIAL PRIMARY KEY,
    "name" VARCHAR(255) UNIQUE NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Users table (Admins and Students)
CREATE TABLE "users" (
    "id" SERIAL PRIMARY KEY,
    "role" "Role" DEFAULT 'STUDENT' NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) UNIQUE NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "group_id" INTEGER REFERENCES "groups"("id") ON DELETE SET NULL,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Content library table
CREATE TABLE "content" (
    "id" SERIAL PRIMARY KEY,
    "type" "ContentType" NOT NULL,
    "text_body" TEXT,
    "file_url" VARCHAR(1024),
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Activities table
CREATE TABLE "activities" (
    "id" SERIAL PRIMARY KEY,
    "group_id" INTEGER NOT NULL REFERENCES "groups"("id") ON DELETE CASCADE,
    "title" VARCHAR(255) NOT NULL,
    "type" "ContentType" NOT NULL,
    "content_id" INTEGER NOT NULL REFERENCES "content"("id") ON DELETE CASCADE,
    "order_index" INTEGER NOT NULL,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Glossary terms table (for reading activities)
CREATE TABLE "glossary_terms" (
    "id" SERIAL PRIMARY KEY,
    "content_id" INTEGER NOT NULL REFERENCES "content"("id") ON DELETE CASCADE,
    "term" VARCHAR(255) NOT NULL,
    "definition" TEXT NOT NULL,
    "start_offset" INTEGER NOT NULL,
    "end_offset" INTEGER NOT NULL,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Chat logs table
CREATE TABLE "chat_logs" (
    "id" SERIAL PRIMARY KEY,
    "student_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "activity_id" INTEGER NOT NULL REFERENCES "activities"("id") ON DELETE CASCADE,
    "role" VARCHAR(50) NOT NULL, -- e.g. 'user', 'assistant', 'system'
    "message" TEXT NOT NULL,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Activity logs (progress and completions tracker)
CREATE TABLE "activity_logs" (
    "id" SERIAL PRIMARY KEY,
    "student_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "activity_id" INTEGER NOT NULL REFERENCES "activities"("id") ON DELETE CASCADE,
    "status" "ActivityStatus" DEFAULT 'NOT_STARTED' NOT NULL,
    "started_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "completed_at" TIMESTAMP WITH TIME ZONE
);
