# System Architecture & Technical Design (design.md)

## 1. Struktur Direktori Proyek (Vercel Monorepo)
```text
/
├── api/                        # Vercel Serverless Functions (Backend)
│   ├── _lib/
│   │   ├── db.ts               # Koneksi Neon PostgreSQL + Drizzle
│   │   ├── schema.ts           # Skema tabel database
│   │   └── s3.ts               # Konfigurasi S3Client untuk Backblaze B2
│   ├── upload-url.ts           # POST: Generate Presigned PUT URL
│   ├── images.ts               # GET (List), POST (Save Metadata), DELETE (Remove)
│   └── v/
│       └── [key].ts            # GET: Proxy/Redirect Presigned GET URL untuk Private Bucket
├── src/                        # React Frontend (Vite)
│   ├── components/
│   │   ├── UploadZone.tsx      # Area drag & drop + progress bar
│   │   ├── ResultCard.tsx      # Hasil upload & tombol copy URL
│   │   └── RecentUploads.tsx   # Galeri riwayat gambar & tombol delete
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css               # Tailwind imports
├── drizzle.config.ts           # Konfigurasi migrasi Drizzle
├── vercel.json                 # Routing & rewrites untuk Vercel
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## 2. Skema Database (`api/_lib/schema.ts`)

Menggunakan `drizzle-orm/pg-core`:

* Tabel `images`:
  * `id`: `uuid('id').defaultRandom().primaryKey()`
  * `fileKey`: `varchar('file_key', { length: 255 }).notNull().unique()`
  * `originalName`: `varchar('original_name', { length: 255 }).notNull()`
  * `mimeType`: `varchar('mime_type', { length: 100 }).notNull()`
  * `sizeBytes`: `integer('size_bytes').notNull()`
  * `createdAt`: `timestamp('created_at').defaultNow().notNull()`

## 3. Alur Kerja API & Keamanan Private Bucket

1. **Upload Flow (`POST /api/upload-url`):**
   * Menerima `{ fileName, mimeType, sizeBytes }`.
   * Validasi tipe MIME dan ukuran (`<= 10485760` bytes).
   * Buat `fileKey` unik: `${crypto.randomUUID()}.${extension}`.
   * Buat Presigned PUT URL menggunakan `PutObjectCommand` (Expires: 300 detik).
   * Kembalikan `{ uploadUrl, fileKey }`.

2. **Viewing Flow (`GET /api/v/[key]`):**
   * Karena bucket B2 bersifat **Private**, file tidak bisa diakses langsung.
   * Saat user membuka `https://app.com/api/v/abc-123.png`, endpoint ini memanggil `GetObjectCommand` dengan masa berlaku 3600 detik (1 jam).
   * Mengirimkan HTTP Response `307 Temporary Redirect` ke Presigned GET URL tersebut beserta header `Cache-Control: public, max-age=3000` agar browser/CDN melakukan caching.