'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect, useRef } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth'
import { doc, setDoc, collection, getDocs } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import bewave from '../../public/goaradio logo round (1).png'
import {
  Mic2,
  Sparkles,
  LogIn,
  UserPlus,
  Instagram,
  Twitter,
  Mail,
  ArrowLeft,
  Check,
  Search,
  LayoutDashboard,
  LogOut,
  TrendingUp,
  PartyPopper,
  Clock,
  X,
  User,
  Lock,
  Phone,
  Globe,
  FileText,
  Eye,
  EyeOff,
  ChevronRight,
} from 'lucide-react'

// ─── Airtable config ──────────────────────────────────────────────────────────
const AT_TOKEN = 'patnr2Fyn9ZVlRavH.e54394ac6075004f3bf0d7f84a5b1a1f8bc0fbb3b2e664e487fd9d05b3bfd8e5'
const BASE_ID  = 'appg5mgqnhZPJKDXR'

type Step = 'intent' | 'login' | 'signup' | 'claim-pick' | 'claim-details' | 'claim-verify' | 'claim-done'

interface AirtableArtist {
  id: string
  name: string
  cover: string
  tracks: number
}

function friendlyError(code: string) {
  const map: Record<string, string> = {
    'auth/user-not-found':       'No account found with that email.',
    'auth/wrong-password':       'Incorrect password.',
    'auth/invalid-email':        'Invalid email address.',
    'auth/email-already-in-use': 'An account with that email already exists.',
    'auth/weak-password':        'Password must be at least 6 characters.',
    'auth/popup-closed-by-user': 'Sign-in cancelled.',
    'auth/invalid-credential':   'Incorrect email or password.',
  }
  return map[code] ?? 'Something went wrong. Please try again.'
}

// ─── Theme ────────────────────────────────────────────────────────────────────
const T = {
  bg:      '#0a0a0a',
  bg2:     '#111111',
  bg3:     '#181818',
  card:    '#141414',
  border:  'rgba(255,255,255,0.07)',
  border2: 'rgba(255,255,255,0.12)',
  accent:  '#ffd700',
  accent2: '#ffb800',
  text:    '#f5f5f0',
  muted:   '#888880',
  muted2:  '#444440',
  success: '#22c55e',
}

const COUNTRIES = [
  'Ghana','Nigeria','Kenya','South Africa','Uganda','Tanzania','Ethiopia','Cameroon',
  'Senegal','Côte d\'Ivoire','Rwanda','Zambia','Zimbabwe','Mozambique','Angola',
  'United Kingdom','United States','Canada','France','Germany','Netherlands',
  'Australia','Brazil','Other',
]

const GENRES = [
  'Afrobeats','Afropop','Highlife','Dancehall','Hip Hop','Amapiano',
  'Gospel','R&B','Reggae','Drill','Trap','Afro-Soul','Bongo Flava','Other',
]

