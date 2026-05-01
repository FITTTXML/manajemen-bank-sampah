"use client"
import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/store/useUIStore'
import { Leaf } from 'lucide-react'

interface NavItem {
  title: string
  href: string
  icon: React.ElementType
}

interface AppSidebarProps {
  navItems: NavItem[]
  userRole: string
}

export function AppSidebar({ navItems, userRole }: AppSidebarProps) {
  const pathname = usePathname()
  const { sidebarOpen, setSidebarOpen } = useUIStore()

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/50 md:hidden transition-opacity",
          sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setSidebarOpen(false)}
      />
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-50 transition-transform duration-300 ease-in-out md:static md:translate-x-0 shadow-xl flex flex-col",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex h-16 shrink-0 items-center px-6 border-b border-white/10 gap-2">
          <div className="bg-primary/20 p-2 rounded-lg text-primary-foreground">
            <Leaf className="h-6 w-6 text-green-400" />
          </div>
          <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-green-400 to-emerald-600 bg-clip-text text-transparent">
            SiBankSampah
          </span>
        </div>

        {/* Navigation */}
        <div className="px-4 py-4 flex-1 overflow-y-auto">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 px-2">
            Menu {userRole}
          </p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all group",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon
                    className={cn(
                      "h-5 w-5 shrink-0 transition-transform group-hover:scale-110 duration-200",
                      isActive ? "text-primary-foreground" : "text-slate-400 group-hover:text-white"
                    )}
                  />
                  {item.title}
                </Link>
              )
            })}
          </nav>
        </div>
      </aside>
    </>
  )
}
