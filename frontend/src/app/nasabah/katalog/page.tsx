"use client"
import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/axios'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, Loader2, Tag, Recycle } from 'lucide-react'

export default function NasabahKatalogPage() {
  const [searchTerm, setSearchTerm] = useState('')

  const { data: katalog, isLoading } = useQuery({
    queryKey: ['katalogNasabah'],
    queryFn: async () => {
      const res = await api.get('/jenis-sampah')
      // Only show active categories
      return res.data.data?.filter((k: any) => k.aktif) || []
    }
  })

  const filteredData = katalog?.filter((k: any) => 
    k.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
    k.kategori.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Harga & Kategori Sampah</h1>
        <p className="text-slate-500 text-sm">Informasi estimasi harga pertukaran sampah terbaru.</p>
      </div>

      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
        <Input
          placeholder="Cari kardus, plastik..."
          className="pl-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-slate-400" /></div>
      ) : filteredData.length === 0 ? (
        <div className="text-center text-slate-500 py-20">Katalog kosong atau pencarian tidak ditemukan.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredData.map((item: any) => (
            <Card key={item.id} className="border-none shadow-sm hover:shadow-md transition-shadow dark:bg-slate-900 overflow-hidden">
              <div className="h-2 w-full bg-emerald-500"></div>
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400">
                    <Recycle className="h-5 w-5" />
                  </div>
                  <Badge variant="outline" className="bg-slate-50 dark:bg-slate-800 capitalize">
                    {item.kategori}
                  </Badge>
                </div>
                <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-1">{item.nama}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 h-8">{item.deskripsi || "Tidak ada deskripsi rinci."}</p>
                
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                    <Tag className="h-3 w-3" /> Harga
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 text-lg">Rp {parseFloat(item.hargaPerKg).toLocaleString()}</span>
                    <span className="text-xs text-slate-400 font-medium"> / {item.satuan}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
