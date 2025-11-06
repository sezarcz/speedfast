import { NextResponse } from 'next/server'

const servers = [
  {
    id: '1',
    name: 'SpeedTest Server 1',
    location: 'Jakarta',
    country: 'Indonesia',
    host: 'jakarta.speedtest.local',
    port: 8080,
    distance: 0
  },
  {
    id: '2',
    name: 'SpeedTest Server 2',
    location: 'Singapore',
    country: 'Singapore',
    host: 'singapore.speedtest.local',
    port: 8080,
    distance: 500
  },
  {
    id: '3',
    name: 'SpeedTest Server 3',
    location: 'Tokyo',
    country: 'Japan',
    host: 'tokyo.speedtest.local',
    port: 8080,
    distance: 3000
  },
  {
    id: '4',
    name: 'SpeedTest Server 4',
    location: 'Hong Kong',
    country: 'Hong Kong',
    host: 'hongkong.speedtest.local',
    port: 8080,
    distance: 2000
  },
  {
    id: '5',
    name: 'SpeedTest Server 5',
    location: 'Sydney',
    country: 'Australia',
    host: 'sydney.speedtest.local',
    port: 8080,
    distance: 4000
  }
]

export async function GET() {
  const headers = new Headers()
  headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
  headers.set('Pragma', 'no-cache')
  headers.set('Expires', '0')
  
  return NextResponse.json({
    success: true,
    servers: servers
  }, {
    status: 200,
    headers
  })
}