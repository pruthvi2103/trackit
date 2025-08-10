'use client'

import { format, subWeeks, addWeeks } from 'date-fns'
import { useTransition } from 'react'
import { Habit } from '@/lib/db'
import { toggleCompletion } from './trackit-actions'
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts'
import { useRouter, useSearchParams } from 'next/navigation'

type WeekDay = { date: Date; key: string; label: string }

export default function TrackitBoard({
  userId,
  weekDays,
  habits,
  completionMap,
}: {
  userId: string
  weekDays: WeekDay[]
  habits: Habit[]
  completionMap: Map<string, boolean>
}) {
  const router = useRouter()
  const params = useSearchParams()
  const [, startTransition] = useTransition()

  const weekDate = weekDays[0].date

  function navigate(delta: number) {
    const target = delta < 0 ? subWeeks(weekDate, 1) : addWeeks(weekDate, 1)
    const q = new URLSearchParams(params.toString())
    q.set('week', format(target, 'yyyy-MM-dd'))
    startTransition(() => router.push(`/?${q.toString()}`))
  }

  const progressPerDay = weekDays.map((d) => {
    const count = habits.reduce((acc, h) => acc + (completionMap.get(`${h.id}:${d.key}`) ? 1 : 0), 0)
    return { day: d.label, value: habits.length === 0 ? 0 : count / habits.length }
  })

  return (
    <div className="rounded-xl border border-dashed p-4">
      <div className="flex items-center justify-center gap-4 text-lg mb-4">
        <button className="underline" onClick={() => navigate(-1)}>{'<'}</button>
        <div>Week {format(weekDate, 'I')}</div>
        <button className="underline" onClick={() => navigate(1)}>{'>'}</button>
      </div>

      <div className="grid grid-cols-[1fr_repeat(7,minmax(70px,1fr))] gap-3">
        <div />
        {weekDays.map((d) => (
          <div key={d.key} className="text-center text-sm text-muted-foreground">{d.label}</div>
        ))}

        {habits.map((h) => (
          <>
            <div key={`label-${h.id}`} className="py-2 font-medium">{h.name}</div>
            {weekDays.map((d) => {
              const checked = completionMap.get(`${h.id}:${d.key}`) ?? false
              return (
                <div key={`${h.id}-${d.key}`} className="flex items-center justify-center py-2">
                  <input
                    type="checkbox"
                    className="h-5 w-5 accent-black"
                    checked={checked}
                    onChange={async (e) => {
                      await toggleCompletion({ habitId: h.id, day: d.key, userId, value: e.target.checked })
                      startTransition(() => router.refresh())
                    }}
                  />
                </div>
              )
            })}
          </>
        ))}

        {/* Chart Row */}
        <div className="col-span-full mt-6 h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={progressPerDay} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
              <XAxis dataKey="day" interval={0} tickLine={false} axisLine={{ strokeDasharray: '4 4' }} />
              <YAxis domain={[0, 1]} ticks={[0, 0.33, 0.66, 1]} tickFormatter={(v) => `${Math.round(v * 3)}`}
                axisLine={{ strokeDasharray: '4 4' }} tickLine={false}
              />
              <Tooltip formatter={(v: number) => `${Math.round(v * 100)}%`} />
              <Line type="monotone" dataKey="value" stroke="#111" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}


