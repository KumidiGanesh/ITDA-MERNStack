import { useState } from 'react'

function PasswordField({
  id,
  name,
  label,
  autoComplete,
  placeholder,
  minLength,
  value,
  onChange,
  error,
}) {
  const [visible, setVisible] = useState(false)
  const errorId = `${id}-error`

  return (
    <div className="auth-field">
      <label htmlFor={id}>{label}</label>
      <div className="password-input-wrap">
        <input
          id={id}
          name={name}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          placeholder={placeholder}
          minLength={minLength}
          value={value}
          onChange={onChange}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          required
        />
        <button
          className="password-visibility-toggle"
          type="button"
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
          onClick={() => setVisible((current) => !current)}
        >
          {visible ? (
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M3 3l18 18M10.6 10.7a2 2 0 002.7 2.7" />
              <path d="M9.9 5.2A10.8 10.8 0 0112 5c5.2 0 8.5 4.3 9.5 6-.4.7-1.4 2.1-3 3.3M6.2 6.2C4.2 7.4 2.9 9.4 2.5 11c.7 1.2 4 6 9.5 6 1 0 1.9-.2 2.7-.5" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </button>
      </div>
      {error && <span className="field-error" id={errorId}>{error}</span>}
    </div>
  )
}

export default PasswordField
