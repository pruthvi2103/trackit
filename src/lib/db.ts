import 'server-only'

import { neon } from '@neondatabase/serverless'

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error('DATABASE_URL env var is required')
}

export const sql = neon(databaseUrl)

export async function ensureSchema(): Promise<void> {
  // Create minimal schema if it does not exist yet
  await sql`
    create table if not exists habits (
      id serial primary key,
      user_id text not null,
      name text not null,
      position integer not null default 0,
      created_at timestamptz not null default now()
    );
  `

  await sql`
    create table if not exists habit_completions (
      habit_id integer not null references habits(id) on delete cascade,
      user_id text not null,
      day date not null,
      primary key (habit_id, day)
    );
  `

  await sql`
    create index if not exists idx_habits_user on habits(user_id);
  `

  await sql`
    create index if not exists idx_completions_user_day on habit_completions(user_id, day);
  `
}

export type Habit = {
  id: number
  user_id: string
  name: string
  position: number
  created_at: string
}

export type HabitCompletion = {
  habit_id: number
  user_id: string
  day: string // YYYY-MM-DD
}


