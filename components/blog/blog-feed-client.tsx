'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowUp, PenLine, Search, X } from 'lucide-react'
import { Navbar } from '@/components/layout/navbar'
import { BLOG_TAGS } from '@/lib/types/database'
import type { BlogPost } from '@/lib/types/database'
import { formatRelativeTime } from '@/lib/utils'

interface Props {
  initialPosts: BlogPost[]
  totalCount: number
  userId: string
  canPost: boolean
}

function PostCard({ post, onUpvote }: { post: BlogPost; onUpvote: (slug: string) => void }) {
  const router = useRouter()
  const authorName = post.author?.name || 'Anonymous'
  const authorLetter = authorName.charAt(0).toUpperCase()
  const univName = post.university?.name

  const handleCardClick = () => router.push(`/blog/${post.slug}`)

  const handleUpvoteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onUpvote(post.slug)
  }

  return (
    <div
      onClick={handleCardClick}
      className="bg-[#0F0F0F] border border-[#1A1A1A] rounded-sm p-4 sm:p-5 hover:border-[#333] transition-colors cursor-pointer flex flex-col"
    >
      {/* Top row */}
      <div className="flex items-center gap-2">
        {/* Avatar */}
        <div className="size-6 rounded-full bg-[#F97316] flex items-center justify-center text-black text-[10px] font-bold flex-shrink-0">
          {authorLetter}
        </div>

        {/* Meta — takes all remaining space, never overflows */}
        <div className="flex-1 min-w-0 flex items-center gap-1 text-xs">
          <span className="text-white font-medium truncate shrink-[2]">{authorName}</span>
          {univName && (
            <span className="text-[#555] truncate shrink-[3] hidden xs:inline">· {univName}</span>
          )}
          <span className="text-[#444] flex-shrink-0 whitespace-nowrap">· {formatRelativeTime(post.created_at)}</span>
        </div>

        {/* Badges */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {!post.is_published && (
            <span className="text-[9px] tracking-wider uppercase px-1.5 py-0.5 rounded-sm text-[#F97316] border border-[#F97316]/40 bg-[#F97316]/5">
              Draft
            </span>
          )}
          <span
            className={`text-[9px] tracking-wider uppercase px-1.5 py-0.5 rounded-sm ${
              post.visibility === 'global'
                ? 'text-[#F97316] border border-[#F97316]/30'
                : 'text-[#555] border border-[#1F1F1F]'
            }`}
          >
            {post.visibility === 'global' ? 'Global' : 'Univ'}
          </span>
        </div>
      </div>

      {/* Title */}
      <h3 className="font-bold text-white text-base sm:text-lg leading-tight mt-3">
        {post.title}
      </h3>

      {/* Body preview */}
      <p className="text-[#777] text-sm leading-relaxed line-clamp-3 mt-2">
        {post.body.replace(/[#*`_~>\[\]()-]/g, '').slice(0, 250)}
      </p>

      {/* Tags */}
      {post.tags.length > 0 && (
        <div className="mt-3 flex gap-1 flex-wrap">
          {post.tags.map(tag => (
            <span
              key={tag}
              className="text-[9px] uppercase tracking-wide bg-[#161616] text-[#555] px-2 py-0.5 rounded-sm"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Bottom row — pushed to bottom */}
      <div className="mt-auto pt-3 flex items-center gap-4 border-t border-[#161616]">
        <button
          onClick={handleUpvoteClick}
          className="flex items-center gap-1.5 text-sm hover:scale-105 active:scale-95 transition-transform"
        >
          <ArrowUp className={`size-4 ${post.has_upvoted ? 'text-[#F97316]' : 'text-[#333]'}`} />
          <span className={post.has_upvoted ? 'text-[#F97316]' : 'text-[#555]'}>
            {post.upvote_count}
          </span>
        </button>
      </div>
    </div>
  )
}

export function BlogFeedClient({ initialPosts, totalCount, userId, canPost }: Props) {
  const [posts, setPosts] = useState<BlogPost[]>(initialPosts)
  const [total, setTotal] = useState(totalCount)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [visibility, setVisibility] = useState<'university' | 'global'>('university')
  const [sort, setSort] = useState<'recent' | 'popular'>('recent')
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchPosts = useCallback(async (
    vis: string,
    s: string,
    tag: string | null,
    p: number,
    q: string,
    append = false
  ) => {
    setLoading(true)
    const params = new URLSearchParams({ visibility: vis, sort: s, page: String(p) })
    if (tag) params.set('tag', tag)
    if (q) params.set('search', q)
    const res = await fetch(`/api/blog?${params}`)
    const data = await res.json()
    if (append) {
      setPosts(prev => [...prev, ...data.posts])
    } else {
      setPosts(data.posts)
    }
    setTotal(data.total)
    setLoading(false)
  }, [])

  const handleFilterChange = (vis: 'university' | 'global', s: 'recent' | 'popular', tag: string | null) => {
    setVisibility(vis)
    setSort(s)
    setActiveTag(tag)
    setPage(1)
    fetchPosts(vis, s, tag, 1, search)
  }

  const handleLoadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    fetchPosts(visibility, sort, activeTag, nextPage, search, true)
  }

  const handleSearchChange = (value: string) => {
    setSearch(value)
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
    searchDebounceRef.current = setTimeout(() => {
      setPage(1)
      fetchPosts(visibility, sort, activeTag, 1, value)
    }, 350)
  }

  // Optimistic upvote: update UI immediately, fire request in background
  const handleUpvote = (slug: string) => {
    setPosts(prev =>
      prev.map(p => {
        if (p.slug !== slug) return p
        const nowUpvoted = !p.has_upvoted
        return {
          ...p,
          has_upvoted: nowUpvoted,
          upvote_count: nowUpvoted ? p.upvote_count + 1 : Math.max(0, p.upvote_count - 1),
        }
      })
    )
    // Fire and forget — no await
    fetch(`/api/blog/${slug}/upvote`, { method: 'POST' }).catch(() => {
      // Revert on failure
      setPosts(prev =>
        prev.map(p => {
          if (p.slug !== slug) return p
          const revert = !p.has_upvoted
          return {
            ...p,
            has_upvoted: revert,
            upvote_count: revert ? p.upvote_count + 1 : Math.max(0, p.upvote_count - 1),
          }
        })
      )
    })
  }

  const hasMore = posts.length < total

  return (
    <main className="bg-[#0A0A0A] min-h-screen">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-20 pb-16">

        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="font-black text-white text-2xl sm:text-3xl tracking-tight">Blog</h1>
            <p className="text-[#555] text-sm mt-1">From your campus. Unfiltered.</p>
          </div>
          <Link
            href="/blog/new"
            className="bg-[#F97316] text-black font-bold text-xs sm:text-sm px-3 sm:px-5 h-9 rounded-sm flex items-center gap-1.5 hover:bg-[#EA6B0A] transition-colors flex-shrink-0"
          >
            <PenLine className="size-3.5" />
            <span className="hidden xs:inline">Write a Post</span>
            <span className="xs:hidden">Write</span>
          </Link>
        </div>

        {/* Search */}
        <div className="mt-5 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-[#444] pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={e => handleSearchChange(e.target.value)}
            placeholder="Search posts by title…"
            className="w-full bg-[#0F0F0F] border border-[#1A1A1A] rounded-sm pl-8 pr-8 py-2.5 text-sm text-white placeholder-[#444] focus:outline-none focus:border-[#333] transition-colors"
          />
          {search && (
            <button
              onClick={() => handleSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555] hover:text-white transition-colors"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="mt-3 flex gap-2 flex-wrap items-center">
          {(['university', 'global'] as const).map(v => (
            <button
              key={v}
              onClick={() => handleFilterChange(v, sort, activeTag)}
              className={`text-xs px-3 py-1.5 rounded-sm font-medium transition-colors ${
                visibility === v
                  ? 'bg-[#F97316] text-black'
                  : 'border border-[#1F1F1F] text-[#555] hover:text-[#A0A0A0]'
              }`}
            >
              {v === 'university' ? 'University' : 'Global'}
            </button>
          ))}

          <div className="w-px h-4 bg-[#1F1F1F]" />

          {(['recent', 'popular'] as const).map(s => (
            <button
              key={s}
              onClick={() => handleFilterChange(visibility, s, activeTag)}
              className={`text-xs px-3 py-1.5 rounded-sm font-medium transition-colors ${
                sort === s
                  ? 'bg-[#F97316] text-black'
                  : 'border border-[#1F1F1F] text-[#555] hover:text-[#A0A0A0]'
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        {/* Tag chips — horizontal scroll on mobile */}
        <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          {BLOG_TAGS.map(tag => (
            <button
              key={tag}
              onClick={() => handleFilterChange(visibility, sort, activeTag === tag ? null : tag)}
              className={`text-[10px] px-2.5 py-1 rounded-sm transition-colors flex-shrink-0 ${
                activeTag === tag
                  ? 'bg-[#1A1A1A] border border-[#F97316] text-[#F97316]'
                  : 'border border-[#1F1F1F] text-[#555] hover:text-[#A0A0A0]'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Posts — 1 col on mobile, 2 cols on lg+ */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-3">
          {posts.map(post => (
            <PostCard key={post.id} post={post} onUpvote={handleUpvote} />
          ))}

          {/* Loading skeletons */}
          {loading && [1, 2, 3, 4].map(i => (
            <div key={i} className="bg-[#0F0F0F] border border-[#1A1A1A] rounded-sm p-5 animate-pulse">
              <div className="flex items-center gap-2">
                <div className="size-6 rounded-full bg-[#1A1A1A]" />
                <div className="h-3 w-24 bg-[#1A1A1A] rounded" />
              </div>
              <div className="h-5 w-3/4 bg-[#1A1A1A] rounded mt-3" />
              <div className="h-3 w-full bg-[#1A1A1A] rounded mt-3" />
              <div className="h-3 w-2/3 bg-[#1A1A1A] rounded mt-2" />
            </div>
          ))}
        </div>

        {posts.length === 0 && !loading && (
          <div className="text-center py-16">
            <p className="text-[#555] text-sm">
              {search ? `No posts found for "${search}".` : 'No posts yet. Be the first to write something.'}
            </p>
          </div>
        )}

        {/* Load more */}
        {hasMore && !loading && (
          <button
            onClick={handleLoadMore}
            className="w-full mt-6 py-3 text-sm text-[#555] border border-[#1F1F1F] rounded-sm hover:border-[#333] hover:text-[#A0A0A0] transition-colors"
          >
            Load more posts
          </button>
        )}
      </div>
    </main>
  )
}
