import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { BlogPostView } from '@/components/blog/blog-post-view'
import { PolyBackground } from '@/components/ui/poly-background'

function BlogNotFound({ message }: { message?: string }) {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white overflow-hidden">
      <PolyBackground variant="full" className="opacity-10" />

      {/* Slow rotating background text */}
      <div
        className="fixed top-1/2 left-1/2 z-0 select-none pointer-events-none"
        style={{ transform: 'translate(-50%, -50%)' }}
      >
        <p className="text-[#111] font-black text-[28vw] leading-none tracking-tighter whitespace-nowrap">
          404
        </p>
      </div>

      {/* Nav */}
      <nav className="fixed top-0 left-0 w-full z-50 px-4 sm:px-8 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-extrabold tracking-tighter text-[#F97316] uppercase">
          Jnana Sethu
        </Link>
        <span className="text-white/30 text-[10px] uppercase tracking-widest font-light hidden md:block">
          Post not found
        </span>
      </nav>

      <main className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <div className="space-y-4 max-w-xl">
          <div className="flex items-center justify-center gap-2 mb-8">
            <span className="h-px w-8 bg-[#F97316] opacity-30" />
            <span className="text-[10px] uppercase tracking-[0.2em] text-[#F97316] font-medium">
              Blog · Error
            </span>
            <span className="h-px w-8 bg-[#F97316] opacity-30" />
          </div>

          <h2 className="text-white font-black text-3xl sm:text-5xl tracking-tighter">
            Post not found.
          </h2>
          <p className="text-[#A0A0A0] text-lg sm:text-xl tracking-tight font-light">
            {message || "This post doesn't exist or isn't visible to you."}
          </p>

          <div className="pt-4 flex flex-col items-center">
            <p className="text-[#555] text-sm max-w-xs leading-relaxed font-light mb-10">
              It may have been deleted, unpublished, or restricted to a different university.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <Link
                href="/blog"
                className="flex items-center justify-center gap-3 px-8 py-4 border border-[#333] text-[#A0A0A0] transition-all duration-200 hover:border-[#F97316] hover:text-[#F97316] hover:scale-[1.02] active:scale-[0.98] rounded-sm"
              >
                <span className="text-sm">←</span>
                <span className="text-xs uppercase tracking-widest font-bold">
                  Read other posts
                </span>
              </Link>
              <Link
                href="/"
                className="flex items-center justify-center gap-3 px-10 py-4 bg-[#F97316] text-black transition-all duration-200 hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] rounded-sm shadow-xl shadow-[#F97316]/10"
              >
                <span className="text-xs uppercase tracking-widest font-black">Go Home</span>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { slug } = await params

  const { data: post } = await supabase
    .from('blog_posts')
    .select(
      `*, author:users!blog_posts_author_id_fkey(id, name, avatar_url, university_id), university:universities!blog_posts_university_id_fkey(name, slug)`
    )
    .eq('slug', slug)
    .single()

  if (!post) {
    return <BlogNotFound />
  }

  // If not published and not author
  if (!post.is_published && post.author_id !== user.id) {
    return <BlogNotFound message="This post has been unpublished." />
  }

  // Visibility check
  if (post.visibility === 'university' && post.university_id) {
    const { data: currentUser } = await supabase
      .from('users')
      .select('university_id')
      .eq('id', user.id)
      .single()
    if (currentUser?.university_id !== post.university_id && post.author_id !== user.id) {
      return <BlogNotFound message="This post is restricted to another university." />
    }
  }

  // Check upvote
  const { data: upvote } = await supabase
    .from('blog_upvotes')
    .select('id')
    .eq('post_id', post.id)
    .eq('user_id', user.id)
    .maybeSingle()

  return (
    <BlogPostView
      post={{ ...post, has_upvoted: !!upvote }}
      currentUserId={user.id}
    />
  )
}
