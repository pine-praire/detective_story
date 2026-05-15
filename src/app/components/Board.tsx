'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Evidence, { CardData } from './Evidence'
import BoardCard, { BoardCardData, StatusType } from './BoardCard'
import Newspaper from './Newspaper'

interface LocationPin {
  id: string
  name: string
  x: number
  y: number
  visited: boolean
}

interface StringData {
  from: string
  to: string
  type: string
  toType: string
}

interface ModalData {
  card: BoardCardData
}

interface DocData {
  title: string
  content: string
}

const STRING_TYPES: Record<string, string[]> = {
  witness:    ['knows', 'was-there', 'contradicts'],
  clue:       ['belongs-to', 'found-at', 'contradicts'],
  hypothesis: ['suspects', 'based-on'],
  location:   [],
}

const STRING_LABELS: Record<string, string> = {
  'knows':       'Knows',
  'was-there':   'Was there',
  'contradicts': 'Contradicts',
  'belongs-to':  'Belongs to',
  'found-at':    'Found at',
  'suspects':    'Suspects',
  'based-on':    'Based on',
}

const STRING_COLORS: Record<string, string> = {
  'knows':       '#4a9ada',
  'was-there':   '#e03030',
  'contradicts': '#f5c842',
  'belongs-to':  '#40c070',
  'found-at':    '#ff6040',
  'suspects':    '#c060f0',
  'based-on':    '#30c0c0',
}

const NEWSPAPER_URL = 'https://cgpeozfkxrdqtqmbrcnh.supabase.co/storage/v1/object/public/newspaper/newspaper_test.pdf'

const SAMPLE_CARDS: CardData[] = [
  { id: 'w1', type: 'witness', name: 'Lord Ashford', detail: 'Host of the manor', photo: null,
    desc: 'Lord Reginald Ashford, 54. Owner of Ashford Manor. Known for extravagant lifestyle and mounting debts.',
    meta: { Age: '54', Occupation: 'Landowner', 'Last seen': 'Library, 11:40pm', Alibi: 'Unconfirmed' } },
  { id: 'w2', type: 'witness', name: 'Mrs. Hargrove', detail: 'Widow, arrived late', photo: null,
    desc: 'Eleanor Hargrove, 41. Widow of Colonel Hargrove. Quarrelled with the victim over an inheritance.',
    meta: { Age: '41', Occupation: 'Widow, socialite', 'Last seen': 'East corridor, midnight', Alibi: 'Claimed headache' } },
  { id: 'w3', type: 'witness', name: 'Dr. Pemberton', detail: 'Physician, no alibi', photo: null,
    desc: 'Dr. Archibald Pemberton, 48. No one can account for his whereabouts between 11pm and 1am.',
    meta: { Age: '48', Occupation: 'Physician', 'Last seen': 'Drawing room, 11pm', Alibi: 'Unverified' } },
  { id: 'w4', type: 'witness', name: 'James Whitmore', detail: 'Butler, 22 yrs service', photo: null,
    desc: 'James Whitmore, 61. Found the decanter in the morning. Claims he locked all exterior doors at 10pm.',
    meta: { Age: '61', Occupation: 'Butler', 'Last seen': 'Pantry, 10:30pm', Alibi: 'Staff corroborate' } },
  { id: 'cl1', type: 'clue', name: 'Monogrammed glove', detail: 'Initial W, left hand', icon: '◼',
    desc: 'A single white evening glove found beneath the chaise longue. Embroidered with W in gold thread.',
    meta: { Found: 'Library, beneath chaise', Condition: 'Slightly damp', Notable: 'Gardenia scent' },
    doc: { title: 'Evidence Report - Glove', content: 'EVIDENCE REPORT No. 14-A\n\nItem: White evening glove, left hand\nInitial: W (gold thread)\nCondition: Slightly damp\nScent: Gardenia\nLocation: beneath chaise, The Library\nDate: 15 May 1924' } },
  { id: 'cl2', type: 'clue', name: 'Torn letter', detail: 'References a debt', icon: '✎',
    desc: 'Three fragments in the fireplace grate. Reference a sum of 4000 pounds and a deadline of the 15th.',
    meta: { Found: 'Library fireplace', Condition: 'Partially burned', Ink: 'Brown-black' },
    doc: { title: 'Forensic Document Report', content: 'FORENSIC DOCUMENT ANALYSIS\n\nDocument: Three fragments, partially burned\nLegible text: 4000 pounds by no later than the 15th\nyou leave me no choice but to...' } },
  { id: 'cl3', type: 'clue', name: 'Pocket watch', detail: 'Stopped at 11:47', icon: '◉',
    desc: 'Silver pocket watch found on the east corridor floor. Crystal cracked, stopped at 11:47pm.',
    meta: { Found: 'East corridor', 'Time stopped': '11:47 pm', Engraving: 'To R from E' },
    doc: { title: 'Evidence Report - Watch', content: 'EVIDENCE REPORT No. 14-B\n\nItem: Silver pocket watch\nMaker: Longines\nStopped: 11:47 PM\nInscription: To R, with eternal devotion - E' } },
]

