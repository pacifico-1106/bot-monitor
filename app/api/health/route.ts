import { NextRequest, NextResponse } from 'next/server'

// In-memory storage (本番環境ではRedis/DBを推奨)
const healthData = new Map<string, any>()

export async function POST(request: NextRequest) {
  try {
    // API Key 認証
    const apiKey = request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (apiKey !== process.env.HEALTH_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    
    healthData.set(data.machine_id, {
      ...data,
      received_at: new Date().toISOString()
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const allData = Array.from(healthData.values())
    
    // 5分以上更新がないマシンはオフライン扱い
    const now = new Date()
    allData.forEach(machine => {
      const lastUpdate = new Date(machine.received_at)
      const minutesAgo = (now.getTime() - lastUpdate.getTime()) / 1000 / 60
      
      if (minutesAgo > 5) {
        machine.status = 'offline'
      }
    })
    
    return NextResponse.json(allData)
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
