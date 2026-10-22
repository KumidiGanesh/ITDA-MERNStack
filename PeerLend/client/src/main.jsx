import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import LoanRequestPage from './pages/LoanRequestPage.jsx'
import MyLoansPage from './pages/MyLoansPage.jsx'
import MarketplacePage from './pages/MarketplacePage.jsx'
import LoanDetailsPage from './pages/LoanDetailsPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import RepaymentPage from './pages/RepaymentPage.jsx'
import TransactionsPage from './pages/TransactionsPage.jsx'
import './peerLend-theme.css'
import './phone-showcase.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/transactions" element={<TransactionsPage />} />
          </Route>
          <Route element={<ProtectedRoute allowedRoles={['borrower', 'both']} />}>
            <Route path="/loans/new" element={<LoanRequestPage />} />
            <Route path="/my-loans" element={<MyLoansPage />} />
            <Route path="/loans/:loanId/repayments" element={<RepaymentPage />} />
          </Route>
          <Route element={<ProtectedRoute allowedRoles={['lender', 'both']} />}>
            <Route path="/marketplace" element={<MarketplacePage />} />
            <Route path="/marketplace/:loanId" element={<LoanDetailsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
