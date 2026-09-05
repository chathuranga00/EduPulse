import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import {
  Plus, Send, Sparkles, Paperclip, Mic, PlusCircle,
  RotateCcw, Loader2, MessageSquare, Trash2, BookOpen,
  Hash, Lightbulb, TrendingUp, X,
} from 'lucide-react'
import { sendTutorMessage } from '../lib/api.js'
import { useToast } from '../components/ui/Toast.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { supabase } from '../lib/supabase.js'
import EmptyState from '../components/ui/EmptyState.jsx'

// ── Helpers ───────────────────────────────────────────────────────────────────
function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000)
  if (diff < 60)    return 'Just now'
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
  return 'Last week'
}

// Extract key terms from messages (words > 5 chars, capitalised or repeated)
function extractKeyTerms(messages) {
  const text  = messages.map((m) => m.content).join(' ')
  const words = text.match(/\b[A-Z][a-zA-Z]{4,}\b/g) || []
  const freq  = {}
  words.forEach((w) => { freq[w] = (freq[w] || 0) + 1 })
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([w]) => w)
}

// Detect subject from conversation text
function detectSubject(messages) {
  const text = messages.map((m) => m.content).join(' ').toLowerCase()
  const subjectHints = [
    ['chemistry', 'Chemistry'], ['physics', 'Physics'], ['biology', 'Biology'],
    ['calculus', 'Mathematics'], ['mathematics', 'Mathematics'], ['algebra', 'Mathematics'],
    ['accounting', 'Accounting'], ['economics', 'Economics'], ['history', 'History'],
    ['geography', 'Geography'], ['literature', 'English'], ['english', 'English'],
    ['programming', 'Technology'], ['buddhism', 'Buddhism'], ['hinduism', 'Hinduism'],
  ]
  for (const [hint, subject] of subjectHints) {
    if (text.includes(hint)) return subject
  }
  return null
}

// Welcome message per user
function makeWelcome(name) {
  return {
    id: 'welcome',
    role: 'assistant',
    content: `Hi ${name || 'there'}! I'm your AI tutor. Ask me anything about your courses — I can explain concepts, help with homework, or quiz you on topics.`,
    created_at: new Date().toISOString(),
  }
}

