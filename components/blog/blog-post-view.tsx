'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import { ArrowLeft, ArrowUp } from 'lucide-react'
import { Navbar } from '@/components/layout/navbar'
import type { BlogPost } from '@/lib/types/database'
import { formatRelativeTime } from '@/lib/utils'

interface Props {
  post: BlogPost
  currentUserId: string
}

export function BlogPostView({ post: initialPost, currentUserId }: Props) {
  const router = useRouter()
  const [post, setPost] = useState(initialPost)
  const [deleting, setDeleting] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [changingVisibility, setChangingVisibility] = useState(false)

  const isAuthor = post.author_id === currentUserId
  const authorName = post.author?.name || 'Anonymous'
  const authorLetter = authorName.charAt(0).toUpperCase()
  const univName = post.university?.name
  const showBanner = !post.is_published && isAuthor

  const handleUpvote = () => {
    setPost(prev => ({
      ...prev,
      has_upvoted: !prev.has_upvoted,
      upvote_count: !prev.has_upvoted ? prev.upvote_count + 1 : Math.max(0, prev.upvote_count - 1),
    }))
    fetch(`/api/blog/${post.slug}/upvote`, { method: 'POST' }).catch(() => {
      setPost(prev => ({
        ...prev,
        has_upvoted: !prev.has_upvoted,
        upvote_count: !prev.has_upvoted ? prev.upvote_count + 1 : Math.max(0, prev.upvote_count - 1),
      }))
    })
  }

  const handlePublishToggle = async () => {
    setPublishing(true)
    await fetch(`/api/blog/${post.slug}/publish`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_published: !post.is_published }),
    })
    setPost(prev => ({ ...prev, is_published: !prev.is_published }))
    setPublishing(false)
  }

  const handleVisibilityChange = async (v: 'global' | 'university') => {
    if (v === post.visibility) return
    setChangingVisibility(true)
    await fetch(`/api/blog/${post.slug}/publish`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visibility: v }),
    })
    setPost(prev => ({ ...prev, visibility: v }))
    setChangingVisibility(false)
  }

  const handleDelete = async () => {
    if (!confirm('Delete this post? This cannot be undone.')) return
    setDeleting(true)
    await fetch(`/api/blog/${post.slug}/delete`, { method: 'DELETE' })
    router.push('/blog')
  }

  return (
    <main className="bg-[#0A0A0A] min-h-screen">
      <Navbar />

      {/* Unpublished banner — sits in flow right below the fixed navbar, not fixed itself */}
      {showBanner && (
        <div className="mt-14 bg-[#1A1A1A] border-b border-[#F97316]/30 px-6 py-2 text-center">
          <span className="text-[#F97316] text-xs">
            This post is unpublished — only you can see it.
          </span>
        </div>
      )}

      {/* Top padding: 56px navbar + 8px gap = pt-16 normally; banner adds ~33px so we just use pt-6 after it */}
      <div className={`max-w-2xl mx-auto px-4 sm:px-6 pb-16 overflow-hidden ${showBanner ? 'pt-6' : 'pt-20'}`}>
        {/* Top row: back link + visibility selector for author */}
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/blog"
            className="text-[#555] text-sm hover:text-white transition-colors inline-flex items-center gap-1 flex-shrink-0"
          >
            <ArrowLeft className="size-3.5" />
            Blog
          </Link>

          {isAuthor && (
            <div className="flex items-center gap-1.5">
              {(['university', 'global'] as const).map(v => (
                <button
                  key={v}
                  onClick={() => handleVisibilityChange(v)}
                  disabled={changingVisibility}
                  className={`text-xs px-3 py-1.5 rounded-sm font-medium transition-colors disabled:opacity-50 ${
                    post.visibility === v
                      ? 'bg-[#F97316] text-black'
                      : 'border border-[#1F1F1F] text-[#555] hover:text-[#A0A0A0]'
                  }`}
                >
                  {v === 'university' ? 'Univ' : 'Global'}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="mt-6 flex gap-2 flex-wrap">
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

        {/* Title */}
        <h1 className="font-black text-white text-2xl sm:text-3xl tracking-tight leading-tight mt-4">
          {post.title}
        </h1>

        {/* Author row */}
        <div className="mt-4 flex items-center justify-between gap-3 pb-4 border-b border-[#1A1A1A]">
          <div className="flex items-center gap-2 min-w-0">
            <div className="size-7 rounded-full bg-[#F97316] flex items-center justify-center text-black text-xs font-bold flex-shrink-0">
              {authorLetter}
            </div>
            <div className="flex items-center gap-1 text-xs min-w-0 flex-wrap">
              <span className="text-white font-medium truncate max-w-[140px] sm:max-w-none">{authorName}</span>
              {univName && <span className="text-[#555] hidden xs:inline">· {univName}</span>}
              <span className="text-[#444] flex-shrink-0 whitespace-nowrap">· {formatRelativeTime(post.created_at)}</span>
            </div>
          </div>
          <span
            className={`text-[9px] tracking-wider uppercase px-2 py-0.5 rounded-sm flex-shrink-0 ${
              post.visibility === 'global'
                ? 'text-[#F97316] border border-[#F97316]/30'
                : 'text-[#555] border border-[#1F1F1F]'
            }`}
          >
            {post.visibility === 'global' ? 'Global' : 'Univ'}
          </span>
        </div>

        {/* Body */}
        <div className="mt-8 break-words">
          <ReactMarkdown
            components={{
              h1: ({ children }) => <h1 className="text-white font-bold text-2xl mt-8 mb-4">{children}</h1>,
              h2: ({ children }) => <h2 className="text-white font-bold text-xl mt-6 mb-3">{children}</h2>,
              h3: ({ children }) => <h3 className="text-white font-bold text-lg mt-5 mb-2">{children}</h3>,
              p: ({ children }) => <p className="text-[#A0A0A0] text-base leading-relaxed mb-4">{children}</p>,
              strong: ({ children }) => <strong className="text-white font-bold">{children}</strong>,
              em: ({ children }) => <em className="text-[#A0A0A0] italic">{children}</em>,
              a: ({ href, children }) => (
                <a href={href} className="text-[#F97316] hover:underline" target="_blank" rel="noopener noreferrer">
                  {children}
                </a>
              ),
              ul: ({ children }) => <ul className="list-disc list-inside text-[#A0A0A0] mb-4 space-y-1">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal list-inside text-[#A0A0A0] mb-4 space-y-1">{children}</ol>,
              li: ({ children }) => <li className="text-[#A0A0A0]">{children}</li>,
              blockquote: ({ children }) => (
                <blockquote className="border-l-2 border-[#F97316] pl-4 my-4 text-[#777] italic">
                  {children}
                </blockquote>
              ),
              code: ({ className, children }) => {
                const isBlock = className?.includes('language-')
                if (isBlock) {
                  return (
                    <code className="block bg-[#0A0A0A] border border-[#1A1A1A] rounded-sm px-3 py-2 font-mono text-sm text-[#A0A0A0] overflow-x-auto mb-4">
                      {children}
                    </code>
                  )
                }
                return (
                  <code className="bg-[#1A1A1A] px-1.5 py-0.5 rounded text-sm font-mono text-[#F97316]">
                    {children}
                  </code>
                )
              },
              pre: ({ children }) => <pre className="my-4">{children}</pre>,
              hr: () => <hr className="border-[#1A1A1A] my-6" />,
            }}
          >
            {post.body}
          </ReactMarkdown>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-[#1A1A1A]">
          {/* Upvote */}
          <div className="flex items-center justify-between">
            <button
              onClick={handleUpvote}
              className={`flex items-center gap-2 px-5 h-10 rounded-sm border transition-colors ${
                post.has_upvoted
                  ? 'border-[#F97316] bg-[#F97316]/10 text-[#F97316]'
                  : 'border-[#1F1F1F] text-[#555] hover:border-[#F97316] hover:text-[#F97316]'
              }`}
            >
              <ArrowUp className="size-[18px]" />
              <span className="text-base font-bold">{post.upvote_count}</span>
            </button>

            {isAuthor && (
              <div className="flex items-center gap-4">
                <button
                  onClick={handlePublishToggle}
                  disabled={publishing}
                  className={`text-sm transition-colors disabled:opacity-50 ${
                    post.is_published ? 'text-[#555] hover:text-white' : 'text-[#F97316]'
                  }`}
                >
                  {post.is_published ? 'Unpublish' : 'Publish'}
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="text-sm text-[#555] hover:text-rose-400 transition-colors disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </main>
  )
}
