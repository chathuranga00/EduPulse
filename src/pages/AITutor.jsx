import { useState } from 'react'
import {
  Plus,
  Send,
  Sparkles,
  Paperclip,
  Mic,
  PlusCircle,
  RotateCcw,
  Loader2,
  MessageSquare,
} from 'lucide-react'
import { sendTutorMessage } from '../lib/api.js'
import { useToast } from '../components/ui/Toast.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'

const welcomeMessage = {
  id: 1,
  role: 'assistant',
  content:
    "Hi Jane! I'm your AI tutor. Ask me anything about your courses — I can explain concepts, help with homework, or quiz you on topics.",
}

const pastChatsSeed = [
  { id: 1, title: 'SN1 vs SN2 Mechanisms', time: '2 mins ago' },
  { id: 2, title: 'Calculus Integration Techniques', time: 'Yesterday' },
  { id: 3, title: 'Physics — Newton\'s Laws', time: '2 days ago' },
  { id: 4, title: 'Cell Biology Overview', time: 'Last week' },
]

const keyTerms = [
  'Nucleophile',
  'Electrophile',
  'Steric Hindrance',
  'Carbocation',
  'Backside Attack',
  'Leaving Group',
]

const quickNotes = [
  'SN1 favors polar protic solvents (e.g. water, alcohol)',
  'SN2 favors polar aprotic solvents (e.g. DMSO, acetone)',
  'Inversion of configuration occurs in SN2',
]

