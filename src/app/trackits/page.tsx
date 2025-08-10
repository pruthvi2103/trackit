import { ensureSchema, sql, type Habit } from '@/lib/db'
import { stackServerApp } from '@/stack'
import { createHabit, deleteHabit } from '../(trackit)/trackit-actions'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const user = await stackServerApp.getUser()
  if (!user) {
    return <div className="p-6">Please sign in.</div>
  }
  await ensureSchema()
  const habits = await sql`select * from habits where user_id = ${user.id} order by position asc, id asc`

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
    <div className="mx-auto max-w-3xl p-6 animate-in slide-in-from-bottom-2">
      {/* Breadcrumb Navigation */}
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/" className="hover:text-blue-600 transition-colors duration-200">
              Home
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Edit Trackits</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <h1 className="text-2xl mb-6 transition-all duration-300 hover:scale-105">Edit trackits</h1>

      <form action={add} className="flex gap-2 mb-6 group animate-in slide-in-from-bottom-2" style={{ animationDelay: '100ms' }}>
        <input 
          name="name" 
          placeholder="New trackit name" 
          className="border px-3 py-2 rounded w-full transition-all duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-blue-300 focus:scale-[1.02] group-hover:shadow-sm" 
        />
        <button className="border px-4 py-2 rounded transition-all duration-300 ease-out hover:bg-blue-50 hover:border-blue-300 hover:shadow-md active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
          Add
        </button>
      </form>

      <ul className="space-y-2 animate-in slide-in-from-bottom-2" style={{ animationDelay: '200ms' }}>
        {habits.map((h, index) => (
          <li 
            key={h.id} 
            className="flex items-center justify-between border rounded px-3 py-2 transition-all duration-300 ease-out hover:shadow-md hover:border-blue-300 hover:bg-blue-50/30 hover:scale-[1.02] active:scale-[0.98] animate-in slide-in-from-left-2 duration-500"
            style={{ animationDelay: `${300 + index * 100}ms` }}
          >
            <span className="transition-all duration-200 hover:translate-x-1">{h.name}</span>
            <form action={remove}>
              <input type="hidden" name="id" value={h.id} />
              <button className="underline text-red-600 transition-all duration-200 hover:text-red-800 hover:no-underline hover:bg-red-100 px-2 py-1 rounded active:scale-95">
                Delete
              </button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  )
}


