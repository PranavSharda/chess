import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signUp, signIn } from '../services/api'
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
      const response = await signUp(formData)
      // Auto-login after signup
      const loginResponse = await signIn({
        emailOrUsername: formData.username,
        password: formData.password,
      })
      onLogin(loginResponse)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.detail || 'Sign up failed. Please try again.')
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

