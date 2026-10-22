import Loan from '../models/Loan.js'
import Transaction from '../models/Transaction.js'

const transactionTypes = {
  FUNDING: ['FUNDING', 'SIMULATED_FUNDING'],
  REPAYMENT: ['REPAYMENT'],
  REFUND: ['REFUND'],
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export async function getTransactions(request, response, next) {
  const page = Number(request.query.page ?? 1)
  const limit = Number(request.query.limit ?? 10)
  const sortBy = request.query.sortBy ?? 'date'
  const sortOrder = request.query.sortOrder ?? 'desc'
  const type = typeof request.query.type === 'string' ? request.query.type.toUpperCase() : 'ALL'
  const search = typeof request.query.search === 'string' ? request.query.search.trim() : ''

  if (
    !Number.isInteger(page)
    || page < 1
    || !Number.isInteger(limit)
    || limit < 1
    || limit > 50
    || !['date', 'amount', 'type', 'status'].includes(sortBy)
    || !['asc', 'desc'].includes(sortOrder)
    || (type !== 'ALL' && !transactionTypes[type])
    || search.length > 100
  ) {
    return response.status(400).json({
      success: false,
      message: 'Invalid transaction filter or pagination options.',
    })
  }

  try {
    const participatedLoanIds = await Transaction.distinct('loan', {
      type: { $in: ['FUNDING', 'SIMULATED_FUNDING'] },
      status: 'COMPLETED',
      $or: [
        { user: request.user._id },
        { lender: request.user._id },
      ],
    })
    const accessFilter = {
      $or: [
        { user: request.user._id },
        { borrower: request.user._id },
        { lender: request.user._id },
        ...(participatedLoanIds.length > 0
          ? [{ loan: { $in: participatedLoanIds }, type: 'REPAYMENT' }]
          : []),
      ],
    }
    const filters = [accessFilter]

    if (type !== 'ALL') {
      filters.push({ type: { $in: transactionTypes[type] } })
    }

    if (search) {
      const searchRegex = new RegExp(escapeRegex(search), 'i')
      const matchingLoans = await Loan.find({ purpose: searchRegex }).select('_id').lean()
      filters.push({
        $or: [
          { reference: searchRegex },
          { type: searchRegex },
          { status: searchRegex },
          { loan: { $in: matchingLoans.map((loan) => loan._id) } },
        ],
      })
    }

    const query = { $and: filters }
    const sortFields = {
      date: 'createdAt',
      amount: 'amount',
      type: 'type',
      status: 'status',
    }
    const sort = { [sortFields[sortBy]]: sortOrder === 'asc' ? 1 : -1, _id: -1 }
    const [transactions, total] = await Promise.all([
      Transaction.find(query)
        .populate('loan', 'purpose amount status')
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Transaction.countDocuments(query),
    ])

    return response.json({
      success: true,
      message: 'Transactions retrieved successfully.',
      data: {
        transactions,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    })
  } catch (error) {
    return next(error)
  }
}
