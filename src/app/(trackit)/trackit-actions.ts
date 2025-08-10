'use server'

import { sql } from '@/lib/db'
import { stackServerApp } from '@/stack'

export async function toggleCompletion({
  habitId,
  day,
  userId,
  value,
}: {
  habitId: number
  day: string // yyyy-mm-dd
  userId: string
  value: boolean
}) {
  const user = await stackServerApp.getUser()
  if (!user || user.id !== userId) {
    throw new Error('Unauthorized')
  }

  if (value) {
    await sql`insert into habit_completions (habit_id, user_id, day) values (${habitId}, ${userId}, ${day}::date) on conflict do nothing`
  } else {
    await sql`delete from habit_completions where habit_id = ${habitId} and user_id = ${userId} and day = ${day}::date`
  }
}

export async function createHabit(name: string) {
  const user = await stackServerApp.getUser()
  if (!user) throw new Error('Unauthorized')
  await sql`insert into habits (user_id, name, position) values (${user.id}, ${name}, 9999)`
}

export async function deleteHabit(id: number) {
  const user = await stackServerApp.getUser()
  if (!user) throw new Error('Unauthorized')
  await sql`delete from habits where id = ${id} and user_id = ${user.id}`
}


