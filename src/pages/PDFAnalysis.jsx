import { useCallback, useRef, useState, useEffect } from 'react'
import {
  Upload, FileText, BookOpen, Layers, Lightbulb,
  ChevronDown, Loader2, CheckCircle2, Clock, Trash2,
  History, X, RotateCcw,
} from 'lucide-react'
import { analyzeDocumentText } from '../lib/api.js'
import { extractTextFromFile } from '../lib/extractText.js'
import { useToast } from '../components/ui/Toast.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { supabase } from '../lib/supabase.js'
import LoadingSpinner from '../components/ui/LoadingSpinner.jsx'

// ── Constants ─────────────────────────────────────────────────────────────────
const ACCEPTED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
]
const ACCEPTED_EXTENSIONS = ['.pdf', '.docx', '.txt']
const MAX_SIZE_MB = 50

// ── Helpers ───────────────────────────────────────────────────────────────────
function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000)
  if (diff < 60)    return 'Just now'
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return new Date(dateStr).toLocaleDateString()
}

function formatSize(bytes) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function fileIcon(name) {
  const ext = name?.split('.').pop()?.toLowerCase()
  return ext === 'pdf' ? '📄' : ext === 'docx' ? '📝' : '📃'
}

// ── Expandable section ────────────────────────────────────────────────────────
function ExpandableSection({ title, icon: Icon, iconColor, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="overflow-hidden rounded-2xl border border-indigo-50 bg-white shadow-sm shadow-indigo-100/50 dark:border-gray-800 dark:bg-gray-900 dark:shadow-none">
      <button type="button" onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-lavender-light/50 dark:hover:bg-gray-800/50">
        <div className="flex items-center gap-3">
          <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${iconColor}`}>
            <Icon className="h-4 w-4" />
          </div>
          <span className="font-semibold text-gray-900 dark:text-white">{title}</span>
        </div>
        <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="border-t border-indigo-50 px-5 py-4 dark:border-gray-800">
          {children}
        </div>
      )}
    </div>
  )
}

// ── Flipcard ──────────────────────────────────────────────────────────────────
function FlipCard({ front, back }) {
  const [flipped, setFlipped] = useState(false)
  return (
    <button type="button" onClick={() => setFlipped((f) => !f)}
      className="relative h-32 w-full [perspective:1000px]" aria-label="Flip card">
      <div className={`relative h-full w-full transition-transform duration-500 [transform-style:preserve-3d] ${flipped ? '[transform:rotateY(180deg)]' : ''}`}>
        <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl border border-indigo-100 bg-lavender-light p-4 [backface-visibility:hidden] dark:border-gray-700 dark:bg-gray-800/50">
          <p className="text-center text-sm font-medium text-gray-900 dark:text-white">{front}</p>
          <span className="mt-2 text-xs text-gray-400">Tap to flip</span>
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl border border-primary/30 bg-primary/5 p-4 [backface-visibility:hidden] [transform:rotateY(180deg)] dark:bg-primary/10">
          <p className="text-center text-sm text-primary">{back}</p>
          <span className="mt-2 flex items-center gap-1 text-xs text-gray-400">
            <RotateCcw className="h-3 w-3" />Flip back
          </span>
        </div>
      </div>
    </button>
  )
}

// ── Analysis results ──────────────────────────────────────────────────────────
function AnalysisResults({ results, fileName, onReset }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-2xl border border-emerald-100 bg-emerald-50/50 px-5 py-3 dark:border-emerald-900/30 dark:bg-emerald-950/20">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Analysis complete</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{fileName} · Saved to history</p>
          </div>
        </div>
        <button type="button" onClick={onReset}
          className="text-sm font-medium text-primary transition hover:text-primary-hover">
          Upload another
        </button>
      </div>

      <ExpandableSection title="Deep Summary" icon={BookOpen}
        iconColor="bg-indigo-100 text-primary dark:bg-indigo-900/40" defaultOpen>
        <p className="whitespace-pre-line text-sm leading-relaxed text-gray-700 dark:text-gray-300">
          {results.summary}
        </p>
      </ExpandableSection>

      <ExpandableSection title="Flashcards" icon={Layers}
        iconColor="bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-400">
        <div className="grid gap-3 sm:grid-cols-2">
          {results.flashcards.map((card, i) => (
            <FlipCard key={i} front={card.front} back={card.back} />
          ))}
        </div>
      </ExpandableSection>

      <ExpandableSection title="Key Concepts" icon={Lightbulb}
        iconColor="bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400">
        <ul className="space-y-2">
          {results.keyConcepts.map((concept, i) => (
            <li key={i} className="flex gap-2 text-sm text-gray-700 dark:text-gray-300">
              <FileText className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              {concept}
            </li>
          ))}
        </ul>
      </ExpandableSection>
    </div>
  )
}

// ── History sidebar ────────────────────────────────────────────────────────────
function HistorySidebar({ history, loading, onLoad, onDelete, activeId }) {
  if (loading) return (
    <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-gray-400" /></div>
  )
  if (history.length === 0) return (
    <div className="flex flex-col items-center py-8 text-center">
      <History className="mb-2 h-8 w-8 text-gray-300 dark:text-gray-700" />
      <p className="text-xs text-gray-400">No past analyses yet</p>
    </div>
  )
  return (
    <ul className="space-y-2">
      {history.map((item) => (
        <li key={item.id}>
          <div className={`group flex items-center gap-2.5 rounded-xl p-2.5 transition cursor-pointer
            ${activeId === item.id ? 'bg-primary/10 ring-1 ring-primary/20' : 'hover:bg-lavender-light dark:hover:bg-gray-800/50'}`}
            onClick={() => onLoad(item)} role="button" tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onLoad(item)}>
            <span className="text-xl">{fileIcon(item.file_name)}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-gray-800 dark:text-gray-200">{item.file_name}</p>
              <div className="flex items-center gap-1 text-[10px] text-gray-400">
                <Clock className="h-3 w-3" />{timeAgo(item.created_at)}
                {item.file_size > 0 && <span>· {formatSize(item.file_size)}</span>}
              </div>
            </div>
            <button type="button"
              onClick={(e) => { e.stopPropagation(); onDelete(item.id) }}
              className="hidden shrink-0 rounded-lg p-1 text-gray-300 hover:text-red-400 group-hover:block dark:text-gray-600"
              aria-label="Delete">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </li>
      ))}
    </ul>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
const features = [
  { title: 'Deep Summary',  description: 'Contextual understanding with chapter-level insights.', icon: BookOpen,   color: 'bg-indigo-100 text-primary dark:bg-indigo-900/40' },
  { title: 'Flashcards',    description: 'Spaced repetition cards generated from key passages.',  icon: Layers,     color: 'bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-400' },
  { title: 'Key Concepts',  description: 'Bullet-point extraction of the most important ideas.',  icon: Lightbulb,  color: 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400' },
]

export default function PDFAnalysis() {
  const toast = useToast()
  const { user } = useAuth()
  const fileInputRef = useRef(null)

  const [dragOver, setDragOver]     = useState(false)
  const [status, setStatus]         = useState('idle')   // idle | processing | complete
  const [selectedFile, setSelectedFile] = useState(null)
  const [results, setResults]       = useState(null)
  const [activeId, setActiveId]     = useState(null)
  const [error, setError]           = useState(null)
  const [history, setHistory]       = useState([])
  const [histLoading, setHistLoading] = useState(true)
  const [showHistory, setShowHistory] = useState(false)
  const channelRef = useRef(null)

  // ── Load history ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return
    setHistLoading(true)
    supabase
      .from('pdf_analyses')
      .select('id, file_name, file_size, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(30)
      .then(({ data }) => { setHistory(data || []); setHistLoading(false) })
  }, [user])

  // ── Real-time: new analyses ─────────────────────────────────────────────
  useEffect(() => {
    if (!user) return
    const ch = supabase
      .channel(`pdf-analyses-${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'pdf_analyses',
        filter: `user_id=eq.${user.id}`,
      }, (p) => {
        setHistory((prev) => {
          if (prev.find((h) => h.id === p.new.id)) return prev
          return [{ id: p.new.id, file_name: p.new.file_name, file_size: p.new.file_size, created_at: p.new.created_at }, ...prev]
        })
      })
      .on('postgres_changes', {
        event: 'DELETE', schema: 'public', table: 'pdf_analyses',
        filter: `user_id=eq.${user.id}`,
      }, (p) => {
        setHistory((prev) => prev.filter((h) => h.id !== p.old.id))
        if (activeId === p.old.id) resetUpload()
      })
      .subscribe()

    channelRef.current = ch
    return () => supabase.removeChannel(ch)
  }, [user, activeId])

  // ── Validate file ───────────────────────────────────────────────────────
  const validateFile = (file) => {
    const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase()
    if (!ACCEPTED_TYPES.includes(file.type) && !ACCEPTED_EXTENSIONS.includes(ext))
      return 'Please upload a PDF, DOCX, or TXT file.'
    if (file.size > MAX_SIZE_MB * 1024 * 1024)
      return `File must be under ${MAX_SIZE_MB}MB.`
    return null
  }

  // ── Process & save ──────────────────────────────────────────────────────
  const processFile = useCallback(async (file) => {
    const err = validateFile(file)
    if (err) { setError(err); return }

    setError(null); setResults(null); setActiveId(null)
    setSelectedFile(file); setStatus('processing')

    try {
      const text     = await extractTextFromFile(file)
      const analysis = await analyzeDocumentText(text, file.name)

      // Save to Supabase
      if (user) {
        const { data: saved } = await supabase
          .from('pdf_analyses')
          .insert({
            user_id:      user.id,
            file_name:    file.name,
            file_size:    file.size,
            summary:      analysis.summary,
            key_concepts: analysis.keyConcepts,
            flashcards:   analysis.flashcards,
          })
          .select('id')
          .single()

        if (saved) setActiveId(saved.id)
      }

      setResults(analysis)
      setStatus('complete')
      toast.success('Document analyzed and saved!')
    } catch (err) {
      const msg = err.message || 'Failed to analyze document. Please try again.'
      setError(msg); toast.error(msg)
      setStatus('idle'); setSelectedFile(null)
    }
  }, [user, toast])

  // ── Load from history ───────────────────────────────────────────────────
  const handleLoadHistory = useCallback(async (item) => {
    if (activeId === item.id) return
    setStatus('processing')
    const { data, error } = await supabase
      .from('pdf_analyses')
      .select('*')
      .eq('id', item.id)
      .single()

    if (error || !data) { toast.error('Could not load analysis'); setStatus('idle'); return }

    setResults({
      summary:      data.summary,
      keyConcepts:  Array.isArray(data.key_concepts) ? data.key_concepts : [],
      flashcards:   Array.isArray(data.flashcards)   ? data.flashcards   : [],
    })
    setSelectedFile({ name: data.file_name, size: data.file_size })
    setActiveId(item.id)
    setStatus('complete')
    setShowHistory(false)
  }, [activeId, toast])

  // ── Delete from history ─────────────────────────────────────────────────
  const handleDelete = useCallback(async (id) => {
    await supabase.from('pdf_analyses').delete().eq('id', id)
    toast.success('Deleted from history')
  }, [toast])

  const resetUpload = () => {
    setStatus('idle'); setSelectedFile(null)
    setResults(null); setError(null); setActiveId(null)
  }

  const handleFileChange = (e) => { const f = e.target.files?.[0]; if (f) processFile(f); e.target.value = '' }
  const handleDrop       = (e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) processFile(f) }

  return (
    <div className="ep-page">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">

        {/* ── Main column ── */}
        <div className="min-w-0 flex-1 space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
              Transform Content into Knowledge
            </h1>
            <p className="mx-auto mt-3 max-w-lg text-gray-500 dark:text-gray-400">
              Upload your documents and let AI generate deep summaries, flashcards,
              and key concept extractions.
            </p>
          </div>

          {/* Drop zone */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            className={`rounded-2xl border-2 border-dashed p-12 text-center transition ${
              dragOver ? 'border-primary bg-primary/5'
              : 'border-indigo-200 bg-white shadow-sm shadow-indigo-100/50 dark:border-gray-700 dark:bg-gray-900 dark:shadow-none'
            } ${status === 'processing' ? 'pointer-events-none opacity-70' : ''}`}>
            <input ref={fileInputRef} type="file"
              accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
              onChange={handleFileChange} className="hidden" />

            {status === 'processing' ? (
              <LoadingSpinner label="Extracting text and analyzing with AI…" />
            ) : (
              <>
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-lavender dark:bg-gray-800">
                  <Upload className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Click or drag &amp; drop files
                </h2>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Supports PDF, DOCX, and TXT (Max {MAX_SIZE_MB}MB)
                </p>
                <button type="button" onClick={() => fileInputRef.current?.click()} className="ep-btn-primary mt-6">
                  Select from Device
                </button>
              </>
            )}
          </div>

          {error && <p className="text-center text-sm text-red-500">{error}</p>}

          {/* Feature cards */}
          <div className="grid gap-4 sm:grid-cols-3">
            {features.map(({ title, description, icon: Icon, color }) => (
              <div key={title} className="ep-card p-5 shadow-sm">
                <div className={`mb-3 inline-flex rounded-xl p-2.5 ${color}`}><Icon className="h-5 w-5" /></div>
                <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>
              </div>
            ))}
          </div>

          {/* Results */}
          {status === 'complete' && selectedFile && results && (
            <AnalysisResults results={results} fileName={selectedFile.name} onReset={resetUpload} />
          )}
        </div>

        {/* ── History sidebar (desktop) ── */}
        <aside className="hidden w-72 shrink-0 lg:block">
          <div className="sticky top-20 ep-card overflow-hidden">
            <div className="flex items-center justify-between border-b border-indigo-50 px-4 py-3 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Analysis History</h3>
              </div>
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                {history.length}
              </span>
            </div>
            <div className="max-h-[520px] overflow-y-auto p-3">
              <HistorySidebar history={history} loading={histLoading}
                onLoad={handleLoadHistory} onDelete={handleDelete} activeId={activeId} />
            </div>
          </div>
        </aside>

        {/* ── History drawer (mobile) ── */}
        {showHistory && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end lg:hidden">
            <button type="button" className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowHistory(false)} />
            <div className="relative max-h-[70vh] overflow-y-auto rounded-t-2xl bg-white p-4 dark:bg-gray-900">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 dark:text-white">Analysis History</h3>
                <button type="button" onClick={() => setShowHistory(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-lavender dark:hover:bg-gray-800">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <HistorySidebar history={history} loading={histLoading}
                onLoad={handleLoadHistory} onDelete={handleDelete} activeId={activeId} />
            </div>
          </div>
        )}
      </div>

      {/* Mobile history button */}
      {history.length > 0 && (
        <button type="button" onClick={() => setShowHistory(true)}
          className="fixed bottom-4 left-4 z-40 flex items-center gap-2 rounded-full bg-white px-4 py-2.5 shadow-lg text-sm font-semibold text-primary border border-indigo-100 lg:hidden dark:bg-gray-900 dark:border-gray-700">
          <History className="h-4 w-4" />
          History ({history.length})
        </button>
      )}
    </div>
  )
}
