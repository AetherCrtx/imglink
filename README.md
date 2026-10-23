# ImgLink (Direct Cloud Image-to-URL Platform)

> **Live Production Domain:** [https://imglink.web.id](https://imglink.web.id)

A modern, high-performance, neo-brutalist full-stack web application to upload images and convert them into instant, shareable public URLs. Built with direct-to-cloud upload architecture to bypass server payload limits, end-to-end private bucket security, Neon Auth (with Google OAuth), and Neon serverless database integration.

---

## Architecture Overview

```text
[ React Frontend (Vite) @ imglink.web.id ]
       │
       ├── 1. Request Upload Authorization (POST /api/upload-url) ──> [ Serverless API ]
       │                                                                  (Generate S3 Presigned PUT)
       ├── 2. Receive Presigned PUT URL <─────────────────────────────
       │
       ├── 3. Upload Binary Directly via Axios PUT ──────────────────> [ Neon Object Storage (images) ]
       │      (with real-time upload progress)
       │
       ├── 4. Save Image Metadata (POST /api/images) ────────────────> [ Serverless API ]
       │                                                                  │
       │                                                                  └──> [ Neon PostgreSQL (Drizzle) ]
       │
       └── 5. Public Access (GET /v/:key) ───────────────────────────> [ Serverless Gateway ]
                                                                          │ (S3 Presigned GET + 307 Redirect)
                                                                          └──> [ Cached Image Delivery ]
```

---

## Tech Stack

- **Frontend:** React 18, TypeScript, Tailwind CSS (Neo-Brutalism), Lucide React, Axios.
- **Backend:** Node.js Vercel Serverless Functions (`/api` directory) + Built-in Vite Dev API plugin.
- **Database:** Neon Serverless PostgreSQL with Drizzle ORM (`drizzle-kit`).
- **Object Storage:** Neon Object Storage (S3-compatible) via AWS SDK v3.
- **Authentication:** Neon Auth (Managed Better Auth) with Google OAuth & Email/Password.
- **Production Domain:** `https://imglink.web.id`

---

## 1. Backblaze B2 CORS Configuration

Because uploads are sent **directly from the client browser to Backblaze B2** using HTTP `PUT`, you **must configure CORS** on your Backblaze B2 bucket to avoid browser CORS errors.

### Option A: Via Backblaze B2 Web Console
1. Log in to [Backblaze B2](https://secure.backblaze.com/b2_buckets.htm).
2. Go to **Buckets**, find your bucket, and click **Bucket Settings**.
3. Under **CORS Rules**, select **Custom CORS Rules** and paste the JSON below:

```json
[
  {
    "corsRuleName": "AllowBrowserDirectUpload",
    "allowedOrigins": [
      "https://*.vercel.app",
      "http://localhost:3000",
      "http://localhost:5173",
      "*"
    ],
    "allowedOperations": [
      "s3_head",
      "s3_get",
      "s3_put"
    ],
    "allowedHeaders": [
      "*"
    ],
    "exposeHeaders": [
      "ETag"
    ],
    "maxAgeSeconds": 3600
  }
]
```

> **Note:** For production security, replace `"*"` in `allowedOrigins` with your exact custom domain (e.g., `https://yourdomain.com`) and `https://*.vercel.app`.

### Option B: Via AWS CLI (S3-compatible)
Save the following as `cors.json`:
```json
{
  "CORSRules": [
    {
      "AllowedOrigins": ["*"],
      "AllowedMethods": ["GET", "PUT", "HEAD"],
      "AllowedHeaders": ["*"],
      "ExposeHeaders": ["ETag"],
      "MaxAgeSeconds": 3600
    }
  ]
}
```
Then run:
```bash
aws s3api put-bucket-cors \
  --endpoint-url https://s3.<your-region>.backblazeb2.com \
  --bucket <your-bucket-name> \
  --cors-configuration file://cors.json
```

---

## 2. Environment Variables Setup

Create a `.env` file in the project root based on `.env.example`:

```bash
cp .env.example .env
```

Fill in your actual credentials:

```env
# Neon PostgreSQL Connection String (from Neon Console)
DATABASE_URL="postgresql://username:password@ep-sample-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require"

# Backblaze B2 S3-Compatible API Credentials
B2_ENDPOINT="https://s3.us-west-004.backblazeb2.com"
B2_REGION="us-west-004"
B2_KEY_ID="your_backblaze_application_key_id"
B2_APPLICATION_KEY="your_backblaze_application_key"
B2_BUCKET_NAME="your_private_bucket_name"
```

---

## 3. Database Schema Setup with Drizzle Kit

Push the database schema directly to your Neon PostgreSQL instance:

```bash
npx drizzle-kit push
```

To view and manage your data interactively using Drizzle Studio:
```bash
npx drizzle-kit studio
```

---

## 4. Local Development

### Recommended: Using Vercel CLI (Runs Frontend & Serverless Functions together)
Install the Vercel CLI globally if you haven't:
```bash
npm install -g vercel
```

Run the local development server:
```bash
vercel dev
```
This runs the application at `http://localhost:3000`, simultaneously emulating Vercel Serverless Functions in `/api` and serving the Vite frontend with hot reloading.

### Alternative: Standalone Vite Dev Server
```bash
npm run dev
```
*(Runs Vite on `http://localhost:5173` with proxy configured to `http://localhost:3000`)*.

---

## 5. Deployment to Vercel

### Step 1: Deploy via Vercel CLI
```bash
vercel
```
Follow the interactive prompts to link or create a project.

### Step 2: Add Environment Variables in Vercel
Set the following environment variables in your Vercel Project Settings (**Settings > Environment Variables**):
- `DATABASE_URL`
- `B2_ENDPOINT`
- `B2_REGION`
- `B2_KEY_ID`
- `B2_APPLICATION_KEY`
- `B2_BUCKET_NAME`

### Step 3: Production Deployment
```bash
vercel --prod
```

---

## 6. API Reference

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/upload-url` | `POST` | Validates file info, generates a 5-minute S3 Presigned `PUT` URL |
| `/api/images` | `GET` | Returns the 20 most recent image records |
| `/api/images` | `POST` | Saves image metadata (`fileKey`, `originalName`, `mimeType`, `sizeBytes`) |
| `/api/images` | `DELETE` | Deletes image from Backblaze B2 storage & Neon database |
| `/v/[key]` | `GET` | Generates a 1-hour Presigned `GET` URL and responds with `307 Redirect` + CDN caching headers |

---

## 7. Project Structure

```text
.
├── api/                        # Vercel Serverless Functions
│   ├── _lib/
│   │   ├── db.ts               # Neon PostgreSQL + Drizzle ORM client
│   │   ├── schema.ts           # Database schema definition
│   │   └── s3.ts               # AWS SDK S3Client configured for Backblaze B2
│   ├── upload-url.ts           # POST: Presigned PUT URL generator
│   ├── images.ts               # GET: list, POST: metadata, DELETE: remove
│   └── v/
│       └── [key].ts            # GET: Presigned GET URL 307 proxy redirect
├── src/                        # React Frontend (Vite)
│   ├── components/
│   │   ├── Header.tsx          # App header & branding
│   │   ├── Footer.tsx          # App footer
│   │   ├── UploadZone.tsx      # Drag & drop, clipboard paste & progress bar
│   │   ├── ResultCard.tsx      # Shareable URL, preview & copy snippets
│   │   └── RecentUploads.tsx   # Gallery history & management
│   ├── utils/
│   │   └── formatters.ts       # Byte, date, and URL formatting utilities
│   ├── types.ts                # TypeScript interfaces
│   ├── App.tsx                 # Root application component
│   ├── main.tsx                # Entry point
│   └── index.css               # Tailwind CSS & animations
├── drizzle.config.ts           # Drizzle Kit migration config
├── vercel.json                 # Vercel rewrites & build configuration
├── package.json                # Project dependencies & scripts
├── tsconfig.json               # TypeScript compiler options
├── vite.config.ts              # Vite configuration & dev proxy
├── PRD.md                      # Product Requirements Document
├── design.md                   # System Architecture & Design
└── prompt.md                   # Master Execution Prompt
```
