import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

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
        else setParks(data ?? [])
        setLoading(false)
      })
  }, [])

  const refetch = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('parks')
      .select('*, categories(*)')
      .order('name_sv')
    if (!error) setParks(data ?? [])
    setLoading(false)
  }

  return { parks, loading, error, refetch }
}
