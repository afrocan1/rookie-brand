'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useRef } from 'react'
import bewave from '../../public/goaradio logo round (1).png'

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

  function handleOverlayClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === overlayRef.current) {
      closeModal()
    }
  }

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      console.log('Login with', email)
      setIsLoggedIn(true)
      closeModal()
    } catch {
      setError('Invalid credentials. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSignup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      console.log('Signup with', email)
      setIsLoggedIn(true)
      closeModal()
    } catch {
      setError('Could not create account. Try a different email.')
    } finally {
      setLoading(false)
    }
  }

  async function handleClaimSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      console.log('Claim submitted', { artistName, xHandle, email })
      setStep('login')
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

            {/* keep all your modal step JSX exactly here unchanged */}
          </div>
        </div>
      )}
    </>
  )
}
