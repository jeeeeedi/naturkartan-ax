const FACILITY_META = {
  Badplats: {
    icon: 'pool',
    color: '#2f6d8f',
    labels: { sv: 'Badplats', en: 'Swimming spot', fi: 'Uimaranta' },
  },
  Eldplats: {
    icon: 'local_fire_department',
    color: '#8d4d1f',
    labels: { sv: 'Eldplats', en: 'Firepit', fi: 'Nuotiopaikka' },
  },
  Fotoplats: {
    icon: 'photo_camera',
    color: '#6a4f8f',
    labels: { sv: 'Fotoplats', en: 'Photo spot', fi: 'Valokuvauspaikka' },
  },
  Hamn: {
    icon: 'anchor',
    color: '#245d75',
    labels: { sv: 'Hamn', en: 'Harbour', fi: 'Satama' },
  },
  Infoskylt: {
    icon: 'info',
    color: '#4d6b5e',
    labels: { sv: 'Infoskylt', en: 'Information sign', fi: 'Opastekyltit' },
  },
  Parkering: {
    icon: 'local_parking',
    color: '#3f5f57',
    labels: { sv: 'Parkering', en: 'Parking', fi: 'Pysakointi' },
  },
  Rastplats: {
    icon: 'rest_area',
    color: '#6a5a42',
    labels: { sv: 'Rastplats', en: 'Rest area', fi: 'Lepopaikka' },
  },
  Toalett: {
    icon: 'wc',
    color: '#346a6f',
    labels: { sv: 'Toalett', en: 'Toilet', fi: 'WC' },
  },
  Utsiktstorn: {
    icon: 'fort',
    color: '#5c5f44',
    labels: { sv: 'Utsiktstorn', en: 'Observation tower', fi: 'Näköalatorni' },
  },
}

function langKey(lang) {
  const key = (lang || 'sv').toLowerCase().split('-')[0]
  return ['sv', 'en', 'fi'].includes(key) ? key : 'sv'
}

export function getFacilityMeta(type, lang = 'sv') {
  const meta = FACILITY_META[type]
  const key = langKey(lang)

  if (!meta) {
    return {
      icon: 'location_on',
      color: '#506E66',
      label: type || '',
    }
  }

  return {
    icon: meta.icon,
    color: meta.color,
    label: meta.labels[key] || meta.labels.sv,
  }
}

export function listFacilityTypes() {
  return Object.keys(FACILITY_META)
}
