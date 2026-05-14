'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import goaradioLogo from '../../public/goaradio logo round (1).png'
import flutterwaveLogo from '../../public/flutterwave-logo.png'
import {
  onAuthStateChanged,
  signOut,
} from 'firebase/auth'
import {
  Wallet,
  CreditCard,
  Building2,
  ArrowDownToLine,
  ShieldCheck,
  ChevronDown,
  Globe,
  Phone,
  Hash,
  DollarSign,
  Info,
} from 'lucide-react'
import {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  query,
  orderBy,
  limit,
} from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import {
  LayoutDashboard,
  BarChart3,
  Coins,
  Music2,
  Upload,
  UserCircle,
  ExternalLink,
  LogOut,
  TrendingUp,
  Users,
  Headphones,
  Plus,
  Pencil,
  Trash2,
  Save,
  Send,
  Play,
  Check,
  Clock,
  BadgeCheck,
  ChevronRight,
  Mic2,
  Menu,
  X,
  Loader2,
  AlertCircle,
  RefreshCw,
  Repeat2,
} from 'lucide-react'

// ─── Airtable ─────────────────────────────────────────────────────────────────
const AT_TOKEN = 'patnr2Fyn9ZVlRavH.e54394ac6075004f3bf0d7f84a5b1a1f8bc0fbb3b2e664e487fd9d05b3bfd8e5'
const BASE_ID  = 'appg5mgqnhZPJKDXR'

async function atFetch(table: string, filter = '') {
  let url = `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(table)}`
  if (filter) url += `?filterByFormula=${encodeURIComponent(filter)}`
  return fetch(url, { headers: { Authorization: `Bearer ${AT_TOKEN}` } })
}

async function atPatch(table: string, id: string, fields: Record<string, unknown>) {
  return fetch(`https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(table)}/${id}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${AT_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields }),
  })
}

async function atCreate(table: string, fields: Record<string, unknown>) {
  return fetch(`https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(table)}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${AT_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields }),
  })
}

async function atDelete(table: string, id: string) {
  return fetch(`https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(table)}/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${AT_TOKEN}` },
  })
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface Track {
  id: string
  title: string
  artist: string
  cover: string
  audio: string
  duration: string
  genre: string
  streams: number   // unique listeners (from Firestore `streams` collection)
  replays: number   // total plays    (from Firestore `replays` collection)
}

interface ProfileData {
  artistName?: string
  fullName?: string
  bio?: string
  genre?: string
  instagram?: string
  twitter?: string
  spotify?: string
  youtube?: string
  profilePic?: string
  coverArt?: string
  verified?: boolean
  airtableId?: string
  email?: string
  phone?: string
  country?: string
}

// Daily counts keyed by 'YYYY-MM-DD'
type DailyMap = Record<string, number>

interface DailyAnalytics {
  streams: DailyMap   // unique listeners per day
  replays: DailyMap   // total plays per day
}

type Page = 'overview' | 'analytics' | 'earnings' | 'tracks' | 'upload' | 'profile'

// ─── Theme ────────────────────────────────────────────────────────────────────
const T = {
  bg:      '#080808',
  bg2:     '#0f0f0f',
  bg3:     '#161616',
  card:    '#111111',
  card2:   '#131313',
  border:  'rgba(255,255,255,0.06)',
  border2: 'rgba(255,255,255,0.1)',
  accent:  '#ffd700',
  accent2: '#ffb800',
  text:    '#f5f5f0',
  muted:   '#777770',
  muted2:  '#333330',
  success: '#22c55e',
  danger:  '#ef4444',
  info:    '#3b82f6',
}

interface ToastState { msg: string; type: 'success' | 'error'; visible: boolean }

// ─── Helpers ──────────────────────────────────────────────────────────────────

function lastNDays(n: number): string[] {
  const days: string[] = []
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push(d.toISOString().slice(0, 10))
  }
  return days
}

function dayLabel(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' })
}

