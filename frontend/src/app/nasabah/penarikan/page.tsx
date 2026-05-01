/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"
import React, { useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Search, Loader2, Banknote, Wallet } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/axios'

export default function NasabahPenarikanPage() {
  const [searchTerm, setSearchTerm] = useState('')

  const { data: dashboardData } = useQuery({
    queryKey: ['nasabahDashboard'],
    queryFn: async () => {
      const res = await api.get('/nasabah/dashboard')
      return res.data.data
    }
  })

  const { data: riwayat = [], isLoading } = useQuery({
    queryKey: ['nasabahPenarikan'],
    queryFn: async () => {
      const res = await api.get('/penarikan/me')
      return res.data.data || []
    }
  })

  const filteredRiwayat = riwayat.filter((r: any) =>
    r.status.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'menunggu': return <span className="px-2 py-1 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-[10px] rounded-full font-medium">Menunggu</span>
      case 'disetujui': return <span className="px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-[10px] rounded-full font-medium">Diproses</span>
      case 'selesai': return <span className="px-2 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-[10px] rounded-full font-medium">Selesai</span>
      case 'ditolak': return <span className="px-2 py-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-[10px] rounded-full font-medium">Ditolak</span>
      default: return <span className="px-2 py-1 bg-slate-100 text-slate-700 text-[10px] rounded-full">{status}</span>
    }
  }

  const saldo = parseFloat(dashboardData?.nasabah?.saldo || '0')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <Wallet className="h-6 w-6 text-emerald-600" />
          Riwayat Penarikan
        </h1>
        <p className="text-slate-500 text-sm">Riwayat pencairan saldo Anda. Untuk penarikan tunai, silakan datang ke loket bank sampah.</p>
      </div>

      {/* Info Saldo */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl p-6 text-white shadow-lg">
        <p className="text-sm opacity-80 font-medium">Saldo Tersedia</p>
        <p className="text-3xl font-bold mt-1">Rp {saldo.toLocaleString('id-ID')}</p>
        <div className="mt-3 bg-white/20 rounded-lg px-3 py-2 inline-flex items-center gap-2 text-sm">
          <Banknote className="h-4 w-4" />
          Datang ke loket untuk penarikan tunai
        </div>
      </div>

      <Card className="border-none shadow-sm dark:bg-slate-900">
        <CardHeader className="p-4 sm:p-6 pb-0">
          <div className="relative w-full sm:w-80 border-b pb-2">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
            <Input
              type="search"
              placeholder="Cari status..."
              className="w-full pl-9 bg-slate-50 dark:bg-slate-800 border-none shadow-inner"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0 sm:p-6 sm:pt-4">
          <div className="rounded-md border dark:border-slate-800 overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/50 dark:bg-slate-800/50">
                <TableRow>
                  <TableHead className="w-[120px]">Tanggal</TableHead>
                  <TableHead>Nominal</TableHead>
                  <TableHead>Diproses Oleh</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-10 opacity-50"><Loader2 className="animate-spin h-6 w-6 mx-auto"/></TableCell></TableRow>
                ) : filteredRiwayat.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-10 text-slate-500">Belum ada riwayat penarikan.</TableCell></TableRow>
                ) : filteredRiwayat.map((p: any) => (
                  <TableRow key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <TableCell className="text-xs text-slate-500">
                      {new Date(p.diajukanPada).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </TableCell>
                    <TableCell className="font-bold text-slate-700 dark:text-slate-300">
                      Rp {parseFloat(p.jumlah).toLocaleString('id-ID')}
                    </TableCell>
                    <TableCell className="text-sm text-slate-600 dark:text-slate-400">
                      {p.diprosesOleh ? 'Petugas' : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col items-start gap-1">
                        {getStatusBadge(p.status)}
                        {p.status === 'ditolak' && <p className="text-[10px] text-red-500 max-w-[150px]">{p.alasanTolak}</p>}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