const SAMPLE_LOCATIONS: LocationPin[] = [
  { id: 'loc1', name: 'The Library',    x: 33, y: 25, visited: false },
  { id: 'loc2', name: 'East Wing',      x: 78, y: 35, visited: false },
  { id: 'loc3', name: 'Garden Terrace', x: 55, y: 72, visited: false },
  { id: 'loc4', name: 'Drawing Room',   x: 22, y: 65, visited: false },
  { id: 'loc5', name: 'The Study',      x: 78, y: 70, visited: false },
]

export default function Board() {
  const [activeTab, setActiveTab] = useState<'board' | 'newspaper'>('board')
  const [boardCards, setBoardCards] = useState<Record<string, BoardCardData>>({})
  const [strings, setStrings] = useState<StringData[]>([])
  const [locations, setLocations] = useState<LocationPin[]>(SAMPLE_LOCATIONS)
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null)
  const [stringType, setStringType] = useState<string>('knows')
  const [hypothesisCount, setHypothesisCount] = useState(0)
  const [movesUsed, setMovesUsed] = useState(0)
  const [modal, setModal] = useState<ModalData | null>(null)
  const [doc, setDoc] = useState<DocData | null>(null)
  const [timerSecs, setTimerSecs] = useState(3 * 60 * 60)

  const boardRef = useRef<HTMLDivElement>(null)
  const ghostRef = useRef<HTMLDivElement | null>(null)
  const dragCardId = useRef<string | null>(null)

  useEffect(() => {
    const id = setInterval(() => setTimerSecs(s => Math.max(0, s - 1)), 1000)
    return () => clearInterval(id)
  }, [])

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = s % 60
    return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  }

  const handleSidebarDragStart = useCallback((cardId: string, e: React.MouseEvent) => {
    if (boardCards[cardId]) return
    dragCardId.current = cardId
    const src = SAMPLE_CARDS.find(c => c.id === cardId)
    if (!src) return

    const ghost = document.createElement('div')
    ghost.style.cssText = `position:fixed;width:160px;background:var(--paper);border:1px solid var(--paper-dark);border-top:3px solid var(--gold);padding:8px 10px;pointer-events:none;z-index:9999;box-shadow:4px 8px 20px rgba(0,0,0,.5);opacity:.92;transform:rotate(2deg);font-family:'Courier Prime',monospace;`
    ghost.innerHTML = `<div style="font-size:7px;letter-spacing:2px;text-transform:uppercase;color:#8b6914;margin-bottom:3px">${src.type}</div><div style="font-family:'Special Elite',cursive;font-size:12px;color:#1a1208">${src.name}</div>`
    ghost.style.left = (e.clientX + 14) + 'px'
    ghost.style.top = (e.clientY - 18) + 'px'
    document.body.appendChild(ghost)
    ghostRef.current = ghost

    function mm(e: MouseEvent) {
      if (ghostRef.current) {
        ghostRef.current.style.left = (e.clientX + 14) + 'px'
        ghostRef.current.style.top = (e.clientY - 18) + 'px'
      }
    }
    function mu(e: MouseEvent) {
      if (ghostRef.current) { ghostRef.current.remove(); ghostRef.current = null }
      if (dragCardId.current && boardRef.current) {
        const r = boardRef.current.getBoundingClientRect()
        if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) {
          dropCard(dragCardId.current, Math.max(10, e.clientX - r.left - 82), Math.max(10, e.clientY - r.top - 55))
        }
      }
      dragCardId.current = null
      document.removeEventListener('mousemove', mm)
      document.removeEventListener('mouseup', mu)
    }
    document.addEventListener('mousemove', mm)
    document.addEventListener('mouseup', mu)
  }, [boardCards])

  function dropCard(cardId: string, x: number, y: number) {
    const src = SAMPLE_CARDS.find(c => c.id === cardId)
    if (!src || boardCards[cardId]) return
    setBoardCards(prev => ({ ...prev, [cardId]: { ...src, x, y, note: '', status: 'witness' as StatusType } }))
    setMovesUsed(m => m + 1)
  }

  function moveCard(id: string, x: number, y: number) {
    setBoardCards(prev => ({ ...prev, [id]: { ...prev[id], x, y } }))
  }

  function removeCard(id: string) {
    setBoardCards(prev => { const n = { ...prev }; delete n[id]; return n })
    setStrings(prev => prev.filter(s => s.from !== id && s.to !== id))
  }

  function startConnect(id: string) {
    if (connectingFrom === id) { setConnectingFrom(null); return }
    setConnectingFrom(id)
    const types = STRING_TYPES[boardCards[id]?.type] || []
    if (types.length > 0) setStringType(types[0])
  }

  function completeConnect(toId: string, toType: string) {
    if (!connectingFrom || connectingFrom === toId) return
    const exists = strings.find(s =>
      (s.from === connectingFrom && s.to === toId) ||
      (s.from === toId && s.to === connectingFrom)
    )
    if (!exists) {
      setStrings(prev => [...prev, { from: connectingFrom, to: toId, type: stringType, toType }])
    }
    setConnectingFrom(null)
  }

  function addHypothesis() {
    const n = hypothesisCount + 1
    setHypothesisCount(n)
    const id = 'hyp' + n
    setBoardCards(prev => ({
      ...prev,
      [id]: {
        id, type: 'hypothesis', name: 'Hypothesis ' + n,
        detail: '', photo: null, icon: '?',
        desc: 'Your working hypothesis.',
        meta: { Created: 'Now' },
        doc: null,
        x: 200 + n * 22, y: 160 + n * 22,
        note: '', status: 'witness' as StatusType,
      }
    }))
  }

  function getCenter(id: string, type: string): { x: number; y: number } | null {
    if (type === 'location') {
      const pin = document.getElementById('pin-' + id)
      const board = boardRef.current
      if (!pin || !board) return null
      const pr = pin.getBoundingClientRect()
      const br = board.getBoundingClientRect()
      return { x: pr.left - br.left + 7, y: pr.top - br.top + 7 }
    }
    const c = boardCards[id]
    if (!c) return null
    return { x: c.x + 82, y: c.y + 50 }
  }

  const boardCardIds = new Set(Object.keys(boardCards))
  const availableStringTypes = connectingFrom ? STRING_TYPES[boardCards[connectingFrom]?.type] || [] : []

  const tabBtn = (tab: 'board' | 'newspaper', label: string) => (
    <button key={tab} onClick={() => setActiveTab(tab)} style={{
      fontFamily: 'Courier Prime, monospace',
      fontSize: 10, letterSpacing: 1, textTransform: 'uppercase',
      padding: '5px 14px',
      border: '1px solid var(--gold)',
      background: activeTab === tab ? 'var(--gold)' : 'transparent',
      color: activeTab === tab ? 'var(--sidebar)' : 'var(--gold)',
      cursor: 'pointer',
    }}>{label}</button>
  )

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', background: '#0a0805' }}>

      {/* Top bar */}
      <div style={{
        background: 'var(--sidebar)', borderBottom: '2px solid var(--gold)',
        padding: '0 20px', height: 50, display: 'flex',
        alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
      }}>
        <div style={{ fontFamily: 'Special Elite, cursive', color: 'var(--gold)', fontSize: 19, letterSpacing: 3 }}>
          The Casebook
        </div>
        <div style={{ fontSize: 11, color: '#5a4a2a', letterSpacing: 2 }}>
          CASE NO. 001 - THE NEPTUNE AFFAIR - 1924
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {tabBtn('board', 'Board')}
          {tabBtn('newspaper', 'Newspaper')}
          <div style={{ width: 1, height: 20, background: '#3a2a10', margin: '0 4px' }} />
          <button onClick={addHypothesis} style={topBtnStyle}>+ Hypothesis</button>
          <button onClick={() => setStrings([])} style={{ ...topBtnStyle, borderColor: 'var(--red)', color: '#cc2222' }}>
            Clear strings
          </button>
        </div>
      </div>

      {/* Main */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        <Evidence
          cards={SAMPLE_CARDS}
          onDragStart={handleSidebarDragStart}
          boardCardIds={boardCardIds}
        />

        <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>

          {/* Board tab */}
          <div style={{ display: activeTab === 'board' ? 'block' : 'none', width: '100%', height: '100%' }}>
            <div
              ref={boardRef}
              style={{
                width: '100%', height: '100%', position: 'relative', overflow: 'hidden',
                backgroundColor: 'var(--cork)',
                backgroundImage: 'radial-gradient(ellipse at 25% 35%,rgba(190,155,90,.35) 0%,transparent 55%),radial-gradient(ellipse at 75% 65%,rgba(155,115,55,.25) 0%,transparent 55%)',
              }}
            >
              <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }}
                viewBox="0 0 1000 650" preserveAspectRatio="xMidYMid slice">
                <defs>
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(100,75,30,0.18)" strokeWidth="0.5" />
                  </pattern>
                </defs>
                <rect width="1000" height="650" fill="rgba(180,140,70,0.1)" />
                <rect width="1000" height="650" fill="url(#grid)" />
                <line x1="0" y1="200" x2="1000" y2="180" stroke="rgba(120,90,40,0.35)" strokeWidth="18" />
                <line x1="0" y1="420" x2="1000" y2="440" stroke="rgba(120,90,40,0.35)" strokeWidth="22" />
                <line x1="180" y1="0" x2="160" y2="650" stroke="rgba(120,90,40,0.35)" strokeWidth="16" />
                <line x1="500" y1="0" x2="480" y2="650" stroke="rgba(120,90,40,0.3)" strokeWidth="14" />
                <line x1="780" y1="0" x2="800" y2="650" stroke="rgba(120,90,40,0.28)" strokeWidth="13" />
                <rect x="200" y="50"  width="260" height="120" rx="3" fill="rgba(160,125,60,0.15)" stroke="rgba(120,90,40,0.2)" strokeWidth="0.5" />
                <rect x="510" y="50"  width="250" height="110" rx="3" fill="rgba(160,125,60,0.15)" stroke="rgba(120,90,40,0.2)" strokeWidth="0.5" />
                <rect x="200" y="230" width="260" height="170" rx="3" fill="rgba(160,125,60,0.15)" stroke="rgba(120,90,40,0.2)" strokeWidth="0.5" />
                <rect x="510" y="220" width="250" height="180" rx="3" fill="rgba(160,125,60,0.15)" stroke="rgba(120,90,40,0.2)" strokeWidth="0.5" />
                <rect x="200" y="460" width="560" height="170" rx="3" fill="rgba(160,125,60,0.12)" stroke="rgba(120,90,40,0.2)" strokeWidth="0.5" />
                <text x="500" y="192" fill="rgba(100,75,30,0.45)" fontSize="9" fontFamily="Courier Prime,monospace" textAnchor="middle" letterSpacing="3">VICTORIA AVENUE</text>
                <text x="500" y="430" fill="rgba(100,75,30,0.45)" fontSize="9" fontFamily="Courier Prime,monospace" textAnchor="middle" letterSpacing="3">KING EDWARD STREET</text>
                <text x="170" y="340" fill="rgba(100,75,30,0.4)" fontSize="8" fontFamily="Courier Prime,monospace" textAnchor="middle" letterSpacing="2" transform="rotate(-90,170,340)">CROWN LANE</text>
              </svg>

              {locations.map(loc => {
                const bw = boardRef.current?.offsetWidth || 1000
                const bh = boardRef.current?.offsetHeight || 650
                return (
                  <div key={loc.id} id={'pin-' + loc.id}
                    onClick={() => {
                      if (connectingFrom) { completeConnect(loc.id, 'location'); return }
                      setLocations(prev => prev.map(l => l.id === loc.id ? { ...l, visited: true } : l))
                    }}
                    style={{ position: 'absolute', left: loc.x / 100 * bw, top: loc.y / 100 * bh, transform: 'translate(-50%,-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', zIndex: 3 }}
                  >
                    <div style={{ width: 14, height: 14, borderRadius: '50%', background: loc.visited ? '#cc2222' : '#6a5a3a', border: `2px solid ${loc.visited ? '#8b1a1a' : '#4a3a20'}`, boxShadow: loc.visited ? '0 0 8px rgba(200,30,30,.5)' : 'none', transition: 'all .2s' }} />
                    <div style={{ fontFamily: 'Special Elite, cursive', fontSize: 9, background: 'rgba(15,10,5,.85)', color: loc.visited ? '#ff9a9a' : 'var(--gold)', padding: '2px 5px', marginTop: 3, letterSpacing: 1, whiteSpace: 'nowrap', border: '1px solid #2a1f0a' }}>
                      {loc.name}
                    </div>
                  </div>
                )
              })}

              <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 2 }}>
                {strings.map((s, i) => {
                  const fromType = boardCards[s.from]?.type || 'witness'
                  const a = getCenter(s.from, fromType)
                  const b = getCenter(s.to, s.toType)
                  if (!a || !b) return null
                  const mx = (a.x + b.x) / 2
                  const my = (a.y + b.y) / 2 - 20
                  const color = STRING_COLORS[s.type] || '#888'
                  const dash = ['contradicts', 'found-at', 'based-on'].includes(s.type) ? '7 4' : undefined
                  return (
                    <path key={i} d={`M ${a.x} ${a.y} Q ${mx} ${my} ${b.x} ${b.y}`}
                      fill="none" stroke={color}
                      strokeWidth={['suspects', 'was-there'].includes(s.type) ? 3 : 2.5}
                      strokeLinecap="round" strokeDasharray={dash}
                      style={{ filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.6))' }}
                    />
                  )
                })}
              </svg>

              {Object.values(boardCards).map(card => (
                <BoardCard key={card.id} card={card}
                  onMove={moveCard} onRemove={removeCard} onConnect={startConnect}
                  onViewFile={id => setModal({ card: boardCards[id] })}
                  onOpenDoc={id => { const c = boardCards[id]; if (c?.doc) setDoc(c.doc) }}
                  isConnecting={!!connectingFrom} isSource={connectingFrom === card.id}
                  onConnectTarget={id => completeConnect(id, card.type)}
                  onNoteChange={(id, note) => setBoardCards(prev => ({ ...prev, [id]: { ...prev[id], note } }))}
                  onStatusChange={(id, status) => setBoardCards(prev => ({ ...prev, [id]: { ...prev[id], status } }))}
                />
              ))}

              {connectingFrom && (
                <div style={{ position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)', background: 'rgba(10,5,0,.95)', border: '1px solid var(--gold)', padding: '8px 18px', zIndex: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, minWidth: 340 }}>
                  <div style={{ fontFamily: 'Special Elite, cursive', color: 'var(--gold)', fontSize: 11, letterSpacing: 2 }}>Select connection type - then click target</div>
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', justifyContent: 'center' }}>
                    {availableStringTypes.map(t => (
                      <button key={t} onClick={() => setStringType(t)} style={{ fontSize: 8, padding: '2px 8px', border: `1px solid ${stringType === t ? STRING_COLORS[t] : '#2a1f0a'}`, background: stringType === t ? '#1a0f00' : 'transparent', color: stringType === t ? STRING_COLORS[t] : '#6a5a3a', cursor: 'pointer', letterSpacing: 1, textTransform: 'uppercase', fontFamily: 'Courier Prime, monospace' }}>
                        {STRING_LABELS[t]}
                      </button>
                    ))}
                  </div>
                  <button onClick={() => setConnectingFrom(null)} style={{ fontSize: 8, color: '#3a2a10', cursor: 'pointer', letterSpacing: 1, textTransform: 'uppercase', fontFamily: 'Courier Prime, monospace', background: 'none', border: 'none', textDecoration: 'underline' }}>Cancel</button>
                </div>
              )}

              <div style={{ position: 'absolute', bottom: 12, right: 12, background: 'rgba(8,4,0,.96)', border: '1px solid #6a5a3a', padding: '10px 14px', zIndex: 50 }}>
                <div style={{ fontFamily: 'Special Elite, cursive', color: 'var(--gold)', fontSize: 10, letterSpacing: 2, marginBottom: 7, borderBottom: '1px solid #3a2a10', paddingBottom: 5 }}>Strings</div>
                {Object.entries(STRING_LABELS).map(([key, label]) => (
                  <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 5 }}>
                    <div style={{ width: 28, height: 2.5, flexShrink: 0, borderRadius: 1, background: STRING_COLORS[key], boxShadow: `0 0 4px ${STRING_COLORS[key]}88` }} />
                    <div style={{ fontSize: 10, color: '#c8b88a', letterSpacing: 1, textTransform: 'uppercase' }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Newspaper tab */}
          <div style={{ display: activeTab === 'newspaper' ? 'flex' : 'none', width: '100%', height: '100%' }}>
            <Newspaper pdfUrl={NEWSPAPER_URL} title="Daily Pines - Vol. 10, No. 4" />
          </div>

        </div>
      </div>

      {/* Status bar */}
      <div style={{ background: 'var(--sidebar)', borderTop: '1px solid var(--sidebar-border)', padding: '4px 16px', display: 'flex', gap: 20, flexShrink: 0 }}>
        {[
          ['Cards on board', Object.keys(boardCards).length],
          ['Connections', strings.length],
          ['Time remaining', formatTime(timerSecs)],
          ['Moves used', movesUsed],
        ].map(([label, val]) => (
          <div key={label as string} style={{ fontSize: 9, color: '#3a2a10', letterSpacing: 1, textTransform: 'uppercase' }}>
            {label}: <span style={{ color: 'var(--gold)' }}>{val}</span>
          </div>
        ))}
      </div>

      {/* Modal */}
      {modal && (
        <div onClick={e => { if (e.target === e.currentTarget) setModal(null) }}
          style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(5,3,0,.78)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--paper)', border: '2px solid var(--paper-dark)', maxWidth: 400, width: '90%', boxShadow: '4px 8px 30px rgba(0,0,0,.7)' }}>
            <div style={{ background: 'var(--paper-aged)', borderBottom: '1px solid var(--paper-dark)', padding: '10px 14px', display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 8, letterSpacing: 2, textTransform: 'uppercase', fontWeight: 700, marginBottom: 3, color: '#8b6914' }}>{modal.card.type}</div>
                <div style={{ fontFamily: 'Special Elite, cursive', fontSize: 16, color: 'var(--ink)' }}>{modal.card.name}</div>
              </div>
              <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: 'var(--ink-faded)' }}>x</button>
            </div>
            <div style={{ padding: '12px 14px' }}>
              <div style={{ fontSize: 11, color: 'var(--ink-faded)', lineHeight: 1.7, fontStyle: 'italic', marginBottom: 10 }}>{modal.card.desc}</div>
              {modal.card.meta && Object.entries(modal.card.meta).map(([k, v]) => (
                <div key={k} style={{ display: 'flex', gap: 8, fontSize: 10, marginBottom: 3 }}>
                  <div style={{ color: '#8a7a5a', letterSpacing: 1, textTransform: 'uppercase', minWidth: 72 }}>{k}</div>
                  <div style={{ color: 'var(--ink)' }}>{v}</div>
                </div>
              ))}
              {modal.card.type === 'witness' && (
                <div style={{ marginTop: 10, borderTop: '1px dashed var(--paper-dark)', paddingTop: 8 }}>
                  <div style={{ fontSize: 8, letterSpacing: 1, textTransform: 'uppercase', color: '#8a7a5a', marginBottom: 5 }}>Status</div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {(['witness', 'suspect', 'poi', 'alibi'] as StatusType[]).map(s => (
                      <button key={s} onClick={() => {
                        setBoardCards(prev => ({ ...prev, [modal.card.id]: { ...prev[modal.card.id], status: s } }))
                        setModal(null)
                      }} style={{ fontSize: 8, padding: '2px 8px', cursor: 'pointer', border: '1px solid #c8b88a', background: 'transparent', color: modal.card.status === s ? 'var(--gold)' : '#8a7a5a', borderColor: modal.card.status === s ? 'var(--gold)' : '#c8b88a', fontFamily: 'Courier Prime, monospace', letterSpacing: 1, textTransform: 'uppercase' }}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Doc viewer */}
      {doc && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(3,2,0,.92)', zIndex: 400, display: 'flex', flexDirection: 'column' }}>
          <div style={{ background: '#0d0a06', borderBottom: '1px solid #2a1f0a', padding: '8px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontFamily: 'Special Elite, cursive', color: 'var(--gold)', fontSize: 13, letterSpacing: 2 }}>{doc.title}</div>
            <button onClick={() => setDoc(null)} style={{ ...topBtnStyle, borderColor: 'var(--red)', color: '#cc2222' }}>x Close</button>
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#2a2015' }}>
            <div style={{ width: 360, background: 'var(--paper)', border: '1px solid var(--paper-dark)', padding: 30, boxShadow: '0 4px 20px rgba(0,0,0,.5)' }}>
              <div style={{ fontFamily: 'Special Elite, cursive', fontSize: 8, letterSpacing: 3, color: '#5a4a2a', textTransform: 'uppercase', border: '2px solid #5a4a2a', padding: '3px 8px', display: 'inline-block', transform: 'rotate(-2deg)', marginBottom: 14 }}>Evidence document</div>
              <div style={{ fontFamily: 'Special Elite, cursive', fontSize: 16, color: 'var(--ink)', marginBottom: 10, borderBottom: '1px solid var(--paper-dark)', paddingBottom: 8 }}>{doc.title}</div>
              <div style={{ fontSize: 10, color: 'var(--ink-faded)', lineHeight: 1.8, whiteSpace: 'pre-line' }}>{doc.content}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const topBtnStyle: React.CSSProperties = {
  fontFamily: 'Courier Prime, monospace',
  fontSize: 10, letterSpacing: 1, textTransform: 'uppercase',
  padding: '5px 12px', border: '1px solid var(--gold)',
  background: 'transparent', color: 'var(--gold)', cursor: 'pointer',
}
