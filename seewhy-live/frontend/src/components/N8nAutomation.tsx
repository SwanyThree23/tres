import { useState } from 'react'
import { motion } from 'framer-motion'
import { Workflow as WorkflowIcon, Play, Clock, Server, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

interface WorkflowItem {
  id: string
  name: string
  status: 'active' | 'inactive' | 'error'
  runs: number
  lastRun: string
  vps: 'KVM1' | 'KVM2'
  desc: string
}

const WORKFLOWS: WorkflowItem[] = [
  {
    id: 'wf1',
    name: 'Stream Start Alert',
    status: 'active',
    runs: 248,
    lastRun: '2m ago',
    vps: 'KVM1',
    desc: 'Triggers Discord + Push notification when a stream goes live',
  },
  {
    id: 'wf2',
    name: 'Why Question AI Router',
    status: 'active',
    runs: 1834,
    lastRun: '14s ago',
    vps: 'KVM1',
    desc: 'Routes why-questions to Claude Haiku and returns AI answers',
  },
  {
    id: 'wf3',
    name: 'Revenue Reconciliation',
    status: 'active',
    runs: 92,
    lastRun: '1h ago',
    vps: 'KVM1',
    desc: 'Daily Stripe payout verification — confirms 90/10 split accuracy',
  },
  {
    id: 'wf4',
    name: 'Viewer Count Sync',
    status: 'active',
    runs: 14200,
    lastRun: '3s ago',
    vps: 'KVM1',
    desc: 'Syncs real-time viewer counts from RTMP to database every 5s',
  },
  {
    id: 'wf5',
    name: 'Washington Classic Updater',
    status: 'inactive',
    runs: 31,
    lastRun: '2d ago',
    vps: 'KVM1',
    desc: 'Updates bracket standings after each match via judge webhook',
  },
]

const VPS_INFRA = [
  {
    name: 'srv1587098 (KVM1)',
    role: 'n8n + Automation',
    cpu: 34,
    ram: 62,
    uptime: '99.7%',
    ip: '10.0.1.100',
  },
  {
    name: 'srv-main (KVM2)',
    role: 'API + RTMP',
    cpu: 28,
    ram: 48,
    uptime: '99.9%',
    ip: '10.0.1.10',
  },
]

export default function N8nAutomation() {
  const [testing, setTesting] = useState<string | null>(null)
  const [results, setResults] = useState<Record<string, 'ok' | 'fail'>>({})

  function runTest(id: string) {
    setTesting(id)
    setTimeout(() => {
      setTesting(null)
      setResults(r => ({ ...r, [id]: Math.random() > 0.15 ? 'ok' : 'fail' }))
    }, 1500)
  }

  const statusColors: Record<WorkflowItem['status'], string> = {
    active: '#10b981',
    inactive: 'rgba(255,255,255,0.3)',
    error: '#DC143C',
  }

  const statusLabels: Record<WorkflowItem['status'], string> = {
    active: 'ACTIVE',
    inactive: 'PAUSED',
    error: 'ERROR',
  }

  return (
    <div className="space-y-6">
      {/* Workflows */}
      <div>
        <h3 className="text-sm font-semibold text-white/70 mb-3 flex items-center gap-2">
          <WorkflowIcon size={14} className="text-gold" />
          n8n Workflows
          <span className="text-xs font-mono text-white/30 ml-auto">srv1587098</span>
        </h3>
        <div className="space-y-2">
          {WORKFLOWS.map(wf => (
            <div key={wf.id}
              className="rounded-xl p-3 border border-white/5 flex items-start gap-3"
              style={{ background: '#0a0a14' }}>
              <div className="flex-shrink-0 mt-0.5">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{
                    background: statusColors[wf.status],
                    boxShadow: wf.status === 'active' ? `0 0 6px ${statusColors[wf.status]}` : 'none',
                    animation: wf.status === 'active' ? 'pulse 2s infinite' : 'none',
                  }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-white">{wf.name}</p>
                    <p className="text-xs text-white/40 mt-0.5">{wf.desc}</p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {results[wf.id] && (
                      <span className={cn('text-xs font-mono', results[wf.id] === 'ok' ? 'text-emerald-400' : 'text-crimson')}>
                        {results[wf.id] === 'ok' ? '✓ OK' : '✗ FAIL'}
                      </span>
                    )}
                    <button
                      onClick={() => runTest(wf.id)}
                      disabled={!!testing}
                      className="p-1.5 rounded-lg transition-colors disabled:opacity-40"
                      style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.2)' }}
                      title="Test workflow"
                    >
                      {testing === wf.id ? (
                        <RefreshCw size={12} className="text-gold animate-spin" />
                      ) : (
                        <Play size={12} className="text-gold" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-[10px] font-mono text-white/30 flex items-center gap-1">
                    <Clock size={9} /> {wf.lastRun}
                  </span>
                  <span className="text-[10px] font-mono text-white/30">
                    {wf.runs.toLocaleString()} runs
                  </span>
                  <span
                    className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded"
                    style={{ color: statusColors[wf.status], background: `${statusColors[wf.status]}15` }}
                  >
                    {statusLabels[wf.status]}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Infra */}
      <div>
        <h3 className="text-sm font-semibold text-white/70 mb-3 flex items-center gap-2">
          <Server size={14} className="text-gold" />
          Infrastructure
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {VPS_INFRA.map(server => (
            <div key={server.name} className="rounded-xl p-4 border border-white/5" style={{ background: '#0a0a14' }}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-semibold text-white font-mono">{server.name}</p>
                  <p className="text-xs text-white/40">{server.role}</p>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-mono">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  {server.uptime}
                </div>
              </div>
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-white/40">CPU</span>
                    <span className="font-mono text-white/70">{server.cpu}%</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <div className="h-full rounded-full transition-all"
                      style={{
                        width: `${server.cpu}%`,
                        background: server.cpu > 80 ? '#DC143C' : server.cpu > 60 ? '#D4AF37' : '#10b981',
                      }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-white/40">RAM</span>
                    <span className="font-mono text-white/70">{server.ram}%</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <div className="h-full rounded-full transition-all"
                      style={{
                        width: `${server.ram}%`,
                        background: server.ram > 80 ? '#DC143C' : server.ram > 60 ? '#D4AF37' : '#06b6d4',
                      }} />
                  </div>
                </div>
              </div>
              <p className="text-[10px] font-mono text-white/20 mt-2">{server.ip}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
