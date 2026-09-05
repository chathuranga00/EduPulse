import { useMemo, useState, useEffect, useCallback, useRef } from 'react'
import {
  Clock, Trophy, Play, Sparkles, HelpCircle, X, Filter,
  ClipboardList, ChevronLeft, CheckCircle2, XCircle,
  AlertCircle, RotateCcw, BookOpen, Loader2, History,
} from 'lucide-react'
import PageHeader from '../components/ui/PageHeader.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import { useToast } from '../components/ui/Toast.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { supabase } from '../lib/supabase.js'
import { generateQuizPaper } from '../lib/api.js'

// ── Subject catalogue ────────────────────────────────────────────────────────
const STREAMS = [
  { label: 'Science Stream', subjects: ['Chemistry','Physics','Biology','Combined Mathematics','Agricultural Science','Higher Mathematics'] },
  { label: 'Commerce Stream', subjects: ['Accounting','Business Studies','Economics','Business Statistics'] },
  { label: 'Arts & Social Sciences', subjects: ['Political Science','History','Geography','Logic and Scientific Method','Home Economics','Communication & Media Studies','Greek and Roman Civilization'] },
  { label: 'Technology Stream', subjects: ['Science for Technology','Engineering Technology','Bio-Systems Technology'] },
  { label: 'Languages', subjects: ['Sinhala','Tamil','English','Pali','Sanskrit','Arabic','French','German','Russian','Hindi','Japanese','Chinese','Korean','Malay'] },
  { label: 'Religions & Civilizations', subjects: ['Buddhist Civilization','Hindu Civilization','Islam Civilization','Christian Civilization','Buddhism','Hinduism','Islam','Christianity'] },
  { label: 'Aesthetic Subjects', subjects: ['Dancing','Eastern Music','Western Music','Carnatic Music','Drama and Theater','Art'] },
  { label: 'Common Modules', subjects: ['General English','Common General Test','General Information Technology'] },
]

// ── Quiz key: stable identifier per quiz card ────────────────────────────────
function quizKey(quiz) {
  return `${quiz.subject}::${quiz.title}`
}

// ── Sample quiz cards ────────────────────────────────────────────────────────
const BASE_QUIZZES = [
  { id: 1,  title: 'Organic Chemistry — Reaction Mechanisms', subject: 'Chemistry',              questions: 20, duration: '30 min', difficulty: 'Hard'   },
  { id: 2,  title: "Mechanics — Newton's Laws",               subject: 'Physics',                questions: 25, duration: '35 min', difficulty: 'Medium' },
  { id: 3,  title: 'Cell Structure & Function',               subject: 'Biology',                questions: 18, duration: '25 min', difficulty: 'Medium' },
  { id: 4,  title: 'Differentiation & Integration',           subject: 'Combined Mathematics',   questions: 22, duration: '35 min', difficulty: 'Hard'   },
  { id: 5,  title: 'Plant Nutrition & Growth',                subject: 'Agricultural Science',   questions: 15, duration: '20 min', difficulty: 'Easy'   },
  { id: 6,  title: 'Matrices & Determinants',                 subject: 'Higher Mathematics',     questions: 20, duration: '30 min', difficulty: 'Hard'   },
  { id: 7,  title: 'Double Entry Bookkeeping',                subject: 'Accounting',             questions: 20, duration: '30 min', difficulty: 'Medium' },
  { id: 8,  title: 'Marketing Concepts',                      subject: 'Business Studies',       questions: 15, duration: '20 min', difficulty: 'Easy'   },
  { id: 9,  title: 'Supply & Demand Analysis',                subject: 'Economics',              questions: 18, duration: '25 min', difficulty: 'Medium' },
  { id: 10, title: 'Index Numbers & Probability',             subject: 'Business Statistics',    questions: 15, duration: '25 min', difficulty: 'Hard'   },
  { id: 11, title: 'Sri Lankan Political Institutions',       subject: 'Political Science',      questions: 15, duration: '20 min', difficulty: 'Medium' },
  { id: 12, title: 'Ancient Sri Lankan History',              subject: 'History',                questions: 20, duration: '30 min', difficulty: 'Medium' },
  { id: 13, title: 'Geomorphology Fundamentals',              subject: 'Geography',              questions: 18, duration: '25 min', difficulty: 'Easy'   },
  { id: 14, title: 'Deductive & Inductive Reasoning',         subject: 'Logic and Scientific Method', questions: 15, duration: '20 min', difficulty: 'Medium' },
  { id: 15, title: 'Electronics & Circuits',                  subject: 'Engineering Technology', questions: 20, duration: '30 min', difficulty: 'Hard'   },
  { id: 16, title: 'Ecology & Biosystems',                    subject: 'Bio-Systems Technology', questions: 18, duration: '25 min', difficulty: 'Medium' },
  { id: 17, title: 'Forces & Materials — SFT',                subject: 'Science for Technology', questions: 20, duration: '30 min', difficulty: 'Medium' },
  { id: 18, title: 'English Grammar & Comprehension',         subject: 'English',                questions: 20, duration: '25 min', difficulty: 'Easy'   },
  { id: 19, title: 'Sinhala Literature Appreciation',         subject: 'Sinhala',                questions: 15, duration: '20 min', difficulty: 'Medium' },
  { id: 20, title: 'Buddhist Philosophy & Ethics',            subject: 'Buddhism',               questions: 15, duration: '20 min', difficulty: 'Easy'   },
  { id: 21, title: 'GIT — Spreadsheets & Databases',          subject: 'General Information Technology', questions: 20, duration: '30 min', difficulty: 'Easy' },
  { id: 22, title: 'Common General Test — Aptitude',          subject: 'Common General Test',    questions: 25, duration: '40 min', difficulty: 'Medium' },
]

