"use client"
import React, { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Menu, Moon, Sun, User, LogOut, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useUIStore } from '@/store/useUIStore'
import { useTheme } from 'next-themes'
import { toast } from 'sonner'

interface AppHeaderProps {
  userName: string
  userRole: string
}

export function AppHeader({ userName: fallbackName, userRole: fallbackRole }: AppHeaderProps) {
  const toggleSidebar = useUIStore((state) => state.toggleSidebar)
  const { setTheme, theme } = useTheme()
  const router = useRouter()

  const [displayName, setDisplayName] = useState(fallbackName)
  const [displayRole, setDisplayRole] = useState(fallbackRole)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    try {
      const stored = localStorage.getItem('userData')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed.namaLengkap) setDisplayName(parsed.namaLengkap)
        if (parsed.role) setDisplayRole(parsed.role)
      }
    } catch (_) { /* ignore */ }
  }, [])

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('userData')
    toast.success('Berhasil keluar dari akun.')
    router.push('/login')
  }

  const initials = displayName
    ? displayName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : 'U'

  return (
    <header className="sticky top-0 z-[60] flex items-center h-16 w-full gap-4 border-b dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 px-4 md:px-6 backdrop-blur-md transition-all shadow-sm">
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={toggleSidebar}
      >
        <Menu className="h-5 w-5" />
      </Button>

      <div className="flex-1" />

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>

        {/* Profile button + dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 px-2 py-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <div className="h-9 w-9 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
              {initials}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium leading-tight dark:text-white">{displayName}</p>
              <p className="text-[10px] text-slate-500 capitalize">{displayRole}</p>
            </div>
            <ChevronDown className={`h-4 w-4 text-slate-400 hidden sm:block transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown menu */}
          {menuOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-900 rounded-xl shadow-xl border dark:border-slate-800 py-2 z-[9999] animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-4 py-2 border-b dark:border-slate-800">
                <p className="text-sm font-semibold dark:text-white">{displayName}</p>
                <p className="text-xs text-slate-500 capitalize">{displayRole}</p>
              </div>
              <div className="py-1">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Keluar dari Akun
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
