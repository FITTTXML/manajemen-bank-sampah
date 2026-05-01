CREATE TYPE "public"."kanal" AS ENUM('in_app', 'email', 'whatsapp');--> statement-breakpoint
CREATE TYPE "public"."kategori" AS ENUM('organik', 'plastik', 'kertas', 'logam', 'elektronik', 'kain', 'lainnya');--> statement-breakpoint
CREATE TYPE "public"."metode" AS ENUM('tunai', 'transfer');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('admin', 'petugas', 'nasabah');--> statement-breakpoint
CREATE TYPE "public"."status_penarikan" AS ENUM('menunggu', 'disetujui', 'ditolak', 'selesai');--> statement-breakpoint
CREATE TYPE "public"."tipe_notifikasi" AS ENUM('setoran', 'penarikan', 'sistem', 'promosi');--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"aksi" varchar(100) NOT NULL,
	"entitas" varchar(100) NOT NULL,
	"entitas_id" uuid,
	"data_lama" jsonb,
	"data_baru" jsonb,
	"ip_address" varchar(45),
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "detail_setoran" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"setoran_id" uuid NOT NULL,
	"jenis_sampah_id" uuid NOT NULL,
	"berat_kg" numeric(10, 2) NOT NULL,
	"harga_saat_itu" numeric(10, 2) NOT NULL,
	"nilai" numeric(10, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jenis_sampah" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nama" varchar(100) NOT NULL,
	"kategori" "kategori" NOT NULL,
	"harga_per_kg" numeric(10, 2) NOT NULL,
	"satuan" varchar(20) DEFAULT 'kg',
	"deskripsi" text,
	"foto_url" text,
	"aktif" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nasabah" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"no_anggota" varchar(20) NOT NULL,
	"nik" varchar(16) NOT NULL,
	"alamat" text,
	"foto_ktp" text,
	"saldo" numeric(15, 2) DEFAULT '0',
	"tanggal_gabung" date DEFAULT now() NOT NULL,
	"catatan" text,
	CONSTRAINT "nasabah_no_anggota_unique" UNIQUE("no_anggota"),
	CONSTRAINT "nasabah_nik_unique" UNIQUE("nik")
);
--> statement-breakpoint
CREATE TABLE "notifikasi" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"judul" varchar(255) NOT NULL,
	"pesan" text NOT NULL,
	"tipe" "tipe_notifikasi" NOT NULL,
	"kanal" "kanal" NOT NULL,
	"sudah_dibaca" boolean DEFAULT false,
	"relasi_id" uuid,
	"relasi_tipe" varchar(50),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "penarikan" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nasabah_id" uuid NOT NULL,
	"jumlah" numeric(15, 2) NOT NULL,
	"metode" "metode" NOT NULL,
	"nama_bank" varchar(100),
	"nomor_rekening" varchar(50),
	"status" "status_penarikan" DEFAULT 'menunggu' NOT NULL,
	"alasan_tolak" text,
	"diajukan_pada" timestamp DEFAULT now() NOT NULL,
	"diproses_oleh" uuid,
	"diproses_pada" timestamp,
	"diselesaikan_oleh" uuid,
	"diselesaikan_pada" timestamp
);
--> statement-breakpoint
CREATE TABLE "pengaduan" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"subjek" text NOT NULL,
	"pesan" text NOT NULL,
	"status" text DEFAULT 'menunggu_tanggapan' NOT NULL,
	"tanggapan" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "riwayat_harga_sampah" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"jenis_sampah_id" uuid NOT NULL,
	"harga_lama" numeric(10, 2),
	"harga_baru" numeric(10, 2) NOT NULL,
	"diubah_oleh" uuid,
	"berlaku_sejak" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "setoran" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nasabah_id" uuid NOT NULL,
	"petugas_id" uuid NOT NULL,
	"total_nilai" numeric(15, 2) NOT NULL,
	"tanggal" timestamp DEFAULT now() NOT NULL,
	"catatan" text,
	"nomor_struk" varchar(30),
	CONSTRAINT "setoran_nomor_struk_unique" UNIQUE("nomor_struk")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" varchar(50) NOT NULL,
	"nama_lengkap" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"nomor_hp" varchar(20),
	"role" "role" DEFAULT 'nasabah' NOT NULL,
	"status" boolean DEFAULT true,
	"foto_profil" text,
	"last_login" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "detail_setoran" ADD CONSTRAINT "detail_setoran_setoran_id_setoran_id_fk" FOREIGN KEY ("setoran_id") REFERENCES "public"."setoran"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "detail_setoran" ADD CONSTRAINT "detail_setoran_jenis_sampah_id_jenis_sampah_id_fk" FOREIGN KEY ("jenis_sampah_id") REFERENCES "public"."jenis_sampah"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nasabah" ADD CONSTRAINT "nasabah_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifikasi" ADD CONSTRAINT "notifikasi_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "penarikan" ADD CONSTRAINT "penarikan_nasabah_id_nasabah_id_fk" FOREIGN KEY ("nasabah_id") REFERENCES "public"."nasabah"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "penarikan" ADD CONSTRAINT "penarikan_diproses_oleh_users_id_fk" FOREIGN KEY ("diproses_oleh") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "penarikan" ADD CONSTRAINT "penarikan_diselesaikan_oleh_users_id_fk" FOREIGN KEY ("diselesaikan_oleh") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pengaduan" ADD CONSTRAINT "pengaduan_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "riwayat_harga_sampah" ADD CONSTRAINT "riwayat_harga_sampah_jenis_sampah_id_jenis_sampah_id_fk" FOREIGN KEY ("jenis_sampah_id") REFERENCES "public"."jenis_sampah"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "riwayat_harga_sampah" ADD CONSTRAINT "riwayat_harga_sampah_diubah_oleh_users_id_fk" FOREIGN KEY ("diubah_oleh") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "setoran" ADD CONSTRAINT "setoran_nasabah_id_nasabah_id_fk" FOREIGN KEY ("nasabah_id") REFERENCES "public"."nasabah"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "setoran" ADD CONSTRAINT "setoran_petugas_id_users_id_fk" FOREIGN KEY ("petugas_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;