/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"
import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Smartphone, RefreshCw, CheckCircle2, WifiOff, Loader2, Trash2, Send, Settings, Shield } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import api from '@/lib/axios'

export default function PengaturanPage() {
  const queryClient = useQueryClient()
  const [testNumber, setTestNumber] = useState('')
  const [testMessage, setTestMessage] = useState('')

  // WA Status query
  const { data: waStatus, refetch: refetchWa, isLoading: waLoading } = useQuery({
    queryKey: ['waStatus'],
    queryFn: async () => {
      const res = await api.get('/wa/status');
      return res.data.data;
    },
    refetchInterval: 8000,
  });

  // Reset session mutation
  const resetMutation = useMutation({
    mutationFn: async () => {
      const res = await api.delete('/wa/reset-session');
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Sesi WA berhasil dihapus!');
      queryClient.invalidateQueries({ queryKey: ['waStatus'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Gagal mereset sesi WA');
    }
  });

  // Test send mutation
  const sendTestMutation = useMutation({
    mutationFn: async (payload: { number: string; text: string }) => {
      const res = await api.post('/wa/test-send', payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Pesan tes berhasil dikirim!');
      setTestNumber('');
      setTestMessage('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Gagal mengirim pesan tes');
    }
  });

  const handleResetSession = () => {
    if (confirm('Yakin ingin menghapus sesi WhatsApp? Anda harus scan QR Code lagi.')) {
      resetMutation.mutate();
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <Settings className="h-6 w-6" />
          Pengaturan Sistem
        </h1>
        <p className="text-slate-500 text-sm">Konfigurasi WhatsApp Gateway dan pengaturan aplikasi.</p>
      </div>

      {/* WhatsApp Bot Status & QR Code */}
      <Card className="shadow-sm border-none dark:bg-slate-900 overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-green-400 to-emerald-600"></div>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 dark:text-white">
                <Smartphone className="h-5 w-5 text-green-500" />
                WhatsApp Bot Gateway
              </CardTitle>
              <CardDescription className="mt-1">Kelola koneksi bot WhatsApp untuk notifikasi otomatis ke nasabah.</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetchWa()} disabled={waLoading}>
              <RefreshCw className={`h-4 w-4 mr-1 ${waLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status Display */}
          {waLoading ? (
            <div className="flex items-center gap-3 text-slate-500 p-4">
              <Loader2 className="h-5 w-5 animate-spin" /> Memeriksa status koneksi WhatsApp...
            </div>
          ) : waStatus?.status === 'CONNECTED' ? (
            <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800/40">
              <CheckCircle2 className="h-8 w-8 text-emerald-500 shrink-0" />
              <div className="flex-1">
                <p className="font-bold text-emerald-700 dark:text-emerald-400">WhatsApp Terhubung!</p>
                <p className="text-sm text-emerald-600/70 dark:text-emerald-400/60">Bot aktif mengirim notifikasi setoran dan penarikan ke nasabah secara otomatis.</p>
              </div>
            </div>
          ) : waStatus?.status === 'QR_READY' && waStatus?.qrCodeUrl ? (
            <div className="flex flex-col sm:flex-row items-center gap-6 p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl border border-blue-200/50 dark:border-blue-800/30">
              <div className="bg-white p-3 rounded-xl shadow-lg border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={waStatus.qrCodeUrl} alt="WhatsApp QR Code" className="w-52 h-52" />
              </div>
              <div className="text-center sm:text-left">
                <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-2">Scan QR Code dengan WhatsApp</h3>
                <ol className="text-sm text-slate-500 dark:text-slate-400 space-y-1.5 list-decimal list-inside">
                  <li>Buka aplikasi <strong>WhatsApp</strong> di HP Anda</li>
                  <li>Ketuk titik tiga ⋮ → <strong>Perangkat Tertaut</strong></li>
                  <li>Ketuk <strong>Tautkan Perangkat</strong></li>
                  <li>Arahkan kamera ke QR Code ini</li>
                </ol>
                <p className="text-xs text-slate-400 mt-3">QR akan otomatis di-refresh setiap 8 detik.</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800/40">
              <WifiOff className="h-8 w-8 text-amber-500 shrink-0" />
              <div>
                <p className="font-bold text-amber-700 dark:text-amber-400">WhatsApp Belum Terhubung</p>
                <p className="text-sm text-amber-600/70 dark:text-amber-400/60">
                  Status: {waStatus?.status || 'DISCONNECTED'}. Tunggu sebentar, QR Code akan segera muncul...
                </p>
              </div>
            </div>
          )}

          {/* Test Send Section */}
          {waStatus?.status === 'CONNECTED' && (
            <div className="border-t pt-6 dark:border-slate-800">
              <h4 className="font-semibold text-sm mb-3 flex items-center gap-2 dark:text-white">
                <Send className="h-4 w-4 text-blue-500" />
                Kirim Pesan Test
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Input 
                  placeholder="08123456789" 
                  value={testNumber} 
                  onChange={(e) => setTestNumber(e.target.value)}
                />
                <Input 
                  placeholder="Halo ini pesan test..." 
                  value={testMessage} 
                  onChange={(e) => setTestMessage(e.target.value)}
                />
                <Button 
                  onClick={() => sendTestMutation.mutate({ number: testNumber, text: testMessage })}
                  disabled={!testNumber || !testMessage || sendTestMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {sendTestMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Send className="h-4 w-4 mr-1" />}
                  Kirim Test
                </Button>
              </div>
            </div>
          )}

          {/* Reset Session */}
          <div className="border-t pt-6 dark:border-slate-800">
            <h4 className="font-semibold text-sm mb-1 flex items-center gap-2 text-red-600 dark:text-red-400">
              <Trash2 className="h-4 w-4" />
              Hapus Sesi WhatsApp
            </h4>
            <p className="text-xs text-slate-500 mb-3">Gunakan fitur ini jika sesi WhatsApp di HP Anda sudah logout atau QR Code tidak muncul. Data sesi lama akan dihapus dan Anda harus scan ulang.</p>
            <Button 
              variant="destructive"
              onClick={handleResetSession}
              disabled={resetMutation.isPending}
            >
              {resetMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Hapus & Reset Sesi WA
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* App Info */}
      <Card className="shadow-sm border-none dark:bg-slate-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base dark:text-white">
            <Shield className="h-5 w-5 text-slate-500" />
            Informasi Aplikasi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="flex justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <span className="text-slate-500">Nama Aplikasi</span>
              <span className="font-semibold dark:text-white">SiBankSampah</span>
            </div>
            <div className="flex justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <span className="text-slate-500">Versi</span>
              <span className="font-semibold dark:text-white">1.0.0</span>
            </div>
            <div className="flex justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <span className="text-slate-500">Framework</span>
              <span className="font-semibold dark:text-white">Next.js 14 + Express</span>
            </div>
            <div className="flex justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <span className="text-slate-500">Database</span>
              <span className="font-semibold dark:text-white">PostgreSQL + Drizzle ORM</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