// Safely read a Firestore doc count field
async function safeGetCount(path: string[]): Promise<number> {
  try {
    const ref = doc(db, path[0], ...path.slice(1))
    const snap = await getDoc(ref)
    if (snap.exists()) {
      const data = snap.data()
      // Support various field names
      return (
        (data?.count as number) ||
        (data?.total as number) ||
        (data?.plays as number) ||
        (data?.streams as number) ||
        0
      )
    }
  } catch { /* ignore */ }
  return 0
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const router = useRouter()

  const [currentPage, setCurrentPage] = useState<Page>('overview')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [profileData, setProfileData] = useState<ProfileData>({})
  const [artistName, setArtistName]   = useState('')
  const [tracks, setTracks]           = useState<Track[]>([])
  const [tracksLoading, setTracksLoading] = useState(true)
  const [authLoading, setAuthLoading] = useState(true)
  const [toast, setToast]             = useState<ToastState>({ msg: '', type: 'success', visible: false })
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // ── Analytics state ──────────────────────────────────────────────────────
  const [analyticsLoading, setAnalyticsLoading] = useState(false)
  const [dailyAnalytics, setDailyAnalytics] = useState<DailyAnalytics>({
    streams: {},
    replays: {},
  })
  const [analyticsdays] = useState<string[]>(lastNDays(7))
  // active chart tab: 'streams' | 'replays' | 'both'
  const [chartTab, setChartTab] = useState<'streams' | 'replays' | 'both'>('both')

  // Upload state
  const [uploadTitle, setUploadTitle]       = useState('')
  const [uploadAudio, setUploadAudio]       = useState('')
  const [uploadCover, setUploadCover]       = useState('')
  const [uploadDuration, setUploadDuration] = useState('')
  const [uploadGenre, setUploadGenre]       = useState('')
  const [uploading, setUploading]           = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [audioPreviewUrl, setAudioPreviewUrl] = useState('')
  const [coverPreviewUrl, setCoverPreviewUrl] = useState('')

  // Profile edit state
  const [profArtistName, setProfArtistName] = useState('')
  const [profBio, setProfBio]               = useState('')
  const [profGenre, setProfGenre]           = useState('')
  const [profInstagram, setProfInstagram]   = useState('')
  const [profTwitter, setProfTwitter]       = useState('')
  const [profSpotify, setProfSpotify]       = useState('')
  const [profYoutube, setProfYoutube]       = useState('')
  const [profPicUrl, setProfPicUrl]         = useState('')
  const [profCoverUrl, setProfCoverUrl]     = useState('')
  const [savingProfile, setSavingProfile]   = useState(false)

  const showToast = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type, visible: true })
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 3500)
  }, [])

  // ── Auth guard ───────────────────────────────────────────────────────────
  useEffect(() => {
    let sessionSettled = false
    const timeout = setTimeout(() => {
      if (!sessionSettled) { sessionSettled = true; router.replace('/') }
    }, 3000)

    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { if (!sessionSettled) return; router.replace('/'); return }
      clearTimeout(timeout)
      sessionSettled = true

      let data: ProfileData = {}
      let attempts = 0
      while (attempts < 3) {
        try {
          const snap = await getDoc(doc(db, 'artists', user.uid))
          if (snap.exists()) { data = snap.data() as ProfileData; break }
        } catch (err) { console.error('[Dashboard] Firestore error:', err) }
        attempts++
        if (attempts < 3) await new Promise(r => setTimeout(r, 800))
      }

      const resolvedName = data.artistName || user.displayName || user.email?.split('@')[0] || 'Artist'
      setProfileData(data)
      setArtistName(resolvedName)
      setProfArtistName(data.artistName || resolvedName)
      setProfBio(data.bio || '')
      setProfGenre(data.genre || '')
      setProfInstagram(data.instagram || '')
      setProfTwitter(data.twitter || '')
      setProfSpotify(data.spotify || '')
      setProfYoutube(data.youtube || '')
      setProfPicUrl(data.profilePic || '')
      setProfCoverUrl(data.coverArt || '')
      setAuthLoading(false)
    })

    return () => { clearTimeout(timeout); unsub() }
  }, [router])

  // ── Load tracks whenever artistName is resolved ──────────────────────────
  useEffect(() => {
    if (!artistName) return
    loadTracks(artistName)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [artistName])

  async function loadTracks(name: string) {
    setTracksLoading(true)
    try {
      const res  = await atFetch('Tracks', `Artist="${name}"`)
      const data = await res.json()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rawRecords: any[] = data.records || []

      const list: Track[] = await Promise.all(
        rawRecords.map(async (r) => {
          const f     = r.fields
          const title = f.Title || 'Untitled'

          // ── Read BOTH streams (unique) and replays (total plays) ──────────
          // streams/{trackTitle} → unique listeners
          // replays/{trackTitle} → total play count (includes repeat listens)
          const [streams, replays] = await Promise.all([
            safeGetCount(['streams', title]),
            safeGetCount(['replays', title]),
          ])

          return {
            id:       r.id,
            title,
            artist:   f.Artist   || name,
            cover:    f.Cover_url || '',
            audio:    f.Audio_url || '',
            duration: f.Duration  || '--:--',
            genre:    f.Genre     || '',
            streams,
            replays,
          }
        })
      )

      // Sort by replays (total plays) descending
      list.sort((a, b) => b.replays - a.replays)
      setTracks(list)
    } catch (err) {
      console.error('[Dashboard] loadTracks error:', err)
      showToast('Could not load tracks.', 'error')
    }
    setTracksLoading(false)
  }

  // ── Load daily analytics from Firestore ─────────────────────────────────
  // We try multiple patterns for both streams and replays:
  //   Pattern A (flat daily): streams/{YYYY-MM-DD}  → { trackTitle: count }
  //   Pattern B (per-track):  streams/{trackTitle}/days/{YYYY-MM-DD} → { count }
  //   Pattern C (collection): streamDays/{YYYY-MM-DD}/tracks/{trackTitle} → { count }
  //
  // Same patterns tried for replays collection.
  //
  // If NO daily data exists (old setup), we distribute total counts across
  // today so at least something shows, with a note to the user.
  const loadDailyAnalytics = useCallback(async (currentTracks: Track[]) => {
    if (currentTracks.length === 0) return
    setAnalyticsLoading(true)

    const days = lastNDays(7)
    const artistTitles = new Set(currentTracks.map(t => t.title))

    const streamsDailyMap: DailyMap = {}
    const replaysDailyMap: DailyMap = {}
    days.forEach(d => { streamsDailyMap[d] = 0; replaysDailyMap[d] = 0 })

    async function tryFlatDaily(collectionName: string, targetMap: DailyMap) {
      let hasData = false
      await Promise.allSettled(days.map(async (day) => {
        try {
          const snap = await getDoc(doc(db, collectionName, day))
          if (snap.exists()) {
            const data = snap.data() as Record<string, number>
            let dayTotal = 0
            for (const [key, val] of Object.entries(data)) {
              if (artistTitles.has(key)) dayTotal += (val || 0)
            }
            if (dayTotal > 0) { targetMap[day] = (targetMap[day] || 0) + dayTotal; hasData = true }
          }
        } catch { /* ignore */ }
      }))
      return hasData
    }

    async function tryPerTrack(collectionName: string, targetMap: DailyMap) {
      let hasData = false
      await Promise.allSettled(currentTracks.map(async (track) => {
        await Promise.allSettled(days.map(async (day) => {
          try {
            const snap = await getDoc(doc(db, collectionName, track.title, 'days', day))
            if (snap.exists()) {
              const cnt = (snap.data()?.count as number) || 0
              if (cnt > 0) { targetMap[day] = (targetMap[day] || 0) + cnt; hasData = true }
            }
          } catch { /* ignore */ }
        }))
      }))
      return hasData
    }

    async function tryDaysCollection(collectionName: string, targetMap: DailyMap) {
      let hasData = false
      await Promise.allSettled(days.map(async (day) => {
        try {
          const colSnap = await getDocs(collection(db, `${collectionName}Days`, day, 'tracks'))
          colSnap.forEach(docSnap => {
            if (artistTitles.has(docSnap.id)) {
              const cnt = (docSnap.data()?.count as number) || 0
              if (cnt > 0) { targetMap[day] = (targetMap[day] || 0) + cnt; hasData = true }
            }
          })
        } catch { /* ignore */ }
      }))
      return hasData
    }

    // ── Try streams ────────────────────────────────────────────────────────
    let streamsFound = await tryFlatDaily('streams', streamsDailyMap)
    if (!streamsFound) streamsFound = await tryPerTrack('streams', streamsDailyMap)
    if (!streamsFound) await tryDaysCollection('stream', streamsDailyMap)

    // ── Try replays ───────────────────────────────────────────────────────
    let replaysFound = await tryFlatDaily('replays', replaysDailyMap)
    if (!replaysFound) replaysFound = await tryPerTrack('replays', replaysDailyMap)
    if (!replaysFound) await tryDaysCollection('replay', replaysDailyMap)

    // ── Fallback: if NO daily data at all, surface today's totals ─────────
    // This makes the chart useful even without daily sub-docs, while
    // making clear it's an all-time snapshot, not historical data.
    const streamsAllZero = Object.values(streamsDailyMap).every(v => v === 0)
    const replaysAllZero = Object.values(replaysDailyMap).every(v => v === 0)
    const today = days[days.length - 1]

    if (streamsAllZero) {
      const totalStreams = currentTracks.reduce((s, t) => s + t.streams, 0)
      if (totalStreams > 0) streamsDailyMap[today] = totalStreams
    }
    if (replaysAllZero) {
      const totalReplays = currentTracks.reduce((s, t) => s + t.replays, 0)
      if (totalReplays > 0) replaysDailyMap[today] = totalReplays
    }

    setDailyAnalytics({ streams: streamsDailyMap, replays: replaysDailyMap })
    setAnalyticsLoading(false)
  }, [])

  useEffect(() => {
    if (!tracksLoading && tracks.length > 0) loadDailyAnalytics(tracks)
  }, [tracksLoading, tracks, loadDailyAnalytics])

  // ── Derived totals ────────────────────────────────────────────────────────
  const totalStreams  = tracks.reduce((s, t) => s + t.streams, 0)   // unique listeners
  const totalReplays  = tracks.reduce((s, t) => s + t.replays, 0)   // total plays
  const repeatPlays   = Math.max(0, totalReplays - totalStreams)      // repeat/re-listens
  const totalGoa      = Math.floor(totalReplays / 10)                 // based on total plays
  const monthlyGoa    = Math.floor(totalGoa * 0.3)
  const zltEarned     = Math.floor(totalGoa * 0.15)
  const verified      = profileData.verified || false

  const streamChartVals  = analyticsdays.map(d => dailyAnalytics.streams[d] || 0)
  const replayChartVals  = analyticsdays.map(d => dailyAnalytics.replays[d] || 0)

  const todayStreams    = dailyAnalytics.streams[analyticsdays[analyticsdays.length - 1]] || 0
  const todayReplays   = dailyAnalytics.replays[analyticsdays[analyticsdays.length - 1]] || 0
  const yesterStreams   = dailyAnalytics.streams[analyticsdays[analyticsdays.length - 2]] || 0
  const yesterReplays  = dailyAnalytics.replays[analyticsdays[analyticsdays.length - 2]] || 0
  const weekStreams     = streamChartVals.reduce((a, b) => a + b, 0)
  const weekReplays    = replayChartVals.reduce((a, b) => a + b, 0)

  const noStreamsDaily = Object.values(dailyAnalytics.streams).every(v => v === 0) || (
    Object.entries(dailyAnalytics.streams).filter(([d]) => d !== analyticsdays[analyticsdays.length - 1]).every(([,v]) => v === 0)
    && Object.values(dailyAnalytics.streams).some(v => v > 0)
  )

  const streamTrend = yesterStreams > 0
    ? ((todayStreams - yesterStreams) / yesterStreams * 100).toFixed(0)
    : null
  const replayTrend = yesterReplays > 0
    ? ((todayReplays - yesterReplays) / yesterReplays * 100).toFixed(0)
    : null

  const genreCount: Record<string, number> = {}
  tracks.forEach(t => { if (t.genre) genreCount[t.genre] = (genreCount[t.genre] || 0) + t.replays })
  const topGenre = Object.entries(genreCount).sort((a, b) => b[1] - a[1])[0]?.[0] || '—'
  const avgReplays = tracks.length > 0 ? Math.round(totalReplays / tracks.length) : 0

  // ── Upload ───────────────────────────────────────────────────────────────
  async function handleUpload() {
    if (!uploadTitle.trim() || !uploadAudio.trim()) {
      showToast('Title and Audio URL are required.', 'error')
      return
    }
    setUploading(true)
    setUploadProgress(0)
    const iv = setInterval(() => setUploadProgress(p => Math.min(p + 10, 80)), 120)
    try {
      const fields: Record<string, unknown> = {
        Title:     uploadTitle.trim(),
        Artist:    artistName,
        Audio_url: uploadAudio.trim(),
        Duration:  uploadDuration.trim(),
      }
      if (uploadCover.trim()) fields.Cover_url = uploadCover.trim()
      if (uploadGenre)        fields.Genre     = uploadGenre

      const res  = await atCreate('Tracks', fields)
      const data = await res.json()
      clearInterval(iv)
      setUploadProgress(100)

      if (data.id) {
        const newTrack: Track = {
          id:       data.id,
          title:    uploadTitle,
          artist:   artistName,
          cover:    uploadCover || '',
          audio:    uploadAudio,
          duration: uploadDuration,
          genre:    uploadGenre,
          streams:  0,
          replays:  0,
        }
        setTracks(prev => [newTrack, ...prev])
      }

      showToast('Track published to Goaradio!')
      setUploadTitle(''); setUploadAudio(''); setUploadCover('')
      setUploadDuration(''); setUploadGenre('')
      setAudioPreviewUrl(''); setCoverPreviewUrl('')
    } catch {
      clearInterval(iv)
      showToast('Publish failed. Check console.', 'error')
    }
    setUploading(false)
    setTimeout(() => setUploadProgress(0), 1000)
  }

  // ── Delete ───────────────────────────────────────────────────────────────
  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleteLoading(true)
    try {
      await atDelete('Tracks', deleteTarget)
      setTracks(prev => prev.filter(t => t.id !== deleteTarget))
      showToast('Track removed.')
      setDeleteTarget(null)
    } catch { showToast('Delete failed.', 'error') }
    setDeleteLoading(false)
  }

  // ── Save profile ─────────────────────────────────────────────────────────
  async function saveProfile() {
    setSavingProfile(true)
    const user = auth.currentUser
    if (!user) return
    const data: ProfileData = {
      artistName:  profArtistName || artistName,
      bio:         profBio,
      genre:       profGenre,
      instagram:   profInstagram,
      twitter:     profTwitter,
      spotify:     profSpotify,
      youtube:     profYoutube,
      profilePic:  profPicUrl  || profileData.profilePic || '',
      coverArt:    profCoverUrl || profileData.coverArt  || '',
    }
    try {
      await setDoc(doc(db, 'artists', user.uid), data, { merge: true })
      setProfileData(prev => ({ ...prev, ...data }))
      if (data.artistName && data.artistName !== artistName) setArtistName(data.artistName)
      if (profileData.airtableId) {
        const atF: Record<string, unknown> = {}
        if (data.coverArt)   atF.Cover_url   = data.coverArt
        if (data.profilePic) atF.Profile_pic = data.profilePic
        if (data.bio)        atF.Bio         = data.bio
        if (Object.keys(atF).length) await atPatch('Artists', profileData.airtableId, atF)
      }
      showToast('Profile saved!')
    } catch { showToast('Save failed.', 'error') }
    setSavingProfile(false)
  }

  async function handleLogout() {
    await signOut(auth)
    router.replace('/')
  }

  const hour  = new Date().getHours()
  const greet = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  // ── Loading screen ───────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
        <div style={{ width: 44, height: 44, border: `2px solid ${T.border2}`, borderTopColor: T.accent, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <span style={{ color: T.muted, fontSize: 14, fontFamily: "'DM Sans', sans-serif" }}>Loading dashboard...</span>
      </div>
    )
  }

  // ── Shared styles ────────────────────────────────────────────────────────
  const card: React.CSSProperties = {
    background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: '24px 26px',
  }
  const inputStyle: React.CSSProperties = {
    width: '100%', background: T.bg2, border: `1px solid ${T.border2}`, borderRadius: 10,
    padding: '11px 13px', color: T.text, fontFamily: "'DM Sans', sans-serif", fontSize: 14, outline: 'none', boxSizing: 'border-box',
  }
  const btnGold: React.CSSProperties = {
    background: T.accent, color: '#080808', border: 'none', borderRadius: 10, padding: '10px 18px',
    fontFamily: "'Poppins', sans-serif", fontSize: 13, fontWeight: 700, cursor: 'pointer',
    display: 'inline-flex', alignItems: 'center', gap: 7, whiteSpace: 'nowrap' as const, transition: 'opacity 0.2s',
  }
  const btnGhost: React.CSSProperties = {
    background: 'transparent', color: T.text, border: `1px solid ${T.border2}`, borderRadius: 10, padding: '10px 16px',
    fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, cursor: 'pointer',
    display: 'inline-flex', alignItems: 'center', gap: 7, whiteSpace: 'nowrap' as const, transition: 'background 0.2s',
  }

  const navItems: { id: Page; label: string; icon: React.ReactNode; section?: string }[] = [
    { id: 'overview',  label: 'Dashboard',    icon: <LayoutDashboard size={16} />, section: 'OVERVIEW' },
    { id: 'analytics', label: 'Analytics',    icon: <BarChart3 size={16} /> },
    { id: 'earnings',  label: 'Earnings',     icon: <Coins size={16} /> },
    { id: 'tracks',    label: 'My Tracks',    icon: <Music2 size={16} />, section: 'MY MUSIC' },
    { id: 'upload',    label: 'Upload',       icon: <Upload size={16} /> },
    { id: 'profile',   label: 'Edit Profile', icon: <UserCircle size={16} />, section: 'PROFILE' },
  ]

  function NavItem({ item }: { item: typeof navItems[0] }) {
    const active = currentPage === item.id
    return (
      <button
        onClick={() => { setCurrentPage(item.id); setSidebarOpen(false) }}
        style={{
          width: '100%', position: 'relative', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px',
          borderRadius: 10, border: `1px solid ${active ? 'rgba(51,51,51,0.7)' : 'transparent'}`,
          background: active ? 'rgba(0,0,0,0.5)' : 'transparent',
          boxShadow: active ? 'inset 0 1px 0 rgba(255,255,255,0.04), 0 -1px 0 1px rgba(51,51,51,0.25)' : 'none',
          color: active ? T.text : T.muted, fontSize: 13, fontWeight: active ? 600 : 400,
          fontFamily: "'DM Sans', sans-serif", cursor: 'pointer', textAlign: 'left', transition: 'all 0.18s',
        }}
        onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)' }}
        onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
      >
        {active && (
          <span style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: 3, height: 18, borderRadius: '0 3px 3px 0', background: T.accent }} />
        )}
        <span style={{ color: active ? T.accent : 'inherit', display: 'flex', alignItems: 'center' }}>{item.icon}</span>
        {item.label}
      </button>
    )
  }

  const picSrc   = profileData.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(artistName)}&background=1a1800&color=ffd700&size=200`
  const coverSrc = profileData.coverArt || ''

  function SidebarContent() {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 4px', marginBottom: 28 }}>
          <div style={{ width: 36, height: 36, position: 'relative', flexShrink: 0 }}>
            <Image src={goaradioLogo} alt="Goaradio logo" fill priority quality={100} style={{ objectFit: 'contain' }} />
          </div>
          <div>
            <div style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 800, fontSize: 15, color: T.text, lineHeight: 1.1 }}>Goaradio</div>
            <div style={{ fontSize: 10, color: T.accent, fontFamily: "'DM Sans', sans-serif", letterSpacing: '0.04em', textTransform: 'uppercase' }}>for artists</div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
          {navItems.map(item => (
            <div key={item.id}>
              {item.section && (
                <div style={{ fontSize: 10, fontWeight: 700, color: T.muted2, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '14px 12px 5px', fontFamily: "'DM Sans', sans-serif" }}>
                  {item.section}
                </div>
              )}
              <NavItem item={item} />
            </div>
          ))}
          <div style={{ height: 1, background: T.border, margin: '12px 0' }} />
          <button onClick={() => window.open('https://goaradio.org', '_blank')} style={{ ...btnGhost, width: '100%', fontSize: 13, justifyContent: 'flex-start', padding: '9px 12px', border: 'none' }}>
            <ExternalLink size={15} /> View on Goaradio
          </button>
        </div>
        <div style={{ marginTop: 'auto', padding: '12px', background: T.bg3, border: `1px solid ${T.border}`, borderRadius: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src={picSrc} alt={artistName} onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(artistName)}&background=1a1800&color=ffd700&size=200` }} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{artistName}</div>
            <div style={{ fontSize: 11, color: verified ? T.success : T.accent, display: 'flex', alignItems: 'center', gap: 4, marginTop: 1 }}>
              {verified ? <BadgeCheck size={10} /> : <Clock size={10} />}
              {verified ? 'Verified' : 'Pending'}
            </div>
          </div>
          <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: T.muted, cursor: 'pointer', padding: 4, display: 'flex' }}>
            <LogOut size={15} />
          </button>
        </div>
      </div>
    )
  }

  function StatCard({ label, value, sub, icon, accent }: { label: string; value: string | number; sub: string; icon: React.ReactNode; accent: string }) {
    return (
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: '20px 22px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: accent }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <span style={{ fontSize: 11, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>{label}</span>
          <span style={{ color: T.muted, opacity: 0.6 }}>{icon}</span>
        </div>
        <div style={{ fontFamily: "'Poppins', sans-serif", fontSize: 28, fontWeight: 800, color: T.text, lineHeight: 1, marginBottom: 6 }}>
          {tracksLoading ? <span style={{ fontSize: 18, color: T.muted2 }}>—</span> : value}
        </div>
        <div style={{ fontSize: 12, color: T.muted, display: 'flex', alignItems: 'center', gap: 4 }}>{sub}</div>
      </div>
    )
  }

  function TrackRow({ track, index, showActions = true }: { track: Track; index: number; showActions?: boolean }) {
    const fallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(track.title)}&background=1a1800&color=ffd700&size=100`
    return (
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, margin: '0 -12px', transition: 'background 0.15s', flexWrap: 'wrap' }}
        onMouseEnter={e => (e.currentTarget.style.background = T.bg3)}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      >
        <span style={{ width: 22, textAlign: 'center', fontSize: 12, color: T.muted2, flexShrink: 0 }}>{index + 1}</span>
        <img src={track.cover || fallback} alt={track.title} onError={e => { (e.target as HTMLImageElement).src = fallback }} style={{ width: 42, height: 42, borderRadius: 8, objectFit: 'cover', background: T.bg3, flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 120 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: T.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{track.title}</div>
          <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>{track.genre || track.artist} · {track.duration}</div>
        </div>
        {/* Streams (unique) */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flexShrink: 0, gap: 2, marginLeft: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: T.text }}>
            <Users size={11} color={T.accent} /> {(track.streams || 0).toLocaleString()}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: T.muted }}>
            <Repeat2 size={10} /> {(track.replays || 0).toLocaleString()} plays
          </div>
        </div>
        {showActions && (
          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            <button
              title="Edit"
              onClick={() => {
                const newTitle = prompt('Edit track title:', track.title)
                if (!newTitle || newTitle === track.title) return
                atPatch('Tracks', track.id, { Title: newTitle }).then(() => {
                  setTracks(prev => prev.map(t => t.id === track.id ? { ...t, title: newTitle } : t))
                  showToast('Track updated!')
                }).catch(() => showToast('Update failed.', 'error'))
              }}
              style={{ width: 30, height: 30, borderRadius: 7, border: `1px solid ${T.border}`, background: 'transparent', color: T.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
              onMouseEnter={e => { (e.currentTarget.style.background = T.bg3); (e.currentTarget.style.color = T.text) }}
              onMouseLeave={e => { (e.currentTarget.style.background = 'transparent'); (e.currentTarget.style.color = T.muted) }}
            >
              <Pencil size={12} />
            </button>
            <button
              title="Delete"
              onClick={() => setDeleteTarget(track.id)}
              style={{ width: 30, height: 30, borderRadius: 7, border: `1px solid ${T.border}`, background: 'transparent', color: T.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
              onMouseEnter={e => { (e.currentTarget.style.background = 'rgba(239,68,68,0.1)'); (e.currentTarget.style.color = T.danger) }}
              onMouseLeave={e => { (e.currentTarget.style.background = 'transparent'); (e.currentTarget.style.color = T.muted) }}
            >
              <Trash2 size={12} />
            </button>
          </div>
        )}
      </div>
    )
  }

  // ── OVERVIEW ─────────────────────────────────────────────────────────────
  function PageOverview() {
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, gap: 12, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontFamily: "'Poppins', sans-serif", fontSize: 'clamp(22px, 4vw, 28px)', fontWeight: 800, color: T.text, margin: 0 }}>Dashboard</h1>
            <p style={{ fontSize: 14, color: T.muted, marginTop: 4 }}>{greet}, {artistName}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: verified ? 'rgba(34,197,94,0.08)' : 'rgba(255,215,0,0.08)', color: verified ? T.success : T.accent, border: `1px solid ${verified ? 'rgba(34,197,94,0.2)' : 'rgba(255,215,0,0.2)'}` }}>
              {verified ? <BadgeCheck size={12} /> : <Clock size={12} />}
              {verified ? 'Verified' : 'Pending Verification'}
            </span>
            <button onClick={() => setCurrentPage('upload')} style={btnGold}><Plus size={14} /> Add Track</button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 24 }}>
          <StatCard label="Total Plays" value={totalReplays.toLocaleString()} sub="all time" icon={<Headphones size={16} />} accent={`linear-gradient(90deg, ${T.accent}, ${T.accent2})`} />
          <StatCard label="Unique Listeners" value={totalStreams.toLocaleString()} sub="distinct users" icon={<Users size={16} />} accent="linear-gradient(90deg, #3b82f6, #1d4ed8)" />
          <StatCard label="Tracks" value={tracks.length} sub="on Goaradio" icon={<Music2 size={16} />} accent="linear-gradient(90deg, #a855f7, #7c3aed)" />
          <StatCard label="$GOA Earned" value={totalGoa.toLocaleString()} sub="stream rewards" icon={<Coins size={16} />} accent={`linear-gradient(90deg, ${T.accent}, #f59e0b)`} />
        </div>

        <div style={{ ...card, marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 8 }}>
            <h2 style={{ fontFamily: "'Poppins', sans-serif", fontSize: 16, fontWeight: 700, color: T.text, margin: 0 }}>Top Tracks</h2>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: T.success, fontWeight: 600 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: T.success, display: 'inline-block', animation: 'pulseDot 2s infinite' }} />
              Live
            </span>
          </div>
          {tracksLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: T.muted, padding: '20px 0', fontSize: 14 }}>
              <Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> Loading tracks...
            </div>
          ) : tracks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: T.muted }}>
              <Music2 size={32} style={{ opacity: 0.3, marginBottom: 10 }} />
              <p style={{ fontSize: 14 }}>No tracks yet. Upload your first track.</p>
            </div>
          ) : (
            tracks.slice(0, 5).map((t, i) => <TrackRow key={t.id} track={t} index={i} showActions={false} />)
          )}
          {tracks.length > 0 && (
            <button onClick={() => setCurrentPage('tracks')} style={{ ...btnGhost, marginTop: 14, fontSize: 13, width: '100%', justifyContent: 'center' }}>
              View all tracks <ChevronRight size={13} />
            </button>
          )}
        </div>

        <div style={card}>
          <h2 style={{ fontFamily: "'Poppins', sans-serif", fontSize: 16, fontWeight: 700, color: T.text, margin: '0 0 16px' }}>Quick Actions</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
            {[
              { icon: <Upload size={20} style={{ color: T.accent }} />,      title: 'Upload Track',   sub: 'Add songs to Goaradio', page: 'upload' as Page },
              { icon: <UserCircle size={20} style={{ color: '#a855f7' }} />, title: 'Update Profile', sub: 'Edit your artist page', page: 'profile' as Page },
              { icon: <BarChart3 size={20} style={{ color: T.success }} />,  title: 'View Analytics', sub: 'Check stream data',     page: 'analytics' as Page },
            ].map(item => (
              <button key={item.title} onClick={() => setCurrentPage(item.page)} style={{ ...btnGhost, flexDirection: 'column', alignItems: 'flex-start', gap: 8, padding: '14px 16px', height: 'auto', textAlign: 'left' }}>
                {item.icon}
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{item.title}</div>
                  <div style={{ fontSize: 12, color: T.muted, fontWeight: 400, marginTop: 2 }}>{item.sub}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ── ANALYTICS ─────────────────────────────────────────────────────────────
  function PageAnalytics() {
    // Chart: which values to draw depending on tab
    const primaryVals  = chartTab === 'replays' ? replayChartVals : streamChartVals
    const secondaryVals = chartTab === 'both'   ? replayChartVals : []
    const maxBar = Math.max(...primaryVals, ...secondaryVals, 1)

    const isDailyFallback = noStreamsDaily && totalStreams > 0

    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, gap: 12, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontFamily: "'Poppins', sans-serif", fontSize: 'clamp(22px, 4vw, 28px)', fontWeight: 800, color: T.text, margin: 0 }}>Analytics</h1>
            <p style={{ fontSize: 14, color: T.muted, marginTop: 4 }}>Live data from Goaradio · streams = unique, plays = total</p>
          </div>
          <button onClick={() => loadDailyAnalytics(tracks)} disabled={analyticsLoading || tracksLoading} style={{ ...btnGhost, opacity: (analyticsLoading || tracksLoading) ? 0.5 : 1 }}>
            <RefreshCw size={13} style={{ animation: analyticsLoading ? 'spin 0.8s linear infinite' : 'none' }} />
            Refresh
          </button>
        </div>

        {/* Stat strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 20 }}>
          {[
            {
              label: "Today's Streams",
              value: analyticsLoading ? '—' : todayStreams.toLocaleString(),
              sub: streamTrend !== null ? `${Number(streamTrend) >= 0 ? '▲' : '▼'} ${Math.abs(Number(streamTrend))}% vs yesterday` : 'unique listeners',
              color: T.info,
            },
            {
              label: "Today's Plays",
              value: analyticsLoading ? '—' : todayReplays.toLocaleString(),
              sub: replayTrend !== null ? `${Number(replayTrend) >= 0 ? '▲' : '▼'} ${Math.abs(Number(replayTrend))}% vs yesterday` : 'total plays',
              color: T.accent,
            },
            {
              label: '7-Day Streams',
              value: analyticsLoading ? '—' : weekStreams.toLocaleString(),
              sub: 'unique this week',
              color: T.info,
            },
            {
              label: '7-Day Plays',
              value: analyticsLoading ? '—' : weekReplays.toLocaleString(),
              sub: 'total this week',
              color: T.accent,
            },
            {
              label: 'Repeat Rate',
              value: totalStreams > 0 ? `${((repeatPlays / Math.max(totalReplays, 1)) * 100).toFixed(0)}%` : '—',
              sub: 'replays ÷ total plays',
              color: '#a855f7',
            },
            {
              label: 'Top Genre',
              value: tracksLoading ? '—' : topGenre,
              sub: 'by play count',
              color: T.success,
            },
          ].map(s => (
            <div key={s.label} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: '16px 18px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: s.color }} />
              <div style={{ fontSize: 11, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: 8 }}>{s.label}</div>
              <div style={{ fontFamily: "'Poppins', sans-serif", fontSize: 22, fontWeight: 800, color: T.text, lineHeight: 1, marginBottom: 4 }}>{s.value}</div>
              <div style={{ fontSize: 11, color: s.color }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Chart card */}
        <div style={{ ...card, marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
            <h2 style={{ fontFamily: "'Poppins', sans-serif", fontSize: 16, fontWeight: 700, color: T.text, margin: 0 }}>
              Last 7 Days
            </h2>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              {analyticsLoading && <Loader2 size={13} style={{ color: T.muted, animation: 'spin 0.8s linear infinite' }} />}
              {/* Tab switcher */}
              {(['both', 'streams', 'replays'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setChartTab(tab)}
                  style={{
                    ...btnGhost,
                    padding: '6px 12px',
                    fontSize: 12,
                    background: chartTab === tab ? (tab === 'replays' ? 'rgba(255,215,0,0.12)' : tab === 'streams' ? 'rgba(59,130,246,0.12)' : 'rgba(255,255,255,0.06)') : 'transparent',
                    color: chartTab === tab ? T.text : T.muted,
                    borderColor: chartTab === tab ? T.border2 : T.border,
                  }}
                >
                  {tab === 'both' ? 'Both' : tab === 'streams' ? 'Streams' : 'Plays'}
                </button>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
            {(chartTab === 'both' || chartTab === 'streams') && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: T.muted }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: T.info }} />
                Unique streams (listeners)
              </div>
            )}
            {(chartTab === 'both' || chartTab === 'replays') && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: T.muted }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: T.accent }} />
                Total plays (incl. replays)
              </div>
            )}
          </div>

          {/* Y-axis + bars */}
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', paddingBottom: 24, paddingTop: 4 }}>
              {[maxBar, Math.round(maxBar * 0.5), 0].map(v => (
                <span key={v} style={{ fontSize: 10, color: T.muted2, textAlign: 'right', minWidth: 28 }}>
                  {v > 999 ? `${(v / 1000).toFixed(1)}k` : v}
                </span>
              ))}
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: chartTab === 'both' ? 4 : 6, height: 180, paddingBottom: 24, position: 'relative' }}>
              {[0, 50, 100].map(pct => (
                <div key={pct} style={{ position: 'absolute', left: 0, right: 0, bottom: `calc(24px + ${pct}% * (180px - 24px) / 100)`, height: 1, background: T.border, pointerEvents: 'none' }} />
              ))}
              {analyticsdays.map((day, i) => {
                const isToday   = i === analyticsdays.length - 1
                const sVal      = streamChartVals[i]
                const rVal      = replayChartVals[i]
                const sH        = Math.max((sVal / maxBar) * 100, sVal > 0 ? 3 : 1)
                const rH        = Math.max((rVal / maxBar) * 100, rVal > 0 ? 3 : 1)
                const pH        = Math.max((primaryVals[i] / maxBar) * 100, primaryVals[i] > 0 ? 3 : 1)

                return (
                  <div key={day} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flex: 1 }}>
                    {chartTab === 'both' ? (
                      <div style={{ width: '100%', display: 'flex', alignItems: 'flex-end', gap: 2, height: '100%', justifyContent: 'center' }}>
                        {/* Streams bar (blue) */}
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          {sVal > 0 && <span style={{ fontSize: 9, color: T.info, fontWeight: 600, marginBottom: 2 }}>{sVal > 999 ? `${(sVal/1000).toFixed(1)}k` : sVal}</span>}
                          <div style={{ width: '100%', borderRadius: '4px 4px 0 0', height: `${sH}%`, background: isToday ? T.info : `rgba(59,130,246,0.4)`, transition: 'height 0.4s ease' }} title={`${sVal} listeners`} />
                        </div>
                        {/* Replays bar (gold) */}
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          {rVal > 0 && <span style={{ fontSize: 9, color: T.accent, fontWeight: 600, marginBottom: 2 }}>{rVal > 999 ? `${(rVal/1000).toFixed(1)}k` : rVal}</span>}
                          <div style={{ width: '100%', borderRadius: '4px 4px 0 0', height: `${rH}%`, background: isToday ? T.accent : `rgba(255,215,0,0.4)`, transition: 'height 0.4s ease' }} title={`${rVal} plays`} />
                        </div>
                      </div>
                    ) : (
                      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                        {primaryVals[i] > 0 && <span style={{ fontSize: 10, color: isToday ? (chartTab === 'streams' ? T.info : T.accent) : T.muted, fontWeight: isToday ? 700 : 400, marginBottom: 2 }}>{primaryVals[i] > 999 ? `${(primaryVals[i]/1000).toFixed(1)}k` : primaryVals[i]}</span>}
                        <div style={{ width: '100%', borderRadius: '5px 5px 0 0', height: `${pH}%`, background: isToday ? (chartTab === 'streams' ? T.info : T.accent) : (chartTab === 'streams' ? 'rgba(59,130,246,0.4)' : 'rgba(255,215,0,0.4)'), transition: 'height 0.4s ease' }} />
                      </div>
                    )}
                    <span style={{ fontSize: 10, color: isToday ? T.text : T.muted2, fontWeight: isToday ? 600 : 400 }}>
                      {isToday ? 'Today' : dayLabel(day)}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Fallback notice */}
          {isDailyFallback && (
            <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(255,215,0,0.05)', border: `1px solid rgba(255,215,0,0.15)`, borderRadius: 8, fontSize: 12, color: T.muted, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <AlertCircle size={14} color={T.accent} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>
                No daily breakdown found — showing all-time totals as today.
              </span>
            </div>
          )}
        </div>

        {/* Lower row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>

          {/* Per-track breakdown — BOTH streams + replays */}
          <div style={card}>
            <h2 style={{ fontFamily: "'Poppins', sans-serif", fontSize: 16, fontWeight: 700, color: T.text, margin: '0 0 18px' }}>Per Track</h2>
            {/* Column headers */}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: T.muted2, marginBottom: 10, paddingBottom: 8, borderBottom: `1px solid ${T.border}` }}>
              <span>Track</span>
              <div style={{ display: 'flex', gap: 16 }}>
                <span style={{ color: T.info }}>Listeners</span>
                <span style={{ color: T.accent }}>Plays</span>
              </div>
            </div>
            {tracksLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: T.muted, fontSize: 14 }}>
                <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> Loading...
              </div>
            ) : tracks.length === 0 ? (
              <div style={{ color: T.muted, fontSize: 14 }}>No track data yet.</div>
            ) : (
              tracks.slice(0, 8).map(t => {
                const maxR = Math.max(...tracks.map(x => x.replays), 1)
                const pct  = Math.max(((t.replays || 0) / maxR) * 100, 2)
                return (
                  <div key={t.id} style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, marginBottom: 5 }}>
                      <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '55%', color: T.text }}>{t.title}</span>
                      <div style={{ display: 'flex', gap: 14, flexShrink: 0 }}>
                        <span style={{ color: T.info }}>{(t.streams || 0).toLocaleString()}</span>
                        <span style={{ color: T.accent }}>{(t.replays || 0).toLocaleString()}</span>
                      </div>
                    </div>
                    <div style={{ height: 4, background: T.border2, borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, ${T.accent}, ${T.accent2})`, borderRadius: 2, transition: 'width 0.5s ease' }} />
                    </div>
                  </div>
                )
              })
            )}
            {tracks.length > 0 && (
              <div style={{ marginTop: 6, fontSize: 12, color: T.muted }}>
                {tracks.length} track{tracks.length !== 1 ? 's' : ''} · {totalStreams.toLocaleString()} unique listeners · {totalReplays.toLocaleString()} total plays
              </div>
            )}
          </div>

          {/* Audience insight */}
          <div style={card}>
            <h2 style={{ fontFamily: "'Poppins', sans-serif", fontSize: 16, fontWeight: 700, color: T.text, margin: '0 0 18px' }}>Audience Insight</h2>
            {[
              ['Total Tracks',          tracks.length > 0 ? `${tracks.length}` : '—'],
              ['Unique Listeners',       totalStreams > 0 ? totalStreams.toLocaleString() : '—'],
              ['Total Plays',            totalReplays > 0 ? totalReplays.toLocaleString() : '—'],
              ['Repeat Plays',           repeatPlays > 0 ? repeatPlays.toLocaleString() : '0'],
              ['Repeat Rate',            totalReplays > 0 ? `${((repeatPlays / totalReplays) * 100).toFixed(1)}%` : '—'],
              ["Today's Listeners",      analyticsLoading ? 'Loading...' : todayStreams.toLocaleString()],
              ["Today's Plays",          analyticsLoading ? 'Loading...' : todayReplays.toLocaleString()],
              ['This Week (listeners)',  analyticsLoading ? 'Loading...' : weekStreams.toLocaleString()],
              ['This Week (plays)',      analyticsLoading ? 'Loading...' : weekReplays.toLocaleString()],
              ['Top Genre',              tracksLoading ? '—' : topGenre],
              ['Avg Plays / Track',      tracks.length > 0 ? avgReplays.toLocaleString() : '—'],
              ['$GOA Earned',            totalGoa > 0 ? `${totalGoa.toLocaleString()} $GOA` : '—'],
            ].map(([label, val]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, marginBottom: 11, paddingBottom: 11, borderBottom: `1px solid ${T.border}` }}>
                <span style={{ color: T.muted }}>{label}</span>
                <span style={{ fontWeight: 600, color: T.text }}>{val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ── EARNINGS ──────────────────────────────────────────────────────────────
  function PageEarnings() {
  // Local state — all payout UI lives here
  const [payoutGateway, setPayoutGateway]      = useState<'stripe' | 'flutterwave'>('flutterwave')
  const [payoutAmount, setPayoutAmount]         = useState('')
  const [payoutCurrency, setPayoutCurrency]     = useState('GHS')
  const [payoutAccount, setPayoutAccount]       = useState('')
  const [payoutName, setPayoutName]             = useState('')
  const [payoutPhone, setPayoutPhone]           = useState('')
  const [payoutBank, setPayoutBank]             = useState('')
  const [payoutProcessing, setPayoutProcessing] = useState(false)
  const [payoutSuccess, setPayoutSuccess]       = useState(false)
  const [payoutError, setPayoutError]           = useState('')
 
  // Minimum payout threshold (in $GOA)
  const MIN_PAYOUT = 500
  const canPayout  = totalGoa >= MIN_PAYOUT && !tracksLoading
 
  // Flutterwave currencies for Africa / global
  const fwCurrencies = ['GHS', 'NGN', 'KES', 'UGX', 'TZS', 'XOF', 'USD', 'GBP', 'EUR', 'ZAR']
  // Stripe currencies
  const stripeCurrencies = ['USD', 'GBP', 'EUR', 'CAD', 'AUD', 'SGD']
 
  const currencies = payoutGateway === 'stripe' ? stripeCurrencies : fwCurrencies
 
  // Approximate GOA → USD rate (placeholder; wire up a real oracle)
  const GOA_USD_RATE = 0.012
  const estimatedUSD = payoutAmount ? (parseFloat(payoutAmount) * GOA_USD_RATE).toFixed(2) : '0.00'
 
  async function handlePayout() {
    setPayoutError('')
    if (!payoutAmount || parseFloat(payoutAmount) < MIN_PAYOUT) {
      setPayoutError(`Minimum payout is ${MIN_PAYOUT} $GOA.`)
      return
    }
    if (!payoutName.trim()) { setPayoutError('Full name is required.'); return }
    if (payoutGateway === 'flutterwave' && !payoutPhone.trim()) {
      setPayoutError('Mobile money number is required.'); return
    }
    if (payoutGateway === 'stripe' && !payoutAccount.trim()) {
      setPayoutError('Stripe account ID or IBAN is required.'); return
    }
 
    setPayoutProcessing(true)
    // TODO: replace with real API call to your backend payout endpoint
    await new Promise(r => setTimeout(r, 2200))
    setPayoutProcessing(false)
    setPayoutSuccess(true)
    setTimeout(() => setPayoutSuccess(false), 5000)
  }
 
  // ── Shared sub-styles ────────────────────────────────────────────────────
  const sectionLabel: React.CSSProperties = {
    fontSize: 11, color: T.muted, textTransform: 'uppercase',
    letterSpacing: '0.06em', fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
    marginBottom: 6,
  }
 
  const fieldWrap: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 6 }
 
  const gatewayBtn = (active: boolean, color: string): React.CSSProperties => ({
    flex: 1,
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
    padding: '14px 16px',
    borderRadius: 12,
    border: `1px solid ${active ? color : T.border}`,
    background: active ? `${color}12` : T.bg2,
    cursor: 'pointer',
    transition: 'all 0.18s',
    fontFamily: "'DM Sans', sans-serif",
  })
 
  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* ── Page header ── */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: "'Poppins', sans-serif", fontSize: 'clamp(22px, 4vw, 28px)', fontWeight: 800, color: T.text, margin: 0 }}>
          Earnings
        </h1>
        <p style={{ fontSize: 14, color: T.muted, marginTop: 4 }}>Your $GOA royalties and payout management</p>
      </div>
 
      {/* ── Total earned hero ── */}
      <div style={{ ...card, marginBottom: 16 }}>
        <div style={{ textAlign: 'center', padding: '12px 0 24px' }}>
          <div style={{ fontSize: 11, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10, fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>
            Total Royalties Earned
          </div>
          <div style={{ fontFamily: "'Poppins', sans-serif", fontSize: 'clamp(42px, 10vw, 60px)', fontWeight: 800, lineHeight: 1, color: T.text }}>
            {tracksLoading ? '—' : totalGoa.toLocaleString()}
          </div>
          <div style={{ fontSize: 16, color: T.accent, fontWeight: 700, marginTop: 6 }}>$GOA</div>
          <div style={{ fontSize: 12, color: T.muted, marginTop: 8 }}>
            ≈ ${tracksLoading ? '—' : (totalGoa * GOA_USD_RATE).toFixed(2)} USD at current rate
          </div>
        </div>
 
        {/* Stat grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12 }}>
          {[
            { label: 'This Month',     value: tracksLoading ? '—' : monthlyGoa, token: '$GOA' },
            { label: 'Last Month',     value: '—',                              token: '$GOA' },
            { label: '$ZLT Earned',    value: tracksLoading ? '—' : zltEarned,  token: '$ZLT' },
            { label: 'Pending Payout', value: '—',                              token: 'Review in 30 days' },
          ].map(item => (
            <div key={item.label} style={{ background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 10, padding: '14px 16px' }}>
              <div style={{ fontSize: 12, color: T.muted, marginBottom: 8 }}>{item.label}</div>
              <div style={{ fontFamily: "'Poppins', sans-serif", fontSize: 20, fontWeight: 700, color: T.text }}>{item.value}</div>
              <div style={{ fontSize: 11, color: T.muted2, marginTop: 2 }}>{item.token}</div>
            </div>
          ))}
        </div>
      </div>
 
      {/* ── PAYOUT GATEWAY ────────────────────────────────────────────────── */}
      <div style={{ ...card, marginBottom: 16 }}>
 
        {/* Section header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22, flexWrap: 'wrap', gap: 10 }}>
          <div>
            <h2 style={{ fontFamily: "'Poppins', sans-serif", fontSize: 17, fontWeight: 700, color: T.text, margin: '0 0 4px' }}>
              Request Payout
            </h2>
            <p style={{ fontSize: 13, color: T.muted, margin: 0 }}>
              Withdraw your $GOA royalties directly to your bank or mobile wallet
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 20, background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.18)' }}>
            <ShieldCheck size={13} color={T.success} />
            <span style={{ fontSize: 12, color: T.success, fontWeight: 600 }}>Secured</span>
          </div>
        </div>
 
        {/* Minimum threshold notice */}
        {!canPayout && !tracksLoading && (
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '12px 16px', borderRadius: 10, background: 'rgba(255,215,0,0.05)', border: `1px solid rgba(255,215,0,0.18)`, marginBottom: 22 }}>
            <Info size={15} color={T.accent} style={{ flexShrink: 0, marginTop: 1 }} />
            <div style={{ fontSize: 13, color: T.muted, lineHeight: 1.6 }}>
              You need at least <span style={{ color: T.accent, fontWeight: 600 }}>{MIN_PAYOUT} $GOA</span> to request a payout.
              You currently have <span style={{ color: T.text, fontWeight: 600 }}>{totalGoa} $GOA</span>.
              Keep releasing and growing your fanbase to unlock withdrawals.
            </div>
          </div>
        )}
 
        {/* Gateway selector */}
        <div style={{ marginBottom: 22 }}>
          <p style={{ ...sectionLabel, marginBottom: 10 }}>Select Payout Method</p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
 
            {/* Flutterwave */}
            <button
              onClick={() => { setPayoutGateway('flutterwave'); setPayoutCurrency('GHS') }}
              style={gatewayBtn(payoutGateway === 'flutterwave', '#f5a623')}
            >
              {/* Flutterwave logo */}
              <Image src={flutterwaveLogo} alt="Flutterwave" width={20} height={20} style={{ borderRadius: 4, objectFit: 'contain' }} />
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: payoutGateway === 'flutterwave' ? T.text : T.muted }}>Flutterwave</div>
                <div style={{ fontSize: 11, color: T.muted }}>Mobile money · Bank transfer</div>
              </div>
              {payoutGateway === 'flutterwave' && (
                <span style={{ marginLeft: 'auto', width: 18, height: 18, borderRadius: '50%', background: '#f5a623', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Check size={10} color="#fff" />
                </span>
              )}
            </button>
 
            {/* Stripe */}
            <button
              onClick={() => { setPayoutGateway('stripe'); setPayoutCurrency('USD') }}
              style={gatewayBtn(payoutGateway === 'stripe', '#635bff')}
            >
              {/* Stripe wordmark SVG */}
              <svg width="20" height="20" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" rx="6" fill="#635bff"/>
                <path d="M15.2 13.2c0-.88.72-1.2 1.92-1.2 1.72 0 3.44.52 4.88 1.4V9.08A13.08 13.08 0 0017.12 8c-4.32 0-7.12 2.28-7.12 6.08 0 5.92 8.16 4.96 8.16 7.52 0 1.04-.88 1.4-2.16 1.4-1.84 0-3.84-.76-5.52-1.84v4.36c1.88.8 3.76 1.16 5.52 1.16 4.4 0 7.44-2.2 7.44-6.04-.04-6.4-8.24-5.24-8.24-7.44z" fill="#fff"/>
              </svg>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: payoutGateway === 'stripe' ? T.text : T.muted }}>Stripe</div>
                <div style={{ fontSize: 11, color: T.muted }}>Bank · Card · International</div>
              </div>
              {payoutGateway === 'stripe' && (
                <span style={{ marginLeft: 'auto', width: 18, height: 18, borderRadius: '50%', background: '#635bff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Check size={10} color="#fff" />
                </span>
              )}
            </button>
          </div>
        </div>
 
        {/* Divider */}
        <div style={{ height: 1, background: T.border, marginBottom: 22 }} />
 
        {/* Payout form */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 20 }}>
 
          {/* Amount + currency */}
          <div style={fieldWrap}>
            <label style={sectionLabel}>Amount ($GOA)</label>
            <div style={{ display: 'flex', gap: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', padding: '0 12px', background: T.bg3, border: `1px solid ${T.border2}`, borderRight: 'none', borderRadius: '10px 0 0 10px' }}>
                <Coins size={14} color={T.accent} />
              </div>
              <input
                style={{ ...inputStyle, borderRadius: '0 10px 10px 0', flex: 1 }}
                type="number"
                min={MIN_PAYOUT}
                max={totalGoa}
                value={payoutAmount}
                onChange={e => setPayoutAmount(e.target.value)}
                placeholder={`Min ${MIN_PAYOUT}`}
                disabled={!canPayout}
              />
            </div>
            {payoutAmount && (
              <div style={{ fontSize: 12, color: T.muted, display: 'flex', alignItems: 'center', gap: 5 }}>
                <DollarSign size={11} color={T.success} />
                ≈ ${estimatedUSD} {payoutCurrency}
              </div>
            )}
          </div>
 
          {/* Currency */}
          <div style={fieldWrap}>
            <label style={sectionLabel}>Payout Currency</label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center' }}>
                <Globe size={14} color={T.muted} />
              </div>
              <select
                style={{ ...inputStyle, paddingLeft: 36, appearance: 'none' }}
                value={payoutCurrency}
                onChange={e => setPayoutCurrency(e.target.value)}
                disabled={!canPayout}
              >
                {currencies.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                <ChevronDown size={14} color={T.muted} />
              </div>
            </div>
          </div>
 
          {/* Full name */}
          <div style={fieldWrap}>
            <label style={sectionLabel}>Full Name</label>
            <input
              style={inputStyle}
              value={payoutName}
              onChange={e => setPayoutName(e.target.value)}
              placeholder="As on your bank / wallet"
              disabled={!canPayout}
            />
          </div>
 
          {/* Flutterwave fields */}
          {payoutGateway === 'flutterwave' && (
            <>
              <div style={fieldWrap}>
                <label style={sectionLabel}>Mobile Money / Account Number</label>
                <div style={{ display: 'flex', gap: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', padding: '0 12px', background: T.bg3, border: `1px solid ${T.border2}`, borderRight: 'none', borderRadius: '10px 0 0 10px' }}>
                    <Phone size={14} color={T.muted} />
                  </div>
                  <input
                    style={{ ...inputStyle, borderRadius: '0 10px 10px 0', flex: 1 }}
                    value={payoutPhone}
                    onChange={e => setPayoutPhone(e.target.value)}
                    placeholder="+233 XX XXX XXXX"
                    disabled={!canPayout}
                  />
                </div>
              </div>
 
              <div style={fieldWrap}>
                <label style={sectionLabel}>Bank Name (optional)</label>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}>
                    <Building2 size={14} color={T.muted} />
                  </div>
                  <input
                    style={{ ...inputStyle, paddingLeft: 36 }}
                    value={payoutBank}
                    onChange={e => setPayoutBank(e.target.value)}
                    placeholder="e.g. GCB Bank, GTBank"
                    disabled={!canPayout}
                  />
                </div>
              </div>
            </>
          )}
 
          {/* Stripe fields */}
          {payoutGateway === 'stripe' && (
            <>
              <div style={fieldWrap}>
                <label style={sectionLabel}>Stripe Account ID or IBAN</label>
                <div style={{ display: 'flex', gap: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', padding: '0 12px', background: T.bg3, border: `1px solid ${T.border2}`, borderRight: 'none', borderRadius: '10px 0 0 10px' }}>
                    <Hash size={14} color={T.muted} />
                  </div>
                  <input
                    style={{ ...inputStyle, borderRadius: '0 10px 10px 0', flex: 1 }}
                    value={payoutAccount}
                    onChange={e => setPayoutAccount(e.target.value)}
                    placeholder="acct_XXXXXXXX or GB00 XXXX..."
                    disabled={!canPayout}
                  />
                </div>
              </div>
 
              <div style={fieldWrap}>
                <label style={sectionLabel}>Bank Name</label>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}>
                    <Building2 size={14} color={T.muted} />
                  </div>
                  <input
                    style={{ ...inputStyle, paddingLeft: 36 }}
                    value={payoutBank}
                    onChange={e => setPayoutBank(e.target.value)}
                    placeholder="e.g. Barclays, Chase"
                    disabled={!canPayout}
                  />
                </div>
              </div>
            </>
          )}
        </div>
 
        {/* Fee disclosure */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '12px 16px', borderRadius: 10, background: T.bg2, border: `1px solid ${T.border}`, marginBottom: 20 }}>
          <Info size={14} color={T.muted} style={{ flexShrink: 0, marginTop: 1 }} />
          <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.7 }}>
            <span style={{ color: T.text, fontWeight: 600 }}>Processing fees:</span>
            {' '}Flutterwave charges 1.4% (capped at $20). Stripe charges 0.25% + $0.25 per transfer.
            Payout requests are reviewed within 1–3 business days. Goaradio allocates 75% of revenue to artists — 85% for exclusive releases.
          </div>
        </div>
 
        {/* Error */}
        {payoutError && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '10px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.07)', border: `1px solid rgba(239,68,68,0.2)`, marginBottom: 16, fontSize: 13, color: T.danger }}>
            <AlertCircle size={14} style={{ flexShrink: 0 }} />
            {payoutError}
          </div>
        )}
 
        {/* Success */}
        {payoutSuccess && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '12px 16px', borderRadius: 10, background: 'rgba(34,197,94,0.07)', border: `1px solid rgba(34,197,94,0.2)`, marginBottom: 16, fontSize: 13, color: T.success }}>
            <Check size={14} style={{ flexShrink: 0 }} />
            Payout request submitted. Your royalties will arrive within 1–3 business days after verification.
          </div>
        )}
 
        {/* Submit */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 12, color: T.muted, display: 'flex', alignItems: 'center', gap: 6 }}>
            <ShieldCheck size={13} color={T.muted} />
            256-bit encrypted · PCI DSS compliant
          </div>
          <button
            onClick={handlePayout}
            disabled={!canPayout || payoutProcessing}
            style={{
              ...btnGold,
              padding: '12px 28px',
              fontSize: 14,
              opacity: (!canPayout || payoutProcessing) ? 0.5 : 1,
              cursor: (!canPayout || payoutProcessing) ? 'not-allowed' : 'pointer',
              background: payoutGateway === 'stripe' ? '#635bff' : T.accent,
              color: payoutGateway === 'stripe' ? '#fff' : '#080808',
            }}
          >
            {payoutProcessing
              ? <Loader2 size={15} style={{ animation: 'spin 0.8s linear infinite' }} />
              : <ArrowDownToLine size={15} />
            }
            {payoutProcessing ? 'Processing...' : 'Request Payout'}
          </button>
        </div>
      </div>
 
      {/* ── Payout history placeholder ── */}
      <div style={{ ...card, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 8 }}>
          <h2 style={{ fontFamily: "'Poppins', sans-serif", fontSize: 16, fontWeight: 700, color: T.text, margin: 0 }}>
            Payout History
          </h2>
          <span style={{ fontSize: 12, color: T.muted }}>Last 6 months</span>
        </div>
 
        {/* Column headers */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 80px 90px', gap: 8, padding: '8px 12px', borderRadius: 8, background: T.bg2, marginBottom: 8 }}>
          {['Date', 'Amount', 'Method', 'Status'].map(h => (
            <span key={h} style={{ fontSize: 11, color: T.muted2, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</span>
          ))}
        </div>
 
        {/* Empty state */}
        <div style={{ textAlign: 'center', padding: '32px 0', color: T.muted }}>
          <Wallet size={30} style={{ opacity: 0.25, marginBottom: 10 }} />
          <p style={{ fontSize: 14, margin: 0 }}>No payouts yet. Submit your first withdrawal request above.</p>
        </div>
      </div>
 
      {/* ── How earnings work ── */}
      <div style={card}>
        <h2 style={{ fontFamily: "'Poppins', sans-serif", fontSize: 16, fontWeight: 700, color: T.text, margin: '0 0 18px' }}>
          How Your Royalties Work
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[
            ['Fans stream your tracks',        'Every unique stream on Goaradio is logged in real-time and credited to your royalty balance.'],
            ['$GOA tokens are allocated',       'Using our small pool model, your share is calculated directly from the listening time your fans spend on your music each 30-day epoch — not diluted across the entire platform.'],
            ['Choose your payout method',       'Select Flutterwave for African mobile money and bank transfers, or Stripe for international bank payouts.'],
            ['Withdraw your royalties',         'Submit a payout request once you reach the 500 $GOA threshold. Funds arrive within 1–3 business days after verification.'],
          ].map(([title, sub], i) => (
            <div key={title} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, flexShrink: 0, background: 'rgba(255,215,0,0.08)', border: `1px solid rgba(255,215,0,0.15)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: T.accent, fontFamily: "'Poppins', sans-serif" }}>
                {i + 1}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 3 }}>{title}</div>
                <div style={{ fontSize: 13, color: T.muted, lineHeight: 1.6 }}>{sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

  // ── TRACKS ────────────────────────────────────────────────────────────────
  function PageTracks() {
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, gap: 12, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontFamily: "'Poppins', sans-serif", fontSize: 'clamp(22px, 4vw, 28px)', fontWeight: 800, color: T.text, margin: 0 }}>My Tracks</h1>
            <p style={{ fontSize: 14, color: T.muted, marginTop: 4 }}>Manage your music on Goaradio</p>
          </div>
          <button onClick={() => setCurrentPage('upload')} style={btnGold}><Plus size={14} /> Upload Track</button>
        </div>
        {/* Column header legend */}
        {tracks.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 16, fontSize: 11, color: T.muted2, marginBottom: 8, paddingRight: 4 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Users size={10} color={T.info} /> Listeners</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Repeat2 size={10} /> Total Plays</span>
          </div>
        )}
        <div style={card}>
          {tracksLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: T.muted, padding: '32px 0', fontSize: 14 }}>
              <Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> Loading your tracks...
            </div>
          ) : tracks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 24px' }}>
              <Music2 size={40} style={{ color: T.muted2, marginBottom: 14 }} />
              <h3 style={{ fontFamily: "'Poppins', sans-serif", fontSize: 17, color: T.text, margin: '0 0 8px' }}>No tracks yet</h3>
              <p style={{ fontSize: 14, color: T.muted, marginBottom: 20 }}>Upload your first track to get started on Goaradio.</p>
              <button onClick={() => setCurrentPage('upload')} style={btnGold}><Upload size={14} /> Upload First Track</button>
            </div>
          ) : (
            tracks.map((t, i) => <TrackRow key={t.id} track={t} index={i} />)
          )}
        </div>
      </div>
    )
  }

  // ── UPLOAD ────────────────────────────────────────────────────────────────
  function PageUpload() {
    return (
      <div>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontFamily: "'Poppins', sans-serif", fontSize: 'clamp(22px, 4vw, 28px)', fontWeight: 800, color: T.text, margin: 0 }}>Upload Track</h1>
          <p style={{ fontSize: 14, color: T.muted, marginTop: 4 }}>Add a new song to your Goaradio profile</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 16 }}>
          <div style={card}>
            <h2 style={{ fontFamily: "'Poppins', sans-serif", fontSize: 15, fontWeight: 700, color: T.text, margin: '0 0 18px' }}>Track Details</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, color: T.muted, display: 'block', marginBottom: 6, fontWeight: 500 }}>Track Title *</label>
                <input style={inputStyle} value={uploadTitle} onChange={e => setUploadTitle(e.target.value)} placeholder="Enter track name" />
              </div>
              <div>
                <label style={{ fontSize: 12, color: T.muted, display: 'block', marginBottom: 6, fontWeight: 500 }}>Genre</label>
                <select style={{ ...inputStyle, appearance: 'none' }} value={uploadGenre} onChange={e => setUploadGenre(e.target.value)}>
                  <option value="">Select genre</option>
                  {['Afrobeats','Afropop','Highlife','Dancehall','Hip Hop','Amapiano','Gospel','R&B','Reggae','Other'].map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, color: T.muted, display: 'block', marginBottom: 6, fontWeight: 500 }}>Duration (e.g. 3:45)</label>
                <input style={inputStyle} value={uploadDuration} onChange={e => setUploadDuration(e.target.value)} placeholder="3:45" />
              </div>
              <div>
                <label style={{ fontSize: 12, color: T.muted, display: 'block', marginBottom: 6, fontWeight: 500 }}>Audio URL *</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input style={inputStyle} value={uploadAudio} onChange={e => setUploadAudio(e.target.value)} placeholder="https://... (MP3 link)" />
                  <button onClick={() => { if (uploadAudio) setAudioPreviewUrl(uploadAudio) }} style={{ ...btnGhost, flexShrink: 0, padding: '10px 12px' }}><Play size={13} /></button>
                </div>
                {audioPreviewUrl && <audio src={audioPreviewUrl} controls style={{ width: '100%', marginTop: 8, accentColor: T.accent }} />}
              </div>
            </div>
          </div>
          <div style={card}>
            <h2 style={{ fontFamily: "'Poppins', sans-serif", fontSize: 15, fontWeight: 700, color: T.text, margin: '0 0 18px' }}>Cover Art</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, color: T.muted, display: 'block', marginBottom: 6, fontWeight: 500 }}>Cover Image URL</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input style={inputStyle} value={uploadCover} onChange={e => setUploadCover(e.target.value)} placeholder="https://... (image link)" />
                  <button onClick={() => { if (uploadCover) setCoverPreviewUrl(uploadCover) }} style={{ ...btnGhost, flexShrink: 0, padding: '10px 12px' }}><Check size={13} /></button>
                </div>
              </div>
              {coverPreviewUrl ? (
                <img src={coverPreviewUrl} alt="Cover preview" style={{ width: 130, height: 130, borderRadius: 12, objectFit: 'cover', border: `1px solid ${T.border2}` }} />
              ) : (
                <div style={{ border: `2px dashed ${T.border2}`, borderRadius: 12, padding: '32px 24px', textAlign: 'center', color: T.muted }}>
                  <Upload size={28} style={{ opacity: 0.4, marginBottom: 8 }} />
                  <p style={{ fontSize: 13, margin: '0 0 4px' }}>Paste a URL above to preview</p>
                  <p style={{ fontSize: 12, color: T.muted2 }}>JPG, PNG, WEBP recommended</p>
                </div>
              )}
              <p style={{ fontSize: 12, color: T.muted2 }}>
                Host images on{' '}
                <a href="https://imgur.com" target="_blank" rel="noreferrer" style={{ color: T.accent, textDecoration: 'none' }}>Imgur</a>
                {' '}or{' '}
                <a href="https://cloudinary.com" target="_blank" rel="noreferrer" style={{ color: T.accent, textDecoration: 'none' }}>Cloudinary</a>.
              </p>
            </div>
          </div>
        </div>
        <div style={{ ...card, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: T.text, marginBottom: 4 }}>Ready to publish?</div>
            <div style={{ fontSize: 13, color: T.muted }}>This will add the track to your Airtable record and make it visible on Goaradio.</div>
          </div>
          <button onClick={handleUpload} disabled={uploading} style={{ ...btnGold, padding: '12px 24px', fontSize: 14, opacity: uploading ? 0.7 : 1 }}>
            {uploading ? <Loader2 size={15} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Send size={15} />}
            {uploading ? 'Publishing...' : 'Publish Track'}
          </button>
          {uploadProgress > 0 && (
            <div style={{ width: '100%', height: 4, background: T.border2, borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${uploadProgress}%`, background: `linear-gradient(90deg, ${T.accent}, ${T.accent2})`, borderRadius: 2, transition: 'width 0.3s' }} />
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── PROFILE ────────────────────────────────────────────────────────────────
  function PageProfile() {
    const displayPic   = profPicUrl   || picSrc
    const displayCover = profCoverUrl || coverSrc
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, gap: 12, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontFamily: "'Poppins', sans-serif", fontSize: 'clamp(22px, 4vw, 28px)', fontWeight: 800, color: T.text, margin: 0 }}>Edit Profile</h1>
            <p style={{ fontSize: 14, color: T.muted, marginTop: 4 }}>Changes sync to your Goaradio artist page</p>
          </div>
          <button onClick={saveProfile} disabled={savingProfile} style={{ ...btnGold, opacity: savingProfile ? 0.7 : 1 }}>
            {savingProfile ? <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Save size={14} />}
            {savingProfile ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
        <div style={card}>
          <div style={{ position: 'relative', height: 180, borderRadius: 12, overflow: 'hidden', marginBottom: 20, background: T.bg3, border: displayCover ? 'none' : `2px dashed ${T.border2}` }}>
            {displayCover ? (
              <img src={displayCover} alt="Cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setProfCoverUrl('')} />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, color: T.muted }}>
                <Mic2 size={32} style={{ opacity: 0.3 }} />
                <span style={{ fontSize: 13 }}>No cover art set</span>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 18, marginBottom: 22 }}>
            <img src={displayPic} alt={artistName} onError={e => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(artistName)}&background=1a1800&color=ffd700&size=200` }} style={{ width: 90, height: 90, borderRadius: '50%', objectFit: 'cover', border: `3px solid ${T.bg}`, background: T.bg3, flexShrink: 0 }} />
            <div>
              <div style={{ fontFamily: "'Poppins', sans-serif", fontSize: 20, fontWeight: 700, color: T.text }}>{profArtistName || artistName}</div>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 6, padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: verified ? 'rgba(34,197,94,0.08)' : 'rgba(255,215,0,0.08)', color: verified ? T.success : T.accent, border: `1px solid ${verified ? 'rgba(34,197,94,0.2)' : 'rgba(255,215,0,0.2)'}` }}>
                {verified ? <BadgeCheck size={11} /> : <Clock size={11} />}
                {verified ? 'Verified' : 'Pending Verification'}
              </span>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14, padding: '16px', background: T.bg2, borderRadius: 12, border: `1px solid ${T.border}`, marginBottom: 22 }}>
            <div>
              <label style={{ fontSize: 12, color: T.muted, display: 'block', marginBottom: 6, fontWeight: 500 }}>Profile Pic URL</label>
              <input style={inputStyle} value={profPicUrl} onChange={e => setProfPicUrl(e.target.value)} placeholder="https://..." />
            </div>
            <div>
              <label style={{ fontSize: 12, color: T.muted, display: 'block', marginBottom: 6, fontWeight: 500 }}>Cover Art URL</label>
              <input style={inputStyle} value={profCoverUrl} onChange={e => setProfCoverUrl(e.target.value)} placeholder="https://..." />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
            <div>
              <label style={{ fontSize: 12, color: T.muted, display: 'block', marginBottom: 6, fontWeight: 500 }}>Artist / Stage Name</label>
              <input style={inputStyle} value={profArtistName} onChange={e => setProfArtistName(e.target.value)} placeholder="Your artist name" />
            </div>
            <div>
              <label style={{ fontSize: 12, color: T.muted, display: 'block', marginBottom: 6, fontWeight: 500 }}>Genre</label>
              <input style={inputStyle} value={profGenre} onChange={e => setProfGenre(e.target.value)} placeholder="e.g. Afrobeats, Highlife" />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: 12, color: T.muted, display: 'block', marginBottom: 6, fontWeight: 500 }}>Bio</label>
              <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: 80 }} value={profBio} onChange={e => setProfBio(e.target.value)} placeholder="Tell fans about yourself..." rows={3} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: T.muted, display: 'block', marginBottom: 6, fontWeight: 500 }}>Instagram</label>
              <input style={inputStyle} value={profInstagram} onChange={e => setProfInstagram(e.target.value)} placeholder="@yourhandle" />
            </div>
            <div>
              <label style={{ fontSize: 12, color: T.muted, display: 'block', marginBottom: 6, fontWeight: 500 }}>X (Twitter)</label>
              <input style={inputStyle} value={profTwitter} onChange={e => setProfTwitter(e.target.value)} placeholder="@yourhandle" />
            </div>
            <div>
              <label style={{ fontSize: 12, color: T.muted, display: 'block', marginBottom: 6, fontWeight: 500 }}>Spotify Link</label>
              <input style={inputStyle} value={profSpotify} onChange={e => setProfSpotify(e.target.value)} placeholder="https://open.spotify.com/artist/..." />
            </div>
            <div>
              <label style={{ fontSize: 12, color: T.muted, display: 'block', marginBottom: 6, fontWeight: 500 }}>YouTube</label>
              <input style={inputStyle} value={profYoutube} onChange={e => setProfYoutube(e.target.value)} placeholder="https://youtube.com/@..." />
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
        @keyframes spin     { to { transform: rotate(360deg); } }
        @keyframes pulseDot { 0%,100% { opacity:1; } 50% { opacity:0.3; } }
        @keyframes slideIn  { from { transform: translateY(12px); opacity:0; } to { transform:translateY(0); opacity:1; } }
        * { box-sizing: border-box; }
        body { background: ${T.bg} !important; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${T.muted2}; border-radius: 2px; }
        input::placeholder, textarea::placeholder { color: ${T.muted2} !important; }
        input, textarea, select { color-scheme: dark; }
        option { background: #111 !important; }
        @media (max-width: 900px) {
          .goa-sidebar { width: 200px !important; }
          .goa-main    { margin-left: 200px !important; padding: 24px 20px !important; }
        }
        @media (max-width: 700px) {
          .goa-sidebar     { display: none !important; }
          .goa-main        { margin-left: 0 !important; padding: 16px !important; }
          .goa-mobile-bar  { display: flex !important; }
        }
        @media (max-width: 600px) {
  .goa-payout-history { grid-template-columns: 1fr 80px 70px !important; }
}
        @media (max-width: 600px) {
  .goa-profile-grid { grid-template-columns: 1fr !important; }
}
      `}</style>

      <div style={{ display: 'flex', minHeight: '100vh', background: T.bg, fontFamily: "'DM Sans', sans-serif" }}>

        {/* Desktop sidebar */}
        <aside className="goa-sidebar" style={{ position: 'fixed', left: 0, top: 0, bottom: 0, width: 224, background: T.bg2, borderRight: `1px solid ${T.border}`, padding: '24px 16px', zIndex: 50, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          <SidebarContent />
        </aside>

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <>
            <div onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', zIndex: 98 }} />
            <aside style={{ position: 'fixed', left: 0, top: 0, bottom: 0, width: 224, background: T.bg2, borderRight: `1px solid ${T.border}`, padding: '24px 16px', zIndex: 99, overflowY: 'auto', display: 'flex', flexDirection: 'column', animation: 'slideIn 0.2s ease' }}>
              <button onClick={() => setSidebarOpen(false)} style={{ position: 'absolute', top: 16, right: 14, background: 'none', border: 'none', color: T.muted, cursor: 'pointer' }}><X size={18} /></button>
              <SidebarContent />
            </aside>
          </>
        )}

        {/* Main content */}
        <main className="goa-main" style={{ flex: 1, marginLeft: 224, minHeight: '100vh', padding: '32px 32px', maxWidth: '100%' }}>
          {/* Mobile top bar */}
          <div className="goa-mobile-bar" style={{ display: 'none', alignItems: 'center', gap: 12, marginBottom: 20, paddingBottom: 16, borderBottom: `1px solid ${T.border}` }}>
            <button onClick={() => setSidebarOpen(true)} style={{ background: 'none', border: `1px solid ${T.border}`, borderRadius: 8, padding: '7px 9px', color: T.text, cursor: 'pointer', display: 'flex' }}><Menu size={18} /></button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 28, height: 28, position: 'relative', flexShrink: 0 }}>
                <Image src={goaradioLogo} alt="Goaradio logo" fill priority quality={100} style={{ objectFit: 'contain' }} />
              </div>
              <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 15, color: T.text }}>Goaradio</span>
            </div>
          </div>

          {currentPage === 'overview'  && <PageOverview />}
          {currentPage === 'analytics' && <PageAnalytics />}
          {currentPage === 'earnings'  && <PageEarnings />}
          {currentPage === 'tracks'    && <PageTracks />}
          {currentPage === 'upload'    && <PageUpload />}
          {currentPage === 'profile'   && <PageProfile />}
        </main>
      </div>

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div onClick={e => { if (e.target === e.currentTarget) setDeleteTarget(null) }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: T.card, border: `1px solid ${T.border2}`, borderRadius: 20, padding: 32, width: '100%', maxWidth: 360, textAlign: 'center', animation: 'slideIn 0.2s ease' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Trash2 size={22} color={T.danger} />
            </div>
            <h3 style={{ fontFamily: "'Poppins', sans-serif", fontSize: 17, color: T.text, margin: '0 0 8px' }}>Remove this track?</h3>
            <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.6, marginBottom: 24 }}>This will delete the track from Airtable and remove it from Goaradio immediately.</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setDeleteTarget(null)} style={{ ...btnGhost, flex: 1, justifyContent: 'center' }}>Cancel</button>
              <button onClick={confirmDelete} disabled={deleteLoading} style={{ ...btnGold, flex: 1, justifyContent: 'center', background: T.danger, color: '#fff' }}>
                {deleteLoading ? <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Trash2 size={14} />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 300, background: T.card2, border: `1px solid ${toast.type === 'success' ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}`, borderRadius: 12, padding: '13px 18px', display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, fontWeight: 500, color: T.text, transform: toast.visible ? 'translateY(0)' : 'translateY(16px)', opacity: toast.visible ? 1 : 0, transition: 'all 0.3s ease', pointerEvents: 'none', maxWidth: 320 }}>
        {toast.type === 'success' ? <Check size={15} color={T.success} /> : <AlertCircle size={15} color={T.danger} />}
        {toast.msg}
      </div>
    </>
  )
}
