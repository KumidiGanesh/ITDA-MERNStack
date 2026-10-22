function requireLender(request, response, next) {
  if (!['lender', 'both'].includes(request.user.role)) {
    return response.status(403).json({
      success: false,
      message: 'A lender account is required to browse the loan marketplace.',
    })
  }

  return next()
}

export default requireLender
