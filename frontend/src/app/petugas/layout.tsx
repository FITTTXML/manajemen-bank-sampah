"use client"
import React from "react"
import { AppLayout } from "@/components/layout/AppLayout"
import { 
  LayoutDashboard, 
  Truck,
  Brain,
  Tag
} from "lucide-react"

const petugasNavItems = [
  { title: "Dashboard Harian", href: "/petugas/dashboard", icon: LayoutDashboard },
  { title: "Kelola Penjemputan", href: "/petugas/penjemputan", icon: Truck },
  { title: "Katalog & Tarif Jasa", href: "/petugas/katalog", icon: Tag },
  { title: "Pemilahan AI", href: "/petugas/pemilahan", icon: Brain },
]

export default function PetugasLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppLayout navItems={petugasNavItems} userRole="Petugas" userName="Petugas Lapangan">
      {children}
    </AppLayout>
  )
}
