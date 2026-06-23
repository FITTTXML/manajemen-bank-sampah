"use client"
import React from "react"
import { AppLayout } from "@/components/layout/AppLayout"
import { 
  LayoutDashboard, 
  Users, 
  Truck, 
  Tags, 
  BarChart3, 
  Settings,
  MessageSquareWarning
} from "lucide-react"

const adminNavItems = [
  { title: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { title: "Manajemen Nasabah", href: "/admin/nasabah", icon: Users },
  { title: "Data Penjemputan", href: "/admin/penjemputan", icon: Truck },
  { title: "Jenis & Tarif Sampah", href: "/admin/jenis-sampah", icon: Tags },
  { title: "Laporan & Statistik", href: "/admin/laporan", icon: BarChart3 },
  { title: "Inbox Pengaduan", href: "/admin/pengaduan", icon: MessageSquareWarning },
  { title: "Pengaturan", href: "/admin/pengaturan", icon: Settings },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppLayout navItems={adminNavItems} userRole="Admin" userName="Ketua Pengurus">
      {children}
    </AppLayout>
  )
}
