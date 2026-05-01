"use client"
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Search, Loader2, Wallet, Check, X, Building } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'
import api from '@/lib/axios'

export default function PenarikanPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [selectedTx, setSelectedTx] = useState<any>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  const fetchData = async () => {
    try {
      setLoading(true)
      const res = await api.get('/penarikan')
      setData(res.data.data || [])
    } catch (error) {
      toast.error("Gagal memuat data penarikan")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleProcess = async (id: string, status: 'disetujui' | 'ditolak' | 'selesai') => {
    setIsProcessing(true)
    try {
      await api.put(`/penarikan/${id}/status`, { 
        status, 
        alasanTolak: status === 'ditolak' ? rejectReason : undefined 
      })
      toast.success(`Pengajuan penarikan ${status}`)
      setSelectedTx(null)
      fetchData()
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Gagal memproses pengajuan")
    } finally {
      setIsProcessing(false)
      setRejectReason('')
    }
  }

  const filteredData = data.filter(d => 
    d.nasabah?.user?.namaLengkap?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    d.nomorRekening?.includes(searchTerm)
  )

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'menunggu': return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200">Menunggu</Badge>
      case 'disetujui': return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200">Diperjalanan</Badge>
      case 'selesai': return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200">Selesai</Badge>
      case 'ditolak': return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-red-200">Ditolak</Badge>
      default: return <Badge>{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Penarikan Dana</h1>
          <p className="text-slate-500 text-sm">Kelola dan proses pengajuan pencairan saldo nasabah.</p>
        </div>
      </div>

      <Dialog open={!!selectedTx} onOpenChange={(open) => !open && setSelectedTx(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Proses Penarikan Dana</DialogTitle>
          </DialogHeader>
          {selectedTx && (
            <div className="space-y-4 py-4">
              <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border">
                <p className="text-sm text-slate-500 mb-1">Informasi Penerima</p>
                <p className="font-bold">{selectedTx.nasabah?.user?.namaLengkap}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Building className="h-4 w-4 text-slate-400" />
                  <span className="font-medium">{selectedTx.namaBank}</span>
                  <span className="text-slate-500"> - {selectedTx.nomorRekening}</span>
                </div>
              </div>
              <div className="flex justify-between items-center px-2">
                <span className="text-slate-500 font-medium">Nominal Penarikan</span>
                <span className="text-2xl font-bold text-slate-900 dark:text-white">
                  Rp {parseFloat(selectedTx.jumlah).toLocaleString('id-ID')}
                </span>
              </div>
              
              <div className="space-y-2 pt-4 border-t">
                <label className="text-sm font-medium">Catatan / Alasan Penolakan (Opsional)</label>
                <Input 
                  placeholder="Misal: Nomor rekening tidak valid..." 
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                />
              </div>

              <DialogFooter className="gap-2 sm:gap-0 mt-6">
                <Button variant="destructive" onClick={() => handleProcess(selectedTx.id, 'ditolak')} disabled={isProcessing}>
                  Tolak Pengajuan
                </Button>
                <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => handleProcess(selectedTx.id, 'selesai')} disabled={isProcessing}>
                  {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : <Check className="h-4 w-4 mr-2" />}
                  Setujui & Tandai Selesai
                </Button>
              </DialogFooter>
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
              placeholder="Cari Nasabah atau Rekening..."
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
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Nasabah</TableHead>
                  <TableHead>Tujuan Transfer</TableHead>
                  <TableHead className="text-right">Nominal</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px]">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-10 opacity-50"><Loader2 className="animate-spin h-6 w-6 mx-auto"/></TableCell></TableRow>
                ) : filteredData.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-10 text-slate-500">Belum ada pengajuan masuk.</TableCell></TableRow>
                ) : filteredData.map((item) => (
                  <TableRow key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <TableCell className="text-xs text-slate-500">
                      {new Date(item.diajukanPada).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </TableCell>
                    <TableCell>
                      <p className="font-semibold text-slate-900 dark:text-white text-sm">{item.nasabah?.user?.namaLengkap}</p>
                      <p className="text-[10px] text-slate-500">Sisa Saldo: Rp {parseFloat(item.nasabah?.saldo || '0').toLocaleString()}</p>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300">
                        <Wallet className="h-3 w-3" />
                        {item.metode.toUpperCase()} - {item.namaBank}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{item.nomorRekening}</p>
                    </TableCell>
                    <TableCell className="text-right">
                      <p className="font-bold text-slate-900 dark:text-white">Rp {parseFloat(item.jumlah).toLocaleString('id-ID')}</p>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(item.status)}
                    </TableCell>
                    <TableCell>
                      {item.status === 'menunggu' ? (
                        <Button variant="outline" size="sm" onClick={() => setSelectedTx(item)} className="text-xs h-7">
                          Proses
                        </Button>
                      ) : (
                        <span className="text-xs italic text-slate-400 font-medium px-2">—</span>
                      )}
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
