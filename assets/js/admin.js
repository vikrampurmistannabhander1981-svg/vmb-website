(function () {
  var CAT_LABELS = {
    normal: 'সাধারণ মিষ্টি', doi: 'দই', special: 'স্পেশাল মিষ্টি',
    laddu: 'লাড্ডু', dry: 'শুকনো আইটেম', sondesh: 'সন্দেশ'
  };

  var loginScreen = document.getElementById('loginScreen');
  var adminScreen = document.getElementById('adminScreen');
  var passwordInput = document.getElementById('passwordInput');
  var loginBtn = document.getElementById('loginBtn');
  var loginErr = document.getElementById('loginErr');
  var logoutBtn = document.getElementById('logoutBtn');
  var productRows = document.getElementById('productRows');
  var listErr = document.getElementById('listErr');
  var addBtn = document.getElementById('addBtn');
  var modalBg = document.getElementById('modalBg');
  var modalTitle = document.getElementById('modalTitle');
  var formErr = document.getElementById('formErr');
  var cancelBtn = document.getElementById('cancelBtn');
  var saveBtn = document.getElementById('saveBtn');
  var imageFile = document.getElementById('imageFile');
  var imgPreview = document.getElementById('imgPreview');
  var fTitle = document.getElementById('fTitle');
  var fSubtitle = document.getElementById('fSubtitle');
  var fCategory = document.getElementById('fCategory');
  var fDescription = document.getElementById('fDescription');
  var fActive = document.getElementById('fActive');
  var fFeatured = document.getElementById('fFeatured');
  var fPrice = document.getElementById('fPrice');
  var fUnit = document.getElementById('fUnit');
  function fmtPrice(p){ if(p==null||p==='') return ''; return '৳ ' + String(p).replace(/[0-9]/g,function(d){return '০১২৩৪৫৬৭৮৯'[d];}); }

  var currentImageData = '';
  var editingId = null;

  function showAdmin() {
    loginScreen.style.display = 'none';
    adminScreen.style.display = 'block';
    loadProducts();
    loadBranches();
    loadReviews();
    loadSettings();
  }

  document.querySelectorAll('.tab-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.tab-btn').forEach(function (b) { b.classList.remove('active'); });
      document.querySelectorAll('.panel').forEach(function (p) { p.classList.remove('active'); });
      btn.classList.add('active');
      document.getElementById(btn.getAttribute('data-tab') + 'Panel').classList.add('active');
    });
  });

  loginBtn.addEventListener('click', function () {
    loginErr.textContent = '';
    fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: passwordInput.value })
    }).then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
      .then(function (res) {
        if (!res.ok) { loginErr.textContent = res.d.error || 'লগইন ব্যর্থ হয়েছে।'; return; }
        showAdmin();
      })
      .catch(function () { loginErr.textContent = 'নেটওয়ার্ক সমস্যা।'; });
  });

  logoutBtn.addEventListener('click', function () {
    fetch('/api/logout', { method: 'POST' }).then(function () {
      adminScreen.style.display = 'none';
      loginScreen.style.display = 'block';
      passwordInput.value = '';
    });
  });

  function loadProducts() {
    listErr.textContent = '';
    fetch('/api/products?all=1')
      .then(function (r) {
        if (r.status === 401) { loginScreen.style.display = 'block'; adminScreen.style.display = 'none'; throw new Error('unauth'); }
        return r.json();
      })
      .then(function (d) { renderRows(d.products || []); })
      .catch(function (e) { if (e.message !== 'unauth') listErr.textContent = 'তালিকা লোড করা যায়নি।'; });
  }

  function renderRows(products) {
    productRows.innerHTML = '';
    if (!products.length) {
      productRows.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--muted);padding:24px;">এখনো কোনো মিষ্টি যোগ করা হয়নি।</td></tr>';
      return;
    }
    products.forEach(function (p) {
      var tr = document.createElement('tr');
      var img = p.image_url ? '<img src="' + p.image_url + '">' : '<div style="width:44px;height:44px;border-radius:8px;background:#eee;"></div>';
      tr.innerHTML =
        '<td>' + img + '</td>' +
        '<td><b>' + escapeHtml(p.title) + '</b><br><span style="color:var(--muted);font-size:12px;">' + escapeHtml(p.subtitle || '') + '</span>' + (p.price != null ? '<br><span style="color:var(--navy);font-weight:700;font-size:12.5px;">' + fmtPrice(p.price) + ' / ' + escapeHtml(p.unit || 'কেজি') + '</span>' : '') + '</td>' +
        '<td>' + (CAT_LABELS[p.category] || p.category) + '</td>' +
        '<td>' + (p.active ? '✅ Active' : '⛔ Hidden') + (p.featured ? '<br><span style="color:var(--gold);font-size:12px;">★ হোমপেজে</span>' : '') + '</td>' +
        '<td class="row-actions"></td>';
      var actionsTd = tr.querySelector('.row-actions');
      var editBtn = document.createElement('button');
      editBtn.className = 'btn-outline-s';
      editBtn.textContent = 'এডিট';
      editBtn.addEventListener('click', function () { openModal(p); });
      var delBtn = document.createElement('button');
      delBtn.className = 'btn-outline-s';
      delBtn.textContent = 'ডিলিট';
      delBtn.addEventListener('click', function () { deleteProduct(p.id, p.title); });
      actionsTd.appendChild(editBtn);
      actionsTd.appendChild(delBtn);
      productRows.appendChild(tr);
    });
  }

  function escapeHtml(s) {
    return String(s || '').replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function openModal(product) {
    formErr.textContent = '';
    editingId = product ? product.id : null;
    modalTitle.textContent = product ? 'মিষ্টি এডিট করুন' : 'নতুন মিষ্টি';
    fTitle.value = product ? product.title : '';
    fSubtitle.value = product ? (product.subtitle || '') : '';
    fCategory.value = product ? product.category : 'normal';
    fDescription.value = product ? (product.description || '') : '';
    fActive.checked = product ? !!product.active : true;
    fFeatured.checked = product ? !!product.featured : false;
    fPrice.value = (product && product.price != null) ? product.price : '';
    fUnit.value = (product && product.unit) ? product.unit : 'কেজি';
    currentImageData = product ? (product.image_url || '') : '';
    imageFile.value = '';
    if (currentImageData) { imgPreview.src = currentImageData; imgPreview.style.display = 'block'; }
    else { imgPreview.style.display = 'none'; }
    modalBg.classList.add('open');
  }

  function closeModal() { modalBg.classList.remove('open'); }
  cancelBtn.addEventListener('click', closeModal);
  addBtn.addEventListener('click', function () { openModal(null); });

  imageFile.addEventListener('change', function () {
    var file = imageFile.files[0];
    if (!file) return;
    compressImage(file, 900, 0.8).then(function (dataUrl) {
      currentImageData = dataUrl;
      imgPreview.src = dataUrl;
      imgPreview.style.display = 'block';
    });
  });

  function compressImage(file, maxW, quality) {
    return new Promise(function (resolve) {
      var img = new Image();
      var reader = new FileReader();
      reader.onload = function (e) {
        img.onload = function () {
          var w = img.width, h = img.height;
          if (w > maxW) { h = Math.round(h * (maxW / w)); w = maxW; }
          var canvas = document.createElement('canvas');
          canvas.width = w; canvas.height = h;
          canvas.getContext('2d').drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  saveBtn.addEventListener('click', function () {
    formErr.textContent = '';
    if (!fTitle.value.trim()) { formErr.textContent = 'নাম আবশ্যক।'; return; }
    var payload = {
      title: fTitle.value.trim(),
      subtitle: fSubtitle.value.trim(),
      category: fCategory.value,
      description: fDescription.value.trim(),
      imageUrl: currentImageData,
      active: fActive.checked,
      featured: fFeatured.checked,
      price: fPrice.value === '' ? null : Number(fPrice.value),
      unit: fUnit.value
    };
    var method = editingId ? 'PUT' : 'POST';
    if (editingId) payload.id = editingId;
    fetch('/api/products', {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
      .then(function (res) {
        if (!res.ok) { formErr.textContent = res.d.error || 'সেভ করা যায়নি।'; return; }
        closeModal();
        loadProducts();
      })
      .catch(function () { formErr.textContent = 'নেটওয়ার্ক সমস্যা।'; });
  });

  function deleteProduct(id, title) {
    if (!confirm('"' + title + '" ডিলিট করবেন?')) return;
    fetch('/api/products?id=' + encodeURIComponent(id), { method: 'DELETE' })
      .then(function (r) { return r.json(); })
      .then(function () { loadProducts(); });
  }

  // ================= ব্রাঞ্চ ব্যবস্থাপনা =================
  var branchRows = document.getElementById('branchRows');
  var branchListErr = document.getElementById('branchListErr');
  var addBranchBtn = document.getElementById('addBranchBtn');
  var branchModalBg = document.getElementById('branchModalBg');
  var branchModalTitle = document.getElementById('branchModalTitle');
  var branchFormErr = document.getElementById('branchFormErr');
  var branchCancelBtn = document.getElementById('branchCancelBtn');
  var branchSaveBtn = document.getElementById('branchSaveBtn');
  var bName = document.getElementById('bName');
  var bArea = document.getElementById('bArea');
  var bAddress = document.getElementById('bAddress');
  var bPhone = document.getElementById('bPhone');
  var bActive = document.getElementById('bActive');
  var bLat = document.getElementById('bLat');
  var bLng = document.getElementById('bLng');
  var bOpen = document.getElementById('bOpen');
  var bClose = document.getElementById('bClose');
  var editingBranchId = null;

  function loadBranches() {
    branchListErr.textContent = '';
    fetch('/api/branches?all=1')
      .then(function (r) { return r.json(); })
      .then(function (d) { renderBranchRows(d.branches || []); })
      .catch(function () { branchListErr.textContent = 'তালিকা লোড করা যায়নি।'; });
  }

  function renderBranchRows(branches) {
    branchRows.innerHTML = '';
    if (!branches.length) {
      branchRows.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--muted);padding:24px;">এখনো অ্যাডমিন থেকে কোনো ব্রাঞ্চ যোগ করা হয়নি।</td></tr>';
      return;
    }
    branches.forEach(function (b) {
      var tr = document.createElement('tr');
      tr.innerHTML =
        '<td><b>' + escapeHtml(b.name) + '</b></td>' +
        '<td>' + escapeHtml(b.area || '') + '</td>' +
        '<td style="max-width:220px;">' + escapeHtml(b.address || '') + '</td>' +
        '<td>' + escapeHtml(b.phone || '') + '</td>' +
        '<td>' + (b.active ? '✅ Active' : '⛔ Hidden') + '</td>' +
        '<td class="row-actions"></td>';
      var actionsTd = tr.querySelector('.row-actions');
      var editBtn = document.createElement('button');
      editBtn.className = 'btn-outline-s';
      editBtn.textContent = 'এডিট';
      editBtn.addEventListener('click', function () { openBranchModal(b); });
      var delBtn = document.createElement('button');
      delBtn.className = 'btn-outline-s';
      delBtn.textContent = 'ডিলিট';
      delBtn.addEventListener('click', function () { deleteBranch(b.id, b.name); });
      actionsTd.appendChild(editBtn);
      actionsTd.appendChild(delBtn);
      branchRows.appendChild(tr);
    });
  }

  function openBranchModal(branch) {
    branchFormErr.textContent = '';
    editingBranchId = branch ? branch.id : null;
    branchModalTitle.textContent = branch ? 'ব্রাঞ্চ এডিট করুন' : 'নতুন ব্রাঞ্চ';
    bName.value = branch ? branch.name : '';
    bArea.value = branch ? (branch.area || '') : '';
    bAddress.value = branch ? (branch.address || '') : '';
    bPhone.value = branch ? (branch.phone || '') : '';
    bActive.checked = branch ? !!branch.active : true;
    bLat.value = (branch && branch.lat != null) ? branch.lat : '';
    bLng.value = (branch && branch.lng != null) ? branch.lng : '';
    bOpen.value = (branch && branch.open_time) ? branch.open_time : '';
    bClose.value = (branch && branch.close_time) ? branch.close_time : '';
    branchModalBg.classList.add('open');
  }
  function closeBranchModal() { branchModalBg.classList.remove('open'); }

  addBranchBtn.addEventListener('click', function () { openBranchModal(null); });
  branchCancelBtn.addEventListener('click', closeBranchModal);

  branchSaveBtn.addEventListener('click', function () {
    branchFormErr.textContent = '';
    if (!bName.value.trim()) { branchFormErr.textContent = 'ব্রাঞ্চের নাম আবশ্যক।'; return; }
    var payload = {
      name: bName.value.trim(),
      area: bArea.value.trim(),
      address: bAddress.value.trim(),
      phone: bPhone.value.trim(),
      active: bActive.checked,
      lat: bLat.value.trim() === '' ? null : Number(bLat.value.trim()),
      lng: bLng.value.trim() === '' ? null : Number(bLng.value.trim()),
      openTime: bOpen.value || '',
      closeTime: bClose.value || ''
    };
    var method = editingBranchId ? 'PUT' : 'POST';
    if (editingBranchId) payload.id = editingBranchId;
    fetch('/api/branches', {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
      .then(function (res) {
        if (!res.ok) { branchFormErr.textContent = res.d.error || 'সেভ করা যায়নি।'; return; }
        closeBranchModal();
        loadBranches();
      })
      .catch(function () { branchFormErr.textContent = 'নেটওয়ার্ক সমস্যা।'; });
  });

  function deleteBranch(id, name) {
    if (!confirm('"' + name + '" ব্রাঞ্চ ডিলিট করবেন?')) return;
    fetch('/api/branches?id=' + encodeURIComponent(id), { method: 'DELETE' })
      .then(function (r) { return r.json(); })
      .then(function () { loadBranches(); });
  }

  // ================= রিভিউ ব্যবস্থাপনা =================
  var reviewRows = document.getElementById('reviewRows');
  var reviewListErr = document.getElementById('reviewListErr');
  var addReviewBtn = document.getElementById('addReviewBtn');
  var reviewModalBg = document.getElementById('reviewModalBg');
  var reviewModalTitle = document.getElementById('reviewModalTitle');
  var reviewFormErr = document.getElementById('reviewFormErr');
  var reviewCancelBtn = document.getElementById('reviewCancelBtn');
  var reviewSaveBtn = document.getElementById('reviewSaveBtn');
  var rName = document.getElementById('rName');
  var rLocation = document.getElementById('rLocation');
  var rRating = document.getElementById('rRating');
  var rText = document.getElementById('rText');
  var rActive = document.getElementById('rActive');
  var editingReviewId = null;

  function stars(n) { return '★★★★★'.slice(0, n) + '☆☆☆☆☆'.slice(0, 5 - n); }

  function loadReviews() {
    reviewListErr.textContent = '';
    fetch('/api/reviews?all=1')
      .then(function (r) { return r.json(); })
      .then(function (d) { renderReviewRows(d.reviews || []); })
      .catch(function () { reviewListErr.textContent = 'তালিকা লোড করা যায়নি।'; });
  }

  function renderReviewRows(reviews) {
    reviewRows.innerHTML = '';
    if (!reviews.length) {
      reviewRows.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--muted);padding:24px;">এখনো কোনো রিভিউ যোগ করা হয়নি।</td></tr>';
      return;
    }
    reviews.forEach(function (rv) {
      var tr = document.createElement('tr');
      tr.innerHTML =
        '<td><b>' + escapeHtml(rv.name) + '</b></td>' +
        '<td>' + escapeHtml(rv.location || '') + '</td>' +
        '<td style="color:var(--gold);white-space:nowrap;">' + stars(rv.rating) + '</td>' +
        '<td style="max-width:260px;">' + escapeHtml(rv.text) + '</td>' +
        '<td>' + (rv.active ? '✅ Active' : '⛔ Hidden') + '</td>' +
        '<td class="row-actions"></td>';
      var actionsTd = tr.querySelector('.row-actions');
      var editBtn = document.createElement('button');
      editBtn.className = 'btn-outline-s';
      editBtn.textContent = 'এডিট';
      editBtn.addEventListener('click', function () { openReviewModal(rv); });
      var delBtn = document.createElement('button');
      delBtn.className = 'btn-outline-s';
      delBtn.textContent = 'ডিলিট';
      delBtn.addEventListener('click', function () { deleteReview(rv.id, rv.name); });
      actionsTd.appendChild(editBtn);
      actionsTd.appendChild(delBtn);
      reviewRows.appendChild(tr);
    });
  }

  function openReviewModal(rv) {
    reviewFormErr.textContent = '';
    editingReviewId = rv ? rv.id : null;
    reviewModalTitle.textContent = rv ? 'রিভিউ এডিট করুন' : 'নতুন রিভিউ';
    rName.value = rv ? rv.name : '';
    rLocation.value = rv ? (rv.location || '') : '';
    rRating.value = rv ? String(rv.rating) : '5';
    rText.value = rv ? rv.text : '';
    rActive.checked = rv ? !!rv.active : true;
    reviewModalBg.classList.add('open');
  }
  function closeReviewModal() { reviewModalBg.classList.remove('open'); }
  addReviewBtn.addEventListener('click', function () { openReviewModal(null); });
  reviewCancelBtn.addEventListener('click', closeReviewModal);

  reviewSaveBtn.addEventListener('click', function () {
    reviewFormErr.textContent = '';
    if (!rName.value.trim() || !rText.value.trim()) { reviewFormErr.textContent = 'নাম ও মন্তব্য আবশ্যক।'; return; }
    var payload = {
      name: rName.value.trim(),
      location: rLocation.value.trim(),
      rating: parseInt(rRating.value, 10),
      text: rText.value.trim(),
      active: rActive.checked
    };
    var method = editingReviewId ? 'PUT' : 'POST';
    if (editingReviewId) payload.id = editingReviewId;
    fetch('/api/reviews', {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
      .then(function (res) {
        if (!res.ok) { reviewFormErr.textContent = res.d.error || 'সেভ করা যায়নি।'; return; }
        closeReviewModal();
        loadReviews();
      })
      .catch(function () { reviewFormErr.textContent = 'নেটওয়ার্ক সমস্যা।'; });
  });

  function deleteReview(id, name) {
    if (!confirm('"' + name + '" এর রিভিউ ডিলিট করবেন?')) return;
    fetch('/api/reviews?id=' + encodeURIComponent(id), { method: 'DELETE' })
      .then(function (r) { return r.json(); })
      .then(function () { loadReviews(); });
  }

  // ================= সাইট সেটিংস =================
  var settingsErr = document.getElementById('settingsErr');
  var settingsOk = document.getElementById('settingsOk');
  var saveSettingsBtn = document.getElementById('saveSettingsBtn');
  var SETTING_FIELDS = {
    phone: 'sPhone', email: 'sEmail', address: 'sAddress',
    facebook: 'sFacebook', instagram: 'sInstagram', whatsapp: 'sWhatsapp',
    topbar_1: 'sTopbar1', topbar_2: 'sTopbar2', topbar_3: 'sTopbar3',
    about_intro: 'sAboutIntro', about_history: 'sAboutHistory', credit: 'sCredit',
    hours_open: 'sHoursOpen', hours_close: 'sHoursClose', hours_note: 'sHoursNote'
  };

  function loadSettings() {
    settingsErr.textContent = '';
    fetch('/api/settings')
      .then(function (r) { return r.json(); })
      .then(function (d) {
        var s = d.settings || {};
        Object.keys(SETTING_FIELDS).forEach(function (k) {
          var el = document.getElementById(SETTING_FIELDS[k]);
          if (el) el.value = s[k] || '';
        });
      })
      .catch(function () { settingsErr.textContent = 'সেটিংস লোড করা যায়নি।'; });
  }

  saveSettingsBtn.addEventListener('click', function () {
    settingsErr.textContent = '';
    settingsOk.textContent = '';
    var settings = {};
    Object.keys(SETTING_FIELDS).forEach(function (k) {
      var el = document.getElementById(SETTING_FIELDS[k]);
      settings[k] = el ? el.value.trim() : '';
    });
    saveSettingsBtn.disabled = true;
    fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings: settings })
    }).then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
      .then(function (res) {
        saveSettingsBtn.disabled = false;
        if (!res.ok) { settingsErr.textContent = res.d.error || 'সেভ করা যায়নি।'; return; }
        settingsOk.textContent = '✅ সেটিংস সেভ হয়েছে — সাইটে ১ মিনিটের মধ্যে দেখা যাবে।';
        setTimeout(function () { settingsOk.textContent = ''; }, 4000);
      })
      .catch(function () { saveSettingsBtn.disabled = false; settingsErr.textContent = 'নেটওয়ার্ক সমস্যা।'; });
  });

  // পেজ লোডে সেশন আছে কিনা চেক (products?all=1 কল করেই বোঝা যায়)
  fetch('/api/products?all=1').then(function (r) {
    if (r.ok) showAdmin();
  }).catch(function () {});
})();
