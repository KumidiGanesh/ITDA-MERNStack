import mongoose from 'mongoose'

const notificationTypes = [
  'LOAN_CREATED',
  'LOAN_APPROVED',
  'LOAN_FUNDED',
  'REPAYMENT_RECEIVED',
  'PAYMENT_COMPLETED',
]

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    type: {
      type: String,
      required: true,
      enum: notificationTypes,
      index: true,
    },
    isRead: {
      type: Boolean,
      default: false,
      required: true,
      index: true,
    },
    loan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Loan',
      default: null,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
)

notificationSchema.index({ user: 1, createdAt: -1 })

const Notification = mongoose.model('Notification', notificationSchema)

export default Notification
