import { ensureSchema, sql, type Habit } from '@/lib/db'
import { stackServerApp } from '@/stack'
import { createHabit, deleteHabit } from '../(trackit)/trackit-actions'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const user = await stackServerApp.getUser()
  if (!user) {
    return <div className="p-6">Please sign in.</div>
  }
  await ensureSchema()
  const habits = await sql<Habit[]>`select * from habits where user_id = ${user.id} order by position asc, id asc`

  async function add(formData: FormData) {
    'use server'
    const name = String(formData.get('name') ?? '')
    if (!name.trim()) return
    await createHabit(name.trim())
  }

  async function remove(formData: FormData) {
    'use server'
    const id = Number(formData.get('id'))
    await deleteHabit(id)
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl mb-6">Edit trackits</h1>

      <form action={add} className="flex gap-2 mb-6">
        <input name="name" placeholder="New trackit name" className="border px-3 py-2 rounded w-full" />
        <button className="border px-4 rounded">Add</button>
      </form>

      <ul className="space-y-2">
        {habits.map((h) => (
          <li key={h.id} className="flex items-center justify-between border rounded px-3 py-2">
            <span>{h.name}</span>
            <form action={remove}>
              <input type="hidden" name="id" value={h.id} />
              <button className="underline text-red-600">Delete</button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  )
}


