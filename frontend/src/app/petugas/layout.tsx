"use client"
import React from "react"
import { AppLayout } from "@/components/layout/AppLayout"
import { 
  LayoutDashboard, 
  Recycle,
  Brain
} from "lucide-react"

const petugasNavItems = [
  { title: "Dashboard Harian", href: "/petugas/dashboard", icon: LayoutDashboard },
  { title: "Input Setoran Baru", href: "/petugas/setoran", icon: Recycle },
  { title: "Pemilahan AI", href: "/petugas/pemilahan", icon: Brain },
]

export default function PetugasLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppLayout navItems={petugasNavItems} userRole="Petugas" userName="Petugas Lapangan">
      {children}
    </AppLayout>
  )
}
