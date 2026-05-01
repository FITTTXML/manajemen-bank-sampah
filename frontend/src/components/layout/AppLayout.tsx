import React from "react"
import { AppSidebar } from "./AppSidebar"
import { AppHeader } from "./AppHeader"

interface NavItem {
  title: string
  href: string
  icon: React.ElementType
}

interface AppLayoutProps {
  children: React.ReactNode
  navItems: NavItem[]
  userRole: string
  userName: string
}

export function AppLayout({ children, navItems, userRole, userName }: AppLayoutProps) {
  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 relative">
      <AppSidebar navItems={navItems} userRole={userRole} />
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
        <AppHeader userName={userName} userRole={userRole} />
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
          <div className="mx-auto max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
