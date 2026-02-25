'use client'

import { useEffect, useState } from 'react'
import { formatDistanceToNow } from 'date-fns'

interface MachineHealth {
  machine_id: string
  timestamp: string
  received_at: string
  status: 'online' | 'offline'
  system: {
    cpu_percent: number
    memory_percent: number
    disk_percent: number
    platform?: string
  }
  openclaw_running?: boolean
  bots?: {
    sales: { status: string; running: boolean }
    admin: { status: string; running: boolean }
  }
  errors?: string[]
}

export default function Dashboard() {
  const [machines, setMachines] = useState<MachineHealth[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/health')
        const data = await res.json()
        setMachines(data)
        setLoading(false)
      } catch (error) {
        console.error('Failed to fetch health data:', error)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 10000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  const allErrors = machines.flatMap(m => 
    (m.errors || []).map(error => ({ machine: m.machine_id, error }))
  )

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Bot Monitor</h1>
          <p className="text-gray-600 mt-2">AI System Monitoring Dashboard</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {machines.map((machine) => (
            <MachineCard key={machine.machine_id} machine={machine} />
          ))}
        </div>

        {allErrors.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-bold text-red-600 mb-4 flex items-center gap-2">
              <span className="text-2xl">🚨</span>
              System Errors ({allErrors.length})
            </h2>
            <div className="space-y-2">
              {allErrors.map((item, i) => (
                <div key={i} className="p-3 bg-red-50 rounded border border-red-200">
                  <div className="font-mono text-sm text-red-800">
                    <span className="font-bold">[{item.machine}]</span> {item.error}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {allErrors.length === 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3 text-green-600">
              <span className="text-3xl">✅</span>
              <span className="text-lg font-semibold">All systems operational</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function MachineCard({ machine }: { machine: MachineHealth }) {
  const isOnline = machine.status === 'online'
  const lastUpdate = machine.received_at ? new Date(machine.received_at) : new Date()

  return (
    <div className={'bg-white rounded-lg shadow-md p-6 transition-opacity ' + (isOnline ? '' : 'opacity-60')}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-900 text-sm">{machine.machine_id}</h3>
        <div className="flex items-center gap-2">
          <div className={'w-3 h-3 rounded-full ' + (isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500')} />
          <span className={'text-xs font-medium ' + (isOnline ? 'text-green-600' : 'text-red-600')}>
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>
      </div>

      <div className="space-y-3">
        <MetricBar label="CPU" value={machine.system.cpu_percent} />
        <MetricBar label="Memory" value={machine.system.memory_percent} />
        <MetricBar label="Disk" value={machine.system.disk_percent} />

        {machine.openclaw_running !== undefined && (
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">OpenClaw</span>
              <span className={machine.openclaw_running ? 'text-green-600' : 'text-red-600'}>
                {machine.openclaw_running ? '✓ Running' : '✗ Stopped'}
              </span>
            </div>
          </div>
        )}

        {machine.bots && (
          <div className="pt-2 border-t space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Sales Bot</span>
              <span className={machine.bots.sales.running ? 'text-green-600' : 'text-red-600'}>
                {machine.bots.sales.status}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Admin Bot</span>
              <span className={machine.bots.admin.running ? 'text-green-600' : 'text-red-600'}>
                {machine.bots.admin.status}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t text-xs text-gray-500">
        Updated {formatDistanceToNow(lastUpdate, { addSuffix: true })}
      </div>
    </div>
  )
}

function MetricBar({ label, value }: { label: string; value: number }) {
  const getColor = (val: number) => {
    if (val >= 90) return 'bg-red-500'
    if (val >= 70) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="text-gray-600">{label}</span>
        <span className="font-mono font-medium">{value.toFixed(1)}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={'h-2 rounded-full transition-all ' + getColor(value)}
          style={{ width: value + '%' }}
        />
      </div>
    </div>
  )
}
