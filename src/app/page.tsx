'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Home() {
  const [status, setStatus] = useState('Connecting...')

  useEffect(() => {
    async function test() {
      const { data, error } = await supabase.from('cases').select('*')
      if (error) {
        setStatus('Error: ' + error.message)
      } else {
        setStatus('Connected! Tables ready. Cases in DB: ' + data.length)
      }
    }
    test()
  }, [])

  return (
    <main style={{ padding: '40px', fontFamily: 'monospace' }}>
      <h1>The Casebook</h1>
      <p>{status}</p>
    </main>
  )
}