// ── Styling helpers ──────────────────────────────────────────────────────────
const difficultyColors = {
  Easy:   'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
  Medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
  Hard:   'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
}
const streamColorMap = {
  'Science Stream':           'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-400',
  'Commerce Stream':          'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
  'Arts & Social Sciences':   'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-400',
  'Technology Stream':        'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400',
  'Languages':                'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400',
  'Religions & Civilizations':'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400',
  'Aesthetic Subjects':       'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-400',
  'Common Modules':           'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
}
function getSubjectColor(subject) {
  for (const s of STREAMS) {
    if (s.subjects.includes(subject)) return streamColorMap[s.label] ?? 'bg-primary/10 text-primary'
  }
  return 'bg-primary/10 text-primary'
}

function gradeFromPct(pct) {
  if (pct >= 75) return { label: 'A', color: 'text-emerald-600' }
  if (pct >= 65) return { label: 'B', color: 'text-sky-600' }
  if (pct >= 55) return { label: 'C', color: 'text-indigo-600' }
  if (pct >= 35) return { label: 'S', color: 'text-amber-600' }
  return          { label: 'F', color: 'text-red-600' }
}

// ── Subject grouped select ───────────────────────────────────────────────────
function SubjectSelect({ value, onChange, className = '' }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={className} aria-label="Filter by subject">
      <option value="All">Subject: All</option>
      {STREAMS.map((s) => (
        <optgroup key={s.label} label={s.label}>
          {s.subjects.map((sub) => <option key={sub} value={sub}>{sub}</option>)}
        </optgroup>
      ))}
    </select>
  )
}