// ── Chat history sidebar ───────────────────────────────────────────────────────
function ChatHistoryPanel({ chats, activeChatId, onSelectChat, onNewChat, onDeleteChat, loading }) {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-indigo-100/80 bg-white dark:border-gray-800 dark:bg-gray-900 md:flex">
      <div className="border-b border-indigo-100/80 p-4 dark:border-gray-800">
        <button type="button" onClick={onNewChat}
          className="ep-btn-secondary flex w-full justify-center border-dashed py-2.5">
          <Plus className="h-4 w-4" />New Chat
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-gray-400" /></div>
        ) : chats.length === 0 ? (
          <div className="px-2 py-6 text-center">
            <MessageSquare className="mx-auto mb-2 h-8 w-8 text-gray-300 dark:text-gray-700" />
            <p className="text-xs text-gray-400">No conversations yet</p>
          </div>
        ) : (
          <ul className="space-y-1">
            {chats.map((chat) => (
              <li key={chat.id} className="group relative">
                <button type="button" onClick={() => onSelectChat(chat.id)}
                  className={`w-full rounded-xl px-3 py-3 text-left transition-all duration-200 ${
                    activeChatId === chat.id
                      ? 'bg-primary/10 text-primary shadow-sm'
                      : 'text-gray-700 hover:bg-lavender dark:text-gray-300 dark:hover:bg-gray-800'
                  }`}>
                  <p className="truncate pr-6 text-sm font-medium">{chat.title}</p>
                  <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">{timeAgo(chat.updated_at)}</p>
                </button>
                <button type="button" onClick={() => onDeleteChat(chat.id)}
                  aria-label="Delete chat"
                  className="absolute right-2 top-3 hidden rounded-lg p-1 text-gray-400 opacity-0 transition hover:bg-red-50 hover:text-red-500 group-hover:flex group-hover:opacity-100 dark:hover:bg-red-900/20">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  )
}

// ── Message bubbles ───────────────────────────────────────────────────────────
function AIMessage({ content }) {
  return (
    <div className="flex max-w-[85%] flex-col gap-2">
      <div className="flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
        </div>
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          EduPulse AI · Tutor
        </span>
      </div>
      <div className="rounded-2xl border border-indigo-50 bg-white p-4 shadow-sm shadow-indigo-100/30 dark:border-gray-800 dark:bg-gray-900 dark:shadow-none">
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800 dark:text-gray-200">{content}</p>
      </div>
    </div>
  )
}

// ── Flashcard component ────────────────────────────────────────────────────────
function Flashcard({ question, answer }) {
  const [flipped, setFlipped] = useState(false)
  return (
    <button type="button" onClick={() => setFlipped((f) => !f)}
      className="group relative h-32 w-full [perspective:1000px]" aria-label={flipped ? 'Show question' : 'Show answer'}>
      <div className={`relative h-full w-full transition-transform duration-500 [transform-style:preserve-3d] ${flipped ? '[transform:rotateY(180deg)]' : ''}`}>
        <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl border border-indigo-100 bg-gradient-to-br from-lavender to-white p-4 [backface-visibility:hidden] dark:border-gray-700 dark:from-gray-800 dark:to-gray-900">
          <p className="text-center text-xs font-medium text-gray-800 dark:text-gray-200">{question}</p>
          <span className="mt-2 text-xs text-gray-400">Tap to flip</span>
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl border border-primary/30 bg-primary/5 p-4 [backface-visibility:hidden] [transform:rotateY(180deg)] dark:bg-primary/10">
          <p className="text-center text-xs font-medium text-primary">{answer}</p>
          <span className="mt-2 flex items-center gap-1 text-xs text-gray-400"><RotateCcw className="h-3 w-3" />Flip back</span>
        </div>
      </div>
    </button>
  )
}

// ── Dynamic context panel ─────────────────────────────────────────────────────
function ContextPanel({ messages, subject }) {
  const keyTerms   = useMemo(() => extractKeyTerms(messages), [messages])
  const msgCount   = messages.filter((m) => m.role === 'user').length
  const depth      = Math.min(100, msgCount * 12)
  const [note, setNote]   = useState('')
  const [notes, setNotes] = useState([])
  const [selectedTerm, setSelectedTerm] = useState(null)

  // Generate a contextual flashcard from last AI response
  const lastAI = [...messages].reverse().find((m) => m.role === 'assistant' && m.id !== 'welcome')

  const addNote = (e) => {
    e.preventDefault()
    if (!note.trim()) return
    setNotes((prev) => [note.trim(), ...prev])
    setNote('')
  }

  return (
    <aside className="hidden w-72 shrink-0 flex-col overflow-y-auto border-l border-indigo-100/80 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 xl:flex">

      {/* Subject badge */}
      {subject && (
        <div className="mb-5 flex items-center gap-2 rounded-xl bg-primary/5 px-3 py-2 dark:bg-primary/10">
          <BookOpen className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-primary">{subject}</span>
        </div>
      )}

      {/* Key Terms — extracted live from conversation */}
      <section className="mb-6">
        <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-gray-900 dark:text-white">
          <Hash className="h-4 w-4 text-primary" />Key Terms
        </h3>
        {keyTerms.length === 0 ? (
          <p className="text-xs text-gray-400">Terms appear as you chat</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {keyTerms.map((term) => (
              <button key={term} type="button"
                onClick={() => setSelectedTerm(term === selectedTerm ? null : term)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  selectedTerm === term ? 'bg-primary text-white' : 'bg-lavender text-primary hover:bg-primary/10 dark:bg-gray-800'
                }`}>
                {term}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Quick Notes */}
      <section className="mb-6">
        <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-gray-900 dark:text-white">
          <Lightbulb className="h-4 w-4 text-primary" />Quick Notes
        </h3>
        <ul className="mb-3 space-y-2">
          {notes.map((n, i) => (
            <li key={i} className="flex items-start gap-2 text-xs leading-relaxed text-gray-600 dark:text-gray-400">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />{n}
              <button type="button" onClick={() => setNotes((prev) => prev.filter((_, j) => j !== i))}
                className="ml-auto shrink-0 text-gray-300 hover:text-red-400">
                <X className="h-3 w-3" />
              </button>
            </li>
          ))}
          {notes.length === 0 && <li className="text-xs text-gray-400">No notes yet</li>}
        </ul>
        <form onSubmit={addNote} className="flex gap-1.5">
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note…"
            className="flex-1 rounded-xl border border-gray-200 bg-lavender-light px-2.5 py-1.5 text-xs focus:border-primary focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100" />
          <button type="submit" disabled={!note.trim()}
            className="flex h-7 w-7 items-center justify-center rounded-xl bg-primary text-white disabled:opacity-40 hover:bg-primary-hover">
            <PlusCircle className="h-3.5 w-3.5" />
          </button>
        </form>
      </section>

      {/* AI-generated flashcard from last response */}
      {lastAI && (
        <section className="mb-6">
          <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-gray-900 dark:text-white">
            <RotateCcw className="h-4 w-4 text-primary" />Flashcard
          </h3>
          <Flashcard
            question={subject ? `What is a key concept in ${subject}?` : 'What did you just learn?'}
            answer={lastAI.content.split('.')[0] + '.'}
          />
        </section>
      )}

      {/* Topic depth */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="flex items-center gap-1.5 text-sm font-semibold text-gray-900 dark:text-white">
            <TrendingUp className="h-4 w-4 text-primary" />Session Depth
          </h3>
          <span className="text-sm font-bold text-primary">{depth}%</span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-lavender dark:bg-gray-800">
          <div className="h-full rounded-full bg-gradient-to-r from-primary to-violet-500 transition-all duration-700"
            style={{ width: `${depth}%` }} />
        </div>
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          {msgCount === 0 ? 'Start chatting to build depth' : `${msgCount} question${msgCount !== 1 ? 's' : ''} asked`}
        </p>
      </section>
    </aside>
  )
}

// ── Conversation panel ────────────────────────────────────────────────────────
function ConversationPanel({ messages, input, onInputChange, onSend, isLoading, error, chatTitle }) {
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  return (
    <div className="flex min-w-0 flex-1 flex-col bg-lavender-light/50 dark:bg-gray-950/50">
      {/* Chat title bar */}
      {chatTitle && (
        <div className="border-b border-indigo-100/80 bg-white/80 px-5 py-2.5 backdrop-blur dark:border-gray-800 dark:bg-gray-900/80">
          <p className="truncate text-sm font-semibold text-gray-700 dark:text-gray-200">{chatTitle}</p>
        </div>
      )}

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
              <AIMessage content={msg.content} />
            </div>
          )
        )}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-2xl border border-indigo-50 bg-white px-4 py-3 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-sm text-gray-500 dark:text-gray-400">EduPulse AI is thinking…</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {error && (
        <p className="border-t border-red-100 bg-red-50 px-4 py-2 text-sm text-red-600 dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-400">
          {error}
        </p>
      )}

      <form onSubmit={onSend}
        className="border-t border-indigo-100/80 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <div className="rounded-2xl border border-gray-200 bg-lavender-light p-3 dark:border-gray-700 dark:bg-gray-800">
          <input type="text" value={input} onChange={(e) => onInputChange(e.target.value)}
            placeholder="Ask about any topic — chemistry, math, history..."
            disabled={isLoading}
            className="w-full bg-transparent px-1 py-1 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none disabled:opacity-60 dark:text-gray-100" />
          <div className="mt-3 flex items-center justify-between gap-3">
            <div className="flex gap-2">
              <button type="button" disabled={isLoading}
                className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:border-primary hover:text-primary disabled:opacity-50 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-400">
                <Paperclip className="h-3.5 w-3.5" />Attach PDF/Docs
              </button>
              <button type="button" disabled={isLoading}
                className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:border-primary hover:text-primary disabled:opacity-50 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-400">
                <Mic className="h-3.5 w-3.5" />Voice
              </button>
            </div>
            <button type="submit" disabled={isLoading || !input.trim()}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white transition hover:bg-primary-hover disabled:opacity-50"
              aria-label="Send message">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AITutor() {
  const toast                         = useToast()
  const { user }                      = useAuth()
  const [chats, setChats]             = useState([])
  const [chatsLoading, setChatsLoading] = useState(true)
  const [activeChatId, setActiveChatId] = useState(null)
  const [messages, setMessages]       = useState([])
  const [msgsLoading, setMsgsLoading] = useState(false)
  const [input, setInput]             = useState('')
  const [isLoading, setIsLoading]     = useState(false)
  const [error, setError]             = useState(null)
  const channelRef                    = useRef(null)

  const activeChat = chats.find((c) => c.id === activeChatId)
  const displayMsgs = messages.length === 0
    ? [makeWelcome(user?.name)]
    : messages

  // ── Load user's chats ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return
    setChatsLoading(true)
    supabase
      .from('tutor_chats')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .then(({ data }) => {
        setChats(data || [])
        setChatsLoading(false)
      })
  }, [user])

  // ── Real-time: new chats or title updates ─────────────────────────────────
  useEffect(() => {
    if (!user) return
    const ch = supabase
      .channel(`tutor-chats-${user.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tutor_chats', filter: `user_id=eq.${user.id}` },
        (p) => setChats((prev) => [p.new, ...prev].sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at)))
      )
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'tutor_chats', filter: `user_id=eq.${user.id}` },
        (p) => setChats((prev) => prev.map((c) => c.id === p.new.id ? p.new : c).sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at)))
      )
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'tutor_chats', filter: `user_id=eq.${user.id}` },
        (p) => setChats((prev) => prev.filter((c) => c.id !== p.old.id))
      )
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [user])

  // ── Load messages when chat changes ──────────────────────────────────────
  useEffect(() => {
    if (!activeChatId) { setMessages([]); return }
    setMsgsLoading(true)
    supabase
      .from('tutor_messages')
      .select('*')
      .eq('chat_id', activeChatId)
      .order('created_at', { ascending: true })
      .then(({ data }) => { setMessages(data || []); setMsgsLoading(false) })
  }, [activeChatId])

  // ── Real-time: new messages in active chat ────────────────────────────────
  useEffect(() => {
    if (!activeChatId) return
    if (channelRef.current) supabase.removeChannel(channelRef.current)

    const ch = supabase
      .channel(`tutor-msgs-${activeChatId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'tutor_messages',
        filter: `chat_id=eq.${activeChatId}`,
      }, (p) => {
        setMessages((prev) => {
          if (prev.find((m) => m.id === p.new.id)) return prev
          return [...prev, p.new]
        })
      })
      .subscribe()

    channelRef.current = ch
    return () => supabase.removeChannel(ch)
  }, [activeChatId])

  // ── Send message ──────────────────────────────────────────────────────────
  const handleSend = useCallback(async (e) => {
    e.preventDefault()
    if (!input.trim() || isLoading || !user) return

    const userContent = input.trim()
    setInput('')
    setError(null)
    setIsLoading(true)

    let chatId = activeChatId

    // Create new chat if none active
    if (!chatId) {
      const title = userContent.slice(0, 50)
      const { data: newChat, error: chatErr } = await supabase
        .from('tutor_chats')
        .insert({ user_id: user.id, title })
        .select()
        .single()

      if (chatErr) { toast.error('Could not create chat'); setIsLoading(false); return }
      chatId = newChat.id
      setActiveChatId(chatId)
    }

    // Save user message
    const { data: savedMsg } = await supabase
      .from('tutor_messages')
      .insert({ chat_id: chatId, user_id: user.id, role: 'user', content: userContent })
      .select()
      .single()

    if (savedMsg) setMessages((prev) => prev.find((m) => m.id === savedMsg.id) ? prev : [...prev, savedMsg])

    // Build history for AI
    const history = messages.map(({ role, content }) => ({ role, content }))

    try {
      const text = await sendTutorMessage(userContent, history)

      // Save AI response
      const { data: aiMsg } = await supabase
        .from('tutor_messages')
        .insert({ chat_id: chatId, user_id: user.id, role: 'assistant', content: text })
        .select()
        .single()

      if (aiMsg) setMessages((prev) => prev.find((m) => m.id === aiMsg.id) ? prev : [...prev, aiMsg])

      // Update chat title from first message & detect subject
      const subject = detectSubject([...messages, { content: userContent }, { content: text }])
      await supabase
        .from('tutor_chats')
        .update({ updated_at: new Date().toISOString(), ...(subject ? { subject } : {}) })
        .eq('id', chatId)

    } catch (err) {
      const msg = err.message || 'Something went wrong. Please try again.'
      setError(msg)
      toast.error(msg)
    } finally {
      setIsLoading(false)
    }
  }, [input, isLoading, user, activeChatId, messages, toast])

  // ── New chat ──────────────────────────────────────────────────────────────
  const handleNewChat = useCallback(() => {
    setActiveChatId(null)
    setMessages([])
    setError(null)
  }, [])

  // ── Select chat ───────────────────────────────────────────────────────────
  const handleSelectChat = useCallback((id) => {
    setActiveChatId(id)
    setError(null)
  }, [])

  // ── Delete chat ───────────────────────────────────────────────────────────
  const handleDeleteChat = useCallback(async (id) => {
    await supabase.from('tutor_chats').delete().eq('id', id)
    if (activeChatId === id) { setActiveChatId(null); setMessages([]) }
  }, [activeChatId])

  // subject for context panel
  const subject = activeChat?.subject || detectSubject(messages) || null

  return (
    <div className="-m-4 flex h-[calc(100dvh-3.5rem)] flex-col overflow-hidden sm:-m-6 sm:h-[calc(100dvh-4rem)] md:flex-row">
      <ChatHistoryPanel
        chats={chats}
        activeChatId={activeChatId}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
        onDeleteChat={handleDeleteChat}
        loading={chatsLoading}
      />
      {msgsLoading ? (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <ConversationPanel
          messages={displayMsgs}
          input={input}
          onInputChange={setInput}
          onSend={handleSend}
          isLoading={isLoading}
          error={error}
          chatTitle={activeChat?.title}
        />
      )}
      <ContextPanel messages={displayMsgs} subject={subject} />
    </div>
  )
}
