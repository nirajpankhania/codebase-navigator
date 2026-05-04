-- Run this in the Supabase SQL editor (Dashboard → SQL Editor → New query)

-- 1. Enable pgvector (already available on all Supabase projects)
create extension if not exists vector with schema extensions;

-- 2. Chunks table
create table if not exists chunks (
  id        uuid  primary key default gen_random_uuid(),
  repo_id   text  not null,
  file_path text  not null,
  content   text  not null,
  embedding vector(1536)
);

-- 3. Indexes
create index if not exists chunks_repo_id_idx
  on chunks (repo_id);

create index if not exists chunks_embedding_idx
  on chunks using hnsw (embedding vector_cosine_ops);

-- 4. Similarity search function called via Supabase RPC
create or replace function match_chunks(
  query_embedding vector(1536),
  filter_repo_id  text,
  match_count     int default 5
)
returns table (
  id         uuid,
  repo_id    text,
  file_path  text,
  content    text,
  similarity float
)
language sql stable
as $$
  select
    id,
    repo_id,
    file_path,
    content,
    1 - (embedding <=> query_embedding) as similarity
  from chunks
  where repo_id = filter_repo_id
  order by embedding <=> query_embedding
  limit match_count;
$$;
