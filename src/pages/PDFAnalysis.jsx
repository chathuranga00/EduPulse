import { useCallback, useRef, useState } from 'react'
import {
  Upload,
  FileText,
  BookOpen,
  Layers,
  Lightbulb,
  ChevronDown,
  Loader2,
  CheckCircle2,
} from 'lucide-react'
import { analyzeDocumentText } from '../lib/api.js'
import { extractTextFromFile } from '../lib/extractText.js'
import { useToast } from '../components/ui/Toast.jsx'
import LoadingSpinner from '../components/ui/LoadingSpinner.jsx'

const ACCEPTED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
]
const ACCEPTED_EXTENSIONS = ['.pdf', '.docx', '.txt']
const MAX_SIZE_MB = 50

const features = [
  {
    title: 'Deep Summary',
    description: 'Contextual understanding of your document with chapter-level insights.',
    icon: BookOpen,
    color: 'bg-indigo-100 text-primary dark:bg-indigo-900/40',
  },
  {
    title: 'Flashcards',
    description: 'Spaced repetition ready cards generated from key passages.',
    icon: Layers,
    color: 'bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-400',
  },
  {
    title: 'Key Concepts',
    description: 'Bullet-point extraction of the most important ideas and terms.',
    icon: Lightbulb,
    color: 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400',
  },
]

function ExpandableSection({ title, icon: Icon, iconColor, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="overflow-hidden rounded-2xl border border-indigo-50 bg-white shadow-sm shadow-indigo-100/50 dark:border-gray-800 dark:bg-gray-900 dark:shadow-none">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-lavender-light/50 dark:hover:bg-gray-800/50"
      >
        <div className="flex items-center gap-3">
          <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${iconColor}`}>
            <Icon className="h-4 w-4" />
          </div>
          <span className="font-semibold text-gray-900 dark:text-white">{title}</span>
        </div>
        <ChevronDown
          className={`h-5 w-5 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className="border-t border-indigo-50 px-5 py-4 dark:border-gray-800">
          {children}
        </div>
      )}
    </div>
  )
}

export default function PDFAnalysis() {
  const toast = useToast()
  const fileInputRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)
  const [status, setStatus] = useState('idle') // idle | processing | complete
  const [selectedFile, setSelectedFile] = useState(null)
  const [results, setResults] = useState(null)
  const [error, setError] = useState(null)

  const validateFile = (file) => {
    const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase()
    const validType =
      ACCEPTED_TYPES.includes(file.type) ||
      ACCEPTED_EXTENSIONS.includes(ext)
    const validSize = file.size <= MAX_SIZE_MB * 1024 * 1024

    if (!validType) {
      return 'Please upload a PDF, DOCX, or TXT file.'
    }
    if (!validSize) {
      return `File must be under ${MAX_SIZE_MB}MB.`
    }
    return null
  }

  const processFile = useCallback(async (file) => {
    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      return
    }

    setError(null)
    setResults(null)
    setSelectedFile(file)
    setStatus('processing')

    try {
      const text = await extractTextFromFile(file)
      const analysis = await analyzeDocumentText(text, file.name)
      setResults(analysis)
      setStatus('complete')
      toast.success('Document analyzed successfully')
    } catch (err) {
      const msg = err.message || 'Failed to analyze document. Please try again.'
      setError(msg)
      toast.error(msg)
      setStatus('idle')
      setSelectedFile(null)
    }
  }, [toast])

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
    e.target.value = ''
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) processFile(file)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = () => setDragOver(false)

  const resetUpload = () => {
    setStatus('idle')
    setSelectedFile(null)
    setResults(null)
    setError(null)
  }

  return (
    <div className="ep-page mx-auto max-w-3xl">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
          Transform Content into Knowledge
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-gray-500 dark:text-gray-400">
          Upload your documents and let AI generate deep summaries, flashcards,
          and key concept extractions — powered by contextual understanding.
        </p>
      </div>

      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`rounded-2xl border-2 border-dashed p-12 text-center transition ${
          dragOver
            ? 'border-primary bg-primary/5'
            : 'border-indigo-200 bg-white shadow-sm shadow-indigo-100/50 dark:border-gray-700 dark:bg-gray-900 dark:shadow-none'
        } ${status === 'processing' ? 'pointer-events-none opacity-70' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
          onChange={handleFileChange}
          className="hidden"
        />

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
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="ep-btn-primary mt-6"
            >
              Select from Device
            </button>
          </>
        )}
      </div>

      {error && (
        <p className="text-center text-sm text-red-500">{error}</p>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        {features.map(({ title, description, icon: Icon, color }) => (
          <div
            key={title}
            className="ep-card p-5 shadow-sm"
          >
            <div className={`mb-3 inline-flex rounded-xl p-2.5 ${color}`}>
              <Icon className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>
          </div>
        ))}
      </div>

      {status === 'complete' && selectedFile && results && (
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-2xl border border-emerald-100 bg-emerald-50/50 px-5 py-3 dark:border-emerald-900/30 dark:bg-emerald-950/20">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  Analysis complete
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {selectedFile.name}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={resetUpload}
              className="text-sm font-medium text-primary transition hover:text-primary-hover"
            >
              Upload another
            </button>
          </div>

          <ExpandableSection
            title="Deep Summary"
            icon={BookOpen}
            iconColor="bg-indigo-100 text-primary dark:bg-indigo-900/40"
            defaultOpen
          >
            <p className="whitespace-pre-line text-sm leading-relaxed text-gray-700 dark:text-gray-300">
              {results.summary}
            </p>
          </ExpandableSection>

          <ExpandableSection
            title="Flashcards"
            icon={Layers}
            iconColor="bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-400"
          >
            <div className="grid gap-3 sm:grid-cols-2">
              {results.flashcards.map((card) => (
                <div
                  key={card.front}
                  className="rounded-xl border border-indigo-100 bg-lavender-light p-4 dark:border-gray-700 dark:bg-gray-800/50"
                >
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {card.front}
                  </p>
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{card.back}</p>
                </div>
              ))}
            </div>
          </ExpandableSection>

          <ExpandableSection
            title="Key Concepts"
            icon={Lightbulb}
            iconColor="bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400"
          >
            <ul className="space-y-2">
              {results.keyConcepts.map((concept) => (
                <li
                  key={concept}
                  className="flex gap-2 text-sm text-gray-700 dark:text-gray-300"
                >
                  <FileText className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  {concept}
                </li>
              ))}
            </ul>
          </ExpandableSection>
        </div>
      )}
    </div>
  )
}
