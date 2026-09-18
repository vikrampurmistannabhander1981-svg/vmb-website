(function () {
  var story = document.querySelector('.story');
  if (!story) return;

  var pin = story.querySelector('.story-pin');
  var bgs = Array.prototype.slice.call(story.querySelectorAll('.story-bg img, .story-bg video'));
  var chapters = Array.prototype.slice.call(story.querySelectorAll('.story-chapter'));
  var dots = Array.prototype.slice.call(story.querySelectorAll('.story-progress span'));
  var video = story.querySelector('.story-bg video');
  var n = chapters.length;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var current = -1;
  var ticking = false;

  function setChapter(i) {
    if (i === current) return;
    current = i;
    chapters.forEach(function (c, k) { c.classList.toggle('on', k === i); });
    dots.forEach(function (d, k) { d.classList.toggle('on', k === i); });
    if (!video) {
      bgs.forEach(function (b, k) { b.classList.toggle('on', k === i); });
    }
  }

  function update() {
    ticking = false;
    var rect = story.getBoundingClientRect();
    var total = story.offsetHeight - window.innerHeight;
    var progress = total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 0;

    var idx = Math.min(n - 1, Math.floor(progress * n));
    setChapter(idx);
    story.classList.toggle('done', progress > 0.96);
    // স্টোরি যতক্ষণ স্ক্রিন ঢেকে রাখে, হেডার স্বচ্ছ/গ্লাস থাকে
    document.body.classList.toggle('over-story', rect.top <= 80 && rect.bottom > window.innerHeight * 0.6);

    if (reduced) return;

    if (video && video.duration) {
      video.currentTime = progress * video.duration;
    } else {
      // প্রতিটি অধ্যায়ের ভেতরে ছবিটা ধীরে জুম হয় (Ken Burns)
      var local = (progress * n) - idx;
      var active = bgs[idx];
      if (active) active.style.transform = 'scale(' + (1.04 + local * 0.10) + ')';
    }
  }

  function onScroll() {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }

  if (video) {
    video.classList.add('on');
    bgs.forEach(function (b) { if (b !== video) b.style.display = 'none'; });
    video.addEventListener('loadedmetadata', update);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  update();

  // ---- সোনালি কণা (চিনির গুঁড়ো / ধোঁয়ার আভা) ----
  var canvas = story.querySelector('.story-dust');
  if (!canvas || reduced) return;
  var ctx = canvas.getContext('2d');
  var dpr = Math.min(2, window.devicePixelRatio || 1);
  var W = 0, H = 0, parts = [], running = false;

  function resize() {
    W = pin.clientWidth; H = pin.clientHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function spawn() {
    var big = Math.random() < 0.18;
    return {
      x: Math.random() * W,
      y: H + Math.random() * 40,
      r: big ? 2.2 + Math.random() * 2.6 : 0.6 + Math.random() * 1.2,
      vy: -(0.15 + Math.random() * 0.35),
      vx: (Math.random() - 0.5) * 0.25,
      a: 0,
      life: 0,
      max: 600 + Math.random() * 700,
      blur: big
    };
  }
  function init() {
    resize();
    parts = [];
    var count = Math.round(Math.min(70, Math.max(30, W / 22)));
    for (var i = 0; i < count; i++) {
      var p = spawn();
      p.y = Math.random() * H;
      p.life = Math.random() * p.max;
      parts.push(p);
    }
  }
  function frame() {
    if (!running) return;
    ctx.clearRect(0, 0, W, H);
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i];
      p.life++;
      p.x += p.vx + Math.sin(p.life / 60) * 0.12;
      p.y += p.vy;
      var t = p.life / p.max;
      p.a = t < 0.15 ? t / 0.15 : t > 0.8 ? (1 - t) / 0.2 : 1;
      if (p.life > p.max || p.y < -20) { parts[i] = spawn(); continue; }
      ctx.beginPath();
      if (p.blur) {
        var g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 3);
        g.addColorStop(0, 'rgba(232,190,110,' + (0.55 * p.a) + ')');
        g.addColorStop(1, 'rgba(232,190,110,0)');
        ctx.fillStyle = g;
        ctx.arc(p.x, p.y, p.r * 3, 0, Math.PI * 2);
      } else {
        ctx.fillStyle = 'rgba(245,214,150,' + (0.85 * p.a) + ')';
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      }
      ctx.fill();
    }
    requestAnimationFrame(frame);
  }
  // স্টোরি স্ক্রিনে থাকলেই শুধু চলবে — অন্য সময় CPU খরচ নেই
  var io = new IntersectionObserver(function (entries) {
    var vis = entries[0].isIntersecting;
    if (vis && !running) { running = true; if (!parts.length) init(); frame(); }
    if (!vis) running = false;
  }, { threshold: 0 });
  io.observe(story);
  window.addEventListener('resize', function () { if (running) init(); });
})();
