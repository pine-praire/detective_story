'use client'

import { useState } from 'react'
import { INSTITUTION_CATEGORIES, getPersonsByLetter } from '../data/addressData'

export default function AddressBook() {
  const [activeSection, setActiveSection] = useState<'institutions' | 'persons'>('institutions')

  const personsByLetter = getPersonsByLetter()
  const letters = Object.keys(personsByLetter).sort()

  return (
    <div style={{
      width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
      background: '#f5f0e1', overflow: 'hidden',
    }}>

      {/* Header */}
      <div style={{
        background: '#1a1208', borderBottom: '3px double #b8860b',
        padding: '12px 28px', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontFamily: 'Special Elite, cursive', color: '#b8860b', fontSize: 20, letterSpacing: 3 }}>
            Pine Praire
          </div>
          <div style={{ fontFamily: 'Special Elite, cursive', color: '#c8b88a', fontSize: 12, letterSpacing: 4, marginTop: 2 }}>
            Telephone Directory
          </div>
        </div>
        <div style={{ textAlign: 'right', fontSize: 11, color: '#8a7a5a', letterSpacing: 1, lineHeight: 1.7, fontFamily: 'Courier Prime, monospace' }}>
          <div>JUNE 2025</div>
          <div>LOUISIANA</div>
        </div>
      </div>

      {/* Section tabs */}
      <div style={{
        background: '#e8e0c8', borderBottom: '2px solid #c8b070',
        padding: '0 28px', flexShrink: 0, display: 'flex',
      }}>
        {(['institutions', 'persons'] as const).map(s => (
          <button key={s} onClick={() => setActiveSection(s)} style={{
            fontFamily: 'Special Elite, cursive',
            fontSize: 12, letterSpacing: 2, textTransform: 'uppercase',
            padding: '10px 20px',
            border: 'none',
            borderBottom: activeSection === s ? '3px solid #1a1208' : '3px solid transparent',
            background: 'transparent',
            color: activeSection === s ? '#1a1208' : '#8a7a5a',
            cursor: 'pointer',
            minHeight: 44,
          }}>
            {s === 'institutions' ? 'Institutions' : 'Residents'}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto' }}>

        {/* INSTITUTIONS */}
        {activeSection === 'institutions' && (
          <div>
            {Object.entries(INSTITUTION_CATEGORIES).map(([category, entries]) => (
              <div key={category}>
                <div style={{
                  background: '#1a1208', color: '#b8860b',
                  fontFamily: 'Special Elite, cursive',
                  fontSize: 11, letterSpacing: 3, textTransform: 'uppercase',
                  padding: '6px 28px',
                }}>
                  {category}
                </div>
                {entries.map((entry, i) => (
                  <div key={entry.id} style={{
                    display: 'flex', alignItems: 'center',
                    padding: '0 28px',
                    minHeight: 32,
                    background: i % 2 === 0 ? '#f5f0e1' : '#ede8d5',
                    borderBottom: '1px dotted #d4c89a',
                    userSelect: 'text',
                  }}>
                    <div style={{
                      width: 52, fontSize: 12, color: '#1a1208',
                      flexShrink: 0, fontWeight: 700,
                      fontFamily: 'Courier Prime, monospace',
                    }}>
                      {entry.id}
                    </div>
                    <div style={{
                      fontSize: 14, color: '#1a1208', whiteSpace: 'nowrap',
                      fontFamily: 'Courier Prime, monospace',
                    }}>
                      {entry.name}
                    </div>
                    <div style={{ flex: 1, borderBottom: '1px dotted #b8a870', margin: '0 8px 3px', minWidth: 16 }} />
                    <div style={{
                      fontSize: 14, color: '#1a1208', whiteSpace: 'nowrap',
                      fontFamily: 'Courier Prime, monospace',
                    }}>
                      {entry.address}
                    </div>
                    <div style={{
                      width: 80, fontSize: 13, color: '#4a3a20',
                      textAlign: 'right', flexShrink: 0,
                      fontFamily: 'Courier Prime, monospace',
                    }}>
                      {entry.phone}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* RESIDENTS */}
        {activeSection === 'persons' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
            {letters.map(letter => (
              <div key={letter} style={{ gridColumn: '1 / -1', display: 'contents' }}>
                <div style={{
                  gridColumn: '1 / -1',
                  fontFamily: 'Special Elite, cursive',
                  fontSize: 18, color: '#1a1208',
                  padding: '8px 20px 4px',
                  borderBottom: '2px solid #1a1208',
                  background: '#e0d8c0',
                  letterSpacing: 4,
                }}>
                  {letter}
                </div>
                {personsByLetter[letter].map((entry, i) => (
                  <div key={entry.id} style={{
                    display: 'flex', alignItems: 'center',
                    padding: '0 20px',
                    minHeight: 30,
                    background: i % 2 === 0 ? '#f5f0e1' : '#ede8d5',
                    borderBottom: '1px dotted #d4c89a',
                    userSelect: 'text',
                  }}>
                    <div style={{
                      width: 44, fontSize: 12, color: '#1a1208',
                      flexShrink: 0, fontWeight: 700,
                      fontFamily: 'Courier Prime, monospace',
                    }}>
                      {entry.id}
                    </div>
                    <div style={{
                      fontSize: 14, color: '#1a1208',
                      whiteSpace: 'nowrap', minWidth: 160,
                      fontFamily: 'Courier Prime, monospace',
                    }}>
                      {entry.name}
                    </div>
                    <div style={{ flex: 1, borderBottom: '1px dotted #b8a870', margin: '0 6px 3px', minWidth: 8 }} />
                    <div style={{
                      fontSize: 13, color: '#1a1208', whiteSpace: 'nowrap',
                      fontFamily: 'Courier Prime, monospace',
                    }}>
                      {entry.address}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
