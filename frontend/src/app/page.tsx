import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Recycle, Leaf, TrendingUp, ShieldCheck, Truck, Brain, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 relative overflow-hidden font-sans transition-colors duration-300">
      {/* Abstract Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-400/20 blur-[100px]" />
        <div className="absolute top-[20%] right-[-5%] w-[30%] h-[50%] rounded-full bg-blue-400/10 blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[20%] w-[40%] h-[40%] rounded-full bg-emerald-300/20 blur-[120px]" />
      </div>

      {/* Navigation */}
      <nav className="container mx-auto px-6 py-4 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2">
          <div className="bg-emerald-600 p-2 rounded-xl text-white">
            <Recycle className="h-6 w-6" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100">SiBankSampah</span>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-emerald-600 transition-colors">
            Masuk
          </Link>
          <Link href="/register">
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-6 shadow-md shadow-emerald-600/20">
              Daftar
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="container mx-auto px-6 pt-16 pb-12 md:pt-24 md:pb-20 relative z-10">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100/50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-sm font-medium mb-6 border border-emerald-200/50 dark:border-emerald-800/50 backdrop-blur-sm">
              <Leaf className="h-4 w-4" />
              <span>Langkah kecil untuk bumi yang lebih bersih</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-6 leading-tight">
              Ubah Sampah Anda Menjadi <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-600 dark:from-emerald-400 dark:to-teal-500">Nilai Berharga</span>
            </h1>
            
            <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
              Platform perbankan sampah modern yang memudahkan Anda mengelola, menyetor, dan melacak sampah daur ulang Anda secara waktu nyata.
            </p>
            
            <div className="flex flex-col sm:flex-row items-start gap-4">
              <Link href="/register">
                <Button size="lg" className="h-14 px-8 text-base bg-emerald-600 hover:bg-emerald-700 text-white rounded-full group shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/40 hover:-translate-y-1 active:scale-95 transition-all duration-300">
                  Mulai Menabung
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="h-14 px-8 text-base rounded-full border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 hover:-translate-y-1 active:scale-95 transition-all duration-300">
                  Masuk Dashboard
                </Button>
              </Link>
            </div>
          </div>

          {/* Hero Image */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/20 to-teal-400/20 rounded-3xl blur-2xl group-hover:blur-3xl transition-all duration-500" />
            <Image
              src="/images/hero-recycle.png"
              alt="Komunitas daur ulang sampah"
              width={600}
              height={500}
              className="relative rounded-3xl shadow-2xl shadow-emerald-900/10 border border-white/20 dark:border-slate-800 group-hover:scale-[1.02] group-hover:-translate-y-2 transition-transform duration-500"
              priority
            />
          </div>
        </div>
      </main>

      {/* Stats */}
      <section className="container mx-auto px-6 py-8 relative z-10">
        <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md rounded-3xl border border-white/40 dark:border-slate-800 shadow-xl p-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="group hover:-translate-y-2 transition-transform duration-300 p-4 rounded-2xl hover:bg-white/50 dark:hover:bg-slate-800/50">
            <p className="text-3xl font-extrabold text-emerald-600 group-hover:scale-110 transition-transform">♻️</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">500+</p>
            <p className="text-sm text-slate-500">Kg Sampah Terkumpul</p>
          </div>
          <div className="group hover:-translate-y-2 transition-transform duration-300 p-4 rounded-2xl hover:bg-white/50 dark:hover:bg-slate-800/50">
            <p className="text-3xl font-extrabold text-emerald-600 group-hover:scale-110 transition-transform">👥</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">100+</p>
            <p className="text-sm text-slate-500">Nasabah Aktif</p>
          </div>
          <div className="group hover:-translate-y-2 transition-transform duration-300 p-4 rounded-2xl hover:bg-white/50 dark:hover:bg-slate-800/50">
            <p className="text-3xl font-extrabold text-emerald-600 group-hover:scale-110 transition-transform">🏘️</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">5+</p>
            <p className="text-sm text-slate-500">Wilayah Terlayani</p>
          </div>
          <div className="group hover:-translate-y-2 transition-transform duration-300 p-4 rounded-2xl hover:bg-white/50 dark:hover:bg-slate-800/50">
            <p className="text-3xl font-extrabold text-emerald-600 group-hover:scale-110 transition-transform">🌱</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">100%</p>
            <p className="text-sm text-slate-500">Transparan</p>
          </div>
        </div>
      </section>

      {/* Features with Image */}
      <section className="container mx-auto px-6 py-20 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white mb-4">
            Kenapa Memilih <span className="text-emerald-600">SiBankSampah</span>?
          </h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
            Platform lengkap untuk mengelola bank sampah dengan teknologi modern dan ramah lingkungan.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
          <div className="relative group">
            <div className="absolute inset-0 bg-emerald-400/20 rounded-3xl blur-2xl group-hover:blur-3xl transition-all duration-500 opacity-0 group-hover:opacity-100" />
            <Image
              src="/images/waste-sorting.png"
              alt="Pemilahan sampah terorganisir"
              width={550}
              height={400}
              className="relative rounded-3xl shadow-xl border border-white/20 dark:border-slate-800 group-hover:-translate-y-2 group-hover:shadow-2xl transition-all duration-500"
            />
          </div>
          <div className="space-y-8">
            <div className="flex gap-4 group cursor-default">
              <div className="h-12 w-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                <Recycle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">Setor Lebih Mudah</h3>
                <p className="text-slate-600 dark:text-slate-400">Sistem pencatatan terpusat yang mencatat setiap kilogram sampah yang Anda setorkan ke bank sampah.</p>
              </div>
            </div>
            <div className="flex gap-4 group cursor-default">
              <div className="h-12 w-12 rounded-2xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                <Brain className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Pemilahan AI Cerdas</h3>
                <p className="text-slate-600 dark:text-slate-400">Teknologi AI yang membantu mengklasifikasi jenis sampah secara otomatis dengan akurasi tinggi.</p>
              </div>
            </div>
            <div className="flex gap-4 group cursor-default">
              <div className="h-12 w-12 rounded-2xl bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                <Truck className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">Jemput ke Rumah</h3>
                <p className="text-slate-600 dark:text-slate-400">Ajukan penjemputan sampah dan petugas akan datang ke lokasi Anda dengan notifikasi WhatsApp.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Second row */}
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 order-2 md:order-1">
            <div className="flex gap-4 group cursor-default">
              <div className="h-12 w-12 rounded-2xl bg-teal-100 dark:bg-teal-900/50 flex items-center justify-center text-teal-600 dark:text-teal-400 shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">Laporan Real-time</h3>
                <p className="text-slate-600 dark:text-slate-400">Pantau statistik dan laporan setoran sampah secara real-time dengan grafik interaktif.</p>
              </div>
            </div>
            <div className="flex gap-4 group cursor-default">
              <div className="h-12 w-12 rounded-2xl bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Aman & Transparan</h3>
                <p className="text-slate-600 dark:text-slate-400">Semua riwayat dan data transaksi diamankan dan tercatat secara transparan.</p>
              </div>
            </div>
            <div className="flex gap-4 group cursor-default">
              <div className="h-12 w-12 rounded-2xl bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">Multi-Role</h3>
                <p className="text-slate-600 dark:text-slate-400">Dashboard berbeda untuk Admin, Petugas, dan Nasabah sesuai kebutuhan masing-masing.</p>
              </div>
            </div>
          </div>
          <div className="order-1 md:order-2 relative group">
            <div className="absolute inset-0 bg-blue-400/20 rounded-3xl blur-2xl group-hover:blur-3xl transition-all duration-500 opacity-0 group-hover:opacity-100" />
            <Image
              src="/images/clean-environment.png"
              alt="Lingkungan bersih dan hijau"
              width={550}
              height={400}
              className="relative rounded-3xl shadow-xl border border-white/20 dark:border-slate-800 group-hover:-translate-y-2 group-hover:shadow-2xl transition-all duration-500"
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-6 py-20 relative z-10">
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-3xl p-12 md:p-16 text-center text-white shadow-2xl shadow-emerald-900/20 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:w-80 group-hover:h-80 transition-all duration-700" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-2xl group-hover:w-64 group-hover:h-64 transition-all duration-700" />
          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4 group-hover:scale-[1.02] transition-transform duration-300">Siap Menjaga Lingkungan?</h2>
            <p className="text-emerald-100 text-lg mb-8 max-w-xl mx-auto">
              Bergabunglah bersama ratusan nasabah lainnya dan mulai kontribusi Anda untuk bumi yang lebih bersih.
            </p>
            <Link href="/register">
              <Button size="lg" className="h-14 px-10 text-base bg-white text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 rounded-full font-bold shadow-lg hover:shadow-xl hover:-translate-y-1 active:scale-95 transition-all duration-300 group/btn">
                Daftar Sekarang — Gratis!
                <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-6 py-8 text-center text-slate-500 text-sm border-t border-slate-200 dark:border-slate-800">
        <p>&copy; {new Date().getFullYear()} SiBankSampah. Semua Hak Cipta Dilindungi.</p>
      </footer>
    </div>
  );
}
