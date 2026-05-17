'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

const CASE_ID = '9449b4d3-8567-42c9-b376-e3a260f15498'

export interface JournalEntry {
  id: string
  entryNumber: number
  locationId: string
  locationName: string
  address: string
  visitType: 'visit' | 'call'
  code?: number
  phone?: string
  sceneText: string
  hasClue: boolean
  costMinutes: number
  timestamp: Date
  characterName?: string
  characterPhoto?: string
  clueUrl?: string
  clueName?: string
}

interface JournalProps {
  entries: JournalEntry[]
  onVisit: (entry: JournalEntry) => void
  timeRemaining: number
}

export default function Journal({ entries, onVisit, timeRemaining }: JournalProps) {
  const [code, setCode] = useState('')
  const [visiting, setVisiting] = useState(false)
  const [error, setError] = useState('')

  async function handleGo() {
    const trimmed = code.trim()
    if (!trimmed) return

    const isNumeric = /^\d+$/.test(trimmed)
    const visitType: 'visit' | 'call' = isNumeric ? 'visit' : 'call'
    const costMinutes = visitType === 'visit' ? 10 : 5

    setError('')
    setVisiting(true)

    try {
      let locationData: any = null
      if (visitType === 'visit') {
        const { data } = await supabase
          .from('locations')
          .select('*')
          .eq('code', parseInt(trimmed))
          .single()
        locationData = data
      } else {
        const { data } = await supabase
          .from('locations')
          .select('*')
          .eq('phone', trimmed)
          .single()
        locationData = data
      }

      if (!locationData) {
        const entry: JournalEntry = {
          id: 'unknown-' + Date.now(),
          entryNumber: entries.length + 1,
          locationId: 'unknown',
          locationName: visitType === 'visit' ? `Address ${trimmed}` : `Number ${trimmed}`,
          address: trimmed,
          visitType,
          sceneText: visitType === 'visit'
            ? 'You arrived, but found nothing of interest.'
            : 'No one answered.',
          hasClue: false,
          costMinutes,
          timestamp: new Date(),
        }
        onVisit(entry)
        setCode('')
        setVisiting(false)
        return
      }

      const { data: caseLocData } = await supabase
        .from('case_locations')
        .select('is_active, scene_text')
        .eq('case_id', CASE_ID)
        .eq('location_id', locationData.id)
        .single()

      if (!caseLocData || !caseLocData.is_active) {
        const entry: JournalEntry = {
          id: locationData.id + '-' + Date.now(),
          entryNumber: entries.length + 1,
          locationId: locationData.id,
          locationName: locationData.name,
          address: locationData.address,
          visitType,
          code: locationData.code,
          phone: locationData.phone,
          sceneText: visitType === 'visit'
            ? 'You arrived, but found nothing of interest.'
            : 'No one answered.',
          hasClue: false,
          costMinutes,
          timestamp: new Date(),
        }
        onVisit(entry)
        setCode('')
        setVisiting(false)
        return
      }

      const { data: charData } = await supabase
        .from('case_characters')
        .select('*, characters(name, photo_url, occupation)')
        .eq('case_id', CASE_ID)
        .eq('current_location_id', locationData.id)
        .eq('is_active', true)
        .single()

      let clueData: any = null
      if (visitType === 'visit') {
        const { data } = await supabase
          .from('case_clues')
          .select('*')
          .eq('case_id', CASE_ID)
          .eq('found_at_location_id', locationData.id)
          .single()
        clueData = data
      }

      let sceneText = 'You arrived, but found nothing of interest.'
      if (visitType === 'visit') {
        if (charData?.visit_text) {
          sceneText = charData.visit_text
        } else if (caseLocData.scene_text) {
          sceneText = caseLocData.scene_text
        }
      } else {
        if (!charData) {
          sceneText = 'No one answered.'
        } else if (charData.phone_text) {
          sceneText = charData.phone_text
        } else {
          sceneText = 'The phone rang for a long time before someone picked up. "I\'d rather not discuss this over the phone. Come and see me in person."'
        }
      }

      const entry: JournalEntry = {
        id: locationData.id + '-' + Date.now(),
        entryNumber: entries.length + 1,
        locationId: locationData.id,
        locationName: locationData.name,
        address: locationData.address,
        visitType,
        code: locationData.code,
        phone: locationData.phone,
        sceneText,
        hasClue: visitType === 'visit' && !!clueData,
        costMinutes,
        timestamp: new Date(),
        characterName: charData?.characters?.name,
        characterPhoto: visitType === 'visit' && charData ? charData.characters?.photo_url : undefined,
        clueUrl: visitType === 'visit' && clueData ? clueData.document_url : undefined,
        clueName: visitType === 'visit' && clueData ? clueData.name : undefined,
      }

      onVisit(entry)
      setCode('')
    } catch (err) {
      console.error(err)
      setError('Something went wrong. Try again.')
    }

    setVisiting(false)
  }

  const sorted = [...entries].reverse()

  return (
    <div style={{
      width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
      background: '#0d0a06', overflow: 'hidden',
    }}>

      {/* Input */}
      <div style={{
        background: '#0a0805',
        borderBottom: '1px solid rgba(184,134,11,0.2)',
        padding: '20px 28px', flexShrink: 0,
      }}>
        <div style={{
          fontFamily: 'ParkLane, serif',
          color: '#c9a84c',
          fontSize: 22, letterSpacing: 4, marginBottom: 4,
        }}>
          Investigation
        </div>
        <div style={{
          fontFamily: 'Cocomat, sans-serif', fontWeight: 200,
          fontSize: 10, color: '#5a4a2a', letterSpacing: 3,
          textTransform: 'uppercase', marginBottom: 16,
        }}>
          Enter address code to visit · Enter phone number to call
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'stretch' }}>
          <div style={{
            fontFamily: 'Cocomat, sans-serif', fontWeight: 200,
            fontSize: 10, color: '#e8dfc4', letterSpacing: 4,
            textTransform: 'uppercase', whiteSpace: 'nowrap',
            display: 'flex', alignItems: 'center',
          }}>
            Go to:
          </div>
          <input
            type="text"
            value={code}
            onChange={e => { setCode(e.target.value); setError('') }}
            onKeyDown={e => e.key === 'Enter' && handleGo()}
            placeholder="203 or 5-0001..."
            style={{
              flex: 1,
              padding: '10px 14px',
              background: '#080603',
              border: '1px solid rgba(184,134,11,0.2)',
              borderBottom: '1px solid rgba(184,134,11,0.5)',
              fontFamily: 'Remington, monospace',
              fontSize: 14,
              color: '#e8dfc4',
              outline: 'none',
              letterSpacing: 2,
              height: 44,
            }}
          />
          <button
            onClick={handleGo}
            disabled={visiting || timeRemaining <= 0}
            style={{
              fontFamily: 'Cocomat, sans-serif', fontWeight: 300,
              fontSize: 11, letterSpacing: 5, textTransform: 'uppercase',
              padding: '0 24px', height: 44,
              background: visiting ? 'transparent' : '#b8860b',
              color: visiting ? '#b8860b' : '#080603',
              border: '1px solid #b8860b',
              cursor: visiting ? 'default' : 'pointer',
              opacity: timeRemaining <= 0 ? 0.4 : 1,
              flexShrink: 0,
              clipPath: 'polygon(8px 0%, calc(100% - 8px) 0%, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 0% calc(100% - 8px), 0% 8px)',
            }}
          >
            {visiting ? '...' : 'Go'}
          </button>
        </div>

        {error && (
          <div style={{
            marginTop: 10, fontFamily: 'Cocomat, sans-serif', fontWeight: 300,
            fontSize: 11, color: '#cc4444', letterSpacing: 1,
          }}>
            {error}
          </div>
        )}

        {visiting && (
          <div style={{
            marginTop: 10, fontFamily: 'Ovo, serif',
            fontSize: 12, color: '#7a6a4a', letterSpacing: 1, fontStyle: 'italic',
          }}>
            {/^\d+$/.test(code) ? 'Travelling...' : 'Calling...'}
          </div>
        )}
      </div>

      {/* Entries */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 0' }}>
        {sorted.length === 0 && (
          <div style={{
            padding: '48px 28px',
            fontFamily: 'Ovo, serif',
            fontSize: 14, color: '#5a4a2a',
            lineHeight: 1.8, textAlign: 'center', fontStyle: 'italic',
          }}>
            No visits yet. Enter an address code or phone number above.
          </div>
        )}

        {sorted.map(entry => (
          <div key={entry.id} style={{
            margin: '0 24px 16px',
            border: '1px solid rgba(184,134,11,0.15)',
            background: '#0a0805',
            position: 'relative',
          }}>
            {/* Left accent line */}
            <div style={{
              position: 'absolute', left: 0, top: 0, bottom: 0, width: 2,
              background: entry.visitType === 'visit'
                ? 'rgba(184,134,11,0.5)'
                : 'rgba(74,154,218,0.5)',
            }} />

            {/* Header */}
            <div style={{
              background: '#0d0a06',
              borderBottom: '1px solid rgba(184,134,11,0.15)',
              padding: '10px 16px 10px 20px',
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              {/* Badge: Visit 203 / Call 5-0001 */}
              <div style={{
                fontFamily: 'Cocomat, sans-serif', fontWeight: 300,
                fontSize: 9, letterSpacing: 2, textTransform: 'uppercase',
                padding: '2px 7px', whiteSpace: 'nowrap', flexShrink: 0,
                border: `1px solid ${entry.visitType === 'visit' ? '#b8860b' : '#4a9ada'}`,
                color: entry.visitType === 'visit' ? '#b8860b' : '#4a9ada',
              }}>
{entry.visitType === 'visit' ? 'Visit' : 'Call'}
              </div>

              {/* Location — Character */}
              <div style={{
                fontFamily: 'Remington, monospace',
                color: '#e8dfc4', fontSize: 14, letterSpacing: 1,
              }}>
{entry.visitType === 'visit' ? `${entry.code}` : `${entry.phone}`} — {entry.locationName}{entry.characterName ? ` — ${entry.characterName}` : ''}
              </div>

              {/* Cost */}
              <div style={{
                marginLeft: 'auto', flexShrink: 0,
                fontFamily: 'Cocomat, sans-serif', fontWeight: 200,
                fontSize: 10, color: '#3a2a10', letterSpacing: 2,
              }}>
                −{entry.costMinutes} min
              </div>
            </div>

            {/* Scene text with optional photo */}
            <div style={{ padding: '14px 16px 14px 20px', overflow: 'hidden' }}>
              {entry.visitType === 'visit' && entry.characterPhoto && (
                <img
                  src={entry.characterPhoto}
                  alt={entry.characterName}
                  style={{
                    width: 80, height: 100,
                    objectFit: 'cover', objectPosition: 'center top',
                    filter: 'sepia(70%) contrast(1.1)',
                    border: '1px solid rgba(184,134,11,0.3)',
                    float: 'left', marginRight: 16, marginBottom: 8,
                  }}
                />
              )}
              <div style={{
                fontFamily: 'Ovo, serif',
                fontSize: 14, color: '#e8dfc4',
                lineHeight: 1.9,
              }}>
                {entry.sceneText}
              </div>

              {entry.hasClue && entry.clueUrl && (
                <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 12, clear: 'both' }}>
                  <div style={{
                    padding: '8px 14px',
                    border: '1px solid rgba(200,120,60,0.4)',
                    background: 'rgba(200,120,60,0.06)',
                    fontFamily: 'Cocomat, sans-serif', fontWeight: 300,
                    fontSize: 11, color: '#c87a3a', letterSpacing: 2,
                    textTransform: 'uppercase', flex: 1,
                  }}>
                    Evidence found: {entry.clueName}
                  </div>
                  <a
                    href={entry.clueUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontFamily: 'Cocomat, sans-serif', fontWeight: 300,
                      fontSize: 10, letterSpacing: 3, textTransform: 'uppercase',
                      padding: '8px 16px',
                      background: 'transparent', color: '#c87a3a',
                      border: '1px solid rgba(200,120,60,0.4)',
                      textDecoration: 'none', whiteSpace: 'nowrap',
                    }}
                  >
                    Open doc ↗
                  </a>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
