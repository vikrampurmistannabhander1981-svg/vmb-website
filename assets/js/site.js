document.addEventListener('DOMContentLoaded', function () {
  var toggle = document.querySelector('.menu-toggle');
  var nav = document.querySelector('nav.main');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open-mobile');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }
});
