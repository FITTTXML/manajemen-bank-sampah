import { 
  pgTable, 
  uuid, 
  varchar, 
  text, 
  boolean, 
  timestamp, 
  decimal, 
  date,
  jsonb,
  pgEnum
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ENUMS
export const roleEnum = pgEnum('role', ['admin', 'petugas', 'nasabah']);
export const kategoriSampahEnum = pgEnum('kategori', ['organik', 'plastik', 'kertas', 'logam', 'elektronik', 'kain', 'lainnya']);
export const metodePembayaranEnum = pgEnum('metode_pembayaran', ['cod', 'transfer']);
export const statusPembayaranEnum = pgEnum('status_pembayaran', ['belum_dibayar', 'menunggu_konfirmasi', 'lunas']);
export const tipeNotifikasiEnum = pgEnum('tipe_notifikasi', ['penjemputan', 'sistem', 'promosi']);
export const kanalNotifikasiEnum = pgEnum('kanal', ['in_app', 'email', 'whatsapp']);

// TABLES
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  username: varchar('username', { length: 50 }).notNull().unique(),
  namaLengkap: varchar('nama_lengkap', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  nomorHp: varchar('nomor_hp', { length: 20 }),
  role: roleEnum('role').default('nasabah').notNull(),
  status: boolean('status').default(true),
  fotoProfil: text('foto_profil'),
  lastLogin: timestamp('last_login'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const nasabah = pgTable('nasabah', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  noAnggota: varchar('no_anggota', { length: 20 }).notNull().unique(),
  alamat: text('alamat'),
  fotoKtp: text('foto_ktp'),
  tanggalGabung: date('tanggal_gabung').defaultNow().notNull(),
  catatan: text('catatan'),
});

export const jenisSampah = pgTable('jenis_sampah', {
  id: uuid('id').defaultRandom().primaryKey(),
  nama: varchar('nama', { length: 100 }).notNull(),
  kategori: kategoriSampahEnum('kategori').notNull(),
  hargaPerKg: decimal('harga_per_kg', { precision: 10, scale: 2 }).notNull(),
  satuan: varchar('satuan', { length: 20 }).default('kg'),
  deskripsi: text('deskripsi'),
  fotoUrl: text('foto_url'),
  aktif: boolean('aktif').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const riwayatHargaSampah = pgTable('riwayat_harga_sampah', {
  id: uuid('id').defaultRandom().primaryKey(),
  jenisSampahId: uuid('jenis_sampah_id').references(() => jenisSampah.id).notNull(),
  hargaLama: decimal('harga_lama', { precision: 10, scale: 2 }),
  hargaBaru: decimal('harga_baru', { precision: 10, scale: 2 }).notNull(),
  diubahOleh: uuid('diubah_oleh').references(() => users.id),
  berlakuSejak: timestamp('berlaku_sejak').defaultNow().notNull(),
});



export const notifikasi = pgTable('notifikasi', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  judul: varchar('judul', { length: 255 }).notNull(),
  pesan: text('pesan').notNull(),
  tipe: tipeNotifikasiEnum('tipe').notNull(),
  kanal: kanalNotifikasiEnum('kanal').notNull(),
  sudahDibaca: boolean('sudah_dibaca').default(false),
  relasiId: uuid('relasi_id'),
  relasiTipe: varchar('relasi_tipe', { length: 50 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const auditLog = pgTable('audit_log', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id),
  aksi: varchar('aksi', { length: 100 }).notNull(),
  entitas: varchar('entitas', { length: 100 }).notNull(),
  entitasId: uuid('entitas_id'),
  dataLama: jsonb('data_lama'),
  dataBaru: jsonb('data_baru'),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const pengaduan = pgTable('pengaduan', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  subjek: text('subjek').notNull(),
  pesan: text('pesan').notNull(),
  status: text('status', { enum: ['menunggu_tanggapan', 'diproses', 'selesai'] }).default('menunggu_tanggapan').notNull(),
  tanggapan: text('tanggapan'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const statusPenjemputanEnum = pgEnum('status_penjemputan', ['menunggu', 'dijemput', 'selesai', 'ditolak']);

export const penjemputan = pgTable('penjemputan', {
  id: uuid('id').defaultRandom().primaryKey(),
  nasabahId: uuid('nasabah_id').references(() => nasabah.id).notNull(),
  alamat: text('alamat').notNull(),
  catatan: text('catatan'),
  jenisSampahDesc: text('jenis_sampah_desc').notNull(),
  estimasiBerat: varchar('estimasi_berat', { length: 50 }),
  tanggalRequest: timestamp('tanggal_request').defaultNow().notNull(),
  tanggalJadwal: timestamp('tanggal_jadwal'),
  tanggalJemput: timestamp('tanggal_jemput'),
  status: statusPenjemputanEnum('status').default('menunggu').notNull(),
  petugasId: uuid('petugas_id').references(() => users.id),
  alasanTolak: text('alasan_tolak'),
  
  // Payment info
  totalBiaya: decimal('total_biaya', { precision: 15, scale: 2 }).default('0'),
  metodePembayaran: metodePembayaranEnum('metode_pembayaran'),
  buktiPembayaran: text('bukti_pembayaran'),
  statusPembayaran: statusPembayaranEnum('status_pembayaran').default('belum_dibayar'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const detailPenjemputan = pgTable('detail_penjemputan', {
  id: uuid('id').defaultRandom().primaryKey(),
  penjemputanId: uuid('penjemputan_id').references(() => penjemputan.id).notNull(),
  jenisSampahId: uuid('jenis_sampah_id').references(() => jenisSampah.id).notNull(),
  beratKg: decimal('berat_kg', { precision: 10, scale: 2 }).notNull(),
  hargaSaatItu: decimal('harga_saat_itu', { precision: 10, scale: 2 }).notNull(),
  nilai: decimal('nilai', { precision: 10, scale: 2 }).notNull(), // berat * harga
});

// RELATIONS
export const usersRelations = relations(users, ({ one, many }) => ({
  nasabahProfile: one(nasabah, {
    fields: [users.id],
    references: [nasabah.userId]
  }),
  penjemputansDiproses: many(penjemputan), 
  notifikasis: many(notifikasi),
}));

export const nasabahRelations = relations(nasabah, ({ one, many }) => ({
  user: one(users, {
    fields: [nasabah.userId],
    references: [users.id]
  }),
  penjemputans: many(penjemputan),
}));

export const penjemputanRelations = relations(penjemputan, ({ one, many }) => ({
  nasabahRef: one(nasabah, {
    fields: [penjemputan.nasabahId],
    references: [nasabah.id]
  }),
  petugasRef: one(users, {
    fields: [penjemputan.petugasId],
    references: [users.id]
  }),
  details: many(detailPenjemputan),
}));

export const detailPenjemputanRelations = relations(detailPenjemputan, ({ one }) => ({
  penjemputan: one(penjemputan, {
    fields: [detailPenjemputan.penjemputanId],
    references: [penjemputan.id]
  }),
  jenisSampah: one(jenisSampah, {
    fields: [detailPenjemputan.jenisSampahId],
    references: [jenisSampah.id]
  }),
}));
