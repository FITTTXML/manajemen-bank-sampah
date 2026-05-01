import React from "react"
import { Leaf } from "lucide-react"
import { ThemeToggle } from "@/components/ThemeToggle"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 relative overflow-hidden transition-colors duration-300">
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      {/* Decorative background blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary/20 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-emerald-500/20 rounded-full blur-[100px]" />
      
      <div className="w-full max-w-md p-6 relative z-10 animate-in fade-in zoom-in-95 duration-500">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-primary/10 p-3 rounded-2xl mb-4 shadow-sm border border-primary/20">
            <Leaf className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-500 to-teal-600 dark:from-emerald-400 dark:to-teal-500 bg-clip-text text-transparent">
            SiBankSampah
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 text-center">
            Platform Digital Manajemen Bank Sampah Modern
          </p>
        </div>
        
        {/* Render child form (login or register) */}
        {children}
      </div>
    </div>
  )
}
