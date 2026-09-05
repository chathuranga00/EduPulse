import { useState, useEffect, useCallback, useRef } from 'react'
import {
  MessageCircle, Heart, Plus, TrendingUp, X, Hash,
  Loader2, Send, ChevronDown, ChevronUp, Wifi, WifiOff,
} from 'lucide-react'
import PageHeader from '../components/ui/PageHeader.jsx'
import { useToast } from '../components/ui/Toast.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { supabase } from '../lib/supabase.js'

// ── Helpers ──────────────────────────────────────────────────────────────────
function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000)
  if (diff < 60)    return 'Just now'
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

// ── New Post Modal ────────────────────────────────────────────────────────────
function NewPostModal({ open, onClose, onSubmit, loading }) {
  const [course, setCourse]   = useState('')
  const [content, setContent] = useState('')

  if (!open) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!content.trim()) return
    onSubmit({ course: course.trim() || 'General', content: content.trim() })
    setCourse('')
    setContent('')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" aria-label="Close modal" className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl border border-indigo-50 bg-white p-6 shadow-xl dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">New Post</h2>
          <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-lavender dark:hover:bg-gray-800">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="post-course" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Course / Subject tag</label>
            <input id="post-course" type="text" value={course} onChange={(e) => setCourse(e.target.value)}
              placeholder="e.g. Calculus II, Organic Chemistry"
              className="w-full rounded-2xl border border-gray-200 bg-lavender-light px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100" />
          </div>
          <div>
            <label htmlFor="post-content" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">What's on your mind?</label>
            <textarea id="post-content" value={content} onChange={(e) => setContent(e.target.value)} rows={4} required
              placeholder="Share a tip, ask a question, or start a discussion..."
              className="w-full resize-none rounded-2xl border border-gray-200 bg-lavender-light px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100" />
          </div>
          <button type="submit" disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-2.5 text-sm font-semibold text-white transition hover:bg-primary-hover disabled:opacity-60">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Post'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ── Comments section ──────────────────────────────────────────────────────────
