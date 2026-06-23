/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"
import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  Truck, Loader2, Clock, CheckCircle2, XCircle, MapPin,
  Receipt, CreditCard, Plus, Trash2, Scale
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import api from '@/lib/axios'

export default function PetugasPenjemputanPage() {
  const queryClient = useQueryClient()
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null)
  const [tagihanMode, setTagihanMode] = useState(false)
  const [details, setDetails] = useState<{ jenisSampahId: string; beratKg: string }[]>([{ jenisSampahId: '', beratKg: '' }])
  const [verifyId, setVerifyId] = useState<string | null>(null)
  const [metodeCOD, setMetodeCOD] = useState(false)

  const { data: requests, isLoading } = useQuery({
    queryKey: ['allPenjemputan'],
    queryFn: async () => {
      const res = await api.get('/penjemputan')
      return res.data.data
    },
    refetchInterval: 30000,
  })

  const { data: jenisSampahList } = useQuery({
    queryKey: ['jenisSampah'],
    queryFn: async () => {
      const res = await api.get('/jenis-sampah')
      return res.data.data
    },
  })

  const tagihanMutation = useMutation({
    mutationFn: async ({ id, details }: { id: string; details: any[] }) => {
      const res = await api.post(`/penjemputan/${id}/tagih`, { details })
      return res.data
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Tagihan berhasil dibuat! Nasabah telah dinotifikasi via WA.')
      setSelectedRequest(null)
      setTagihanMode(false)
      setDetails([{ jenisSampahId: '', beratKg: '' }])
      queryClient.invalidateQueries({ queryKey: ['allPenjemputan'] })
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'Gagal membuat tagihan'),
  })

  const terimaMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.patch(`/penjemputan/${id}/terima`)
      return res.data
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Tugas penjemputan berhasil diambil!')
      queryClient.invalidateQueries({ queryKey: ['allPenjemputan'] })
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'Gagal mengambil tugas'),
  })

  const verifikasiMutation = useMutation({
    mutationFn: async ({ id, metodePembayaran }: { id: string; metodePembayaran?: string }) => {
      const res = await api.patch(`/penjemputan/${id}/verifikasi`, { metodePembayaran })
      return res.data
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Pembayaran diverifikasi! Transaksi selesai.')
      setVerifyId(null)
      setMetodeCOD(false)
      queryClient.invalidateQueries({ queryKey: ['allPenjemputan'] })
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'Gagal verifikasi'),
  })

  const handleTagihanSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedRequest) return
    const validDetails = details.filter(d => d.jenisSampahId && d.beratKg)
    if (validDetails.length === 0) return toast.error('Minimal satu item sampah harus diisi!')
    tagihanMutation.mutate({ id: selectedRequest.id, details: validDetails })
  }

  const addDetailRow = () => setDetails(prev => [...prev, { jenisSampahId: '', beratKg: '' }])
  const removeDetailRow = (idx: number) => setDetails(prev => prev.filter((_, i) => i !== idx))
  const updateDetail = (idx: number, field: string, value: string) => {
    setDetails(prev => prev.map((d, i) => i === idx ? { ...d, [field]: value } : d))
  }

  const statusBadge = (status: string) => {
    const map: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
      menunggu: { color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: <Clock className="h-3 w-3" />, label: 'Menunggu' },
      dijemput: { color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: <Truck className="h-3 w-3" />, label: 'Dijemput' },
      selesai: { color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: <CheckCircle2 className="h-3 w-3" />, label: 'Selesai' },
      ditolak: { color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: <XCircle className="h-3 w-3" />, label: 'Ditolak' },
    }
    const s = map[status] || map.menunggu
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${s.color}`}>
        {s.icon} {s.label}
      </span>
    )
  }

  const payStatusBadge = (status: string) => {
    const map: Record<string, { color: string; label: string }> = {
      belum_dibayar: { color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', label: 'Belum Dibayar' },
      menunggu_konfirmasi: { color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', label: 'Konfirmasi Transfer' },
      lunas: { color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', label: 'Lunas ✓' },
    }
    const s = map[status] || map.belum_dibayar
    return <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${s.color}`}>{s.label}</span>
  }

  const pendingRequests = requests?.filter((r: any) => r.status === 'menunggu') || []
  const activeRequests = requests?.filter((r: any) => r.status === 'dijemput') || []
  const doneRequests = requests?.filter((r: any) => r.status === 'selesai' || r.status === 'ditolak') || []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <Truck className="h-6 w-6 text-emerald-600" />
          Kelola Penjemputan
        </h1>
        <p className="text-slate-500 text-sm mt-1">Proses permintaan penjemputan, buat tagihan, dan verifikasi pembayaran.</p>
      </div>

      {/* Dialog Buat Tagihan */}
      <Dialog open={!!selectedRequest && tagihanMode} onOpenChange={(open) => { if (!open) { setSelectedRequest(null); setTagihanMode(false); setDetails([{ jenisSampahId: '', beratKg: '' }]) } }}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-emerald-600" />
              Proses Penjemputan & Buat Tagihan
            </DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4 mt-2">
              <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 text-sm space-y-1">
                <p><span className="text-slate-500">Nasabah:</span> <span className="font-medium dark:text-white">{selectedRequest.nasabahRef?.user?.namaLengkap}</span></p>
                <p><span className="text-slate-500">Alamat:</span> <span className="dark:text-slate-300">{selectedRequest.alamat}</span></p>
                <p><span className="text-slate-500">Jenis Sampah:</span> <span className="dark:text-slate-300">{selectedRequest.jenisSampahDesc}</span></p>
              </div>

              <form onSubmit={handleTagihanSubmit} className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium">Detail Sampah Ditimbang</label>
                    <Button type="button" size="sm" variant="outline" className="h-7 text-xs" onClick={addDetailRow}>
                      <Plus className="h-3 w-3 mr-1" /> Tambah Item
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {details.map((d, idx) => (
                      <div key={idx} className="grid grid-cols-[1fr_100px_32px] gap-2 items-center">
                        <select
                          value={d.jenisSampahId}
                          onChange={(e) => updateDetail(idx, 'jenisSampahId', e.target.value)}
                          className="text-sm border border-slate-200 dark:border-slate-700 rounded-md px-2 py-1.5 bg-white dark:bg-slate-900 dark:text-white"
                        >
                          <option value="">Pilih Jenis Sampah</option>
                          {jenisSampahList?.map((j: any) => (
                            <option key={j.id} value={j.id}>
                              {j.nama} — Rp {Number(j.hargaPerKg).toLocaleString('id-ID')}/kg
                            </option>
                          ))}
                        </select>
                        <Input
                          type="number"
                          step="0.1"
                          min="0"
                          placeholder="Berat (kg)"
                          value={d.beratKg}
                          onChange={(e) => updateDetail(idx, 'beratKg', e.target.value)}
                          className="text-sm"
                        />
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-red-400 hover:text-red-600"
                          onClick={() => removeDetailRow(idx)}
                          disabled={details.length === 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Preview total */}
                {jenisSampahList && details.some(d => d.jenisSampahId && d.beratKg) && (
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3">
                    <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400 mb-1">Preview Tagihan:</p>
                    {details.filter(d => d.jenisSampahId && d.beratKg).map((d, i) => {
                      const jenis = jenisSampahList?.find((j: any) => j.id === d.jenisSampahId)
                      const nilai = Number(jenis?.hargaPerKg || 0) * Number(d.beratKg || 0)
                      return (
                        <div key={i} className="flex justify-between text-xs text-emerald-600 dark:text-emerald-400">
                          <span>{jenis?.nama} × {d.beratKg} kg</span>
                          <span>Rp {nilai.toLocaleString('id-ID')}</span>
                        </div>
                      )
                    })}
                    <div className="border-t border-emerald-200 dark:border-emerald-700 mt-1 pt-1 flex justify-between text-sm font-bold text-emerald-700 dark:text-emerald-300">
                      <span>Total</span>
                      <span>
                        Rp {details
                          .filter(d => d.jenisSampahId && d.beratKg)
                          .reduce((sum, d) => {
                            const jenis = jenisSampahList?.find((j: any) => j.id === d.jenisSampahId)
                            return sum + (Number(jenis?.hargaPerKg || 0) * Number(d.beratKg || 0))
                          }, 0)
                          .toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                )}

                <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={tagihanMutation.isPending}>
                  {tagihanMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Receipt className="h-4 w-4 mr-2" />}
                  Konfirmasi Jemput & Buat Tagihan
                </Button>
              </form>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog Verifikasi Pembayaran */}
      <Dialog open={!!verifyId} onOpenChange={(open) => !open && setVerifyId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-blue-600" />
              Verifikasi Pembayaran
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            {verifyId && requests && (() => {
              const req = requests.find((r: any) => r.id === verifyId)
              return req ? (
                <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 text-sm">
                  <p className="text-slate-500">Total Tagihan:</p>
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    Rp {Number(req.totalBiaya).toLocaleString('id-ID')}
                  </p>
                  <p className="text-slate-500 text-xs mt-1">Nasabah: {req.nasabahRef?.user?.namaLengkap}</p>
                  {req.metodePembayaran === 'cod' && (
                    <div className="mt-2 bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-400 px-2 py-1.5 rounded-md text-xs font-semibold">
                      Nasabah telah memilih metode pembayaran COD (Tunai).
                    </div>
                  )}
                  {req.metodePembayaran === 'transfer' && req.buktiPembayaran && (
                    <div className="mt-2 space-y-1">
                      <p className="text-xs text-slate-500 flex items-center gap-1"><CreditCard className="h-3 w-3" /> Bukti Transfer:</p>
                      <a href={req.buktiPembayaran} target="_blank" rel="noopener noreferrer">
                        <img 
                          src={req.buktiPembayaran} 
                          alt="Bukti Transfer" 
                          className="max-h-48 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer hover:opacity-90 transition-opacity" 
                        />
                      </a>
                    </div>
                  )}
                </div>
              ) : null
            })()}

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isCOD"
                checked={metodeCOD}
                onChange={(e) => setMetodeCOD(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              <label htmlFor="isCOD" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Konfirmasi Pembayaran Lunas (Termasuk COD Tunai)
              </label>
            </div>

            <Button
              className="w-full bg-emerald-600 hover:bg-emerald-700"
              disabled={verifikasiMutation.isPending}
              onClick={() => verifyId && verifikasiMutation.mutate({ id: verifyId, metodePembayaran: metodeCOD ? 'cod' : undefined })}
            >
              {verifikasiMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
              Tandai Lunas & Selesaikan
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Permintaan Baru */}
      <Card className="border-none shadow-sm dark:bg-slate-900">
        <CardHeader className="pb-3">
          <CardTitle className="text-base dark:text-white flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-500" />
            Permintaan Baru
            {pendingRequests.length > 0 && (
              <span className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-xs px-2 py-0.5 rounded-full font-medium">
                {pendingRequests.length}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-emerald-500" /></div>
          ) : pendingRequests.length === 0 ? (
            <p className="text-sm text-center text-slate-500 py-6">Tidak ada permintaan baru.</p>
          ) : (
            <div className="space-y-3">
              {pendingRequests.map((r: any) => (
                <div key={r.id} className="p-4 rounded-xl border border-amber-200 dark:border-amber-800/50 bg-amber-50/50 dark:bg-amber-900/10">
                  <div className="flex flex-col sm:flex-row justify-between gap-3">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-semibold dark:text-white">{r.nasabahRef?.user?.namaLengkap}</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">{r.alamat}</p>
                        <p className="text-xs text-slate-500 mt-0.5">🗑️ {r.jenisSampahDesc} {r.estimasiBerat ? `— ${r.estimasiBerat}` : ''}</p>
                        {r.tanggalJadwal && (
                          <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
                            🗓️ Jadwal: {new Date(r.tanggalJadwal).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 self-start"
                      onClick={() => terimaMutation.mutate(r.id)}
                      disabled={terimaMutation.isPending}
                    >
                      <Truck className="h-3.5 w-3.5 mr-1.5" /> Ambil Tugas Jemput
                    </Button>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2">
                    {new Date(r.tanggalRequest).toLocaleString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dalam Proses & Tagihan */}
      <Card className="border-none shadow-sm dark:bg-slate-900">
        <CardHeader className="pb-3">
          <CardTitle className="text-base dark:text-white flex items-center gap-2">
            <Receipt className="h-4 w-4 text-blue-500" />
            Dalam Proses & Tagihan
            {activeRequests.length > 0 && (
              <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-xs px-2 py-0.5 rounded-full font-medium">
                {activeRequests.length}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-emerald-500" /></div>
          ) : activeRequests.length === 0 ? (
            <p className="text-sm text-center text-slate-500 py-6">Tidak ada tagihan yang menunggu.</p>
          ) : (
            <div className="space-y-3">
              {activeRequests.map((r: any) => (
                <div key={r.id} className="p-4 rounded-xl border dark:border-slate-700 bg-white dark:bg-slate-800/50">
                  <div className="flex flex-col sm:flex-row justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-semibold dark:text-white">{r.nasabahRef?.user?.namaLengkap}</p>
                        {payStatusBadge(r.statusPembayaran)}
                      </div>
                      <p className="text-xs text-slate-500">{r.alamat}</p>
                      <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                        Rp {Number(r.totalBiaya || 0).toLocaleString('id-ID')}
                      </p>
                      {r.buktiPembayaran && (
                        <a href={r.buktiPembayaran} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 mt-1">
                          <CreditCard className="h-3 w-3" /> Lihat Bukti Transfer
                        </a>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      {Number(r.totalBiaya || 0) === 0 && (
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 self-start"
                          onClick={() => { setSelectedRequest(r); setTagihanMode(true) }}
                        >
                          <Scale className="h-3.5 w-3.5 mr-1.5" /> Proses & Tagih
                        </Button>
                      )}
                      {Number(r.totalBiaya || 0) > 0 && r.statusPembayaran !== 'lunas' && (
                        <Button
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-white shrink-0 self-start w-full"
                          onClick={() => setVerifyId(r.id)}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" /> Verifikasi
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Riwayat */}
      {doneRequests.length > 0 && (
        <Card className="border-none shadow-sm dark:bg-slate-900">
          <CardHeader className="pb-3">
            <CardTitle className="text-base dark:text-white flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              Riwayat Selesai
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {doneRequests.slice(0, 10).map((r: any) => (
                <div key={r.id} className="flex justify-between items-center p-3 rounded-lg border dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 text-sm">
                  <div>
                    <p className="font-medium dark:text-white">{r.nasabahRef?.user?.namaLengkap}</p>
                    <p className="text-xs text-slate-500">{r.jenisSampahDesc}</p>
                  </div>
                  <div className="text-right">
                    {statusBadge(r.status)}
                    {r.totalBiaya && Number(r.totalBiaya) > 0 && (
                      <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
                        Rp {Number(r.totalBiaya).toLocaleString('id-ID')}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
