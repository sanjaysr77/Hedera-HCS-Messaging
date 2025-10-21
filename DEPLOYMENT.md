# Deployment steps for Frontend (Vercel) and Backend (Render)

Frontend (Vercel)
- Build command: npm run build (in the `client` folder)
- Output directory: `client/dist` is produced by Vite. Vercel detects Vite projects automatically.
- Environment variables:
  - VITE_API_BASE_URL: Set to your Render backend URL, e.g. https://your-backend.onrender.com

Steps:
1. Create a new Vercel project and connect your repository or import the `client` folder.
2. In Project Settings → Environment Variables add `VITE_API_BASE_URL`.
3. Deploy. Vercel will run `npm install` and `npm run build` in the client and serve the built assets.

Backend (Render)
- Build command: npm run build (in the `server` folder)
- Start command: npm run start (in the `server` folder)
- Environment variables:
  - OPERATOR_ID, OPERATOR_KEY (Hedera credentials)
  - FRONTEND_URL: Set to your Vercel frontend URL (e.g. https://your-frontend.vercel.app) to enable CORS

Steps:
1. Create a new Web Service on Render and connect your repository.
2. Set the build command to: `npm run build` and start command to: `npm run start` (set working directory to `/server`).
3. Add environment variables in Render's dashboard (OPERATOR_ID, OPERATOR_KEY, FRONTEND_URL).
4. Deploy. Render will provide a public URL like `https://your-backend.onrender.com`.

Notes
- The client uses `VITE_API_BASE_URL`. Vite inlines these variables during build time, so make sure Vercel has the value configured before building.
- The server uses `FRONTEND_URL` to configure CORS; in development it defaults to `http://localhost:5173`.
