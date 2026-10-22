function AuthMessage({ children, type = 'error' }) {
  if (!children) return null

  return (
    <div className={`auth-${type}`} role={type === 'error' ? 'alert' : 'status'}>
      {children}
    </div>
  )
}

export default AuthMessage
