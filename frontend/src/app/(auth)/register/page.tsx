"use client"
import React, { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2, UserPlus } from "lucide-react"
import api from "@/lib/axios"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"

const registerSchema = z.object({
  namaLengkap: z.string().min(3, { message: "Nama lengkap minimal 3 karakter" }),
  email: z.string().email({ message: "Email tidak valid" }),
  nik: z.string().length(16, { message: "NIK harus berjumlah 16 digit" }).regex(/^\d+$/, "NIK hanya boleh berisi angka"),
  noWa: z.string().min(10, { message: "Nomor WhatsApp tidak valid" }),
  password: z.string().min(6, { message: "Password minimal 6 karakter" }),
})

type RegisterFormValues = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true)
    try {
      await api.post("/auth/register", {
        namaLengkap: data.namaLengkap,
        email: data.email,
        password: data.password,
        nik: data.nik,
        nomorHp: data.noWa
      })

      toast.success("Pendaftaran Berhasil!", {
        description: "Silakan login menggunakan akun Anda.",
      })
      router.push("/login")
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Terjadi kesalahan saat registrasi")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="border-none shadow-xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-md">
      <CardHeader>
        <CardTitle className="text-xl dark:text-white">Daftar Akun Baru</CardTitle>
        <CardDescription className="dark:text-slate-400">
          Isi data diri Anda di bawah ini untuk bergabung sebagai Nasabah Bank Sampah.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="namaLengkap">Nama Lengkap</Label>
            <Input id="namaLengkap" placeholder="Budi Santoso" {...register("namaLengkap")} />
            {errors.namaLengkap && <p className="text-xs text-red-500">{errors.namaLengkap.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nik">NIK KTP</Label>
              <Input id="nik" placeholder="3201..." {...register("nik")} />
              {errors.nik && <p className="text-xs text-red-500">{errors.nik.message}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="noWa">No. WhatsApp</Label>
              <Input id="noWa" placeholder="0812..." {...register("noWa")} />
              {errors.noWa && <p className="text-xs text-red-500">{errors.noWa.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="contoh@email.com" {...register("email")} />
            {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Buat Password</Label>
            <Input id="password" type="password" placeholder="••••••••" {...register("password")} />
            {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
          </div>

          <Button type="submit" className="w-full mt-6" disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Daftar Sekarang <UserPlus className="ml-2 h-4 w-4" />
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center border-t border-slate-100 dark:border-slate-800 pt-4">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Sudah punya akun? {" "}
          <Link href="/login" className="font-semibold text-primary hover:underline">
            Masuk di sini
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}
