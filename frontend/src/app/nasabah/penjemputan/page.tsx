/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"
import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Truck, Plus, Loader2, Clock, CheckCircle2, XCircle, MapPin, CreditCard, Upload, Receipt, Wallet } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import api from '@/lib/axios'

export default function PenjemputanPage() {
  const queryClient = useQueryClient()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [payDialogId, setPayDialogId] = useState<string | null>(null)
  const [buktiFile, setBuktiFile] = useState<File | null>(null)
  const [buktiPreview, setBuktiPreview] = useState<string | null>(null)
  const [selectedJenis, setSelectedJenis] = useState<string[]>([])
  const [form, setForm] = useState({
    alamat: '',
    estimasiBerat: '',
    catatan: '',
    tanggalJadwal: '',
  })

  const { data: requests, isLoading } = useQuery({
    queryKey: ['myPenjemputan'],
    queryFn: async () => {
      const res = await api.get('/penjemputan/me')
      return res.data.data
    },
  })

  const { data: jenisSampahList } = useQuery({
    queryKey: ['jenisSampah'],
    queryFn: async () => {
      const res = await api.get('/jenis-sampah')
      return res.data.data
    },
  })

  const submitMutation = useMutation({
    mutationFn: async (payload: typeof form & { jenisSampahDesc?: string }) => {
      const res = await api.post('/penjemputan', payload)
      return res.data
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Pengajuan berhasil dikirim! Petugas akan dihubungi via WA.')
      setIsDialogOpen(false)
      setForm({ alamat: '', estimasiBerat: '', catatan: '', tanggalJadwal: '' })
      setSelectedJenis([])
      queryClient.invalidateQueries({ queryKey: ['myPenjemputan'] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Gagal mengirim pengajuan')
    },
  })

  const payMutation = useMutation({
    mutationFn: async ({ id, file, metodePembayaran }: { id: string; file?: File; metodePembayaran?: string }) => {
      if (metodePembayaran === 'cod') {
        const res = await api.post(`/penjemputan/${id}/bayar`, { metodePembayaran: 'cod' })
        return res.data
      }
      // Transfer: send file as FormData
      const formData = new FormData()
      formData.append('metodePembayaran', 'transfer')
      if (file) formData.append('buktiPembayaran', file)
      const res = await api.post(`/penjemputan/${id}/bayar`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      return res.data
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Pembayaran berhasil dikonfirmasi!')
      setPayDialogId(null)
      setBuktiFile(null)
      setBuktiPreview(null)
      queryClient.invalidateQueries({ queryKey: ['myPenjemputan'] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Gagal mengirim pembayaran')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.alamat || selectedJenis.length === 0) {
      return toast.error('Alamat dan minimal 1 jenis sampah harus diisi!')
    }
    submitMutation.mutate({ ...form, jenisSampahDesc: selectedJenis.join(', ') })
  }

  const handlePaySubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!buktiFile || !payDialogId) return toast.error('Screenshot bukti transfer wajib diupload!')
    payMutation.mutate({ id: payDialogId, file: buktiFile, metodePembayaran: 'transfer' })
  }

  const handleSelectCOD = (id: string) => {
    payMutation.mutate({ id, metodePembayaran: 'cod' })
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Ukuran file maksimal 5MB')
        return
      }
      setBuktiFile(file)
      setBuktiPreview(URL.createObjectURL(file))
    }
  }

  const statusBadge = (status: string) => {
    const map: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
      menunggu: { color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: <Clock className="h-3 w-3" />, label: 'Menunggu Petugas' },
      dijemput: { color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: <Truck className="h-3 w-3" />, label: 'Sudah Dijemput' },
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
      menunggu_konfirmasi: { color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', label: 'Menunggu Konfirmasi' },
      lunas: { color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', label: 'Lunas ✓' },
    }
    const s = map[status] || map.belum_dibayar
    return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${s.color}`}>{s.label}</span>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Truck className="h-6 w-6 text-emerald-600" />
            Layanan Jemput Sampah
          </h1>
          <p className="text-slate-500 text-sm mt-1">Ajukan penjemputan sampah ke rumah Anda. Petugas akan dinotifikasi via WhatsApp.</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="shrink-0 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
              <Plus className="h-4 w-4" />
              Ajukan Penjemputan
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-emerald-600" />
                Form Pengajuan Jemput Sampah
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Alamat Lengkap Penjemputan *</label>
                <Textarea
                  placeholder="Contoh: Jl. Melati No. 12, RT 03/RW 05, Kel. Sukamaju..."
                  value={form.alamat}
                  onChange={(e) => setForm({ ...form, alamat: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Jenis Sampah (Pilih minimal 1) *</label>
                <div className="flex flex-wrap gap-2">
                  {jenisSampahList?.filter((j: any) => j.aktif).map((j: any) => {
                    const isSelected = selectedJenis.includes(j.nama)
                    return (
                      <div
                        key={j.id}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedJenis(prev => prev.filter(name => name !== j.nama))
                          } else {
                            setSelectedJenis(prev => [...prev, j.nama])
                          }
                        }}
                        className={`cursor-pointer px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                          isSelected 
                            ? 'bg-emerald-100 border-emerald-500 text-emerald-700 dark:bg-emerald-900/40 dark:border-emerald-500 dark:text-emerald-400' 
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-400'
                        }`}
                      >
                        {j.nama}
                      </div>
                    )
                  })}
                  {jenisSampahList?.length === 0 && (
                    <p className="text-xs text-slate-500">Tidak ada jenis sampah yang aktif di katalog.</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Estimasi Berat</label>
                  <Input
                    placeholder="Contoh: 5 kg"
                    value={form.estimasiBerat}
                    onChange={(e) => setForm({ ...form, estimasiBerat: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tanggal Jadwal</label>
                  <Input
                    type="datetime-local"
                    value={form.tanggalJadwal}
                    onChange={(e) => setForm({ ...form, tanggalJadwal: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Catatan Tambahan</label>
                <Textarea
                  placeholder="Info tambahan untuk petugas..."
                  value={form.catatan}
                  onChange={(e) => setForm({ ...form, catatan: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-xs text-amber-700 dark:text-amber-400">
                ℹ️ Setelah sampah ditimbang, petugas akan membuat tagihan. Anda dapat membayar via <strong>COD</strong> (langsung ke petugas) atau <strong>Transfer Bank</strong>.
              </div>
              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={submitMutation.isPending}>
                {submitMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Truck className="h-4 w-4 mr-2" />}
                Kirim Pengajuan & Notifikasi Petugas
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Dialog Upload Bukti Transfer */}
      <Dialog open={!!payDialogId} onOpenChange={(open) => !open && setPayDialogId(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-blue-600" />
              Upload Bukti Transfer
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handlePaySubmit} className="space-y-4 mt-2">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Setelah melakukan transfer, upload screenshot bukti pembayaran Anda.
            </p>
            <div className="space-y-2">
              <label className="text-sm font-medium">Screenshot Bukti Transfer *</label>
              <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-4 text-center">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                  id="bukti-upload"
                />
                <label htmlFor="bukti-upload" className="cursor-pointer">
                  {buktiPreview ? (
                    <div className="space-y-2">
                      <img src={buktiPreview} alt="Preview" className="max-h-48 mx-auto rounded-lg border" />
                      <p className="text-xs text-slate-500">Klik untuk ganti foto</p>
                    </div>
                  ) : (
                    <div className="py-4 space-y-2">
                      <Upload className="h-8 w-8 text-slate-400 mx-auto" />
                      <p className="text-sm text-slate-500">Klik untuk pilih foto dari galeri</p>
                      <p className="text-xs text-slate-400">JPG, PNG, atau WebP (maks 5MB)</p>
                    </div>
                  )}
                </label>
              </div>
            </div>
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={payMutation.isPending || !buktiFile}>
              {payMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
              Kirim Bukti Transfer
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Riwayat */}
      <Card className="border-none shadow-sm dark:bg-slate-900">
        <CardHeader>
          <CardTitle className="text-base dark:text-white">Riwayat Pengajuan</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-12 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-emerald-500" /></div>
          ) : !requests?.length ? (
            <div className="py-12 text-center text-slate-500 dark:text-slate-400">
              <Truck className="h-12 w-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
              <p className="font-medium">Belum ada pengajuan</p>
              <p className="text-sm">Klik tombol &ldquo;Ajukan Penjemputan&rdquo; untuk memulai.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map((r: any) => (
                <div key={r.id} className="p-4 rounded-xl border dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 hover:shadow-sm transition-all">
                  <div className="flex flex-col sm:flex-row justify-between gap-2 mb-2">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-medium dark:text-white">{r.alamat}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{r.jenisSampahDesc} — {r.estimasiBerat || 'Berat tidak disebutkan'}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {statusBadge(r.status)}
                      {r.statusPembayaran && payStatusBadge(r.statusPembayaran)}
                    </div>
                  </div>

                  {/* Tagihan */}
                  {r.totalBiaya && Number(r.totalBiaya) > 0 && (
                    <div className="mt-2 ml-6 p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                          <Receipt className="h-3.5 w-3.5 text-emerald-500" />
                          <span className="font-medium">Total Tagihan:</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            Rp {Number(r.totalBiaya).toLocaleString('id-ID')}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          {r.metodePembayaran && <span className="capitalize bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">{r.metodePembayaran}</span>}
                        </div>
                      </div>

                      {/* Tombol bayar jika belum dibayar, ATAU jika metode cod tapi masih belum lunas */}
                      {r.statusPembayaran === 'belum_dibayar' && r.status === 'dijemput' && (
                        <div className="mt-2 flex gap-2">
                          {(!r.metodePembayaran || r.metodePembayaran === 'transfer') && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs h-7 border-blue-300 text-blue-600 hover:bg-blue-50"
                              onClick={() => setPayDialogId(r.id)}
                            >
                              <Upload className="h-3 w-3 mr-1" /> Upload Bukti Transfer
                            </Button>
                          )}
                          {!r.metodePembayaran && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs h-7 border-emerald-300 text-emerald-600 hover:bg-emerald-50"
                              onClick={() => handleSelectCOD(r.id)}
                              disabled={payMutation.isPending}
                            >
                              <Wallet className="h-3 w-3 mr-1" /> Pilih COD
                            </Button>
                          )}
                          {r.metodePembayaran === 'cod' && (
                            <p className="text-xs text-slate-500 self-center italic">
                              Metode COD dipilih. Silakan siapkan uang tunai.
                            </p>
                          )}
                        </div>
                      )}

                      {/* Bukti sudah diupload */}
                      {r.buktiPembayaran && (
                        <div className="mt-2 space-y-1">
                          <p className="text-xs text-slate-500 flex items-center gap-1"><CreditCard className="h-3 w-3" /> Bukti Transfer Anda:</p>
                          <img 
                            src={r.buktiPembayaran} 
                            alt="Bukti Transfer" 
                            className="max-h-32 rounded-lg border border-slate-200 dark:border-slate-700" 
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {r.catatan && <p className="text-xs text-slate-500 ml-6 mt-1">📝 {r.catatan}</p>}
                  {r.alasanTolak && <p className="text-xs text-red-500 ml-6 mt-1">❌ Alasan ditolak: {r.alasanTolak}</p>}
                  {r.tanggalJadwal && (
                    <p className="text-xs text-slate-400 ml-6 mt-1">
                      🗓️ Jadwal: {new Date(r.tanggalJadwal).toLocaleString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                  <p className="text-[10px] text-slate-400 mt-2 ml-6">
                    Diajukan: {new Date(r.tanggalRequest).toLocaleString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
