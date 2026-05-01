/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"
import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Truck, Plus, Loader2, Clock, CheckCircle2, XCircle, MapPin } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import api from '@/lib/axios'

export default function PenjemputanPage() {
  const queryClient = useQueryClient()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [form, setForm] = useState({
    alamat: '',
    jenisSampahDesc: '',
    estimasiBerat: '',
    catatan: '',
  })

  const { data: requests, isLoading } = useQuery({
    queryKey: ['myPenjemputan'],
    queryFn: async () => {
      const res = await api.get('/penjemputan/me')
      return res.data.data
    },
  })

  const submitMutation = useMutation({
    mutationFn: async (payload: typeof form) => {
      const res = await api.post('/penjemputan', payload)
      return res.data
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Pengajuan berhasil dikirim!')
      setIsDialogOpen(false)
      setForm({ alamat: '', jenisSampahDesc: '', estimasiBerat: '', catatan: '' })
      queryClient.invalidateQueries({ queryKey: ['myPenjemputan'] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Gagal mengirim pengajuan')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.alamat || !form.jenisSampahDesc) {
      return toast.error('Alamat dan jenis sampah harus diisi!')
    }
    submitMutation.mutate(form)
  }

  const statusBadge = (status: string) => {
    const map: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
      menunggu: { color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: <Clock className="h-3 w-3" />, label: 'Menunggu' },
      dijemput: { color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: <Truck className="h-3 w-3" />, label: 'Sedang Dijemput' },
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Truck className="h-6 w-6 text-emerald-600" />
            Jemput Sampah
          </h1>
          <p className="text-slate-500 text-sm">Ajukan permintaan pengambilan sampah ke rumah Anda. Petugas akan diberitahu via WhatsApp.</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="shrink-0 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
              <Plus className="h-4 w-4" />
              Ajukan Jemput Sampah
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
                <label className="text-sm font-medium">Jenis Sampah *</label>
                <Input
                  placeholder="Contoh: Kardus, botol plastik, kaleng..."
                  value={form.jenisSampahDesc}
                  onChange={(e) => setForm({ ...form, jenisSampahDesc: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Estimasi Berat</label>
                <Input
                  placeholder="Contoh: 5 kg, 1 karung..."
                  value={form.estimasiBerat}
                  onChange={(e) => setForm({ ...form, estimasiBerat: e.target.value })}
                />
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
              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={submitMutation.isPending}>
                {submitMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Truck className="h-4 w-4 mr-2" />}
                Kirim Pengajuan & Notifikasi Petugas
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

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
              <p className="text-sm">Klik tombol &ldquo;Ajukan Jemput Sampah&rdquo; untuk memulai.</p>
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
                    {statusBadge(r.status)}
                  </div>
                  {r.catatan && <p className="text-xs text-slate-500 ml-6">📝 {r.catatan}</p>}
                  {r.alasanTolak && <p className="text-xs text-red-500 ml-6 mt-1">❌ Alasan ditolak: {r.alasanTolak}</p>}
                  <p className="text-[10px] text-slate-400 mt-2 ml-6">
                    {new Date(r.tanggalRequest).toLocaleString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
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
