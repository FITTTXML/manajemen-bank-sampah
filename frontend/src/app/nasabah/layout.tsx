"use client"
import React from "react"
import { AppLayout } from "@/components/layout/AppLayout"
import { 
  LayoutDashboard, 
  Recycle, 
  Tags,
  MessageSquareWarning,
  Truck,
  Brain
} from "lucide-react"

const nasabahNavItems = [
  { title: "Dashboard", href: "/nasabah/dashboard", icon: LayoutDashboard },
  { title: "Riwayat Setoran", href: "/nasabah/setoran", icon: Recycle },
  { title: "Jemput Sampah", href: "/nasabah/penjemputan", icon: Truck },
  { title: "Pemilahan AI", href: "/nasabah/pemilahan", icon: Brain },
  { title: "Harga Sampah", href: "/nasabah/katalog", icon: Tags },
  { title: "Pengaduan Laporan", href: "/nasabah/pengaduan", icon: MessageSquareWarning },
]

export default function NasabahLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppLayout navItems={nasabahNavItems} userRole="Nasabah" userName="Nasabah Terdaftar">
      {children}
    </AppLayout>
  )
}
