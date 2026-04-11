-- Migration: Add metadata column to ideas table
-- This stores block editor content (drawings, voice memos, images) as JSON
-- Run this in your Supabase SQL Editor

ALTER TABLE public.ideas 
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

-- Add a comment for documentation
COMMENT ON COLUMN public.ideas.metadata IS 'Stores block editor content including drawings, voice memos, and image data as JSON';
