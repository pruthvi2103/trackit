import { addDays, endOfWeek, format, startOfWeek } from 'date-fns'
import { sql, ensureSchema } from '@/lib/db'
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
  if (!session) {
    return (
      <div className="mx-auto max-w-2xl p-6 animate-in slide-in-from-bottom-2">
        <h1 className="text-3xl font-serif mb-4 transition-all duration-300 hover:scale-105">Trackit</h1>
        <p className="mb-3 transition-colors duration-200">You need to sign in to use Trackit.</p>
        <Link className="underline transition-all duration-200 hover:text-blue-600 hover:underline-offset-4" href="/handler/login">Open sign-in</Link>
      </div>
    )
  }
  const userId = session.id

  await ensureSchema()

  const isoWeek = searchParams.week ? new Date(searchParams.week) : new Date()
  const weekDays = getWeekDays(isoWeek)
  const start = format(weekDays[0].date, 'yyyy-MM-dd')
  const end = format(endOfWeek(isoWeek, { weekStartsOn: 1 }), 'yyyy-MM-dd')

  const habits = (await sql`
    select * from habits where user_id = ${userId} order by position asc, id asc
  `) as { id: number; name: string }[]

  const completions = await sql`
    select habit_id, to_char(day, 'YYYY-MM-DD') as day
    from habit_completions
    where user_id = ${userId} and day between ${start}::date and ${end}::date
  `

  const completionMap = new Map<string, boolean>()
  for (const c of completions) completionMap.set(`${c.habit_id}:${c.day}`, true)

  return (
    <div className="mx-auto max-w-5xl w-full p-3 sm:p-6 animate-in slide-in-from-bottom-2">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-serif transition-all duration-300 hover:scale-105">Trackit</h1>
        <Link className="underline text-sm sm:text-base transition-all duration-300 hover:text-blue-600 hover:underline-offset-4 hover:scale-105 active:scale-95" href="/trackits">Edit trackits</Link>
      </div>

      <div className="animate-in scale-in" style={{ animationDelay: '200ms' }}>
        <TrackitBoard
          userId={userId}
          weekDays={weekDays}
          habits={habits}
          completionMap={completionMap}
        />
      </div>
    </div>
  )
}


