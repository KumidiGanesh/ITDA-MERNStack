# PeerLend

**Small Loans. Real People. Better Futures.**

PeerLend is a responsive, full-stack community lending application built with React and Vite, Express, MongoDB, and Socket.IO. Borrowers can create loan requests and make simulated repayments; lenders can browse requests and simulate funding. Signed-in users receive persisted notifications and live loan, funding, repayment, and transaction updates.

> **Demo only:** funding and repayments are simulations. PeerLend does not connect to a bank, payment processor, or real-money transfer service.

## Features

- Responsive landing page and authenticated dashboard.
- Borrower-facing sample loan scenarios on the landing page to help people plan their own request; examples are explicitly illustrative, not live listings or loan offers.
- Registration, login, logout, JWT-protected routes, and borrower/lender roles.
- Borrower loan requests with a validated full address, personal loan list, repayment progress, and repayment history.
- Lender marketplace, loan details, and simulated funding.
- Transactions page backed by MongoDB with type filters, search, sorting, and pagination.
- Persistent notifications with unread counts, read state, and a Socket.IO-powered notification bell.
- Authenticated Socket.IO connections and user-specific rooms for live loan, payment, repayment, and notification events.
- Input validation, password hashing, role checks, MongoDB error handling, and CORS configuration.

## Technology stack

**Frontend:** React, Vite, React Router DOM, Axios, Socket.IO Client  
**Backend:** Node.js, Express, Socket.IO, Mongoose  
**Data and security:** MongoDB, JWT, bcrypt, dotenv, CORS

## Requirements

- Node.js 20.19+ or 22.12+ (Vite 8 requirement)
- npm
- MongoDB Community Server, MongoDB Atlas, or another MongoDB deployment
- Visual Studio Code (recommended)

## Installation

Open the `PeerLend` folder in VS Code. In the integrated terminal, install the client and server dependencies:

```powershell
cd client
npm install
cd ..\server
npm install
```

## MongoDB setup

### Local MongoDB

1. Install and start MongoDB Community Server.
2. The server creates/uses the `peerlend` database on its first connection.
3. To use MongoDB Compass, connect to:

   ```text
   mongodb://127.0.0.1:27017
   ```

   Select `peerlend` after the application has connected and created data.

### MongoDB Atlas

Create a cluster and database user in Atlas, allow the development machine in Network Access, and use the Atlas connection string for `MONGO_URI`. URL-encode reserved characters in the database password. Do not commit the connection string.

## Environment variables

Copy `server/.env.example` to `server/.env`, then set a strong, private JWT secret:

```powershell
cd server
Copy-Item .env.example .env
```

Edit `server/.env`:

```dotenv
PORT=5000
CLIENT_URL=http://localhost:5173
MONGO_URI=mongodb://127.0.0.1:27017/peerlend
JWT_SECRET=replace-with-a-long-random-secret
```

`server/.env` is ignored by Git. Keep real database credentials and secrets out of source control and screenshots. The frontend API URL defaults to `http://localhost:5000/api`; to override it, optionally create `client/.env.local`:

```dotenv
VITE_API_URL=http://localhost:5000/api
```

Restart Vite after changing a `VITE_` environment variable. `CLIENT_URL` must match the browser origin used by the frontend, including scheme and port.

## Run in VS Code

Open two integrated terminals in VS Code.

**Terminal 1 — API and Socket.IO server:**

```powershell
cd server
npm run dev
```

**Terminal 2 — Vite frontend:**

```powershell
cd client
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). Check the backend at [http://localhost:5000/api/health](http://localhost:5000/api/health).

Expected API response:

```json
{
  "success": true,
  "message": "PeerLend API is running"
}
```

The server should report a successful MongoDB connection and `PeerLend API listening on http://localhost:5000`; Vite should report its local URL and ready status.

## API routes

All API routes are prefixed with `/api`. Private routes require a valid bearer token in the `Authorization` header. Loan and transaction amounts, funding, and repayments are demo data only.

