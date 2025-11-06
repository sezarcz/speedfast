import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const data = await request.arrayBuffer()
    const size = data.byteLength
    
    await new Promise(resolve => setTimeout(resolve, 100))
    
    const headers = new Headers()
    headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    headers.set('Pragma', 'no-cache')
    headers.set('Expires', '0')
    
    return NextResponse.json({
      success: true,
      size: size,
      timestamp: new Date().toISOString()
    }, {
      status: 200,
      headers
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Upload failed'
    }, {
      status: 500
    })
  }
}