function Comments({ postId, user, initials }) {
  const [comments, setComments]   = useState([])
  const [text, setText]           = useState('')
  const [loading, setLoading]     = useState(false)
  const [fetching, setFetching]   = useState(true)
  const channelRef                = useRef(null)

  // Fetch initial comments
  useEffect(() => {
    setFetching(true)
    supabase
      .from('post_comments')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true })
      .then(({ data }) => { setComments(data || []); setFetching(false) })

    // Real-time subscription for comments
    const ch = supabase
      .channel(`comments-${postId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'post_comments', filter: `post_id=eq.${postId}` },
        (payload) => setComments((prev) => {
          if (prev.find((c) => c.id === payload.new.id)) return prev
          return [...prev, payload.new]
        })
      )
      .subscribe()

    channelRef.current = ch
    return () => { supabase.removeChannel(ch) }
  }, [postId])

  const submit = async (e) => {
    e.preventDefault()
    if (!text.trim() || !user) return
    setLoading(true)
    await supabase.from('post_comments').insert({
      post_id:         postId,
      user_id:         user.id,
      author_name:     user.name,
      author_initials: initials,
      content:         text.trim(),
    })
    // update comment count
    await supabase.rpc('increment_comments', { row_id: postId })
    setText('')
    setLoading(false)
  }

  return (
    <div className="mt-4 border-t border-gray-100 pt-4 dark:border-gray-800">
      {fetching ? (
        <div className="flex justify-center py-2"><Loader2 className="h-4 w-4 animate-spin text-gray-400" /></div>
      ) : (
        <div className="mb-3 space-y-3">
          {comments.map((c) => (
            <div key={c.id} className="flex gap-2.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-violet-400 text-xs font-semibold text-white">
                {c.author_initials}
              </div>
              <div className="flex-1 rounded-xl bg-lavender-light px-3 py-2 dark:bg-gray-800">
                <span className="mr-2 text-xs font-semibold text-gray-900 dark:text-white">{c.author_name}</span>
                <span className="text-xs text-gray-600 dark:text-gray-400">{c.content}</span>
              </div>
            </div>
          ))}
          {comments.length === 0 && <p className="text-center text-xs text-gray-400">No comments yet. Be the first!</p>}
        </div>
      )}

      {user && (
        <form onSubmit={submit} className="flex gap-2">
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Write a comment…"
            className="flex-1 rounded-xl border border-gray-200 bg-lavender-light px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100" />
          <button type="submit" disabled={loading || !text.trim()}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white transition hover:bg-primary-hover disabled:opacity-50">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </form>
      )}
    </div>
  )
}

// ── Post Card ─────────────────────────────────────────────────────────────────
function PostCard({ post, user, initials, likedIds, onLike }) {
  const [showComments, setShowComments] = useState(false)
  const liked = likedIds.has(post.id)

  return (
    <article className="ep-card p-6 transition-transform duration-200 hover:-translate-y-0.5">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-violet-400 text-sm font-semibold text-white">
          {post.author_initials}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-gray-900 dark:text-white">{post.author_name}</p>
          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <span className="rounded-full bg-lavender px-2 py-0.5 font-medium text-primary dark:bg-gray-800">{post.course}</span>
            <span>·</span>
            <span>{timeAgo(post.created_at)}</span>
          </div>
        </div>
      </div>

      <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">{post.content}</p>

      <div className="mt-4 flex gap-4 border-t border-gray-100 pt-4 dark:border-gray-800">
        <button type="button" onClick={() => onLike(post.id)}
          className={`flex items-center gap-1.5 text-sm transition ${liked ? 'font-medium text-red-500' : 'text-gray-500 hover:text-red-500 dark:text-gray-400'}`}>
          <Heart className={`h-4 w-4 ${liked ? 'fill-current' : ''}`} />
          {post.likes_count + (liked ? 0 : 0)}
        </button>
        <button type="button" onClick={() => setShowComments((v) => !v)}
          className="flex items-center gap-1.5 text-sm text-gray-500 transition hover:text-primary dark:text-gray-400">
          <MessageCircle className="h-4 w-4" />
          {post.comments_count}
          {showComments ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>
      </div>

      {showComments && <Comments postId={post.id} user={user} initials={initials} />}
    </article>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Community() {
  const toast                     = useToast()
  const { user, initials }        = useAuth()
  const [posts, setPosts]         = useState([])
  const [likedIds, setLikedIds]   = useState(new Set())
  const [modalOpen, setModalOpen] = useState(false)
  const [posting, setPosting]     = useState(false)
  const [loading, setLoading]     = useState(true)
  const [realtime, setRealtime]   = useState(false)
  const [trending, setTrending]   = useState([])
  const channelRef                = useRef(null)

  // Fetch initial posts
  useEffect(() => {
    supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data, error }) => {
        if (!error) setPosts(data || [])
        setLoading(false)
      })
  }, [])

  // Fetch user's liked posts
  useEffect(() => {
    if (!user) return
    supabase
      .from('post_likes')
      .select('post_id')
      .eq('user_id', user.id)
      .then(({ data }) => {
        if (data) setLikedIds(new Set(data.map((r) => r.post_id)))
      })
  }, [user])

  // Compute trending from posts
  useEffect(() => {
    const counts = {}
    posts.forEach((p) => {
      const tag = p.course || 'General'
      counts[tag] = (counts[tag] || 0) + 1
    })
    const sorted = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([tag, count]) => ({ tag, count }))
    setTrending(sorted)
  }, [posts])

  // Real-time subscription for new posts
  useEffect(() => {
    const ch = supabase
      .channel('posts-feed')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' },
        (payload) => {
          setPosts((prev) => {
            if (prev.find((p) => p.id === payload.new.id)) return prev
            return [payload.new, ...prev]
          })
        }
      )
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'posts' },
        (payload) => {
          setPosts((prev) => prev.map((p) => p.id === payload.new.id ? payload.new : p))
        }
      )
      .subscribe((status) => {
        setRealtime(status === 'SUBSCRIBED')
      })

    channelRef.current = ch
    return () => { supabase.removeChannel(ch) }
  }, [])

  // Handle like toggle
  const handleLike = useCallback(async (postId) => {
    if (!user) { toast.error('Sign in to like posts'); return }
    const isLiked = likedIds.has(postId)

    // Optimistic update
    setLikedIds((prev) => {
      const next = new Set(prev)
      isLiked ? next.delete(postId) : next.add(postId)
      return next
    })
    setPosts((prev) => prev.map((p) => p.id === postId
      ? { ...p, likes_count: p.likes_count + (isLiked ? -1 : 1) }
      : p
    ))

    if (isLiked) {
      await supabase.from('post_likes').delete().eq('user_id', user.id).eq('post_id', postId)
      await supabase.from('posts').update({ likes_count: posts.find(p => p.id === postId)?.likes_count - 1 }).eq('id', postId)
    } else {
      await supabase.from('post_likes').insert({ user_id: user.id, post_id: postId })
      await supabase.from('posts').update({ likes_count: posts.find(p => p.id === postId)?.likes_count + 1 }).eq('id', postId)
    }
  }, [user, likedIds, posts, toast])

  // Handle new post
  const handleNewPost = useCallback(async ({ course, content }) => {
    if (!user) { toast.error('Sign in to post'); return }
    setPosting(true)
    const { error } = await supabase.from('posts').insert({
      user_id:         user.id,
      author_name:     user.name,
      author_initials: initials,
      course,
      content,
    })
    if (error) {
      toast.error('Failed to post. Please try again.')
    } else {
      toast.success('Post published!')
      setModalOpen(false)
    }
    setPosting(false)
  }, [user, initials, toast])

  return (
    <div className="ep-page">
      <PageHeader
        title="Community"
        subtitle="Connect with fellow students, share tips, and learn together."
        action={
          <div className="flex items-center gap-3">
            {/* Real-time indicator */}
            <div className={`hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium sm:flex ${
              realtime ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                       : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'}`}>
              {realtime
                ? <><span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />Live</>
                : <><WifiOff className="h-3 w-3" />Offline</>}
            </div>
            <button type="button" onClick={() => setModalOpen(true)} className="ep-btn-primary">
              <Plus className="h-4 w-4" />New Post
            </button>
          </div>
        }
      />

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Feed */}
        <div className="min-w-0 flex-1 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : posts.length === 0 ? (
            <div className="ep-card flex flex-col items-center justify-center py-16 text-center">
              <MessageCircle className="mb-3 h-10 w-10 text-gray-300 dark:text-gray-700" />
              <p className="font-medium text-gray-500 dark:text-gray-400">No posts yet</p>
              <p className="mt-1 text-sm text-gray-400">Be the first to share something!</p>
              <button type="button" onClick={() => setModalOpen(true)} className="ep-btn-primary mt-4">
                <Plus className="h-4 w-4" />Create First Post
              </button>
            </div>
          ) : (
            posts.map((post) => (
              <PostCard key={post.id} post={post} user={user} initials={initials}
                likedIds={likedIds} onLike={handleLike} />
            ))
          )}
        </div>

        {/* Trending sidebar */}
        <aside className="w-full shrink-0 lg:w-72">
          <div className="sticky top-[4.5rem] ep-card p-5 sm:top-20">
            <div className="mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h2 className="font-semibold text-gray-900 dark:text-white">Trending Topics</h2>
            </div>
            {trending.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Topics appear as posts are made</p>
            ) : (
              <ul className="space-y-2">
                {trending.map(({ tag, count }, i) => (
                  <li key={tag}>
                    <button type="button"
                      className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition hover:bg-lavender dark:hover:bg-gray-800">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-lavender text-xs font-bold text-primary dark:bg-gray-800">
                          {i + 1}
                        </span>
                        <span className="flex items-center gap-1 text-sm font-medium text-gray-800 dark:text-gray-200">
                          <Hash className="h-3.5 w-3.5 text-gray-400" />{tag}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400">{count} post{count !== 1 ? 's' : ''}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>

      <NewPostModal open={modalOpen} onClose={() => setModalOpen(false)}
        onSubmit={handleNewPost} loading={posting} />
    </div>
  )
}