| Method | Route | Access | Description |
|---|---|---|---|
| `GET` | `/health` | Public | API health check |
| `POST` | `/auth/register` | Public | Register a borrower, lender, or both-role account |
| `POST` | `/auth/login` | Public | Sign in and receive a JWT |
| `GET` | `/auth/me` | Authenticated | Get the current account |
| `POST` | `/loans` | Borrower / both | Create a loan request with a complete address |
| `GET` | `/loans` | Borrower / both | List the signed-in borrower's requests, including their address |
| `GET` | `/loans/marketplace` | Lender / both | List available funding requests without borrower addresses |
| `GET` | `/loans/marketplace/:loanId` | Lender / both | Get marketplace loan details without the borrower's address |
| `POST` | `/loans/:loanId/fund` | Lender / both | Make a simulated funding contribution |
| `GET` | `/loans/:loanId/repayments` | Borrower / both | Get repayment details and history for an owned loan |
| `POST` | `/loans/:loanId/repay` | Borrower / both | Make a simulated repayment |
| `GET` | `/notifications` | Authenticated | Get up to 50 notifications and unread count |
| `PUT` | `/notifications/:notificationId/read` | Authenticated | Mark an owned notification as read |
| `GET` | `/transactions` | Authenticated | Search, filter, sort, and paginate account transactions |

Transactions supports `type=ALL|FUNDING|REPAYMENT|REFUND`, `search`, `sortBy=date|amount|type|status`, `sortOrder=asc|desc`, `page`, and `limit` (maximum 50). Lenders can also see repayments for loans they funded; unrelated accounts cannot view those transactions.

There is no administrator role or loan-approval API in this project. `LOAN_APPROVED` is a supported notification/socket event for a future approval workflow; it is not triggered by a current user-facing API route.

## Socket.IO events

Connect to the backend Socket.IO origin with the signed-in JWT in the Socket.IO `auth` payload:

```js
io('http://localhost:5000', {
  auth: { token: sessionStorage.getItem('peerlend.token') },
})
```

Socket authentication verifies the JWT and account before joining `user:<id>` and applicable `role:borrower` / `role:lender` rooms. Clients cannot choose or join arbitrary rooms.

| Event | Recipients | Purpose |
|---|---|---|
| `loanCreated` | Borrower's user room; lender role room receives a minimal pending-request reference | New request activity |
| `loanApproved` | Borrower and lender clients when invoked by the approval helper | Approval workflow integration |
| `loanUpdated` | Relevant borrower and lender clients | Funding or repayment balance/status update |
| `loanFunded` | Borrower and funding lender | Simulated funding confirmation |
| `repaymentMade` | Borrower and contributing lenders | Repayment progress |
| `paymentReceived` | Contributing lenders | Repayment activity |
| `paymentCompleted` | Borrower and contributing lenders | Loan fully repaid |
| `notificationCreated` | The notification owner's user room | Persisted notification and unread-count update |
| `notificationRead` | The notification owner's user room | Read-state synchronization across tabs |

The frontend shares a reusable authenticated Socket.IO service and hook; live UI updates do not rely on polling or page reloads.

## Project structure

```text
PeerLend/
├── client/
│   └── src/
│       ├── components/   Reusable navigation, notification, and loan UI
│       ├── context/      Authentication context
│       ├── hooks/        Authentication and Socket.IO hooks
│       ├── pages/        Landing, account, loan, transaction, and repayment pages
│       └── services/     Axios API and Socket.IO client services
└── server/
    ├── config/           MongoDB configuration
    ├── controllers/      Authentication, loan, notification, and transaction APIs
    ├── middleware/       JWT and role authorization
    ├── models/           Mongoose schemas
    ├── routes/           Express API routes
    ├── sockets/          Authenticated Socket.IO setup and rooms
    └── utils/            Loan events and notification delivery
```

## Testing and checks

Run the frontend's configured lint and production build:

```powershell
cd client
npm run lint
npm run build
```

The backend does not currently define a test-runner script. For a local smoke test:

1. Start MongoDB and both development servers.
2. Open `/api/health` and confirm the JSON health response.
3. Register borrower and lender accounts, sign in, and confirm that each account only sees its authorized pages/data.
4. Create a loan request, mark it approved through an explicitly configured test fixture if testing lender funding (no approval API is currently provided), fund it, and make partial then final repayments.
5. Review the Transactions page and notification bell; verify Socket.IO changes appear without refreshing.
6. Try invalid amounts, overfunding/overpayment, an unauthenticated API request, and marking another user's notification as read; these should be rejected.
7. Check the landing, dashboard, loans, marketplace, repayments, transactions, and notification panel at mobile and desktop viewport widths.

Temporary test accounts and records should be removed after testing. Do not run destructive cleanup against a shared or production database.

## Demo and payment disclaimer

Funding, repayments, transaction records, and related notifications are simulated application data. No real money moves and no payment gateway, bank, credit bureau, or lending decision service is connected. This preview is not a loan offer or financial advice.
