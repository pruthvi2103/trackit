import { addDays, endOfWeek, format, startOfWeek } from 'date-fns'
import { redirect } from 'next/navigation'
import { sql, ensureSchema, type Habit } from '@/lib/db'
import { stackServerApp } from '@/stack'
import Link from 'next/link'
import TrackitBoard from './trackit-board'

export const dynamic = 'force-dynamic'

function getWeekDays(from: Date) {
  const start = startOfWeek(from, { weekStartsOn: 1 })
  return Array.from({ length: 7 }).map((_, i) => {
    const d = addDays(start, i)
    return { date: d, key: format(d, 'yyyy-MM-dd'), label: format(d, 'EEE') }
  })
}

export default async function Page({ searchParams }: { searchParams: { week?: string } }) {
  const session = await stackServerApp.getUser()
  if (!session) redirect('/handler')
  const userId = session.id

  await ensureSchema()

  const isoWeek = searchParams.week ? new Date(searchParams.week) : new Date()
  const weekDays = getWeekDays(isoWeek)
  const start = format(weekDays[0].date, 'yyyy-MM-dd')
  const end = format(endOfWeek(isoWeek, { weekStartsOn: 1 }), 'yyyy-MM-dd')

  const habits = (await sql<Habit>`
    select * from habits where user_id = ${userId} order by position asc, id asc
  `)

  const completions = await sql<{ habit_id: number; day: string }[]>`
    select habit_id, to_char(day, 'YYYY-MM-DD') as day
    from habit_completions
    where user_id = ${userId} and day between ${start}::date and ${end}::date
  `

  const completionMap = new Map<string, boolean>()
  for (const c of completions) completionMap.set(`${c.habit_id}:${c.day}`, true)

  return (
    <div className="mx-auto max-w-5xl w-full p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-serif">Trackit</h1>
        <Link className="underline" href="/trackits">Edit trackits</Link>
      </div>

      <TrackitBoard
        userId={userId}
        weekDays={weekDays}
        habits={habits}
        completionMap={completionMap}
      />
    </div>
  )
}


