import { NextRequest, NextResponse } from 'next/server'
import { EngagementTracker } from '@/lib/analytics/engagement-tracker'

export async function GET(
  request: NextRequest,
  { params }: { params: { shortCode: string } }
) {
  try {
    const shortCode = params.shortCode
    const userAgent = request.headers.get('user-agent') || ''
    const referer = request.headers.get('referer') || ''
    const forwardedFor = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')
    const ipAddress = forwardedFor?.split(',')[0] || realIp || 'unknown'

    // Extract device info from user agent
    const device = userAgent.includes('Mobile') ? 'Mobile' : 
                  userAgent.includes('Tablet') ? 'Tablet' : 'Desktop'

    // Extract location (would need IP geolocation service in production)
    const location = 'Unknown' // Placeholder - integrate with IP geolocation

    const tracker = new EngagementTracker()
    const result = await tracker.recordClick(shortCode, {
      ipAddress,
      userAgent,
      referer,
      location,
      device
    })

    if (!result.success || !result.redirectUrl) {
      return NextResponse.json(
        { error: 'Short link not found or expired' },
        { status: 404 }
      )
    }

    // Redirect to original URL
    return NextResponse.redirect(result.redirectUrl, 302)

  } catch (error) {
    console.error('Short link redirect error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
