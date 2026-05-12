'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect, useRef } from 'react'
import bewave from '../../public/goaradio logo round (1).png'

// Firebase imports — adjust path to your firebase config
// import { auth } from '@/lib/firebase'
// import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth'

type Step = 'intent' | 'login' | 'signup' | 'claim'

export function Navbar() {
  const [modalOpen, setModalOpen] = useState(false)
  const [step, setStep] = useState<Step>('intent')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [artistName, setArtistName] = useState('')
  const [xHandle, setXHandle] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const overlayRef = useRef<HTMLDivElement>(null)

  // Check auth state on mount
  useEffect(() => {
    // onAuthStateChanged(auth, (user) => setIsLoggedIn(!!user))
  }, [])

  function openModal() {
    setStep('intent')
    setError('')
    setEmail('')
    setPassword('')
    setArtistName('')
    setXHandle('')
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
  }

  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === overlayRef.current) closeModal()
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      // await signInWithEmailAndPassword(auth, email, password)
      console.log('Login with', email)
      setIsLoggedIn(true)
      closeModal()
    } catch {
      setError('Invalid credentials. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      // await createUserWithEmailAndPassword(auth, email, password)
      console.log('Signup with', email)
      setIsLoggedIn(true)
      closeModal()
    } catch {
      setError('Could not create account. Try a different email.')
    } finally {
      setLoading(false)
    }
  }

  async function handleClaimSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      // Submit claim to Firestore for admin verification
      // await addDoc(collection(db, 'claims'), { artistName, xHandle, email, status: 'pending', createdAt: serverTimestamp() })
      console.log('Claim submitted', { artistName, xHandle, email })
      setStep('login') // After submitting claim, direct to login
    } catch {
      setError('Submission failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 16px',
    background: '#0D0D0D',
    border: '1px solid #2A2A2A',
    borderRadius: '10px',
    color: '#fff',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
  }

  const btnPrimary: React.CSSProperties = {
    width: '100%',
    padding: '13px',
    background: '#FFD700',
    color: '#000',
    border: 'none',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    letterSpacing: '0.02em',
  }

  const btnGhost: React.CSSProperties = {
    width: '100%',
    padding: '13px',
    background: 'transparent',
    color: '#FFD700',
    border: '1px solid #FFD700',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    letterSpacing: '0.02em',
  }

  return (
    <>
      <header
        style={{
          maxWidth: '1060px',
          width: '100%',
          padding: '12px 20px',
          boxShadow: '0 -1px 0 1px rgba(51,51,51,0.31)',
          background: 'rgba(0,0,0,0.3)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          position: 'fixed',
          zIndex: 40,
          top: '18px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderRadius: '16px',
        }}
      >
        <Link
          href="/"
          style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}
        >
          <div
            style={{
              position: 'relative',
              width: 52,
              height: 52,
              borderRadius: '50%',
              overflow: 'hidden',
              border: '1px solid #2A2A2A',
              background: '#0A0A0A',
            }}
          >
            <Image
              src={bewave}
              alt="Goaradio logo"
              fill
              priority
              quality={100}
              style={{ objectFit: 'cover', transform: 'scale(1.05)' }}
            />
          </div>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isLoggedIn ? (
            <Link
              href="/dashboard"
              style={{
                padding: '9px 20px',
                background: '#FFD700',
                color: '#000',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                textDecoration: 'none',
                letterSpacing: '0.02em',
              }}
            >
              Dashboard
            </Link>
          ) : (
            <>
              <button
                onClick={openModal}
                style={{
                  padding: '9px 20px',
                  background: 'transparent',
                  color: '#aaa',
                  border: '1px solid #2A2A2A',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  letterSpacing: '0.02em',
                }}
              >
                Sign in
              </button>
              <button
                onClick={openModal}
                style={{
                  padding: '9px 20px',
                  background: '#FFD700',
                  color: '#000',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  letterSpacing: '0.02em',
                }}
              >
                Get Started
              </button>
            </>
          )}
        </div>
      </header>

      {/* Modal Overlay */}
      {modalOpen && (
        <div
          ref={overlayRef}
          onClick={handleOverlayClick}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.75)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            style={{
              background: '#0A0A0A',
              border: '1px solid #1E1E1E',
              borderRadius: '20px',
              padding: '36px',
              width: '100%',
              maxWidth: '420px',
              position: 'relative',
            }}
          >
            {/* Close */}
            <button
              onClick={closeModal}
              aria-label="Close"
              style={{
                position: 'absolute',
                top: 16,
                right: 16,
                background: '#1A1A1A',
                border: 'none',
                borderRadius: '50%',
                width: 32,
                height: 32,
                cursor: 'pointer',
                color: '#888',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 16,
              }}
            >
              ✕
            </button>

            {/* Logo mark */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                marginBottom: 24,
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  overflow: 'hidden',
                  border: '1px solid #2A2A2A',
                  position: 'relative',
                }}
              >
                <Image
                  src={bewave}
                  alt="Goaradio"
                  fill
                  style={{ objectFit: 'cover' }}
                />
              </div>
            </div>

            {/* STEP: INTENT */}
            {step === 'intent' && (
              <>
                <h2
                  style={{
                    color: '#fff',
                    fontSize: 20,
                    fontWeight: 600,
                    textAlign: 'center',
                    margin: '0 0 8px',
                  }}
                >
                  Welcome to Goaradio for Artists
                </h2>
                <p
                  style={{
                    color: '#666',
                    fontSize: 13,
                    textAlign: 'center',
                    margin: '0 0 28px',
                    lineHeight: 1.6,
                  }}
                >
                  Are you an existing artist on Goaradio, or are you joining for the
                  first time?
                </p>
                <div
                  style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
                >
                  <button onClick={() => setStep('claim')} style={btnPrimary}>
                    Claim my Goaradio profile
                  </button>
                  <button onClick={() => setStep('signup')} style={btnGhost}>
                    I am a new artist
                  </button>
                  <div style={{ textAlign: 'center', marginTop: 4 }}>
                    <span style={{ color: '#555', fontSize: 13 }}>
                      Already have an account?{' '}
                    </span>
                    <button
                      onClick={() => setStep('login')}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#FFD700',
                        fontSize: 13,
                        cursor: 'pointer',
                        fontWeight: 500,
                      }}
                    >
                      Sign in
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* STEP: CLAIM */}
            {step === 'claim' && (
              <>
                <h2
                  style={{
                    color: '#fff',
                    fontSize: 20,
                    fontWeight: 600,
                    textAlign: 'center',
                    margin: '0 0 8px',
                  }}
                >
                  Claim your profile
                </h2>
                <p
                  style={{
                    color: '#666',
                    fontSize: 13,
                    textAlign: 'center',
                    margin: '0 0 24px',
                    lineHeight: 1.6,
                  }}
                >
                  We will verify your identity and match you to your existing Goaradio
                  profile. This typically takes 24 hours.
                </p>
                <form
                  onSubmit={handleClaimSubmit}
                  style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
                >
                  <input
                    style={inputStyle}
                    type="text"
                    placeholder="Your artist name (as it appears on Goaradio)"
                    value={artistName}
                    onChange={(e) => setArtistName(e.target.value)}
                    required
                  />
                  <input
                    style={inputStyle}
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <input
                    style={inputStyle}
                    type="text"
                    placeholder="X (Twitter) handle  e.g. @yourname"
                    value={xHandle}
                    onChange={(e) => setXHandle(e.target.value)}
                  />
                  <p
                    style={{
                      color: '#555',
                      fontSize: 12,
                      margin: 0,
                      lineHeight: 1.6,
                    }}
                  >
                    Your claim will be reviewed by the Goaradio team. You may be asked
                    for additional verification.
                  </p>
                  {error && (
                    <p style={{ color: '#E24B4A', fontSize: 13, margin: 0 }}>
                      {error}
                    </p>
                  )}
                  <button type="submit" style={btnPrimary} disabled={loading}>
                    {loading ? 'Submitting...' : 'Submit claim'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep('intent')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#555',
                      fontSize: 13,
                      cursor: 'pointer',
                      marginTop: 4,
                    }}
                  >
                    Back
                  </button>
                </form>
              </>
            )}

            {/* STEP: SIGNUP */}
            {step === 'signup' && (
              <>
                <h2
                  style={{
                    color: '#fff',
                    fontSize: 20,
                    fontWeight: 600,
                    textAlign: 'center',
                    margin: '0 0 8px',
                  }}
                >
                  Create your artist account
                </h2>
                <p
                  style={{
                    color: '#666',
                    fontSize: 13,
                    textAlign: 'center',
                    margin: '0 0 24px',
                    lineHeight: 1.6,
                  }}
                >
                  Start earning from your music on Goaradio.
                </p>
                <form
                  onSubmit={handleSignup}
                  style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
                >
                  <input
                    style={inputStyle}
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <input
                    style={inputStyle}
                    type="password"
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                  {error && (
                    <p style={{ color: '#E24B4A', fontSize: 13, margin: 0 }}>
                      {error}
                    </p>
                  )}
                  <button type="submit" style={btnPrimary} disabled={loading}>
                    {loading ? 'Creating account...' : 'Create account'}
                  </button>
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ color: '#555', fontSize: 13 }}>
                      Already have an account?{' '}
                    </span>
                    <button
                      type="button"
                      onClick={() => setStep('login')}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#FFD700',
                        fontSize: 13,
                        cursor: 'pointer',
                        fontWeight: 500,
                      }}
                    >
                      Sign in
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep('intent')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#555',
                      fontSize: 13,
                      cursor: 'pointer',
                    }}
                  >
                    Back
                  </button>
                </form>
              </>
            )}

            {/* STEP: LOGIN */}
            {step === 'login' && (
              <>
                <h2
                  style={{
                    color: '#fff',
                    fontSize: 20,
                    fontWeight: 600,
                    textAlign: 'center',
                    margin: '0 0 8px',
                  }}
                >
                  Sign in
                </h2>
                <p
                  style={{
                    color: '#666',
                    fontSize: 13,
                    textAlign: 'center',
                    margin: '0 0 24px',
                    lineHeight: 1.6,
                  }}
                >
                  Access your Goaradio for Artists dashboard.
                </p>
                <form
                  onSubmit={handleLogin}
                  style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
                >
                  <input
                    style={inputStyle}
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <input
                    style={inputStyle}
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  {error && (
                    <p style={{ color: '#E24B4A', fontSize: 13, margin: 0 }}>
                      {error}
                    </p>
                  )}
                  <button type="submit" style={btnPrimary} disabled={loading}>
                    {loading ? 'Signing in...' : 'Sign in'}
                  </button>
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ color: '#555', fontSize: 13 }}>
                      No account?{' '}
                    </span>
                    <button
                      type="button"
                      onClick={() => setStep('signup')}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#FFD700',
                        fontSize: 13,
                        cursor: 'pointer',
                        fontWeight: 500,
                      }}
                    >
                      Create one
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep('intent')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#555',
                      fontSize: 13,
                      cursor: 'pointer',
                    }}
                  >
                    Back
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
