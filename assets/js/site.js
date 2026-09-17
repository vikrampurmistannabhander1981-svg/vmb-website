document.addEventListener('DOMContentLoaded', function () {
  var toggle = document.querySelector('.menu-toggle');
  var nav = document.querySelector('nav.main');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open-mobile');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  var fadeItems = document.querySelectorAll('.fade-group > *');
  if (fadeItems.length && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    fadeItems.forEach(function (el) { io.observe(el); });
  } else {
    fadeItems.forEach(function (el) { el.classList.add('in-view'); });
  }
});
