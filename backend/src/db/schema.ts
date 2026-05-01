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
export const metodePenarikanEnum = pgEnum('metode', ['tunai', 'transfer']);
export const statusPenarikanEnum = pgEnum('status_penarikan', ['menunggu', 'disetujui', 'ditolak', 'selesai']);
export const tipeNotifikasiEnum = pgEnum('tipe_notifikasi', ['setoran', 'penarikan', 'sistem', 'promosi']);
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
  nik: varchar('nik', { length: 16 }).notNull().unique(),
  alamat: text('alamat'),
  fotoKtp: text('foto_ktp'),
  saldo: decimal('saldo', { precision: 15, scale: 2 }).default('0'),
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

export const setoran = pgTable('setoran', {
  id: uuid('id').defaultRandom().primaryKey(),
  nasabahId: uuid('nasabah_id').references(() => nasabah.id).notNull(),
  petugasId: uuid('petugas_id').references(() => users.id).notNull(),
  totalNilai: decimal('total_nilai', { precision: 15, scale: 2 }).notNull(),
  tanggal: timestamp('tanggal').defaultNow().notNull(),
  catatan: text('catatan'),
  nomorStruk: varchar('nomor_struk', { length: 30 }).unique(),
});

export const detailSetoran = pgTable('detail_setoran', {
  id: uuid('id').defaultRandom().primaryKey(),
  setoranId: uuid('setoran_id').references(() => setoran.id).notNull(),
  jenisSampahId: uuid('jenis_sampah_id').references(() => jenisSampah.id).notNull(),
  beratKg: decimal('berat_kg', { precision: 10, scale: 2 }).notNull(),
  hargaSaatItu: decimal('harga_saat_itu', { precision: 10, scale: 2 }).notNull(),
  nilai: decimal('nilai', { precision: 10, scale: 2 }).notNull(),
});

export const penarikan = pgTable('penarikan', {
  id: uuid('id').defaultRandom().primaryKey(),
  nasabahId: uuid('nasabah_id').references(() => nasabah.id).notNull(),
  jumlah: decimal('jumlah', { precision: 15, scale: 2 }).notNull(),
  metode: metodePenarikanEnum('metode').notNull(),
  namaBank: varchar('nama_bank', { length: 100 }),
  nomorRekening: varchar('nomor_rekening', { length: 50 }),
  status: statusPenarikanEnum('status').default('menunggu').notNull(),
  alasanTolak: text('alasan_tolak'),
  diajukanPada: timestamp('diajukan_pada').defaultNow().notNull(),
  diprosesOleh: uuid('diproses_oleh').references(() => users.id),
  diprosesPada: timestamp('diproses_pada'),
  diselesaikanOleh: uuid('diselesaikan_oleh').references(() => users.id),
  diselesaikanPada: timestamp('diselesaikan_pada'),
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
  tanggalJemput: timestamp('tanggal_jemput'),
  status: statusPenjemputanEnum('status').default('menunggu').notNull(),
  petugasId: uuid('petugas_id').references(() => users.id),
  alasanTolak: text('alasan_tolak'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// RELATIONS
export const usersRelations = relations(users, ({ one, many }) => ({
  nasabahProfile: one(nasabah, {
    fields: [users.id],
    references: [nasabah.userId]
  }),
  setoransDiterima: many(setoran), 
  notifikasis: many(notifikasi),
}));

export const nasabahRelations = relations(nasabah, ({ one, many }) => ({
  user: one(users, {
    fields: [nasabah.userId],
    references: [users.id]
  }),
  setorans: many(setoran),
  penarikans: many(penarikan),
}));

export const setoranRelations = relations(setoran, ({ one, many }) => ({
  nasabah: one(nasabah, {
    fields: [setoran.nasabahId],
    references: [nasabah.id]
  }),
  petugas: one(users, {
    fields: [setoran.petugasId],
    references: [users.id]
  }),
  details: many(detailSetoran),
}));

export const detailSetoranRelations = relations(detailSetoran, ({ one }) => ({
  setoran: one(setoran, {
    fields: [detailSetoran.setoranId],
    references: [setoran.id]
  }),
  jenisSampah: one(jenisSampah, {
    fields: [detailSetoran.jenisSampahId],
    references: [jenisSampah.id]
  }),
}));

export const penjemputanRelations = relations(penjemputan, ({ one }) => ({
  nasabahRef: one(nasabah, {
    fields: [penjemputan.nasabahId],
    references: [nasabah.id]
  }),
  petugasRef: one(users, {
    fields: [penjemputan.petugasId],
    references: [users.id]
  }),
}));
