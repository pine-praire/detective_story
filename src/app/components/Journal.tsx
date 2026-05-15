'use client'

import { useState } from 'react'
import { ALL_ENTRIES, AddressEntry } from '../data/addressData'

export interface JournalEntry {
  id: string
  entryNumber: number
  locationId: string
  locationName: string
  address: string
  sceneText: string
  hasClue: boolean
  clueName?: string
  characterName?: string
  costMinutes: number
  timestamp: Date
}

interface JournalProps {
  entries: JournalEntry[]
  onVisit: (entry: AddressEntry) => JournalEntry
  timeRemaining: number
}

export default function Journal({ entries, onVisit, timeRemaining }: JournalProps) {
  const [code, setCode] = useState('')
  const [visiting, setVisiting] = useState(false)
  const [error, setError] = useState('')

  function handleGo() {
    const trimmed = code.trim()
    if (!trimmed) return
    const entry = ALL_ENTRIES[trimmed]
    if (!entry) {
      setError('Address ' + trimmed + ' not found in the directory.')
      return
    }
    setError('')
    setVisiting(true)
    setTimeout(() => {
      onVisit(entry)
      setCode('')
      setVisiting(false)
    }, 600)
  }

  const sorted = [...entries].reverse()

  return (
    <div style={{
      width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
      background: '#0d0a06', overflow: 'hidden',
    }}>

      {/* Travel input */}
      <div style={{
        background: '#141009', borderBottom: '2px solid #2a1f0a',
        padding: '16px 28px', flexShrink: 0,
      }}>
        <div style={{
          fontFamily: 'Special Elite, cursive', color: '#b8860b',
          fontSize: 15, letterSpacing: 3, marginBottom: 14,
        }}>
          Journal
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'stretch' }}>
          <div style={{
            fontSize: 12, color: '#8a7a5a', letterSpacing: 1,
            textTransform: 'uppercase', whiteSpace: 'nowrap',
            display: 'flex', alignItems: 'center',
            fontFamily: 'Courier Prime, monospace',
          }}>
            Go to:
          </div>
          <input
            type="text"
            value={code}
            onChange={e => { setCode(e.target.value); setError('') }}
            onKeyDown={e => e.key === 'Enter' && handleGo()}
            placeholder="Enter address number..."
            style={{
              flex: 1,
              padding: '10px 14px',
              background: '#0d0a06',
              border: '1px solid #3a2a10',
              fontFamily: 'Courier Prime, monospace',
              fontSize: 14,
              color: '#e8dfc4',
              outline: 'none',
              letterSpacing: 1,
              height: 44,
            }}
          />
          <button
            onClick={handleGo}
            disabled={visiting || timeRemaining <= 0}
            style={{
              fontFamily: 'Courier Prime, monospace',
              fontSize: 13,
              letterSpacing: 2,
              textTransform: 'uppercase',
              fontWeight: 700,
              padding: '0 24px',
              height: 44,
              background: visiting ? '#3a2a10' : '#b8860b',
              color: '#ffffff',
              border: 'none',
              cursor: visiting ? 'default' : 'pointer',
              opacity: timeRemaining <= 0 ? 0.4 : 1,
              flexShrink: 0,
            }}
          >
            {visiting ? '...' : 'GO'}
          </button>
        </div>

        {error && (
          <div style={{
            marginTop: 8, fontSize: 12, color: '#cc4444',
            fontFamily: 'Courier Prime, monospace', letterSpacing: 0.5,
          }}>
            {error}
          </div>
        )}

        {visiting && (
          <div style={{
            marginTop: 8, fontSize: 12, color: '#6a5a3a',
            letterSpacing: 1, fontFamily: 'Courier Prime, monospace',
          }}>
            Travelling...
          </div>
        )}
      </div>

      {/* Journal entries */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 0' }}>
        {sorted.length === 0 && (
          <div style={{
            padding: '40px 28px',
            fontSize: 14, color: '#4a3a20',
            fontFamily: 'Courier Prime, monospace',
            lineHeight: 1.6, textAlign: 'center',
          }}>
            No visits yet. Enter an address number above to travel.
          </div>
        )}

        {sorted.map(entry => (
          <div key={entry.id} style={{
            margin: '0 20px 16px',
            border: '1px solid #2a1f0a',
            background: '#0a0805',
          }}>
            {/* Entry header */}
            <div style={{
              background: '#141009',
              borderBottom: '1px solid #2a1f0a',
              padding: '10px 16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'baseline' }}>
                <div style={{
                  fontFamily: 'Special Elite, cursive',
                  color: '#e8dfc4',
                  fontSize: 15,
                  letterSpacing: 1,
                }}>
                  {entry.locationName}
                </div>
                {entry.characterName && (
                  <div style={{
                    fontSize: 11, color: '#8b6914',
                    letterSpacing: 1, textTransform: 'uppercase',
                    fontFamily: 'Courier Prime, monospace',
                  }}>
                    {entry.characterName}
                  </div>
                )}
              </div>
              <div style={{
                fontSize: 11, color: '#4a3a20',
                letterSpacing: 1, fontFamily: 'Courier Prime, monospace',
              }}>
                #{entry.entryNumber} · {entry.address}
              </div>
            </div>

            {/* Scene text */}
            <div style={{ padding: '14px 16px' }}>
              <div style={{
                fontSize: 14,
                color: '#c8b88a',
                lineHeight: 1.7,
                fontFamily: 'Courier Prime, monospace',
                borderLeft: '2px solid #2a1f0a',
                paddingLeft: 14,
              }}>
                {entry.sceneText}
              </div>

              {entry.hasClue && (
                <div style={{
                  marginTop: 10, padding: '7px 12px',
                  border: '1px solid #c87a3a',
                  background: 'rgba(200,120,60,.08)',
                  fontSize: 12, color: '#c87a3a',
                  letterSpacing: 1,
                  fontFamily: 'Courier Prime, monospace',
                }}>
                  Evidence found: {entry.clueName}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
