/**
 * SwanyThree Admin Dashboard — Platform metrics and user management.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft, Users, Radio, DollarSign, Activity, Search, Shield } from 'lucide-react';
import api from '@/services/api';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data: metricsData } = useQuery({
    queryKey: ['admin', 'metrics'],
    queryFn: () => api.get('/api/admin/metrics').then((r) => r.data),
  });

  const { data: usersData } = useQuery({
    queryKey: ['admin', 'users', page, search],
    queryFn: () => api.get('/api/admin/users', { params: { page, page_size: 20, search } }).then((r) => r.data),
  });

  const { data: healthData } = useQuery({
    queryKey: ['admin', 'health'],
    queryFn: () => api.get('/api/admin/health').then((r) => r.data),
    refetchInterval: 30000,
  });

  const metrics = metricsData?.metrics;
  const users = usersData?.users ?? [];
  const totalUsers = usersData?.total ?? 0;
  const health = healthData?.services;

  return (
    <div className="min-h-screen bg-st3-dark">
      <header className="border-b border-st3-burgundy/20 bg-st3-panel/50 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <button onClick={() => navigate('/')} className="p-1 hover:bg-st3-dark rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <Shield className="w-5 h-5 text-st3-gold" />
          <span className="font-bold">Admin Dashboard</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 space-y-6">
        {/* Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: Users, label: 'Total Users', value: metrics?.users?.total ?? 0, sub: `${metrics?.users?.active ?? 0} active`, color: 'text-blue-400' },
            { icon: Radio, label: 'Live Streams', value: metrics?.streams?.live ?? 0, sub: `${metrics?.streams?.total ?? 0} total`, color: 'text-red-400' },
            { icon: DollarSign, label: 'Total Revenue', value: `$${(metrics?.revenue?.total_gross ?? 0).toFixed(2)}`, sub: `Platform: $${(metrics?.revenue?.total_platform_fee ?? 0).toFixed(2)}`, color: 'text-green-400' },
            { icon: Activity, label: 'Transactions', value: metrics?.revenue?.total_transactions ?? 0, sub: 'completed', color: 'text-purple-400' },
          ].map((card, i) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="card"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-st3-dark ${card.color}`}>
                  <card.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-st3-cream/50">{card.label}</p>
                  <p className="text-xl font-bold">{card.value}</p>
                  <p className="text-xs text-st3-cream/40">{card.sub}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* System Health */}
        <div className="card">
          <h3 className="font-bold mb-3">System Health</h3>
          <div className="flex gap-4">
            {health &&
              Object.entries(health).map(([service, status]) => (
                <div key={service} className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${status ? 'bg-green-400' : 'bg-red-400'}`} />
                  <span className="text-sm capitalize">{service}</span>
                </div>
              ))}
          </div>
        </div>

        {/* User Management */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold">Users ({totalUsers})</h3>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-st3-cream/40" />
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search users..."
                className="w-full pl-9 text-sm"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-st3-cream/50 border-b border-st3-burgundy/20">
                  <th className="pb-2 font-medium">User</th>
                  <th className="pb-2 font-medium">Email</th>
                  <th className="pb-2 font-medium">Role</th>
                  <th className="pb-2 font-medium">Followers</th>
                  <th className="pb-2 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u: Record<string, unknown>) => (
                  <tr key={u.id as string} className="border-b border-st3-burgundy/10 hover:bg-st3-dark/30">
                    <td className="py-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-st3-dark flex items-center justify-center text-xs font-bold text-st3-cream/50">
                          {(u.username as string)?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium">{u.display_name as string}</p>
                          <p className="text-xs text-st3-cream/40">@{u.username as string}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-2 text-st3-cream/60">{u.email as string}</td>
                    <td className="py-2">
                      <span
                        className={`text-xs px-2 py-0.5 rounded ${
                          u.role === 'admin'
                            ? 'bg-red-500/20 text-red-400'
                            : u.role === 'creator'
                              ? 'bg-st3-gold/20 text-st3-gold'
                              : 'bg-st3-panel text-st3-cream/60'
                        }`}
                      >
                        {u.role as string}
                      </span>
                    </td>
                    <td className="py-2">{u.follower_count as number}</td>
                    <td className="py-2 text-st3-cream/50">{new Date(u.created_at as string).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalUsers > 20 && (
            <div className="flex justify-center gap-2 mt-4">
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="btn-ghost text-sm">
                Previous
              </button>
              <span className="text-sm text-st3-cream/50 py-2">
                Page {page} of {Math.ceil(totalUsers / 20)}
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page >= Math.ceil(totalUsers / 20)}
                className="btn-ghost text-sm"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
