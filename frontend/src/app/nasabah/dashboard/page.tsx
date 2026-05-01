/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"
import React from 'react';
import api from '@/lib/axios';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function NasabahDashboardPage() {
  const router = useRouter();
  const { data: dashboardData, isLoading: loading } = useQuery({
    queryKey: ['nasabahDashboard'],
    queryFn: async () => {
      const res = await api.get('/nasabah/dashboard');
      return res.data.data;
    }
  });

  const data = dashboardData || {
    saldoAktif: 0,
    aktivitasTerakhir: [] as any[],
    informasiHargaSampah: [] as any[]
  };
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-900 dark:to-teal-900 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
        {/* Decorative background circle */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-2xl"></div>
        <div className="absolute -bottom-10 right-20 w-32 h-32 bg-emerald-400/20 rounded-full blur-xl"></div>
        
        <div className="relative z-10">
          <h2 className="text-emerald-100 dark:text-emerald-200/80 font-medium tracking-wide">Saldo Tabungan Aktif</h2>
          <div className="mt-2 flex items-baseline gap-2">
            {loading ? (
              <Loader2 className="h-8 w-8 animate-spin text-white/70" />
            ) : (
              <span className="text-5xl font-extrabold tracking-tight">Rp {data.saldoAktif.toLocaleString('id-ID')}</span>
            )}
          </div>
          
          <div className="mt-8 flex gap-4">
            <button onClick={() => router.push('/nasabah/penarikan')} className="bg-white text-emerald-700 dark:bg-emerald-800 dark:text-white px-5 py-2.5 rounded-lg font-semibold shadow-sm hover:bg-slate-50 dark:hover:bg-emerald-700 transition">
              Riwayat Penarikan
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Aktivitas Terakhir</h3>
          <div className="space-y-4">
            {loading ? (
              <div className="flex justify-center p-4"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
            ) : data.aktivitasTerakhir.length === 0 ? (
              <div className="text-center text-slate-500 py-4">Belum ada riwayat aktivitas.</div>
            ) : data.aktivitasTerakhir.map((tx: any, i: number) => (
              <div key={i} className="flex justify-between items-center p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${tx.type === 'Setoran' ? 'bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400' : 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400'}`}>
                    {tx.type === 'Setoran' ? '+' : '-'}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{tx.detail}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{tx.time}</p>
                  </div>
                </div>
                <div className={`text-right font-medium ${tx.type === 'Setoran' ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}>
                  {tx.type === 'Setoran' ? '+' : '-'}Rp {tx.amount.toLocaleString('id-ID')}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Informasi Harga Sampah</h3>
          <div className="space-y-3">
            {loading ? (
              <div className="flex justify-center p-4"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
            ) : data.informasiHargaSampah.length === 0 ? (
              <div className="text-center text-slate-500 py-4">Harga belum tersedia.</div>
            ) : data.informasiHargaSampah.map((item: any, i: number) => (
              <div key={i} className="flex justify-between items-center pb-3 border-b border-slate-50 dark:border-slate-800 last:border-0 last:pb-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 p-2 rounded-lg transition">
                <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">{item.type}</span>
                <span className="text-sm text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">{item.price}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
