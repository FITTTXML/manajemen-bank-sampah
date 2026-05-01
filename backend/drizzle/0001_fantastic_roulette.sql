CREATE TYPE "public"."status_penjemputan" AS ENUM('menunggu', 'dijemput', 'selesai', 'ditolak');--> statement-breakpoint
CREATE TABLE "penjemputan" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nasabah_id" uuid NOT NULL,
	"alamat" text NOT NULL,
	"catatan" text,
	"jenis_sampah_desc" text NOT NULL,
	"estimasi_berat" varchar(50),
	"tanggal_request" timestamp DEFAULT now() NOT NULL,
	"tanggal_jemput" timestamp,
	"status" "status_penjemputan" DEFAULT 'menunggu' NOT NULL,
	"petugas_id" uuid,
	"alasan_tolak" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "penjemputan" ADD CONSTRAINT "penjemputan_nasabah_id_nasabah_id_fk" FOREIGN KEY ("nasabah_id") REFERENCES "public"."nasabah"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "penjemputan" ADD CONSTRAINT "penjemputan_petugas_id_users_id_fk" FOREIGN KEY ("petugas_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;