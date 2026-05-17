'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface Case {
  id: string
  title: string
  year: number
  city: string
}

interface Event {
  id: string
  title: string
  description: string | null
  event_date: string
  max_teams: number
  status: string
  case_id: string | null
}

interface Team {
  id: string
  name: string
  code: string | null
  status: string
  email: string | null
  phone: string | null
  members_count: number | null
  registered_at: string
}

const STATUS_COLORS: Record<string, string> = {
  registration: '#b8860b',
  ready: '#4a9ada',
  active: '#40c070',
  finished: '#555',
}

export default function HostPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [cases, setCases] = useState<Case[]>([])
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [teams, setTeams] = useState<Team[]>([])
  const [view, setView] = useState<'events' | 'new-event' | 'manage'>('events')
  const [selectedCaseId, setSelectedCaseId] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState('')
  const [maxTeams, setMaxTeams] = useState('20')
  const [creating, setCreating] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => {
    loadEvents()
    loadCases()
  }, [])

  async function loadCases() {
    const { data } = await supabase
      .from('cases')
      .select('id, title, year, city')
      .order('title')
    if (data) setCases(data)
  }

  async function loadEvents() {
    const { data } = await supabase.from('events').select('*').order('event_date', { ascending: false })
    if (data) setEvents(data)
  }

  async function loadTeams(eventId: string) {
    const { data } = await supabase.from('teams').select('*').eq('event_id', eventId).order('registered_at')
    if (data) setTeams(data)
  }

  async function createEvent() {
    if (!selectedCaseId || !date) return
    const selectedCase = cases.find(c => c.id === selectedCaseId)
    if (!selectedCase) return

    setCreating(true)
    const { data, error } = await supabase.from('events').insert({
      title: selectedCase.title,
      case_id: selectedCaseId,
      description: description.trim() || null,
      event_date: date,
      max_teams: parseInt(maxTeams),
      status: 'registration',
    }).select().single()
    setCreating(false)
    if (!error && data) {
      await loadEvents()
      setSelectedCaseId(''); setDescription(''); setDate(''); setMaxTeams('20')
      setView('events')
    }
  }

  async function selectEvent(event: Event) {
    setSelectedEvent(event)
    await loadTeams(event.id)
    setView('manage')
  }

  async function generateCode(teamId: string) {
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    await supabase.from('teams').update({ code }).eq('id', teamId)
    setTeams(prev => prev.map(t => t.id === teamId ? { ...t, code } : t))
  }

  async function generateAllCodes() {
    for (const team of teams) {
      if (!team.code) await generateCode(team.id)
    }
    if (selectedEvent) await loadTeams(selectedEvent.id)
  }

  async function deleteTeam(teamId: string) {
    await supabase.from('teams').delete().eq('id', teamId)
    setTeams(prev => prev.filter(t => t.id !== teamId))
  }

  async function setEventStatus(status: string) {
    if (!selectedEvent) return
    await supabase.from('events').update({ status }).eq('id', selectedEvent.id)
    setSelectedEvent(prev => prev ? { ...prev, status } : null)
    await loadEvents()
  }

  function copyText(text: string, key: string) {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  const getRegisterLink = (eventId: string) =>
    `${window.location.origin}/register?event=${eventId}`

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '13px 16px',
    background: '#080603',
    border: '1px solid rgba(184,134,11,0.2)',
    borderBottom: '1px solid rgba(184,134,11,0.5)',
    color: '#e8dfc4', fontSize: 15, outline: 'none',
    fontFamily: 'Remington, monospace',
    boxSizing: 'border-box',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontFamily: 'Cocomat, sans-serif',
    fontWeight: 300,
    fontSize: 10, letterSpacing: 4,
    textTransform: 'uppercase', color: '#e8dfc4', marginBottom: 8,
  }

  const sectionDivider = (label: string) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
      <div style={{ height: 1, width: 24, background: '#b8860b' }} />
      <div style={{ fontFamily: 'Cocomat, sans-serif', fontWeight: 200, color: '#e8dfc4', fontSize: 10, letterSpacing: 5, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ height: 1, flex: 1, background: 'linear-gradient(to right, rgba(184,134,11,0.3), transparent)' }} />
    </div>
  )

  const navBtn = (active: boolean): React.CSSProperties => ({
    fontFamily: 'Cocomat, sans-serif', fontWeight: 300,
    fontSize: 10, letterSpacing: 4, textTransform: 'uppercase',
    padding: '8px 20px',
    border: '1px solid #b8860b',
    background: active ? '#b8860b' : 'transparent',
    color: active ? '#080603' : '#b8860b',
    cursor: 'pointer',
    clipPath: 'polygon(8px 0%, calc(100% - 8px) 0%, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 0% calc(100% - 8px), 0% 8px)',
  })

  const actionBtn = (color: string, filled = false): React.CSSProperties => ({
    fontFamily: 'Cocomat, sans-serif', fontWeight: 300,
    fontSize: 10, letterSpacing: 3, textTransform: 'uppercase',
    padding: '7px 16px',
    border: `1px solid ${color}`,
    background: filled ? color : 'transparent',
    color: filled ? '#080603' : color,
    cursor: 'pointer',
    clipPath: 'polygon(6px 0%, calc(100% - 6px) 0%, 100% 6px, 100% calc(100% - 6px), calc(100% - 6px) 100%, 6px 100%, 0% calc(100% - 6px), 0% 6px)',
  })

  const statusBadge = (status: string) => (
    <div style={{
      display: 'inline-block',
      fontFamily: 'Cocomat, sans-serif', fontWeight: 300,
      fontSize: 9, letterSpacing: 3, textTransform: 'uppercase',
      color: STATUS_COLORS[status] || '#555',
      border: `1px solid ${STATUS_COLORS[status] || '#555'}`,
      padding: '4px 14px',
      clipPath: 'polygon(6px 0%, calc(100% - 6px) 0%, 100% 6px, 100% calc(100% - 6px), calc(100% - 6px) 100%, 6px 100%, 0% calc(100% - 6px), 0% 6px)',
    }}>
      {status}
    </div>
  )

  return (
    <div style={{ width: '100vw', minHeight: '100vh', background: '#080603', fontFamily: 'Ovo, serif' }}>

      {/* Top bar */}
      <div style={{
        background: '#0a0805',
        borderBottom: '1px solid rgba(184,134,11,0.3)',
        padding: '0 48px', height: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'relative',
      }}>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(to right, transparent, #b8860b 20%, #b8860b 80%, transparent)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ fontFamily: 'ParkLane, serif', color: '#c9a84c', fontSize: 24, letterSpacing: 4 }}>The Casebook</div>
          <div style={{ width: 1, height: 20, background: 'rgba(184,134,11,0.3)' }} />
          <div style={{ fontFamily: 'Cocomat, sans-serif', fontWeight: 200, color: '#5a4a2a', fontSize: 10, letterSpacing: 5, textTransform: 'uppercase' }}>Host Panel</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button onClick={() => setView('events')} style={navBtn(view === 'events')}>Events</button>
          <button onClick={() => setView('new-event')} style={navBtn(view === 'new-event')}>+ New Event</button>
          <div style={{ width: 1, height: 20, background: 'rgba(184,134,11,0.2)', margin: '0 4px' }} />
          <a href="/" style={{ ...navBtn(false), textDecoration: 'none', color: '#5a4a2a', borderColor: '#3a2a10' }}>Exit</a>
        </div>
      </div>

      <div style={{ padding: '48px', maxWidth: 1000, margin: '0 auto' }}>

        {/* EVENTS LIST */}
        {view === 'events' && (
          <div>
            {sectionDivider('All Events')}
            {events.length === 0 && (
              <div style={{ border: '1px solid rgba(184,134,11,0.15)', padding: '48px', textAlign: 'center', fontFamily: 'Ovo, serif', color: '#e8dfc4', fontSize: 14 }}>
                No events yet. Create one →
              </div>
            )}
            {events.map(ev => (
              <div
                key={ev.id}
                onClick={() => selectEvent(ev)}
                style={{
                  background: '#0a0805',
                  border: '1px solid rgba(184,134,11,0.15)',
                  borderLeft: `2px solid ${STATUS_COLORS[ev.status] || '#555'}`,
                  padding: '20px 28px', marginBottom: 8, cursor: 'pointer',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#0d0a06')}
                onMouseLeave={e => (e.currentTarget.style.background = '#0a0805')}
              >
                <div>
                  <div style={{ fontFamily: 'Remington, monospace', color: '#e8dfc4', fontSize: 18, marginBottom: 6 }}>
                    {ev.title}
                  </div>
                  {ev.description && (
                    <div style={{ fontFamily: 'Ovo, serif', color: '#e8dfc4', fontSize: 13, marginBottom: 6, fontStyle: 'italic' }}>
                      {ev.description}
                    </div>
                  )}
                  <div style={{ fontFamily: 'Cocomat, sans-serif', fontWeight: 200, color: '#e8dfc4', fontSize: 10, letterSpacing: 3 }}>
                    {ev.event_date} · max {ev.max_teams} teams
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {statusBadge(ev.status)}
                  <button
                    onClick={e => {
                      e.stopPropagation()
                      if (!confirm('Delete this event and all its teams?')) return
                      supabase.from('teams').delete().eq('event_id', ev.id).then(() =>
                        supabase.from('events').delete().eq('id', ev.id).then(() =>
                          setEvents(prev => prev.filter(x => x.id !== ev.id))
                        )
                      )
                    }}
                    title="Delete event"
                    style={{
                      background: 'none',
                      border: '1px solid rgba(204,68,68,0.3)',
                      color: '#cc4444', cursor: 'pointer',
                      padding: '6px 9px', fontSize: 13, lineHeight: 1,
                      clipPath: 'polygon(4px 0%, calc(100% - 4px) 0%, 100% 4px, 100% calc(100% - 4px), calc(100% - 4px) 100%, 4px 100%, 0% calc(100% - 4px), 0% 4px)',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(204,68,68,0.15)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                  >
                    🗑
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* NEW EVENT */}
        {view === 'new-event' && (
          <div style={{ maxWidth: 560 }}>
            {sectionDivider('New Event')}
            <div style={{ border: '1px solid rgba(184,134,11,0.2)', padding: '40px 44px' }}>

              {/* Case selector */}
              <div style={{ marginBottom: 24 }}>
                <label style={labelStyle}>Case</label>
                <select
                  value={selectedCaseId}
                  onChange={e => setSelectedCaseId(e.target.value)}
                  style={{
                    ...inputStyle,
                    appearance: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <option value="" style={{ background: '#080603' }}>— Select a case —</option>
                  {cases.map(c => (
                    <option key={c.id} value={c.id} style={{ background: '#080603' }}>
                      {c.title} · {c.city} · {c.year}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={labelStyle}>Description</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)}
                  placeholder="Brief description for participants..."
                  rows={3}
                  style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.7 }} />
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={labelStyle}>Date</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} style={inputStyle} />
              </div>
              <div style={{ marginBottom: 36 }}>
                <label style={labelStyle}>Max Teams</label>
                <input type="number" value={maxTeams} onChange={e => setMaxTeams(e.target.value)} style={inputStyle} />
              </div>

              <button
                onClick={createEvent}
                disabled={creating || !selectedCaseId || !date}
                className="btn-deco"
                style={{
                  padding: '14px 40px',
                  background: (creating || !selectedCaseId || !date) ? 'transparent' : '#b8860b',
                  color: (creating || !selectedCaseId || !date) ? '#b8860b' : '#080603',
                  border: '1px solid #b8860b',
                  cursor: (creating || !selectedCaseId || !date) ? 'default' : 'pointer',
                  opacity: (!selectedCaseId || !date) ? 0.5 : 1,
                  fontFamily: 'Cocomat, sans-serif', fontWeight: 300,
                  fontSize: 11, letterSpacing: 5, textTransform: 'uppercase',
                }}
              >
                {creating ? 'Creating...' : 'Create Event'}
              </button>
            </div>
          </div>
        )}

        {/* MANAGE EVENT */}
        {view === 'manage' && selectedEvent && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40 }}>
              <div>
                <div style={{ fontFamily: 'Remington, monospace', color: '#e8dfc4', fontSize: 26, marginBottom: 8 }}>
                  {selectedEvent.title}
                </div>
                {selectedEvent.description && (
                  <div style={{ fontFamily: 'Ovo, serif', color: '#e8dfc4', fontSize: 14, fontStyle: 'italic', marginBottom: 10, maxWidth: 500, lineHeight: 1.7 }}>
                    {selectedEvent.description}
                  </div>
                )}
                <div style={{ fontFamily: 'Cocomat, sans-serif', fontWeight: 200, color: '#e8dfc4', fontSize: 10, letterSpacing: 3, marginBottom: 12 }}>
                  {selectedEvent.event_date} · {teams.length} teams registered
                </div>
                {statusBadge(selectedEvent.status)}
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                <button onClick={generateAllCodes} style={actionBtn('#4a9ada')}>Generate All Codes</button>
                {selectedEvent.status === 'registration' && (
                  <button onClick={() => setEventStatus('active')} style={actionBtn('#40c070', true)}>▶ Start Game</button>
                )}
                {selectedEvent.status === 'active' && (
                  <button onClick={() => setEventStatus('finished')} style={actionBtn('#cc4444', true)}>■ Stop Game</button>
                )}
              </div>
            </div>

            {sectionDivider('Teams')}

            <div style={{ border: '1px solid rgba(184,134,11,0.15)', marginBottom: 40 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 70px 180px 110px 150px', padding: '10px 24px', borderBottom: '1px solid rgba(184,134,11,0.2)', background: '#0a0805' }}>
                {['Team', 'Size', 'Email', 'Code', 'Actions'].map(h => (
                  <div key={h} style={{ fontFamily: 'Cocomat, sans-serif', fontWeight: 200, fontSize: 9, letterSpacing: 4, textTransform: 'uppercase', color: '#e8dfc4' }}>{h}</div>
                ))}
              </div>
              {teams.length === 0 && (
                <div style={{ padding: '40px 24px', fontFamily: 'Ovo, serif', color: '#e8dfc4', fontSize: 14, textAlign: 'center' }}>
                  No teams registered yet.
                </div>
              )}
              {teams.map((team, i) => (
                <div key={team.id} style={{
                  display: 'grid', gridTemplateColumns: '1fr 70px 180px 110px 150px',
                  padding: '14px 24px', alignItems: 'center',
                  borderBottom: i < teams.length - 1 ? '1px solid rgba(184,134,11,0.08)' : 'none',
                  background: i % 2 === 0 ? '#080603' : '#0a0805',
                }}>
                  <div>
                    <div style={{ fontFamily: 'Remington, monospace', color: '#e8dfc4', fontSize: 14 }}>{team.name}</div>
                    {team.phone && <div style={{ fontFamily: 'Cocomat, sans-serif', fontWeight: 200, color: '#e8dfc4', fontSize: 10, marginTop: 3, letterSpacing: 1 }}>{team.phone}</div>}
                  </div>
                  <div style={{ fontFamily: 'Cocomat, sans-serif', fontWeight: 200, color: '#e8dfc4', fontSize: 12 }}>{team.members_count || 1} ppl</div>
                  <div style={{ fontFamily: 'Ovo, serif', color: '#e8dfc4', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{team.email || '—'}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontFamily: 'Remington, monospace', fontSize: 15, letterSpacing: 3, color: team.code ? '#40c070' : '#3a2a10' }}>
                      {team.code || '——'}
                    </span>
                    {team.code && (
                      <button onClick={() => copyText(team.code!, 'code-' + team.id)} style={{
                        fontFamily: 'Cocomat, sans-serif', fontWeight: 300,
                        fontSize: 8, padding: '2px 7px',
                        border: '1px solid #40c070',
                        color: copied === 'code-' + team.id ? '#080603' : '#40c070',
                        background: copied === 'code-' + team.id ? '#40c070' : 'none',
                        cursor: 'pointer', letterSpacing: 2, textTransform: 'uppercase',
                      }}>
                        {copied === 'code-' + team.id ? '✓' : 'Copy'}
                      </button>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {!team.code && <button onClick={() => generateCode(team.id)} style={actionBtn('#4a9ada')}>Gen Code</button>}
                    <button onClick={() => deleteTeam(team.id)} style={actionBtn('#cc4444')}>Delete</button>
                  </div>
                </div>
              ))}
            </div>

            {sectionDivider('Links')}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {[
                { label: 'Registration Link — share with teams', value: typeof window !== 'undefined' ? getRegisterLink(selectedEvent.id) : '...', key: 'reg-link' },
                { label: 'Event ID', value: selectedEvent.id, key: 'event-id' },
              ].map(item => (
                <div key={item.key} style={{ padding: '20px 24px', background: '#0a0805', border: '1px solid rgba(184,134,11,0.15)' }}>
                  <div style={{ fontFamily: 'Cocomat, sans-serif', fontWeight: 200, fontSize: 9, letterSpacing: 4, textTransform: 'uppercase', color: '#e8dfc4', marginBottom: 10 }}>
                    {item.label}
                  </div>
                  <div style={{ fontFamily: 'Ovo, serif', color: '#b8860b', fontSize: 12, wordBreak: 'break-all', marginBottom: 14, lineHeight: 1.6 }}>
                    {item.value}
                  </div>
                  <button onClick={() => copyText(item.value, item.key)} style={actionBtn('#b8860b', copied === item.key)}>
                    {copied === item.key ? '✓ Copied' : 'Copy'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
