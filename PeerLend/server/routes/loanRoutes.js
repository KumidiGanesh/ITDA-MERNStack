import { Router } from 'express'
import {
  createLoan,
  fundLoan,
  getRepaymentDetails,
  getMarketplaceLoan,
  getMarketplaceLoans,
  getMyLoans,
  repayLoan,
} from '../controllers/loanController.js'
import authMiddleware from '../middleware/authMiddleware.js'
import requireBorrower from '../middleware/requireBorrower.js'
import requireLender from '../middleware/requireLender.js'

const router = Router()

router.post('/:loanId/fund', authMiddleware, requireLender, fundLoan)
router.get('/:loanId/repayments', authMiddleware, requireBorrower, getRepaymentDetails)
router.post('/:loanId/repay', authMiddleware, requireBorrower, repayLoan)
router.get('/marketplace', authMiddleware, requireLender, getMarketplaceLoans)
router.get('/marketplace/:loanId', authMiddleware, requireLender, getMarketplaceLoan)
router.post('/', authMiddleware, requireBorrower, createLoan)
router.get('/', authMiddleware, requireBorrower, getMyLoans)

export default router
