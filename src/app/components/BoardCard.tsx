'use client'

import { CardData } from './Evidence'

export type StatusType = 'witness' | 'suspect' | 'poi' | 'alibi'

export interface BoardCardData extends CardData {
  x: number
  y: number
  note: string
  status: StatusType
}

interface BoardCardProps {
  card: BoardCardData
  onMove: (id: string, x: number, y: number) => void
  onRemove: (id: string) => void
  onConnect: (id: string) => void
  onViewFile: (id: string) => void
  onOpenDoc: (id: string) => void
  isConnecting: boolean
  isSource: boolean
  onConnectTarget: (id: string) => void
  onNoteChange: (id: string, note: string) => void
  onStatusChange: (id: string, status: StatusType) => void
}

const STATUS_ORDER: StatusType[] = ['witness', 'suspect', 'poi', 'alibi']

const TYPE_COLORS: Record<string, string> = {
  witness: '#d4a017',
  clue: '#c87a3a',
  hypothesis: '#7a4ad4',
}

const statusStyles: Record<StatusType, React.CSSProperties> = {
  witness: { color: '#8b6914', borderColor: '#c8a840', background: '#faf5e0' },
  suspect: { color: '#8b1a1a', borderColor: '#cc2222', background: '#faf0f0' },
  poi:     { color: '#1a3a6a', borderColor: '#3a6aaa', background: '#f0f4fa' },
  alibi:   { color: '#1a5a1a', borderColor: '#4a9a4a', background: '#f0faf0' },
}

export default function BoardCard({
  card, onMove, onRemove, onConnect, onViewFile, onOpenDoc,
  isConnecting, isSource, onConnectTarget, onNoteChange, onStatusChange
}: BoardCardProps) {

  function handleMouseDown(e: React.MouseEvent) {
    const tag = (e.target as HTMLElement).tagName
    if (tag === 'BUTTON' || tag === 'TEXTAREA') return

    if (isConnecting && !isSource) {
      onConnectTarget(card.id)
      return
    }

    e.preventDefault()
    const startX = e.clientX
    const startY = e.clientY
    const startL = card.x
    const startT = card.y

    function mm(e: MouseEvent) {
      onMove(card.id, Math.max(0, startL + (e.clientX - startX)), Math.max(0, startT + (e.clientY - startY)))
    }
    function mu() {
      document.removeEventListener('mousemove', mm)
      document.removeEventListener('mouseup', mu)
    }
    document.addEventListener('mousemove', mm)
    document.addEventListener('mouseup', mu)
  }

  const topColor = TYPE_COLORS[card.type] || '#888'

  const btnBase: React.CSSProperties = {
    fontSize: 8,
    letterSpacing: 1,
    textTransform: 'uppercase',
    padding: '4px 8px',
    cursor: 'pointer',
    fontFamily: 'Courier Prime, monospace',
    minHeight: 28,
    whiteSpace: 'nowrap',
    background: 'none',
  }

  return (
    <div
      onMouseDown={handleMouseDown}
      style={{
        position: 'absolute',
        left: card.x, top: card.y,
        width: 185,
        background: card.type === 'hypothesis' ? '#f0ecf8' : 'var(--paper)',
        border: '1px solid var(--paper-dark)',
        borderTop: `3px solid ${topColor}`,
        cursor: isConnecting && !isSource ? 'crosshair' : 'move',
        zIndex: isSource ? 100 : 10,
        boxShadow: isSource
          ? '0 0 0 2px var(--gold), 2px 4px 10px rgba(0,0,0,.4)'
          : '2px 4px 10px rgba(0,0,0,.4)',
      }}
    >
      {/* Pin */}
      <div style={{
        position: 'absolute', top: -8, left: '50%',
        transform: 'translateX(-50%)',
        width: 14, height: 14, borderRadius: '50%',
        background: 'radial-gradient(circle at 38% 35%, #ddd, #888)',
        boxShadow: '0 1px 4px rgba(0,0,0,.6)', zIndex: 20,
      }} />

      {/* Header */}
      <div style={{
        display: 'flex', gap: 10,
        padding: '10px 10px 8px',
        borderBottom: '1px dashed var(--paper-dark)',
        alignItems: 'flex-start',
      }}>
        <div style={{
          width: 48, height: 56, flexShrink: 0,
          background: '#c8b88a',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: card.type === 'clue' ? 22 : 16,
          fontWeight: 700, color: '#7a5a2a',
          border: '1px solid var(--paper-dark)',
          overflow: 'hidden',
          fontFamily: 'Special Elite, cursive',
        }}>
          {card.photo
            ? <img src={card.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', filter: 'sepia(70%) contrast(1.15) brightness(.85)' }} />
            : (card.icon || card.name.split(' ').map(w => w[0]).join('').slice(0, 2))
          }
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 9, letterSpacing: 2, textTransform: 'uppercase',
            fontWeight: 700, marginBottom: 4,
            color: card.type === 'witness' ? '#8b6914' : card.type === 'clue' ? '#8b4a1a' : '#4a2a9a',
            fontFamily: 'Courier Prime, monospace',
          }}>
            {card.type}
          </div>

          {card.type === 'witness' && (
            <div
              onClick={() => {
                const idx = STATUS_ORDER.indexOf(card.status)
                onStatusChange(card.id, STATUS_ORDER[(idx + 1) % STATUS_ORDER.length])
              }}
              style={{
                display: 'inline-block', fontSize: 9, letterSpacing: 1,
                textTransform: 'uppercase', padding: '2px 6px',
                border: '1px solid', marginBottom: 4, cursor: 'pointer',
                fontFamily: 'Courier Prime, monospace',
                ...statusStyles[card.status],
              }}
            >
              {card.status}
            </div>
          )}

          <div style={{
            fontFamily: 'Special Elite, cursive',
            fontSize: 13, color: 'var(--ink)', lineHeight: 1.3,
          }}>
            {card.name}
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '7px 10px 8px' }}>
        <textarea
          value={card.note}
          onChange={e => onNoteChange(card.id, e.target.value)}
          rows={2}
          placeholder="Add note..."
          style={{
            fontSize: 11, color: '#4a3820', lineHeight: 1.5,
            outline: 'none', width: '100%',
            background: 'transparent', border: 'none', resize: 'none',
            fontFamily: 'Courier Prime, monospace',
            cursor: 'text', userSelect: 'text',
          }}
        />

        {/* Actions */}
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', marginTop: 5,
          borderTop: '1px dashed var(--paper-dark)', paddingTop: 6,
          gap: 4,
        }}>
          {card.type === 'clue' ? (
            <button onClick={() => onOpenDoc(card.id)} style={{
              ...btnBase,
              border: '1px solid #5a2a08',
              color: '#5a2a08',
            }}>
              Doc
            </button>
          ) : (
            <button onClick={() => onViewFile(card.id)} style={{
              ...btnBase,
              border: '1px solid #5a2a08',
              color: '#5a2a08',
            }}>
              View file
            </button>
          )}

          <button onClick={() => onConnect(card.id)} style={{
            ...btnBase,
            border: `1px solid ${isSource ? 'var(--gold)' : '#7a6a4a'}`,
            background: isSource ? '#1a0f00' : 'none',
            color: isSource ? 'var(--gold)' : '#4a3820',
          }}>
            + String
          </button>

          <button onClick={() => onRemove(card.id)} style={{
            fontSize: 14,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            opacity: 0.45,
            color: 'var(--ink)',
            minWidth: 28,
            minHeight: 28,
            padding: '0 4px',
          }}>
            ✕
          </button>
        </div>
      </div>
    </div>
  )
}
