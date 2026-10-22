import bcrypt from 'bcrypt'
import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required.'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters.'],
    },
    email: {
      type: String,
      required: [true, 'Email is required.'],
      trim: true,
      lowercase: true,
      unique: true,
      maxlength: [254, 'Email cannot exceed 254 characters.'],
    },
    phone: {
      type: String,
      required: [true, 'Phone is required.'],
      trim: true,
      match: [/^\d{10}$/, 'Phone number must contain exactly 10 digits.'],
    },
    password: {
      type: String,
      required: [true, 'Password is required.'],
      minlength: [8, 'Password must be at least 8 characters long.'],
      select: false,
    },
    role: {
      type: String,
      required: [true, 'Role is required.'],
      enum: {
        values: ['borrower', 'lender', 'both'],
        message: 'Role must be borrower, lender, or both.',
      },
    },
    profileImage: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_document, result) {
        delete result.password
        delete result.__v
        return result
      },
    },
  },
)

userSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password')) return

  this.password = await bcrypt.hash(this.password, 12)
})

const User = mongoose.model('User', userSchema)

export default User
