/* =========================================================
   Naturkartan.ax — User Contributions
   No registration required. Suggestions saved to localStorage
   and reviewed by the admin in admin.html.
   ========================================================= */
(function () {
  'use strict';

  const STORAGE_KEY  = 'aland_contributions';
  const LANG_KEY     = 'aland_lang';

  // API key loaded from config.js (gitignored).
  // Copy config.example.js → config.js and fill in your key.
  const IMGBB_API_KEY = (window.ALAND_CONFIG && window.ALAND_CONFIG.imgbbApiKey) || '';

  // =========================================================
  // HELPERS
  // =========================================================

  function getLang() {
    return localStorage.getItem(LANG_KEY) || 'sv';
  }

  function t(key) {
    const TR   = window.ALAND_TRANSLATIONS;
    const lang = getLang();
    return (TR[lang] && TR[lang].ui && TR[lang].ui[key])
        || (TR.sv && TR.sv.ui && TR.sv.ui[key])
        || key;
  }

  function loadContributions() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
  }

  function saveContributions(arr) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
  }

  function loadParks() {
    try {
      const raw = localStorage.getItem('aland_parks');
      if (raw) return JSON.parse(raw);
    } catch (e) { /* fall through */ }
    return window.ALAND_PARKS_DEFAULT || [];
  }

  function uploadToImgbb(file) {
    return new Promise((resolve, reject) => {
      if (!file) { resolve(null); return; }
      if (!IMGBB_API_KEY || IMGBB_API_KEY === 'YOUR_IMGBB_API_KEY') { resolve(null); return; }

      const formData = new FormData();
      formData.append('image', file);

      const xhr = new XMLHttpRequest();
      xhr.open('POST', 'https://api.imgbb.com/1/upload?key=' + encodeURIComponent(IMGBB_API_KEY));

      xhr.onload = () => {
        try {
          const res = JSON.parse(xhr.responseText);
          if (res.success && res.data && res.data.url) {
            resolve(res.data.url);
          } else {
            reject(new Error('imgbb upload failed'));
          }
        } catch (e) { reject(e); }
      };
      xhr.onerror = () => reject(new Error('Network error'));
      xhr.send(formData);
    });
  }

  function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    // Fallback for file:// and older browsers
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
    document.body.appendChild(ta);
    ta.focus(); ta.select();
    try { document.execCommand('copy'); } catch (e) { /* ignore */ }
    document.body.removeChild(ta);
    return Promise.resolve();
  }

  // =========================================================
  // STATE
  // =========================================================

  let currentType   = null;   // 'edit' | 'new'
  let currentParkId = null;
  let formDraft     = null;   // saved while picking on map
  let overlay, modal;

  // =========================================================
  // OPEN / CLOSE
  // =========================================================

  function openEdit(parkId) {
    currentType   = 'edit';
    currentParkId = parkId;
    const park = loadParks().find(p => p.id === parkId) || null;
    showModal(park);
  }

  function openNew() {
    currentType   = 'new';
    currentParkId = null;
    showModal(null);
  }

  function showModal(park) {
    updateModalTitle(park);
    fillForm(park);
    showFormState();
    clearErrors();
    overlay.removeAttribute('hidden');
    const firstInput = modal.querySelector('input, textarea, select');
    if (firstInput) setTimeout(() => firstInput.focus(), 60);
  }

  function closeModal() {
    overlay.setAttribute('hidden', '');
    currentType   = null;
    currentParkId = null;
    formDraft     = null;
  }

  function updateModalTitle(park) {
    const titleEl = document.getElementById('contrib-title');
    if (!titleEl) return;
    titleEl.textContent = park ? t('contributeTitle') : t('contributeTitleNew');
  }

  // =========================================================
  // FORM
  // =========================================================

  function buildCategorySelect() {
    const sel = document.getElementById('cf-category');
    if (!sel) return;
    sel.textContent = '';
    const cfg = window.ALAND_CATEGORY_CONFIG || {};
    Object.entries(cfg).forEach(([val, c]) => {
      const opt = document.createElement('option');
      opt.value = val;
      opt.textContent = c.label;
      sel.appendChild(opt);
    });
  }

  function fillForm(park) {
    setVal('cf-name',         park ? park.name         : '');
    setVal('cf-category',     park ? park.category     : Object.keys(window.ALAND_CATEGORY_CONFIG || {})[0] || '');
    setVal('cf-municipality', park ? park.municipality : '');
    setVal('cf-area',         park ? park.area         : '');
    setVal('cf-lat',          park ? park.lat          : '');
    setVal('cf-lng',          park ? park.lng          : '');
    setVal('cf-description',  park ? park.description  : '');
    setVal('cf-features',     park ? (park.features || []).join(', ') : '');
    setVal('cf-author',       '');
    setVal('cf-note',         '');
    // Reset photo field
    const photoInput = document.getElementById('cf-photo');
    if (photoInput) photoInput.value = '';
    const photoPreview = document.getElementById('cf-photo-preview');
    if (photoPreview) photoPreview.setAttribute('hidden', '');
    const photoTrigger = document.getElementById('cf-photo-trigger');
    if (photoTrigger) photoTrigger.removeAttribute('hidden');
  }

  function restoreDraft(draft) {
    if (!draft) return;
    Object.entries(draft).forEach(([id, val]) => setVal(id, val));
  }

  function readForm() {
    return {
      name:         getVal('cf-name'),
      category:     getVal('cf-category'),
      municipality: getVal('cf-municipality'),
      area:         getVal('cf-area'),
      lat:          parseFloat(getVal('cf-lat')) || null,
      lng:          parseFloat(getVal('cf-lng')) || null,
      description:  getVal('cf-description'),
      features:     getVal('cf-features').split(',').map(s => s.trim()).filter(Boolean),
    };
  }

  function saveDraft() {
    const ids = ['cf-name','cf-category','cf-municipality','cf-area',
                 'cf-lat','cf-lng','cf-description','cf-features','cf-author','cf-note'];
    const draft = {};
    ids.forEach(id => { draft[id] = getVal(id); });
    return draft;
  }

  function setVal(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = (val === null || val === undefined) ? '' : val;
  }

  function getVal(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : '';
  }

  // =========================================================
  // VALIDATION + SUBMIT
  // =========================================================

  function clearErrors() {
    document.querySelectorAll('.contrib-error').forEach(el => {
      el.textContent = '';
    });
  }

  function showError(id, msg) {
    const el = document.getElementById(id);
    if (el) el.textContent = msg;
  }

  function handleSubmit() {
    clearErrors();
    const data = readForm();
    let valid = true;

    if (!data.name) {
      showError('err-name', t('cfErrorName'));
      valid = false;
    }
    if (!data.lat || !data.lng) {
      showError('err-coords', t('cfErrorCoords'));
      valid = false;
    }
    if (!valid) return;

    const submitBtn = document.getElementById('btn-contribute-submit');
    const photoInput = document.getElementById('cf-photo');
    const file = photoInput && photoInput.files && photoInput.files[0] ? photoInput.files[0] : null;

    submitBtn.disabled = true;
    submitBtn.textContent = t('cfUploading');

    uploadToImgbb(file).then(imgurUrl => {
      const contribution = {
        id:         'contrib-' + Date.now(),
        timestamp:  new Date().toISOString(),
        type:       currentType,
        parkId:     currentParkId,
        data:       data,
        authorName: getVal('cf-author'),
        note:       getVal('cf-note'),
        photoUrl:   imgurUrl || null,
        status:     'pending',
      };

      const all = loadContributions();
      all.push(contribution);
      saveContributions(all);

      submitBtn.disabled = false;
      submitBtn.textContent = t('cfSubmit');
      showSuccessState(contribution);
    }).catch(() => {
      // Upload failed — save without photo rather than blocking the contribution
      const contribution = {
        id:         'contrib-' + Date.now(),
        timestamp:  new Date().toISOString(),
        type:       currentType,
        parkId:     currentParkId,
        data:       data,
        authorName: getVal('cf-author'),
        note:       getVal('cf-note'),
        photoUrl:   null,
        status:     'pending',
      };

      const all = loadContributions();
      all.push(contribution);
      saveContributions(all);

      submitBtn.disabled = false;
      submitBtn.textContent = t('cfSubmit');
      showSuccessState(contribution);
    });
  }

  // =========================================================
  // SUCCESS STATE
  // =========================================================

  function showSuccessState(contribution) {
    const formState    = document.getElementById('contrib-form-state');
    const successState = document.getElementById('contrib-success-state');
    if (formState)    formState.setAttribute('hidden', '');
    if (successState) successState.removeAttribute('hidden');

    const msgEl = document.getElementById('contrib-success-msg');
    if (msgEl) msgEl.textContent = t('cfSuccessMsg');

    // Prepare copy summary text
    const lines = [
      (contribution.type === 'new' ? t('contributeTitleNew') : t('contributeTitle')),
      '---',
      t('cfName')         + ': ' + (contribution.data.name || ''),
      t('cfMunicipality') + ': ' + (contribution.data.municipality || ''),
      'Lat: '             + (contribution.data.lat || ''),
      'Lng: '             + (contribution.data.lng || ''),
      t('cfDescription')  + ': ' + (contribution.data.description || ''),
    ];
    if (contribution.authorName) lines.push(t('cfAuthorName') + ': ' + contribution.authorName);
    if (contribution.note)       lines.push(t('cfNote') + ': ' + contribution.note);
    lines.push('ID: ' + contribution.id);

    const summaryText = lines.join('\n');

    const copyBtn = document.getElementById('btn-copy-summary');
    if (copyBtn) {
      copyBtn.onclick = () => {
        copyToClipboard(summaryText).then(() => {
          const orig = copyBtn.textContent;
          copyBtn.textContent = t('cfCopied');
          setTimeout(() => { copyBtn.textContent = t('cfCopySummary'); }, 2000);
        });
      };
    }
  }

  function showFormState() {
    const formState    = document.getElementById('contrib-form-state');
    const successState = document.getElementById('contrib-success-state');
    if (formState)    formState.removeAttribute('hidden');
    if (successState) successState.setAttribute('hidden', '');
  }

  // =========================================================
  // PICK ON MAP
  // =========================================================

  function startPickMode() {
    formDraft = saveDraft();
    overlay.setAttribute('hidden', '');
    showPickBanner();
    document.dispatchEvent(new CustomEvent('aland:startPickLocation'));
  }

  function showPickBanner() {
    removePicker();
    const banner = document.createElement('div');
    banner.id = 'pick-location-banner';

    const msg = document.createElement('span');
    msg.textContent = t('cfPickBanner');

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = t('cfPickCancel');
    cancelBtn.addEventListener('click', cancelPickMode);

    banner.append(msg, cancelBtn);
    document.body.appendChild(banner);
  }

  function removePicker() {
    const existing = document.getElementById('pick-location-banner');
    if (existing) existing.remove();
  }

  function cancelPickMode() {
    removePicker();
    document.dispatchEvent(new CustomEvent('aland:cancelPickLocation'));
    // Reopen modal with saved draft
    const park = currentParkId ? loadParks().find(p => p.id === currentParkId) : null;
    showModal(park);
    restoreDraft(formDraft);
    formDraft = null;
  }

  function onLocationPicked(lat, lng) {
    removePicker();
    const park = currentParkId ? loadParks().find(p => p.id === currentParkId) : null;
    showModal(park);
    if (formDraft) restoreDraft(formDraft);
    setVal('cf-lat', lat);
    setVal('cf-lng', lng);
    formDraft = null;
  }

  // =========================================================
  // APPLY LANGUAGE (called when lang changes)
  // =========================================================

  function applyLang() {
    // Update static data-i18n elements inside the modal
    modal.querySelectorAll('[data-i18n]').forEach(el => {
      el.textContent = t(el.dataset.i18n);
    });
    modal.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      el.placeholder = t(el.dataset.i18nPlaceholder);
    });
    // Update pick banner if visible
    const banner = document.getElementById('pick-location-banner');
    if (banner) {
      const span = banner.querySelector('span');
      if (span) span.textContent = t('cfPickBanner');
      const btn  = banner.querySelector('button');
      if (btn)  btn.textContent  = t('cfPickCancel');
    }
    // Update category select labels
    buildCategorySelect();
  }

  // =========================================================
  // BUILD MODAL DOM
  // =========================================================

  function buildModal() {
    overlay = document.createElement('div');
    overlay.id = 'contribute-overlay';
    overlay.setAttribute('hidden', '');
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'contrib-title');

    modal = document.createElement('div');
    modal.id = 'contribute-modal';

    // --- Header ---
    const hdr = document.createElement('div');
    hdr.id = 'contribute-modal-header';

    const title = document.createElement('h2');
    title.id = 'contrib-title';
    title.textContent = t('contributeTitle');

    const closeBtn = document.createElement('button');
    closeBtn.id = 'contribute-close';
    closeBtn.setAttribute('aria-label', t('cfClose'));
    closeBtn.textContent = '\u00d7';
    closeBtn.addEventListener('click', closeModal);

    hdr.append(title, closeBtn);

    // --- Form state ---
    const formState = document.createElement('div');
    formState.id = 'contrib-form-state';

    const form = document.createElement('form');
    form.id = 'contribute-form';
    form.setAttribute('autocomplete', 'off');
    form.setAttribute('novalidate', '');
    form.addEventListener('submit', e => { e.preventDefault(); handleSubmit(); });

    form.appendChild(buildField('cf-name', 'cfName', 'input', 'text'));
    form.appendChild(buildSelectField('cf-category', 'cfCategory'));
    form.appendChild(buildField('cf-municipality', 'cfMunicipality', 'input', 'text'));
    form.appendChild(buildField('cf-area', 'cfArea', 'input', 'text'));
    form.appendChild(buildCoordsField());
    form.appendChild(buildField('cf-description', 'cfDescription', 'textarea'));
    form.appendChild(buildField('cf-features', 'cfFeatures', 'input', 'text', true));
    form.appendChild(buildPhotoField());

    const divider = document.createElement('hr');
    divider.className = 'contrib-divider';
    form.appendChild(divider);

    form.appendChild(buildField('cf-author', 'cfAuthorName', 'input', 'text'));
    form.appendChild(buildField('cf-note', 'cfNote', 'textarea'));

    const actions = document.createElement('div');
    actions.id = 'contribute-actions';

    const submitBtn = document.createElement('button');
    submitBtn.id = 'btn-contribute-submit';
    submitBtn.type = 'button';
    submitBtn.textContent = t('cfSubmit');
    submitBtn.addEventListener('click', handleSubmit);
    actions.appendChild(submitBtn);

    formState.append(form, actions);

    // --- Success state ---
    const successState = document.createElement('div');
    successState.id = 'contrib-success-state';
    successState.setAttribute('hidden', '');

    const successIcon = document.createElement('div');
    successIcon.id = 'contrib-success-icon';
    successIcon.textContent = '\u2713';

    const successMsg = document.createElement('p');
    successMsg.id = 'contrib-success-msg';
    successMsg.textContent = t('cfSuccessMsg');

    const copyBtn = document.createElement('button');
    copyBtn.id = 'btn-copy-summary';
    copyBtn.className = 'contrib-outline-btn';
    copyBtn.textContent = t('cfCopySummary');

    const doneBtn = document.createElement('button');
    doneBtn.id = 'btn-contribute-done';
    doneBtn.textContent = t('cfClose');
    doneBtn.addEventListener('click', closeModal);

    successState.append(successIcon, successMsg, copyBtn, doneBtn);

    modal.append(hdr, formState, successState);

    // Close on backdrop click
    overlay.appendChild(modal);
    overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });

    document.body.appendChild(overlay);
  }

  function buildField(id, labelKey, tagName, inputType, isFeatures) {
    const wrap = document.createElement('div');
    wrap.className = 'contrib-field';

    const label = document.createElement('label');
    label.className = 'contrib-label';
    label.htmlFor = id;
    label.dataset.i18n = labelKey;
    label.textContent = t(labelKey);

    const input = document.createElement(tagName);
    input.id = id;
    if (tagName === 'input') {
      input.type = inputType || 'text';
    }
    if (isFeatures) {
      input.dataset.i18nPlaceholder = 'cfFeaturesPlaceholder';
    }

    const errSpan = document.createElement('span');
    errSpan.className = 'contrib-error';
    if (id === 'cf-name')  errSpan.id = 'err-name';

    wrap.append(label, input, errSpan);
    return wrap;
  }

  function buildSelectField(id, labelKey) {
    const wrap = document.createElement('div');
    wrap.className = 'contrib-field';

    const label = document.createElement('label');
    label.className = 'contrib-label';
    label.htmlFor = id;
    label.dataset.i18n = labelKey;
    label.textContent = t(labelKey);

    const sel = document.createElement('select');
    sel.id = id;

    wrap.append(label, sel);
    return wrap;
  }

  function buildPhotoField() {
    const wrap = document.createElement('div');
    wrap.className = 'contrib-field';

    const label = document.createElement('label');
    label.className = 'contrib-label';
    label.htmlFor = 'cf-photo';
    label.dataset.i18n = 'cfPhoto';
    label.textContent = t('cfPhoto');

    // Hidden native file input
    const input = document.createElement('input');
    input.type = 'file';
    input.id = 'cf-photo';
    input.accept = 'image/*';
    input.style.display = 'none';

    // Styled trigger button
    const triggerBtn = document.createElement('button');
    triggerBtn.type = 'button';
    triggerBtn.id = 'cf-photo-trigger';
    triggerBtn.className = 'contrib-outline-btn contrib-photo-trigger';
    triggerBtn.dataset.i18n = 'cfPhotoChoose';
    triggerBtn.textContent = t('cfPhotoChoose');
    triggerBtn.addEventListener('click', () => input.click());

    // Preview area
    const preview = document.createElement('div');
    preview.id = 'cf-photo-preview';
    preview.setAttribute('hidden', '');

    const previewImg = document.createElement('img');
    previewImg.id = 'cf-photo-preview-img';
    previewImg.alt = '';

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.id = 'cf-photo-remove';
    removeBtn.textContent = '\u00d7';
    removeBtn.setAttribute('aria-label', 'Remove photo');
    removeBtn.addEventListener('click', () => {
      input.value = '';
      previewImg.src = '';
      preview.setAttribute('hidden', '');
      triggerBtn.removeAttribute('hidden');
    });

    preview.append(previewImg, removeBtn);

    input.addEventListener('change', () => {
      const file = input.files && input.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        previewImg.src = e.target.result;
        preview.removeAttribute('hidden');
        triggerBtn.setAttribute('hidden', '');
      };
      reader.readAsDataURL(file);
    });

    const note = document.createElement('span');
    note.className = 'contrib-photo-note';
    note.dataset.i18n = 'cfPhotoNote';
    note.textContent = t('cfPhotoNote');

    wrap.append(label, triggerBtn, input, preview, note);

    // Hide the whole field if no Client ID configured
    if (!IMGBB_API_KEY || IMGBB_API_KEY === 'YOUR_IMGBB_API_KEY') {
      wrap.setAttribute('hidden', '');
    }

    return wrap;
  }

  function buildCoordsField() {
    const wrap = document.createElement('div');
    wrap.className = 'contrib-field contrib-coords-row';

    const latWrap = document.createElement('div');
    latWrap.className = 'contrib-field contrib-field--inline';
    const latLabel = document.createElement('label');
    latLabel.className = 'contrib-label';
    latLabel.htmlFor = 'cf-lat';
    latLabel.textContent = 'Lat';
    const latInput = document.createElement('input');
    latInput.type = 'number';
    latInput.id = 'cf-lat';
    latInput.step = '0.00001';
    latWrap.append(latLabel, latInput);

    const lngWrap = document.createElement('div');
    lngWrap.className = 'contrib-field contrib-field--inline';
    const lngLabel = document.createElement('label');
    lngLabel.className = 'contrib-label';
    lngLabel.htmlFor = 'cf-lng';
    lngLabel.textContent = 'Lng';
    const lngInput = document.createElement('input');
    lngInput.type = 'number';
    lngInput.id = 'cf-lng';
    lngInput.step = '0.00001';
    lngWrap.append(lngLabel, lngInput);

    const pickBtn = document.createElement('button');
    pickBtn.type = 'button';
    pickBtn.id = 'btn-pick-location';
    pickBtn.dataset.i18n = 'cfPickOnMap';
    pickBtn.textContent = t('cfPickOnMap');
    pickBtn.addEventListener('click', startPickMode);

    const errSpan = document.createElement('span');
    errSpan.className = 'contrib-error';
    errSpan.id = 'err-coords';
    errSpan.style.gridColumn = '1 / -1';

    wrap.append(latWrap, lngWrap, pickBtn, errSpan);
    return wrap;
  }

  // =========================================================
  // "ADD MISSING PLACE" BUTTON IN SIDEBAR
  // =========================================================

  function buildAddPlaceButton() {
    const wrap = document.createElement('div');
    wrap.id = 'add-place-wrap';

    const btn = document.createElement('button');
    btn.id = 'btn-add-missing-place';
    btn.dataset.i18n = 'addMissingPlace';
    btn.textContent = t('addMissingPlace');
    btn.addEventListener('click', openNew);

    wrap.appendChild(btn);

    const list = document.getElementById('poi-list');
    if (list && list.parentNode) list.parentNode.insertBefore(wrap, list.nextSibling);
  }

  // =========================================================
  // INIT
  // =========================================================

  function init() {
    buildModal();
    buildCategorySelect();
    buildAddPlaceButton();

    // Listen for "open contribute" events from app.js popup buttons
    document.addEventListener('aland:openContribute', e => {
      const { type, parkId } = e.detail || {};
      if (type === 'edit' && parkId) { openEdit(parkId); }
      else                           { openNew(); }
    });

    // Listen for map pick result
    document.addEventListener('aland:locationPicked', e => {
      const { lat, lng } = e.detail || {};
      if (lat != null && lng != null) onLocationPicked(lat, lng);
    });

    // Listen for language changes from app.js
    document.addEventListener('aland:langChanged', () => {
      applyLang();
      // Update "add place" button text
      const btn = document.getElementById('btn-add-missing-place');
      if (btn) btn.textContent = t('addMissingPlace');
    });
  }

  // Self-init after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
