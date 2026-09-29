-- Migrations run at boot in filename order (NNN_name.sql). Keep every file IDEMPOTENT
-- (CREATE TABLE IF NOT EXISTS / ON CONFLICT DO NOTHING), because the whole directory re-runs on
-- every start. Add new schema/seed files here; never edit applied ones destructively.
--
-- The demo table lives HERE rather than in the boot code, so that this directory is the one
-- place schema is defined. It used to be created inline and this file was a bare SELECT 1,
-- which meant the generated smoke (which applies these files and asserts they produce
-- tables) failed every single time a database app was scaffolded.
CREATE TABLE IF NOT EXISTS items (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL
);
