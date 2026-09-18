(function () {
  var DEFAULT_PHONE = '01775525296';
  var DEFAULT_EMAIL = 'vikrampurmistannabhander1981@gmail.com';
  var DEFAULT_ADDRESS = '১১৯, কলাবাগান, ঢাকা-১২০৫';

  function bn(digits) {
    var map = { '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪', '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯' };
    return String(digits).replace(/[0-9]/g, function (d) { return map[d]; });
  }
  function esc(s) {
    return String(s || '').replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function textNodesMatching(txt) {
    var out = [];
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    var n;
    while ((n = walker.nextNode())) { if (n.nodeValue.trim() === txt) out.push(n); }
    return out;
  }

  function applySettings(s) {
    var phone = (s.phone || '').replace(/[^\d+]/g, '');
    if (phone) {
      document.querySelectorAll('a[href^="tel:"]').forEach(function (a) { a.setAttribute('href', 'tel:' + phone); });
      textNodesMatching(bn(DEFAULT_PHONE)).forEach(function (n) { n.nodeValue = bn(phone.replace(/^\+?88/, '')); });
    }
    if (s.email) {
      document.querySelectorAll('a[href^="mailto:"]').forEach(function (a) {
        a.setAttribute('href', 'mailto:' + s.email);
        if (a.textContent.trim() === DEFAULT_EMAIL) a.textContent = s.email;
      });
    }
    if (s.address) {
      textNodesMatching(DEFAULT_ADDRESS).forEach(function (n) { n.nodeValue = s.address; });
    }
    var tb = document.querySelectorAll('.topbar .wrap span:not(.dot)');
    ['topbar_1', 'topbar_2', 'topbar_3'].forEach(function (k, i) {
      if (s[k] && tb[i]) tb[i].textContent = s[k];
    });
    document.querySelectorAll('[data-setting]').forEach(function (el) {
      var k = el.getAttribute('data-setting');
      if (s[k]) el.textContent = s[k];
    });

    // সোশ্যাল আইকন (ফুটার) — লিংক থাকলে তবেই দেখাবে
    var social = document.querySelector('.js-social');
    if (social) {
      var items = [];
      if (s.facebook) items.push(['Facebook', s.facebook, '<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>']);
      if (s.instagram) items.push(['Instagram', s.instagram, '<rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/>']);
      if (s.whatsapp) items.push(['WhatsApp', 'https://wa.me/' + s.whatsapp.replace(/[^\d]/g, ''), '<path d="M21 11.5a8.4 8.4 0 0 1-12.6 7.3L3 21l2.3-5.2A8.5 8.5 0 1 1 21 11.5z"/><path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1-1.5-2-1-1 1a4 4 0 0 1-2-2l1-1-1-2z"/>']);
      social.innerHTML = items.map(function (it) {
        return '<a href="' + esc(it[1]) + '" target="_blank" rel="noopener" aria-label="' + it[0] + '" title="' + it[0] + '">' +
          '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + it[2] + '</svg></a>';
      }).join('');
      social.style.display = items.length ? 'flex' : 'none';
    }
  }

  fetch('/api/settings').then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
    if (d && d.settings) applySettings(d.settings);
  }).catch(function () {});

  // ---- হোমপেজ: ফিচার্ড মিষ্টি ----
  var sig = document.getElementById('signatureGrid');
  if (sig) {
    fetch('/api/products?featured=1').then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
      if (!d || !d.products || !d.products.length) return;
      sig.innerHTML = d.products.slice(0, 6).map(function (p) {
        return '<div class="sweet-card in-view">' +
          (p.image_url ? '<div class="imgwrap"><img src="' + esc(p.image_url) + '" alt="' + esc(p.title) + '"></div>' : '') +
          '<div class="body">' +
            (p.subtitle ? '<div class="tag">' + esc(p.subtitle) + '</div>' : '') +
            '<h3>' + esc(p.title) + '</h3>' +
            (p.description ? '<p>' + esc(p.description) + '</p>' : '') +
            ((p.price != null && p.price !== '') ? '<div class="price">৳ ' + bn(p.price) + ' <span>/ ' + esc(p.unit || 'কেজি') + '</span></div>' : '') +
            '<a class="link" href="sweets.html">View Details →</a>' +
          '</div></div>';
      }).join('');
    }).catch(function () {});
  }

  // ---- হোমপেজ: কাস্টমার রিভিউ (থাকলে তবেই সেকশন দেখাবে) ----
  var rs = document.getElementById('reviewsSection');
  if (rs) {
    fetch('/api/reviews').then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
      if (!d || !d.reviews || !d.reviews.length) return;
      var grid = rs.querySelector('.review-grid');
      grid.innerHTML = d.reviews.slice(0, 6).map(function (rv) {
        var n = Math.min(5, Math.max(1, rv.rating || 5));
        return '<div class="review-card in-view">' +
          '<div class="stars">' + '★★★★★'.slice(0, n) + '<span>' + '★★★★★'.slice(0, 5 - n) + '</span></div>' +
          '<p>“' + esc(rv.text) + '”</p>' +
          '<div class="who"><b>' + esc(rv.name) + '</b>' + (rv.location ? '<span>' + esc(rv.location) + '</span>' : '') + '</div>' +
          '</div>';
      }).join('');
      rs.style.display = 'block';
    }).catch(function () {});
  }
})();