// ── Generate quiz modal ───────────────────────────────────────────────────────
function GenerateQuizModal({ open, onClose, onGenerate }) {
  const [topic, setTopic]                 = useState('')
  const [subject, setSubject]             = useState('')
  const [questionCount, setQuestionCount] = useState(10)
  const [difficulty, setDifficulty]       = useState('Medium')

  if (!open) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!subject) return
    onGenerate({ topic: topic.trim(), subject, questionCount, difficulty })
    setTopic(''); setSubject(''); setQuestionCount(10); setDifficulty('Medium')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" aria-label="Close modal" className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl border border-indigo-50 bg-white p-6 shadow-xl dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Generate A/L Model Paper</h2>
          </div>
          <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-lavender hover:text-gray-600 dark:hover:bg-gray-800">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="gen-subject" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Subject <span className="text-red-400">*</span>
            </label>
            <select id="gen-subject" value={subject} required onChange={(e) => setSubject(e.target.value)}
              className="w-full rounded-2xl border border-gray-200 bg-lavender-light px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100">
              <option value="">— Select subject —</option>
              {STREAMS.map((s) => (
                <optgroup key={s.label} label={s.label}>
                  {s.subjects.map((sub) => <option key={sub} value={sub}>{sub}</option>)}
                </optgroup>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="quiz-topic" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Topic <span className="text-gray-400">(optional)</span>
            </label>
            <input id="quiz-topic" type="text" value={topic} onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Organic Reactions, Integration…"
              className="w-full rounded-2xl border border-gray-200 bg-lavender-light px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="question-count" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Questions</label>
              <select id="question-count" value={questionCount} onChange={(e) => setQuestionCount(Number(e.target.value))}
                className="w-full rounded-2xl border border-gray-200 bg-lavender-light px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100">
                {[5, 10, 15, 20, 25, 30].map((n) => <option key={n} value={n}>{n} questions</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="gen-difficulty" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Difficulty</label>
              <select id="gen-difficulty" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-lavender-light px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100">
                <option>Easy</option><option>Medium</option><option>Hard</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-2xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-lavender dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800">Cancel</button>
            <button type="submit" className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-primary py-2.5 text-sm font-semibold text-white transition hover:bg-primary-hover">
              <Sparkles className="h-4 w-4" />Generate
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Loading screen ────────────────────────────────────────────────────────────
function QuizLoading({ quiz }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
      <div className="text-center">
        <p className="text-lg font-semibold text-gray-900 dark:text-white">Generating your A/L model paper…</p>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Preparing {quiz.questions} {quiz.subject} questions at {quiz.difficulty} level
        </p>
      </div>
    </div>
  )
}

// ── Quiz taker ────────────────────────────────────────────────────────────────
function QuizTaker({ paper, quizMeta, onFinish, onBack, user }) {
  const [current, setCurrent]     = useState(0)
  const [selected, setSelected]   = useState({})
  const [revealed, setRevealed]   = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving]       = useState(false)
  const [timeLeft, setTimeLeft]   = useState(() => paper.questions.length * 120)

  useEffect(() => {
    if (submitted) return
    if (timeLeft <= 0) { setSubmitted(true); return }
    const id = setInterval(() => setTimeLeft((t) => t - 1), 1000)
    return () => clearInterval(id)
  }, [submitted, timeLeft])

  const q      = paper.questions[current]
  const totalQ = paper.questions.length
  const answered = Object.keys(selected).length

  const score = useMemo(() => {
    if (!submitted) return null
    const correct = paper.questions.filter((q) => selected[q.no] === q.answer).length
    return { correct, total: totalQ, pct: Math.round((correct / totalQ) * 100) }
  }, [submitted, paper, selected, totalQ])

  // Save result to Supabase when submitted
  useEffect(() => {
    if (!submitted || !score || !user) return
    setSaving(true)
    supabase.from('quiz_results').insert({
      user_id:    user.id,
      quiz_key:   quizKey(quizMeta),
      title:      quizMeta.title,
      subject:    quizMeta.subject,
      difficulty: quizMeta.difficulty,
      score_pct:  score.pct,
      correct:    score.correct,
      total:      score.total,
    }).then(() => setSaving(false))
  }, [submitted, score, user, quizMeta])

  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
  const timerColor = timeLeft < 60 ? 'text-red-500' : timeLeft < 300 ? 'text-amber-500' : 'text-gray-600 dark:text-gray-300'

  // ── Results screen ──────────────────────────────────────────────────────────
  if (submitted && score) {
    const grade = gradeFromPct(score.pct)
    return (
      <div className="ep-page">
        <div className="mx-auto max-w-2xl">
          <button onClick={onBack} className="mb-6 flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
            <ChevronLeft className="h-4 w-4" /> Back to Quizzes
          </button>

          <div className="ep-card mb-6 p-8 text-center">
            <div className="mb-2 text-sm font-medium text-gray-500 dark:text-gray-400">Your Result</div>
            <div className={`mb-1 text-7xl font-bold ${grade.color}`}>{grade.label}</div>
            <div className="mb-4 text-3xl font-semibold text-gray-900 dark:text-white">{score.pct}%</div>
            <div className="mb-2 text-sm text-gray-500 dark:text-gray-400">{score.correct} / {score.total} correct</div>
            {saving && <p className="mb-4 text-xs text-gray-400 flex items-center justify-center gap-1"><Loader2 className="h-3 w-3 animate-spin" />Saving result…</p>}
            {!saving && <p className="mb-6 text-xs text-emerald-600 dark:text-emerald-400">✓ Result saved to your profile</p>}
            <div className="flex justify-center gap-3">
              <button onClick={() => { setSelected({}); setCurrent(0); setRevealed(false); setSubmitted(false); setTimeLeft(paper.questions.length * 120) }}
                className="flex items-center gap-2 rounded-2xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-lavender dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">
                <RotateCcw className="h-4 w-4" /> Retry
              </button>
              <button onClick={() => onFinish(score.pct + '%')} className="ep-btn-primary px-5">
                <BookOpen className="h-4 w-4" /> Done
              </button>
            </div>
          </div>

          <h3 className="mb-4 font-semibold text-gray-900 dark:text-white">Answer Review</h3>
          <div className="space-y-4">
            {paper.questions.map((q) => {
              const ans     = selected[q.no]
              const correct = ans === q.answer
              return (
                <div key={q.no} className={`ep-card p-5 border-l-4 ${correct ? 'border-l-emerald-500' : 'border-l-red-400'}`}>
                  <div className="mb-2 flex items-start gap-3">
                    {correct ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" /> : <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />}
                    <span className="text-sm font-medium text-gray-900 dark:text-white"><span className="mr-2 text-gray-400">Q{q.no}.</span>{q.question}</span>
                  </div>
                  <div className="ml-8 space-y-1 text-sm">
                    {Object.entries(q.options).map(([k, v]) => (
                      <div key={k} className={`flex items-center gap-2 rounded-lg px-3 py-1.5 ${
                        k === q.answer ? 'bg-emerald-50 text-emerald-700 font-semibold dark:bg-emerald-900/30 dark:text-emerald-400'
                        : k === ans && ans !== q.answer ? 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                        : 'text-gray-500 dark:text-gray-400'}`}>
                        <span className="w-5 shrink-0 font-bold">{k}.</span> {v}
                        {k === q.answer && <CheckCircle2 className="ml-auto h-4 w-4 text-emerald-500" />}
                      </div>
                    ))}
                    {q.explanation && (
                      <p className="mt-2 rounded-lg bg-indigo-50 px-3 py-2 text-xs text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                        <span className="font-semibold">Explanation: </span>{q.explanation}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  // ── Active quiz ──────────────────────────────────────────────────────────────
  return (
    <div className="ep-page">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <button onClick={onBack} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
            <ChevronLeft className="h-4 w-4" /> Exit
          </button>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500 dark:text-gray-400">{answered}/{totalQ} answered</span>
            <span className={`flex items-center gap-1.5 text-sm font-semibold tabular-nums ${timerColor}`}>
              <Clock className="h-4 w-4" />{formatTime(timeLeft)}
            </span>
          </div>
        </div>

        <div className="ep-card mb-6 p-5">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${getSubjectColor(paper.subject)}`}>{paper.subject}</span>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${difficultyColors[quizMeta.difficulty] ?? difficultyColors.Medium}`}>{quizMeta.difficulty}</span>
          </div>
          <h1 className="font-semibold text-gray-900 dark:text-white">{paper.title}</h1>
          <p className="mt-1 text-xs text-gray-400">{paper.instructions}</p>
        </div>

        <div className="mb-6 h-1.5 w-full rounded-full bg-gray-100 dark:bg-gray-800">
          <div className="h-1.5 rounded-full bg-primary transition-all duration-300" style={{ width: `${((current + 1) / totalQ) * 100}%` }} />
        </div>

        <div className="ep-card mb-4 p-6">
          <div className="mb-4 flex items-start gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">{q.no}</span>
            <p className="text-sm font-medium leading-relaxed text-gray-900 dark:text-white">{q.question}</p>
          </div>

          <div className="space-y-2.5">
            {Object.entries(q.options).map(([k, v]) => {
              const isSelected = selected[q.no] === k
              const isCorrect  = revealed && k === q.answer
              const isWrong    = revealed && isSelected && k !== q.answer
              return (
                <button key={k} type="button" disabled={revealed}
                  onClick={() => setSelected((prev) => ({ ...prev, [q.no]: k }))}
                  className={`flex w-full items-center gap-3 rounded-xl border-2 px-4 py-3 text-left text-sm transition
                    ${isCorrect ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                    : isWrong   ? 'border-red-400 bg-red-50 dark:bg-red-900/20'
                    : isSelected ? 'border-primary bg-primary/5 dark:bg-primary/10'
                    : 'border-gray-200 hover:border-primary/50 hover:bg-lavender dark:border-gray-700 dark:hover:bg-gray-800'}`}>
                  <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-bold
                    ${isCorrect ? 'bg-emerald-500 text-white' : isWrong ? 'bg-red-400 text-white' : isSelected ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}`}>{k}</span>
                  <span className={`${isCorrect ? 'text-emerald-700 dark:text-emerald-300 font-semibold' : isWrong ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'}`}>{v}</span>
                  {isCorrect && <CheckCircle2 className="ml-auto h-5 w-5 text-emerald-500" />}
                  {isWrong   && <XCircle      className="ml-auto h-5 w-5 text-red-400" />}
                </button>
              )
            })}
          </div>

          {revealed && q.explanation && (
            <div className="mt-4 rounded-xl bg-indigo-50 px-4 py-3 text-sm text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
              <span className="font-semibold">Explanation: </span>{q.explanation}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button disabled={current === 0} onClick={() => { setCurrent((c) => c - 1); setRevealed(false) }}
            className="flex-1 rounded-2xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-lavender disabled:opacity-40 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800">
            ← Previous
          </button>
          {selected[q.no] && !revealed && (
            <button onClick={() => setRevealed(true)}
              className="flex items-center gap-2 rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm font-semibold text-indigo-600 transition hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400">
              <AlertCircle className="h-4 w-4" /> Check
            </button>
          )}
          {current < totalQ - 1 ? (
            <button onClick={() => { setCurrent((c) => c + 1); setRevealed(false) }}
              className="flex-1 rounded-2xl bg-primary py-2.5 text-sm font-semibold text-white transition hover:bg-primary-hover">
              Next →
            </button>
          ) : (
            <button onClick={() => setSubmitted(true)}
              className="flex-1 rounded-2xl bg-emerald-600 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700">
              Submit Paper
            </button>
          )}
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-1.5">
          {paper.questions.map((qq, i) => (
            <button key={qq.no} onClick={() => { setCurrent(i); setRevealed(false) }} title={`Question ${qq.no}`}
              className={`h-7 w-7 rounded-lg text-xs font-semibold transition
                ${i === current ? 'bg-primary text-white'
                : selected[qq.no] ? 'bg-primary/20 text-primary dark:bg-primary/30'
                : 'bg-gray-100 text-gray-400 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700'}`}>
              {qq.no}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
const difficulties = ['All', 'Easy', 'Medium', 'Hard']

export default function Quizzes() {
  const toast                                   = useToast()
  const { user }                                = useAuth()
  const [subjectFilter, setSubjectFilter]       = useState('All')
  const [streamFilter, setStreamFilter]         = useState('All')
  const [difficultyFilter, setDifficultyFilter] = useState('All')
  const [modalOpen, setModalOpen]               = useState(false)
  const [generatedCards, setGeneratedCards]     = useState([])

  // Real scores from Supabase — map of quiz_key → best score
  const [scoreMap, setScoreMap]   = useState({})   // { [quizKey]: { pct, taken_at } }
  const [scoresLoaded, setScoresLoaded] = useState(false)
  const channelRef = useRef(null)

  // Quiz taking state
  const [activeQuiz, setActiveQuiz]   = useState(null)
  const [loadingQuiz, setLoadingQuiz] = useState(false)
  const [paper, setPaper]             = useState(null)

  // Fetch user's best scores
  useEffect(() => {
    if (!user) { setScoresLoaded(true); return }
    supabase
      .from('quiz_results')
      .select('quiz_key, score_pct, taken_at')
      .eq('user_id', user.id)
      .order('taken_at', { ascending: false })
      .then(({ data }) => {
        if (data) {
          // keep best score per quiz_key
          const map = {}
          data.forEach((r) => {
            if (!map[r.quiz_key] || r.score_pct > map[r.quiz_key].pct) {
              map[r.quiz_key] = { pct: r.score_pct, taken_at: r.taken_at }
            }
          })
          setScoreMap(map)
        }
        setScoresLoaded(true)
      })
  }, [user])

  // Real-time: update scoreMap when a new result is inserted
  useEffect(() => {
    if (!user) return
    const ch = supabase
      .channel(`quiz-results-${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'quiz_results',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        const r = payload.new
        setScoreMap((prev) => {
          const existing = prev[r.quiz_key]
          if (existing && existing.pct >= r.score_pct) return prev
          return { ...prev, [r.quiz_key]: { pct: r.score_pct, taken_at: r.taken_at } }
        })
      })
      .subscribe()

    channelRef.current = ch
    return () => { supabase.removeChannel(ch) }
  }, [user])

  // Merge static quizzes with real scores
  const allQuizzes = useMemo(() => {
    return [
      ...generatedCards,
      ...BASE_QUIZZES.map((q) => {
        const key   = quizKey(q)
        const saved = scoreMap[key]
        return { ...q, lastScore: saved ? `${saved.pct}%` : null }
      }),
    ]
  }, [generatedCards, scoreMap])

  const filteredQuizzes = useMemo(() => {
    return allQuizzes.filter((quiz) => {
      const matchSubject    = subjectFilter === 'All' || quiz.subject === subjectFilter
      const matchStream     = streamFilter === 'All' || STREAMS.find((s) => s.label === streamFilter)?.subjects.includes(quiz.subject)
      const matchDifficulty = difficultyFilter === 'All' || quiz.difficulty === difficultyFilter
      return matchSubject && matchStream && matchDifficulty
    })
  }, [allQuizzes, subjectFilter, streamFilter, difficultyFilter])

  const handleGenerate = ({ topic, subject, questionCount, difficulty }) => {
    const estimatedMin = Math.round(questionCount * 1.5)
    setGeneratedCards((prev) => [{
      id: `gen-${Date.now()}`,
      title: topic || `${subject} — Model Paper`,
      subject, questions: questionCount,
      duration: `${estimatedMin} min`,
      difficulty, isNew: true, topic,
    }, ...prev])
    toast.success(`Quiz added: ${topic || subject}`)
  }

  const handleStartQuiz = useCallback(async (quiz) => {
    setActiveQuiz(quiz)
    setLoadingQuiz(true)
    setPaper(null)
    try {
      const result = await generateQuizPaper({
        subject: quiz.subject, topic: quiz.title,
        questionCount: quiz.questions, difficulty: quiz.difficulty,
      })
      setPaper(result)
    } catch (err) {
      toast.error(err.message || 'Failed to generate quiz paper')
      setActiveQuiz(null)
    } finally {
      setLoadingQuiz(false)
    }
  }, [toast])

  const handleFinish = useCallback(() => {
    setPaper(null)
    setActiveQuiz(null)
  }, [])

  const handleBack = useCallback(() => {
    setPaper(null)
    setActiveQuiz(null)
    setLoadingQuiz(false)
  }, [])

  if (loadingQuiz && activeQuiz) return <QuizLoading quiz={activeQuiz} />
  if (paper && activeQuiz) return (
    <QuizTaker paper={paper} quizMeta={activeQuiz} onFinish={handleFinish} onBack={handleBack} user={user} />
  )

  return (
    <div className="ep-page">
      <PageHeader
        title="Quizzes"
        subtitle="Test your knowledge across all A/L subjects with AI-generated model papers."
        action={
          <button type="button" onClick={() => setModalOpen(true)} className="ep-btn-primary">
            <Sparkles className="h-4 w-4" />Generate Model Paper
          </button>
        }
      />

      {/* Filters */}
      <div className="ep-card flex flex-wrap items-center gap-3 p-4">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400">
          <Filter className="h-4 w-4" />Filter by
        </div>
        <select value={streamFilter} onChange={(e) => { setStreamFilter(e.target.value); setSubjectFilter('All') }}
          className="ep-input w-auto py-2" aria-label="Filter by stream">
          <option value="All">Stream: All</option>
          {STREAMS.map((s) => <option key={s.label} value={s.label}>{s.label}</option>)}
        </select>
        <SubjectSelect value={subjectFilter} onChange={(v) => { setSubjectFilter(v); setStreamFilter('All') }} className="ep-input w-auto py-2" />
        <select value={difficultyFilter} onChange={(e) => setDifficultyFilter(e.target.value)}
          className="ep-input w-auto py-2" aria-label="Filter by difficulty">
          {difficulties.map((d) => <option key={d} value={d}>Difficulty: {d}</option>)}
        </select>
        <span className="ml-auto text-sm text-gray-500 dark:text-gray-400">
          {filteredQuizzes.length} quiz{filteredQuizzes.length !== 1 ? 'zes' : ''}
        </span>
      </div>

      {filteredQuizzes.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No quizzes found"
          description="Try adjusting your filters, or generate a new model paper with AI."
          action={
            <button type="button" onClick={() => setModalOpen(true)} className="ep-btn-primary">
              <Sparkles className="h-4 w-4" />Generate Model Paper
            </button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredQuizzes.map((quiz) => {
            const key   = quizKey(quiz)
            const saved = scoreMap[key]
            const grade = saved ? gradeFromPct(saved.pct) : null

            return (
              <div key={quiz.id} className="ep-card p-6 transition-transform duration-200 hover:-translate-y-0.5">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${getSubjectColor(quiz.subject)}`}>{quiz.subject}</span>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${difficultyColors[quiz.difficulty] ?? difficultyColors.Medium}`}>{quiz.difficulty}</span>
                  {quiz.isNew && <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">New</span>}
                  {grade && <span className={`rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-bold dark:bg-gray-800 ${grade.color}`}>{grade.label}</span>}
                </div>

                <h2 className="mb-4 font-semibold text-gray-900 dark:text-white">{quiz.title}</h2>

                <div className="mb-5 space-y-2 text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-2"><HelpCircle className="h-4 w-4 shrink-0" />{quiz.questions} questions</div>
                  <div className="flex items-center gap-2"><Clock className="h-4 w-4 shrink-0" />{quiz.duration} estimated</div>
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 shrink-0" />
                    {!scoresLoaded ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : quiz.lastScore ? (
                      <span>Last score: <span className="font-semibold text-emerald-600 dark:text-emerald-400">{quiz.lastScore}</span></span>
                    ) : (
                      <span className="italic">Not attempted yet</span>
                    )}
                  </div>
                  {saved && (
                    <div className="flex items-center gap-2">
                      <History className="h-4 w-4 shrink-0" />
                      <span className="text-xs">{new Date(saved.taken_at).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                <button type="button" onClick={() => handleStartQuiz(quiz)} className="ep-btn-primary w-full">
                  <Play className="h-4 w-4" />{quiz.lastScore ? 'Retake Quiz' : 'Start Quiz'}
                </button>
              </div>
            )
          })}
        </div>
      )}

      <GenerateQuizModal open={modalOpen} onClose={() => setModalOpen(false)} onGenerate={handleGenerate} />
    </div>
  )
}
