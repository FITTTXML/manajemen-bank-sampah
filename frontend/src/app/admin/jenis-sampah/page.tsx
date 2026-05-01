"use client"
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Search, Plus, Recycle, Loader2, Tag, Scale } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import api from '@/lib/axios'

interface JenisSampah {
  id: string;
  nama: string;
  kategori: string;
  hargaPerKg: string;
  satuan: string;
  deskripsi: string;
  aktif: boolean;
}

export default function JenisHargaPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [data, setData] = useState<JenisSampah[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { register, handleSubmit, reset, setValue, watch } = useForm()

  const fetchData = async () => {
    try {
      setLoading(true)
      const res = await api.get('/jenis-sampah')
      setData(res.data.data)
    } catch (error) {
      toast.error("Gagal mengambil data katalog")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const onSubmit = async (formData: any) => {
    setIsSubmitting(true)
    try {
      await api.post('/jenis-sampah', formData)
      toast.success("Kategori sampah berhasil ditambahkan")
      setIsDialogOpen(false)
      reset()
      fetchData()
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Gagal menambahkan data")
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleStatus = async (id: string, currentStatus: boolean) => {
     try {
      await api.put(`/jenis-sampah/${id}`, { aktif: !currentStatus })
      toast.success("Status tipe sampah diperbarui")
      fetchData()
    } catch (error) {
      toast.error("Gagal mengubah status")
    }
  }

  const filteredData = data.filter(d => 
    d.nama.toLowerCase().includes(searchTerm.toLowerCase()) || 
    d.kategori.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Jenis & Harga Sampah</h1>
          <p className="text-slate-500 text-sm">Kelola katalog sampah yang diterima beserta harga konversi tiap kilogramnya.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="shrink-0 gap-2">
              <Plus className="h-4 w-4" />
              Kategori Baru
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tambah Kategori Sampah</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nama Barang / Sampah</label>
                <Input placeholder="Contoh: Kardus Bekas" {...register("nama", { required: true })} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Kategori Induk</label>
                <Select onValueChange={(val) => setValue("kategori", val)} defaultValue="kertas">
                  <SelectTrigger><SelectValue placeholder="Pilih Kategori" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="organik">Organik</SelectItem>
                    <SelectItem value="kertas">Kertas & Karton</SelectItem>
                    <SelectItem value="plastik">Plastik</SelectItem>
                    <SelectItem value="logam">Logam / Besi</SelectItem>
                    <SelectItem value="elektronik">Elektronik</SelectItem>
                    <SelectItem value="kain">Kain / Tekstil</SelectItem>
                    <SelectItem value="lainnya">Lainnya</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Harga Dasar Per {watch("satuan") || 'Kg'}</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-500 font-medium">Rp</span>
                  <Input type="number" className="pl-10" placeholder="1500" {...register("hargaPerKg", { required: true })} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Deskripsi (Opsional)</label>
                <Input placeholder="Catatan kriteria penerimaan..." {...register("deskripsi")} />
              </div>
              <Button type="submit" className="w-full mt-4" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : null}
                Simpan Ke Katalog
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-none shadow-sm dark:bg-slate-900">
        <CardHeader className="p-4 sm:p-6 pb-0">
          <div className="relative w-full sm:w-72 border-b pb-2">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
            <Input
              type="search"
              placeholder="Cari jenis kardus, plastik..."
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
                  <TableHead className="w-[60px]">No</TableHead>
                  <TableHead>Nama Barang</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead className="text-right">Harga / Unit</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px]">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-10 opacity-50"><Loader2 className="animate-spin h-6 w-6 mx-auto"/></TableCell></TableRow>
                ) : filteredData.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-10 text-slate-500">Tidak ada data sampah.</TableCell></TableRow>
                ) : filteredData.map((item, index) => (
                  <TableRow key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <TableCell className="font-medium text-slate-500">{index + 1}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-md text-slate-500">
                          <Recycle className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white text-sm">{item.nama}</p>
                          <p className="text-xs text-slate-500 max-w-[200px] truncate">{item.deskripsi || '-'}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 capitalize">
                        <Tag className="h-3 w-3" />
                        {item.kategori}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <p className="font-bold text-emerald-600 dark:text-emerald-400">Rp {parseFloat(item.hargaPerKg).toLocaleString('id-ID')}</p>
                      <p className="text-[10px] text-slate-400 font-medium">per {item.satuan}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.aktif ? 'default' : 'secondary'} className={item.aktif ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/40 dark:text-emerald-400' : ''}>
                        {item.aktif ? 'Diterima' : 'Ditangguhkan'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" onClick={() => toggleStatus(item.id, item.aktif)} className="text-xs h-7">
                        {item.aktif ? 'Tangguhkan' : 'Aktifkan'}
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
