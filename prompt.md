# MASTER EXECUTION PROMPT: Build Full-Stack Image-to-URL Application End-to-End

## ROLE & EXECUTION DIRECTIVE
You are a Staff Full-Stack Engineer. Your task is to build a complete, production-ready Image-to-URL web application from scratch based on the specifications below.

**CRITICAL EXECUTION RULES (READ CAREFULLY):**
1. **DO NOT STOP UNTIL FINISHED:** Do not stop after creating the folder structure or setting up the backend. Execute every single phase sequentially from project initialization to the final UI component until the entire application is 100% complete and functional.
2. **NO PLACEHOLDERS OR TODOs:** Never write `// TODO: implement later`, `// ...rest of code`, or stub functions. Write every line of production code completely.
3. **SELF-CONTAINED & COMPLETE:** Generate all configuration files, backend serverless endpoints, database schemas, and frontend React components in full detail.

---

## TECH STACK & ARCHITECTURE
- **Frontend:** React 18 (Vite), TypeScript, Tailwind CSS, `lucide-react`, `axios`.
- **Backend:** Vercel Serverless Functions (`/api` directory in root), TypeScript (`@vercel/node`).
- **Database:** Neon Serverless PostgreSQL (`@neondatabase/serverless`) + Drizzle ORM (`drizzle-orm`, `drizzle-kit`).
- **Storage:** Backblaze B2 Private Bucket via AWS SDK v3 (`@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`).

### Core Constraints:
- **Bypass Vercel 4.5MB Payload Limit:** Never route image binary files through `/api` endpoints during upload. Use `/api/upload-url` to generate an S3 Presigned `PUT` URL, and have the React client upload directly to Backblaze B2 via `axios.put`.
- **Private Bucket Gateway:** The Backblaze B2 bucket is strictly private. Serve images publicly via `/api/v/[key].ts`, which generates a Presigned `GET` URL on the fly and responds with an HTTP `307 Temporary Redirect` and caching headers.

---

## STEP-BY-STEP BUILD PLAN (EXECUTE ALL STEPS CONTINUOUSLY)

### PHASE 1: Project Configuration & Setup
Generate the complete contents for:
1. `package.json` (Include all dependencies: react, react-dom, axios, lucide-react, @aws-sdk/client-s3, @aws-sdk/s3-request-presigner, @neondatabase/serverless, drizzle-orm, and devDependencies: vite, typescript, tailwindcss, postcss, autoprefixer, @vercel/node, drizzle-kit).
2. `tsconfig.json`, `vite.config.ts`, `tailwind.config.js`, `postcss.config.js`.
3. `drizzle.config.ts` configured for PostgreSQL and pointing to `./api/_lib/schema.ts`.
4. `vercel.json` with clean rewrites so `/v/:key` maps seamlessly to `/api/v/[key]`,giving users short URLs like `https://domain.com/v/uuid.png`.
5. `.env.example` with all required variables:
   - `DATABASE_URL`
   - `B2_ENDPOINT` (e.g., `https://s3.us-west-004.backblazeb2.com`)
   - `B2_REGION` (e.g., `us-west-004`)
   - `B2_KEY_ID`
   - `B2_APPLICATION_KEY`
   - `B2_BUCKET_NAME`

### PHASE 2: Database & Storage Core Library (`api/_lib/`)
Write the full implementation for:
1. `api/_lib/schema.ts`: Define the `images` table (`id`, `fileKey`, `originalName`, `mimeType`, `sizeBytes`, `createdAt`).
2. `api/_lib/db.ts`: Initialize Neon HTTP connection with Drizzle ORM.
3. `api/_lib/s3.ts`: Initialize `S3Client` configured specifically for Backblaze B2 S3-Compatible API (`forcePathStyle: true`).

### PHASE 3: Backend Serverless API Endpoints (`api/`)
Write full, error-handled TypeScript serverless handlers for:
1. `api/upload-url.ts`:
   - Method: `POST`.
   - Validate `mimeType` (`image/jpeg`, `image/png`, `image/webp`, `image/gif`) and `sizeBytes` (max 10MB).
   - Generate a safe UUID-based `fileKey`.
   - Create and return a 5-minute Presigned PUT URL using `PutObjectCommand`.
2. `api/images.ts`:
   - `GET`: Fetch the 20 most recent images ordered by `createdAt DESC`.
   - `POST`: Save uploaded image metadata (`fileKey`, `originalName`, `mimeType`, `sizeBytes`) to Neon DB and return the created record.
   - `DELETE`: Accept `id` or `fileKey`, delete the object from Backblaze B2 using `DeleteObjectCommand`, and delete the record from Neon DB.
3. `api/v/[key].ts`:
   - Method: `GET`.
   - Extract `key` from query parameters.
   - Generate a 1-hour Presigned GET URL from Backblaze B2 using `GetObjectCommand`.
   - Set header `Cache-Control: public, max-age=3000, s-maxage=3000` and return HTTP `307` redirect to the signed URL.

### PHASE 4: Frontend React Application (`src/`)
Build a polished, modern, dark-mode-ready UI using Tailwind CSS:
1. `src/types.ts`: Define TypeScript interfaces for image records and upload states.
2. `src/components/UploadZone.tsx`:
   - Support file drag-and-drop, click-to-browse, and global clipboard paste (`Ctrl+V` / `Cmd+V` image).
   - Perform client-side validation (file type & 10MB limit) with clear error alerts.
   - Execute the 3-step upload flow: Request Presigned URL -> `axios.put` binary directly to B2 with real-time `onUploadProgress` tracking -> `POST /api/images` to save metadata.
3. `src/components/ResultCard.tsx`:
   - Display the newly uploaded image preview.
   - Show the clean shareable URL (`${window.location.origin}/v/${fileKey}`), Markdown snippet, and HTML `<img>` snippet.
   - Provide one-click "Copy" buttons with visual "Copied!" state transitions.
4. `src/components/RecentUploads.tsx`:
   - Render a responsive grid of previously uploaded images fetched from `GET /api/images`.
   - Show file size formatted in KB/MB, upload date, quick copy link button, open in new tab button, and a delete button with loading state.
5. `src/App.tsx`, `src/main.tsx`, `src/index.css`, and `index.html`:
   - Assemble all components into a cohesive, responsive layout with a clean header, status notifications, and portfolio-grade visual polish.

### PHASE 5: Deployment & B2 CORS Documentation
Conclude by writing a clear `README.md` containing:
1. Exact Backblaze B2 CORS rule JSON configuration required so direct browser `PUT` uploads succeed without CORS errors.
2. Commands to push the Drizzle database schema to Neon (`npx drizzle-kit push`).
3. Local development command (`vercel dev`) and Vercel deployment steps.

Begin execution immediately from Phase 1 and write out every single file completely until Phase 5 is done.
