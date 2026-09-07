import { useState, useEffect, useCallback, useRef } from 'react'
import {
  BookMarked, ClipboardList, FileText, MessageSquare,
  Trophy, Loader2, Trash2, ChevronRight, CheckCircle2,
  XCircle, Clock, BookOpen, Wifi,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import PageHeader from '../components/ui/PageHeader.jsx'
import { useToast } from '../components/ui/Toast.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { supabase } from '../lib/supabase.js'

// ── Helpers ───────────────────────────────────────────────────────────────────
function timeAgo(dateStr) {
  if (!dateStr) return '—'
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000)
  if (diff < 60)    return 'Just now'
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
  return new Date(dateStr).toLocaleDateString()
}

function ScoreBadge({ pct }) {
  const color = pct >= 75 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
              : pct >= 50 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${color}`}>
      {pct >= 75 ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
      {pct}%
    </span>
  )
}

const TABS = [
  { id: 'quizzes', label: 'Quiz Results',   icon: ClipboardList },
  { id: 'pdfs',    label: 'PDF Analyses',   icon: FileText },
  { id: 'chats',   label: 'AI Tutor Chats', icon: MessageSquare },
]

// ── Quiz Results Tab ──────────────────────────────────────────────────────────
function QuizResults({ user }) {
  const toast = useToast()
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('quiz_results')
      .select('*')
      .eq('user_id', user.id)
      .order('taken_at', { ascending: false })
      .limit(50)
    setResults(data || [])
    setLoading(false)
  }, [user])

  useEffect(() => { load() }, [load])

  // Real-time: new quiz results appear instantly
  useEffect(() => {
    if (!user) return
    const ch = supabase
      .channel(`library-quiz-${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'quiz_results',
        filter: `user_id=eq.${user.id}`,
      }, (p) => setResults((prev) => [p.new, ...prev]))
      .on('postgres_changes', {
        event: 'DELETE', schema: 'public', table: 'quiz_results',
        filter: `user_id=eq.${user.id}`,
      }, (p) => setResults((prev) => prev.filter((r) => r.id !== p.old.id)))
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [user])

  const handleDelete = async (id) => {
    setResults((prev) => prev.filter((r) => r.id !== id))
    await supabase.from('quiz_results').delete().eq('id', id)
    toast.success('Result removed')
  }

  if (loading) return <LoadingRows />

  if (results.length === 0) return (
    <EmptySection icon={Trophy} message="No quiz results yet" sub="Complete a quiz to see your results here" />
  )

  return (
    <div className="space-y-3">
      {results.map((r) => (
        <div key={r.id} className="group ep-card flex items-center gap-4 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/30">
            <Trophy className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-gray-900 dark:text-white">{r.title}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {r.subject} · {r.difficulty} · {r.correct}/{r.total} correct · {timeAgo(r.taken_at)}
            </p>
          </div>
          <ScoreBadge pct={r.score_pct} />
          <button
            type="button"
            onClick={() => handleDelete(r.id)}
            className="hidden shrink-0 rounded-lg p-1.5 text-gray-300 transition hover:bg-red-50 hover:text-red-500 group-hover:flex dark:hover:bg-red-900/20"
            aria-label="Remove"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  )
}

// ── PDF Analyses Tab ──────────────────────────────────────────────────────────
function PdfAnalyses({ user }) {
  const toast = useToast()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('pdf_analyses')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)
    setItems(data || [])
    setLoading(false)
  }, [user])

  useEffect(() => { load() }, [load])

  // Real-time
  useEffect(() => {
    if (!user) return
    const ch = supabase
      .channel(`library-pdf-${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'pdf_analyses',
        filter: `user_id=eq.${user.id}`,
      }, (p) => setItems((prev) => [p.new, ...prev]))
      .on('postgres_changes', {
        event: 'DELETE', schema: 'public', table: 'pdf_analyses',
        filter: `user_id=eq.${user.id}`,
      }, (p) => setItems((prev) => prev.filter((r) => r.id !== p.old.id)))
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [user])

  const handleDelete = async (id) => {
    setItems((prev) => prev.filter((r) => r.id !== id))
    await supabase.from('pdf_analyses').delete().eq('id', id)
    toast.success('Analysis removed')
  }

  if (loading) return <LoadingRows />

  if (items.length === 0) return (
    <EmptySection icon={FileText} message="No PDF analyses yet"
      sub="Upload a document in PDF Analysis to see it here"
      action={{ label: 'Go to PDF Analysis', to: '/pdf-analysis' }} />
  )

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const concepts = Array.isArray(item.key_concepts) ? item.key_concepts : []
        const flashcards = Array.isArray(item.flashcards) ? item.flashcards : []
        return (
          <div key={item.id} className="group ep-card p-4">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-900/30">
                <FileText className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-gray-900 dark:text-white">{item.file_name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {concepts.length} key concepts · {flashcards.length} flashcards · {timeAgo(item.created_at)}
                </p>
                {item.summary && (
                  <p className="mt-1.5 line-clamp-2 text-xs text-gray-600 dark:text-gray-400">{item.summary}</p>
                )}
                {concepts.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {concepts.slice(0, 5).map((c, i) => (
                      <span key={i} className="rounded-full bg-lavender px-2 py-0.5 text-[10px] font-medium text-primary dark:bg-gray-800">
                        {c}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => handleDelete(item.id)}
                className="hidden shrink-0 rounded-lg p-1.5 text-gray-300 transition hover:bg-red-50 hover:text-red-500 group-hover:flex dark:hover:bg-red-900/20"
                aria-label="Remove"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── AI Tutor Chats Tab ────────────────────────────────────────────────────────
function TutorChats({ user }) {
  const toast = useToast()
  const [chats, setChats] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('tutor_chats')
      .select('*, tutor_messages(count)')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(50)
    setChats(data || [])
    setLoading(false)
  }, [user])

  useEffect(() => { load() }, [load])

  // Real-time
  useEffect(() => {
    if (!user) return
    const ch = supabase
      .channel(`library-chats-${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'tutor_chats',
        filter: `user_id=eq.${user.id}`,
      }, () => load())
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'tutor_chats',
        filter: `user_id=eq.${user.id}`,
      }, (p) => setChats((prev) => prev.map((c) => c.id === p.new.id ? { ...c, ...p.new } : c)))
      .on('postgres_changes', {
        event: 'DELETE', schema: 'public', table: 'tutor_chats',
        filter: `user_id=eq.${user.id}`,
      }, (p) => setChats((prev) => prev.filter((c) => c.id !== p.old.id)))
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [user, load])

  const handleDelete = async (id) => {
    setChats((prev) => prev.filter((c) => c.id !== id))
    await supabase.from('tutor_chats').delete().eq('id', id)
    toast.success('Chat deleted')
  }

  if (loading) return <LoadingRows />

  if (chats.length === 0) return (
    <EmptySection icon={MessageSquare} message="No AI tutor chats yet"
      sub="Start a conversation with your AI tutor"
      action={{ label: 'Open AI Tutor', to: '/ai-tutor' }} />
  )

  return (
    <div className="space-y-3">
      {chats.map((chat) => {
        const msgCount = chat.tutor_messages?.[0]?.count ?? 0
        return (
          <div key={chat.id} className="group ep-card flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900/30">
              <MessageSquare className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-gray-900 dark:text-white">{chat.title}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {chat.subject ? `${chat.subject} · ` : ''}{msgCount} messages · {timeAgo(chat.updated_at)}
              </p>
            </div>
            <Link
              to="/ai-tutor"
              className="hidden shrink-0 rounded-lg p-1.5 text-gray-400 transition hover:bg-lavender hover:text-primary group-hover:flex dark:hover:bg-gray-800"
            >
              <ChevronRight className="h-4 w-4" />
            </Link>
            <button
              type="button"
              onClick={() => handleDelete(chat.id)}
              className="hidden shrink-0 rounded-lg p-1.5 text-gray-300 transition hover:bg-red-50 hover:text-red-500 group-hover:flex dark:hover:bg-red-900/20"
              aria-label="Delete chat"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )
      })}
    </div>
  )
}