export function Navbar() {
  const [modalOpen, setModalOpen]             = useState(false)
  const [step, setStep]                       = useState<Step>('intent')
  const [email, setEmail]                     = useState('')
  const [password, setPassword]               = useState('')
  const [showPass, setShowPass]               = useState(false)
  const [showConfirm, setShowConfirm]         = useState(false)
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError]                     = useState('')
  const [loading, setLoading]                 = useState(false)
  const [isLoggedIn, setIsLoggedIn]           = useState(false)
  const [allArtists, setAllArtists]           = useState<AirtableArtist[]>([])
  const [filteredArtists, setFilteredArtists] = useState<AirtableArtist[]>([])
  const [artistsLoading, setArtistsLoading]   = useState(false)
  const [searchQuery, setSearchQuery]         = useState('')
  const [selectedArtist, setSelectedArtist]   = useState<AirtableArtist | null>(null)
  const [isSmall, setIsSmall]                 = useState(false)

  // ── Set of Airtable IDs that are already pending/claimed ──────────────────
  const [claimedAirtableIds, setClaimedAirtableIds] = useState<Set<string>>(new Set())

  // ── Claim details state ────────────────────────────────────────────────
  const [claimFullName, setClaimFullName]     = useState('')
  const [claimStageName, setClaimStageName]   = useState('')
  const [claimEmail, setClaimEmail]           = useState('')
  const [claimPhone, setClaimPhone]           = useState('')
  const [claimCountry, setClaimCountry]       = useState('')
  const [claimGenre, setClaimGenre]           = useState('')
  const [claimBio, setClaimBio]               = useState('')
  const [claimPassword, setClaimPassword]     = useState('')
  const [claimConfirm, setClaimConfirm]       = useState('')
  const [showClaimPass, setShowClaimPass]     = useState(false)
  const [showClaimConfirm, setShowClaimConfirm] = useState(false)

  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => setIsLoggedIn(!!user))
    return unsub
  }, [])

  useEffect(() => {
    function check() { setIsSmall(window.innerWidth < 500) }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // ── Load all pending/claimed Airtable IDs from Firestore ─────────────────
  // This runs once when the claim-pick step is reached.
  // It reads every doc in the `artists` collection and collects airtableIds
  // where verified === false AND airtableId is non-empty (i.e. pending claims).
  // Artists whose claim was rejected will have their doc deleted by an admin,
  // so they'll naturally reappear here.
  useEffect(() => {
    if (step !== 'claim-pick') return

    async function loadClaimedIds() {
      try {
        const snapshot = await getDocs(collection(db, 'artists'))
        const ids = new Set<string>()
        snapshot.forEach((docSnap) => {
          const data = docSnap.data()
          // A profile is "locked" if it has an airtableId and is pending or verified
          if (data.airtableId && data.airtableId !== '') {
            ids.add(data.airtableId as string)
          }
        })
        setClaimedAirtableIds(ids)
      } catch {
        // Non-fatal — if this fails we just show all artists
        console.warn('Could not load claimed artist IDs from Firestore.')
      }
    }

    loadClaimedIds()
  }, [step])

  // ── Fetch Airtable artists once, then filter out already-claimed ones ─────
  useEffect(() => {
    if (step !== 'claim-pick' || allArtists.length > 0) return
    setArtistsLoading(true)
    fetch(`https://api.airtable.com/v0/${BASE_ID}/Artists`, {
      headers: { Authorization: `Bearer ${AT_TOKEN}` },
    })
      .then((r) => r.json())
      .then((data) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const list: AirtableArtist[] = (data.records ?? []).map((r: any) => ({
          id:     r.id,
          name:   r.fields.Artist || r.fields.Name || 'Unknown',
          cover:  r.fields.Cover_url || '',
          tracks: r.fields.Track_count ?? 0,
        }))
        setAllArtists(list)
        setFilteredArtists(list)
      })
      .catch(() => setError('Could not load artists. Check your Airtable config.'))
      .finally(() => setArtistsLoading(false))
  }, [step, allArtists.length])

  // ── Filter by search query AND exclude already-claimed profiles ───────────
  useEffect(() => {
    const q = searchQuery.toLowerCase()
    const available = allArtists.filter((a) => !claimedAirtableIds.has(a.id))
    setFilteredArtists(
      q ? available.filter((a) => a.name.toLowerCase().includes(q)) : available,
    )
  }, [searchQuery, allArtists, claimedAirtableIds])

  // Pre-fill stage name from selected artist
  useEffect(() => {
    if (selectedArtist && !claimStageName) {
      setClaimStageName(selectedArtist.name)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedArtist])

  function openModal() {
    setStep('intent')
    resetForm()
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setSelectedArtist(null)
    setSearchQuery('')
  }

  function resetForm() {
    setEmail(''); setPassword(''); setConfirmPassword(''); setError('')
    setSelectedArtist(null); setSearchQuery('')
    setClaimFullName(''); setClaimStageName(''); setClaimEmail('')
    setClaimPhone(''); setClaimCountry(''); setClaimGenre('')
    setClaimBio(''); setClaimPassword(''); setClaimConfirm('')
  }

  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === overlayRef.current) closeModal()
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      await signInWithEmailAndPassword(auth, email, password)
      setIsLoggedIn(true)
      closeModal()
    } catch (err: unknown) {
      setError(friendlyError((err as { code: string }).code))
    } finally { setLoading(false) }
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirmPassword) { setError('Passwords do not match.'); return }
    setError(''); setLoading(true)
    try {
      await createUserWithEmailAndPassword(auth, email, password)
      setIsLoggedIn(true)
      closeModal()
    } catch (err: unknown) {
      setError(friendlyError((err as { code: string }).code))
    } finally { setLoading(false) }
  }

  async function handleGoogleLogin() {
    setError('')
    try {
      const provider = new GoogleAuthProvider()
      await signInWithPopup(auth, provider)
      setIsLoggedIn(true)
      closeModal()
    } catch (err: unknown) {
      setError(friendlyError((err as { code: string }).code))
    }
  }

  // ── Claim: pick → details ─────────────────────────────────────────────
  function handleClaimContinueFromPick() {
    if (!selectedArtist) return
    setClaimStageName(selectedArtist.name)
    setError('')
    setStep('claim-details')
  }

  // ── Claim: details → verify (creates account + locks profile) ────────────
  async function handleClaimDetailsSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!claimFullName.trim()) { setError('Full name is required.'); return }
    if (!claimEmail.trim())    { setError('Email is required.'); return }
    if (claimPassword.length < 6) { setError('Password must be at least 6 characters.'); return }
    if (claimPassword !== claimConfirm) { setError('Passwords do not match.'); return }

    setError(''); setLoading(true)
    try {
      const cred = await createUserWithEmailAndPassword(auth, claimEmail.trim(), claimPassword)
      // Set display name
      await updateProfile(cred.user, { displayName: claimStageName || claimFullName })

      // Write initial Firestore doc — including airtableId locks this profile
      // for all other users browsing the claim-pick list.
      await setDoc(doc(db, 'artists', cred.user.uid), {
        artistName:  claimStageName || claimFullName,
        fullName:    claimFullName,
        email:       claimEmail.trim(),
        phone:       claimPhone,
        country:     claimCountry,
        genre:       claimGenre,
        bio:         claimBio,
        airtableId:  selectedArtist?.id || '',
        verified:    false,
        claimedAt:   new Date().toISOString(),
      })

      // Immediately reflect the lock in local state so the UI is consistent
      // if the user navigates back for any reason.
      if (selectedArtist?.id) {
        setClaimedAirtableIds((prev) => new Set([...prev, selectedArtist.id]))
      }

      setIsLoggedIn(true)
      setStep('claim-verify')
    } catch (err: unknown) {
      setError(friendlyError((err as { code: string }).code))
    } finally { setLoading(false) }
  }

  async function handleClaimSent() {
    const user = auth.currentUser
    if (user && selectedArtist) {
      await setDoc(
        doc(db, 'artists', user.uid),
        { verificationRequested: true, updatedAt: new Date().toISOString() },
        { merge: true },
      )
    }
    setStep('claim-done')
  }

  async function handleSkipClaim() {
    const user = auth.currentUser
    if (user) {
      await setDoc(
        doc(db, 'artists', user.uid),
        {
          artistName: user.displayName ?? 'New Artist',
          email:      user.email,
          verified:   false,
          createdAt:  new Date().toISOString(),
          // No airtableId here — so this doc won't lock any profile
        },
        { merge: true },
      )
    }
    closeModal()
    window.location.href = '/dashboard'
  }

  async function handleLogout() {
    await signOut(auth)
    setIsLoggedIn(false)
  }

  // ─── Shared styles ────────────────────────────────────────────────────────
  const inputStyle: React.CSSProperties = {
    width:        '100%',
    padding:      '11px 13px',
    background:   T.bg2,
    border:       `1px solid ${T.border2}`,
    borderRadius: 10,
    color:        T.text,
    fontFamily:   "'DM Sans', sans-serif",
    fontSize:     14,
    outline:      'none',
    boxSizing:    'border-box',
    transition:   'border-color 0.2s',
  }

  const btnPrimary: React.CSSProperties = {
    width:          '100%',
    padding:        '12px',
    background:     T.accent,
    color:          '#0a0a0a',
    border:         'none',
    borderRadius:   10,
    fontSize:       14,
    fontWeight:     700,
    cursor:         'pointer',
    fontFamily:     "'Syne', sans-serif",
    letterSpacing:  '0.02em',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            8,
    transition:     'opacity 0.2s',
  }

  const btnSecondary: React.CSSProperties = {
    width:          '100%',
    padding:        '11px',
    background:     'transparent',
    color:          T.text,
    border:         `1px solid ${T.border2}`,
    borderRadius:   10,
    fontSize:       14,
    fontWeight:     500,
    cursor:         'pointer',
    fontFamily:     "'DM Sans', sans-serif",
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            8,
    transition:     'background 0.2s',
  }

  // ─── Step dots (now 4 steps for claim flow) ───────────────────────────────
  function StepDots({ current }: { current: number }) {
    const total = 4
    return (
      <div style={{ display: 'flex', gap: 7, marginBottom: 24, alignItems: 'center' }}>
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            style={{
              height:       7,
              width:        i === current ? 22 : 7,
              borderRadius: i === current ? 4 : '50%',
              background:   i < current ? T.success : i === current ? T.accent : T.muted2,
              transition:   'all 0.3s',
            }}
          />
        ))}
      </div>
    )
  }

  // ─── Google SVG ───────────────────────────────────────────────────────────
  const GoogleIcon = () => (
    <svg width={16} height={16} viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )

  // ─── Claim Pick ───────────────────────────────────────────────────────────
  function renderClaimPick() {
    return (
      <>
        <StepDots current={0} />
        <h2 style={{ color: T.text, fontSize: 20, fontWeight: 700, margin: '0 0 6px', fontFamily: "'Syne', sans-serif" }}>
          Claim your artist profile
        </h2>
        <p style={{ color: T.muted, fontSize: 13, margin: '0 0 16px', lineHeight: 1.6 }}>
          We found these artists on Goaradio. Select yours to claim it.
        </p>

        <div style={{ position: 'relative', marginBottom: 12 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: T.muted2 }} />
          <input
            style={{ ...inputStyle, paddingLeft: 36 }}
            type="text"
            placeholder="Search artists..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />
        </div>

        <div style={{ maxHeight: 280, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16, paddingRight: 2 }}>
          {artistsLoading ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: T.muted, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <span style={{
                width: 18, height: 18, borderRadius: '50%',
                border: `2px solid ${T.border2}`,
                borderTopColor: T.accent,
                display: 'inline-block',
                animation: 'spin 0.7s linear infinite',
              }} />
              Loading artists...
            </div>
          ) : filteredArtists.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: T.muted, fontSize: 13 }}>
              {allArtists.length > 0 && searchQuery === ''
                ? 'All artist profiles have been claimed.'
                : 'No artists found'}
            </div>
          ) : (
            filteredArtists.map((artist) => {
              const isSelected = selectedArtist?.id === artist.id
              const avatarUrl  = artist.cover ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(artist.name)}&background=1a1a1a&color=ffd700&size=100`
              return (
                <div
                  key={artist.id}
                  onClick={() => setSelectedArtist(isSelected ? null : artist)}
                  style={{
                    display:      'flex',
                    alignItems:   'center',
                    gap:          14,
                    padding:      '12px 14px',
                    background:   isSelected ? 'rgba(255,215,0,0.08)' : T.bg2,
                    border:       `1px solid ${isSelected ? T.accent : T.border}`,
                    borderRadius: 12,
                    cursor:       'pointer',
                    transition:   'all 0.2s',
                  }}
                >
                  <img
                    src={avatarUrl}
                    alt={artist.name}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(artist.name)}&background=1a1a1a&color=ffd700&size=100`
                    }}
                    style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', background: T.bg3, flexShrink: 0 }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: T.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {artist.name}
                    </div>
                    <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>
                      {artist.tracks} tracks on Goaradio
                    </div>
                  </div>
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%',
                    border: `2px solid ${isSelected ? T.accent : T.border2}`,
                    background: isSelected ? T.accent : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, transition: 'all 0.2s',
                  }}>
                    {isSelected && <Check size={11} color="#0a0a0a" strokeWidth={3} />}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {error && <p style={{ color: '#ff6b6b', fontSize: 13, margin: '0 0 12px' }}>{error}</p>}

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={handleSkipClaim} style={{ ...btnSecondary, flex: 1, fontSize: 13 }}>
            Not on Goaradio yet
          </button>
          <button
            onClick={handleClaimContinueFromPick}
            disabled={!selectedArtist}
            style={{ ...btnPrimary, flex: 1, opacity: selectedArtist ? 1 : 0.4, cursor: selectedArtist ? 'pointer' : 'not-allowed' }}
          >
            Continue <ChevronRight size={14} />
          </button>
        </div>
      </>
    )
  }

  // ─── Claim Details ────────────────────────────────────────────────────────
  function renderClaimDetails() {
    const labelStyle: React.CSSProperties = {
      fontSize: 12, color: T.muted, display: 'block', marginBottom: 5, fontWeight: 500,
    }
    const fieldWrap: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 0 }
    const passWrap: React.CSSProperties = { position: 'relative' }
    const eyeBtn: React.CSSProperties = {
      position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
      background: 'none', border: 'none', color: T.muted, cursor: 'pointer',
      display: 'flex', alignItems: 'center', padding: 0,
    }

    // Selected artist mini badge
    const avatarUrl = selectedArtist?.cover ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedArtist?.name ?? '')}&background=1a1a1a&color=ffd700&size=100`

    return (
      <>
        <StepDots current={1} />
        <h2 style={{ color: T.text, fontSize: 20, fontWeight: 700, margin: '0 0 4px', fontFamily: "'Syne', sans-serif" }}>
          Complete your profile
        </h2>
        <p style={{ color: T.muted, fontSize: 13, margin: '0 0 16px', lineHeight: 1.6 }}>
          Tell us about yourself and create your account password.
        </p>

        {/* Selected artist badge */}
        {selectedArtist && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 12px', background: 'rgba(255,215,0,0.06)',
            border: `1px solid rgba(255,215,0,0.18)`, borderRadius: 10, marginBottom: 18,
          }}>
            <img src={avatarUrl} alt={selectedArtist.name}
              onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedArtist.name)}&background=1a1a1a&color=ffd700&size=100` }}
              style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', background: T.bg3 }}
            />
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{selectedArtist.name}</div>
              <div style={{ fontSize: 11, color: T.accent }}>Selected for claiming</div>
            </div>
            <button onClick={() => setStep('claim-pick')} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: T.muted, cursor: 'pointer', display: 'flex', padding: 0 }}>
              <X size={14} />
            </button>
          </div>
        )}

        <form onSubmit={handleClaimDetailsSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
          {/* Row: Full name + Stage name */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div style={fieldWrap}>
              <label style={labelStyle}><User size={11} style={{ display: 'inline', marginRight: 4 }} />Full Name *</label>
              <input className="goa-input" style={inputStyle} type="text" placeholder="Your real name" value={claimFullName} onChange={e => setClaimFullName(e.target.value)} required />
            </div>
            <div style={fieldWrap}>
              <label style={labelStyle}><Mic2 size={11} style={{ display: 'inline', marginRight: 4 }} />Stage Name *</label>
              <input className="goa-input" style={inputStyle} type="text" placeholder="Artist name" value={claimStageName} onChange={e => setClaimStageName(e.target.value)} required />
            </div>
          </div>

          {/* Email */}
          <div style={fieldWrap}>
            <label style={labelStyle}><Mail size={11} style={{ display: 'inline', marginRight: 4 }} />Email Address *</label>
            <input className="goa-input" style={inputStyle} type="email" placeholder="you@example.com" value={claimEmail} onChange={e => setClaimEmail(e.target.value)} required />
          </div>

          {/* Row: Phone + Country */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div style={fieldWrap}>
              <label style={labelStyle}><Phone size={11} style={{ display: 'inline', marginRight: 4 }} />Phone</label>
              <input className="goa-input" style={inputStyle} type="tel" placeholder="+233..." value={claimPhone} onChange={e => setClaimPhone(e.target.value)} />
            </div>
            <div style={fieldWrap}>
              <label style={labelStyle}><Globe size={11} style={{ display: 'inline', marginRight: 4 }} />Country</label>
              <select className="goa-input" style={{ ...inputStyle, appearance: 'none' as const }} value={claimCountry} onChange={e => setClaimCountry(e.target.value)}>
                <option value="">Select country</option>
                {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Genre */}
          <div style={fieldWrap}>
            <label style={labelStyle}><Mic2 size={11} style={{ display: 'inline', marginRight: 4 }} />Primary Genre</label>
            <select className="goa-input" style={{ ...inputStyle, appearance: 'none' as const }} value={claimGenre} onChange={e => setClaimGenre(e.target.value)}>
              <option value="">Select genre</option>
              {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>

          {/* Bio */}
          <div style={fieldWrap}>
            <label style={labelStyle}><FileText size={11} style={{ display: 'inline', marginRight: 4 }} />Short Bio</label>
            <textarea
              className="goa-input"
              style={{ ...inputStyle, resize: 'vertical', minHeight: 72 }}
              placeholder="Tell fans about yourself..."
              value={claimBio}
              onChange={e => setClaimBio(e.target.value)}
              rows={3}
            />
          </div>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ flex: 1, height: 1, background: T.border }} />
            <span style={{ fontSize: 11, color: T.muted2, display: 'flex', alignItems: 'center', gap: 5 }}>
              <Lock size={11} /> Create your password
            </span>
            <div style={{ flex: 1, height: 1, background: T.border }} />
          </div>

          {/* Password */}
          <div style={fieldWrap}>
            <label style={labelStyle}>Password * (min 6 characters)</label>
            <div style={passWrap}>
              <input
                className="goa-input"
                style={{ ...inputStyle, paddingRight: 42 }}
                type={showClaimPass ? 'text' : 'password'}
                placeholder="Create a strong password"
                value={claimPassword}
                onChange={e => setClaimPassword(e.target.value)}
                required
                minLength={6}
              />
              <button type="button" style={eyeBtn} onClick={() => setShowClaimPass(p => !p)}>
                {showClaimPass ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            {/* Strength bar */}
            {claimPassword.length > 0 && (
              <div style={{ marginTop: 6 }}>
                <div style={{ height: 3, borderRadius: 2, background: T.border2, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: claimPassword.length < 6 ? '25%' : claimPassword.length < 10 ? '60%' : '100%',
                    background: claimPassword.length < 6 ? '#ef4444' : claimPassword.length < 10 ? '#f59e0b' : T.success,
                    borderRadius: 2, transition: 'all 0.3s',
                  }} />
                </div>
                <span style={{ fontSize: 11, color: claimPassword.length < 6 ? '#ef4444' : claimPassword.length < 10 ? '#f59e0b' : T.success, marginTop: 3, display: 'block' }}>
                  {claimPassword.length < 6 ? 'Too short' : claimPassword.length < 10 ? 'Good' : 'Strong'}
                </span>
              </div>
            )}
          </div>

          {/* Confirm password */}
          <div style={fieldWrap}>
            <label style={labelStyle}>Confirm Password *</label>
            <div style={passWrap}>
              <input
                className="goa-input"
                style={{
                  ...inputStyle, paddingRight: 42,
                  borderColor: claimConfirm && claimConfirm !== claimPassword ? '#ef4444' : claimConfirm && claimConfirm === claimPassword ? T.success : undefined,
                }}
                type={showClaimConfirm ? 'text' : 'password'}
                placeholder="Repeat your password"
                value={claimConfirm}
                onChange={e => setClaimConfirm(e.target.value)}
                required
              />
              <button type="button" style={eyeBtn} onClick={() => setShowClaimConfirm(p => !p)}>
                {showClaimConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            {claimConfirm && claimConfirm !== claimPassword && (
              <span style={{ fontSize: 11, color: '#ef4444', marginTop: 3, display: 'block' }}>Passwords don&apos;t match</span>
            )}
            {claimConfirm && claimConfirm === claimPassword && (
              <span style={{ fontSize: 11, color: T.success, marginTop: 3, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Check size={11} /> Passwords match
              </span>
            )}
          </div>

          {error && <p style={{ color: '#ff6b6b', fontSize: 13, margin: 0 }}>{error}</p>}

          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button
              type="button"
              onClick={() => { setStep('claim-pick'); setError('') }}
              style={{ ...btnSecondary, flex: '0 0 44px', width: 44, padding: 0 }}
            >
              <ArrowLeft size={16} />
            </button>
            <button type="submit" style={{ ...btnPrimary, flex: 1, opacity: loading ? 0.7 : 1 }} disabled={loading}>
              {loading ? (
                <span style={{
                  width: 16, height: 16, borderRadius: '50%',
                  border: `2px solid rgba(0,0,0,0.2)`, borderTopColor: '#000',
                  display: 'inline-block', animation: 'spin 0.7s linear infinite',
                }} />
              ) : <ChevronRight size={15} />}
              {loading ? 'Creating account…' : 'Continue'}
            </button>
          </div>
        </form>
      </>
    )
  }

  // ─── Claim Verify ─────────────────────────────────────────────────────────
  function renderClaimVerify() {
    return (
      <>
        <StepDots current={2} />
        <h2 style={{ color: T.text, fontSize: 20, fontWeight: 700, margin: '0 0 6px', fontFamily: "'Syne', sans-serif" }}>
          Verify your identity
        </h2>
        <p style={{ color: T.muted, fontSize: 13, margin: '0 0 20px', lineHeight: 1.6 }}>
          To verify you own <strong style={{ color: T.text }}>{selectedArtist?.name || claimStageName}</strong>&apos;s profile, send us a DM from a verified social or email us.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
          {[
            { href: 'https://instagram.com/goaradio_', icon: <Instagram size={15} />, label: 'DM @goaradio_ on Instagram' },
            { href: 'https://x.com/goaradio_',         icon: <Twitter size={15} />,   label: 'DM @goaradio_ on X' },
            { href: 'mailto:info@goaradio.org',        icon: <Mail size={15} />,      label: 'Email info@goaradio.org' },
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              style={{ ...btnSecondary, textDecoration: 'none', color: T.text, fontSize: 13 }}
            >
              {item.icon} {item.label}
            </a>
          ))}
        </div>

        <div style={{
          background:   'rgba(255,215,0,0.06)',
          border:       `1px solid rgba(255,215,0,0.18)`,
          borderRadius: 10,
          padding:      '12px 14px',
          fontSize:     13,
          color:        T.accent,
          marginBottom: 20,
          lineHeight:   1.6,
          display:      'flex',
          gap:          10,
          alignItems:   'flex-start',
        }}>
          <Clock size={14} style={{ flexShrink: 0, marginTop: 2 }} />
          Include your Goaradio artist name and the email you signed up with. We verify within 24–48 hours.
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => setStep('claim-details')} style={{ ...btnSecondary, flex: '0 0 44px', width: 44, padding: 0 }}>
            <ArrowLeft size={16} />
          </button>
          <button onClick={handleClaimSent} style={{ ...btnPrimary, flex: 1 }}>
            <Check size={15} /> I&apos;ve sent the message
          </button>
        </div>
      </>
    )
  }

  // ─── Claim Done ───────────────────────────────────────────────────────────
  function renderClaimDone() {
    return (
      <div style={{ textAlign: 'center', padding: '12px 0' }}>
        <StepDots current={3} />
        <div style={{
          width:          72,
          height:         72,
          background:     'rgba(255,215,0,0.08)',
          border:         `1px solid rgba(255,215,0,0.2)`,
          borderRadius:   '50%',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          margin:         '0 auto 16px',
        }}>
          <PartyPopper size={28} color={T.accent} />
        </div>
        <h2 style={{ color: T.text, fontSize: 20, fontWeight: 700, margin: '0 0 8px', fontFamily: "'Syne', sans-serif" }}>
          You&apos;re all set!
        </h2>
        <p style={{ color: T.muted, fontSize: 13, margin: '0 0 24px', lineHeight: 1.6 }}>
          Your profile is in pending verification mode. You can edit everything — changes go live on Goaradio once you&apos;re verified.
        </p>
        <a href="/dashboard" style={{ ...btnPrimary, textDecoration: 'none', display: 'flex' }}>
          <TrendingUp size={15} /> Go to Dashboard
        </a>
      </div>
    )
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        .goa-input:focus { border-color: #ffd700 !important; }
        .goa-btn-secondary:hover { background: #181818 !important; }
        option { background: #111 !important; }
        select { color-scheme: dark; }
      `}</style>

      {/* ── Navbar ── */}
      <header style={{
        maxWidth:             1060,
        width:                '100%',
        padding:              '12px 20px',
        boxShadow:            '0 -1px 0 1px rgba(51,51,51,0.31)',
        background:           'rgba(0,0,0,0.3)',
        backdropFilter:       'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        position:             'fixed',
        zIndex:               40,
        top:                  18,
        left:                 '50%',
        transform:            'translateX(-50%)',
        display:              'flex',
        alignItems:           'center',
        justifyContent:       'space-between',
        borderRadius:         16,
      }}>
        {/* Logo */}
        <Link href="/" style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
          <div style={{
            position:     'relative',
            width:        52,
            height:       52,
            borderRadius: '50%',
            overflow:     'hidden',
            border:       '1px solid #2A2A2A',
            background:   '#0A0A0A',
          }}>
            <Image src={bewave} alt="Goaradio logo" fill priority quality={100} style={{ objectFit: 'cover', transform: 'scale(1.05)' }} />
          </div>
        </Link>

        {/* Nav buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {isLoggedIn ? (
            <>
              <Link
                href="/dashboard"
                title="Dashboard"
                style={{
                  padding:        isSmall ? '9px 10px' : '9px 18px',
                  background:     T.accent,
                  color:          '#0a0a0a',
                  borderRadius:   8,
                  fontSize:       13,
                  fontWeight:     700,
                  textDecoration: 'none',
                  display:        'flex',
                  alignItems:     'center',
                  gap:            isSmall ? 0 : 6,
                  whiteSpace:     'nowrap',
                }}
              >
                <LayoutDashboard size={15} />
                {!isSmall && 'Dashboard'}
              </Link>
              <button
                onClick={handleLogout}
                title="Sign out"
                style={{
                  padding:      isSmall ? '9px 10px' : '9px 14px',
                  background:   'transparent',
                  color:        '#aaa',
                  border:       '1px solid #2A2A2A',
                  borderRadius: 8,
                  fontSize:     13,
                  cursor:       'pointer',
                  display:      'flex',
                  alignItems:   'center',
                  gap:          isSmall ? 0 : 6,
                  whiteSpace:   'nowrap',
                }}
              >
                <LogOut size={15} />
                {!isSmall && 'Sign out'}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={openModal}
                title="Sign in"
                style={{
                  padding:      isSmall ? '9px 10px' : '9px 20px',
                  background:   'transparent',
                  color:        '#aaa',
                  border:       '1px solid #2A2A2A',
                  borderRadius: 8,
                  fontSize:     13,
                  fontWeight:   500,
                  cursor:       'pointer',
                  display:      'flex',
                  alignItems:   'center',
                  gap:          isSmall ? 0 : 6,
                  whiteSpace:   'nowrap',
                }}
              >
                <LogIn size={15} />
                {!isSmall && 'Sign in'}
              </button>
              <button
                onClick={openModal}
                title="Get Started"
                style={{
                  padding:      isSmall ? '9px 10px' : '9px 20px',
                  background:   T.accent,
                  color:        '#0a0a0a',
                  border:       'none',
                  borderRadius: 8,
                  fontSize:     13,
                  fontWeight:   700,
                  cursor:       'pointer',
                  display:      'flex',
                  alignItems:   'center',
                  gap:          isSmall ? 0 : 6,
                  whiteSpace:   'nowrap',
                }}
              >
                <UserPlus size={15} />
                {!isSmall && 'Get Started'}
              </button>
            </>
          )}
        </div>
      </header>

      {/* ── Modal ── */}
      {modalOpen && (
        <div
          ref={overlayRef}
          onClick={handleOverlayClick}
          style={{
            position:       'fixed',
            inset:          0,
            zIndex:         100,
            background:     'rgba(0,0,0,0.8)',
            backdropFilter: 'blur(6px)',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            padding:        20,
            fontFamily:     "'DM Sans', sans-serif",
          }}
        >
          <div style={{
            background:   T.card,
            border:       `1px solid rgba(255,215,0,0.15)`,
            borderRadius: 24,
            padding:      step === 'claim-details' ? '32px 28px' : 36,
            width:        '100%',
            maxWidth:     step === 'claim-pick' ? 480 : step === 'claim-details' ? 520 : 440,
            maxHeight:    '92vh',
            overflowY:    'auto',
            position:     'relative',
            transition:   'max-width 0.3s',
            boxShadow:    '0 0 60px rgba(255,215,0,0.05)',
          }}>
            {/* Close */}
            <button
              onClick={closeModal}
              style={{
                position:       'absolute',
                top:            16,
                right:          16,
                background:     T.bg3,
                border:         `1px solid ${T.border}`,
                borderRadius:   8,
                width:          32,
                height:         32,
                cursor:         'pointer',
                color:          T.muted,
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
              }}
            >
              <X size={14} />
            </button>

            {/* Logo (non-claim steps) */}
            {step !== 'claim-pick' && step !== 'claim-details' && step !== 'claim-verify' && step !== 'claim-done' && (
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', overflow: 'hidden', border: `1px solid rgba(255,215,0,0.2)`, position: 'relative' }}>
                  <Image src={bewave} alt="Goaradio" fill style={{ objectFit: 'cover' }} />
                </div>
              </div>
            )}

            {/* ── INTENT ── */}
            {step === 'intent' && (
              <>
                <h2 style={{ color: T.text, fontSize: 20, fontWeight: 700, textAlign: 'center', margin: '0 0 6px', fontFamily: "'Syne', sans-serif" }}>
                  Welcome to Goaradio for Artists
                </h2>
                <p style={{ color: T.muted, fontSize: 13, textAlign: 'center', margin: '0 0 28px', lineHeight: 1.6 }}>
                  Are you an existing artist on Goaradio, or joining for the first time?
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <button onClick={() => { setStep('claim-pick'); setError('') }} style={btnPrimary}>
                    <Mic2 size={16} /> Claim my Goaradio profile
                  </button>
                  <button onClick={() => setStep('signup')} style={btnSecondary}>
                    <Sparkles size={16} /> I&apos;m a new artist
                  </button>
                  <div style={{ textAlign: 'center', marginTop: 6 }}>
                    <span style={{ color: T.muted2, fontSize: 13 }}>Already have an account?{' '}</span>
                    <button
                      onClick={() => setStep('login')}
                      style={{ background: 'none', border: 'none', color: T.accent, fontSize: 13, cursor: 'pointer', fontWeight: 600 }}
                    >
                      Sign in
                    </button>
                  </div>
                </div>
              </>
            )}

            {step === 'claim-pick'    && renderClaimPick()}
            {step === 'claim-details' && renderClaimDetails()}
            {step === 'claim-verify'  && renderClaimVerify()}
            {step === 'claim-done'    && renderClaimDone()}

            {/* ── SIGNUP ── */}
            {step === 'signup' && (
              <>
                <h2 style={{ color: T.text, fontSize: 20, fontWeight: 700, textAlign: 'center', margin: '0 0 6px', fontFamily: "'Syne', sans-serif" }}>
                  Create your artist account
                </h2>
                <p style={{ color: T.muted, fontSize: 13, textAlign: 'center', margin: '0 0 24px', lineHeight: 1.6 }}>
                  Start earning from your music on Goaradio.
                </p>
                <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <input className="goa-input" style={inputStyle} type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  <div style={{ position: 'relative' }}>
                    <input className="goa-input" style={{ ...inputStyle, paddingRight: 42 }} type={showPass ? 'text' : 'password'} placeholder="Create a password (min 6 chars)" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
                    <button type="button" onClick={() => setShowPass(p => !p)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: T.muted, cursor: 'pointer', display: 'flex' }}>
                      {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <input className="goa-input" style={{ ...inputStyle, paddingRight: 42, borderColor: confirmPassword && confirmPassword !== password ? '#ef4444' : undefined }} type={showConfirm ? 'text' : 'password'} placeholder="Confirm password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                    <button type="button" onClick={() => setShowConfirm(p => !p)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: T.muted, cursor: 'pointer', display: 'flex' }}>
                      {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  {error && <p style={{ color: '#ff6b6b', fontSize: 13, margin: 0 }}>{error}</p>}
                  <button type="submit" style={btnPrimary} disabled={loading}>
                    <UserPlus size={15} />
                    {loading ? 'Creating account…' : 'Create Account'}
                  </button>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ flex: 1, height: 1, background: T.border }} />
                    <span style={{ color: T.muted2, fontSize: 12 }}>or</span>
                    <div style={{ flex: 1, height: 1, background: T.border }} />
                  </div>
                  <button type="button" onClick={handleGoogleLogin} style={btnSecondary}>
                    <GoogleIcon /> Continue with Google
                  </button>
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ color: T.muted2, fontSize: 13 }}>Already have an account?{' '}</span>
                    <button type="button" onClick={() => setStep('login')} style={{ background: 'none', border: 'none', color: T.accent, fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>
                      Sign in
                    </button>
                  </div>
                  <button type="button" onClick={() => setStep('intent')} style={{ background: 'none', border: 'none', color: T.muted2, fontSize: 13, cursor: 'pointer', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <ArrowLeft size={13} /> Back
                  </button>
                </form>
              </>
            )}

            {/* ── LOGIN ── */}
            {step === 'login' && (
              <>
                <h2 style={{ color: T.text, fontSize: 20, fontWeight: 700, textAlign: 'center', margin: '0 0 6px', fontFamily: "'Syne', sans-serif" }}>
                  Sign in
                </h2>
                <p style={{ color: T.muted, fontSize: 13, textAlign: 'center', margin: '0 0 24px', lineHeight: 1.6 }}>
                  Access your Goaradio for Artists dashboard.
                </p>
                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <input className="goa-input" style={inputStyle} type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  <div style={{ position: 'relative' }}>
                    <input className="goa-input" style={{ ...inputStyle, paddingRight: 42 }} type={showPass ? 'text' : 'password'} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    <button type="button" onClick={() => setShowPass(p => !p)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: T.muted, cursor: 'pointer', display: 'flex' }}>
                      {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  {error && <p style={{ color: '#ff6b6b', fontSize: 13, margin: 0 }}>{error}</p>}
                  <button type="submit" style={btnPrimary} disabled={loading}>
                    <LogIn size={15} />
                    {loading ? 'Signing in…' : 'Sign In'}
                  </button>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ flex: 1, height: 1, background: T.border }} />
                    <span style={{ color: T.muted2, fontSize: 12 }}>or</span>
                    <div style={{ flex: 1, height: 1, background: T.border }} />
                  </div>
                  <button type="button" onClick={handleGoogleLogin} style={btnSecondary}>
                    <GoogleIcon /> Continue with Google
                  </button>
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ color: T.muted2, fontSize: 13 }}>No account?{' '}</span>
                    <button type="button" onClick={() => setStep('signup')} style={{ background: 'none', border: 'none', color: T.accent, fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>
                      Create one
                    </button>
                  </div>
                  <button type="button" onClick={() => setStep('intent')} style={{ background: 'none', border: 'none', color: T.muted2, fontSize: 13, cursor: 'pointer', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <ArrowLeft size={13} /> Back
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
