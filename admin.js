/* =========================================================
   Åland Parks — Admin Interface
   ========================================================= */
(function () {
  'use strict';

  const STORAGE_KEY    = 'aland_parks';
  const CONTRIB_KEY    = 'aland_contributions';
  const CATEGORY_CONFIG = window.ALAND_CATEGORY_CONFIG;

  // =========================================================
  // STATE
  // =========================================================

  let parks      = [];
  let map;
  let selectedId = null;   // id of currently selected park (or null)
  let isAdding   = false;  // true while placing a new park on the map
  const markers  = {};     // id → L.marker

  // =========================================================
  // PERSISTENCE
  // =========================================================

  function loadParks() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        parks = JSON.parse(saved);
        return;
      }
    } catch (e) { /* fall through */ }
    parks = window.ALAND_PARKS_DEFAULT.map(p => Object.assign({}, p, {
      features: p.features ? p.features.slice() : [],
    }));
  }

  function saveParks() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(parks));
    flashStatus('Sparad');
  }

  function flashStatus(msg) {
    const el = document.getElementById('save-status');
    el.textContent = msg;
    clearTimeout(el._t);
    el._t = setTimeout(() => { el.textContent = ''; }, 2500);
  }

  // =========================================================
  // MAP
  // =========================================================

  function initMap() {
    map = L.map('map', { center: [60.22, 20.05], zoom: 10, zoomControl: true });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '\u00a9 <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    map.on('click', onMapClick);
  }

  // =========================================================
  // MARKERS
  // =========================================================

  function markerIcon(park, selected) {
    const cfg = CATEGORY_CONFIG[park.category];
    const div = document.createElement('div');
    div.className = 'admin-marker' + (selected ? ' selected' : '');
    div.style.background = cfg ? cfg.color : '#666';
    div.textContent = cfg ? cfg.icon : '?';
    return L.divIcon({
      html:        div.outerHTML,
      className:   '',
      iconSize:    [30, 30],
      iconAnchor:  [15, 30],
      popupAnchor: [0, -34],
    });
  }

  function addMarker(park) {
    const marker = L.marker([park.lat, park.lng], {
      draggable: true,
      icon: markerIcon(park, false),
    }).addTo(map);

    marker.on('click', () => selectPark(park.id));

    marker.on('drag', (e) => {
      const pos = e.target.getLatLng();
      const p   = parks.find(x => x.id === park.id);
      if (!p) return;
      p.lat = round5(pos.lat);
      p.lng = round5(pos.lng);
      if (selectedId === park.id) {
        document.getElementById('f-lat').value = p.lat;
        document.getElementById('f-lng').value = p.lng;
      }
    });

    marker.on('dragend', () => saveParks());

    markers[park.id] = marker;
  }

  function refreshMarkerIcon(id) {
    const marker = markers[id];
    if (!marker) return;
    const park = parks.find(p => p.id === id);
    if (!park) return;
    marker.setIcon(markerIcon(park, id === selectedId));
  }

  function removeMarker(id) {
    if (markers[id]) { map.removeLayer(markers[id]); delete markers[id]; }
  }

  // =========================================================
  // SELECTION
  // =========================================================

  function selectPark(id) {
    const prev = selectedId;
    selectedId = id;

    if (prev) refreshMarkerIcon(prev);
    refreshMarkerIcon(id);

    document.querySelectorAll('.park-list-item').forEach(li => {
      li.classList.toggle('active', li.dataset.id === id);
    });

    fillForm(parks.find(p => p.id === id));
    showForm(false);
  }

  function clearSelection() {
    const prev = selectedId;
    selectedId = null;
    isAdding   = false;
    if (prev) refreshMarkerIcon(prev);
    document.querySelectorAll('.park-list-item').forEach(li => li.classList.remove('active'));
    document.getElementById('form-section').classList.add('hidden');
    document.getElementById('map').classList.remove('placing-mode');
    document.getElementById('place-hint').style.display = 'none';
  }

  // =========================================================
  // FORM
  // =========================================================

  function buildCategorySelect() {
    const sel = document.getElementById('f-category');
    sel.textContent = '';
    Object.entries(CATEGORY_CONFIG).forEach(([val, cfg]) => {
      const opt = document.createElement('option');
      opt.value = val;
      opt.textContent = cfg.label;
      sel.appendChild(opt);
    });
  }

  function fillForm(park) {
    if (!park) return;
    document.getElementById('f-name').value         = park.name || '';
    document.getElementById('f-category').value     = park.category || Object.keys(CATEGORY_CONFIG)[0];
    document.getElementById('f-municipality').value = park.municipality || '';
    document.getElementById('f-area').value         = park.area || '';
    document.getElementById('f-lat').value          = park.lat || '';
    document.getElementById('f-lng').value          = park.lng || '';
    document.getElementById('f-description').value  = park.description || '';
    document.getElementById('f-features').value     = (park.features || []).join(', ');
    document.getElementById('form-title').textContent = 'Redigera park';
    document.getElementById('btn-delete-park').style.display = '';
  }

  function readForm() {
    return {
      name:         document.getElementById('f-name').value.trim(),
      category:     document.getElementById('f-category').value,
      municipality: document.getElementById('f-municipality').value.trim(),
      area:         document.getElementById('f-area').value.trim(),
      lat:          round5(parseFloat(document.getElementById('f-lat').value) || 0),
      lng:          round5(parseFloat(document.getElementById('f-lng').value) || 0),
      description:  document.getElementById('f-description').value.trim(),
      features:     document.getElementById('f-features').value
                      .split(',').map(s => s.trim()).filter(Boolean),
    };
  }

  function showForm(adding) {
    document.getElementById('form-section').classList.remove('hidden');
    document.getElementById('place-hint').style.display = adding ? '' : 'none';
    if (adding) {
      document.getElementById('form-title').textContent = 'Ny park';
      document.getElementById('btn-delete-park').style.display = 'none';
      document.getElementById('f-name').focus();
    }
  }

  // Sync lat/lng inputs → move marker (on blur to avoid excessive redraws)
  function wireCoordInputs() {
    ['f-lat', 'f-lng'].forEach(id => {
      document.getElementById(id).addEventListener('change', () => {
        if (!selectedId) return;
        const lat = parseFloat(document.getElementById('f-lat').value);
        const lng = parseFloat(document.getElementById('f-lng').value);
        if (isNaN(lat) || isNaN(lng)) return;
        const park = parks.find(p => p.id === selectedId);
        if (!park) return;
        park.lat = round5(lat);
        park.lng = round5(lng);
        if (markers[selectedId]) markers[selectedId].setLatLng([park.lat, park.lng]);
        saveParks();
      });
    });
  }

  // =========================================================
  // ADD NEW PARK
  // =========================================================

  function startAddNew() {
    clearSelection();
    isAdding = true;
    document.getElementById('map').classList.add('placing-mode');
    // Show blank form with placement hint
    document.getElementById('f-name').value         = '';
    document.getElementById('f-category').value     = Object.keys(CATEGORY_CONFIG)[0];
    document.getElementById('f-municipality').value = '';
    document.getElementById('f-area').value         = '';
    document.getElementById('f-lat').value          = '';
    document.getElementById('f-lng').value          = '';
    document.getElementById('f-description').value  = '';
    document.getElementById('f-features').value     = '';
    showForm(true);
  }

  function onMapClick(e) {
    if (!isAdding) return;

    const lat = round5(e.latlng.lat);
    const lng = round5(e.latlng.lng);
    document.getElementById('f-lat').value = lat;
    document.getElementById('f-lng').value = lng;
    document.getElementById('place-hint').style.display = 'none';
    document.getElementById('map').classList.remove('placing-mode');

    // Create a temporary marker so the user can see where they clicked
    const tempId = '_new_' + Date.now();
    const tempPark = {
      id: tempId, name: 'Ny park', category: document.getElementById('f-category').value,
      lat, lng, municipality: '', area: '', description: '', features: [],
    };
    addMarker(tempPark);
    selectedId = tempId;
    refreshMarkerIcon(tempId);
    isAdding = false;
  }

  // =========================================================
  // SAVE / DELETE
  // =========================================================

  function onSave() {
    const data = readForm();
    if (!data.name) { alert('Ange ett namn för parken.'); return; }
    if (!data.lat || !data.lng) { alert('Koordinater saknas. Klicka på kartan för att placera parken.'); return; }

    if (selectedId && selectedId.startsWith('_new_')) {
      // Commit the temp marker as a real park
      removeMarker(selectedId);
      const newId = 'park-' + Date.now();
      data.id = newId;
      parks.push(data);
      saveParks();
      addMarker(data);
      selectedId = newId;
      refreshMarkerIcon(newId);
      renderParksList();
      selectPark(newId);
    } else if (selectedId) {
      // Update existing park
      const idx = parks.findIndex(p => p.id === selectedId);
      if (idx === -1) return;
      Object.assign(parks[idx], data);
      saveParks();
      // Rebuild marker (category/color may have changed)
      removeMarker(selectedId);
      addMarker(parks[idx]);
      refreshMarkerIcon(selectedId);
      renderParksList();
      // Keep it selected
      document.querySelectorAll('.park-list-item').forEach(li => {
        li.classList.toggle('active', li.dataset.id === selectedId);
      });
    }
    flashStatus('Sparad \u2713');
  }

  function onDelete() {
    if (!selectedId || selectedId.startsWith('_new_')) {
      removeMarker(selectedId);
      clearSelection();
      return;
    }
    const park = parks.find(p => p.id === selectedId);
    if (!park) return;
    if (!confirm('Ta bort "' + park.name + '"?')) return;
    parks = parks.filter(p => p.id !== selectedId);
    saveParks();
    removeMarker(selectedId);
    clearSelection();
    renderParksList();
  }

  // =========================================================
  // PARKS LIST
  // =========================================================

  function renderParksList() {
    const ul = document.getElementById('parks-list');
    ul.textContent = '';

    parks.forEach(park => {
      const cfg = CATEGORY_CONFIG[park.category];
      const li  = document.createElement('li');
      li.className = 'park-list-item' + (park.id === selectedId ? ' active' : '');
      li.dataset.id = park.id;
      li.style.setProperty('--c', cfg ? cfg.color : '#888');

      const dot = document.createElement('span');
      dot.className = 'park-list-dot';

      const textWrap = document.createElement('div');
      textWrap.className = 'park-list-text';

      const strong = document.createElement('strong');
      strong.textContent = park.name;

      const sub = document.createElement('span');
      sub.textContent = (cfg ? cfg.label : park.category) + (park.municipality ? ' \u2022 ' + park.municipality : '');

      textWrap.append(strong, sub);
      li.append(dot, textWrap);

      li.addEventListener('click', () => {
        if (markers[park.id]) map.flyTo([park.lat, park.lng], 13, { duration: 0.8 });
        selectPark(park.id);
      });

      ul.appendChild(li);
    });

    document.getElementById('list-count').textContent = parks.length + ' parker';
  }

  // =========================================================
  // EXPORT
  // =========================================================

  function exportData() {
    const lines = [];
    lines.push('/* =========================================================');
    lines.push('   Åland Parks — Shared Data');
    lines.push('   Generated by admin.html on ' + new Date().toISOString().slice(0, 10));
    lines.push('   ========================================================= */');
    lines.push('');
    lines.push('window.ALAND_CATEGORY_CONFIG = ' + JSON.stringify(CATEGORY_CONFIG, null, 2) + ';');
    lines.push('');
    lines.push('window.ALAND_PARKS_DEFAULT = ' + JSON.stringify(parks, null, 2) + ';');

    const blob = new Blob([lines.join('\n')], { type: 'application/javascript' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = 'parks-data.js';
    a.click();
    URL.revokeObjectURL(url);
    flashStatus('Exporterad');
  }

  // =========================================================
  // RESET
  // =========================================================

  function resetToDefaults() {
    if (!confirm('Återställ till standarddata? Alla dina ändringar raderas.')) return;
    localStorage.removeItem(STORAGE_KEY);
    loadParks();
    // Rebuild all markers
    Object.keys(markers).forEach(removeMarker);
    parks.forEach(addMarker);
    clearSelection();
    renderParksList();
    flashStatus('Återställd');
  }

  // =========================================================
  // CONTRIBUTIONS
  // =========================================================

  function loadContributions() {
    try {
      const raw = localStorage.getItem(CONTRIB_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
  }

  function saveContributions(arr) {
    localStorage.setItem(CONTRIB_KEY, JSON.stringify(arr));
  }

  function updateContribBadge() {
    const pending = loadContributions().filter(c => c.status === 'pending');
    const badge   = document.getElementById('contrib-badge');
    if (!badge) return;
    if (pending.length > 0) {
      badge.textContent = pending.length;
      badge.removeAttribute('hidden');
    } else {
      badge.setAttribute('hidden', '');
    }
  }

  function renderContributionsList() {
    const ul = document.getElementById('contributions-list');
    if (!ul) return;
    ul.textContent = '';

    const pending = loadContributions().filter(c => c.status === 'pending');

    if (pending.length === 0) {
      const li = document.createElement('li');
      li.className = 'contrib-empty';
      li.textContent = 'Inga väntande bidrag.';
      ul.appendChild(li);
      updateContribBadge();
      return;
    }

    pending.forEach(contrib => {
      const li = document.createElement('li');
      li.className = 'contrib-item';
      li.dataset.id = contrib.id;

      // Header row
      const hdr = document.createElement('div');
      hdr.className = 'contrib-item-header';

      const typeBadge = document.createElement('span');
      typeBadge.className = 'contrib-type-badge contrib-type-' + contrib.type;
      typeBadge.textContent = contrib.type === 'new' ? 'Ny plats' : 'Redigering';

      const date = document.createElement('span');
      date.className = 'contrib-date';
      date.textContent = new Date(contrib.timestamp).toLocaleDateString('sv-SE');

      hdr.append(typeBadge, date);

      // Diff table
      const originalPark = contrib.type === 'edit' ? parks.find(p => p.id === contrib.parkId) : null;
      const fields = [
        ['Namn', 'name'], ['Kategori', 'category'], ['Kommun', 'municipality'],
        ['Areal', 'area'], ['Lat', 'lat'], ['Lng', 'lng'], ['Beskrivning', 'description'],
      ];

      const table = document.createElement('table');
      table.className = 'contrib-diff-table';

      fields.forEach(([label, key]) => {
        const newVal = contrib.data[key] != null ? String(contrib.data[key]) : '';
        const oldVal = originalPark ? (originalPark[key] != null ? String(originalPark[key]) : '') : '';
        if (!newVal && !oldVal) return;

        const tr = document.createElement('tr');
        const tdLabel = document.createElement('td');
        tdLabel.className = 'cdiff-label';
        tdLabel.textContent = label;

        const tdVal = document.createElement('td');
        tdVal.className = 'cdiff-val';

        if (contrib.type === 'edit' && oldVal !== newVal) {
          const del = document.createElement('del');
          del.textContent = oldVal;
          const ins = document.createElement('ins');
          ins.textContent = newVal;
          tdVal.append(del, document.createTextNode(' \u2192 '), ins);
        } else {
          tdVal.textContent = newVal;
        }

        tr.append(tdLabel, tdVal);
        table.appendChild(tr);
      });

      li.append(hdr, table);

      // Author / note
      if (contrib.authorName || contrib.note) {
        const meta = document.createElement('div');
        meta.className = 'contrib-meta';
        if (contrib.authorName) {
          const s = document.createElement('span');
          s.textContent = 'Fr\u00e5n: ' + contrib.authorName;
          meta.appendChild(s);
        }
        if (contrib.note) {
          const s = document.createElement('span');
          s.textContent = 'Not: ' + contrib.note;
          meta.appendChild(s);
        }
        li.appendChild(meta);
      }

      // Photo
      if (contrib.photoUrl) {
        const photoWrap = document.createElement('div');
        photoWrap.className = 'contrib-photo-wrap';
        const img = document.createElement('img');
        img.src = contrib.photoUrl;
        img.alt = 'Contribution photo';
        img.className = 'contrib-photo-thumb';
        const link = document.createElement('a');
        link.href = contrib.photoUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.appendChild(img);
        photoWrap.appendChild(link);
        li.appendChild(photoWrap);
      }

      // Actions
      const actions = document.createElement('div');
      actions.className = 'contrib-actions';

      const approveBtn = document.createElement('button');
      approveBtn.className = 'contrib-btn contrib-btn-approve';
      approveBtn.textContent = 'Godk\u00e4nn';
      approveBtn.addEventListener('click', () => onApprove(contrib.id));

      const dismissBtn = document.createElement('button');
      dismissBtn.className = 'contrib-btn contrib-btn-dismiss';
      dismissBtn.textContent = 'Avvisa';
      dismissBtn.addEventListener('click', () => onDismiss(contrib.id));

      actions.append(approveBtn, dismissBtn);
      li.appendChild(actions);
      ul.appendChild(li);
    });

    updateContribBadge();
  }

  function onApprove(contribId) {
    const contributions = loadContributions();
    const contrib = contributions.find(c => c.id === contribId);
    if (!contrib) return;

    if (contrib.type === 'edit') {
      const idx = parks.findIndex(p => p.id === contrib.parkId);
      if (idx !== -1) {
        Object.assign(parks[idx], contrib.data);
        if (markers[contrib.parkId]) {
          markers[contrib.parkId].setLatLng([parks[idx].lat, parks[idx].lng]);
          refreshMarkerIcon(contrib.parkId);
        }
        renderParksList();
      }
    } else if (contrib.type === 'new') {
      const newId   = 'park-' + Date.now();
      const newPark = Object.assign({ id: newId }, contrib.data);
      parks.push(newPark);
      addMarker(newPark);
      renderParksList();
    }

    saveParks();
    contrib.status = 'approved';
    saveContributions(contributions);
    renderContributionsList();
    flashStatus('Godk\u00e4nd \u2713');
  }

  function onDismiss(contribId) {
    const contributions = loadContributions();
    const contrib = contributions.find(c => c.id === contribId);
    if (!contrib) return;
    contrib.status = 'dismissed';
    saveContributions(contributions);
    renderContributionsList();
    flashStatus('Avvisad');
  }

  // =========================================================
  // HELPERS
  // =========================================================

  function round5(n) { return Math.round(n * 100000) / 100000; }

  // =========================================================
  // STARTUP
  // =========================================================

  function start() {
    loadParks();
    initMap();
    buildCategorySelect();
    parks.forEach(addMarker);
    renderParksList();
    wireCoordInputs();

    document.getElementById('btn-add-park').addEventListener('click', startAddNew);
    document.getElementById('btn-form-cancel').addEventListener('click', clearSelection);
    document.getElementById('btn-save-park').addEventListener('click', (e) => { e.preventDefault(); onSave(); });
    document.getElementById('btn-delete-park').addEventListener('click', onDelete);
    document.getElementById('btn-export').addEventListener('click', exportData);
    document.getElementById('btn-reset').addEventListener('click', resetToDefaults);

    // Prevent accidental form submission
    document.getElementById('park-form').addEventListener('submit', e => e.preventDefault());

    // Tab switching
    document.getElementById('tab-parks').addEventListener('click', () => {
      document.getElementById('parks-tab').removeAttribute('hidden');
      document.getElementById('contrib-tab').setAttribute('hidden', '');
      document.getElementById('tab-parks').classList.add('active');
      document.getElementById('tab-contributions').classList.remove('active');
    });
    document.getElementById('tab-contributions').addEventListener('click', () => {
      document.getElementById('parks-tab').setAttribute('hidden', '');
      document.getElementById('contrib-tab').removeAttribute('hidden');
      document.getElementById('tab-parks').classList.remove('active');
      document.getElementById('tab-contributions').classList.add('active');
      renderContributionsList();
    });

    updateContribBadge();

    setTimeout(() => map.invalidateSize(), 100);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }

})();
