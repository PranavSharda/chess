import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signUp } from '../services/api'
import './Auth.css'

function SignUp({ onLogin }) {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    lichess_id: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // signUp now returns a JWT token and user data in one call
      const user = await signUp(formData)
      onLogin(user)
      navigate('/dashboard')
    } catch (err) {
      const data = err.response?.data
      const detail = data?.detail
      const status = err.response?.status
      let message = 'Sign up failed. Please try again.'
      if (!err.response) {
        message = 'Cannot reach server. Is the backend running at ' + (import.meta.env.VITE_API_URL || 'http://localhost:8000') + '?'
      } else if (typeof detail === 'string') {
        message = detail
      } else if (Array.isArray(detail) && detail.length) {
        message = detail.map((e) => e.msg || e.loc?.join('.')).join('. ')
      } else if (data?.message && typeof data.message === 'string') {
        message = data.message
      } else if (status === 500) {
        message = 'Server error. Check backend logs.'
      } else if (status) {
        message = `Sign up failed (${status}). ${typeof detail === 'object' && detail !== null ? JSON.stringify(detail) : ''}`
      }
      console.error('SignUp error', status, data)
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Create Account</h1>
        <p className="subtitle">Make your move and join the community</p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              placeholder="Choose a username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="your.email@example.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Create a strong password"
              minLength={6}
            />
          </div>

          <div className="form-group">
            <label htmlFor="lichess_id">Lichess ID (Optional)</label>
            <input
              type="text"
              id="lichess_id"
              name="lichess_id"
              value={formData.lichess_id}
              onChange={handleChange}
              placeholder="Your Lichess username"
            />
          </div>

          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <p className="auth-link">
          Already have an account? <Link to="/signin">Sign in</Link>
        </p>
      </div>
    </div>
  )
}

export default SignUp

