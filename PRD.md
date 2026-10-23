# Product Requirement Document (PRD): SnapLink (Image-to-URL Platform)

## 1. Tujuan Produk
Membangun aplikasi web full-stack modern untuk mengubah file gambar menjadi URL yang dapat dibagikan secara instan. Aplikasi ini ditujukan untuk penggunaan personal dan portofolio, dengan fokus pada kecepatan, keamanan penyimpanan (Private Bucket), dan efisiensi biaya serverless.

## 2. Tech Stack Utama
- **Frontend:** React (Vite), TypeScript, Tailwind CSS, Lucide React (Ikon), Axios (HTTP Client & Upload Progress).
- **Backend:** Node.js pada Vercel Serverless Functions (`/api` directory).
- **Database:** Neon Serverless PostgreSQL + Drizzle ORM (lebih ringan dan cepat untuk serverless dibanding Prisma).
- **Object Storage:** Backblaze B2 (Konfigurasi Private Bucket) diakses via AWS S3 SDK v3 (`@aws-sdk/client-s3` & `@aws-sdk/s3-request-presigner`).

## 3. Fitur Utama (End-to-End)
1. **Drag-and-Drop Image Uploader:**
   - Mendukung pilih file manual, drag-and-drop, dan *paste* dari clipboard (`Ctrl+V`).
   - Validasi di sisi klien: Hanya menerima `image/jpeg`, `image/png`, `image/webp`, `image/gif` dengan ukuran maksimal 10MB.
2. **Direct-to-Cloud Upload dengan Progress Bar:**
   - Mengunggah langsung dari browser ke Backblaze B2 menggunakan Presigned PUT URL (melewati batas payload Vercel 4.5MB).
   - Menampilkan persentase progress bar secara *real-time*.
3. **Instant Shareable URL & Proxy Gateway:**
   - Menghasilkan URL bersih milik domain aplikasi sendiri (contoh: `https://domain-anda.vercel.app/api/v/[fileKey]`).
   - Tombol "Copy URL" dengan umpan balik visual (Toast/Checkmark).
4. **Recent Uploads Gallery & Management:**
   - Menampilkan daftar gambar yang baru diunggah beserta *thumbnail*, nama asli, ukuran file, dan waktu unggah.
   - Fitur hapus gambar (menghapus dari Backblaze B2 sekaligus dari database Neon).
