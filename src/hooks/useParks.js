import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

// PostgREST may return geography columns as GeoJSON strings or objects
function parseLocation(loc) {
  if (!loc) return null
  if (typeof loc === 'string') {
    try { return JSON.parse(loc) } catch { return null }
  }
  return loc
}

function normalisePark(p) {
  return { ...p, location: parseLocation(p.location) }
}

export function useParks() {
  const [parks, setParks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    supabase
      .from('parks')
      .select('*, categories(*)')
      .order('name_sv')
      .then(({ data, error }) => {
        if (error) setError(error)
        else setParks((data ?? []).map(normalisePark))
        setLoading(false)
      })
  }, [])

  const refetch = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('parks')
      .select('*, categories(*)')
      .order('name_sv')
    if (!error) setParks((data ?? []).map(normalisePark))
    setLoading(false)
  }

  return { parks, loading, error, refetch }
}
