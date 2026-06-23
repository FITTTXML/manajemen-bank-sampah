/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"
import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Truck, Search, Loader2, MapPin, Clock, CheckCircle2, XCircle, CreditCard, Receipt, Scale } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/axios'

export default function AdminPenjemputanPage() {
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterPay, setFilterPay] = useState('all')
  const [detail, setDetail] = useState<any | null>(null)

  const { data: requests, isLoading } = useQuery({
    queryKey: ['adminPenjemputan'],
    queryFn: async () => {
      const res = await api.get('/penjemputan')
      return res.data.data
    },
    refetchInterval: 60000,
  })

  const filtered = (requests || []).filter((r: any) => {
    const matchSearch = !search ||
      r.nasabahRef?.user?.namaLengkap?.toLowerCase().includes(search.toLowerCase()) ||
      r.alamat?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'all' || r.status === filterStatus
    const matchPay = filterPay === 'all' || r.statusPembayaran === filterPay
    return matchSearch && matchStatus && matchPay
  })

  const statusBadge = (status: string) => {
    const map: Record<string, { variant: any; label: string; icon: React.ReactNode }> = {
      menunggu: { variant: 'secondary', label: 'Menunggu', icon: <Clock className="h-3 w-3" /> },
      dijemput: { variant: 'default', label: 'Dijemput', icon: <Truck className="h-3 w-3" /> },
      selesai: { variant: 'outline', label: 'Selesai', icon: <CheckCircle2 className="h-3 w-3" /> },
      ditolak: { variant: 'destructive', label: 'Ditolak', icon: <XCircle className="h-3 w-3" /> },
    }
    const s = map[status] || map.menunggu
    return (
      <Badge variant={s.variant} className={`gap-1 ${status === 'selesai' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200' : status === 'dijemput' ? 'bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200' : ''}`}>
        {s.icon} {s.label}
      </Badge>
    )
  }

  const payBadge = (status: string) => {
    const map: Record<string, { color: string; label: string }> = {
      belum_dibayar: { color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', label: 'Belum Dibayar' },
      menunggu_konfirmasi: { color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', label: 'Perlu Konfirmasi' },
      lunas: { color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', label: 'Lunas' },
    }
    if (!status) return null
    const s = map[status] || map.belum_dibayar
    return <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${s.color}`}>{s.label}</span>
  }

  // Summary stats
  const total = requests?.length || 0
  const menunggu = requests?.filter((r: any) => r.status === 'menunggu').length || 0
  const perluKonfirmasi = requests?.filter((r: any) => r.statusPembayaran === 'menunggu_konfirmasi').length || 0
  const totalPendapatan = requests?.filter((r: any) => r.statusPembayaran === 'lunas')
    .reduce((sum: number, r: any) => sum + Number(r.totalBiaya || 0), 0) || 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <Truck className="h-6 w-6 text-blue-600" />
          Data Penjemputan
        </h1>
        <p className="text-slate-500 text-sm mt-1">Monitor semua permintaan penjemputan, status pembayaran, dan rekap pendapatan jasa.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Permintaan', value: total, color: 'text-slate-700 dark:text-slate-200', bg: 'bg-slate-100 dark:bg-slate-800' },
          { label: 'Menunggu Petugas', value: menunggu, color: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20' },
          { label: 'Perlu Konfirmasi', value: perluKonfirmasi, color: 'text-blue-700 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
          { label: 'Total Pendapatan', value: `Rp ${totalPendapatan.toLocaleString('id-ID')}`, color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
        ].map((s, i) => (
          <Card key={i} className={`border-none shadow-sm ${s.bg}`}>
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-slate-500 dark:text-slate-400">{s.label}</p>
              <p className={`text-xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!detail} onOpenChange={(open) => !open && setDetail(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-emerald-600" />
              Detail Penjemputan
            </DialogTitle>
          </DialogHeader>
          {detail && (
            <div className="space-y-4 mt-2 text-sm">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                <div>
                  <p className="text-xs text-slate-400">Nasabah</p>
                  <p className="font-semibold dark:text-white">{detail.nasabahRef?.user?.namaLengkap}</p>
                  <p className="text-xs text-slate-500">{detail.nasabahRef?.noAnggota}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Petugas</p>
                  <p className="font-semibold dark:text-white">{detail.petugasRef?.namaLengkap || '—'}</p>
                </div>
              </div>
              
              <div>
                <p className="text-xs text-slate-400 mb-1">Alamat Penjemputan</p>
                <p className="flex items-start gap-1.5 dark:text-slate-300"><MapPin className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />{detail.alamat}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-slate-400">Jenis Sampah</p>
                  <p className="dark:text-slate-300">{detail.jenisSampahDesc}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Estimasi</p>
                  <p className="dark:text-slate-300">{detail.estimasiBerat || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Tanggal Jadwal</p>
                  <p className="dark:text-slate-300">
                    {detail.tanggalJadwal ? new Date(detail.tanggalJadwal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Tanggal Dijemput</p>
                  <p className="dark:text-slate-300">
                    {detail.tanggalJemput ? new Date(detail.tanggalJemput).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
                  </p>
                </div>
              </div>

              <div className="border-t dark:border-slate-700 pt-3">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs text-slate-400">Status Penjemputan</p>
                    {statusBadge(detail.status)}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400">Status Pembayaran</p>
                    {payBadge(detail.statusPembayaran)}
                  </div>
                </div>
              </div>

              {detail.totalBiaya && Number(detail.totalBiaya) > 0 && (
                <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5">
                      <Scale className="h-4 w-4 text-emerald-600" />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Total Tagihan</span>
                    </div>
                    <span className="text-lg font-bold text-emerald-700 dark:text-emerald-400">
                      Rp {Number(detail.totalBiaya).toLocaleString('id-ID')}
                    </span>
                  </div>
                  {detail.metodePembayaran && (
                    <p className="text-xs text-slate-500 mt-1">Metode: <span className="capitalize font-medium">{detail.metodePembayaran}</span></p>
                  )}
                  {detail.buktiPembayaran && (
                    <a href={detail.buktiPembayaran} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline mt-2">
                      <CreditCard className="h-3 w-3" /> Lihat Bukti Transfer
                    </a>
                  )}
                </div>
              )}

              {/* Detail items */}
              {detail.details && detail.details.length > 0 && (
                <div>
                  <p className="text-xs text-slate-400 mb-2">Rincian Sampah</p>
                  <div className="space-y-1">
                    {detail.details.map((d: any, i: number) => (
                      <div key={i} className="flex justify-between text-xs bg-slate-50 dark:bg-slate-800 rounded px-2 py-1.5">
                        <span className="text-slate-600 dark:text-slate-300">{d.jenisSampah?.nama} × {d.beratKg} kg</span>
                        <span className="font-medium text-slate-800 dark:text-slate-200">Rp {Number(d.nilai).toLocaleString('id-ID')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {detail.catatan && (
                <p className="text-xs text-slate-500">📝 {detail.catatan}</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Table */}
      <Card className="border-none shadow-sm dark:bg-slate-900">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Cari nama nasabah atau alamat..."
                className="pl-9 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-44 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                <SelectValue placeholder="Status Penjemputan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="menunggu">Menunggu</SelectItem>
                <SelectItem value="dijemput">Dijemput</SelectItem>
                <SelectItem value="selesai">Selesai</SelectItem>
                <SelectItem value="ditolak">Ditolak</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterPay} onValueChange={setFilterPay}>
              <SelectTrigger className="w-full sm:w-48 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                <SelectValue placeholder="Status Pembayaran" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Pembayaran</SelectItem>
                <SelectItem value="belum_dibayar">Belum Dibayar</SelectItem>
                <SelectItem value="menunggu_konfirmasi">Perlu Konfirmasi</SelectItem>
                <SelectItem value="lunas">Lunas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/50 dark:bg-slate-800/50">
                <TableRow>
                  <TableHead className="w-12">No</TableHead>
                  <TableHead>Nasabah</TableHead>
                  <TableHead>Alamat</TableHead>
                  <TableHead>Jadwal</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Pembayaran</TableHead>
                  <TableHead className="text-right">Tagihan</TableHead>
                  <TableHead className="w-20">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-12 opacity-50"><Loader2 className="animate-spin h-6 w-6 mx-auto" /></TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-12 text-slate-500">Tidak ada data penjemputan.</TableCell></TableRow>
                ) : filtered.map((r: any, i: number) => (
                  <TableRow key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <TableCell className="text-slate-400 text-sm">{i + 1}</TableCell>
                    <TableCell>
                      <p className="font-medium text-sm dark:text-white">{r.nasabahRef?.user?.namaLengkap}</p>
                      <p className="text-xs text-slate-400">{r.nasabahRef?.noAnggota}</p>
                    </TableCell>
                    <TableCell className="max-w-[180px]">
                      <p className="text-xs text-slate-600 dark:text-slate-400 truncate">{r.alamat}</p>
                      <p className="text-xs text-slate-400 truncate">{r.jenisSampahDesc}</p>
                    </TableCell>
                    <TableCell className="text-xs text-slate-500 dark:text-slate-400">
                      {r.tanggalJadwal
                        ? new Date(r.tanggalJadwal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
                        : <span className="text-slate-300 dark:text-slate-600">—</span>}
                    </TableCell>
                    <TableCell>{statusBadge(r.status)}</TableCell>
                    <TableCell>{r.statusPembayaran ? payBadge(r.statusPembayaran) : <span className="text-slate-300 dark:text-slate-600 text-xs">—</span>}</TableCell>
                    <TableCell className="text-right">
                      {Number(r.totalBiaya) > 0
                        ? <span className="font-semibold text-sm text-emerald-600 dark:text-emerald-400">Rp {Number(r.totalBiaya).toLocaleString('id-ID')}</span>
                        : <span className="text-slate-300 dark:text-slate-600 text-xs">—</span>}
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setDetail(r)}>
                        Detail
                      </Button>
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
