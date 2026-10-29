/* A página já está visível no HTML. Este script acrescenta as interações. */
(function () {
  'use strict';

  var range = document.querySelector('[data-calculadora-aporte]');
  if (range) {
    var formatar = function (valor) {
      return 'R$ ' + Math.round(valor).toLocaleString('pt-BR');
    };
    var atualizar = function () {
      var aporte = Number(range.value);
      var fatores = { aporte: 1, mes: 0.02, ano: 0.02 * 12, quatro: 0.02 * 48 };
      Object.keys(fatores).forEach(function (nome) {
        document.querySelector('[data-calculo="' + nome + '"]').textContent = formatar(aporte * fatores[nome]);
      });
      range.style.setProperty('--p', ((aporte - Number(range.min)) / (Number(range.max) - Number(range.min)) * 100) + '%');
    };
    range.addEventListener('input', atualizar);
    range.addEventListener('change', atualizar);
    // Trate o gesto no próprio controle para não disputar o arraste com a página.
    var ponteiroAtivo = null;
    var atualizarPorToque = function (clientX) {
      var area = range.getBoundingClientRect();
      var margem = 13; // metade do botão de 26 px
      var progresso = Math.max(0, Math.min(1, (clientX - area.left - margem) / Math.max(1, area.width - margem * 2)));
      var minimo = Number(range.min);
      var maximo = Number(range.max);
      var passo = Number(range.step) || 1;
      range.value = Math.min(maximo, minimo + Math.round(progresso * (maximo - minimo) / passo) * passo);
      atualizar();
    };
    if ('PointerEvent' in window) {
      range.addEventListener('pointerdown', function (event) {
        if (event.pointerType !== 'touch' && event.pointerType !== 'pen') return;
        event.preventDefault();
        ponteiroAtivo = event.pointerId;
        atualizarPorToque(event.clientX);
        try { range.setPointerCapture(event.pointerId); } catch (error) { /* evento sem captura */ }
      }, { passive: false });
      range.addEventListener('pointermove', function (event) {
        if (ponteiroAtivo !== event.pointerId) return;
        event.preventDefault();
        atualizarPorToque(event.clientX);
      }, { passive: false });
      range.addEventListener('pointerup', function (event) {
        if (ponteiroAtivo !== event.pointerId) return;
        atualizarPorToque(event.clientX);
        ponteiroAtivo = null;
      });
      range.addEventListener('pointercancel', function () { ponteiroAtivo = null; });
    } else {
      var tocar = function (event) {
        if (!event.touches.length) return;
        event.preventDefault();
        atualizarPorToque(event.touches[0].clientX);
      };
      range.addEventListener('touchstart', tocar, { passive: false });
      range.addEventListener('touchmove', tocar, { passive: false });
    }
    range.disabled = false;
    atualizar();
    var simulador = range.closest('[data-simulador]');
    if (simulador) simulador.setAttribute('data-enhanced', 'true');
  }

  var carousel = document.querySelector('.usinas-carousel');
  if (!carousel) return;
  var slides = Array.prototype.slice.call(carousel.querySelectorAll('.usina-slide'));
  var dots = Array.prototype.slice.call(carousel.querySelectorAll('.usina-dot'));
  if (!slides.length) return;
  var index = 0;
  var timer = null;
  var motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var paused = motion.matches;
  var visible = true;
  var hovering = false;
  var focused = false;
  var touch = null;
  var toggle = carousel.querySelector('.usina-toggle');
  var counter = carousel.querySelector('.usina-count');

  function render() {
    slides.forEach(function (slide, i) {
      var active = i === index;
      slide.style.opacity = active ? '1' : '0';
      slide.style.zIndex = active ? '1' : '0';
      slide.setAttribute('aria-hidden', active ? 'false' : 'true');
    });
    dots.forEach(function (dot, i) {
      var active = i === index;
      dot.setAttribute('aria-current', active ? 'true' : 'false');
      var mark = dot.querySelector('span');
      mark.style.width = active ? '24px' : '8px';
      mark.style.background = active ? '#a6f02e' : 'rgba(255,255,255,.55)';
    });
    if (counter) counter.textContent = String(index + 1).padStart(2, '0') + ' / ' + String(slides.length).padStart(2, '0');
    if (toggle) {
      toggle.setAttribute('aria-label', paused ? 'Iniciar troca automática das fotos' : 'Pausar troca automática das fotos');
      toggle.querySelector('path').setAttribute('d', paused ? 'M8 5v14l11-7z' : 'M6 5h4v14H6zM14 5h4v14h-4z');
    }
  }
  function restart() {
    window.clearInterval(timer);
    if (!paused && visible && !hovering && !focused && !document.hidden) {
      timer = window.setInterval(function () { index = (index + 1) % slides.length; render(); }, 5500);
    }
  }
  function go(next) {
    index = (next + slides.length) % slides.length;
    render();
    restart();
  }
  carousel.querySelector('.usina-prev').addEventListener('click', function () { go(index - 1); });
  carousel.querySelector('.usina-next').addEventListener('click', function () { go(index + 1); });
  dots.forEach(function (dot, i) { dot.addEventListener('click', function () { go(i); }); });
  toggle.addEventListener('click', function () { paused = !paused; render(); restart(); });
  carousel.addEventListener('keydown', function (event) {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      go(index + (event.key === 'ArrowRight' ? 1 : -1));
    }
  });
  carousel.addEventListener('mouseenter', function () { hovering = true; restart(); });
  carousel.addEventListener('mouseleave', function () { hovering = false; restart(); });
  carousel.addEventListener('focusin', function () { focused = true; restart(); });
  carousel.addEventListener('focusout', function (event) { focused = carousel.contains(event.relatedTarget); restart(); });
  carousel.addEventListener('touchstart', function (event) {
    touch = { x: event.changedTouches[0].clientX, y: event.changedTouches[0].clientY };
  }, { passive: true });
  carousel.addEventListener('touchend', function (event) {
    if (!touch) return;
    var dx = event.changedTouches[0].clientX - touch.x;
    var dy = event.changedTouches[0].clientY - touch.y;
    touch = null;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) go(index + (dx < 0 ? 1 : -1));
  }, { passive: true });
  carousel.addEventListener('touchcancel', function () { touch = null; });
  document.addEventListener('visibilitychange', restart);
  var motionChange = function () { paused = motion.matches; render(); restart(); };
  if (motion.addEventListener) motion.addEventListener('change', motionChange);
  else if (motion.addListener) motion.addListener(motionChange);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) { visible = entries[0].isIntersecting; restart(); }, { threshold: 0.1 }).observe(carousel);
  }
  carousel.setAttribute('data-enhanced', 'true');
  render();
  restart();
}());
