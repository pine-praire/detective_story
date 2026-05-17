'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

function RegisterForm() {
  const searchParams = useSearchParams()
  const [eventId, setEventId] = useState('')
  const [eventTitle, setEventTitle] = useState('')
  const [teamName, setTeamName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [members, setMembers] = useState('2')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const id = searchParams.get('event')
    if (id) {
      setEventId(id)
      supabase.from('events').select('title').eq('id', id).single()
        .then(({ data }) => { if (data) setEventTitle(data.title) })
    }
  }, [searchParams])

  async function handleRegister() {
    if (!eventId.trim()) { setError('Event ID is missing. Use the link from your host.'); return }
    if (!teamName.trim()) { setError('Enter team name'); return }
    if (!email.trim()) { setError('Enter email'); return }
    if (!phone.trim()) { setError('Enter phone number'); return }
    if (!members || parseInt(members) < 1) { setError('Enter team size'); return }
    setLoading(true)
    setError('')
    const { data: event, error: eventErr } = await supabase
      .from('events').select('id, title, status').eq('id', eventId.trim()).single()
    if (eventErr || !event) { setLoading(false); setError('Event not found.'); return }
    if (event.status === 'finished') { setLoading(false); setError('This event has already finished.'); return }
    const { data: existing } = await supabase
      .from('teams').select('id').eq('event_id', eventId.trim()).eq('name', teamName.trim()).single()
    if (existing) { setLoading(false); setError('This team name is already taken.'); return }
    const { error: insertErr } = await supabase.from('teams').insert({
      event_id: eventId.trim(),
      name: teamName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      members_count: parseInt(members) || 1,
    })
    setLoading(false)
    if (insertErr) { setError('Registration failed. Try again.'); return }
    setSuccess(true)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '13px 16px',
    background: '#080603',
    border: '1px solid rgba(184,134,11,0.2)',
    borderBottom: '1px solid rgba(184,134,11,0.5)',
    color: '#e8dfc4', fontSize: 15, outline: 'none',
    fontFamily: 'Remington, monospace', letterSpacing: 1,
    boxSizing: 'border-box',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontFamily: 'Cocomat, sans-serif',
    fontWeight: 300,
    fontSize: 10, letterSpacing: 4,
    textTransform: 'uppercase', color: '#7a6a4a', marginBottom: 8,
  }

  const CornerTL = () => (
    <svg style={{ position: 'absolute', top: -10, left: -10 }} width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M0 24 L0 0 L24 0" stroke="#b8860b" strokeWidth="1.5"/>
      <path d="M4 24 L4 4 L24 4" stroke="#b8860b" strokeWidth="0.75" opacity="0.5"/>
    </svg>
  )
  const CornerTR = () => (
    <svg style={{ position: 'absolute', top: -10, right: -10 }} width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M24 24 L24 0 L0 0" stroke="#b8860b" strokeWidth="1.5"/>
      <path d="M20 24 L20 4 L0 4" stroke="#b8860b" strokeWidth="0.75" opacity="0.5"/>
    </svg>
  )
  const CornerBL = () => (
    <svg style={{ position: 'absolute', bottom: -10, left: -10 }} width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M0 0 L0 24 L24 24" stroke="#b8860b" strokeWidth="1.5"/>
      <path d="M4 0 L4 20 L24 20" stroke="#b8860b" strokeWidth="0.75" opacity="0.5"/>
    </svg>
  )
  const CornerBR = () => (
    <svg style={{ position: 'absolute', bottom: -10, right: -10 }} width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M24 0 L24 24 L0 24" stroke="#b8860b" strokeWidth="1.5"/>
      <path d="M20 0 L20 20 L0 20" stroke="#b8860b" strokeWidth="0.75" opacity="0.5"/>
    </svg>
  )

  if (success) return (
    <div style={{
       width: '100vw', minHeight: '100vh', background: '#080603',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  position: 'relative', overflow: 'hidden', padding: '60px 0',
  overflowY: 'auto',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `linear-gradient(rgba(184,134,11,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(184,134,11,0.03) 1px, transparent 1px)`,
        backgroundSize: '40px 40px', pointerEvents: 'none',
      }} />

      <svg style={{ position: 'absolute', top: 24, left: 24 }} width="60" height="60" viewBox="0 0 60 60" fill="none">
        <path d="M2 58 L2 2 L58 2" stroke="#b8860b" strokeWidth="1.5"/>
        <path d="M8 52 L8 8 L52 8" stroke="#b8860b" strokeWidth="0.5" opacity="0.5"/>
      </svg>
      <svg style={{ position: 'absolute', top: 24, right: 24 }} width="60" height="60" viewBox="0 0 60 60" fill="none">
        <path d="M58 58 L58 2 L2 2" stroke="#b8860b" strokeWidth="1.5"/>
        <path d="M52 52 L52 8 L8 8" stroke="#b8860b" strokeWidth="0.5" opacity="0.5"/>
      </svg>
      <svg style={{ position: 'absolute', bottom: 24, left: 24 }} width="60" height="60" viewBox="0 0 60 60" fill="none">
        <path d="M2 2 L2 58 L58 58" stroke="#b8860b" strokeWidth="1.5"/>
        <path d="M8 8 L8 52 L52 52" stroke="#b8860b" strokeWidth="0.5" opacity="0.5"/>
      </svg>
      <svg style={{ position: 'absolute', bottom: 24, right: 24 }} width="60" height="60" viewBox="0 0 60 60" fill="none">
        <path d="M58 2 L58 58 L2 58" stroke="#b8860b" strokeWidth="1.5"/>
        <path d="M52 8 L52 52 L8 52" stroke="#b8860b" strokeWidth="0.5" opacity="0.5"/>
      </svg>

      <div style={{ width: 480, position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 24 }}>
            <div style={{ height: 1, width: 60, background: 'linear-gradient(to right, transparent, #40c070)' }} />
            <svg width="12" height="12" viewBox="0 0 12 12" fill="#40c070">
              <rect x="3" y="0" width="6" height="6" transform="rotate(45 6 6)"/>
            </svg>
            <div style={{ height: 1, width: 60, background: 'linear-gradient(to left, transparent, #40c070)' }} />
          </div>
          <div style={{ fontFamily: 'ParkLane, serif', color: '#40c070', fontSize: 44, letterSpacing: 4, marginBottom: 16 }}>
            Registered
          </div>
          <div style={{ fontFamily: 'Ovo, serif', color: '#DED5BF', fontSize: 15, lineHeight: 1.9, marginBottom: 32 }}>
            Team <strong style={{ color: '#e8dfc4' }}>{teamName}</strong> is registered for<br />
            <strong style={{ color: '#b8860b' }}>{eventTitle}</strong>.<br /><br />
            The host will send you a 6-digit game code before the event starts.
          </div>
        </div>

        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', inset: -2, border: '1px solid rgba(64,192,112,0.3)', pointerEvents: 'none' }} />
          <CornerTL /><CornerTR /><CornerBL /><CornerBR />
          <div style={{ background: '#0d0a06', border: '1px solid rgba(64,192,112,0.15)', padding: '28px 36px' }}>
            <div style={{ fontFamily: 'Cocomat, sans-serif', fontWeight: 300, fontSize: 10, letterSpacing: 4, textTransform: 'uppercase', color: '#40c070', marginBottom: 16 }}>
              What&apos;s next
            </div>
            <div style={{ fontFamily: 'Ovo, serif', color: '#DED5BF', fontSize: 14, lineHeight: 2 }}>
              1. Wait for the host to send the game code<br />
              2. On game day, go to the main page<br />
              3. Enter your team name and code<br />
              4. Start investigating
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 28 }}>
          <a href="/" style={{ fontFamily: 'Cocomat, sans-serif', fontWeight: 200, color: '#5a4a2a', fontSize: 11, letterSpacing: 3, textDecoration: 'none', textTransform: 'uppercase' }}>
            ← Back to login
          </a>
        </div>
      </div>
    </div>
  )

  return (
    <div style={{
      width: '100vw', minHeight: '100vh', background: '#080603',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflow: 'hidden', padding: '60px 0',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `linear-gradient(rgba(184,134,11,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(184,134,11,0.03) 1px, transparent 1px)`,
        backgroundSize: '40px 40px', pointerEvents: 'none',
      }} />

      <svg style={{ position: 'absolute', top: 24, left: 24 }} width="60" height="60" viewBox="0 0 60 60" fill="none">
        <path d="M2 58 L2 2 L58 2" stroke="#b8860b" strokeWidth="1.5"/>
        <path d="M8 52 L8 8 L52 8" stroke="#b8860b" strokeWidth="0.5" opacity="0.5"/>
      </svg>
      <svg style={{ position: 'absolute', top: 24, right: 24 }} width="60" height="60" viewBox="0 0 60 60" fill="none">
        <path d="M58 58 L58 2 L2 2" stroke="#b8860b" strokeWidth="1.5"/>
        <path d="M52 52 L52 8 L8 8" stroke="#b8860b" strokeWidth="0.5" opacity="0.5"/>
      </svg>
      <svg style={{ position: 'absolute', bottom: 24, left: 24 }} width="60" height="60" viewBox="0 0 60 60" fill="none">
        <path d="M2 2 L2 58 L58 58" stroke="#b8860b" strokeWidth="1.5"/>
        <path d="M8 8 L8 52 L52 52" stroke="#b8860b" strokeWidth="0.5" opacity="0.5"/>
      </svg>
      <svg style={{ position: 'absolute', bottom: 24, right: 24 }} width="60" height="60" viewBox="0 0 60 60" fill="none">
        <path d="M58 2 L58 58 L2 58" stroke="#b8860b" strokeWidth="1.5"/>
        <path d="M52 8 L52 52 L8 52" stroke="#b8860b" strokeWidth="0.5" opacity="0.5"/>
      </svg>

      <div style={{ width: 480, position: 'relative', zIndex: 1 }}>

        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 24 }}>
            <div style={{ height: 1, width: 60, background: 'linear-gradient(to right, transparent, #b8860b)' }} />
            <svg width="12" height="12" viewBox="0 0 12 12" fill="#b8860b">
              <rect x="3" y="0" width="6" height="6" transform="rotate(45 6 6)"/>
            </svg>
            <div style={{ height: 1, width: 60, background: 'linear-gradient(to left, transparent, #b8860b)' }} />
          </div>

          <div style={{ fontFamily: 'ParkLane, serif', color: '#c9a84c', fontSize: 52, letterSpacing: 6, lineHeight: 1.1, marginBottom: 12, textShadow: '0 0 40px rgba(184,134,11,0.3)' }}>
            The Casebook
          </div>

          <div style={{ fontFamily: 'Cocomat, sans-serif', fontWeight: 200, color: '#8a7a5a', fontSize: 11, letterSpacing: 6, textTransform: 'uppercase', marginBottom: 8 }}>
            Team Registration
          </div>

          {eventTitle && (
            <div style={{ fontFamily: 'Ovo, serif', color: '#b8860b', fontSize: 14, letterSpacing: 2, marginTop: 6 }}>
              {eventTitle}
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 20 }}>
            <div style={{ height: 1, width: 40, background: 'linear-gradient(to right, transparent, #b8860b)' }} />
            <div style={{ width: 4, height: 4, background: '#b8860b', transform: 'rotate(45deg)' }} />
            <div style={{ height: 1, width: 80, background: '#b8860b' }} />
            <div style={{ width: 4, height: 4, background: '#b8860b', transform: 'rotate(45deg)' }} />
            <div style={{ height: 1, width: 40, background: 'linear-gradient(to left, transparent, #b8860b)' }} />
          </div>
        </div>

        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', inset: -2, border: '1px solid rgba(184,134,11,0.3)', pointerEvents: 'none' }} />
          <CornerTL /><CornerTR /><CornerBL /><CornerBR />

          <div style={{ background: '#0d0a06', border: '1px solid rgba(184,134,11,0.2)', padding: '40px 44px 36px' }}>

            <div style={{ fontFamily: 'Ovo, serif', color: '#7a6a4a', fontSize: 13, lineHeight: 1.8, marginBottom: 32, paddingLeft: 14, borderLeft: '1px solid rgba(184,134,11,0.4)' }}>
              Register your team for the event. You&apos;ll receive a game code from the host before the game starts.
            </div>

            {!eventId && (
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>Event ID</label>
                <input value={eventId} onChange={e => { setEventId(e.target.value); setError('') }}
                  placeholder="Paste the Event ID from your host" style={inputStyle} />
              </div>
            )}

            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Team Name</label>
              <input value={teamName} onChange={e => { setTeamName(e.target.value); setError('') }}
                placeholder="Choose a unique team name" style={inputStyle} />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Email</label>
              <input type="email" value={email} onChange={e => { setEmail(e.target.value); setError('') }}
                placeholder="your@email.com" style={inputStyle} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 32 }}>
              <div>
                <label style={labelStyle}>Phone</label>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                  placeholder="+1 234 567 8900" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Team size</label>
                <input type="number" min="1" max="10" value={members} onChange={e => setMembers(e.target.value)}
                  style={inputStyle} />
              </div>
            </div>

            {error && (
              <div style={{
                color: '#cc6666', fontFamily: 'Cocomat, sans-serif', fontWeight: 300,
                fontSize: 12, marginBottom: 20, padding: '10px 14px',
                border: '1px solid rgba(180,50,50,0.3)', background: 'rgba(100,20,20,0.2)', letterSpacing: 1,
              }}>
                {error}
              </div>
            )}

            <button
  onClick={handleRegister}
  disabled={loading}
  className="btn-deco"
  style={{
    width: '100%', padding: '15px',
    background: loading ? 'transparent' : '#b8860b',
    color: loading ? '#b8860b' : '#080603',
    border: '1px solid #b8860b',
    cursor: loading ? 'default' : 'pointer',
    fontFamily: 'Cocomat, sans-serif', fontWeight: 300,
    fontSize: 12, letterSpacing: 6, textTransform: 'uppercase',
  }}
>
  {loading ? 'Registering...' : 'Register Team'}
            </button>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 28 }}>
          <a href="/" style={{ fontFamily: 'Cocomat, sans-serif', fontWeight: 200, color: '#5a4a2a', fontSize: 11, letterSpacing: 3, textDecoration: 'none', textTransform: 'uppercase' }}>
            ← Back to login
          </a>
        </div>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div style={{ background: '#080603', width: '100vw', height: '100vh' }} />}>
      <RegisterForm />
    </Suspense>
  )
}