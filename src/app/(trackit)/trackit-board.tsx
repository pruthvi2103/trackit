'use client'

import { format, subWeeks, addWeeks } from 'date-fns'
import React, { useTransition, useState } from 'react'
import { toggleCompletion } from './trackit-actions'
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts'
import { useRouter, useSearchParams } from 'next/navigation'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'

type WeekDay = { date: Date; key: string; label: string }

export default function TrackitBoard({
  userId,
  weekDays,
  habits,
  completionMap,
}: {
  userId: string
  weekDays: WeekDay[]
  habits: { id: number; name: string }[]
  completionMap: Map<string, boolean>
}) {
  const router = useRouter()
  const params = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({})

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

  const chartConfig = {
    value: {
      label: 'Completion',
      color: 'hsl(var(--foreground))',
    },
  }

  console.log('Chart data:', JSON.stringify(progressPerDay, null, 2))
  console.log('Habits count:', habits.length)
  return (
    <div className="relative rounded-xl border border-dashed p-1 sm:p-3 lg:p-4 transition-all duration-500 ease-out hover:shadow-lg hover:border-solid hover:border-foreground/20">
      <div className="relative flex items-center justify-center gap-2 sm:gap-4 text-base sm:text-lg mb-4">
        {isPending && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-md rounded-lg z-10 transition-all duration-300 ease-out"></div>
        )}
        <button 
          className={`underline text-sm sm:text-base transition-all duration-300 ease-out hover:scale-110 active:scale-95 hover:text-blue-600 hover:underline-offset-4 ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={() => navigate(-1)}
          disabled={isPending}
        >
          {isPending ? '⋯' : '<'}
        </button>
        <div className={`transition-all duration-500 ease-out ${isPending ? 'opacity-50 scale-95' : 'opacity-100 scale-100'}`}>
          Week {format(weekDate, 'I')}
        </div>
        <button 
          className={`underline text-sm sm:text-base transition-all duration-300 ease-out hover:scale-110 active:scale-95 hover:text-blue-600 hover:underline-offset-4 ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={() => navigate(1)}
          disabled={isPending}
        >
          {isPending ? '⋯' : '>'}
        </button>
      </div>

      <div className="grid grid-cols-[1fr_repeat(7,minmax(40px,1fr))] gap-1 sm:gap-2 lg:gap-3">
        <div />
        {weekDays.map((d) => (
          <div key={d.key} className="text-center text-xs text-muted-foreground px-1 transition-colors duration-200 hover:text-foreground">{d.label}</div>
        ))}

        {habits.map((h) => (
          <React.Fragment key={h.id}>
            <div key={`label-${h.id}`} className="py-1 font-medium text-sm pr-2 transition-all duration-200 hover:translate-x-1">{h.name}</div>
            {weekDays.map((d) => {
              const checked = completionMap.get(`${h.id}:${d.key}`) ?? false
              const loadingKey = `${h.id}:${d.key}`
              const isLoading = loadingStates[loadingKey]
              
              return (
                <div key={`${h.id}-${d.key}`} className="flex items-center justify-center py-1">
                  <div className="relative group">
                    <input
                      type="checkbox"
                      className={`h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 accent-black transition-all duration-300 ease-out hover:scale-125 active:scale-95 cursor-pointer ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'}`}
                      checked={checked}
                      disabled={isLoading}
                      onChange={async (e) => {
                        setLoadingStates(prev => ({ ...prev, [loadingKey]: true }))
                        try {
                          await toggleCompletion({ habitId: h.id, day: d.key, userId, value: e.target.checked })
                          startTransition(() => router.refresh())
                        } finally {
                          setLoadingStates(prev => ({ ...prev, [loadingKey]: false }))
                        }
                      }}
                    />
                    {isLoading && (
                      <div className="absolute inset-0 flex items-center justify-center animate-in fade-in duration-200">
                        <div className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </React.Fragment>
        ))}

        {/* Chart Row - Fixed alignment */}
        <div className="col-span-8 mt-3 sm:mt-6 h-[140px] sm:h-[180px] lg:h-[220px] transition-all duration-700 ease-out hover:scale-[1.02]">
          <ChartContainer config={chartConfig} className="h-full aspect-auto md:ml-26 md:w-[calc(100%-80px)] md:mr-12">
            <LineChart data={progressPerDay} margin={{ left: 12, right: 56, top: 4, bottom: 4 }}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="day"
                interval={0}
                tickLine={true}
                axisLine={false}
                tickMargin={4}
                tick={{ fontSize: 12 }}
              />
              <YAxis
                domain={[0, 1]}
                ticks={[0, 0.33, 0.66, 1]}
                tickFormatter={(v) => `${Math.round(v * 3)}`}
                axisLine={false}
                tickLine={false}
              />
              <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
              <Line dataKey="value" type="linear" stroke="#000000" strokeWidth={1} dot={{ r: 3, fill: "#000000" }} activeDot={{ r: 6 }} />
            </LineChart>
          </ChartContainer>
        </div>
      </div>
    </div>
  )
}


