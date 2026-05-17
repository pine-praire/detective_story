'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Evidence, { CardData } from './Evidence'
import BoardCard, { BoardCardData, StatusType } from './BoardCard'
import Newspaper from './Newspaper'
import AddressBook from './AddressBook'
import Journal, { JournalEntry } from './Journal'
import { supabase } from '@/lib/supabase'

const CASE_ID = '9449b4d3-8567-42c9-b376-e3a260f15498'
const NEWSPAPER_URL = 'https://cgpeozfkxrdqtqmbrcnh.supabase.co/storage/v1/object/public/newspaper/newspaper_test.pdf'

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
  url: string
}

interface TeamData {
  id: string
  name: string
  code: string
  event_id: string
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

function getTeam(): TeamData | null {
  try {
    const raw = localStorage.getItem('team')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export default function Board() {
  const [activeTab, setActiveTab] = useState<'board' | 'investigation' | 'address-book' | 'newspaper'>('investigation')
  const [loading, setLoading] = useState(true)
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved')
  const [team, setTeam] = useState<TeamData | null>(null)

  const [boardCards, setBoardCards] = useState<Record<string, BoardCardData>>({})
  const [strings, setStrings] = useState<StringData[]>([])
  const [availableCards, setAvailableCards] = useState<CardData[]>([])
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([])
  const [locations, setLocations] = useState<LocationPin[]>([])
  const [timerSecs, setTimerSecs] = useState(3 * 60 * 60)
  const [hypothesisCount, setHypothesisCount] = useState(0)
  const [movesUsed, setMovesUsed] = useState(0)

  const [connectingFrom, setConnectingFrom] = useState<string | null>(null)
  const [stringType, setStringType] = useState<string>('knows')
  const [modal, setModal] = useState<ModalData | null>(null)
  const [doc, setDoc] = useState<DocData | null>(null)

  const boardCardsRef = useRef(boardCards)
  const stringsRef = useRef(strings)
  const availableCardsRef = useRef(availableCards)
  const journalEntriesRef = useRef(journalEntries)
  const timerSecsRef = useRef(timerSecs)
  const hypothesisCountRef = useRef(hypothesisCount)

  useEffect(() => { boardCardsRef.current = boardCards }, [boardCards])
  useEffect(() => { stringsRef.current = strings }, [strings])
  useEffect(() => { availableCardsRef.current = availableCards }, [availableCards])
  useEffect(() => { journalEntriesRef.current = journalEntries }, [journalEntries])
  useEffect(() => { timerSecsRef.current = timerSecs }, [timerSecs])
  useEffect(() => { hypothesisCountRef.current = hypothesisCount }, [hypothesisCount])

  const sessionIdRef = useRef<string | null>(null)
  const isRestoringRef = useRef(false)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const boardRef = useRef<HTMLDivElement>(null)
  const ghostRef = useRef<HTMLDivElement | null>(null)
  const dragCardId = useRef<string | null>(null)

  useEffect(() => {
    async function init() {
      setLoading(true)
      await loadCaseData()

      const t = getTeam()
      console.log('team in init:', t)
      if (t) {
        setTeam(t)
        const sessionId = await findOrCreateSession(t)
        sessionIdRef.current = sessionId
        if (sessionId) {
          await restoreBoard(sessionId)
        }
      }

      setLoading(false)
    }
    init()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const id = setInterval(() => {
      if (!isRestoringRef.current) {
        setTimerSecs(s => Math.max(0, s - 1))
      }
    }, 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (isRestoringRef.current || !sessionIdRef.current) return
    setSaveStatus('unsaved')
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => { saveSnapshot() }, 1500)
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardCards, strings, availableCards, journalEntries, hypothesisCount])

  async function findOrCreateSession(t: TeamData): Promise<string | null> {
    try {
      console.log('team data:', t)
      console.log('CASE_ID:', CASE_ID)

      const { data: existing, error: findError } = await supabase
        .from('sessions')
        .select('id')
        .eq('login_code', t.code)
        .eq('case_id', CASE_ID)
        .eq('is_active', true)
        .single()

      console.log('find existing:', existing, findError)

      if (existing?.id) return existing.id

      const { data: created, error: insertError } = await supabase
        .from('sessions')
        .insert({
          case_id: CASE_ID,
          team_name: t.name,
          login_code: t.code,
          is_active: true,
          started_at: new Date().toISOString(),
        })
        .select('id')
        .single()

      console.log('insert result:', created, insertError)

      if (insertError) { console.error('Session create error:', insertError); return null }
      return created?.id ?? null
    } catch (err) {
      console.error('findOrCreateSession:', err)
      return null
    }
  }

  async function restoreBoard(sessionId: string) {
    try {
      const { data } = await supabase
        .from('session_board')
        .select('cards, strings, available_cards, journal_entries, timer_secs, hypothesis_count')
        .eq('session_id', sessionId)
        .single()

      if (!data) return

      isRestoringRef.current = true

      if (data.cards && typeof data.cards === 'object') {
        setBoardCards(data.cards as Record<string, BoardCardData>)
      }
      if (Array.isArray(data.strings)) {
        setStrings(data.strings as StringData[])
      }
      if (Array.isArray(data.available_cards) && data.available_cards.length > 0) {
        const cards = data.available_cards as CardData[]
        setAvailableCards(cards)
        ;(window as any).__allCaseCards = [
          ...((window as any).__allCaseCards || []),
          ...cards,
        ]
      }
      if (Array.isArray(data.journal_entries)) {
        const entries = data.journal_entries as JournalEntry[]
        setJournalEntries(entries)
        const visitedIds = new Set(
          entries.filter(e => e.visitType === 'visit').map(e => e.locationId)
        )
        if (visitedIds.size > 0) {
          setLocations(prev => prev.map(l => visitedIds.has(l.id) ? { ...l, visited: true } : l))
        }
      }
      if (typeof data.timer_secs === 'number' && data.timer_secs > 0) {
        setTimerSecs(data.timer_secs)
      }
      if (typeof data.hypothesis_count === 'number') {
        setHypothesisCount(data.hypothesis_count)
      }

      setTimeout(() => { isRestoringRef.current = false }, 150)
    } catch (err) {
      console.error('restoreBoard:', err)
      isRestoringRef.current = false
    }
  }

  const saveSnapshot = useCallback(async () => {
    const sessionId = sessionIdRef.current
    if (!sessionId || isRestoringRef.current) return

    setSaveStatus('saving')

    const { error } = await supabase
      .from('session_board')
      .upsert({
        session_id: sessionId,
        cards: boardCardsRef.current,
        strings: stringsRef.current,
        available_cards: availableCardsRef.current,
        journal_entries: journalEntriesRef.current,
        timer_secs: timerSecsRef.current,
        hypothesis_count: hypothesisCountRef.current,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'session_id' })

    setSaveStatus(error ? 'unsaved' : 'saved')
    if (error) console.error('saveSnapshot:', error)
  }, [])

  async function loadCaseData() {
    try {
      const { data: caseLocations } = await supabase
        .from('case_locations')
        .select('location_id, is_active, scene_text, locations(id, name, x, y, address, phone)')
        .eq('case_id', CASE_ID)

      if (caseLocations) {
        setLocations(caseLocations.map((cl: any) => ({
          id: cl.location_id,
          name: cl.locations?.name || 'Unknown',
          x: cl.locations?.x || 50,
          y: cl.locations?.y || 50,
          visited: false,
        })))
      }

      const { data: caseChars } = await supabase
        .from('case_characters')
        .select('character_id, current_location_id, role, is_active, visit_text, characters(id, name, photo_url, occupation)')
        .eq('case_id', CASE_ID)
        .eq('is_active', true)

      const { data: caseClues } = await supabase
        .from('case_clues')
        .select('id, name, description, found_at_location_id, document_url')
        .eq('case_id', CASE_ID)

      const cards: CardData[] = []

      caseChars?.forEach((cc: any) => {
        cards.push({
          id: 'char-' + cc.character_id,
          type: 'witness',
          name: cc.characters?.name || 'Unknown',
          detail: cc.characters?.occupation || '',
          photo: cc.characters?.photo_url || null,
          desc: cc.visit_text || '',
          meta: { Occupation: cc.characters?.occupation || '' },
          doc: null,
          _locationId: cc.current_location_id,
        } as any)
      })

      caseClues?.forEach((cl: any) => {
        cards.push({
          id: 'clue-' + cl.id,
          type: 'clue',
          name: cl.name,
          detail: cl.description,
          photo: null,
          icon: '📄',
          desc: cl.description,
          meta: { 'Found at': cl.found_at_location_id },
          doc: cl.document_url ? { title: cl.name, content: cl.document_url } : null,
          _locationId: cl.found_at_location_id,
          _docUrl: cl.document_url,
        } as any)
      })

      ;(window as any).__allCaseCards = cards
    } catch (err) {
      console.error('loadCaseData:', err)
    }
  }

  const handleSidebarDragStart = useCallback((cardId: string, e: React.MouseEvent) => {
    if (boardCardsRef.current[cardId]) return
    dragCardId.current = cardId
    const src = availableCardsRef.current.find(c => c.id === cardId)
    if (!src) return

    const ghost = document.createElement('div')
    ghost.style.cssText = `position:fixed;width:160px;background:var(--paper);border:1px solid var(--paper-dark);border-top:3px solid var(--gold);padding:8px 10px;pointer-events:none;z-index:9999;box-shadow:4px 8px 20px rgba(0,0,0,.5);opacity:.92;transform:rotate(2deg);`
    ghost.innerHTML = `<div style="font-size:7px;letter-spacing:2px;text-transform:uppercase;color:#8b6914;margin-bottom:3px;font-family:'Cocomat',sans-serif;">${src.type}</div><div style="font-family:'Remington',monospace;font-size:12px;color:#1a1208">${src.name}</div>`
    ghost.style.left = (e.clientX + 14) + 'px'
    ghost.style.top = (e.clientY - 18) + 'px'
    document.body.appendChild(ghost)
    ghostRef.current = ghost

    function mm(ev: MouseEvent) {
      if (ghostRef.current) {
        ghostRef.current.style.left = (ev.clientX + 14) + 'px'
        ghostRef.current.style.top = (ev.clientY - 18) + 'px'
      }
    }
    function mu(ev: MouseEvent) {
      if (ghostRef.current) { ghostRef.current.remove(); ghostRef.current = null }
      if (dragCardId.current && boardRef.current) {
        const r = boardRef.current.getBoundingClientRect()
        if (ev.clientX >= r.left && ev.clientX <= r.right && ev.clientY >= r.top && ev.clientY <= r.bottom) {
          dropCard(dragCardId.current, Math.max(10, ev.clientX - r.left - 82), Math.max(10, ev.clientY - r.top - 55))
        }
      }
      dragCardId.current = null
      document.removeEventListener('mousemove', mm)
      document.removeEventListener('mouseup', mu)
    }
    document.addEventListener('mousemove', mm)
    document.addEventListener('mouseup', mu)
  }, [])

  function dropCard(cardId: string, x: number, y: number) {
    const src = availableCardsRef.current.find(c => c.id === cardId)
    if (!src || boardCardsRef.current[cardId]) return
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

  function handleVisit(entry: JournalEntry): void {
    setTimerSecs(s => Math.max(0, s - entry.costMinutes * 60))
    setLocations(prev => prev.map(l => l.id === entry.locationId ? { ...l, visited: true } : l))

    if (entry.visitType === 'visit') {
      const allCards = (window as any).__allCaseCards || []
      const charCards = allCards.filter((c: any) => c._locationId === entry.locationId && c.type === 'witness')
      const clueCards = entry.hasClue
        ? allCards.filter((c: any) => c._locationId === entry.locationId && c.type === 'clue')
        : []
      const newCards = [...charCards, ...clueCards]
      if (newCards.length > 0) {
        setAvailableCards(prev => {
          const existingIds = new Set(prev.map(c => c.id))
          return [...prev, ...newCards.filter((c: any) => !existingIds.has(c.id))]
        })
      }
    }

    setJournalEntries(prev => [...prev, entry])
    setTimeout(() => saveSnapshot(), 200)
  }

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = s % 60
    return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  }

  const boardCardIds = new Set(Object.keys(boardCards))
  const availableStringTypes = connectingFrom ? STRING_TYPES[boardCards[connectingFrom]?.type] || [] : []

  const tabBtn = (tab: typeof activeTab, label: string) => (
    <button key={tab} onClick={() => setActiveTab(tab)} style={{
      fontFamily: 'Cocomat, sans-serif', fontWeight: 300,
      fontSize: 9, letterSpacing: 2, textTransform: 'uppercase',
      padding: '4px 10px',
      border: '1px solid #b8860b',
      background: activeTab === tab ? '#b8860b' : 'transparent',
      color: activeTab === tab ? '#080603' : '#b8860b',
      cursor: 'pointer', whiteSpace: 'nowrap',
      clipPath: 'polygon(5px 0%, calc(100% - 5px) 0%, 100% 5px, 100% calc(100% - 5px), calc(100% - 5px) 100%, 5px 100%, 0% calc(100% - 5px), 0% 5px)',
    }}>{label}</button>
  )

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', background: '#0a0805' }}>

      {/* Top bar */}
      <div style={{
        background: '#0a0805', borderBottom: '1px solid rgba(184,134,11,0.3)',
        padding: '0 16px', height: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0, position: 'relative',
      }}>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(to right, transparent, #b8860b 20%, #b8860b 80%, transparent)' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ fontFamily: 'ParkLane, serif', color: '#c9a84c', fontSize: 18, letterSpacing: 3, whiteSpace: 'nowrap' }}>
            The Casebook
          </div>
          {team && (
            <div style={{ fontFamily: 'Cocomat, sans-serif', fontWeight: 200, color: '#5a4a2a', fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
              {team.name}
            </div>
          )}
        </div>

        <div style={{ fontFamily: 'Cocomat, sans-serif', fontWeight: 200, color: '#e8dfc4', fontSize: 9, letterSpacing: 3, whiteSpace: 'nowrap', flex: '0 1 auto', textAlign: 'center', padding: '0 12px' }}>
          THE LAKE AFFAIR — PINE PRAIRE, 2025
        </div>

        <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexShrink: 0 }}>
          {tabBtn('investigation', 'Investigation')}
          {tabBtn('board', 'Board')}
          {tabBtn('address-book', 'Address Book')}
          {tabBtn('newspaper', 'Newspaper')}
          <div style={{ width: 1, height: 16, background: 'rgba(184,134,11,0.2)', margin: '0 2px' }} />
          <button onClick={addHypothesis} style={topBtnStyle}>+ Hypothesis</button>
          <button onClick={() => setStrings([])} style={{ ...topBtnStyle, borderColor: '#cc4444', color: '#cc4444' }}>
            Clear Strings
          </button>
          <div style={{
            fontFamily: 'Cocomat, sans-serif', fontWeight: 200,
            fontSize: 8, letterSpacing: 2, textTransform: 'uppercase',
            marginLeft: 6, whiteSpace: 'nowrap',
            color: saveStatus === 'saved' ? '#3a6a3a' : saveStatus === 'saving' ? '#b8860b' : '#cc4444',
          }}>
            {saveStatus === 'saved' ? '✓ saved' : saveStatus === 'saving' ? '· · ·' : '● unsaved'}
          </div>
        </div>
      </div>

      {/* Main */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {loading ? (
          <div style={{
            width: 220, background: '#0d0a06', flexShrink: 0,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            <div style={{ color: '#b8860b', fontFamily: 'Cocomat, sans-serif', fontSize: 10, letterSpacing: 3 }}>
              LOADING...
            </div>
          </div>
        ) : (
          <Evidence
            cards={availableCards}
            onDragStart={handleSidebarDragStart}
            boardCardIds={boardCardIds}
          />
        )}

        <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>

          {/* Board */}
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
                <text x="500" y="192" fill="rgba(100,75,30,0.45)" fontSize="9" fontFamily="Courier Prime,monospace" textAnchor="middle" letterSpacing="3">OAK AVENUE</text>
                <text x="500" y="430" fill="rgba(100,75,30,0.45)" fontSize="9" fontFamily="Courier Prime,monospace" textAnchor="middle" letterSpacing="3">MAIN STREET</text>
                <text x="170" y="340" fill="rgba(100,75,30,0.4)" fontSize="8" fontFamily="Courier Prime,monospace" textAnchor="middle" letterSpacing="2" transform="rotate(-90,170,340)">PINE AVENUE</text>
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
                    style={{
                      position: 'absolute',
                      left: loc.x / 100 * bw, top: loc.y / 100 * bh,
                      transform: 'translate(-50%,-50%)',
                      display: 'flex', flexDirection: 'column', alignItems: 'center',
                      cursor: 'pointer', zIndex: 3,
                    }}
                  >
                    <div style={{
                      width: 14, height: 14, borderRadius: '50%',
                      background: loc.visited ? '#cc2222' : '#6a5a3a',
                      border: `2px solid ${loc.visited ? '#8b1a1a' : '#4a3a20'}`,
                      boxShadow: loc.visited ? '0 0 8px rgba(200,30,30,.5)' : 'none',
                      transition: 'all .2s',
                    }} />
                    <div style={{
                      fontFamily: 'Remington, monospace', fontSize: 9,
                      background: 'rgba(15,10,5,.85)',
                      color: loc.visited ? '#ff9a9a' : 'var(--gold)',
                      padding: '2px 5px', marginTop: 3, letterSpacing: 1,
                      whiteSpace: 'nowrap', border: '1px solid #2a1f0a',
                    }}>
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
                    <path key={i}
                      d={`M ${a.x} ${a.y} Q ${mx} ${my} ${b.x} ${b.y}`}
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
                  onMove={moveCard}
                  onRemove={removeCard}
                  onConnect={startConnect}
                  onViewFile={id => setModal({ card: boardCards[id] })}
                  onOpenDoc={id => {
                    const c = boardCards[id] as any
                    if (c?._docUrl) setDoc({ title: c.name, url: c._docUrl })
                    else if (c?.doc) setDoc({ title: c.doc.title, url: c.doc.content })
                  }}
                  isConnecting={!!connectingFrom}
                  isSource={connectingFrom === card.id}
                  onConnectTarget={id => completeConnect(id, card.type)}
                  onNoteChange={(id, note) => setBoardCards(prev => ({ ...prev, [id]: { ...prev[id], note } }))}
                  onStatusChange={(id, status) => setBoardCards(prev => ({ ...prev, [id]: { ...prev[id], status } }))}
                />
              ))}

              {connectingFrom && (
                <div style={{
                  position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)',
                  background: 'rgba(10,5,0,.95)', border: '1px solid var(--gold)',
                  padding: '8px 18px', zIndex: 200,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, minWidth: 340,
                }}>
                  <div style={{ fontFamily: 'Cocomat, sans-serif', fontWeight: 300, color: 'var(--gold)', fontSize: 11, letterSpacing: 2 }}>
                    Select connection type — then click target
                  </div>
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', justifyContent: 'center' }}>
                    {availableStringTypes.map(t => (
                      <button key={t} onClick={() => setStringType(t)} style={{
                        fontSize: 8, padding: '2px 8px',
                        border: `1px solid ${stringType === t ? STRING_COLORS[t] : '#2a1f0a'}`,
                        background: stringType === t ? '#1a0f00' : 'transparent',
                        color: stringType === t ? STRING_COLORS[t] : '#6a5a3a',
                        cursor: 'pointer', letterSpacing: 1, textTransform: 'uppercase',
                        fontFamily: 'Cocomat, sans-serif', fontWeight: 300,
                      }}>
                        {STRING_LABELS[t]}
                      </button>
                    ))}
                  </div>
                  <button onClick={() => setConnectingFrom(null)} style={{
                    fontSize: 8, color: '#3a2a10', cursor: 'pointer', letterSpacing: 1,
                    textTransform: 'uppercase', fontFamily: 'Cocomat, sans-serif',
                    background: 'none', border: 'none', textDecoration: 'underline',
                  }}>Cancel</button>
                </div>
              )}

              <div style={{
                position: 'absolute', bottom: 12, right: 12,
                background: 'rgba(8,4,0,.96)', border: '1px solid rgba(184,134,11,0.3)',
                padding: '12px 16px', zIndex: 50,
              }}>
                <div style={{
                  fontFamily: 'Cocomat, sans-serif', fontWeight: 300,
                  color: '#b8860b', fontSize: 9, letterSpacing: 5, textTransform: 'uppercase',
                  marginBottom: 10, borderBottom: '1px solid rgba(184,134,11,0.2)', paddingBottom: 8,
                }}>
                  Strings
                </div>
                {Object.entries(STRING_LABELS).map(([key, label]) => (
                  <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 6 }}>
                    <svg width="28" height="8" style={{ flexShrink: 0 }}>
                      <line x1="0" y1="4" x2="28" y2="4"
                        stroke={STRING_COLORS[key]}
                        strokeWidth={['suspects', 'was-there'].includes(key) ? 3 : 2.5}
                        strokeDasharray={['contradicts', 'found-at', 'based-on'].includes(key) ? '7 4' : undefined}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div style={{ fontFamily: 'Cocomat, sans-serif', fontWeight: 200, fontSize: 9, color: '#e8dfc4', letterSpacing: 2, textTransform: 'uppercase' }}>
                      {label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Address Book */}
          <div style={{ display: activeTab === 'address-book' ? 'flex' : 'none', width: '100%', height: '100%' }}>
            <AddressBook />
          </div>

          {/* Investigation */}
          <div style={{ display: activeTab === 'investigation' ? 'flex' : 'none', width: '100%', height: '100%' }}>
            <Journal
              entries={journalEntries}
              timeRemaining={timerSecs}
              onVisit={handleVisit}
            />
          </div>

          {/* Newspaper */}
          <div style={{ display: activeTab === 'newspaper' ? 'flex' : 'none', width: '100%', height: '100%' }}>
            <Newspaper pdfUrl={NEWSPAPER_URL} title="Daily Pines - Vol. 10, No. 4" />
          </div>

        </div>
      </div>

      {/* Status bar */}
      <div style={{
        background: '#0a0805', borderTop: '1px solid rgba(184,134,11,0.2)',
        padding: '6px 24px', display: 'flex', gap: 32, flexShrink: 0, alignItems: 'center',
      }}>
        {([
          ['Cards on board', Object.keys(boardCards).length],
          ['Connections', strings.length],
          ['Time remaining', formatTime(timerSecs)],
          ['Moves used', movesUsed],
        ] as [string, string | number][]).map(([label, val]) => (
          <div key={label} style={{
            fontFamily: 'Cocomat, sans-serif', fontWeight: 200,
            fontSize: 10, color: '#e8dfc4', letterSpacing: 3, textTransform: 'uppercase',
          }}>
            {label}: <span style={{ color: '#b8860b', fontWeight: 300 }}>{val}</span>
          </div>
        ))}
      </div>

      {/* Card detail modal */}
      {modal && (
        <div
          onClick={e => { if (e.target === e.currentTarget) setModal(null) }}
          style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            background: 'rgba(5,3,0,.78)', zIndex: 300,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <div style={{ background: 'var(--paper)', border: '2px solid var(--paper-dark)', maxWidth: 400, width: '90%', boxShadow: '4px 8px 30px rgba(0,0,0,.7)' }}>
            <div style={{ background: 'var(--paper-aged)', borderBottom: '1px solid var(--paper-dark)', padding: '10px 14px', display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 8, letterSpacing: 2, textTransform: 'uppercase', fontWeight: 700, marginBottom: 3, color: '#8b6914', fontFamily: 'Cocomat, sans-serif' }}>
                  {modal.card.type}
                </div>
                <div style={{ fontFamily: 'Remington, monospace', fontSize: 16, color: 'var(--ink)' }}>
                  {modal.card.name}
                </div>
              </div>
              <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: 'var(--ink-faded)' }}>×</button>
            </div>
            <div style={{ padding: '12px 14px' }}>
              <div style={{ display: 'flex', gap: 14, marginBottom: 12 }}>
                {modal.card.photo && (
                  <img src={modal.card.photo} alt="" style={{
                    width: 90, height: 110, flexShrink: 0,
                    objectFit: 'cover', objectPosition: 'center 10%',
                    filter: 'sepia(60%) contrast(1.1)',
                    border: '1px solid var(--paper-dark)',
                  }} />
                )}
                <div style={{ flex: 1 }}>
                  {modal.card.type === 'witness' && (
                    <>
                      <div style={{ fontSize: 8, letterSpacing: 1, textTransform: 'uppercase', color: '#8a7a5a', marginBottom: 5, fontFamily: 'Cocomat, sans-serif' }}>Status</div>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 10 }}>
                        {(['witness', 'suspect', 'poi', 'alibi'] as StatusType[]).map(s => (
                          <button key={s} onClick={() => {
                            setBoardCards(prev => ({ ...prev, [modal.card.id]: { ...prev[modal.card.id], status: s } }))
                            setModal(prev => prev ? { card: { ...prev.card, status: s } } : null)
                          }} style={{
                            fontSize: 8, padding: '2px 8px', cursor: 'pointer',
                            border: '1px solid', background: 'transparent',
                            fontFamily: 'Cocomat, sans-serif', letterSpacing: 1, textTransform: 'uppercase',
                            color: modal.card.status === s ? 'var(--gold)' : '#8a7a5a',
                            borderColor: modal.card.status === s ? 'var(--gold)' : '#c8b88a',
                          }}>{s}</button>
                        ))}
                      </div>
                    </>
                  )}
                  {modal.card.meta && Object.entries(modal.card.meta).map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', gap: 8, fontSize: 10, marginBottom: 4 }}>
                      <div style={{ color: '#8a7a5a', letterSpacing: 1, textTransform: 'uppercase', minWidth: 72, fontFamily: 'Cocomat, sans-serif', fontWeight: 200 }}>{k}</div>
                      <div style={{ color: 'var(--ink)', fontFamily: 'Remington, monospace' }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ fontFamily: 'Ovo, serif', fontSize: 13, color: 'var(--ink-faded)', lineHeight: 1.8 }}>
                {modal.card.desc}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PDF viewer */}
      {doc && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(3,2,0,.92)', zIndex: 400, display: 'flex', flexDirection: 'column',
        }}>
          <div style={{
            background: '#0d0a06', borderBottom: '1px solid #2a1f0a',
            padding: '8px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div style={{ fontFamily: 'ParkLane, serif', color: 'var(--gold)', fontSize: 13, letterSpacing: 2 }}>
              {doc.title}
            </div>
            <button onClick={() => setDoc(null)} style={{ ...topBtnStyle, borderColor: '#cc4444', color: '#cc4444' }}>
              × Close
            </button>
          </div>
          <iframe src={doc.url} style={{ flex: 1, border: 'none', width: '100%' }} title={doc.title} />
        </div>
      )}

    </div>
  )
}

const topBtnStyle: React.CSSProperties = {
  fontFamily: 'Cocomat, sans-serif', fontWeight: 300,
  fontSize: 9, letterSpacing: 2, textTransform: 'uppercase',
  padding: '4px 10px',
  border: '1px solid #b8860b',
  background: 'transparent', color: '#b8860b', cursor: 'pointer',
  whiteSpace: 'nowrap',
  clipPath: 'polygon(5px 0%, calc(100% - 5px) 0%, 100% 5px, 100% calc(100% - 5px), calc(100% - 5px) 100%, 5px 100%, 0% calc(100% - 5px), 0% 5px)',
}
