/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"
import React from 'react'
import api from '@/lib/axios'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, TrendingUp, Weight, Truck, Loader2 } from 'lucide-react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts'

export default function AdminDashboardPage() {
  const { data: dashboardData, isLoading: loading } = useQuery({
    queryKey: ['adminDashboard'],
    queryFn: async () => {
      const [resStats, resCharts] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/laporan')
      ]);
      return {
        stats: resStats.data.data,
        chartData: resCharts.data.data
      }
    }
  });

  const stats = dashboardData?.stats || {
    totalNasabah: 0,
    totalBeratSampah: 0,
    totalPendapatan: 0
  };

  const chartData = dashboardData?.chartData || {
    trenMingguan: [],
    distribusiKategori: []
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Dashboard</h1>
        <p className="text-slate-500 dark:text-slate-400">Ringkasan kondisi bank sampah hari ini.</p>
      </div>

      {/* METRIC CARDS */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm border-none bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-900">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Nasabah Aktif</CardTitle>
            <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg"><Users className="h-4 w-4 text-blue-600 dark:text-blue-400" /></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800 dark:text-white">{stats.totalNasabah}</div>
            <p className="text-xs text-green-500 mt-1 font-medium">Nasabah terdaftar</p>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm border-none bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-900">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Pendapatan Jasa</CardTitle>
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/40 rounded-lg"><TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800 dark:text-white">Rp {(stats.totalPendapatan || 0).toLocaleString('id-ID')}</div>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Pembayaran lunas terkumpul</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-none bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-900">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Berat Sampah</CardTitle>
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/40 rounded-lg"><Weight className="h-4 w-4 text-indigo-600 dark:text-indigo-400" /></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800 dark:text-white">{stats.totalBeratSampah} Kg</div>
            <p className="text-xs text-green-500 mt-1 font-medium">Total berat dari seluruh riwayat</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-none bg-gradient-to-br from-white to-blue-50 dark:from-slate-900 dark:to-slate-900">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">Data Penjemputan</CardTitle>
            <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg"><Truck className="h-4 w-4 text-blue-600 dark:text-blue-400" /></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">
              <a href="/admin/penjemputan" className="hover:underline">Lihat →</a>
            </div>
            <p className="text-xs text-blue-500 dark:text-blue-400 mt-1 font-medium">Pantau status penjemputan</p>
          </CardContent>
        </Card>
      </div>

      {/* CHARTS */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="shadow-sm border-none dark:bg-slate-900">
          <CardHeader>
            <CardTitle className="text-base dark:text-white">Tren Penjemputan Mingguan (Kg)</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {loading ? (
              <div className="w-full h-full flex justify-center items-center"><Loader2 className="h-8 w-8 animate-spin text-slate-400"/></div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData.trenMingguan} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.2} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} formatter={(value: any) => `${value} Kg`} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                  <Line type="monotone" dataKey="kertas" stroke="#3b82f6" strokeWidth={2} dot={false} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="plastik" stroke="#eab308" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="organik" stroke="#22c55e" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="logam" stroke="#f97316" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm border-none dark:bg-slate-900">
          <CardHeader>
            <CardTitle className="text-base dark:text-white">Perbandingan Volume per Jenis (Kg)</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {loading ? (
               <div className="w-full h-full flex justify-center items-center"><Loader2 className="h-8 w-8 animate-spin text-slate-400"/></div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.trenMingguan} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.2} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <Tooltip cursor={{ fill: '#334155', opacity: 0.2 }} contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="plastik" fill="#eab308" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="kertas" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="organik" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="logam" fill="#f97316" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
      
    </div>
  )
}
