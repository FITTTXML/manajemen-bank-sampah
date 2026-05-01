/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"
import React, { useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BarChart3, TrendingUp, PieChart as PieChartIcon, Download, Loader2, Package, Users, Coins, CalendarDays, Activity, FileText } from 'lucide-react'
import api from '@/lib/axios'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'

const PERIOD_OPTIONS = [
  { label: 'Hari Ini', value: '1d' },
  { label: '7 Hari', value: '7d' },
  { label: '30 Hari', value: '30d' },
  { label: '3 Bulan', value: '90d' },
  { label: '6 Bulan', value: '180d' },
]

const COLORS = ['#22c55e', '#3b82f6', '#eab308', '#f97316', '#8b5cf6', '#ec4899', '#64748b'];

export default function LaporanPage() {
  const [period, setPeriod] = useState('7d')
  const [exporting, setExporting] = useState(false)
  const reportRef = useRef<HTMLDivElement>(null)

  const { data: laporan, isLoading: loadingLaporan } = useQuery({
    queryKey: ['laporan', period],
    queryFn: async () => {
      const res = await api.get(`/laporan?period=${period}`)
      return res.data.data
    }
  })

  const { data: stats } = useQuery({
    queryKey: ['adminStats'],
    queryFn: async () => {
      const res = await api.get('/admin/stats')
      return res.data.data
    }
  })

  const handleExportPDF = async () => {
    if (!reportRef.current) return
    setExporting(true)
    toast.info('Sedang membuat PDF...')
    
    try {
      const html2canvas = (await import('html2canvas')).default
      const { jsPDF } = await import('jspdf')

      const element = reportRef.current
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      })

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()
      const imgWidth = canvas.width
      const imgHeight = canvas.height
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight)
      const imgX = (pdfWidth - imgWidth * ratio) / 2
      
      // Header
      pdf.setFillColor(16, 185, 129) // emerald-500
      pdf.rect(0, 0, pdfWidth, 28, 'F')
      pdf.setTextColor(255, 255, 255)
      pdf.setFontSize(18)
      pdf.setFont('helvetica', 'bold')
      pdf.text('SiBankSampah', 14, 12)
      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'normal')
      pdf.text('Laporan & Statistik Bank Sampah', 14, 18)
      
      const periodLabel = PERIOD_OPTIONS.find(o => o.value === period)?.label || period
      pdf.text(`Periode: ${periodLabel}`, 14, 24)
      
      const now = new Date()
      pdf.text(`Dicetak: ${now.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} ${now.toLocaleTimeString('id-ID')}`, pdfWidth - 14, 24, { align: 'right' })

      // Content
      const contentY = 32
      const availableHeight = pdfHeight - contentY - 20 // leave space for footer
      const scaledHeight = imgHeight * ratio
      
      if (scaledHeight <= availableHeight) {
        pdf.addImage(imgData, 'PNG', imgX, contentY, imgWidth * ratio, scaledHeight)
      } else {
        // Multi-page
        let remainingHeight = imgHeight
        let position = 0
        let page = 0
        
        while (remainingHeight > 0) {
          const sliceHeight = page === 0 
            ? (availableHeight / ratio) 
            : ((pdfHeight - 30) / ratio)
          
          const sliceCanvas = document.createElement('canvas')
          sliceCanvas.width = imgWidth
          sliceCanvas.height = Math.min(sliceHeight, remainingHeight) 
          const ctx = sliceCanvas.getContext('2d')
          if (ctx) {
            ctx.drawImage(canvas, 0, position, imgWidth, sliceCanvas.height, 0, 0, imgWidth, sliceCanvas.height)
            const sliceData = sliceCanvas.toDataURL('image/png')
            
            if (page > 0) {
              pdf.addPage()
            }
            
            const yOffset = page === 0 ? contentY : 10
            pdf.addImage(sliceData, 'PNG', imgX, yOffset, imgWidth * ratio, sliceCanvas.height * ratio)
          }
          
          position += sliceCanvas.height
          remainingHeight -= sliceCanvas.height
          page++
        }
      }

      // Footer on last page
      pdf.setTextColor(150, 150, 150)
      pdf.setFontSize(8)
      pdf.text('Dokumen ini dibuat otomatis oleh sistem SiBankSampah', pdfWidth / 2, pdfHeight - 8, { align: 'center' })

      pdf.save(`Laporan_BankSampah_${periodLabel.replace(/\s/g, '_')}_${now.toISOString().split('T')[0]}.pdf`)
      toast.success('PDF berhasil diunduh!')
    } catch (err) {
      console.error(err)
      toast.error('Gagal membuat PDF')
    } finally {
      setExporting(false)
    }
  }

  const distribusi = laporan?.distribusiKategori || []
  const tren = laporan?.trenData || []
  const ringkasan = laporan?.ringkasan || {}
  const hasDistribusiData = distribusi.length > 0 && distribusi.some((d: any) => d.value > 0)

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-emerald-500" />
            Laporan & Statistik
          </h1>
          <p className="text-slate-500 text-sm">Visualisasi data dan analitik performa Bank Sampah.</p>
        </div>
        <Button 
          onClick={handleExportPDF} 
          disabled={exporting || loadingLaporan}
          className="bg-emerald-600 hover:bg-emerald-700 gap-2 text-white"
        >
          {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          {exporting ? 'Membuat PDF...' : 'Unduh PDF'}
        </Button>
      </div>

      {/* Period Filter */}
      <div className="flex flex-wrap gap-2">
        {PERIOD_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setPeriod(opt.value)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              period === opt.value
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* ====== PDF CAPTURE AREA ====== */}
      <div ref={reportRef} className="space-y-6 bg-white dark:bg-slate-950 p-1">
        
        {/* PDF Title (hidden on screen, visible in capture) */}
        <div className="hidden" id="pdf-title">
          <h2 className="text-xl font-bold">Laporan Bank Sampah — {PERIOD_OPTIONS.find(o => o.value === period)?.label}</h2>
        </div>

        {/* Period Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                  <Package className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <span className="text-sm text-slate-500">Total Berat Periode</span>
              </div>
              <div className="text-2xl font-bold text-slate-800 dark:text-white">
                {loadingLaporan ? '...' : `${ringkasan.totalBerat || 0} Kg`}
              </div>
            </CardContent>
          </Card>
          <Card className="dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Activity className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-sm text-slate-500">Jumlah Transaksi</span>
              </div>
              <div className="text-2xl font-bold text-slate-800 dark:text-white">
                {loadingLaporan ? '...' : ringkasan.jumlahTransaksi || 0}
              </div>
            </CardContent>
          </Card>
          <Card className="dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                  <CalendarDays className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
                <span className="text-sm text-slate-500">Hari Aktif</span>
              </div>
              <div className="text-2xl font-bold text-slate-800 dark:text-white">
                {loadingLaporan ? '...' : `${ringkasan.totalHariAktif || 0} hari`}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Trend Chart */}
          <Card className="lg:col-span-2 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
                Tren Volume Sampah
              </CardTitle>
              <CardDescription>
                {PERIOD_OPTIONS.find(o => o.value === period)?.label} — akumulasi per kategori (Kg)
              </CardDescription>
            </CardHeader>
            <CardContent className="h-80 w-full flex items-center justify-center p-4">
              {loadingLaporan ? (
                <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
              ) : tren.length === 0 ? (
                <div className="text-center text-slate-500">
                  <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-30"/>
                  <p className="text-sm">Belum ada data tren.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={tren} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dy={10} interval={period === '30d' ? 4 : 0} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                    <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#334155', fontSize: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} formatter={(v: any) => `${v} Kg`} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                    <Bar dataKey="organik" stackId="a" fill="#22c55e" />
                    <Bar dataKey="plastik" stackId="a" fill="#eab308" />
                    <Bar dataKey="kertas" stackId="a" fill="#3b82f6" />
                    <Bar dataKey="logam" stackId="a" fill="#f97316" />
                    <Bar dataKey="elektronik" stackId="a" fill="#8b5cf6" />
                    <Bar dataKey="kain" stackId="a" fill="#ec4899" />
                    <Bar dataKey="lainnya" stackId="a" fill="#64748b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Pie Chart */}
          <Card className="dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <PieChartIcon className="h-5 w-5 text-blue-500" />
                Distribusi Kategori
              </CardTitle>
              <CardDescription>Persentase jenis sampah</CardDescription>
            </CardHeader>
            <CardContent className="h-80 w-full flex items-center justify-center p-4">
              {loadingLaporan ? (
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              ) : !hasDistribusiData ? (
                <div className="text-center text-slate-500">
                  <PieChartIcon className="h-12 w-12 mx-auto mb-2 opacity-30"/>
                  <p className="text-sm">Belum ada data.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={distribusi} cx="50%" cy="45%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value">
                      {distribusi.map((_: any, i: number) => (
                        <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }} formatter={(v: any) => `${v} Kg`} />
                    <Legend iconType="circle" verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '11px' }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Data Table for PDF */}
        {distribusi.length > 0 && (
          <Card className="dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-5 w-5 text-slate-500" />
                Rincian Data Kategori
              </CardTitle>
            </CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="text-left py-2 px-3 font-semibold text-slate-600 dark:text-slate-300">No</th>
                    <th className="text-left py-2 px-3 font-semibold text-slate-600 dark:text-slate-300">Kategori</th>
                    <th className="text-right py-2 px-3 font-semibold text-slate-600 dark:text-slate-300">Berat (Kg)</th>
                    <th className="text-right py-2 px-3 font-semibold text-slate-600 dark:text-slate-300">Persentase</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const total = distribusi.reduce((s: number, d: any) => s + d.value, 0)
                    return distribusi.map((d: any, i: number) => (
                      <tr key={i} className="border-b border-slate-100 dark:border-slate-800">
                        <td className="py-2 px-3 text-slate-500">{i + 1}</td>
                        <td className="py-2 px-3 font-medium capitalize text-slate-800 dark:text-white flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                          {d.name}
                        </td>
                        <td className="py-2 px-3 text-right font-semibold text-slate-700 dark:text-slate-200">{d.value.toFixed(1)}</td>
                        <td className="py-2 px-3 text-right text-slate-500">{total > 0 ? ((d.value / total) * 100).toFixed(1) : 0}%</td>
                      </tr>
                    ))
                  })()}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-300 dark:border-slate-600">
                    <td colSpan={2} className="py-2 px-3 font-bold text-slate-800 dark:text-white">Total</td>
                    <td className="py-2 px-3 text-right font-bold text-emerald-600">
                      {distribusi.reduce((s: number, d: any) => s + d.value, 0).toFixed(1)} Kg
                    </td>
                    <td className="py-2 px-3 text-right font-bold text-slate-500">100%</td>
                  </tr>
                </tfoot>
              </table>
            </CardContent>
          </Card>
        )}

        {/* Data List for PDF */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {/* Top Nasabah Table */}
          {(laporan?.topNasabah?.length > 0) && (
            <Card className="dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="h-5 w-5 text-blue-500" />
                  Top Nasabah ({PERIOD_OPTIONS.find(o => o.value === period)?.label})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                      <th className="text-left py-2 px-3 font-semibold text-slate-600">Nama</th>
                      <th className="text-right py-2 px-3 font-semibold text-slate-600">Berat (Kg)</th>
                      <th className="text-right py-2 px-3 font-semibold text-slate-600">Total (Rp)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {laporan.topNasabah.map((n: any, i: number) => (
                      <tr key={i} className="border-b border-slate-100 dark:border-slate-800">
                        <td className="py-2 px-3 font-medium text-slate-800 dark:text-white truncate max-w-[120px]">
                          {n.nama} <span className="text-[10px] text-slate-400 block">{n.noAnggota}</span>
                        </td>
                        <td className="py-2 px-3 text-right font-semibold text-slate-700 dark:text-slate-200">{n.totalBerat.toFixed(1)}</td>
                        <td className="py-2 px-3 text-right text-emerald-600 font-medium">{(n.totalNilai).toLocaleString('id-ID')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}

          {/* Recent Transaksi Table */}
          {(laporan?.recentTransactions?.length > 0) && (
            <Card className="dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Activity className="h-5 w-5 text-indigo-500" />
                  Transaksi Terbaru
                </CardTitle>
              </CardHeader>
              <CardContent>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                      <th className="text-left py-2 px-3 font-semibold text-slate-600">Tanggal</th>
                      <th className="text-left py-2 px-3 font-semibold text-slate-600">Nasabah</th>
                      <th className="text-right py-2 px-3 font-semibold text-slate-600">Total Rp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {laporan.recentTransactions.map((t: any, i: number) => (
                      <tr key={i} className="border-b border-slate-100 dark:border-slate-800">
                        <td className="py-2 px-3 text-slate-700 dark:text-slate-300">
                          {new Date(t.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                        </td>
                        <td className="py-2 px-3 font-medium text-slate-800 dark:text-white truncate max-w-[120px]">
                          {t.nasabahNama}
                        </td>
                        <td className="py-2 px-3 text-right text-emerald-600 font-medium">
                          {Number(t.totalNilai).toLocaleString('id-ID')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Global Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg"><Users className="h-4 w-4 text-blue-600 dark:text-blue-400" /></div>
                <span className="text-sm text-slate-500">Total Nasabah</span>
              </div>
              <div className="text-2xl font-bold text-slate-800 dark:text-white">{stats?.totalNasabah ?? '—'}</div>
            </CardContent>
          </Card>
          <Card className="dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg"><Package className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /></div>
                <span className="text-sm text-slate-500">Total Berat (All-time)</span>
              </div>
              <div className="text-2xl font-bold text-slate-800 dark:text-white">{stats?.totalBeratSampah ?? '—'} Kg</div>
            </CardContent>
          </Card>
          <Card className="dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg"><Coins className="h-4 w-4 text-amber-600 dark:text-amber-400" /></div>
                <span className="text-sm text-slate-500">Total Transaksi (All-time)</span>
              </div>
              <div className="text-2xl font-bold text-slate-800 dark:text-white">Rp {(stats?.totalSaldoBeredar ?? 0).toLocaleString('id-ID')}</div>
            </CardContent>
          </Card>
        </div>
      </div>
      {/* ====== END PDF CAPTURE ====== */}
    </div>
  )
}
