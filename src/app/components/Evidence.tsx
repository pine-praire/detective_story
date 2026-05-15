'use client'

import { useState } from 'react'

export type CardType = 'witness' | 'clue' | 'hypothesis'

export interface CardData {
  id: string
  type: CardType
  name: string
  detail: string
  photo?: string | null
  icon?: string
  desc?: string
  meta?: Record<string, string>
  doc?: { title: string; content: string } | null
}

interface EvidenceProps {
  cards: CardData[]
  onDragStart: (cardId: string, e: React.MouseEvent) => void
  boardCardIds: Set<string>
}

export default function Evidence({ cards, onDragStart, boardCardIds }: EvidenceProps) {
  const [filter, setFilter] = useState<'all' | 'witness' | 'clue'>('all')

  const filtered = cards.filter(c => filter === 'all' || c.type === filter)

  return (
    <div style={{
      width: 220, background: 'var(--sidebar)',
      borderRight: '2px solid var(--sidebar-border)',
      display: 'flex', flexDirection: 'column', flexShrink: 0
    }}>
      <div style={{ padding: '12px 14px 8px', borderBottom: '1px solid var(--sidebar-border)' }}>
        <div style={{ fontFamily: 'Special Elite, cursive', color: 'var(--gold)', fontSize: 12, letterSpacing: 2, marginBottom: 3 }}>
          Evidence
        </div>
        <div style={{ fontSize: 9, color: '#3a2a10', letterSpacing: 1, textTransform: 'uppercase' }}>
          Drag cards onto the board
        </div>
      </div>

      <div style={{ padding: '7px 14px', borderBottom: '1px solid var(--sidebar-border)', display: 'flex', gap: 3 }}>
        {(['all', 'witness', 'clue'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            fontSize: 8, padding: '2px 7px',
            border: '1px solid #2a1f0a',
            background: filter === f ? '#2a1f0a' : 'transparent',
            color: filter === f ? 'var(--gold)' : '#5a4a2a',
            cursor: 'pointer', letterSpacing: 1, textTransform: 'uppercase',
            fontFamily: 'Courier Prime, monospace', transition: 'all .15s'
          }}>
            {f}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 8, display: 'flex', flexDirection: 'column', gap: 5 }}>
        {filtered.map(card => {
          const onBoard = boardCardIds.has(card.id)
          return (
            <div
              key={card.id}
              onMouseDown={onBoard ? undefined : (e) => onDragStart(card.id, e)}
              style={{
                background: 'var(--paper-aged)',
                border: '1px solid var(--paper-dark)',
                borderLeft: `3px solid ${card.type === 'witness' ? '#d4a017' : card.type === 'clue' ? '#c87a3a' : '#7a4ad4'}`,
                padding: '7px 9px',
                position: 'relative',
                display: 'flex', gap: 8, alignItems: 'flex-start',
                cursor: onBoard ? 'default' : 'grab',
                opacity: onBoard ? 0.38 : 1,
                transition: 'all .15s',
              }}
            >
              <div style={{
                width: 38, height: 38, flexShrink: 0,
                background: '#c8b88a',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: card.type === 'clue' ? 18 : 13,
                fontWeight: 700, color: '#8a6a3a',
                border: '1px solid var(--paper-dark)',
                overflow: 'hidden',
              }}>
                {card.photo
                  ? <img src={card.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', filter: 'sepia(80%) contrast(1.1)' }} />
                  : card.icon || card.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2)
                }
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 7, letterSpacing: 2, textTransform: 'uppercase', fontWeight: 700, marginBottom: 2,
                  color: card.type === 'witness' ? '#8b6914' : card.type === 'clue' ? '#8b4a1a' : '#4a2a9a'
                }}>
                  {card.type}
                </div>
                <div style={{ fontFamily: 'Special Elite, cursive', fontSize: 11, color: 'var(--ink)', lineHeight: 1.3 }}>
                  {card.name}
                </div>
                <div style={{ fontSize: 9, color: 'var(--ink-faded)', fontStyle: 'italic', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {card.detail}
                </div>
              </div>

              {onBoard && (
                <div style={{ position: 'absolute', right: 6, top: 6, fontSize: 9, color: '#4a9a4a' }}>✓</div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}