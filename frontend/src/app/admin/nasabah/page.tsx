"use client"
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Search, Plus, UserCircle, MoreVertical, Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import api from '@/lib/axios'

const userSchema = z.object({
  namaLengkap: z.string().min(3, "Minimal 3 karakter"),
  email: z.string().email("Email tidak valid"),
  password: z.string().min(6, "Minimal 6 karakter"),
  nomorHp: z.string().min(10, "Nomor tidak valid"),
  role: z.enum(["admin", "petugas", "nasabah"]),
  nik: z.string().optional(),
  alamat: z.string().optional()
})
type UserFormValues = z.infer<typeof userSchema>

type UserData = {
  id: string;
  namaLengkap: string;
  email: string;
  role: string;
  status: boolean;
  nomorHp: string;
}

export default function ManajemenNasabahPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { register, handleSubmit, formState: { errors }, watch, setValue, reset } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: { role: 'nasabah' }
  })

  const watchRole = watch('role')

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const res = await api.get('/users')
      setUsers(res.data.data)
    } catch (error) {
      toast.error("Gagal mengambil data pengguna")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const onSubmit = async (data: UserFormValues) => {
    setIsSubmitting(true)
    try {
      await api.post('/users', data)
      toast.success("Pengguna berhasil ditambahkan")
      setIsDialogOpen(false)
      reset()
      fetchUsers()
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Gagal menambahkan pengguna")
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await api.patch(`/users/${id}/status`, { status: !currentStatus })
      toast.success("Status pengguna diperbarui")
      fetchUsers()
    } catch (error) {
      toast.error("Gagal mengubah status")
    }
  }

  const filteredUsers = users.filter(u => 
    u.namaLengkap.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Manajemen Pengguna</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Kelola data nasabah, petugas, dan hak akses mereka.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="shrink-0 gap-2">
              <Plus className="h-4 w-4" />
              Tambah Pengguna
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] overflow-y-auto max-h-[90vh] dark:bg-slate-900 dark:text-white">
            <DialogHeader>
              <DialogTitle>Daftarkan Pengguna Baru</DialogTitle>
              <DialogDescription className="dark:text-slate-400">
                Pilih peran pengguna. Nasabah akan otomatis dibuatkan nomor identitas.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Peran / Role</Label>
                <Select onValueChange={(val) => setValue("role", val as any)} defaultValue={watchRole}>
                  <SelectTrigger><SelectValue placeholder="Pilih peran" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="petugas">Petugas Lapangan</SelectItem>
                    <SelectItem value="nasabah">Nasabah</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Nama Lengkap</Label>
                <Input placeholder="Contoh: Budi Santoso" {...register("namaLengkap")} />
                {errors.namaLengkap && <p className="text-xs text-red-500">{errors.namaLengkap.message}</p>}
              </div>

              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" placeholder="contoh@mail.com" {...register("email")} />
                {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
              </div>

              <div className="space-y-2">
                <Label>Password</Label>
                <Input type="password" placeholder="••••••••" {...register("password")} />
                {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
              </div>

              <div className="space-y-2">
                <Label>No. WhatsApp / HP</Label>
                <Input placeholder="0812xxxx" {...register("nomorHp")} />
                {errors.nomorHp && <p className="text-xs text-red-500">{errors.nomorHp.message}</p>}
              </div>

              {watchRole === 'nasabah' && (
                <>
                  <div className="space-y-2">
                    <Label>Nomor Induk Kependudukan (NIK)</Label>
                    <Input placeholder="3201xxxx" {...register("nik")} />
                    {errors.nik && <p className="text-xs text-red-500">{errors.nik.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Alamat Lengkap</Label>
                    <Input placeholder="Jl. Mawar No. 10..." {...register("alamat")} />
                  </div>
                </>
              )}
              <Button type="submit" className="w-full mt-4" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : null}
                Simpan
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-none shadow-sm dark:bg-slate-900">
        <CardHeader className="p-4 sm:p-6 pb-0">
          <div className="flex items-center gap-2 max-w-sm">
            <div className="relative w-full border-b pb-2">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
              <Input
                type="search"
                placeholder="Cari nama atau email..."
                className="w-full pl-9 bg-slate-50 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-400 border-none shadow-inner"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 sm:p-6 sm:pt-4">
          <div className="rounded-md border border-slate-100 dark:border-slate-800 overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/50 dark:bg-slate-800/50">
                <TableRow>
                  <TableHead className="w-[80px]">No.</TableHead>
                  <TableHead>Identitas</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Kontak</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px]">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-10 opacity-50"><Loader2 className="animate-spin h-6 w-6 mx-auto"/></TableCell></TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-10 font-medium text-slate-500">Tidak ada pengguna ditemukan.</TableCell></TableRow>
                ) : filteredUsers.map((user, index) => (
                  <TableRow key={user.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors dark:border-slate-800">
                    <TableCell className="font-medium text-slate-500 dark:text-slate-400">{index + 1}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <UserCircle className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-white">{user.namaLengkap}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize text-slate-600 dark:text-slate-300 dark:border-slate-700">{user.role}</Badge>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-slate-600 dark:text-slate-300">{user.nomorHp || '-'}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.status ? 'default' : 'secondary'} 
                             className={user.status ? 'bg-green-100 text-green-800 hover:bg-green-100 shadow-none border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-900' : 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400'}>
                        {user.status ? 'Aktif' : 'Diblokir'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => toggleStatus(user.id, user.status)} className="text-xs dark:hover:bg-slate-800 dark:text-slate-300">
                        {user.status ? 'Blokir' : 'Buka Blokir'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
