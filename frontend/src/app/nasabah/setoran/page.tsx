"use client"
import React, { useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Search, Loader2 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/axios'

export default function NasabahSetoranPage() {
  const [searchTerm, setSearchTerm] = useState('')

  const { data: setoranList = [], isLoading } = useQuery({
    queryKey: ['nasabahSetoranList'],
    queryFn: async () => {
      const res = await api.get('/setoran/me')
      return res.data.data || []
    }
  })

  // Filter based on Struk Number or Petugas Name
  const filteredSetoran = setoranList.filter((s: any) => 
    s.nomorStruk?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.petugas?.namaLengkap?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Riwayat Setoran Saya</h1>
        <p className="text-slate-500 text-sm">Lihat seluruh rekam jejak sampah yang telah Anda setorkan ke bank sampah.</p>
      </div>

      <Card className="border-none shadow-sm dark:bg-slate-900">
        <CardHeader className="p-4 sm:p-6 pb-0">
          <div className="relative w-full sm:w-80 border-b pb-2">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
            <Input
              type="search"
              placeholder="Cari No. Struk atau Petugas..."
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
                  <TableHead className="w-[120px]">Waktu Setor</TableHead>
                  <TableHead>Struk</TableHead>
                  <TableHead>Penerima (Petugas)</TableHead>
                  <TableHead>Rincian Barang</TableHead>
                  <TableHead className="text-right">Total Pendapatan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-10 opacity-50"><Loader2 className="animate-spin h-6 w-6 mx-auto"/></TableCell></TableRow>
                ) : filteredSetoran.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-10 text-slate-500">Belum ada riwayat setoran pribadi.</TableCell></TableRow>
                ) : filteredSetoran.map((s: any) => (
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
                      <p className="font-medium text-slate-900 dark:text-white text-sm">{s.petugas?.namaLengkap || 'Unknown'}</p>
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
