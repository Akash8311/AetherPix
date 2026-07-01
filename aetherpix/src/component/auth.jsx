import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#FFC107" d="M43.6 20.5H42V20.4H24v7.2h11.3c-1.6 4.7-6 8.1-11.3 8.1-6.9 0-12.5-5.6-12.5-12.5S17.1 10.7 24 10.7c3.2 0 6.1 1.2 8.3 3.2l5.1-5.1C34.3 5.9 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.4-.4-3.5z"/>
    <path fill="#FF3D00" d="M6.3 14.7l5.9 4.3C13.9 15.4 18.6 12.7 24 12.7c3.2 0 6.1 1.2 8.3 3.2l5.1-5.1C34.3 7.9 29.4 6 24 6c-7.5 0-14 4.2-17.7 10.4z"/>
    <path fill="#4CAF50" d="M24 44c5.3 0 10.1-1.8 13.9-5l-6.4-5.4c-2 1.5-4.6 2.4-7.5 2.4-5.3 0-9.7-3.4-11.3-8.1l-6.2 4.8C10 39.7 16.5 44 24 44z"/>
    <path fill="#1976D2" d="M43.6 20.5H42V20.4H24v7.2h11.3c-.8 2.3-2.2 4.3-4.1 5.7l6.4 5.4C41.5 35.6 44 30.2 44 24c0-1.2-.1-2.4-.4-3.5z"/>
  </svg>
)

const Auth = () => {
  const [mode, setMode] = useState('login')
  const [loading, setLoading] = useState(false)
  const isLogin = mode === 'login'
  const navigate = useNavigate()

  const handleGoogleAuth = () => {
    setLoading(true)
    console.log(`${mode} with Google`)
    setTimeout(() => {
      setLoading(false)
      navigate('/home')
    }, 900)
  }
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0F1115',
        fontFamily:
          "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        padding: '24px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '380px',
          background: '#181B21',
          border: '1px solid #262A33',
          borderRadius: '16px',
          padding: '40px 32px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
        }}
      >
        {/* Mark */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '28px',
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #6C5CE7, #4834D4)',
              flexShrink: 0,
            }}
          />
          <span
            style={{
              color: '#F5F6F8',
              fontSize: '17px',
              fontWeight: 700,
              letterSpacing: '-0.01em',
            }}
          >
            AetherPix
          </span>
        </div>

        <h1
          style={{
            color: '#F5F6F8',
            fontSize: '22px',
            fontWeight: 600,
            margin: 0,
            letterSpacing: '-0.02em',
          }}
        >
          {isLogin ? 'Welcome back' : 'Create your account'}
        </h1>
        <p
          style={{
            color: '#8B909C',
            fontSize: '14px',
            margin: '8px 0 32px',
            lineHeight: 1.5,
          }}
        >
          {isLogin
            ? 'Sign in with your Google account to continue.'
            : 'Sign up with Google — takes less than a minute.'}
        </p>

        <button
          onClick={handleGoogleAuth}
          disabled={loading}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            background: '#F5F6F8',
            border: 'none',
            borderRadius: '10px',
            padding: '12px 16px',
            fontSize: '14px',
            fontWeight: 600,
            color: '#1A1D23',
            cursor: loading ? 'default' : 'pointer',
            opacity: loading ? 0.75 : 1,
            transition: 'background 0.15s ease, transform 0.1s ease, opacity 0.15s ease',
          }}
          onMouseOver={(e) => !loading && (e.currentTarget.style.background = '#E8E9ED')}
          onMouseOut={(e) => !loading && (e.currentTarget.style.background = '#F5F6F8')}
          onMouseDown={(e) => !loading && (e.currentTarget.style.transform = 'scale(0.98)')}
          onMouseUp={(e) => !loading && (e.currentTarget.style.transform = 'scale(1)')}
        >
          <GoogleIcon />
          {loading
            ? 'Connecting…'
            : isLogin
            ? 'Continue with Google'
            : 'Sign up with Google'}
        </button>

        <p
          style={{
            textAlign: 'center',
            color: '#8B909C',
            fontSize: '13px',
            marginTop: '24px',
          }}
        >
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <span
            onClick={() => setMode(isLogin ? 'signup' : 'login')}
            style={{
              color: '#A29BFE',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            {isLogin ? 'Sign up' : 'Log in'}
          </span>
        </p>
      </div>
    </div>
  )
}

export default Auth