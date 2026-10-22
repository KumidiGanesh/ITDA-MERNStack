# Deployment

## Run locally

### Prerequisites

- Node.js and npm installed
- MongoDB running locally, or a MongoDB Atlas connection string

### Start the server

Open PowerShell 1:

```powershell
cd "C:\Users\YTC CHINTAPALLI\Desktop\GANESH\fooddeliveryapp\server"
Copy-Item .env.example .env
npm install
npm run dev
```

Edit `server/.env` before starting the server. For local MongoDB, the example `MONGO_URI` works when MongoDB is running on the default port. Set a real random value for `JWT_SECRET`.

The API runs at `http://localhost:5000`. Check it at `http://localhost:5000/api/health`.

### Start the client

Open PowerShell 2:

```powershell
cd "C:\Users\YTC CHINTAPALLI\Desktop\GANESH\fooddeliveryapp\client"
npm install
npm run dev
```

Open the Vite URL shown in the terminal, normally `http://localhost:5173`.

The client automatically uses `http://localhost:5000/api` locally. To configure it explicitly, create `client/.env.local` with:

```text
VITE_API_URL=http://localhost:5000/api
```

Do not run `npm run dev` from the `fooddeliveryapp` root; the server and client each have their own `package.json` and must be started from their respective folders.

## 1. Create MongoDB Atlas

1. Sign in at [MongoDB Atlas](https://www.mongodb.com/atlas) and create a free project and cluster.
2. In **Database Access**, create a database user and save its username and password.
3. In **Network Access**, add the IP addresses that need database access. For a simple hosted deployment, you can temporarily allow `0.0.0.0/0`; use tighter rules for production when possible.
4. Select **Connect > Drivers**, choose Node.js, and copy the connection string.
5. Replace the password placeholder and use the completed string as `MONGO_URI`, for example:

   ```text
   mongodb+srv://<username>:<password>@<cluster>.mongodb.net/food_delivery_mini_app?retryWrites=true&w=majority
   ```

## 2. Deploy the server to Render

1. Push the repository to GitHub and create a new **Web Service** in [Render](https://render.com/).
2. Select the repository and set the service root directory to `fooddeliveryapp/server` (or the equivalent server folder path in your repository).
3. Use these commands:
   - **Build command:** `npm install`
   - **Start command:** `npm start`
4. Add these environment variables in Render:
   - `MONGO_URI`: your MongoDB Atlas connection string
   - `JWT_SECRET`: a long, random secret used to sign tokens
   - `CLIENT_URL`: the deployed Vercel client URL, such as `https://your-app.vercel.app`
   - `PORT`: Render usually supplies this automatically; `5000` is suitable for local use
   - `NODE_ENV`: `production`
5. Deploy and verify `https://your-server.onrender.com/api/health` returns a successful response.

The server uses `node server.js` for production. `nodemon` remains a development-only dependency and is used by `npm run dev`.

## 3. Deploy the client to Vercel

1. Create a new project in [Vercel](https://vercel.com/) from the same repository.
2. Set the project root directory to `fooddeliveryapp/client`.
3. Use these settings:
   - **Build command:** `npm run build`
   - **Output directory:** `dist`
4. Add this environment variable:
   - `VITE_API_URL`: the deployed backend API URL, including `/api`, such as `https://your-server.onrender.com/api`
5. Deploy the client. Update the server's `CLIENT_URL` to the final Vercel URL if it changes.

## Before deploying

- Double-check that no real secrets are committed to Git. Keep `.env` files ignored and commit only `.env.example`.
- Update the fallback `baseURL` in `client/src/api/axiosInstance.js` if your local backend URL changes. In production, set `VITE_API_URL` explicitly to the deployed backend `/api` URL.
- Test registration, login, restaurant browsing, menu loading, cart checkout, and order history against the deployed services.
