"use client"
import React, { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2, ArrowRight } from "lucide-react"
import api from "@/lib/axios"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

const loginSchema = z.object({
  email: z.string().min(3, { message: "Masukkan Email atau Username yang valid" }),
  password: z.string().min(6, { message: "Password minimal 6 karakter" }),
  role: z.enum(["admin", "petugas", "nasabah"] as const)
})

type LoginFormValues = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", role: "nasabah" }
  })

  // To connect Select component to react-hook-form
  const roleValue = watch("role")

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true)
    try {
      const response = await api.post("/auth/login", {
        email: data.email,
        password: data.password
      })

      const { token, user } = response.data

      // Save to localStorage
      localStorage.setItem("token", token)
      localStorage.setItem("userData", JSON.stringify(user))

      toast.success("Login Berhasil!")

      // In real implementation, we route based on user.role
      // Here we match with the data they selected to be safe, or we can use user.role directly
      const activeRole = user.role || data.role

      if (activeRole === "admin") router.push("/admin/dashboard")
      else if (activeRole === "petugas") router.push("/petugas/dashboard")
      else router.push("/nasabah/dashboard")

    } catch (error: any) {
      toast.error(error.response?.data?.message || "Terjadi kesalahan saat login")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="border-none shadow-xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-md">
      <CardHeader>
        <CardTitle className="text-xl dark:text-white">Masuk ke Akun Anda</CardTitle>
        <CardDescription className="dark:text-slate-400">
          Silakan masukkan email dan password untuk melanjutkan.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="role">Masuk Sebagai</Label>
            <Select onValueChange={(val) => setValue("role", val as any)} defaultValue={roleValue}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih peran" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin / Pengurus</SelectItem>
                <SelectItem value="petugas">Petugas Lapangan</SelectItem>
                <SelectItem value="nasabah">Nasabah</SelectItem>
              </SelectContent>
            </Select>
            {errors.role && <p className="text-xs text-red-500">{errors.role.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email / Username</Label>
            <Input id="email" type="text" placeholder="Budi123 atau contoh@email.com" {...register("email")} />
            {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link href="/forgot-password" className="text-xs text-primary hover:underline font-medium">
                Lupa Password?
              </Link>
            </div>
            <Input id="password" type="password" placeholder="••••••••" {...register("password")} />
            {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
          </div>

          <Button type="submit" className="w-full mt-6" disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Masuk <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center border-t border-slate-100 dark:border-slate-800 pt-4">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Belum punya akun? {" "}
          <Link href="/register" className="font-semibold text-primary hover:underline">
            Daftar Sekarang
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}
