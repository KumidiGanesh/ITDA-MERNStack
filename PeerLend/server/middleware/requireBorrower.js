function requireBorrower(request, response, next) {
  if (!['borrower', 'both'].includes(request.user.role)) {
    return response.status(403).json({
      success: false,
      message: 'A borrower account is required to request or view loans.',
    })
  }

  return next()
}

export default requireBorrower
