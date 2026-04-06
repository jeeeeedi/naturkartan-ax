import { useState } from 'react'

export function useFormFields(initialState) {
  const [form, setForm] = useState(initialState)
  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }))
  return { form, setForm, set }
}
