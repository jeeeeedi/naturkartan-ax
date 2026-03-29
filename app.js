/* =========================================================
   Åland Parks — Interactive Map App
   ========================================================= */
(function () {
  'use strict';

  // =========================================================
  // 1. DATA  — from parks-data.js and translations.js globals
  // Admin edits in admin.html are persisted to localStorage.
  // =========================================================

  const MAP_CENTER = [60.22, 20.05];
  const MAP_ZOOM   = 10;
  const LANG_KEY   = 'aland_lang';

  const CATEGORY_CONFIG = window.ALAND_CATEGORY_CONFIG;
  const TR              = window.ALAND_TRANSLATIONS;

  function loadParks() {
    try {
      const saved = localStorage.getItem('aland_parks');
      if (saved) return JSON.parse(saved);
    } catch (e) { /* fall through */ }
    return window.ALAND_PARKS_DEFAULT;
  }

  // =========================================================
  // 2. I18N
  // =========================================================

  function getLang() {
    return localStorage.getItem(LANG_KEY) || 'sv';
  }

  function setLang(lang) {
    localStorage.setItem(LANG_KEY, lang);
    applyLang(lang);
  }

  // Translate a UI string key
  function t(key) {
    const lang = getLang();
    return (TR[lang] && TR[lang].ui && TR[lang].ui[key])
        || (TR.sv.ui[key])
        || key;
  }

  // Translate a category label or description
  function tCat(cat, field) {
    const lang = getLang();
    return (TR[lang] && TR[lang].categories && TR[lang].categories[cat] && TR[lang].categories[cat][field])
        || (TR.sv.categories[cat] && TR.sv.categories[cat][field])
        || '';
  }

  // Translate a park description field
  function tPark(parkId, field) {
    const lang = getLang();
    const tr   = TR[lang] && TR[lang].parks && TR[lang].parks[parkId];
    if (tr && tr[field]) return tr[field];
    const svTr = TR.sv.parks[parkId];
    if (svTr && svTr[field]) return svTr[field];
    // Fall back to raw park data field
    const park = PARKS.find(p => p.id === parkId);
    return park ? (park[field] || '') : '';
  }

  // Translate a feature term (Swedish key → current language)
  function tFeature(term) {
    const lang = getLang();
    return (TR[lang] && TR[lang].features && TR[lang].features[term])
        || (TR.sv.features[term])
        || term;
  }

  // Apply all translations to the page
  function applyLang(lang) {
    // Update <html lang>
    document.documentElement.lang = lang;

    // Update all [data-i18n] elements (UI chrome in static HTML)
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      // Keys like "cat_nature_reserve_label" → tCat lookup
      const catMatch = key.match(/^cat_(.+)_(label|desc)$/);
      if (catMatch) {
        el.textContent = tCat(catMatch[1], catMatch[2]);
      } else {
        el.textContent = t(key);
      }
    });

    // About text (full paragraph)
    const aboutEl = document.getElementById('about-text');
    if (aboutEl) aboutEl.textContent = t('aboutText');

    // Search placeholder
    const searchEl = document.getElementById('poi-search');
    if (searchEl) searchEl.placeholder = t('searchPlaceholder');

    // Rebuild all dynamic content
    rebuildCategoryFilters();
    rebuildParksList();
    rebuildLayerPanel();
    rebindPopups();

    // Update lang switcher active state
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === lang);
    });

    // Rebuild detail panel if currently open (language switch)
    if (document.body.classList.contains('detail-open')) {
      const panel = document.getElementById('park-detail');
      const name  = panel && panel.querySelector('.park-detail-name');
      if (name) {
        const park = PARKS.find(p => p.name === name.textContent);
        if (park) showParkDetail(park);
      }
    }

    document.dispatchEvent(new CustomEvent('aland:langChanged'));
  }

  // =========================================================
  // 3. STATE
  // =========================================================

  const PARKS = loadParks();
  let map;
  let pickingLocation = false;
  const parkMarkers      = {};
  const parkGroups       = {};
  const activeCategories = new Set(Object.keys(CATEGORY_CONFIG));

  // =========================================================
  // 4. MAP INIT
  // =========================================================

  function initMap() {
    map = L.map('map', { center: MAP_CENTER, zoom: MAP_ZOOM, zoomControl: true });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '\u00a9 <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);
  }

  // =========================================================
  // 5. PARK MARKERS
  // =========================================================

  function buildParkMarkers() {
    Object.keys(CATEGORY_CONFIG).forEach(cat => {
      parkGroups[cat] = L.layerGroup().addTo(map);
    });

    PARKS.forEach(park => {
      const cfg = CATEGORY_CONFIG[park.category];
      const iconDiv = document.createElement('div');
      iconDiv.className = 'poi-marker';
      iconDiv.style.background = cfg ? cfg.color : '#888';
      iconDiv.title = park.name;
      iconDiv.textContent = cfg ? cfg.icon : '?';

      const marker = L.marker([park.lat, park.lng], {
        icon: L.divIcon({
          html:        iconDiv.outerHTML,
          className:   '',
          iconSize:    [30, 30],
          iconAnchor:  [15, 30],
          popupAnchor: [0, -34],
        }),
      });

      marker.bindPopup(buildParkPopupEl(park));
      parkMarkers[park.id] = marker;
      if (parkGroups[park.category]) {
        parkGroups[park.category].addLayer(marker);
      }
    });
  }

  function buildParkPopupEl(park) {
    const cfg  = CATEGORY_CONFIG[park.category];
    const wrap = document.createElement('div');
    wrap.className = 'popup-inner';

    const header = document.createElement('div');
    header.className = 'popup-poi-header';
    header.style.borderLeft = '3px solid ' + (cfg ? cfg.color : '#888');

    const tag = document.createElement('span');
    tag.className = 'popup-category-tag';
    tag.style.color = cfg ? cfg.color : '#888';
    tag.textContent = tCat(park.category, 'label');

    const title = document.createElement('div');
    title.className = 'popup-title';
    title.textContent = park.name;

    header.append(tag, title);

    const meta = document.createElement('div');
    meta.className = 'popup-municipality';
    meta.textContent = '\uD83D\uDCCD ' + park.municipality;
    if (park.area) {
      meta.append(document.createTextNode(' \u2022 '));
      const areaSpan = document.createElement('span');
      areaSpan.textContent = park.area;
      meta.appendChild(areaSpan);
    }

    const desc = document.createElement('p');
    desc.className = 'popup-desc';
    desc.textContent = tPark(park.id, 'description');

    wrap.append(header, meta, desc);

    if (park.features && park.features.length) {
      const ul = document.createElement('ul');
      ul.className = 'popup-features';
      park.features.forEach(f => {
        const li = document.createElement('li');
        li.textContent = tFeature(f);
        ul.appendChild(li);
      });
      wrap.appendChild(ul);
    }

    const suggestLink = document.createElement('a');
    suggestLink.className = 'popup-suggest-link';
    suggestLink.textContent = t('suggestEdit');
    suggestLink.href = '#';
    suggestLink.addEventListener('click', (e) => {
      e.preventDefault();
      document.dispatchEvent(new CustomEvent('aland:openContribute', {
        detail: { type: 'edit', parkId: park.id },
      }));
    });
    wrap.appendChild(suggestLink);

    return wrap;
  }

  // Rebind all popup content to reflect the current language
  function rebindPopups() {
    PARKS.forEach(park => {
      const marker = parkMarkers[park.id];
      if (marker) marker.setPopupContent(buildParkPopupEl(park));
    });
  }

  // =========================================================
  // 6. CATEGORY FILTER BUTTONS
  // =========================================================

  function buildCategoryFilterUI() {
    const container = document.getElementById('category-filters');
    Object.entries(CATEGORY_CONFIG).forEach(([cat, cfg]) => {
      const btn = document.createElement('button');
      btn.className = 'cat-filter-btn active';
      btn.dataset.cat = cat;
      btn.style.setProperty('--btn-color', cfg.color);

      const dot = document.createElement('span');
      dot.className = 'cat-filter-dot';

      const label = document.createTextNode(tCat(cat, 'label'));
      btn.append(dot, label);
      btn.addEventListener('click', () => toggleCategoryFilter(cat, btn));
      container.appendChild(btn);
    });
  }

  function rebuildCategoryFilters() {
    document.querySelectorAll('.cat-filter-btn').forEach(btn => {
      const cat = btn.dataset.cat;
      // Update label text (last child text node)
      const lastNode = btn.lastChild;
      if (lastNode && lastNode.nodeType === Node.TEXT_NODE) {
        lastNode.textContent = tCat(cat, 'label');
      }
    });
  }

  function toggleCategoryFilter(cat, btn) {
    if (activeCategories.has(cat)) {
      activeCategories.delete(cat);
      btn.classList.remove('active');
    } else {
      activeCategories.add(cat);
      btn.classList.add('active');
    }
    applyFilters();
    const lpChk = document.querySelector('#poi-layer-controls input[data-cat="' + cat + '"]');
    if (lpChk) lpChk.checked = activeCategories.has(cat);
  }

  // =========================================================
  // 7. PARKS LIST
  // =========================================================

  function buildParksList() {
    const ul = document.getElementById('poi-list');

    PARKS.forEach(park => {
      const cfg = CATEGORY_CONFIG[park.category];
      const li  = document.createElement('li');
      li.className = 'poi-list-item';
      li.dataset.id   = park.id;
      li.dataset.cat  = park.category;
      li.dataset.name = park.name.toLowerCase();
      li.style.setProperty('--item-color', cfg ? cfg.color : '#888');

      const dot = document.createElement('span');
      dot.className = 'poi-list-dot';

      const textWrap = document.createElement('div');
      textWrap.className = 'poi-list-text';

      const strong = document.createElement('strong');
      strong.textContent = park.name;

      const sub = document.createElement('span');
      sub.className = 'poi-list-sub';
      sub.textContent = tCat(park.category, 'label') + ' \u2022 ' + park.municipality;

      textWrap.append(strong, sub);
      li.append(dot, textWrap);

      li.addEventListener('click', () => showParkDetail(park));

      ul.appendChild(li);
    });

    const empty = document.createElement('li');
    empty.id = 'poi-list-empty';
    empty.textContent = t('noResults');
    empty.style.display = 'none';
    ul.appendChild(empty);
  }

  function rebuildParksList() {
    document.querySelectorAll('.poi-list-item').forEach(li => {
      const sub = li.querySelector('.poi-list-sub');
      if (sub) {
        const park = PARKS.find(p => p.id === li.dataset.id);
        if (park) sub.textContent = tCat(park.category, 'label') + ' \u2022 ' + park.municipality;
      }
    });
    const empty = document.getElementById('poi-list-empty');
    if (empty) empty.textContent = t('noResults');
  }

  // =========================================================
  // 8. FILTER & SEARCH
  // =========================================================

  function applyFilters() {
    const searchTerm = document.getElementById('poi-search').value.toLowerCase().trim();
    let visibleCount = 0;

    document.querySelectorAll('.poi-list-item').forEach(li => {
      const cat     = li.dataset.cat;
      const name    = li.dataset.name;
      const visible = activeCategories.has(cat) && (!searchTerm || name.includes(searchTerm));
      li.style.display = visible ? '' : 'none';

      const marker = parkMarkers[li.dataset.id];
      if (marker && parkGroups[cat]) {
        if (visible) {
          if (!parkGroups[cat].hasLayer(marker)) parkGroups[cat].addLayer(marker);
          if (!map.hasLayer(parkGroups[cat]))    parkGroups[cat].addTo(map);
        } else {
          if (parkGroups[cat].hasLayer(marker)) parkGroups[cat].removeLayer(marker);
        }
      }
      if (visible) visibleCount++;
    });

    const empty = document.getElementById('poi-list-empty');
    if (empty) empty.style.display = visibleCount === 0 ? 'block' : 'none';
  }

  // =========================================================
  // 9. LAYER PANEL
  // =========================================================

  function buildLayerPanelUI() {
    const container = document.getElementById('poi-layer-controls');
    Object.entries(CATEGORY_CONFIG).forEach(([cat, cfg]) => {
      const row = document.createElement('label');
      row.className = 'layer-check-row';

      const chk = document.createElement('input');
      chk.type        = 'checkbox';
      chk.checked     = true;
      chk.dataset.cat = cat;
      chk.addEventListener('change', () => {
        if (chk.checked) { activeCategories.add(cat); }
        else             { activeCategories.delete(cat); }
        const sidebarBtn = document.querySelector('.cat-filter-btn[data-cat="' + cat + '"]');
        if (sidebarBtn) sidebarBtn.classList.toggle('active', chk.checked);
        applyFilters();
      });

      const dot = document.createElement('span');
      dot.className = 'layer-dot';
      dot.style.background = cfg.color;

      const text = document.createElement('span');
      text.dataset.layerCat = cat;
      text.textContent = tCat(cat, 'label');

      row.append(chk, dot, text);
      container.appendChild(row);
    });
  }

  function rebuildLayerPanel() {
    document.querySelectorAll('[data-layer-cat]').forEach(el => {
      el.textContent = tCat(el.dataset.layerCat, 'label');
    });
  }

  function wireLayerPanelToggle() {
    const btn  = document.getElementById('layer-panel-toggle');
    const body = document.getElementById('layer-panel-body');
    const chev = document.getElementById('layer-panel-chevron');
    btn.addEventListener('click', () => {
      const isHidden = body.hidden;
      body.hidden = !isHidden;
      btn.setAttribute('aria-expanded', String(isHidden));
      chev.style.transform = isHidden ? 'rotate(180deg)' : '';
    });
  }

  // =========================================================
  // 10. LANGUAGE SWITCHER
  // =========================================================

  function wireLangSwitcher() {
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.addEventListener('click', () => setLang(btn.dataset.lang));
    });
  }

  // =========================================================
  // 11. PARK DETAIL PANEL
  // =========================================================

  const FEATURE_ICONS = {
    'Vandringsstigar':       '\uD83E\uDD7E',
    'Vandringsleder':        '\uD83E\uDD7E',
    'Promenadstigar':        '\uD83D\uDEB6',
    'Promenadstr\u00e5k':   '\uD83D\uDEB6',
    'F\u00e5gelskådning':   '\uD83E\uDD85',
    'Parkering':             '\uD83C\uDD7F\uFE0F',
    'Kustmilj\u00f6':       '\uD83C\uDF0A',
    'Bad':                   '\uD83C\uDFCA',
    'Badstrand':             '\uD83C\uDFD6\uFE0F',
    'Sandstrand':            '\uD83C\uDFD6\uFE0F',
    'Historiska ruiner':     '\uD83C\uDFDB\uFE0F',
    'Historisk byggnad':     '\uD83C\uDFDB\uFE0F',
    'Informationsskyltar':   '\u2139\uFE0F',
    'Guidning':              '\uD83D\uDC64',
    'Mus\u00e9':             '\uD83C\uDFDB\uFE0F',
    'Kaf\u00e9':             '\u2615',
    'Souvenirbutik':         '\uD83D\uDED2',
    'Friluftsmuseum':        '\uD83C\uDFE1',
    'Utsiktstorn':           '\uD83D\uDDFC',
    'Utsikt':                '\uD83D\uDC41\uFE0F',
    'Havsutsikt':            '\uD83C\uDF05',
    'Gammelskog':            '\uD83C\uDF32',
    'Klippvandring':         '\uD83E\uDDD7',
    'Ringm\u00e4rkning':    '\uD83D\uDD2C',
    'B\u00e5ttransport kr\u00e4vs': '\u26F5',
    'Forskarstuga':          '\uD83D\uDD2D',
    'Cykelleder':            '\uD83D\uDEB4',
    'Grillplatser':          '\uD83D\uDD25',
    'H\u00e4llmark':        '\uD83E\uDEA8',
    'Kajakpaddling':         '\uD83D\uDEF6',
    'Havskajakpaddling':     '\uD83D\uDEF6',
    'Fiske':                 '\uD83C\uDFA3',
    'Naturturism':           '\uD83C\uDF3F',
    'F\u00e4rjef\u00f6rbindelser': '\u26F4\uFE0F',
    'Klosterruiner':         '\u26EA',
    'Karg natur':            '\uD83C\uDFDD\uFE0F',
    'Rodd':                  '\uD83D\uDEA3',
    'Djur p\u00e5 g\u00e5rden': '\uD83D\uDC04',
    'Lekplats':              '\uD83C\uDFA0',
    'Blomsterrabatter':      '\uD83C\uDF38',
    'Parkb\u00e4nkar':      '\uD83E\uDE91',
  };

  function showParkDetail(park) {
    const panel   = document.getElementById('park-detail');
    const cfg     = CATEGORY_CONFIG[park.category];
    panel.textContent = '';

    // --- Header ---
    const header = document.createElement('div');
    header.className = 'park-detail-header';

    const backBtn = document.createElement('button');
    backBtn.className = 'park-detail-back';
    backBtn.textContent = '\u2190';
    backBtn.setAttribute('aria-label', 'Back to list');
    backBtn.addEventListener('click', hideParkDetail);

    const headerInfo = document.createElement('div');
    headerInfo.className = 'park-detail-header-info';

    const catTag = document.createElement('span');
    catTag.className = 'park-detail-category-tag';
    catTag.style.color = cfg ? cfg.color : '#888';
    catTag.textContent = tCat(park.category, 'label');

    const nameEl = document.createElement('div');
    nameEl.className = 'park-detail-name';
    nameEl.textContent = park.name;

    headerInfo.append(catTag, nameEl);
    header.append(backBtn, headerInfo);

    // --- Body ---
    const body = document.createElement('div');
    body.className = 'park-detail-body';

    // Meta chips
    const meta = document.createElement('div');
    meta.className = 'park-detail-meta';

    if (park.municipality) {
      meta.appendChild(makeChip('\uD83D\uDCCD', park.municipality));
    }
    if (park.area) {
      meta.appendChild(makeChip('\uD83D\uDDFA\uFE0F', park.area));
    }
    if (meta.children.length) body.appendChild(meta);

    // Description
    const desc = tPark(park.id, 'description');
    if (desc) {
      const descEl = document.createElement('p');
      descEl.className = 'park-detail-desc';
      descEl.textContent = desc;
      body.appendChild(descEl);
    }

    // Features
    if (park.features && park.features.length) {
      const section = document.createElement('div');

      const sectionTitle = document.createElement('div');
      sectionTitle.className = 'park-detail-section-title';
      sectionTitle.textContent = t('featuresTitle');

      const grid = document.createElement('div');
      grid.className = 'park-detail-features';

      park.features.forEach(f => {
        const item = document.createElement('div');
        item.className = 'park-detail-feature';

        const icon = document.createElement('span');
        icon.className = 'park-detail-feature-icon';
        icon.textContent = FEATURE_ICONS[f] || '\u2022';

        const label = document.createElement('span');
        label.textContent = tFeature(f);

        item.append(icon, label);
        grid.appendChild(item);
      });

      section.append(sectionTitle, grid);
      body.appendChild(section);
    }

    // Coordinates
    if (park.lat && park.lng) {
      const coords = document.createElement('div');
      coords.className = 'park-detail-coords';
      coords.textContent = park.lat.toFixed(5) + ', ' + park.lng.toFixed(5);
      body.appendChild(coords);
    }

    // Actions
    const actions = document.createElement('div');
    actions.className = 'park-detail-actions';

    const centerBtn = document.createElement('button');
    centerBtn.className = 'park-detail-btn-primary';
    centerBtn.textContent = t('detailCenter');
    centerBtn.addEventListener('click', () => {
      hideParkDetail();
      map.flyTo([park.lat, park.lng], 14, { duration: 1.0 });
      if (parkGroups[park.category] && !map.hasLayer(parkGroups[park.category])) {
        parkGroups[park.category].addTo(map);
      }
      if (parkMarkers[park.id]) parkMarkers[park.id].openPopup();
      closeSidebar();
    });

    const suggestBtn = document.createElement('button');
    suggestBtn.className = 'park-detail-btn-secondary';
    suggestBtn.textContent = t('suggestEdit');
    suggestBtn.addEventListener('click', () => {
      document.dispatchEvent(new CustomEvent('aland:openContribute', {
        detail: { type: 'edit', parkId: park.id },
      }));
    });

    actions.append(centerBtn, suggestBtn);
    body.appendChild(actions);

    panel.append(header, body);

    document.body.classList.add('detail-open');
    // On mobile keep sidebar open to show the detail
    document.body.classList.add('sidebar-open');
    // Scroll the panel to top
    body.scrollTop = 0;
  }

  function hideParkDetail() {
    document.body.classList.remove('detail-open');
  }

  function makeChip(icon, text) {
    const chip = document.createElement('div');
    chip.className = 'park-detail-meta-item';
    const iconEl = document.createElement('span');
    iconEl.textContent = icon;
    const textEl = document.createElement('span');
    textEl.textContent = text;
    chip.append(iconEl, textEl);
    return chip;
  }

  // =========================================================
  // 12. GEOLOCATION
  // =========================================================

  let locationMarker   = null;
  let locationCircle   = null;
  let locationWatchId  = null;
  let locationCentered = false;

  function buildLocateButton() {
    const btn = document.createElement('button');
    btn.id = 'locate-btn';
    btn.title = 'Show my location';
    btn.textContent = '\u{1F4CD}';
    btn.addEventListener('click', toggleLocate);
    document.getElementById('map-container').appendChild(btn);
  }

  function toggleLocate() {
    const btn = document.getElementById('locate-btn');
    if (locationWatchId !== null) {
      stopLocate();
      btn.classList.remove('active', 'error');
    } else {
      startLocate();
    }
  }

  function startLocate() {
    if (!navigator.geolocation) return;
    const btn = document.getElementById('locate-btn');
    btn.classList.remove('error');
    locationCentered = false;
    locationWatchId = navigator.geolocation.watchPosition(
      onLocationUpdate,
      onLocationError,
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );
    btn.classList.add('active');
  }

  function stopLocate() {
    if (locationWatchId !== null) {
      navigator.geolocation.clearWatch(locationWatchId);
      locationWatchId = null;
    }
    if (locationMarker) { map.removeLayer(locationMarker); locationMarker = null; }
    if (locationCircle) { map.removeLayer(locationCircle); locationCircle = null; }
    locationCentered = false;
  }

  function onLocationUpdate(pos) {
    const lat = pos.coords.latitude;
    const lng = pos.coords.longitude;
    const acc = pos.coords.accuracy;

    // Accuracy circle
    if (locationCircle) {
      locationCircle.setLatLng([lat, lng]).setRadius(acc);
    } else {
      locationCircle = L.circle([lat, lng], {
        radius: acc,
        color: '#4a90e2',
        fillColor: '#4a90e2',
        fillOpacity: 0.10,
        weight: 1,
        opacity: 0.4,
      }).addTo(map);
    }

    // Pulsing dot marker
    if (!locationMarker) {
      const dotEl = document.createElement('div');
      dotEl.className = 'user-location-dot';
      locationMarker = L.marker([lat, lng], {
        icon: L.divIcon({ html: dotEl.outerHTML, className: '', iconSize: [14, 14], iconAnchor: [7, 7] }),
        zIndexOffset: 500,
      }).addTo(map);
    } else {
      locationMarker.setLatLng([lat, lng]);
    }

    // Pan to location on first fix only
    if (!locationCentered) {
      map.setView([lat, lng], Math.max(map.getZoom(), 13));
      locationCentered = true;
    }
  }

  function onLocationError() {
    const btn = document.getElementById('locate-btn');
    btn.classList.remove('active');
    btn.classList.add('error');
    stopLocate();
    // Reset error indicator after 3s
    setTimeout(() => btn.classList.remove('error'), 3000);
  }

  // =========================================================
  // MOBILE SIDEBAR
  // =========================================================

  function closeSidebar() { document.body.classList.remove('sidebar-open'); }

  function wireMobileSidebar() {
    document.getElementById('sidebar-toggle').addEventListener('click', () => {
      document.body.classList.toggle('sidebar-open');
    });
    document.getElementById('app-body').addEventListener('click', function (e) {
      if (!document.body.classList.contains('sidebar-open')) return;
      const sidebar = document.getElementById('sidebar');
      const toggle  = document.getElementById('sidebar-toggle');
      if (!sidebar.contains(e.target) && !toggle.contains(e.target)) closeSidebar();
    });
  }

  // =========================================================
  // 12. STARTUP
  // =========================================================

  function start() {
    initMap();
    buildParkMarkers();
    buildCategoryFilterUI();
    buildParksList();
    buildLayerPanelUI();
    buildLocateButton();
    wireLayerPanelToggle();
    wireLangSwitcher();
    document.getElementById('poi-search').addEventListener('input', applyFilters);
    wireMobileSidebar();

    // Pick-on-map: let contribute.js request a coordinate from the map
    map.on('click', e => {
      if (!pickingLocation) return;
      pickingLocation = false;
      document.getElementById('map').style.cursor = '';
      document.dispatchEvent(new CustomEvent('aland:locationPicked', {
        detail: { lat: round5(e.latlng.lat), lng: round5(e.latlng.lng) },
      }));
    });

    document.addEventListener('aland:startPickLocation', () => {
      pickingLocation = true;
      document.getElementById('map').style.cursor = 'crosshair';
    });

    document.addEventListener('aland:cancelPickLocation', () => {
      pickingLocation = false;
      document.getElementById('map').style.cursor = '';
    });

    // Apply stored language (updates all dynamic + static content)
    applyLang(getLang());

    setTimeout(() => map.invalidateSize(), 100);
  }

  // =========================================================
  // HELPERS
  // =========================================================

  function round5(n) { return Math.round(n * 100000) / 100000; }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }

})();
