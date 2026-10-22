import { randomUUID } from 'node:crypto'
import Loan from '../models/Loan.js'
import Transaction from '../models/Transaction.js'
import { emitLoanCreated, emitLoanFunded, emitRepaymentMade } from '../utils/loanEvents.js'

const marketplaceStatuses = ['APPROVED', 'FUNDING']

function addCalendarMonths(date, months) {
  const result = new Date(date)
  const day = result.getDate()
  result.setDate(1)
  result.setMonth(result.getMonth() + months)
  const lastDay = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate()
  result.setDate(Math.min(day, lastDay))
  return result
}

function withoutBorrowerAddress(loan) {
  const publicLoan = { ...loan }
  delete publicLoan.address
  return publicLoan
}

function validateLoanRequest(body) {
  const errors = {}
  const amount = typeof body.amount === 'number' ? body.amount : Number(body.amount)
  const purpose = typeof body.purpose === 'string' ? body.purpose.trim() : ''
  const description = typeof body.description === 'string' ? body.description.trim() : ''
  const duration = typeof body.duration === 'number' ? body.duration : Number(body.duration)
  const repaymentFrequency = typeof body.repaymentFrequency === 'string'
    ? body.repaymentFrequency.trim().toUpperCase()
    : ''
  const addressFields = [
    ['houseStreet', 'House, flat, or street address', 150],
    ['villageTown', 'Village or town', 100],
    ['mandal', 'Mandal or taluk', 100],
    ['postOffice', 'Post office', 100],
    ['district', 'District', 100],
    ['state', 'State', 100],
    ['country', 'Country', 100],
  ]
  const address = {}

  for (const [field, label, maxLength] of addressFields) {
    const value = typeof body.address?.[field] === 'string'
      ? body.address[field].trim()
      : ''
    if (!value) errors[`address.${field}`] = `${label} is required.`
    else if (value.length > maxLength) {
      errors[`address.${field}`] = `${label} cannot exceed ${maxLength} characters.`
    }
    address[field] = value
  }

  const pinCode = typeof body.address?.pinCode === 'string'
    ? body.address.pinCode.trim()
    : ''
  if (!pinCode) errors['address.pinCode'] = 'PIN code is required.'
  else if (!/^\d{6}$/.test(pinCode)) {
    errors['address.pinCode'] = 'Enter a valid 6-digit Indian PIN code.'
  }
  address.pinCode = pinCode

  if (body.amount === undefined || body.amount === '') {
    errors.amount = 'Loan amount is required.'
  } else if (!Number.isFinite(amount) || amount < 1 || !Number.isInteger(Math.round(amount * 100))) {
    errors.amount = 'Enter a valid amount of at least 1.'
  } else if (Math.round(amount * 100) !== amount * 100) {
    errors.amount = 'Amount can have no more than 2 decimal places.'
  }

  if (!purpose) errors.purpose = 'Loan purpose is required.'
  else if (purpose.length < 2 || purpose.length > 100) {
    errors.purpose = 'Purpose must be between 2 and 100 characters.'
  }

  if (!description) errors.description = 'Loan description is required.'
  else if (description.length < 20 || description.length > 2000) {
    errors.description = 'Description must be between 20 and 2000 characters.'
  }

  if (body.duration === undefined || body.duration === '') {
    errors.duration = 'Loan duration is required.'
  } else if (!Number.isInteger(duration) || duration < 1 || duration > 60) {
    errors.duration = 'Duration must be a whole number between 1 and 60 months.'
  }

  if (!['WEEKLY', 'BIWEEKLY', 'MONTHLY'].includes(repaymentFrequency)) {
    errors.repaymentFrequency = 'Choose weekly, biweekly, or monthly repayments.'
  }

  return {
    errors,
    values: { amount, purpose, description, duration, repaymentFrequency, address },
  }
}

