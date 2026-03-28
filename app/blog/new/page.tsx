import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BlogNewClient } from '@/components/blog/blog-new-client'

export default async function BlogNewPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: currentUser } = await supabase
    .from('users')
    .select('last_blog_at')
    .eq('id', user.id)
    .single()

  let hoursUntilNextPost: number | null = null
  if (currentUser?.last_blog_at) {
    const hoursSince = (Date.now() - new Date(currentUser.last_blog_at).getTime()) / 3600000
    if (hoursSince < 24) {
      hoursUntilNextPost = Math.ceil(24 - hoursSince)
    }
  }

  return <BlogNewClient hoursUntilNextPost={hoursUntilNextPost} />
}
