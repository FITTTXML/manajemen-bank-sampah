/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"
import React, { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Brain, Search, Loader2, Sparkles, Tag, ArrowRight, Lightbulb, Recycle } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import api from '@/lib/axios'

const categoryColors: Record<string, string> = {
  plastik: 'from-blue-500 to-cyan-500',
  kertas: 'from-amber-500 to-yellow-500',
  logam: 'from-slate-500 to-zinc-600',
  organik: 'from-green-500 to-emerald-500',
  elektronik: 'from-purple-500 to-violet-500',
  kain: 'from-pink-500 to-rose-500',
  lainnya: 'from-gray-500 to-stone-500',
}

const categoryEmojis: Record<string, string> = {
  plastik: '🧴',
  kertas: '📦',
  logam: '🔩',
  organik: '🍂',
  elektronik: '📱',
  kain: '👕',
  lainnya: '🔮',
}

export default function PemilahanPage() {
  const [query, setQuery] = useState('')
  const [result, setResult] = useState<any>(null)

  const classifyMutation = useMutation({
    mutationFn: async (q: string) => {
      const res = await api.post('/pemilahan/classify', { query: q })
      return res.data.data
    },
    onSuccess: (data) => {
      setResult(data)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Gagal menganalisa. Pastikan Anda sudah login.')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim().length < 2) return
    classifyMutation.mutate(query)
  }

  const quickItems = [
    'Botol plastik', 'Kardus', 'Kaleng', 'Koran', 'Besi', 
    'Baju bekas', 'HP rusak', 'Styrofoam', 'Galon', 'Tembaga'
  ]

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl mb-4 shadow-lg">
          <Brain className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Pemilahan Sampah Cerdas
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Ketik nama barang/sampah, AI akan bantu klasifikasi kategori & harga
        </p>
      </div>

      {/* Search */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
            <Input
              placeholder="Contoh: botol aqua, kardus bekas, kabel..."
              className="pl-11 h-12 text-base bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl shadow-sm"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <Button 
            type="submit" 
            className="h-12 px-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-xl shadow-sm"
            disabled={classifyMutation.isPending || query.trim().length < 2}
          >
            {classifyMutation.isPending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Analisa
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Quick Search */}
      <div className="flex flex-wrap gap-2 justify-center">
        {quickItems.map((item) => (
          <button
            key={item}
            onClick={() => { setQuery(item); classifyMutation.mutate(item) }}
            className="px-3 py-1.5 text-xs rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-100 hover:text-emerald-700 dark:hover:bg-emerald-900/30 dark:hover:text-emerald-400 transition-all border border-transparent hover:border-emerald-200 dark:hover:border-emerald-800"
          >
            {item}
          </button>
        ))}
      </div>

      {/* Result */}
      {result && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
          {/* Category Card */}
          <Card className="border-none shadow-lg overflow-hidden">
            <div className={`h-2 bg-gradient-to-r ${categoryColors[result.kategori] || categoryColors.lainnya}`} />
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className={`text-4xl flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${categoryColors[result.kategori] || categoryColors.lainnya} bg-opacity-10`}>
                  {categoryEmojis[result.kategori] || '♻️'}
                </div>
                <div className="flex-1">
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider flex items-center gap-2">
                    Hasil Klasifikasi
                    {result.usedAI ? (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 normal-case">⚡ Google Gemini AI</span>
                    ) : (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 normal-case">🔍 Klasifikasi Lokal</span>
                    )}
                  </p>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-1 capitalize flex items-center gap-2">
                    {result.kategori}
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      result.confidence === 'Tinggi' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                      result.confidence === 'Sedang' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                      'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      Akurasi: {result.confidence}
                    </span>
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                    &ldquo;<span className="font-semibold">{result.input}</span>&rdquo; termasuk kategori <span className="font-bold capitalize">{result.kategori}</span>
                  </p>
                </div>
              </div>

              {/* Tip */}
              <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200/50 dark:border-amber-800/30 rounded-xl">
                <div className="flex items-start gap-2">
                  <Lightbulb className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                  <p className="text-sm text-amber-800 dark:text-amber-300">{result.tip}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Matching Items from DB */}
          {result.jenisSampahCocok?.length > 0 && (
            <Card className="border-none shadow-sm dark:bg-slate-900">
              <CardContent className="p-6">
                <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
                  <Tag className="h-4 w-4 text-emerald-500" />
                  Jenis Sampah yang Cocok ({result.jenisSampahCocok.length})
                </h3>
                <div className="space-y-3">
                  {result.jenisSampahCocok.map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                          <Recycle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-slate-800 dark:text-white">{item.nama}</p>
                          <p className="text-xs text-slate-500 capitalize">{item.kategori} — {item.deskripsi || 'Tidak ada deskripsi'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-emerald-600 dark:text-emerald-400">
                          Rp {parseFloat(item.hargaPerKg).toLocaleString('id-ID')}
                        </p>
                        <p className="text-[10px] text-slate-400">per {item.satuan}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Empty state */}
      {!result && !classifyMutation.isPending && (
        <div className="text-center py-12 text-slate-400">
          <Brain className="h-16 w-16 mx-auto mb-4 opacity-20" />
          <p className="font-medium">Ketik nama barang untuk memulai</p>
          <p className="text-sm">atau klik salah satu tombol di atas</p>
        </div>
      )}
    </div>
  )
}
