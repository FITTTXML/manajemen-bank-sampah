"use client"
import React, { useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Search, Loader2, MessageSquareWarning, Send, Phone, CheckCircle2 } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Checkbox } from '@/components/ui/checkbox'
import api from '@/lib/axios'

export default function AdminPengaduanPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedLaporan, setSelectedLaporan] = useState<any>(null)
  const [tanggapanText, setTanggapanText] = useState('')
  const [kirimWa, setKirimWa] = useState(true)

  const queryClient = useQueryClient()

  const { data: laporanList = [], isLoading } = useQuery({
    queryKey: ['adminPengaduan'],
    queryFn: async () => {
      const res = await api.get('/pengaduan/all')
      return res.data.data || []
    }
  })

  const mutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.put(`/pengaduan/${selectedLaporan.id}/balas`, payload)
      return res.data
    },
    onSuccess: () => {
      toast.success("Tanggapan berhasil dikirim dan laporan ditutup.")
      setSelectedLaporan(null)
      queryClient.invalidateQueries({ queryKey: ['adminPengaduan'] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Gagal membalas laporan")
    }
  })

  const handleBalas = () => {
    if (!tanggapanText.trim()) return toast.error("Tanggapan tidak boleh kosong")
    mutation.mutate({ tanggapan: tanggapanText, kirimWa })
  }

  const openDialog = (laporan: any) => {
    setSelectedLaporan(laporan)
    if (laporan.tanggapan) {
      setTanggapanText(laporan.tanggapan)
    } else {
      setTanggapanText('')
    }
    setKirimWa(true)
  }

  const filtered = laporanList.filter((r: any) => 
    r.subjek.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.pengirimNama?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'menunggu_tanggapan': return <span className="px-2 py-1 bg-amber-100 text-amber-700 text-[10px] rounded-full uppercase font-medium">Menunggu</span>
      case 'diproses': return <span className="px-2 py-1 bg-blue-100 text-blue-700 text-[10px] rounded-full uppercase font-medium">Diproses</span>
      case 'selesai': return <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-[10px] rounded-full uppercase font-medium">Selesai</span>
      default: return <span className="px-2 py-1 bg-slate-100 text-slate-700 text-[10px] rounded-full uppercase">{status}</span>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Daftar Pengaduan / Keluhan</h1>
          <p className="text-slate-500 text-sm">Respon keluhan nasabah jika terjadi kendala pada sistem.</p>
        </div>
      </div>

      <Dialog open={!!selectedLaporan} onOpenChange={(open) => !open && setSelectedLaporan(null)}>
        <DialogContent className="max-w-xl">
           <DialogHeader>
             <DialogTitle>Detail Pengaduan</DialogTitle>
           </DialogHeader>
           {selectedLaporan && (
             <div className="space-y-4 mt-2">
                <div className="flex justify-between items-start">
                   <div>
                     <h3 className="font-bold text-lg">{selectedLaporan.subjek}</h3>
                     <p className="text-xs text-slate-500">Dari: {selectedLaporan.pengirimNama} ({selectedLaporan.pengirimHp})</p>
                   </div>
                   {getStatusBadge(selectedLaporan.status)}
                </div>

                <div className="bg-amber-50 dark:bg-amber-900/10 p-4 border border-amber-100 dark:border-amber-800/30 rounded-lg text-amber-900 dark:text-amber-100 text-sm">
                   {selectedLaporan.pesan}
                </div>

                {selectedLaporan.status === 'selesai' ? (
                  <div className="space-y-2 mt-4">
                     <label className="text-sm font-semibold flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500"/> Tanggapan Sebelumnya:</label>
                     <Textarea readOnly value={selectedLaporan.tanggapan} className="bg-slate-50" />
                     <Button className="w-full mt-2" variant="outline" onClick={() => setSelectedLaporan(null)}>Tutup</Button>
                  </div>
                ) : (
                  <div className="space-y-3 mt-6 border-t pt-4">
                     <label className="text-sm font-semibold">Tanggapan Admin:</label>
                     <Textarea 
                       placeholder="Halo, permohonan Anda sudah kami periksa..." 
                       value={tanggapanText} 
                       onChange={(e) => setTanggapanText(e.target.value)}
                       className="min-h-[100px]"
                     />
                     <div className="flex items-center space-x-2 pb-2">
                       <Checkbox id="kirimwa" checked={kirimWa} onCheckedChange={(v) => setKirimWa(v as boolean)} />
                       <label htmlFor="kirimwa" className="text-sm text-slate-700 dark:text-slate-300 flex items-center gap-1 cursor-pointer">
                         Kirim notifikasi tanggapan juga ke WhatsApp nasabah <Phone className="h-3 w-3 inline text-emerald-500"/>
                       </label>
                     </div>
                     <Button onClick={handleBalas} disabled={mutation.isPending} className="w-full bg-emerald-600 hover:bg-emerald-700">
                        {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : <Send className="h-4 w-4 mr-2"/>}
                        Kirim Tanggapan & Selesaikan Tiket
                     </Button>
                  </div>
                )}
             </div>
           )}
        </DialogContent>
      </Dialog>

      <Card className="border-none shadow-sm dark:bg-slate-900">
        <CardHeader className="p-4 sm:p-6 pb-0">
          <div className="relative w-full sm:w-80 border-b pb-2">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
            <Input
              type="search"
              placeholder="Cari subjek laporan..."
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
                    <TableHead className="w-[120px]">Waktu</TableHead>
                    <TableHead>Subjek</TableHead>
                    <TableHead>Pengirim</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                 </TableRow>
               </TableHeader>
               <TableBody>
                 {isLoading ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-10 opacity-50"><Loader2 className="animate-spin h-6 w-6 mx-auto"/></TableCell></TableRow>
                 ) : filtered.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-10 text-slate-500">Tidak ada pengaduan nasabah.</TableCell></TableRow>
                 ) : filtered.map((r: any) => (
                    <TableRow key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                       <TableCell className="text-xs text-slate-500">{new Date(r.createdAt).toLocaleString('id-ID')}</TableCell>
                       <TableCell className="font-medium text-slate-800 dark:text-slate-200">{r.subjek}</TableCell>
                       <TableCell>
                          <div className="text-sm font-medium">{r.pengirimNama}</div>
                          <div className="text-[10px] text-slate-500 uppercase">{r.pengirimRole}</div>
                       </TableCell>
                       <TableCell>{getStatusBadge(r.status)}</TableCell>
                       <TableCell className="text-right">
                          <Button size="sm" variant={r.status === 'selesai' ? 'outline' : 'default'} className={r.status !== 'selesai' ? 'bg-emerald-600 hover:bg-emerald-700' : ''} onClick={() => openDialog(r)}>
                             {r.status === 'selesai' ? 'Lihat Tanggapan' : 'Balas'}
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
