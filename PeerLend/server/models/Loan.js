import mongoose from 'mongoose'

export const loanStatuses = [
  'PENDING',
  'APPROVED',
  'FUNDING',
  'FUNDED',
  'ACTIVE',
  'COMPLETED',
  'REJECTED',
]

export const repaymentFrequencies = ['WEEKLY', 'BIWEEKLY', 'MONTHLY']

const loanAddressSchema = new mongoose.Schema(
  {
    houseStreet: {
      type: String,
      required: [true, 'House, flat, or street address is required.'],
      trim: true,
      maxlength: [150, 'House or street address cannot exceed 150 characters.'],
    },
    villageTown: {
      type: String,
      required: [true, 'Village or town is required.'],
      trim: true,
      maxlength: [100, 'Village or town cannot exceed 100 characters.'],
    },
    mandal: {
      type: String,
      required: [true, 'Mandal or taluk is required.'],
      trim: true,
      maxlength: [100, 'Mandal or taluk cannot exceed 100 characters.'],
    },
    postOffice: {
      type: String,
      required: [true, 'Post office is required.'],
      trim: true,
      maxlength: [100, 'Post office cannot exceed 100 characters.'],
    },
    pinCode: {
      type: String,
      required: [true, 'PIN code is required.'],
      trim: true,
      match: [/^\d{6}$/, 'Enter a valid 6-digit Indian PIN code.'],
    },
    district: {
      type: String,
      required: [true, 'District is required.'],
      trim: true,
      maxlength: [100, 'District cannot exceed 100 characters.'],
    },
    state: {
      type: String,
      required: [true, 'State is required.'],
      trim: true,
      maxlength: [100, 'State cannot exceed 100 characters.'],
    },
    country: {
      type: String,
      required: [true, 'Country is required.'],
      trim: true,
      maxlength: [100, 'Country cannot exceed 100 characters.'],
    },
  },
  { _id: false },
)

const loanSchema = new mongoose.Schema(
  {
    borrower: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Borrower is required.'],
      index: true,
    },
    address: {
      type: loanAddressSchema,
      required: [true, 'A complete address is required.'],
    },
    amount: {
      type: Number,
      required: [true, 'Loan amount is required.'],
      min: [1, 'Loan amount must be at least 1.'],
      validate: {
        validator: Number.isFinite,
        message: 'Loan amount must be a valid number.',
      },
    },
    purpose: {
      type: String,
      required: [true, 'Loan purpose is required.'],
      trim: true,
      minlength: [2, 'Purpose must be at least 2 characters long.'],
      maxlength: [100, 'Purpose cannot exceed 100 characters.'],
    },
    description: {
      type: String,
      required: [true, 'Loan description is required.'],
      trim: true,
      minlength: [20, 'Description must be at least 20 characters long.'],
      maxlength: [2000, 'Description cannot exceed 2000 characters.'],
    },
    duration: {
      type: Number,
      required: [true, 'Loan duration is required.'],
      min: [1, 'Duration must be at least 1 month.'],
      max: [60, 'Duration cannot exceed 60 months.'],
      validate: {
        validator: Number.isInteger,
        message: 'Duration must be a whole number of months.',
      },
    },
    repaymentFrequency: {
      type: String,
      required: [true, 'Repayment frequency is required.'],
      enum: {
        values: repaymentFrequencies,
        message: 'Repayment frequency must be weekly, biweekly, or monthly.',
      },
    },
    fundedAmount: {
      type: Number,
      default: 0,
      min: [0, 'Funded amount cannot be negative.'],
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: [0, 'Paid amount cannot be negative.'],
    },
    remainingAmount: {
      type: Number,
      required: [true, 'Remaining amount is required.'],
      min: [0, 'Remaining amount cannot be negative.'],
    },
    status: {
      type: String,
      enum: {
        values: loanStatuses,
        message: 'Invalid loan status.',
      },
      default: 'PENDING',
      required: true,
    },
    dueDate: {
      type: Date,
      default: null,
    },
    repaymentStartDate: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
)

const Loan = mongoose.model('Loan', loanSchema)

export default Loan
