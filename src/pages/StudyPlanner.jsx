import { useMemo, useState, useEffect, useCallback, useRef } from 'react'
import {
  Sparkles, ChevronLeft, ChevronRight, AlertTriangle, Zap,
  ArrowRight, Check, ListTodo, Plus, X, Loader2, Trash2, Calendar,
} from 'lucide-react'
import PageHeader from '../components/ui/PageHeader.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import { useToast } from '../components/ui/Toast.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { supabase } from '../lib/supabase.js'

// ── Constants ─────────────────────────────────────────────────────────────────
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const COLOR_OPTIONS = [
  { key: 'indigo',  label: 'Study',    cls: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400' },
  { key: 'emerald', label: 'Quiz',     cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' },
  { key: 'violet',  label: 'Lab',      cls: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-400' },
  { key: 'red',     label: 'Deadline', cls: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400' },
  { key: 'amber',   label: 'Exam',     cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' },
  { key: 'sky',     label: 'Review',   cls: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-400' },
]

function colorCls(key) {
  return COLOR_OPTIONS.find((c) => c.key === key)?.cls ?? COLOR_OPTIONS[0].cls
}

const priorityStyles = {
  High:   'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
  Medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
  Low:    'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
}

const SUBJECTS = [
  'General','Chemistry','Physics','Biology','Combined Mathematics',
  'Agricultural Science','Higher Mathematics','Accounting','Business Studies',
  'Economics','Business Statistics','Political Science','History','Geography',
  'Logic and Scientific Method','Home Economics','Engineering Technology',
  'Bio-Systems Technology','Science for Technology','Sinhala','Tamil','English',
  'Buddhism','Hinduism','Islam','Christianity','General Information Technology',
]

// ── Calendar helpers ──────────────────────────────────────────────────────────
function getCalendarDays(year, month) {
  const firstDay      = new Date(year, month, 1).getDay()
  const daysInMonth   = new Date(year, month + 1, 0).getDate()
  const daysInPrev    = new Date(year, month, 0).getDate()
  const cells = []
  for (let i = firstDay - 1; i >= 0; i--) cells.push({ day: daysInPrev - i, current: false })
  for (let d = 1; d <= daysInMonth; d++)   cells.push({ day: d, current: true })
  while (cells.length % 7 !== 0)           cells.push({ day: cells.length - daysInMonth - firstDay + 2, current: false })
  return cells
}

function getWeekDays(ref) {
  const start = new Date(ref)
  start.setDate(start.getDate() - start.getDay())
  return Array.from({ length: 7 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d })
}

// ── Add task modal ────────────────────────────────────────────────────────────
function AddTaskModal({ open, onClose, onAdd, loading }) {
  const [title, setTitle]       = useState('')
  const [subject, setSubject]   = useState('General')
  const [priority, setPriority] = useState('Medium')
  const [dueTime, setDueTime]   = useState('')

  if (!open) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!title.trim()) return
    onAdd({ title: title.trim(), subject, priority, due_time: dueTime || null })
    setTitle(''); setSubject('General'); setPriority('Medium'); setDueTime('')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" aria-label="Close" className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl border border-indigo-50 bg-white p-6 shadow-xl dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Add Task</h2>
          <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-lavender dark:hover:bg-gray-800"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Task Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} required
              placeholder="e.g. Review SN1/SN2 mechanisms"
              className="w-full rounded-2xl border border-gray-200 bg-lavender-light px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Subject</label>
              <select value={subject} onChange={(e) => setSubject(e.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-lavender-light px-4 py-2.5 text-sm focus:border-primary focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100">
                {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Priority</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-lavender-light px-4 py-2.5 text-sm focus:border-primary focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100">
                <option>High</option><option>Medium</option><option>Low</option>
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Due Time <span className="text-gray-400">(optional)</span></label>
            <input value={dueTime} onChange={(e) => setDueTime(e.target.value)} type="text"
              placeholder="e.g. 9:00 AM, Tomorrow, Jun 30"
              className="w-full rounded-2xl border border-gray-200 bg-lavender-light px-4 py-2.5 text-sm focus:border-primary focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-2xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-600 hover:bg-lavender dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800">Cancel</button>
            <button type="submit" disabled={loading} className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-primary py-2.5 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-60">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Add event modal ───────────────────────────────────────────────────────────
function AddEventModal({ open, onClose, onAdd, loading }) {
  const [title, setTitle]   = useState('')
  const [date, setDate]     = useState('')
  const [color, setColor]   = useState('indigo')

  if (!open) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!title.trim() || !date) return
    onAdd({ title: title.trim(), event_date: date, color_key: color })
    setTitle(''); setDate(''); setColor('indigo')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" aria-label="Close" className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl border border-indigo-50 bg-white p-6 shadow-xl dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Add Calendar Event</h2>
          <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-lavender dark:hover:bg-gray-800"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Event Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g. Chemistry Exam"
              className="w-full rounded-2xl border border-gray-200 bg-lavender-light px-4 py-2.5 text-sm focus:border-primary focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required
              className="w-full rounded-2xl border border-gray-200 bg-lavender-light px-4 py-2.5 text-sm focus:border-primary focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Type</label>
            <div className="flex flex-wrap gap-2">
              {COLOR_OPTIONS.map((c) => (
                <button key={c.key} type="button" onClick={() => setColor(c.key)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition ${c.cls} ${color === c.key ? 'ring-2 ring-primary ring-offset-1' : ''}`}>
                  {c.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-2xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-600 hover:bg-lavender dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800">Cancel</button>
            <button type="submit" disabled={loading} className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-primary py-2.5 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-60">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Calendar grid ─────────────────────────────────────────────────────────────
function CalendarGrid({ view, year, month, referenceDate, events, onAddEvent }) {
  const today     = new Date()
  const todayDay  = today.getDate()
  const todayMonth = today.getMonth()
  const todayYear = today.getFullYear()
  const monthName = new Date(year, month).toLocaleString('default', { month: 'long', year: 'numeric' })

  // map events by day number for this month
  const eventsForDay = (day, mo, yr) =>
    events.filter((e) => {
      const d = new Date(e.event_date)
      return d.getDate() === day && d.getMonth() === mo && d.getFullYear() === yr
    })

  if (view === 'week') {
    const weekDays = getWeekDays(referenceDate)
    return (
      <div>
        <p className="mb-4 text-sm font-medium text-gray-500 dark:text-gray-400">{monthName}</p>
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((date) => {
            const isToday = date.getDate() === todayDay && date.getMonth() === todayMonth && date.getFullYear() === todayYear
            const dayEvents = eventsForDay(date.getDate(), date.getMonth(), date.getFullYear())
            return (
              <div key={date.toISOString()} className={`min-h-28 rounded-xl border p-2 ${isToday ? 'border-primary bg-primary/5' : 'border-gray-100 dark:border-gray-800'}`}>
                <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium ${isToday ? 'bg-primary text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                  {date.getDate()}
                </span>
                <div className="mt-1 space-y-1">
                  {dayEvents.map((ev) => (
                    <span key={ev.id} className={`block truncate rounded px-1.5 py-0.5 text-[10px] font-medium ${colorCls(ev.color_key)}`}>{ev.title}</span>
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
          <div key={d} className="py-2 text-center text-xs font-semibold uppercase tracking-wide text-gray-400">{d}</div>
        ))}
        {cells.map((cell, i) => {
          const isToday = cell.current && cell.day === todayDay && month === todayMonth && year === todayYear
          const dayEvents = cell.current ? eventsForDay(cell.day, month, year) : []
          return (
            <button key={i} type="button" onClick={() => cell.current && onAddEvent(cell.day)}
              className={`min-h-20 rounded-xl border p-1.5 text-left transition ${
                !cell.current ? 'border-transparent opacity-40 cursor-default'
                : isToday     ? 'border-primary bg-primary/5'
                : 'border-gray-100 hover:bg-lavender-light dark:border-gray-800 dark:hover:bg-gray-800/50 cursor-pointer'
              }`}>
              <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                isToday ? 'bg-primary text-white' : cell.current ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400'
              }`}>{cell.day}</span>
              {dayEvents.length > 0 && (
                <div className="mt-0.5 space-y-0.5">
                  {dayEvents.slice(0, 2).map((ev) => (
                    <span key={ev.id} className={`block truncate rounded px-1 py-0.5 text-[9px] font-medium leading-tight ${colorCls(ev.color_key)}`}>{ev.title}</span>
                  ))}
                  {dayEvents.length > 2 && <span className="block text-[9px] text-gray-400">+{dayEvents.length - 2} more</span>}
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Todo item ─────────────────────────────────────────────────────────────────
function TodoItem({ task, onToggle, onDelete }) {
  return (
    <div className="group flex cursor-pointer items-start gap-3 rounded-xl p-2 transition hover:bg-lavender-light dark:hover:bg-gray-800/50">
      <input type="checkbox" checked={task.done} onChange={() => onToggle(task)}
        className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 text-primary focus:ring-primary" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`text-sm font-medium ${task.done ? 'text-gray-400 line-through dark:text-gray-500' : 'text-gray-900 dark:text-white'}`}>
            {task.title}
          </span>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${priorityStyles[task.priority]}`}>{task.priority}</span>
        </div>
        {task.due_time && <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{task.due_time}</p>}
      </div>
      <button type="button" onClick={() => onDelete(task.id)} aria-label="Delete task"
        className="ml-auto hidden h-6 w-6 shrink-0 items-center justify-center rounded-lg text-gray-300 hover:text-red-400 group-hover:flex dark:text-gray-600">
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function StudyPlanner() {
  const toast                     = useToast()
  const { user }                  = useAuth()
  const [view, setView]           = useState('month')
  const [monthOffset, setMonthOffset] = useState(0)
  const [tasks, setTasks]         = useState([])
  const [events, setEvents]       = useState([])
  const [loading, setLoading]     = useState(true)
  const [taskModal, setTaskModal] = useState(false)
  const [eventModal, setEventModal] = useState(false)
  const [eventDate, setEventDate] = useState(null) // pre-fill date when clicking calendar day
  const [saving, setSaving]       = useState(false)
  const taskChannelRef            = useRef(null)
  const eventChannelRef           = useRef(null)

  const baseDate = useMemo(() => {
    const d = new Date()
    d.setMonth(d.getMonth() + monthOffset)
    return d
  }, [monthOffset])

  const year  = baseDate.getFullYear()
  const month = baseDate.getMonth()

  // ── Load tasks & events ───────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return
    setLoading(true)
    Promise.all([
      supabase.from('study_tasks').select('*').eq('user_id', user.id).order('created_at', { ascending: true }),
      supabase.from('calendar_events').select('*').eq('user_id', user.id).order('event_date', { ascending: true }),
    ]).then(([t, e]) => {
      setTasks(t.data || [])
      setEvents(e.data || [])
      setLoading(false)
    })
  }, [user])

  // ── Real-time: tasks ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return
    const ch = supabase
      .channel(`study-tasks-${user.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'study_tasks', filter: `user_id=eq.${user.id}` },
        (p) => setTasks((prev) => prev.find((t) => t.id === p.new.id) ? prev : [...prev, p.new])
      )
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'study_tasks', filter: `user_id=eq.${user.id}` },
        (p) => setTasks((prev) => prev.map((t) => t.id === p.new.id ? p.new : t))
      )
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'study_tasks', filter: `user_id=eq.${user.id}` },
        (p) => setTasks((prev) => prev.filter((t) => t.id !== p.old.id))
      )
      .subscribe()
    taskChannelRef.current = ch
    return () => supabase.removeChannel(ch)
  }, [user])

  // ── Real-time: events ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return
    const ch = supabase
      .channel(`calendar-events-${user.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'calendar_events', filter: `user_id=eq.${user.id}` },
        (p) => setEvents((prev) => prev.find((e) => e.id === p.new.id) ? prev : [...prev, p.new])
      )
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'calendar_events', filter: `user_id=eq.${user.id}` },
        (p) => setEvents((prev) => prev.filter((e) => e.id !== p.old.id))
      )
      .subscribe()
    eventChannelRef.current = ch
    return () => supabase.removeChannel(ch)
  }, [user])

  // ── Add task ──────────────────────────────────────────────────────────────
  const handleAddTask = useCallback(async (fields) => {
    if (!user) return
    setSaving(true)
    const { error } = await supabase.from('study_tasks').insert({ ...fields, user_id: user.id })
    if (error) toast.error('Failed to add task')
    else { toast.success('Task added!'); setTaskModal(false) }
    setSaving(false)
  }, [user, toast])

  // ── Toggle task done ──────────────────────────────────────────────────────
  const handleToggle = useCallback(async (task) => {
    const { error } = await supabase.from('study_tasks').update({ done: !task.done }).eq('id', task.id)
    if (!error && !task.done) toast.success('Task completed!')
  }, [toast])

  // ── Delete task ───────────────────────────────────────────────────────────
  const handleDeleteTask = useCallback(async (id) => {
    await supabase.from('study_tasks').delete().eq('id', id)
  }, [])

  // ── Add event ─────────────────────────────────────────────────────────────
  const handleAddEvent = useCallback(async (fields) => {
    if (!user) return
    setSaving(true)
    const { error } = await supabase.from('calendar_events').insert({ ...fields, user_id: user.id })
    if (error) toast.error('Failed to add event')
    else { toast.success('Event added!'); setEventModal(false); setEventDate(null) }
    setSaving(false)
  }, [user, toast])

  // ── Calendar day click ────────────────────────────────────────────────────
  const handleDayClick = useCallback((day) => {
    const d = new Date(year, month, day)
    setEventDate(d.toISOString().split('T')[0])
    setEventModal(true)
  }, [year, month])

  // ── Stats ─────────────────────────────────────────────────────────────────
  const pending   = tasks.filter((t) => !t.done)
  const done      = tasks.filter((t) => t.done)
  const totalTasks = tasks.length
  const donePct   = totalTasks === 0 ? 0 : Math.round((done.length / totalTasks) * 100)

  // Group pending by subject
  const bySubject = useMemo(() => {
    const map = {}
    pending.forEach((t) => { (map[t.subject] = map[t.subject] || []).push(t) })
    return map
  }, [pending])

  return (
    <div className="ep-page">
      <PageHeader
        title="Study Planner"
        subtitle="Organize your schedule, track tasks, and plan your study time."
        action={
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setEventModal(true)}
              className="ep-btn-secondary hidden sm:inline-flex">
              <Calendar className="h-4 w-4" />Add Event
            </button>
            <button type="button" onClick={() => setTaskModal(true)} className="ep-btn-primary">
              <Plus className="h-4 w-4" />Add Task
            </button>
          </div>
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
                  <button key={v} type="button" onClick={() => setView(v)}
                    className={`rounded-lg px-4 py-1.5 text-sm font-medium capitalize transition ${
                      view === v ? 'bg-white text-primary shadow-sm dark:bg-gray-900' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                    }`}>
                    {v}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setMonthOffset((o) => o - 1)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 text-gray-600 transition hover:border-primary hover:text-primary dark:border-gray-700 dark:text-gray-400" aria-label="Previous">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => setMonthOffset(0)}
                  className="rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:border-primary hover:text-primary dark:border-gray-700 dark:text-gray-400">
                  Today
                </button>
                <button type="button" onClick={() => setMonthOffset((o) => o + 1)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 text-gray-600 transition hover:border-primary hover:text-primary dark:border-gray-700 dark:text-gray-400" aria-label="Next">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : (
              <CalendarGrid view={view} year={year} month={month} referenceDate={baseDate}
                events={events} onAddEvent={handleDayClick} />
            )}
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
                Focus on subjects with pending <strong>High priority</strong> tasks first. Use the AI Tutor to get explanations before your next session.
              </p>
              <a href="/ai-tutor" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-amber-700 transition hover:text-amber-800 dark:text-amber-400">
                Open AI Tutor<ArrowRight className="h-4 w-4" />
              </a>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5 dark:border-emerald-900/40 dark:bg-emerald-950/20">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/40">
                  <Zap className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Daily Progress</h3>
              </div>
              <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                You've completed <strong>{done.length} of {totalTasks} tasks</strong> — {donePct}% done. Keep it up to hit your study goals!
              </p>
              <a href="/quizzes" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 transition hover:text-emerald-800 dark:text-emerald-400">
                Practice with quizzes<ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Smart exam banner */}
          <div className="relative overflow-hidden rounded-2xl border border-indigo-50 shadow-sm dark:border-gray-800">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-primary to-violet-700" />
            <div className="relative flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">Smart Exam Insights</h3>
                <p className="mt-1 max-w-md text-sm text-indigo-100">
                  AI analyzed your quiz scores and study tasks to predict high-yield topics for your upcoming exams.
                </p>
              </div>
              <a href="/quizzes" className="inline-flex shrink-0 items-center gap-2 rounded-2xl bg-white/15 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/25">
                View Quizzes<ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>

        {/* To-Do sidebar */}
        <aside className="w-full shrink-0 xl:w-80">
          <div className="sticky top-[4.5rem] flex flex-col ep-card sm:top-20">
            <div className="flex items-center justify-between border-b border-indigo-50 px-5 py-4 dark:border-gray-800">
              <div>
                <h2 className="font-semibold text-gray-900 dark:text-white">To-Do List</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">{pending.length} pending</p>
              </div>
              <button type="button" onClick={() => setTaskModal(true)}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary transition hover:bg-primary/20">
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[420px] flex-1 overflow-y-auto p-4">
              {loading ? (
                <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-gray-400" /></div>
              ) : pending.length === 0 ? (
                <EmptyState icon={ListTodo} title="All tasks complete!"
                  description="Great work — add more tasks to stay on track."
                  action={
                    <button type="button" onClick={() => setTaskModal(true)} className="ep-btn-primary">
                      <Plus className="h-4 w-4" />Add Task
                    </button>
                  }
                />
              ) : (
                Object.entries(bySubject).map(([subj, subTasks]) => (
                  <div key={subj} className="mb-5 last:mb-0">
                    <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-primary">{subj}</h3>
                    <div className="space-y-1">
                      {subTasks.map((task) => (
                        <TodoItem key={task.id} task={task} onToggle={handleToggle} onDelete={handleDeleteTask} />
                      ))}
                    </div>
                  </div>
                ))
              )}

              {/* Completed section */}
              {done.length > 0 && (
                <div className="mt-4 border-t border-gray-100 pt-4 dark:border-gray-800">
                  <h3 className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-400">
                    <Check className="h-3.5 w-3.5" />Completed ({done.length})
                  </h3>
                  <div className="space-y-1">
                    {done.slice(0, 5).map((task) => (
                      <div key={task.id} className="flex items-center gap-2 rounded-xl p-2">
                        <p className="flex-1 text-sm font-medium text-gray-400 line-through dark:text-gray-500">{task.title}</p>
                        <button type="button" onClick={() => handleDeleteTask(task.id)}
                          className="text-gray-300 hover:text-red-400"><Trash2 className="h-3 w-3" /></button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Progress bar */}
            <div className="border-t border-indigo-50 p-5 dark:border-gray-800">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-medium text-gray-700 dark:text-gray-300">Daily Progress</span>
                <span className="font-bold text-primary">{donePct}%</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-lavender dark:bg-gray-800">
                <div className="h-full rounded-full bg-gradient-to-r from-primary to-violet-500 transition-all duration-500"
                  style={{ width: `${donePct}%` }} />
              </div>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                {done.length} of {totalTasks} tasks completed
              </p>
            </div>
          </div>
        </aside>
      </div>

      <AddTaskModal  open={taskModal}  onClose={() => setTaskModal(false)}  onAdd={handleAddTask}  loading={saving} />
      <AddEventModal open={eventModal} onClose={() => { setEventModal(false); setEventDate(null) }}
        onAdd={handleAddEvent} loading={saving}
        defaultDate={eventDate}
      />
    </div>
  )
}
