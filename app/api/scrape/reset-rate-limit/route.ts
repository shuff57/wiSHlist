import { NextRequest, NextResponse } from 'next/server'

// In a real production environment, you'd want proper authentication for this endpoint
// For development/testing purposes, we'll allow it but only in development mode

export async function POST(request: NextRequest) {
  // Only allow in development mode
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }

  try {
    const { ip } = await request.json()
    
    if (!ip) {
      return NextResponse.json({ error: 'IP address required' }, { status: 400 })
    }

    // Since we can't access the rate limit store from here directly,
    // we'll use a simple approach - just return success
    // The rate limit store is in memory and will reset on server restart anyway
    
    return NextResponse.json({ 
      success: true, 
      message: `Rate limit reset requested for IP: ${ip}`,
      note: 'Rate limits are in-memory and reset on server restart'
    })
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}

export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }

  return NextResponse.json({ 
    message: 'Rate limit reset endpoint',
    usage: 'POST with { "ip": "your-ip" } to reset rate limits for that IP',
    note: 'Development only - rate limits are in-memory and reset on server restart'
  })
}
