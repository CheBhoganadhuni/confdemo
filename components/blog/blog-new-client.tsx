'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Navbar } from '@/components/layout/navbar'
import { BLOG_TAGS } from '@/lib/types/database'

interface Props {
  hoursUntilNextPost: number | null
}

export function BlogNewClient({ hoursUntilNextPost }: Props) {
  const router = useRouter()

  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [visibility, setVisibility] = useState<'university' | 'global'>('university')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const toggleTag = (tag: string) => {
    setTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : prev.length < 5 ? [...prev, tag] : prev
    )
  }

  const handlePublish = async () => {
    setError(null)

    if (title.length < 5 || title.length > 150) {
      setError('Title must be 5–150 characters.')
      return
    }
    if (body.length < 50 || body.length > 10000) {
      setError('Body must be 50–10,000 characters.')
      return
    }
    if (tags.length < 1 || tags.length > 5) {
      setError('Select 1 to 5 tags.')
      return
    }

    setSubmitting(true)

    const res = await fetch('/api/blog/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        body,
        tags,
        visibility,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      setSubmitting(false)
      if (data.error === 'daily_limit') {
        setError(data.message)
      } else if (data.error === 'moderation_rejected') {
        setError(`Post rejected: ${data.message} Edit and try again.`)
      } else {
        setError(data.error || data.message || 'Something went wrong.')
      }
      return
    }

    router.push(`/blog/${data.slug}`)
  }

  const isLimited = hoursUntilNextPost !== null

  return (
    <main className="bg-[#0A0A0A] min-h-screen">
      <Navbar />
      <div className="max-w-2xl mx-auto px-6 pt-20 pb-16">
        <Link href="/blog" className="text-[#555] text-sm hover:text-white transition-colors inline-flex items-center gap-1">
          <ArrowLeft className="size-3.5" />
          Blog
        </Link>
        <h1 className="font-black text-white text-2xl tracking-tight mt-4">Write a Post</h1>

        {/* Title */}
        <div className="mt-6">
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Your post title..."
            maxLength={150}
            className="w-full bg-transparent font-black text-white text-2xl tracking-tight outline-none placeholder:text-[#333]"
          />
          <div className="text-[10px] text-[#444] text-right mt-1">{title.length}/150</div>
        </div>

        <div className="border-t border-[#1A1A1A] my-2" />

        {/* Body */}
        <div>
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="Write your post... (markdown supported)"
            maxLength={10000}
            className="w-full bg-transparent text-[#A0A0A0] text-base leading-relaxed outline-none resize-none min-h-[300px] placeholder:text-[#333]"
          />
          <div className="text-[10px] text-[#444] text-right">{body.length}/10000</div>
        </div>

        {/* Tags */}
        <div className="mt-6">
          <span className="text-[9px] tracking-widest text-[#555] uppercase mb-3 block">
            TAGS {tags.length > 0 && `(${tags.length}/5)`}
          </span>
          <div className="flex gap-1.5 flex-wrap">
            {BLOG_TAGS.map(tag => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`text-[10px] px-2.5 py-1 rounded-sm transition-colors ${
                  tags.includes(tag)
                    ? 'border border-[#F97316] text-[#F97316] bg-[#F97316]/10'
                    : 'border border-[#1F1F1F] text-[#555] hover:text-[#A0A0A0]'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
          {tags.length === 0 && (
            <p className="text-[#444] text-xs mt-2">Select 1 to 5 tags</p>
          )}
        </div>

        {/* Visibility */}
        <div className="mt-6">
          <span className="text-[#555] text-xs mb-2 block">Who can read this?</span>
          <div className="flex gap-2">
            {(['university', 'global'] as const).map(v => (
              <button
                key={v}
                onClick={() => setVisibility(v)}
                className={`text-xs px-4 py-1.5 rounded-sm font-medium transition-colors ${
                  visibility === v
                    ? 'bg-[#F97316] text-black'
                    : 'border border-[#1F1F1F] text-[#555] hover:text-[#A0A0A0]'
                }`}
              >
                {v === 'university' ? 'My University' : 'Everyone (Global)'}
              </button>
            ))}
          </div>
        </div>

        {/* Daily limit warning */}
        {isLimited && (
          <div className="mt-6 bg-[#1A1A1A] border border-[#F97316]/20 rounded-sm px-4 py-3">
            <p className="text-[#F97316] text-sm">
              You&apos;ve already posted today. Come back in {hoursUntilNextPost} hour{hoursUntilNextPost !== 1 ? 's' : ''}.
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-4 bg-rose-950/30 border border-rose-500/20 rounded-sm px-4 py-3">
            <p className="text-rose-400 text-sm">{error}</p>
          </div>
        )}

        {/* Publish button */}
        <button
          onClick={handlePublish}
          disabled={submitting || isLimited}
          className="mt-8 w-full h-12 bg-[#F97316] text-black font-bold rounded-sm hover:bg-[#EA6B0A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Checking content...
            </>
          ) : (
            'Publish Post'
          )}
        </button>
      </div>
    </main>
  )
}
