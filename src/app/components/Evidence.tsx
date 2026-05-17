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
      width: 220, background: '#0d0a06',
      borderRight: '1px solid rgba(184,134,11,0.2)',
      display: 'flex', flexDirection: 'column', flexShrink: 0,
    }}>

      <div style={{ padding: '14px 14px 10px', borderBottom: '1px solid rgba(184,134,11,0.15)' }}>
        <div style={{ fontFamily: 'Cocomat, sans-serif', fontWeight: 300, color: '#c9a84c', fontSize: 13, letterSpacing: 4, textTransform: 'uppercase', marginBottom: 4 }}>
          Evidence
        </div>
        <div style={{ fontFamily: 'Cocomat, sans-serif', fontWeight: 200, fontSize: 9, color: '#5a4a2a', letterSpacing: 3, textTransform: 'uppercase' }}>
          Drag cards onto the board
        </div>
      </div>

      <div style={{ padding: '8px 14px', borderBottom: '1px solid rgba(184,134,11,0.15)', display: 'flex', gap: 4 }}>
        {(['all', 'witness', 'clue'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            fontFamily: 'Cocomat, sans-serif', fontWeight: 300,
            fontSize: 8, padding: '3px 8px',
            border: '1px solid rgba(184,134,11,0.3)',
            background: filter === f ? '#b8860b' : 'transparent',
            color: filter === f ? '#080603' : '#b8860b',
            cursor: 'pointer', letterSpacing: 2, textTransform: 'uppercase',
            clipPath: 'polygon(4px 0%, calc(100% - 4px) 0%, 100% 4px, 100% calc(100% - 4px), calc(100% - 4px) 100%, 4px 100%, 0% calc(100% - 4px), 0% 4px)',
          }}>
            {f}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '8px', display: 'flex', flexDirection: 'column', gap: 5 }}>
        {filtered.map(card => {
          const onBoard = boardCardIds.has(card.id)
          const leftBorderColor = card.type === 'witness' ? '#b8860b' : card.type === 'clue' ? '#c87a3a' : '#7a4ad4'
          const typeColor = card.type === 'witness' ? '#8b6914' : card.type === 'clue' ? '#8b4a1a' : '#4a2a9a'

          return (
            <div
              key={card.id}
              onMouseDown={onBoard ? undefined : (e) => onDragStart(card.id, e)}
              style={{
                background: '#f0e8d0',
                border: '1px solid #c8b88a',
                borderLeft: `3px solid ${leftBorderColor}`,
                padding: '8px 9px',
                position: 'relative',
                display: 'flex', gap: 8, alignItems: 'flex-start',
                cursor: onBoard ? 'default' : 'grab',
                opacity: onBoard ? 0.4 : 1,
              }}
            >
              <div style={{
                width: 36, height: 42, flexShrink: 0,
                background: '#c8b88a',
                border: '1px solid #a89870',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: card.type === 'clue' ? 16 : 11,
                color: '#5a3a10',
                overflow: 'hidden',
                fontFamily: 'Remington, monospace',
                fontWeight: 700,
              }}>
                {card.photo
                  ? <img src={card.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', filter: 'sepia(60%) contrast(1.1)' }} />
                  : <span>{card.icon || card.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2)}</span>
                }
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'Cocomat, sans-serif', fontWeight: 300, fontSize: 8, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 3, color: typeColor }}>
                  {card.type}
                </div>
                <div style={{ fontFamily: 'Remington, monospace', fontSize: 13, color: '#1a1208', lineHeight: 1.3, marginBottom: 2 }}>
                  {card.name}
                </div>
                <div style={{ fontFamily: 'Ovo, serif', fontSize: 11, color: '#5a4a2a', fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {card.detail}
                </div>
              </div>

              {onBoard && (
                <div style={{ position: 'absolute', right: 6, top: 6, color: '#4a9a4a', fontSize: 10 }}>✓</div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}