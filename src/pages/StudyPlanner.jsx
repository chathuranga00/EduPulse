import { useMemo, useState } from 'react'
import {
  Sparkles,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Zap,
  ArrowRight,
  Check,
  ListTodo,
} from 'lucide-react'
import PageHeader from '../components/ui/PageHeader.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import { useToast } from '../components/ui/Toast.jsx'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const calendarEvents = [
  { day: 3, label: 'Bio Quiz', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' },
  { day: 8, label: 'Chem Lab', color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-400' },
  { day: 12, label: 'Essay Due', color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400' },
  { day: 18, label: 'Calc Exam', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' },
  { day: 22, label: 'Physics HW', color: 'bg-indigo-100 text-primary dark:bg-indigo-900/40' },
  { day: 28, label: 'Review', color: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-400' },
  { day: 30, label: 'Midterm', color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400' },
]

const todoBySubject = {
  Mathematics: [
    { id: 1, title: 'Complete derivatives problem set', priority: 'High', time: '9:00 AM', done: false },
    { id: 2, title: 'Watch integration lecture', priority: 'Medium', time: '3:00 PM', done: false },
  ],
  Chemistry: [
    { id: 3, title: 'Review SN1/SN2 mechanisms', priority: 'High', time: '11:00 AM', done: false },
    { id: 4, title: 'Lab pre-read Ch. 5', priority: 'Low', time: 'Jun 30', done: false },
  ],
  Physics: [
    { id: 5, title: 'Newton\'s laws practice problems', priority: 'Medium', time: '2:00 PM', done: false },
  ],
}

const completedTasks = [
  { id: 6, title: 'Biology flashcard review', subject: 'Biology', time: '8:00 AM' },
  { id: 7, title: 'English reading assignment', subject: 'English', time: 'Yesterday' },
]

const priorityStyles = {
  High: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
  Medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
  Low: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
}

function getCalendarDays(year, month) {
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInPrevMonth = new Date(year, month, 0).getDate()

  const cells = []
  for (let i = firstDay - 1; i >= 0; i--) {
    cells.push({ day: daysInPrevMonth - i, current: false })
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, current: true })
  }
  while (cells.length % 7 !== 0) {
    cells.push({ day: cells.length - daysInMonth - firstDay + 2, current: false })
  }
  return cells
}

function getWeekDays(referenceDate) {
  const start = new Date(referenceDate)
  start.setDate(start.getDate() - start.getDay())
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return d
  })
}

function CalendarGrid({ view, year, month, referenceDate, events }) {
  const today = 30
  const monthName = new Date(year, month).toLocaleString('default', { month: 'long', year: 'numeric' })

  if (view === 'week') {
    const weekDays = getWeekDays(referenceDate)
    return (
      <div>
        <p className="mb-4 text-sm font-medium text-gray-500 dark:text-gray-400">{monthName}</p>
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((date) => {
            const dayNum = date.getDate()
            const isToday = dayNum === today && date.getMonth() === 5
            const dayEvents = events.filter((e) => e.day === dayNum && date.getMonth() === month)
            return (
              <div
                key={date.toISOString()}
                className={`min-h-28 rounded-xl border p-2 ${
                  isToday
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-100 dark:border-gray-800'
                }`}
              >
                <span
                  className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium ${
                    isToday ? 'bg-primary text-white' : 'text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {dayNum}
                </span>
                <div className="mt-1 space-y-1">
                  {dayEvents.map((ev) => (
                    <span
                      key={ev.label}
                      className={`block truncate rounded px-1.5 py-0.5 text-[10px] font-medium ${ev.color}`}
                    >
                      {ev.label}
                    </span>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const cells = getCalendarDays(year, month)

  return (
    <div>
      <p className="mb-4 text-sm font-medium text-gray-500 dark:text-gray-400">{monthName}</p>
      <div className="grid grid-cols-7 gap-1">
        {DAYS.map((d) => (
          <div
            key={d}
            className="py-2 text-center text-xs font-semibold uppercase tracking-wide text-gray-400"
          >
            {d}
          </div>
        ))}
        {cells.map((cell, i) => {
          const isToday = cell.current && cell.day === today
          const dayEvents = cell.current
            ? events.filter((e) => e.day === cell.day)
            : []
          return (
            <div
              key={i}
              className={`min-h-20 rounded-xl border p-1.5 ${
                !cell.current
                  ? 'border-transparent opacity-40'
                  : isToday
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-100 hover:bg-lavender-light dark:border-gray-800 dark:hover:bg-gray-800/50'
              }`}
            >
              <span
                className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                  isToday
                    ? 'bg-primary text-white'
                    : cell.current
                      ? 'text-gray-700 dark:text-gray-300'
                      : 'text-gray-400'
                }`}
              >
                {cell.day}
              </span>
              {dayEvents.length > 0 && (
                <div className="mt-0.5 space-y-0.5">
                  {dayEvents.slice(0, 2).map((ev) => (
                    <span
                      key={ev.label}
                      className={`block truncate rounded px-1 py-0.5 text-[9px] font-medium leading-tight ${ev.color}`}
                    >
                      {ev.label}
                    </span>
                  ))}
                  {dayEvents.length > 2 && (
                    <span className="block text-[9px] text-gray-400">
                      +{dayEvents.length - 2} more
                    </span>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function TodoItem({ task, checked, onToggle }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl p-2 transition hover:bg-lavender-light dark:hover:bg-gray-800/50">
      <input
        type="checkbox"
        checked={checked}
        onChange={onToggle}
        className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 text-primary focus:ring-primary"
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`text-sm font-medium ${
              checked
                ? 'text-gray-400 line-through dark:text-gray-500'
                : 'text-gray-900 dark:text-white'
            }`}
          >
            {task.title}
          </span>
          {task.priority && (
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${priorityStyles[task.priority]}`}
            >
              {task.priority}
            </span>
          )}
        </div>
        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{task.time}</p>
      </div>
    </label>
  )
}

export default function StudyPlanner() {
  const toast = useToast()
  const [view, setView] = useState('month')
  const [monthOffset, setMonthOffset] = useState(0)
  const [checkedIds, setCheckedIds] = useState(new Set())

  const baseDate = useMemo(() => {
    const d = new Date(2026, 5, 30)
    d.setMonth(d.getMonth() + monthOffset)
    return d
  }, [monthOffset])

  const year = baseDate.getFullYear()
  const month = baseDate.getMonth()
  const referenceDate = baseDate

  const toggleTask = (id) => {
    setCheckedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const allTasks = Object.values(todoBySubject).flat()
  const pendingTasks = allTasks.filter((t) => !checkedIds.has(t.id))
  const totalTasks = allTasks.length + completedTasks.length
  const doneCount =
    completedTasks.length + allTasks.filter((t) => checkedIds.has(t.id)).length
  const progressPct = Math.round((doneCount / totalTasks) * 100)

  return (
    <div className="ep-page">
      <PageHeader
        title="Study Planner"
        subtitle="Organize your schedule, track tasks, and let AI optimize your study time."
        action={
          <button
            type="button"
            onClick={() => toast.info('AI Plan Generator coming soon')}
            className="ep-pill"
          >
            <Sparkles className="h-4 w-4" />
            AI Plan Generator
          </button>
        }
      />

      <div className="flex flex-col gap-6 xl:flex-row">
        {/* Main column */}
        <div className="min-w-0 flex-1 space-y-6">
          {/* Calendar */}
          <div className="ep-card p-5">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex rounded-xl border border-gray-200 bg-lavender-light p-1 dark:border-gray-700 dark:bg-gray-800">
                {['month', 'week'].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setView(v)}
                    className={`rounded-lg px-4 py-1.5 text-sm font-medium capitalize transition ${
                      view === v
                        ? 'bg-white text-primary shadow-sm dark:bg-gray-900'
                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMonthOffset((o) => o - 1)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 text-gray-600 transition hover:border-primary hover:text-primary dark:border-gray-700 dark:text-gray-400"
                  aria-label="Previous"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setMonthOffset((o) => o + 1)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 text-gray-600 transition hover:border-primary hover:text-primary dark:border-gray-700 dark:text-gray-400"
                  aria-label="Next"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
            <CalendarGrid
              view={view}
              year={year}
              month={month}
              referenceDate={referenceDate}
              events={calendarEvents}
            />
          </div>

          {/* AI insight cards */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5 dark:border-amber-900/40 dark:bg-amber-950/20">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/40">
                  <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Weak Subject</h3>
              </div>
              <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                Your <strong>Organic Chemistry</strong> scores dropped 12% this week. Consider
                adding 30 extra minutes of focused review before your midterm.
              </p>
              <a
                href="#weak-subject"
                className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-amber-700 transition hover:text-amber-800 dark:text-amber-400"
              >
                View study plan
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5 dark:border-emerald-900/40 dark:bg-emerald-950/20">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/40">
                  <Zap className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Mastery Alert</h3>
              </div>
              <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                You&apos;ve mastered <strong>Calculus derivatives</strong> — 95% accuracy across
                your last 3 quizzes. Ready to advance to integration techniques?
              </p>
              <a
                href="#mastery"
                className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 transition hover:text-emerald-800 dark:text-emerald-400"
              >
                Start next module
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Smart Exam Insights */}
          <div className="relative overflow-hidden rounded-2xl border border-indigo-50 shadow-sm shadow-indigo-100/50 dark:border-gray-800 dark:shadow-none">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-primary to-violet-700" />
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)',
                backgroundSize: '40px 40px',
              }}
            />
            <div className="relative flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">Smart Exam Insights</h3>
                <p className="mt-1 max-w-md text-sm text-indigo-100">
                  AI analyzed your past performance and predicts high-yield topics for your upcoming
                  Calculus midterm on July 18.
                </p>
              </div>
              <a
                href="#exam-analysis"
                className="inline-flex shrink-0 items-center gap-2 rounded-2xl bg-white/15 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/25"
              >
                View Analysis
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Optimize Schedule CTA */}
          <div className="rounded-2xl bg-gradient-to-r from-primary via-indigo-600 to-violet-600 p-6 shadow-md shadow-indigo-200/50 dark:shadow-none">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">Optimize Schedule</h3>
                <p className="mt-1 text-sm text-indigo-100">
                  Let AI rebalance your study blocks based on deadlines, weak areas, and peak focus
                  hours.
                </p>
              </div>
              <button
                type="button"
                className="inline-flex shrink-0 items-center gap-2 rounded-2xl bg-white px-5 py-2.5 text-sm font-semibold text-primary transition hover:bg-indigo-50"
              >
                <Sparkles className="h-4 w-4" />
                Run AI Optimizer
              </button>
            </div>
          </div>
        </div>

        {/* To-Do sidebar */}
        <aside className="w-full shrink-0 xl:w-80">
          <div className="sticky top-[4.5rem] flex flex-col ep-card-static sm:top-20">
            <div className="border-b border-indigo-50 px-5 py-4 dark:border-gray-800">
              <h2 className="font-semibold text-gray-900 dark:text-white">To-Do List</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Grouped by subject</p>
            </div>

            <div className="max-h-[420px] flex-1 overflow-y-auto p-4">
              {pendingTasks.length === 0 ? (
                <EmptyState
                  icon={ListTodo}
                  title="All tasks complete!"
                  description="Great work — you've finished everything on your list for today."
                />
              ) : (
                Object.entries(todoBySubject).map(([subject, tasks]) => {
                  const pending = tasks.filter((t) => !checkedIds.has(t.id))
                  if (pending.length === 0) return null
                  return (
                    <div key={subject} className="mb-5 last:mb-0">
                      <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-primary">
                        {subject}
                      </h3>
                      <div className="space-y-1">
                        {pending.map((task) => (
                          <TodoItem
                            key={task.id}
                            task={task}
                            checked={checkedIds.has(task.id)}
                            onToggle={() => {
                              toggleTask(task.id)
                              if (!checkedIds.has(task.id)) {
                                toast.success('Task completed!')
                              }
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )
                })
              )}

              <div className="mt-6 border-t border-gray-100 pt-4 dark:border-gray-800">
                <h3 className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-400">
                  <Check className="h-3.5 w-3.5" />
                  Completed
                </h3>
                <div className="space-y-1">
                  {completedTasks.map((task) => (
                    <div key={task.id} className="rounded-xl p-2">
                      <p className="text-sm font-medium text-gray-400 line-through dark:text-gray-500">
                        {task.title}
                      </p>
                      <p className="text-xs text-gray-400">
                        {task.subject} · {task.time}
                      </p>
                    </div>
                  ))}
                  {allTasks
                    .filter((t) => checkedIds.has(t.id))
                    .map((task) => (
                      <div key={`done-${task.id}`} className="rounded-xl p-2">
                        <p className="text-sm font-medium text-gray-400 line-through dark:text-gray-500">
                          {task.title}
                        </p>
                        <p className="text-xs text-gray-400">{task.time}</p>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            <div className="border-t border-indigo-50 p-5 dark:border-gray-800">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  Daily Progress
                </span>
                <span className="font-bold text-primary">{progressPct}%</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-lavender dark:bg-gray-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-violet-500 transition-all"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                {doneCount} of {totalTasks} tasks completed today
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
