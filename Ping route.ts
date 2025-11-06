import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const clientTime = searchParams.get('t')
    
    const serverTime = Date.now()
    
    const headers = new Headers()
    headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    headers.set('Pragma', 'no-cache')
    headers.set('Expires', '0')
    
    return NextResponse.json({
      success: true,
      serverTime: serverTime,
      clientTime: clientTime,
      timestamp: new Date().toISOString()
    }, {
      status: 200,
      headers
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Ping failed'
    }, {
      status: 500
    })
  }
}