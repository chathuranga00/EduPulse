import { Link } from 'react-router-dom'
import {
  BookOpen,
  Clock,
  ClipboardCheck,
  TrendingUp,
  Sparkles,
  Trophy,
  Calendar,
  ChevronRight,
} from 'lucide-react'

const userName = 'Jane'

const stats = [
  {
    label: 'Courses in Progress',
    value: '4',
    icon: BookOpen,
    color: 'bg-indigo-100 text-primary dark:bg-indigo-900/40',
  },
  {
    label: 'Hours Studied This Week',
    value: '18.5h',
    icon: Clock,
    color: 'bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-400',
  },
  {
    label: 'Quizzes Completed',
    value: '12',
    icon: ClipboardCheck,
    color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400',
  },
  {
    label: 'Average Score',
    value: '87%',
    icon: TrendingUp,
    color: 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400',
  },
]

const scheduleItems = [
  {
    day: 30,
    month: 'Jun',
    title: 'Calculus Midterm Review',
    subtitle: 'Mathematics',
    note: '10:00 AM',
    urgent: false,
  },
  {
    day: 1,
    month: 'Jul',
    title: 'Organic Chemistry Lab',
    subtitle: 'Chemistry',
    note: 'Due tomorrow',
    urgent: true,
  },
  {
    day: 2,
    month: 'Jul',
    title: 'Physics Problem Set #4',
    subtitle: 'Physics',
    note: '2:00 PM',
    urgent: false,
  },
  {
    day: 3,
    month: 'Jul',
    title: 'Biology Quiz Prep',
    subtitle: 'Biology',
    note: '11:30 AM',
    urgent: false,
  },
  {
    day: 5,
    month: 'Jul',
    title: 'Essay Draft Submission',
    subtitle: 'English',
    note: 'Due in 3 days',
    urgent: false,
  },
]

function AchievementIllustration() {
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
            Top Scholar
          </span>
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  return (
    <>
      <div className="ep-page pb-20">
        {/* Welcome banner */}
        <div className="relative overflow-hidden rounded-2xl border border-indigo-50 bg-gradient-to-r from-white via-lavender to-indigo-50 p-6 shadow-sm shadow-indigo-100/50 dark:border-gray-800 dark:from-gray-900 dark:via-gray-900 dark:to-indigo-950/40 dark:shadow-none sm:p-8">
          <div className="flex items-center justify-between gap-6">
            <div className="flex-1">
              <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-primary">
                Level 12 Scholar
              </span>
              <h1 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
                Welcome back, {userName}!
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-300">
                You&apos;re on a{' '}
                <span className="font-semibold text-gray-900 dark:text-white">
                  14-day study streak
                </span>{' '}
                — keep it going! 🔥
              </p>
            </div>
            <AchievementIllustration />
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map(({ label, value, icon: Icon, color }) => (
            <div
              key={label}
              className="ep-card p-5 transition-transform duration-200 hover:-translate-y-0.5"
            >
              <div className={`mb-3 inline-flex rounded-xl p-2.5 ${color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
            </div>
          ))}
        </div>

        {/* Active course */}
        <div className="ep-card p-6">
          <h2 className="mb-5 text-lg font-semibold text-gray-900 dark:text-white">
            Active Course
          </h2>
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="relative h-28 w-full shrink-0 overflow-hidden rounded-2xl sm:h-24 sm:w-36">
              <div className="absolute inset-0 bg-gradient-to-br from-primary via-indigo-500 to-violet-600" />
              <div className="absolute inset-0 flex items-center justify-center">
                <BookOpen className="h-10 w-10 text-white/90" />
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/40 to-transparent px-3 py-2">
                <span className="text-xs font-medium text-white">In Progress</span>
              </div>
            </div>

            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Advanced Calculus II
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Module 4 of 8 — Integration Techniques
              </p>

              <div className="mt-4">
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Progress</span>
                  <span className="font-semibold text-primary">62%</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-lavender dark:bg-gray-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-violet-500 transition-all"
                    style={{ width: '62%' }}
                  />
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  className="ep-btn-primary"
                >
                  Resume Study
                </button>
                <button
                  type="button"
                  className="ep-btn-secondary"
                >
                  Module Outline
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Upcoming schedule */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Upcoming Schedule
            </h2>
            <a
              href="#calendar"
              className="flex items-center gap-1 text-sm font-medium text-primary transition hover:text-primary-hover"
            >
              View Calendar
              <ChevronRight className="h-4 w-4" />
            </a>
          </div>

          <div className="-mx-1 flex gap-4 overflow-x-auto px-1 pb-2">
            {scheduleItems.map((item) => (
              <div
                key={`${item.month}-${item.day}-${item.title}`}
                className="ep-card min-w-[200px] shrink-0 p-4 transition-transform duration-200 hover:-translate-y-0.5"
              >
                <div className="mb-3 flex items-start gap-3">
                  <div className="flex flex-col items-center rounded-xl bg-lavender px-3 py-2 dark:bg-gray-800">
                    <span className="text-xl font-bold leading-none text-primary">
                      {item.day}
                    </span>
                    <span className="mt-0.5 text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                      {item.month}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <p className="truncate font-semibold text-gray-900 dark:text-white">
                      {item.title}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{item.subtitle}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <Calendar className="h-3.5 w-3.5 text-gray-400" />
                  <span
                    className={
                      item.urgent
                        ? 'font-semibold text-red-500'
                        : 'text-gray-500 dark:text-gray-400'
                    }
                  >
                    {item.note}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating Ask AI button */}
      <Link
        to="/ai-tutor"
        className="fixed bottom-4 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-indigo-300/50 transition-all duration-200 hover:scale-105 hover:bg-primary-hover hover:shadow-xl sm:bottom-6 sm:right-6 dark:shadow-indigo-900/50"
        aria-label="Ask AI"
      >
        <Sparkles className="h-6 w-6" />
      </Link>
    </>
  )
}