function ChatHistoryPanel({ chats, activeChatId, onSelectChat, onNewChat }) {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-indigo-100/80 bg-white dark:border-gray-800 dark:bg-gray-900 md:flex">
      <div className="border-b border-indigo-100/80 p-4 dark:border-gray-800">
        <button
          type="button"
          onClick={onNewChat}
          className="ep-btn-secondary flex w-full justify-center border-dashed py-2.5"
        >
          <Plus className="h-4 w-4" />
          New Chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {chats.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title="No conversations yet"
            description="Start a new chat to get help from your AI tutor."
            action={
              <button type="button" onClick={onNewChat} className="ep-btn-primary">
                <Plus className="h-4 w-4" />
                New Chat
              </button>
            }
          />
        ) : (
          <ul className="space-y-1">
            {chats.map((chat) => (
              <li key={chat.id}>
                <button
                  type="button"
                  onClick={() => onSelectChat(chat.id)}
                  className={`w-full rounded-xl px-3 py-3 text-left transition-all duration-200 ${
                    activeChatId === chat.id
                      ? 'bg-primary/10 text-primary shadow-sm'
                      : 'text-gray-700 hover:bg-lavender dark:text-gray-300 dark:hover:bg-gray-800'
                  }`}
                >
                  <p className="truncate text-sm font-medium">{chat.title}</p>
                  <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">{chat.time}</p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  )
}

function AIMessage({ message }) {
  return (
    <div className="flex max-w-[85%] flex-col gap-2">
      <div className="flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
        </div>
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          EduPulse AI · AI Tutor
        </span>
      </div>

      <div className="rounded-2xl border border-indigo-50 bg-white p-4 shadow-sm shadow-indigo-100/30 transition-shadow duration-200 dark:border-gray-800 dark:bg-gray-900 dark:shadow-none">
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800 dark:text-gray-200">
          {message.content}
        </p>
      </div>
    </div>
  )
}

function ConversationPanel({ messages, input, onInputChange, onSend, isLoading, error }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col bg-lavender-light/50 dark:bg-gray-950/50">
      <div className="flex-1 space-y-6 overflow-y-auto p-5">
        {messages.map((msg) =>
          msg.role === 'user' ? (
            <div key={msg.id} className="flex justify-end">
              <div className="max-w-[75%] rounded-2xl bg-primary px-4 py-3 text-sm leading-relaxed text-white">
                {msg.content}
              </div>
            </div>
          ) : (
            <div key={msg.id} className="flex justify-start">
              <AIMessage message={msg} />
            </div>
          ),
        )}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-2xl border border-indigo-50 bg-white px-4 py-3 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-sm text-gray-500 dark:text-gray-400">EduPulse AI is thinking…</span>
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="border-t border-red-100 bg-red-50 px-4 py-2 text-sm text-red-600 dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-400">
          {error}
        </p>
      )}

      <form
        onSubmit={onSend}
        className="border-t border-indigo-100/80 bg-white p-4 dark:border-gray-800 dark:bg-gray-900"
      >
        <div className="rounded-2xl border border-gray-200 bg-lavender-light p-3 dark:border-gray-700 dark:bg-gray-800">
          <input
            type="text"
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            placeholder="Ask about any topic — chemistry, math, history..."
            disabled={isLoading}
            className="w-full bg-transparent px-1 py-1 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none disabled:opacity-60 dark:text-gray-100"
          />
          <div className="mt-3 flex items-center justify-between gap-3">
            <div className="flex gap-2">
              <button
                type="button"
                disabled={isLoading}
                className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:border-primary hover:text-primary disabled:opacity-50 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-400"
              >
                <Paperclip className="h-3.5 w-3.5" />
                Attach PDF/Docs
              </button>
              <button
                type="button"
                disabled={isLoading}
                className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:border-primary hover:text-primary disabled:opacity-50 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-400"
              >
                <Mic className="h-3.5 w-3.5" />
                Voice
              </button>
            </div>
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white transition hover:bg-primary-hover disabled:opacity-50"
              aria-label="Send message"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

function Flashcard({ question, answer }) {
  const [flipped, setFlipped] = useState(false)

  return (
    <button
      type="button"
      onClick={() => setFlipped((f) => !f)}
      className="group relative h-36 w-full [perspective:1000px]"
      aria-label={flipped ? 'Show question' : 'Show answer'}
    >
      <div
        className={`relative h-full w-full transition-transform duration-500 [transform-style:preserve-3d] ${
          flipped ? '[transform:rotateY(180deg)]' : ''
        }`}
      >
        <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl border border-indigo-100 bg-gradient-to-br from-lavender to-white p-4 [backface-visibility:hidden] dark:border-gray-700 dark:from-gray-800 dark:to-gray-900">
          <p className="text-center text-sm font-medium text-gray-800 dark:text-gray-200">
            {question}
          </p>
          <span className="mt-3 text-xs text-gray-400">Tap to flip</span>
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl border border-primary/30 bg-primary/5 p-4 [backface-visibility:hidden] [transform:rotateY(180deg)] dark:bg-primary/10">
          <p className="text-center text-sm font-medium text-primary">{answer}</p>
          <span className="mt-3 flex items-center gap-1 text-xs text-gray-400">
            <RotateCcw className="h-3 w-3" />
            Tap to flip back
          </span>
        </div>
      </div>
    </button>
  )
}

function ContextPanel() {
  const [selectedTerm, setSelectedTerm] = useState(null)

  return (
    <aside className="hidden w-72 shrink-0 flex-col overflow-y-auto border-l border-indigo-100/80 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 xl:flex">
      <section className="mb-6">
        <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
          Key Terms
        </h3>
        <div className="flex flex-wrap gap-2">
          {keyTerms.map((term) => (
            <button
              key={term}
              type="button"
              onClick={() => setSelectedTerm(term === selectedTerm ? null : term)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                selectedTerm === term
                  ? 'bg-primary text-white'
                  : 'bg-lavender text-primary hover:bg-primary/10 dark:bg-gray-800'
              }`}
            >
              {term}
            </button>
          ))}
        </div>
      </section>

      <section className="mb-6">
        <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
          Quick Notes
        </h3>
        <ul className="space-y-2">
          {quickNotes.map((note) => (
            <li
              key={note}
              className="flex gap-2 text-xs leading-relaxed text-gray-600 dark:text-gray-400"
            >
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
              {note}
            </li>
          ))}
        </ul>
        <button
          type="button"
          className="mt-3 flex items-center gap-1 text-xs font-medium text-primary transition hover:text-primary-hover"
        >
          <PlusCircle className="h-3.5 w-3.5" />
          Add manual note
        </button>
      </section>

      <section className="mb-6">
        <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
          Flashcards
        </h3>
        <Flashcard
          question="What determines SN1 vs SN2 preference?"
          answer="Substrate structure — primary favors SN2, tertiary favors SN1."
        />
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Current Topic Depth
          </h3>
          <span className="text-sm font-bold text-primary">68%</span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-lavender dark:bg-gray-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-violet-500"
            style={{ width: '68%' }}
          />
        </div>
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Nucleophilic Substitution Reactions
        </p>
      </section>
    </aside>
  )
}

export default function AITutor() {
  const toast = useToast()
  const [chats, setChats] = useState(pastChatsSeed)
  const [activeChatId, setActiveChatId] = useState(1)
  const [messages, setMessages] = useState([welcomeMessage])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSend = async (e) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userContent = input.trim()
    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: userContent,
    }

    const history = messages.map(({ role, content }) => ({ role, content }))
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setError(null)
    setIsLoading(true)

    if (activeChatId === null) {
      const newId = Date.now()
      setChats((prev) => [
        { id: newId, title: userContent.slice(0, 40), time: 'Just now' },
        ...prev,
      ])
      setActiveChatId(newId)
    }

    try {
      const text = await sendTutorMessage(userContent, history)
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: 'assistant',
          content: text,
        },
      ])
      toast.success('Response received')
    } catch (err) {
      const msg = err.message || 'Something went wrong. Please try again.'
      setError(msg)
      toast.error(msg)
    } finally {
      setIsLoading(false)
    }
  }

  const handleNewChat = () => {
    setMessages([welcomeMessage])
    setActiveChatId(null)
    setError(null)
    toast.info('New chat started')
  }

  return (
    <div className="-m-4 flex h-[calc(100dvh-3.5rem)] flex-col overflow-hidden sm:-m-6 sm:h-[calc(100dvh-4rem)] md:flex-row">
      <ChatHistoryPanel
        chats={chats}
        activeChatId={activeChatId}
        onSelectChat={setActiveChatId}
        onNewChat={handleNewChat}
      />
      <ConversationPanel
        messages={messages}
        input={input}
        onInputChange={setInput}
        onSend={handleSend}
        isLoading={isLoading}
        error={error}
      />
      <ContextPanel />
    </div>
  )
}
