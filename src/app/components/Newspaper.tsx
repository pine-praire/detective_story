'use client'

export default function Newspaper({ pdfUrl, title }: { pdfUrl: string; title?: string }) {
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: '#1a1408' }}>
      <div style={{ padding: '12px 20px', borderBottom: '1px solid #2a1f0a', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ fontFamily: 'Special Elite, cursive', color: '#b8860b', fontSize: 14, letterSpacing: 2 }}>
          {title || 'Daily Pines'}
        </div>
        <a href={pdfUrl} target="_blank" rel="noopener noreferrer" style={{ fontFamily: 'Courier Prime, monospace', fontSize: 9, letterSpacing: 1, textTransform: 'uppercase', color: '#8a7a5a', textDecoration: 'none', border: '1px solid #3a2a10', padding: '3px 10px' }}>
          Open full
        </a>
      </div>
      <iframe src={pdfUrl} style={{ flex: 1, border: 'none', width: '100%' }} title="Newspaper" />
    </div>
  )
}