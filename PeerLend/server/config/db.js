import mongoose from 'mongoose'

async function connectDB() {
  const mongoUri = process.env.MONGO_URI

  if (!mongoUri) {
    throw new Error('MONGO_URI is not set. Add your MongoDB connection string to server/.env.')
  }

  try {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 })
    console.log(`MongoDB connected to ${mongoose.connection.host}/${mongoose.connection.name}`)
  } catch (error) {
    console.error(`MongoDB connection failed: ${error.message}`)
    throw error
  }
}

export default connectDB
