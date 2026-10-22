import mongoose from 'mongoose'

const transactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    loan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Loan',
      required: true,
      index: true,
    },
    borrower: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    lender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [0.01, 'Transaction amount must be greater than zero.'],
    },
    reference: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['FUNDING', 'REPAYMENT', 'REFUND'],
      required: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'COMPLETED', 'FAILED'],
      required: true,
      default: 'PENDING',
    },
    failureReason: {
      type: String,
      default: '',
      maxlength: 300,
    },
    simulated: {
      type: Boolean,
      required: true,
      default: true,
    },
  },
  { timestamps: true },
)

const Transaction = mongoose.model('Transaction', transactionSchema)

export default Transaction
