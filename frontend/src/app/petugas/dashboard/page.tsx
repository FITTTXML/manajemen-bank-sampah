/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"
import React from 'react';
import api from '@/lib/axios';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';

export default function PetugasDashboardPage() {
  const { data: dashboardData, isLoading: loading } = useQuery({
    queryKey: ['petugasDashboard'],
    queryFn: async () => {
      const res = await api.get('/petugas/dashboard');
      return res.data.data;
    }
  });

  const data = dashboardData || {
    nasabahDilayani: 0,
    totalSetoranKg: 0,
    penarikanTunai: 0,
    riwayatHarian: [] as any[]
  };
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 transition-all hover:shadow-md">
          <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Nasabah Dilayani</h3>
          <p className="text-3xl font-bold mt-2 text-slate-800 dark:text-white">
            {loading ? <Loader2 className="h-6 w-6 animate-spin text-slate-400"/> : `${data.nasabahDilayani} Orang`}
          </p>
          <p className="text-xs mt-2 text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400 inline-block px-2 py-1 rounded-md mb-2 sm:mb-0">Hari Ini</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 transition-all hover:shadow-md">
          <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Sampah Dijemput</h3>
          <p className="text-3xl font-bold mt-2 text-slate-800 dark:text-white">
            {loading ? <Loader2 className="h-6 w-6 animate-spin text-slate-400"/> : `${data.totalSetoranKg} Kg`}
          </p>
          <p className="text-xs mt-2 text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400 inline-block px-2 py-1 rounded-md mb-2 sm:mb-0">Hari Ini</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 transition-all hover:shadow-md">
          <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Pendapatan Jasa</h3>
          <p className="text-3xl font-bold mt-2 text-slate-800 dark:text-white">
            {loading ? <Loader2 className="h-6 w-6 animate-spin text-slate-400"/> : `Rp ${data.penarikanTunai.toLocaleString('id-ID')}`}
          </p>
          <p className="text-xs mt-2 text-amber-600 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400 inline-block px-2 py-1 rounded-md mb-2 sm:mb-0">Hari Ini Lunas</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Riwayat Penjemputan Harian</h3>
          <a href="/petugas/penjemputan" className="px-4 py-2 bg-emerald-600 text-white rounded-md text-sm font-medium hover:bg-emerald-700 transition">
            Lihat Permintaan Penjemputan
          </a>
        </div>
        
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-12 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-emerald-500" /></div>
          ) : data.riwayatHarian.length === 0 ? (
            <div className="py-12 text-center text-slate-500 dark:text-slate-400">Belum ada transaksi hari ini</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-sm font-medium text-slate-500 dark:text-slate-400">
                  <th className="pb-3 px-4">Waktu</th>
                  <th className="pb-3 px-4">Nasabah</th>
                  <th className="pb-3 px-4">Jenis</th>
                  <th className="pb-3 px-4">Detail</th>
                  <th className="pb-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {data.riwayatHarian.map((tx: any, i: number) => (
                  <tr key={i} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400">{tx.time}</td>
                    <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">{tx.name}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400`}>
                        {tx.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{tx.detail}</td>
                    <td className="py-3 px-4 text-right">
                      <button className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 text-xs font-medium">Lihat Detail</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
