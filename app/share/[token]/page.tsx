import { redirect } from 'next/navigation'

interface SharePageProps {
  params: Promise<{ token: string }>
}

/**
 * Share page that immediately redirects to secure streaming endpoint
 * This preserves clean URLs while providing secure file access
 */
export default async function SharePage({ params }: SharePageProps) {
  const { token } = await params
  
  // Immediate redirect to streaming API endpoint
  // This maintains the clean URL in the browser while securely serving the file
  redirect(`/api/share/${token}`)
}