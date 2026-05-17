'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const [teamName, setTeamName] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleLogin() {
    if (!teamName.trim() || !code.trim()) { setError('Enter team name and code'); return }
    setLoading(true)
    setError('')
    const { data, error: err } = await supabase
      .from('teams')
      .select('*, events(*)')
      .eq('name', teamName.trim())
      .eq('code', code.trim())
      .single()
    setLoading(false)
    if (err || !data) { setError('Team not found. Check name and code.'); return }
    if (data.events?.status !== 'active') { setError('Game has not started yet. Wait for the host.'); return }
    localStorage.setItem('team', JSON.stringify(data))
    router.push('/board')
  }

  return (
    <div style={{
      width: '100vw', height: '100vh',
      background: '#080603',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Ovo, serif',
      position: 'relative',
      overflow: 'hidden',
    }}>

      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `linear-gradient(rgba(184,134,11,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(184,134,11,0.03) 1px, transparent 1px)`,
        backgroundSize: '40px 40px',
        pointerEvents: 'none',
      }} />

      <svg style={{ position: 'absolute', top: 24, left: 24 }} width="60" height="60" viewBox="0 0 60 60" fill="none">
        <path d="M2 58 L2 2 L58 2" stroke="#b8860b" strokeWidth="1.5"/>
        <path d="M8 52 L8 8 L52 8" stroke="#b8860b" strokeWidth="0.5" opacity="0.5"/>
        <rect x="2" y="2" width="8" height="8" fill="#b8860b" opacity="0.3"/>
      </svg>
      <svg style={{ position: 'absolute', top: 24, right: 24 }} width="60" height="60" viewBox="0 0 60 60" fill="none">
        <path d="M58 58 L58 2 L2 2" stroke="#b8860b" strokeWidth="1.5"/>
        <path d="M52 52 L52 8 L8 8" stroke="#b8860b" strokeWidth="0.5" opacity="0.5"/>
        <rect x="50" y="2" width="8" height="8" fill="#b8860b" opacity="0.3"/>
      </svg>
      <svg style={{ position: 'absolute', bottom: 24, left: 24 }} width="60" height="60" viewBox="0 0 60 60" fill="none">
        <path d="M2 2 L2 58 L58 58" stroke="#b8860b" strokeWidth="1.5"/>
        <path d="M8 8 L8 52 L52 52" stroke="#b8860b" strokeWidth="0.5" opacity="0.5"/>
        <rect x="2" y="50" width="8" height="8" fill="#b8860b" opacity="0.3"/>
      </svg>
      <svg style={{ position: 'absolute', bottom: 24, right: 24 }} width="60" height="60" viewBox="0 0 60 60" fill="none">
        <path d="M58 2 L58 58 L2 58" stroke="#b8860b" strokeWidth="1.5"/>
        <path d="M52 8 L52 52 L8 52" stroke="#b8860b" strokeWidth="0.5" opacity="0.5"/>
        <rect x="50" y="50" width="8" height="8" fill="#b8860b" opacity="0.3"/>
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

          <div style={{
            fontFamily: 'ParkLane, serif',
            color: '#c9a84c',
            fontSize: 52,
            letterSpacing: 6,
            lineHeight: 1.1,
            marginBottom: 12,
            textShadow: '0 0 40px rgba(184,134,11,0.3)',
          }}>
            The Casebook
          </div>

          <div style={{
            fontFamily: 'Cocomat, sans-serif',
            fontWeight: 200,
            color: '#8a7a5a',
            fontSize: 11,
            letterSpacing: 6,
            textTransform: 'uppercase',
            marginBottom: 20,
          }}>
            Pine Praire, Louisiana · 1926
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <div style={{ height: 1, width: 40, background: 'linear-gradient(to right, transparent, #b8860b)' }} />
            <div style={{ width: 4, height: 4, background: '#b8860b', transform: 'rotate(45deg)' }} />
            <div style={{ height: 1, width: 80, background: '#b8860b' }} />
            <div style={{ width: 4, height: 4, background: '#b8860b', transform: 'rotate(45deg)' }} />
            <div style={{ height: 1, width: 40, background: 'linear-gradient(to left, transparent, #b8860b)' }} />
          </div>
        </div>

        <div style={{ position: 'relative' }}>

          <div style={{
            position: 'absolute', inset: -2,
            border: '1px solid rgba(184,134,11,0.3)',
            pointerEvents: 'none',
          }} />

          <svg style={{ position: 'absolute', top: -10, left: -10 }} width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M0 24 L0 0 L24 0" stroke="#b8860b" strokeWidth="1.5"/>
            <path d="M4 24 L4 4 L24 4" stroke="#b8860b" strokeWidth="0.75" opacity="0.5"/>
          </svg>
          <svg style={{ position: 'absolute', top: -10, right: -10 }} width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M24 24 L24 0 L0 0" stroke="#b8860b" strokeWidth="1.5"/>
            <path d="M20 24 L20 4 L0 4" stroke="#b8860b" strokeWidth="0.75" opacity="0.5"/>
          </svg>
          <svg style={{ position: 'absolute', bottom: -10, left: -10 }} width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M0 0 L0 24 L24 24" stroke="#b8860b" strokeWidth="1.5"/>
            <path d="M4 0 L4 20 L24 20" stroke="#b8860b" strokeWidth="0.75" opacity="0.5"/>
          </svg>
          <svg style={{ position: 'absolute', bottom: -10, right: -10 }} width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M24 0 L24 24 L0 24" stroke="#b8860b" strokeWidth="1.5"/>
            <path d="M20 0 L20 20 L0 20" stroke="#b8860b" strokeWidth="0.75" opacity="0.5"/>
          </svg>

          <div style={{
            background: '#0d0a06',
            border: '1px solid rgba(184,134,11,0.2)',
            padding: '40px 44px 36px',
          }}>

            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 20, height: 1, background: '#b8860b' }} />
                <span style={{
                  fontFamily: 'Cocomat, sans-serif',
                  fontWeight: 300,
                  color: '#b8860b',
                  fontSize: 11,
                  letterSpacing: 5,
                  textTransform: 'uppercase',
                }}>Team Login</span>
                <div style={{ width: 20, height: 1, background: '#b8860b' }} />
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{
                display: 'block',
                fontFamily: 'Cocomat, sans-serif',
                fontWeight: 300,
                fontSize: 10,
                letterSpacing: 4,
                textTransform: 'uppercase',
                color: '#7a6a4a',
                marginBottom: 8,
              }}>
                Team Name
              </label>
              <input
                value={teamName}
                onChange={e => { setTeamName(e.target.value); setError('') }}
                placeholder="Enter your team name"
                style={{
                  width: '100%', padding: '13px 16px',
                  background: '#080603',
                  border: '1px solid rgba(184,134,11,0.2)',
                  borderBottom: '1px solid rgba(184,134,11,0.5)',
                  color: '#e8dfc4',
                  fontSize: 15,
                  outline: 'none',
                  fontFamily: 'Remington, monospace',
                  letterSpacing: 1,
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ marginBottom: 32 }}>
              <label style={{
                display: 'block',
                fontFamily: 'Cocomat, sans-serif',
                fontWeight: 300,
                fontSize: 10,
                letterSpacing: 4,
                textTransform: 'uppercase',
                color: '#7a6a4a',
                marginBottom: 8,
              }}>
                Game Code
              </label>
              <input
                value={code}
                onChange={e => { setCode(e.target.value); setError('') }}
                placeholder="6-digit code"
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                style={{
                  width: '100%', padding: '13px 16px',
                  background: '#080603',
                  border: '1px solid rgba(184,134,11,0.2)',
                  borderBottom: '1px solid rgba(184,134,11,0.5)',
                  color: '#e8dfc4',
                  fontSize: 18,
                  outline: 'none',
                  fontFamily: 'Remington, monospace',
                  letterSpacing: 8,
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {error && (
              <div style={{
                color: '#cc6666',
                fontFamily: 'Cocomat, sans-serif',
                fontWeight: 300,
                fontSize: 12,
                marginBottom: 20,
                padding: '10px 14px',
                border: '1px solid rgba(180,50,50,0.3)',
                background: 'rgba(100,20,20,0.2)',
                letterSpacing: 1,
              }}>
                {error}
              </div>
            )}

            <button
              onClick={handleLogin}
              disabled={loading}
              style={{
                width: '100%',
                padding: '15px',
                background: loading ? 'transparent' : '#b8860b',
                color: loading ? '#b8860b' : '#080603',
                border: '1px solid #b8860b',
                cursor: loading ? 'default' : 'pointer',
                fontFamily: 'Cocomat, sans-serif',
                fontWeight: 300,
                fontSize: 12,
                letterSpacing: 6,
                textTransform: 'uppercase',
                transition: 'all 0.2s',
                clipPath: 'polygon(12px 0%, calc(100% - 12px) 0%, 100% 12px, 100% calc(100% - 12px), calc(100% - 12px) 100%, 12px 100%, 0% calc(100% - 12px), 0% 12px)',
              }}
              onMouseEnter={e => {
                if (!loading) (e.target as HTMLButtonElement).style.background = '#c9a84c'
              }}
              onMouseLeave={e => {
                if (!loading) (e.target as HTMLButtonElement).style.background = '#b8860b'
              }}
            >
              {loading ? 'Verifying...' : 'Enter'}
            </button>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 28 }}>
          <a href="/register" style={{
            fontFamily: 'Cocomat, sans-serif',
            fontWeight: 200,
            color: '#5a4a2a',
            fontSize: 11,
            letterSpacing: 3,
            textDecoration: 'none',
            textTransform: 'uppercase',
          }}>
            Register your team →
          </a>
        </div>

      </div>
    </div>
  )
}