export async function createLoan(request, response, next) {
  try {
    const { errors, values } = validateLoanRequest(request.body ?? {})

    if (Object.keys(errors).length > 0) {
      return response.status(400).json({
        success: false,
        message: 'Please correct the loan request details.',
        errors,
      })
    }

    const loan = await Loan.create({
      borrower: request.user._id,
      ...values,
      fundedAmount: 0,
      remainingAmount: values.amount,
      status: 'PENDING',
    })

    const loanData = loan.toObject()
    try {
      emitLoanCreated(request.app.get('io'), loanData, request.user._id.toString())
    } catch (error) {
      console.error(`Loan ${loan._id} was created, but its realtime events could not be emitted: ${error.message}`)
    }

    return response.status(201).json({
      success: true,
      message: 'Loan request submitted successfully.',
      data: { loan: loanData },
    })
  } catch (error) {
    return next(error)
  }
}

export async function getMyLoans(request, response, next) {
  try {
    const loans = await Loan.find({ borrower: request.user._id })
      .sort({ createdAt: -1 })
      .lean()

    return response.json({
      success: true,
      message: 'Loan requests retrieved successfully.',
      data: {
        loans,
        count: loans.length,
      },
    })
  } catch (error) {
    return next(error)
  }
}

export async function getMarketplaceLoans(request, response, next) {
  try {
    const loans = await Loan.find({
      status: { $in: marketplaceStatuses },
      remainingAmount: { $gt: 0 },
      borrower: { $ne: request.user._id },
    })
      .select('-address')
      .populate('borrower', 'name profileImage')
      .sort({ createdAt: -1 })
      .lean()

    return response.json({
      success: true,
      message: 'Available loan requests retrieved successfully.',
      data: {
        loans,
        count: loans.length,
      },
    })
  } catch (error) {
    return next(error)
  }
}

export async function getMarketplaceLoan(request, response, next) {
  try {
    if (!/^[0-9a-fA-F]{24}$/.test(request.params.loanId)) {
      return response.status(400).json({
        success: false,
        message: 'Invalid loan request ID.',
      })
    }

    const loan = await Loan.findOne({
      _id: request.params.loanId,
      status: { $in: marketplaceStatuses },
      remainingAmount: { $gt: 0 },
      borrower: { $ne: request.user._id },
    })
      .select('-address')
      .populate('borrower', 'name profileImage')
      .lean()

    if (!loan) {
      return response.status(404).json({
        success: false,
        message: 'This loan request is not available in the marketplace.',
      })
    }

    return response.json({
      success: true,
      message: 'Loan request retrieved successfully.',
      data: { loan },
    })
  } catch (error) {
    return next(error)
  }
}

