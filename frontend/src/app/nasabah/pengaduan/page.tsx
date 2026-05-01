"use client"
import React, { useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Loader2, MessageSquareWarning, Send, Search } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/axios'

export default function NasabahPengaduanPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const queryClient = useQueryClient()

  const { data: riwayat = [], isLoading } = useQuery({
    queryKey: ['nasabahPengaduan'],
    queryFn: async () => {
      const res = await api.get('/pengaduan/me')
      return res.data.data || []
    }
  })

  const { register, handleSubmit, reset } = useForm({
    defaultValues: { subjek: '', pesan: '' }
  })

  const mutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post('/pengaduan', payload)
      return res.data
    },
    onSuccess: () => {
      toast.success("Pengaduan berhasil dikirim ke Admin!")
      setIsDialogOpen(false)
      reset()
      queryClient.invalidateQueries({ queryKey: ['nasabahPengaduan'] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Gagal mengirim pengaduan")
    }
  })

  const onSubmit = (data: any) => {
    mutation.mutate(data)
  }

  const filteredRiwayat = riwayat.filter((r: any) => 
    r.subjek.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.pesan.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'menunggu_tanggapan': return <span className="px-2 py-1 bg-amber-100 text-amber-700 text-[10px] rounded-full uppercase font-medium">Menunggu</span>
      case 'diproses': return <span className="px-2 py-1 bg-blue-100 text-blue-700 text-[10px] rounded-full uppercase font-medium">Diproses</span>
      case 'selesai': return <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-[10px] rounded-full uppercase font-medium">Selesai / Terjawab</span>
      default: return <span className="px-2 py-1 bg-slate-100 text-slate-700 text-[10px] rounded-full uppercase">{status}</span>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Layanan Pengaduan</h1>
          <p className="text-slate-500 text-sm">Sampaikan keluhan, pertanyaan, atau saran Anda langsung ke Admin.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="shrink-0 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
              <MessageSquareWarning className="h-4 w-4" />
              Buat Tiket LaporanBaru
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Kirim Laporan / Pesan</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Subjek / Topik</label>
                <Input placeholder="Contoh: Saldo Belum Masuk" {...register('subjek', { required: true })} />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Isi Pesan Detail</label>
                <Textarea 
                  placeholder="Tuliskan keluhan atau pertanyaan Anda secara rinci di sini..." 
                  className="min-h-[120px]"
                  {...register('pesan', { required: true })} 
                />
              </div>

              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 mt-4" disabled={mutation.isPending}>
                {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : <Send className="h-4 w-4 mr-2" />}
                Kirim Pesan
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
        <Input
          placeholder="Cari subjek atau isi laporan..."
          className="pl-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-slate-400" /></div>
      ) : filteredRiwayat.length === 0 ? (
        <div className="text-center text-slate-500 py-10 bg-white dark:bg-slate-900 rounded-lg border border-dashed border-slate-300 dark:border-slate-800">
           Anda belum memiliki riwayat pesan atau pengaduan.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRiwayat.map((p: any) => (
            <Card key={p.id} className="border-slate-200 dark:border-slate-800 shadow-sm dark:bg-slate-900 overflow-hidden relative">
               <div className={`absolute left-0 top-0 bottom-0 w-1 ${p.status === 'selesai' ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
               <CardContent className="p-5 pl-6">
                  <div className="flex justify-between items-start mb-2">
                     <h3 className="font-bold text-lg text-slate-800 dark:text-white">{p.subjek}</h3>
                     {getStatusBadge(p.status)}
                  </div>
                  <div className="text-xs text-slate-400 mb-4">{new Date(p.createdAt).toLocaleString('id-ID')}</div>
                  
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-md text-sm text-slate-700 dark:text-slate-300 mb-3 border border-slate-100 dark:border-slate-700/50">
                    {p.pesan}
                  </div>

                  {p.tanggapan && (
                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                       <h4 className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-2 flex items-center gap-2">
                          <MessageSquareWarning className="h-3 w-3" /> Tanggapan Admin / Pengurus:
                       </h4>
                       <p className="text-sm text-slate-700 dark:text-slate-300 bg-emerald-50 dark:bg-emerald-900/10 p-3 rounded-md border border-emerald-100 dark:border-emerald-800/30">
                          {p.tanggapan}
                       </p>
                    </div>
                  )}
               </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
