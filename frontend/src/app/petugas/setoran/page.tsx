"use client"
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Plus, Loader2, Trash2, ShieldCheck, Receipt } from 'lucide-react'
import { useForm, useFieldArray } from 'react-hook-form'
import { toast } from 'sonner'
import api from '@/lib/axios'

export default function SetoranPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [setoranList, setSetoranList] = useState<any[]>([])
  const [nasabahList, setNasabahList] = useState<any[]>([])
  const [katalog, setKatalog] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { register, handleSubmit, control, reset, setValue, watch } = useForm({
    defaultValues: {
      nasabahId: '',
      catatan: '',
      details: [{ jenisSampahId: '', beratKg: '' }]
    }
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: "details"
  })

  const fetchInitData = async () => {
    try {
      setLoading(true)
      const [resSetoran, resUsers, resKatalog] = await Promise.all([
        api.get('/setoran'),
        api.get('/users'), // Anggap route yang mengembalikan list semua user
        api.get('/jenis-sampah')
      ])
      
      setSetoranList(resSetoran.data.data || [])
      setNasabahList(resUsers.data.data?.filter((u: any) => u.role === 'nasabah') || [])
      setKatalog(resKatalog.data.data?.filter((k: any) => k.aktif) || [])
    } catch (error) {
      toast.error("Gagal memuat data formulir kasir")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInitData()
  }, [])

  const detailsWatch = watch('details')

  // Hitung live total (estimasi UI)
  const estimatedTotal = detailsWatch.reduce((acc, curr) => {
    const k = katalog.find(x => x.id === curr.jenisSampahId)
    if (k && curr.beratKg) {
      return acc + (parseFloat(k.hargaPerKg) * parseFloat(curr.beratKg))
    }
    return acc
  }, 0)

  const onSubmit = async (formData: any) => {
    if (!formData.nasabahId) return toast.error("Silakan pilih nasabah!")
    if (formData.details.length === 0 || !formData.details[0].jenisSampahId) {
      return toast.error("Setoran tidak boleh kosong")
    }

    setIsSubmitting(true)
    try {
      // Find Nasabah UUID mapping from Users
      // Note: Di backend setoran.controller memerlukan nasabahId bawaan tabel nasabah, bukan users.id.
      // Kita asumsikan nasabahList membawa .nasabahProfile di dalamnya
      const targetUser = nasabahList.find(n => n.id === formData.nasabahId)
      const idNasabahAsli = targetUser?.nasabahProfile?.id

      if (!idNasabahAsli) {
        throw new Error("Nasabah ini belum melengkapi profil nasabah (Tabel Nasabah tidak ada)")
      }

      const payload = {
        nasabahId: idNasabahAsli,
        catatan: formData.catatan,
        details: formData.details
      }

      await api.post('/setoran', payload)
      toast.success("Setoran sampah sukses diproses!")
      setIsDialogOpen(false)
      reset()
      fetchInitData()
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || "Transaksi Gagal")
    } finally {
      setIsSubmitting(false)
    }
  }

  const filteredSetoran = setoranList.filter(s => 
    s.nomorStruk?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.nasabah?.user?.namaLengkap?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Transaksi Setoran</h1>
          <p className="text-slate-500 text-sm">Catat penerimaan sampah dari nasabah di loket / bank.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="shrink-0 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
              <Plus className="h-4 w-4" />
              Kasir Setoran Baru
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-emerald-600" />
                Input Transaksi Setoran
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Pilih Nasabah (Penyetor)</label>
                  <Select onValueChange={(val) => setValue("nasabahId", val)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pencarian Nasabah..." />
                    </SelectTrigger>
                    <SelectContent>
                      {nasabahList.map(n => (
                        <SelectItem key={n.id} value={n.id}>
                          {n.namaLengkap} - {n.nasabahProfile?.noAnggota || 'Belum Aktif'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Catatan / Keterangan</label>
                  <Input placeholder="Cuaca hujan, barang basah..." {...register("catatan")} />
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-sm">Daftar Barang Bawaan</h3>
                  <Button type="button" variant="outline" size="sm" onClick={() => append({ jenisSampahId: '', beratKg: '' })}>
                    <Plus className="h-3 w-3 mr-1" /> Tambah Baris
                  </Button>
                </div>

                <div className="space-y-3">
                  {fields.map((field, index) => (
                    <div key={field.id} className="flex flex-col sm:flex-row gap-3 items-end">
                      <div className="flex-1 space-y-1">
                        <label className="text-xs text-slate-500">Kategori Sampah</label>
                        <Select onValueChange={(val) => setValue(`details.${index}.jenisSampahId`, val)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih Tipe..." />
                          </SelectTrigger>
                          <SelectContent>
                            {katalog.map(k => (
                              <SelectItem key={k.id} value={k.id}>{k.nama} (Rp {parseFloat(k.hargaPerKg).toLocaleString()}/{k.satuan})</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="w-full sm:w-32 space-y-1">
                        <label className="text-xs text-slate-500">Berat (Kg)</label>
                        <Input type="number" step="0.01" min="0" placeholder="0.0" {...register(`details.${index}.beratKg` as const, { required: true })} />
                      </div>
                      <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="text-red-500 hover:text-red-700 hover:bg-red-50 mb-0.5">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-4 border-t flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-500">Estimasi Total Nilai:</span>
                  <span className="text-xl font-bold text-emerald-600">Rp {estimatedTotal.toLocaleString('id-ID')}</span>
                </div>
              </div>

              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : <ShieldCheck className="h-4 w-4 mr-2" />}
                Konfirmasi & Simpan Setoran
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-none shadow-sm dark:bg-slate-900">
        <CardHeader className="p-4 sm:p-6 pb-0">
          <div className="relative w-full sm:w-80 border-b pb-2">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
            <Input
              type="search"
              placeholder="Cari No. Struk atau Nama Nasabah..."
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
                  <TableHead>Struk</TableHead>
                  <TableHead>Nasabah</TableHead>
                  <TableHead>Rincian Barang</TableHead>
                  <TableHead className="text-right">Total Transaksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-10 opacity-50"><Loader2 className="animate-spin h-6 w-6 mx-auto"/></TableCell></TableRow>
                ) : filteredSetoran.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-10 text-slate-500">Tidak ada riwayat setoran.</TableCell></TableRow>
                ) : filteredSetoran.map((s) => (
                  <TableRow key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <TableCell className="text-xs text-slate-500">
                      {new Date(s.tanggal).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-1 rounded">
                        {s.nomorStruk}
                      </span>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium text-slate-900 dark:text-white text-sm">{s.nasabah?.user?.namaLengkap || 'Unknown'}</p>
                      <p className="text-[10px] text-slate-500">ID: {s.nasabah?.noAnggota}</p>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {s.details?.map((dt: any) => (
                          <span key={dt.id} className="inline-flex text-[10px] items-center px-1.5 py-0.5 rounded-full border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                            {dt.jenisSampah?.nama} ({dt.beratKg} kg)
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-bold text-emerald-600 dark:text-emerald-400">
                      Rp {parseFloat(s.totalNilai).toLocaleString('id-ID')}
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