export async function fundLoan(request, response, next) {
  const amount = typeof request.body?.amount === 'number'
    ? request.body.amount
    : Number(request.body?.amount)

  if (
    request.body?.amount === undefined
    || request.body.amount === ''
    || !Number.isFinite(amount)
    || amount < 0.01
    || Math.abs(amount * 100 - Math.round(amount * 100)) > 1e-7
  ) {
    return response.status(400).json({
      success: false,
      message: 'Enter a valid funding amount of at least 0.01 with no more than 2 decimal places.',
      errors: { amount: 'Funding amount must be at least 0.01 with up to 2 decimal places.' },
    })
  }

  if (!/^[0-9a-fA-F]{24}$/.test(request.params.loanId)) {
    return response.status(400).json({
      success: false,
      message: 'Invalid loan request ID.',
    })
  }

  let transaction
  let fundingApplied = false
  let updatedLoan
  let completedTransaction

  try {
    const loan = await Loan.findById(request.params.loanId)

    if (!loan) {
      return response.status(404).json({
        success: false,
        message: 'Loan request not found.',
      })
    }

    if (loan.borrower.equals(request.user._id)) {
      return response.status(403).json({
        success: false,
        message: 'You cannot fund your own loan request.',
      })
    }

    if (!marketplaceStatuses.includes(loan.status) || loan.remainingAmount <= 0) {
      return response.status(409).json({
        success: false,
        message: 'This loan is not currently available for funding.',
      })
    }

    if (amount > loan.remainingAmount) {
      return response.status(400).json({
        success: false,
        message: 'Funding amount cannot exceed the remaining loan amount.',
        errors: { amount: `The remaining amount is ${loan.remainingAmount}.` },
      })
    }

    transaction = await Transaction.create({
      user: request.user._id,
      loan: loan._id,
      borrower: loan.borrower,
      lender: request.user._id,
      amount,
      type: 'FUNDING',
      reference: `PL-${randomUUID()}`,
      status: 'PENDING',
      simulated: true,
    })

    const repaymentStartDate = new Date()
    const dueDate = addCalendarMonths(repaymentStartDate, loan.duration)
    updatedLoan = await Loan.findOneAndUpdate(
      {
        _id: loan._id,
        borrower: { $ne: request.user._id },
        status: { $in: marketplaceStatuses },
        remainingAmount: { $gte: amount },
      },
      [
        {
          $set: {
            fundedAmount: {
              $round: [{ $add: [{ $ifNull: ['$fundedAmount', 0] }, amount] }, 2],
            },
            remainingAmount: {
              $round: [{ $subtract: ['$remainingAmount', amount] }, 2],
            },
            status: {
              $cond: [
                { $lte: [{ $subtract: ['$remainingAmount', amount] }, 0] },
                'FUNDED',
                'FUNDING',
              ],
            },
            repaymentStartDate: {
              $cond: [
                { $lte: [{ $subtract: ['$remainingAmount', amount] }, 0] },
                { $ifNull: ['$repaymentStartDate', repaymentStartDate] },
                '$repaymentStartDate',
              ],
            },
            dueDate: {
              $cond: [
                { $lte: [{ $subtract: ['$remainingAmount', amount] }, 0] },
                { $ifNull: ['$dueDate', dueDate] },
                '$dueDate',
              ],
            },
            updatedAt: '$$NOW',
          },
        },
      ],
      { returnDocument: 'after', updatePipeline: true },
    )

    if (!updatedLoan) {
      await Transaction.findByIdAndUpdate(transaction._id, {
        status: 'FAILED',
        failureReason: 'The loan changed or no longer has enough remaining funds.',
      })

      const currentLoan = await Loan.findById(loan._id).select('remainingAmount status')
      if (!currentLoan) {
        return response.status(404).json({
          success: false,
          message: 'Loan request not found.',
        })
      }

      if (amount > currentLoan.remainingAmount) {
        return response.status(400).json({
          success: false,
          message: 'Funding amount cannot exceed the remaining loan amount.',
          errors: { amount: `The remaining amount is ${currentLoan.remainingAmount}.` },
        })
      }

      return response.status(409).json({
        success: false,
        message: 'This loan changed while you were funding it. Refresh and try again.',
      })
    }

    fundingApplied = true

    try {
      completedTransaction = await Transaction.findByIdAndUpdate(
        transaction._id,
        { status: 'COMPLETED' },
        { returnDocument: 'after' },
      ).lean()
    } catch (error) {
      console.error(`Funding ${transaction._id} was applied, but its transaction record could not be finalized: ${error.message}`)
    }

    let loanData = updatedLoan.toObject()
    try {
      const populatedLoan = await updatedLoan.populate('borrower', 'name profileImage')
      loanData = populatedLoan.toObject()
    } catch (error) {
      console.error(`Funding ${transaction._id} was applied, but borrower details could not be loaded: ${error.message}`)
    }

    try {
      emitLoanFunded(
        request.app.get('io'),
        loanData,
        completedTransaction ?? transaction,
        request.user._id.toString(),
      )
    } catch (error) {
      console.error(`Funding ${transaction._id} was applied, but its realtime event could not be emitted: ${error.message}`)
    }

    return response.status(200).json({
      success: true,
      message: 'Simulated funding successful.',
      data: {
        loan: withoutBorrowerAddress(loanData),
        transaction: completedTransaction ?? {
          _id: transaction._id,
          amount,
          type: 'FUNDING',
          reference: transaction.reference,
          status: 'PENDING',
          simulated: true,
        },
      },
    })
  } catch (error) {
    if (fundingApplied && updatedLoan) {
      return response.status(200).json({
        success: true,
        message: 'Simulated funding successful.',
        data: {
          loan: withoutBorrowerAddress(updatedLoan.toObject()),
          transaction: completedTransaction ?? {
            _id: transaction?._id,
            amount,
            type: 'FUNDING',
            reference: transaction?.reference,
            status: 'PENDING',
            simulated: true,
          },
        },
        warning: 'Funding was applied, but some supplementary details could not be completed.',
      })
    }

    if (transaction && !fundingApplied) {
      try {
        await Transaction.findByIdAndUpdate(transaction._id, {
          status: 'FAILED',
          failureReason: 'The simulated funding could not be applied.',
        })
      } catch (recordError) {
        console.error(`Could not mark failed funding transaction ${transaction._id}: ${recordError.message}`)
      }
    }

    return next(error)
  }
}