// ── Shared helpers ────────────────────────────────────────────────────────────
function LoadingRows() {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-16 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" />
      ))}
    </div>
  )
}

function EmptySection({ icon: Icon, message, sub, action }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-lavender dark:bg-gray-800">
        <Icon className="h-7 w-7 text-gray-300 dark:text-gray-600" />
      </div>
      <p className="font-medium text-gray-500 dark:text-gray-400">{message}</p>
      <p className="text-sm text-gray-400">{sub}</p>
      {action && (
        <Link to={action.to} className="ep-btn-primary mt-2 px-5 py-2 text-sm">
          {action.label}
        </Link>
      )}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Library() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('quizzes')
  const [realtime, setRealtime] = useState(false)
  const channelRef = useRef(null)

  // Track overall realtime connection
  useEffect(() => {
    if (!user) return
    const ch = supabase
      .channel('library-ping')
      .subscribe((status) => setRealtime(status === 'SUBSCRIBED'))
    channelRef.current = ch
    return () => supabase.removeChannel(ch)
  }, [user])

  return (
    <div className="ep-page mx-auto max-w-3xl">
      <PageHeader
        title="My Library"
        subtitle="All your quiz results, analysed documents, and AI conversations in one place."
        action={
          <div className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${
            realtime
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
              : 'bg-gray-100 text-gray-500 dark:bg-gray-800'
          }`}>
            <Wifi className="h-3 w-3" />
            {realtime ? 'Live' : 'Connecting…'}
          </div>
        }
      />

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-2xl bg-lavender-light p-1 dark:bg-gray-800/50">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium transition-all ${
              activeTab === id
                ? 'bg-white text-primary shadow-sm dark:bg-gray-900'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            <Icon className="h-4 w-4" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'quizzes' && <QuizResults user={user} />}
      {activeTab === 'pdfs'    && <PdfAnalyses user={user} />}
      {activeTab === 'chats'   && <TutorChats  user={user} />}
    </div>
  )
}
