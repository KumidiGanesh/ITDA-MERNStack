import Notification from '../models/Notification.js'
import User from '../models/User.js'

function loanPayload(loan, transaction, includeAddress = false) {
  const publicLoan = { ...loan }
  if (!includeAddress) delete publicLoan.address

  return {
    loan: includeAddress ? loan : publicLoan,
    transaction: transaction
      ? {
          _id: transaction._id,
          loan: transaction.loan,
          amount: transaction.amount,
          type: transaction.type,
          status: transaction.status,
          reference: transaction.reference,
          createdAt: transaction.createdAt,
          simulated: true,
        }
      : null,
  }
}

async function createNotification(io, userId, details, loanId) {
  const notification = await Notification.create({
    user: userId,
    ...details,
    loan: loanId,
  })
  const payload = {
    ...notification.toObject(),
    loanId: notification.loan?.toString() ?? null,
  }

  io.to(`user:${userId}`).emit('notificationCreated', payload)
  return payload
}

async function notifyLenders(io, borrowerId, details, loanId) {
  const lenders = await User.find({
    role: { $in: ['lender', 'both'] },
    _id: { $ne: borrowerId },
  }).select('_id').lean()

  if (lenders.length === 0) return []

  const notifications = await Notification.insertMany(
    lenders.map((lender) => ({
      user: lender._id,
      ...details,
      loan: loanId,
    })),
  )

  for (const notification of notifications) {
    io.to(`user:${notification.user}`).emit('notificationCreated', {
      ...notification.toObject(),
      loanId: notification.loan?.toString() ?? null,
    })
  }

  return notifications
}

export async function emitLoanCreated(io, loan, borrowerId) {
  const lenderPayload = {
    loanId: loan._id,
    status: loan.status,
    createdAt: loan.createdAt,
  }

  io.to('role:lender').except(`user:${borrowerId}`).emit('loanCreated', lenderPayload)
  io.to(`user:${borrowerId}`).emit('loanCreated', loanPayload(loan, null, true))
  await notifyLenders(io, borrowerId, {
    type: 'LOAN_CREATED',
    title: 'New loan request',
    message: 'A borrower submitted a loan request. It will appear in the marketplace if approved.',
  }, loan._id)
}

export async function emitLoanApproved(io, loan) {
  const borrowerId = loan.borrower?._id?.toString() ?? loan.borrower?.toString()
  if (!borrowerId) return

  const payload = loanPayload(loan, null, true)
  io.to('role:lender').emit('loanApproved', {
    loanId: loan._id,
    status: loan.status,
    createdAt: loan.createdAt,
  })
  io.to(`user:${borrowerId}`).emit('loanApproved', payload)
  io.to(`user:${borrowerId}`).emit('loanUpdated', payload)
  await createNotification(io, borrowerId, {
    type: 'LOAN_APPROVED',
    title: 'Your loan request was approved',
    message: `Your request for ${loan.purpose} is approved and ready for community funding.`,
  }, loan._id)
}

export async function emitLoanFunded(io, loan, transaction, lenderId) {
  const borrowerId = loan.borrower?._id?.toString() ?? loan.borrower?.toString()
  const payload = loanPayload(loan, transaction)
  const recipients = [`user:${lenderId}`]
  if (borrowerId) recipients.push(`user:${borrowerId}`)

  io.to('role:lender').to(`user:${borrowerId}`).emit('loanUpdated', payload)
  for (const room of recipients) {
    io.to(room).emit('loanFunded', payload)
  }

  if (borrowerId) {
    await createNotification(io, borrowerId, {
      type: 'LOAN_FUNDED',
      title: 'Your loan received funding',
      message: `A lender contributed $${Number(transaction.amount).toFixed(2)} to your loan request.`,
    }, loan._id)
  }
}

export async function emitRepaymentMade(io, loan, transaction, lenderIds) {
  const borrowerId = loan.borrower?._id?.toString() ?? loan.borrower?.toString()
  const payload = loanPayload(loan, transaction)

  if (borrowerId) {
    io.to(`user:${borrowerId}`).emit('loanUpdated', payload)
    io.to(`user:${borrowerId}`).emit('repaymentMade', payload)
  }

  const details = lenderIds.map((lenderId) => ({
    user: lenderId,
    loan: loan._id,
    type: 'REPAYMENT_RECEIVED',
    title: 'Repayment activity',
    message: `A borrower recorded a simulated repayment of $${Number(transaction.amount).toFixed(2)}.`,
  }))

  if (loan.status === 'COMPLETED' && borrowerId) {
    details.push({
      user: borrowerId,
      loan: loan._id,
      type: 'PAYMENT_COMPLETED',
      title: 'Loan repaid in full',
      message: `You completed the simulated repayment of ${loan.purpose}.`,
    })
  }

  const notifications = details.length > 0
    ? await Notification.insertMany(details)
    : []

  for (const lenderId of lenderIds) {
    const room = `user:${lenderId}`
    io.to(room).emit('loanUpdated', payload)
    io.to(room).emit('repaymentMade', payload)
    io.to(room).emit('paymentReceived', payload)
  }

  for (const notification of notifications) {
    io.to(`user:${notification.user}`).emit('notificationCreated', {
      ...notification.toObject(),
      loanId: notification.loan.toString(),
    })
  }

  if (loan.status === 'COMPLETED') {
    io.to(`user:${borrowerId}`).emit('paymentCompleted', payload)
    for (const lenderId of lenderIds) {
      io.to(`user:${lenderId}`).emit('paymentCompleted', payload)
    }
  }
}
