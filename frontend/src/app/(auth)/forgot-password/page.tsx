"use client"
import React, { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Loader2, ArrowLeft, Send, KeyRound, CheckCircle2 } from "lucide-react"
import api from "@/lib/axios"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"

type Step = 'email' | 'otp' | 'done'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('email')
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [maskedHp, setMaskedHp] = useState('')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return toast.error('Masukkan email atau username Anda')

    setIsLoading(true)
    try {
      const res = await api.post('/auth/forgot-password', { email })
      setMaskedHp(res.data.maskedHp)
      toast.success(res.data.message)
      setStep('otp')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal mengirim kode OTP')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code || !newPassword) return toast.error('Isi semua field')
    if (newPassword.length < 6) return toast.error('Password minimal 6 karakter')
    if (newPassword !== confirmPassword) return toast.error('Konfirmasi password tidak cocok')

    setIsLoading(true)
    try {
      const res = await api.post('/auth/reset-password', { email, code, newPassword })
      toast.success(res.data.message)
      setStep('done')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal mereset password')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="border-none shadow-xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-md max-w-md w-full">
      <CardHeader>
        <CardTitle className="text-xl dark:text-white flex items-center gap-2">
          <KeyRound className="h-5 w-5 text-primary" />
          Lupa Password
        </CardTitle>
        <CardDescription className="dark:text-slate-400">
          {step === 'email' && 'Masukkan email/username Anda. Kode OTP akan dikirim via WhatsApp.'}
          {step === 'otp' && `Kode OTP telah dikirim ke WhatsApp ${maskedHp}`}
          {step === 'done' && 'Password berhasil diubah!'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {step === 'email' && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email / Username</Label>
              <Input
                id="email"
                type="text"
                placeholder="contoh@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
              Kirim Kode OTP via WhatsApp
            </Button>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label>Kode OTP (6 digit)</Label>
              <Input
                type="text"
                maxLength={6}
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                className="text-center text-2xl tracking-[0.5em] font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label>Password Baru</Label>
              <Input
                type="password"
                placeholder="Minimal 6 karakter"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Konfirmasi Password Baru</Label>
              <Input
                type="password"
                placeholder="Ulangi password baru"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <KeyRound className="h-4 w-4 mr-2" />}
              Reset Password
            </Button>
            <button
              type="button"
              onClick={() => { setStep('email'); setCode(''); }}
              className="w-full text-sm text-slate-500 hover:text-primary transition-colors"
            >
              Kirim ulang kode OTP
            </button>
          </form>
        )}

        {step === 'done' && (
          <div className="text-center space-y-4 py-4">
            <CheckCircle2 className="h-16 w-16 text-emerald-500 mx-auto" />
            <p className="text-lg font-semibold dark:text-white">Password Berhasil Direset!</p>
            <p className="text-sm text-slate-500">Silakan login dengan password baru Anda.</p>
            <Button onClick={() => router.push('/login')} className="w-full">
              Masuk ke Akun
            </Button>
          </div>
        )}
      </CardContent>
      {step !== 'done' && (
        <CardFooter className="flex justify-center border-t border-slate-100 dark:border-slate-800 pt-4">
          <Link href="/login" className="text-sm text-slate-500 hover:text-primary flex items-center gap-1 transition-colors">
            <ArrowLeft className="h-3 w-3" /> Kembali ke Halaman Login
          </Link>
        </CardFooter>
      )}
    </Card>
  )
}