export async function getRepaymentDetails(request, response, next) {
  try {
    if (!/^[0-9a-fA-F]{24}$/.test(request.params.loanId)) {
      return response.status(400).json({
        success: false,
        message: 'Invalid loan request ID.',
      })
    }

    const loan = await Loan.findOne({
      _id: request.params.loanId,
      borrower: request.user._id,
    }).lean()

    if (!loan) {
      return response.status(404).json({
        success: false,
        message: 'Loan request not found.',
      })
    }

    const transactions = await Transaction.find({
      loan: loan._id,
      user: request.user._id,
      type: 'REPAYMENT',
    })
      .sort({ createdAt: -1 })
      .lean()

    return response.json({
      success: true,
      message: 'Repayment details retrieved successfully.',
      data: { loan, transactions },
    })
  } catch (error) {
    return next(error)
  }
}

export async function repayLoan(request, response, next) {
  const amount = typeof request.body?.amount === 'number'
    ? request.body.amount
    : Number(request.body?.amount)

  if (
    request.body?.amount === undefined
    || request.body.amount === ''
    || !Number.isFinite(amount)
    || amount < 0.01
    || Math.abs(amount * 100 - Math.round(amount * 100)) > 1e-7
  ) {
    return response.status(400).json({
      success: false,
      message: 'Enter a valid repayment amount of at least 0.01 with no more than 2 decimal places.',
      errors: { amount: 'Repayment amount must be at least 0.01 with up to 2 decimal places.' },
    })
  }

  if (!/^[0-9a-fA-F]{24}$/.test(request.params.loanId)) {
    return response.status(400).json({
      success: false,
      message: 'Invalid loan request ID.',
    })
  }

  let transaction
  let repaymentApplied = false
  let updatedLoan
  let completedTransaction

  try {
    const loan = await Loan.findOne({
      _id: request.params.loanId,
      borrower: request.user._id,
    })

    if (!loan) {
      return response.status(404).json({
        success: false,
        message: 'Loan request not found.',
      })
    }

    if (!['FUNDED', 'ACTIVE'].includes(loan.status)) {
      return response.status(409).json({
        success: false,
        message: 'Repayments are available once this loan is fully funded.',
      })
    }

    const paidAmount = Number(loan.paidAmount) || 0
    const remainingAmount = Math.round((loan.amount - paidAmount) * 100) / 100

    if (remainingAmount <= 0) {
      return response.status(409).json({
        success: false,
        message: 'This loan has already been fully repaid.',
      })
    }

    if (amount > remainingAmount) {
      return response.status(400).json({
        success: false,
        message: 'Repayment amount cannot exceed the remaining loan balance.',
        errors: { amount: `The remaining balance is ${remainingAmount}.` },
      })
    }

    transaction = await Transaction.create({
      user: request.user._id,
      loan: loan._id,
      borrower: loan.borrower,
      amount,
      type: 'REPAYMENT',
      reference: `PL-${randomUUID()}`,
      status: 'PENDING',
      simulated: true,
    })

    updatedLoan = await Loan.findOneAndUpdate(
      {
        _id: loan._id,
        borrower: request.user._id,
        status: { $in: ['FUNDED', 'ACTIVE'] },
        $expr: {
          $gte: [
            { $subtract: ['$amount', { $ifNull: ['$paidAmount', 0] }] },
            amount,
          ],
        },
      },
      [
        {
          $set: {
            paidAmount: {
              $round: [{ $add: [{ $ifNull: ['$paidAmount', 0] }, amount] }, 2],
            },
            status: {
              $cond: [
                {
                  $lte: [
                    { $subtract: ['$amount', { $add: [{ $ifNull: ['$paidAmount', 0] }, amount] }] },
                    0,
                  ],
                },
                'COMPLETED',
                'ACTIVE',
              ],
            },
            repaymentStartDate: { $ifNull: ['$repaymentStartDate', '$$NOW'] },
            dueDate: { $ifNull: ['$dueDate', addCalendarMonths(new Date(), loan.duration)] },
            updatedAt: '$$NOW',
          },
        },
      ],
      { returnDocument: 'after', updatePipeline: true },
    )

    if (!updatedLoan) {
      await Transaction.findByIdAndUpdate(transaction._id, {
        status: 'FAILED',
        failureReason: 'The loan balance changed before this repayment could be applied.',
      })

      const currentLoan = await Loan.findOne({
        _id: loan._id,
        borrower: request.user._id,
      }).select('amount paidAmount status')

      if (!currentLoan) {
        return response.status(404).json({
          success: false,
          message: 'Loan request not found.',
        })
      }

      const latestBalance = Math.max(
        0,
        Math.round((currentLoan.amount - (Number(currentLoan.paidAmount) || 0)) * 100) / 100,
      )

      if (amount > latestBalance) {
        return response.status(400).json({
          success: false,
          message: 'Repayment amount cannot exceed the remaining loan balance.',
          errors: { amount: `The remaining balance is ${latestBalance}.` },
        })
      }

      return response.status(409).json({
        success: false,
        message: 'This loan changed while you were making a repayment. Refresh and try again.',
      })
    }

    repaymentApplied = true

    try {
      completedTransaction = await Transaction.findByIdAndUpdate(
        transaction._id,
        { status: 'COMPLETED' },
        { returnDocument: 'after' },
      ).lean()
    } catch (error) {
      console.error(`Repayment ${transaction._id} was applied, but its transaction record could not be finalized: ${error.message}`)
    }

    try {
      const fundingTransactions = await Transaction.find({
        loan: loan._id,
        type: { $in: ['FUNDING', 'SIMULATED_FUNDING'] },
        status: 'COMPLETED',
      }).select('user lender').lean()
      const lenderIds = [...new Set(fundingTransactions
        .map((funding) => funding.user ?? funding.lender)
        .filter(Boolean)
        .map((userId) => userId.toString()))]
      emitRepaymentMade(
        request.app.get('io'),
        updatedLoan.toObject(),
        completedTransaction ?? transaction,
        lenderIds,
      )
    } catch (error) {
      console.error(`Repayment ${transaction._id} was applied, but its realtime events could not be emitted: ${error.message}`)
    }

    return response.status(200).json({
      success: true,
      message: 'Simulated repayment successful.',
      data: {
        loan: updatedLoan.toObject(),
        transaction: completedTransaction ?? {
          _id: transaction._id,
          amount,
          type: 'REPAYMENT',
          reference: transaction.reference,
          status: 'PENDING',
          simulated: true,
        },
      },
    })
  } catch (error) {
    if (repaymentApplied && updatedLoan) {
      return response.status(200).json({
        success: true,
        message: 'Simulated repayment successful.',
        data: {
          loan: updatedLoan.toObject(),
          transaction: completedTransaction ?? {
            _id: transaction?._id,
            amount,
            type: 'REPAYMENT',
            reference: transaction?.reference,
            status: 'PENDING',
            simulated: true,
          },
        },
        warning: 'Repayment was applied, but some supplementary details could not be completed.',
      })
    }

    if (transaction && !repaymentApplied) {
      try {
        await Transaction.findByIdAndUpdate(transaction._id, {
          status: 'FAILED',
          failureReason: 'The simulated repayment could not be applied.',
        })
      } catch (recordError) {
        console.error(`Could not mark failed repayment transaction ${transaction._id}: ${recordError.message}`)
      }
    }

    return next(error)
  }
}
