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

  var currentImageData = '';
  var editingId = null;

  function showAdmin() {
    loginScreen.style.display = 'none';
    adminScreen.style.display = 'block';
    loadProducts();
  }

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
        '<td><b>' + escapeHtml(p.title) + '</b><br><span style="color:var(--muted);font-size:12px;">' + escapeHtml(p.subtitle || '') + '</span></td>' +
        '<td>' + (CAT_LABELS[p.category] || p.category) + '</td>' +
        '<td>' + (p.active ? '✅ Active' : '⛔ Hidden') + '</td>' +
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
      active: fActive.checked
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

  // পেজ লোডে সেশন আছে কিনা চেক (products?all=1 কল করেই বোঝা যায়)
  fetch('/api/products?all=1').then(function (r) {
    if (r.ok) showAdmin();
  }).catch(function () {});
})();
