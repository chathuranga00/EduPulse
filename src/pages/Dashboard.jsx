import { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  BookOpen, Clock, ClipboardCheck, TrendingUp, Sparkles,
  Trophy, Calendar, ChevronRight, Loader2, MessageSquare,
  Users, FileText, ListTodo, Play,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { supabase } from '../lib/supabase.js'

// ── Helpers ───────────────────────────────────────────────────────────────────
function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000)
  if (diff < 60)     return 'Just now'
  if (diff < 3600)   return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400)  return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
  return new Date(dateStr).toLocaleDateString()
}

function formatEventDate(dateStr) {
  const d = new Date(dateStr)
  return {
    day:   d.getDate(),
    month: d.toLocaleString('default', { month: 'short' }),
    full:  d.toLocaleDateString('default', { weekday: 'short', month: 'short', day: 'numeric' }),
  }
}

// ── Skeleton loader ────────────────────────────────────────────────────────────
function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800 ${className}`} />
}

// ── Achievement illustration ───────────────────────────────────────────────────
function AchievementIllustration({ quizCount, avgScore }) {
  const level = Math.floor((quizCount * 2 + (avgScore || 0) / 10) / 5) + 1
  return (
    <div className="relative hidden h-36 w-36 shrink-0 sm:block lg:h-44 lg:w-44">
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-200/60 to-indigo-200/60 blur-sm dark:from-amber-500/20 dark:to-indigo-500/20" />
      <div className="relative flex h-full w-full items-center justify-center rounded-2xl bg-gradient-to-br from-amber-100 via-white to-indigo-100 shadow-inner dark:from-amber-900/30 dark:via-gray-800 dark:to-indigo-900/30">
        <div className="absolute -right-1 -top-1 flex h-8 w-8 items-center justify-center rounded-full bg-amber-400 text-white shadow-md">
          <Sparkles className="h-4 w-4" />
        </div>
        <div className="flex flex-col items-center gap-1">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-500 shadow-lg shadow-amber-200/50 dark:shadow-none">
            <Trophy className="h-8 w-8 text-white" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            Level {level} Scholar
          </span>
        </div>
      </div>
    </div>
  )
}

// ── Quick action card ──────────────────────────────────────────────────────────
function QuickAction({ to, icon: Icon, label, color }) {
  return (
    <Link to={to}
      className={`flex flex-col items-center gap-2 rounded-2xl border p-4 text-center transition hover:-translate-y-0.5 hover:shadow-md ${color}`}>
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/60 dark:bg-gray-900/40">
        <Icon className="h-5 w-5" />
      </div>
      <span className="text-xs font-semibold">{label}</span>
    </Link>
  )
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user, initials } = useAuth()

  // real-time data
  const [quizResults,    setQuizResults]    = useState([])
  const [tasks,          setTasks]          = useState([])
  const [events,         setEvents]         = useState([])
  const [chatCount,      setChatCount]      = useState(0)
  const [recentPosts,    setRecentPosts]    = useState([])
  const [loading,        setLoading]        = useState(true)

  const channels = useRef([])

  // ── Initial load ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return

    const today = new Date().toISOString().split('T')[0]

    Promise.all([
      // quiz results
      supabase.from('quiz_results').select('*').eq('user_id', user.id).order('taken_at', { ascending: false }).limit(50),
      // tasks
      supabase.from('study_tasks').select('*').eq('user_id', user.id),
      // upcoming calendar events
      supabase.from('calendar_events').select('*').eq('user_id', user.id).gte('event_date', today).order('event_date', { ascending: true }).limit(6),
      // tutor chat count
      supabase.from('tutor_chats').select('id', { count: 'exact' }).eq('user_id', user.id),
      // recent community posts
      supabase.from('posts').select('*').order('created_at', { ascending: false }).limit(3),
    ]).then(([quiz, task, evt, chat, posts]) => {
      setQuizResults(quiz.data  || [])
      setTasks(task.data        || [])
      setEvents(evt.data        || [])
      setChatCount(chat.count   || 0)
      setRecentPosts(posts.data || [])
      setLoading(false)
    })
  }, [user])

  // ── Real-time subscriptions ───────────────────────────────────────────────
  useEffect(() => {
    if (!user) return

    const today = new Date().toISOString().split('T')[0]

    // quiz_results
    const q = supabase.channel(`dash-quiz-${user.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'quiz_results', filter: `user_id=eq.${user.id}` },
        (p) => setQuizResults((prev) => [p.new, ...prev].slice(0, 50))
      ).subscribe()

    // study_tasks
    const t = supabase.channel(`dash-tasks-${user.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'study_tasks', filter: `user_id=eq.${user.id}` },
        (p) => setTasks((prev) => [...prev, p.new])
      )
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'study_tasks', filter: `user_id=eq.${user.id}` },
        (p) => setTasks((prev) => prev.map((x) => x.id === p.new.id ? p.new : x))
      )
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'study_tasks', filter: `user_id=eq.${user.id}` },
        (p) => setTasks((prev) => prev.filter((x) => x.id !== p.old.id))
      ).subscribe()

    // calendar_events
    const e = supabase.channel(`dash-events-${user.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'calendar_events', filter: `user_id=eq.${user.id}` },
        (p) => { if (p.new.event_date >= today) setEvents((prev) => [...prev, p.new].sort((a, b) => a.event_date.localeCompare(b.event_date)).slice(0, 6)) }
      )
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'calendar_events', filter: `user_id=eq.${user.id}` },
        (p) => setEvents((prev) => prev.filter((x) => x.id !== p.old.id))
      ).subscribe()

    // community posts
    const cp = supabase.channel('dash-posts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' },
        (p) => setRecentPosts((prev) => [p.new, ...prev].slice(0, 3))
      ).subscribe()

    // tutor chats
    const tc = supabase.channel(`dash-chats-${user.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tutor_chats', filter: `user_id=eq.${user.id}` },
        () => setChatCount((n) => n + 1)
      ).subscribe()

    channels.current = [q, t, e, cp, tc]
    return () => channels.current.forEach((ch) => supabase.removeChannel(ch))
  }, [user])

  // ── Computed stats ────────────────────────────────────────────────────────
  const quizCount   = quizResults.length
  const avgScore    = quizCount === 0 ? 0 : Math.round(quizResults.reduce((s, r) => s + r.score_pct, 0) / quizCount)
  const tasksDone   = tasks.filter((t) => t.done).length
  const tasksPending = tasks.filter((t) => !t.done).length
  const taskTotal   = tasks.length
  const taskPct     = taskTotal === 0 ? 0 : Math.round((tasksDone / taskTotal) * 100)

  // best scores per subject
  const subjectBest = {}
  quizResults.forEach((r) => {
    if (!subjectBest[r.subject] || r.score_pct > subjectBest[r.subject]) {
      subjectBest[r.subject] = r.score_pct
    }
  })
  const topSubjects = Object.entries(subjectBest).sort((a, b) => b[1] - a[1]).slice(0, 3)

  // recent quiz (last 3)
  const recentQuizzes = quizResults.slice(0, 3)

  const stats = [
    { label: 'Quizzes Completed',   value: loading ? null : String(quizCount),           icon: ClipboardCheck, color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400' },
    { label: 'Average Quiz Score',  value: loading ? null : quizCount ? `${avgScore}%` : '—', icon: TrendingUp, color: 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400' },
    { label: 'Tasks Completed',     value: loading ? null : `${tasksDone}/${taskTotal}`,  icon: ListTodo,       color: 'bg-indigo-100 text-primary dark:bg-indigo-900/40' },
    { label: 'AI Tutor Sessions',   value: loading ? null : String(chatCount),            icon: MessageSquare,  color: 'bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-400' },
  ]

  return (
    <>
      <div className="ep-page pb-20">

        {/* ── Welcome banner ── */}
        <div className="relative overflow-hidden rounded-2xl border border-indigo-50 bg-gradient-to-r from-white via-lavender to-indigo-50 p-6 shadow-sm shadow-indigo-100/50 dark:border-gray-800 dark:from-gray-900 dark:via-gray-900 dark:to-indigo-950/40 dark:shadow-none sm:p-8">
          <div className="flex items-center justify-between gap-6">
            <div className="flex-1">
              <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-primary">
                {loading ? 'Loading…' : `${quizCount + tasksDone} Activities Done`}
              </span>
              <h1 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
                Welcome back, {user?.name?.split(' ')[0] || 'there'}!
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-300">
                {loading ? (
                  <Skeleton className="h-5 w-64" />
                ) : tasksPending > 0 ? (
                  <>You have <span className="font-semibold text-gray-900 dark:text-white">{tasksPending} pending task{tasksPending !== 1 ? 's' : ''}</span> today. Let's get started! 📚</>
                ) : quizCount > 0 ? (
                  <>Your average score is <span className="font-semibold text-gray-900 dark:text-white">{avgScore}%</span> — great work! 🔥</>
                ) : (
                  <>Start by taking a quiz or adding tasks to your planner. 🚀</>
                )}
              </p>
            </div>
            <AchievementIllustration quizCount={quizCount} avgScore={avgScore} />
          </div>
        </div>

        {/* ── Stat cards ── */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="ep-card p-5 transition-transform duration-200 hover:-translate-y-0.5">
              <div className={`mb-3 inline-flex rounded-xl p-2.5 ${color}`}>
                <Icon className="h-5 w-5" />
              </div>
              {value === null
                ? <Skeleton className="mb-1 h-8 w-16" />
                : <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
              }
              <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
            </div>
          ))}
        </div>

        {/* ── Quick actions ── */}
        <div>
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <QuickAction to="/ai-tutor"      icon={Sparkles}      label="Ask AI Tutor"   color="border-indigo-100 bg-indigo-50 text-primary dark:border-indigo-900/40 dark:bg-indigo-900/20" />
            <QuickAction to="/quizzes"       icon={Play}          label="Take a Quiz"    color="border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-400" />
            <QuickAction to="/study-planner" icon={ListTodo}      label="View Tasks"     color="border-amber-100 bg-amber-50 text-amber-700 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-400" />
            <QuickAction to="/pdf-analysis"  icon={FileText}      label="Analyse PDF"    color="border-violet-100 bg-violet-50 text-violet-700 dark:border-violet-900/40 dark:bg-violet-900/20 dark:text-violet-400" />
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">

          {/* ── Upcoming events ── */}
          <div className="ep-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900 dark:text-white">Upcoming Events</h2>
              <Link to="/study-planner" className="flex items-center gap-1 text-sm font-medium text-primary hover:text-primary-hover">
                View all<ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            {loading ? (
              <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
            ) : events.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center">
                <Calendar className="mb-2 h-8 w-8 text-gray-300 dark:text-gray-700" />
                <p className="text-sm text-gray-400">No upcoming events</p>
                <Link to="/study-planner" className="mt-2 text-xs font-semibold text-primary hover:text-primary-hover">Add an event →</Link>
              </div>
            ) : (
              <div className="space-y-2">
                {events.map((ev) => {
                  const { day, month } = formatEventDate(ev.event_date)
                  return (
                    <div key={ev.id} className="flex items-center gap-3 rounded-xl p-2.5 hover:bg-lavender-light dark:hover:bg-gray-800/50">
                      <div className="flex w-12 shrink-0 flex-col items-center rounded-xl bg-lavender px-2 py-1.5 dark:bg-gray-800">
                        <span className="text-lg font-bold leading-none text-primary">{day}</span>
                        <span className="text-[10px] font-semibold uppercase text-gray-500 dark:text-gray-400">{month}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">{ev.title}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{formatEventDate(ev.event_date).full}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* ── Daily task progress ── */}
          <div className="ep-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900 dark:text-white">Today's Tasks</h2>
              <Link to="/study-planner" className="flex items-center gap-1 text-sm font-medium text-primary hover:text-primary-hover">
                Manage<ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            {loading ? (
              <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
            ) : (
              <>
                {/* Progress ring */}
                <div className="mb-4 flex items-center gap-4">
                  <div className="relative flex h-20 w-20 shrink-0 items-center justify-center">
                    <svg className="absolute inset-0 -rotate-90" viewBox="0 0 80 80">
                      <circle cx="40" cy="40" r="32" fill="none" stroke="currentColor" strokeWidth="8" className="text-lavender dark:text-gray-800" />
                      <circle cx="40" cy="40" r="32" fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 32}`}
                        strokeDashoffset={`${2 * Math.PI * 32 * (1 - taskPct / 100)}`}
                        className="text-primary transition-all duration-700" />
                    </svg>
                    <span className="text-lg font-bold text-primary">{taskPct}%</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{tasksDone} of {taskTotal} complete</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{tasksPending} task{tasksPending !== 1 ? 's' : ''} remaining</p>
                    {tasksPending === 0 && taskTotal > 0 && (
                      <p className="mt-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">🎉 All done!</p>
                    )}
                  </div>
                </div>

                {/* Pending tasks preview */}
                <div className="space-y-1.5">
                  {tasks.filter((t) => !t.done).slice(0, 4).map((task) => (
                    <div key={task.id} className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 text-sm">
                      <div className="h-2 w-2 shrink-0 rounded-full bg-primary/50" />
                      <span className="flex-1 truncate text-gray-700 dark:text-gray-300">{task.title}</span>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        task.priority === 'High' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                        : task.priority === 'Medium' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
                        : 'bg-gray-100 text-gray-500 dark:bg-gray-800'}`}>{task.priority}</span>
                    </div>
                  ))}
                  {tasksPending === 0 && taskTotal === 0 && (
                    <Link to="/study-planner" className="block text-center text-sm text-primary hover:text-primary-hover">+ Add your first task</Link>
                  )}
                </div>
              </>
            )}
          </div>

          {/* ── Recent quiz results ── */}
          <div className="ep-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900 dark:text-white">Recent Quizzes</h2>
              <Link to="/quizzes" className="flex items-center gap-1 text-sm font-medium text-primary hover:text-primary-hover">
                All quizzes<ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            {loading ? (
              <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
            ) : recentQuizzes.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center">
                <ClipboardCheck className="mb-2 h-8 w-8 text-gray-300 dark:text-gray-700" />
                <p className="text-sm text-gray-400">No quizzes taken yet</p>
                <Link to="/quizzes" className="mt-2 text-xs font-semibold text-primary hover:text-primary-hover">Start a quiz →</Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentQuizzes.map((r) => {
                  const grade = r.score_pct >= 75 ? { label: 'A', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30' }
                    : r.score_pct >= 65 ? { label: 'B', color: 'text-sky-600 bg-sky-50 dark:bg-sky-900/30' }
                    : r.score_pct >= 55 ? { label: 'C', color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30' }
                    : r.score_pct >= 35 ? { label: 'S', color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/30' }
                    : { label: 'F', color: 'text-red-500 bg-red-50 dark:bg-red-900/30' }
                  return (
                    <div key={r.id} className="flex items-center gap-3 rounded-xl p-2 hover:bg-lavender-light dark:hover:bg-gray-800/50">
                      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${grade.color}`}>
                        {grade.label}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{r.title}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{r.subject} · {timeAgo(r.taken_at)}</p>
                      </div>
                      <span className="shrink-0 text-sm font-bold text-primary">{r.score_pct}%</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* ── Top subjects ── */}
          <div className="ep-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900 dark:text-white">Top Subjects</h2>
              <Link to="/quizzes" className="flex items-center gap-1 text-sm font-medium text-primary hover:text-primary-hover">
                Practice<ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            {loading ? (
              <div className="space-y-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-8" />)}</div>
            ) : topSubjects.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center">
                <TrendingUp className="mb-2 h-8 w-8 text-gray-300 dark:text-gray-700" />
                <p className="text-sm text-gray-400">Complete quizzes to see your top subjects</p>
              </div>
            ) : (
              <div className="space-y-4">
                {topSubjects.map(([subject, best]) => (
                  <div key={subject}>
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <span className="font-medium text-gray-700 dark:text-gray-300">{subject}</span>
                      <span className="font-bold text-primary">{best}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-lavender dark:bg-gray-800">
                      <div className="h-full rounded-full bg-gradient-to-r from-primary to-violet-500 transition-all duration-700"
                        style={{ width: `${best}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Community activity ── */}
        <div className="ep-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 dark:text-white">Community Activity</h2>
            <Link to="/community" className="flex items-center gap-1 text-sm font-medium text-primary hover:text-primary-hover">
              View all<ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          {loading ? (
            <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
          ) : recentPosts.length === 0 ? (
            <div className="flex flex-col items-center py-6 text-center">
              <Users className="mb-2 h-8 w-8 text-gray-300 dark:text-gray-700" />
              <p className="text-sm text-gray-400">No community posts yet</p>
              <Link to="/community" className="mt-2 text-xs font-semibold text-primary hover:text-primary-hover">Be the first to post →</Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {recentPosts.map((post) => (
                <div key={post.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-violet-400 text-xs font-semibold text-white">
                    {post.author_initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">{post.author_name}</span>
                      <span className="rounded-full bg-lavender px-2 py-0.5 text-[10px] font-medium text-primary dark:bg-gray-800">{post.course}</span>
                      <span className="text-xs text-gray-400">{timeAgo(post.created_at)}</span>
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-sm text-gray-600 dark:text-gray-400">{post.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Floating Ask AI */}
      <Link to="/ai-tutor"
        className="fixed bottom-4 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-indigo-300/50 transition-all duration-200 hover:scale-105 hover:bg-primary-hover hover:shadow-xl sm:bottom-6 sm:right-6 dark:shadow-indigo-900/50"
        aria-label="Ask AI">
        <Sparkles className="h-6 w-6" />
      </Link>
    </>
  )
}
