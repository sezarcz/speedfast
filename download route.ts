import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const size = parseInt(searchParams.get('size') || '10485760') // Default 10MB
  
  const data = new ArrayBuffer(size)
  const view = new Uint8Array(data)
  
  for (let i = 0; i < size; i++) {
    view[i] = Math.floor(Math.random() * 256)
  }
  
  const headers = new Headers()
  headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
  headers.set('Pragma', 'no-cache')
  headers.set('Expires', '0')
  headers.set('Content-Type', 'application/octet-stream')
  headers.set('Content-Length', size.toString())
  
  return new NextResponse(data, {
    status: 200,
    headers
  })
}