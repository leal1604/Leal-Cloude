(function () {
  'use strict';

  var VIDEO_URL = 'assets/hero-scrub.mp4';
  var VIDEO_BYTES = 6000000;            // ajustar para o tamanho real do arquivo encodado
  var POSTER_URL = 'assets/hero-poster.jpg';
  var FINAL_URL = 'assets/hero-ending.jpg';

  var hero = document.getElementById('inicio');
  var stage = document.getElementById('stage');
  var video = document.getElementById('hero-video');
  var posterLayer = stage.querySelector('.poster');
  var ring = stage.querySelector('.ring');
  var topo = document.getElementById('topo');

  // O quadro final serve o hero estático (celular e movimento reduzido)
  stage.style.setProperty('--quadro-final', "url('" + FINAL_URL + "')");

  var clamp = function (v, lo, hi) { return Math.min(hi, Math.max(lo, v)); };
  var smoothstep = function (p, e0, e1) {
    var t = clamp((p - e0) / (e1 - e0), 0, 1);
    return t * t * (3 - 2 * t);
  };

  /* ---------- Divisão dos títulos em palavras (uma vez) ---------- */
  function rng(seed) {
    var s = seed >>> 0;
    return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  }
  document.querySelectorAll('.split').forEach(function (el, n) {
    var text = el.textContent.trim();
    var em = el.getAttribute('data-em');
    var spread = parseFloat(el.getAttribute('data-spread') || '0.4');
    var r = rng(1998 + n * 31);
    var words = text.split(/\s+/);
    var sr = document.createElement('span');
    sr.className = 'sr-only';
    sr.textContent = text;
    var vis = document.createElement('span');
    vis.setAttribute('aria-hidden', 'true');
    words.forEach(function (w, i) {
      var s = document.createElement('span');
      s.className = 'w';
      s.textContent = w;
      if (em && w === em) { var e = document.createElement('em'); e.textContent = w; s.textContent = ''; s.appendChild(e); }
      s.style.setProperty('--th', (i / words.length * spread + r() * 0.05).toFixed(3));
      vis.appendChild(s);
      if (i < words.length - 1) vis.appendChild(document.createTextNode(' '));
    });
    el.textContent = '';
    el.appendChild(sr);
    el.appendChild(vis);
  });

  /* ---------- Faixas de legenda ---------- */
  var bands = Array.prototype.map.call(stage.querySelectorAll('.band'), function (el, i, all) {
    return {
      el: el,
      a: parseFloat(el.dataset.a),
      b: parseFloat(el.dataset.b),
      ramp: el.dataset.ramp ? parseFloat(el.dataset.ramp) : 0,
      first: i === 0,
      last: i === all.length - 1,
      op: -1, k: -1, on: null
    };
  });
  var loadK = 0;

  function updateCaptions(p) {
    bands.forEach(function (bd) {
      var a = bd.a, b = bd.b;
      var f = Math.min(0.02, (b - a) / 3);
      var inn = bd.first ? (p <= b ? 1 : 0) : smoothstep(p, a, a + f);
      var out = bd.last ? 1 : 1 - smoothstep(p, b - f, b);
      if (bd.first && p > b) inn = 0;
      var op = bd.first ? (1 - smoothstep(p, b - f, b)) : inn * out;
      var k = clamp((p - a) / (bd.ramp || Math.min(0.025, (b - a) * 0.35)), 0, 1);
      if (bd.first) k = Math.max(k, loadK);
      op = Math.round(op * 1000) / 1000;
      if (Math.abs(op - bd.op) > 0.001) { bd.op = op; bd.el.style.opacity = op; }
      if (Math.abs(k - bd.k) > 0.008 || (k === 1 && bd.k !== 1) || (k === 0 && bd.k !== 0)) { bd.k = k; bd.el.style.setProperty('--k', k.toFixed(3)); }
      var on = op > 0.5;
      if (on !== bd.on) { bd.on = on; bd.el.classList.toggle('on', on); }
    });
  }

  function heroProgress() {
    var r = hero.getBoundingClientRect();
    var range = hero.offsetHeight - window.innerHeight;
    return range > 0 ? clamp(-r.top / range, 0, 1) : 0;
  }

  /* ---------- Seeks travados ---------- */
  var seekBusy = false, pendingTime = null;
  function requestSeek(t) {
    if (!video.duration || !isFinite(video.duration)) return;
    t = clamp(t, 0, video.duration - 0.04);
    if (seekBusy) { pendingTime = t; return; }
    seekBusy = true;
    video.currentTime = t;
  }
  video.addEventListener('seeked', function () {
    seekBusy = false;
    if (pendingTime !== null) { var t = pendingTime; pendingTime = null; requestSeek(t); }
  });
  video.addEventListener('error', function () { seekBusy = false; pendingTime = null; failVideo(); });

  /* ---------- Loop rAF que descansa ---------- */
  var target = 0, shown = 0, rafId = null, lastTick = 0, heroOnScreen = true;
  function tick(now) {
    var dt = Math.min(100, now - (lastTick || now));
    lastTick = now;
    shown += (target - shown) * (1 - Math.pow(1 - 0.16, dt / 16.667));
    if (Math.abs(target - shown) < 0.0005) { shown = target; rafId = null; lastTick = 0; }
    else rafId = requestAnimationFrame(tick);
    requestSeek(shown * video.duration);
    updateCaptions(shown);
  }
  function onScroll() {
    target = heroProgress();
    if (rafId === null && heroOnScreen) rafId = requestAnimationFrame(tick);
  }
  new IntersectionObserver(function (e) {
    heroOnScreen = e[0].isIntersecting;
    if (heroOnScreen) onScroll();
  }).observe(hero);

  /* ---------- Carregador de Blob com anel ---------- */
  var heroStarted = false;
  function initHeroOnce() {
    if (heroStarted) return;
    heroStarted = true;
    posterLayer.style.backgroundImage = "url('" + POSTER_URL + "')";
    var started = false;
    var start = function () { if (started) return; started = true; loadHeroBlob().catch(failVideo); };
    var img = new Image();
    img.onload = start; img.onerror = start; img.src = POSTER_URL;
    setTimeout(start, 4000);
    // rampa de montagem da faixa um no carregamento
    var t0 = performance.now();
    (function subir(now) {
      loadK = clamp((now - t0) / 1400, 0, 1);
      updateCaptions(shown);
      if (loadK < 1) requestAnimationFrame(subir);
    })(t0);
  }

  function loadHeroBlob() {
    if (location.protocol === 'file:') return Promise.reject(new Error('file'));
    var ctrl = new AbortController();
    var watchdog = setTimeout(function () { ctrl.abort(); }, 20000);
    return fetch(VIDEO_URL, { priority: 'low', signal: ctrl.signal }).then(function (res) {
      if (!res.ok || !res.body) throw new Error('http ' + res.status);
      var total = Number(res.headers.get('Content-Length')) || VIDEO_BYTES;
      var reader = res.body.getReader();
      var chunks = [], got = 0, lastRing = 0;
      function pump() {
        return reader.read().then(function (r) {
          if (r.done) return;
          clearTimeout(watchdog);
          watchdog = setTimeout(function () { ctrl.abort(); }, 20000);
          chunks.push(r.value);
          got += r.value.length;
          var frac = Math.min(1, got / total), now = performance.now();
          if (now - lastRing > 100 || frac === 1) { lastRing = now; ring.style.setProperty('--ld', Math.round(126 * (1 - frac))); }
          return pump();
        });
      }
      return pump().then(function () {
        clearTimeout(watchdog);
        ring.style.setProperty('--ld', 0);
        video.src = URL.createObjectURL(new Blob(chunks, { type: 'video/mp4' }));
        video.load();
        video.addEventListener('canplay', function () {
          requestSeek(heroProgress() * video.duration);
          stage.classList.add('video-ready');
        }, { once: true });
      });
    });
  }

  function failVideo() {
    if (stage.classList.contains('video-failed')) return;
    stage.classList.add('video-failed');
    if (ring && ring.parentNode) {
      var s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      s.setAttribute('class', 'seta'); s.setAttribute('aria-hidden', 'true');
      s.innerHTML = '<use href="#i-seta"/>';
      ring.replaceWith(s);
    }
    // o pôster assume: o quadro final entra na metade de baixo da jornada
    posterLayer.style.transition = 'background-image .6s';
  }

  /* ---------- Os cinco portões do hero estático ---------- */
  var GATES = [
    '(max-width: 720px)',
    '(orientation: portrait) and (max-width: 1024px)',
    '(orientation: portrait) and (pointer: coarse)',
    '(orientation: landscape) and (pointer: coarse) and (max-height: 560px)',
    '(prefers-reduced-motion: reduce)'
  ];
  var MQLS = GATES.map(function (q) { return matchMedia(q); });
  var scrubOn = false;
  function enableScrub() {
    if (scrubOn) return; scrubOn = true;
    initHeroOnce();
    addEventListener('scroll', onScroll, { passive: true });
    bands.forEach(function (b) { b.op = -1; b.k = -1; b.on = null; });
    unpinFinalStates();
    updateCaptions(heroProgress());
    onScroll();
  }
  function disableScrub() {
    if (!scrubOn) return; scrubOn = false;
    removeEventListener('scroll', onScroll);
    if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; }
  }
  function applyHeroMode() {
    if (MQLS.some(function (m) { return m.matches; })) disableScrub(); else enableScrub();
  }
  MQLS.forEach(function (m) { m.addEventListener('change', applyHeroMode); });

  /* ---------- Topo sólido depois do hero ---------- */
  var topoSolido = null;
  function checkTopo() {
    var solido = window.scrollY > hero.offsetHeight - window.innerHeight * 1.05 || !scrubOn && window.scrollY > 40;
    if (solido !== topoSolido) { topoSolido = solido; topo.classList.toggle('solido', solido); }
  }
  addEventListener('scroll', checkTopo, { passive: true });

  /* ---------- Entradas coreografadas ---------- */
  var reveals = document.querySelectorAll('.revela');
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      var el = e.target;
      el.classList.add('in');
      setTimeout(function () { el.classList.add('feito'); }, 1300);
      io.unobserve(el);
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
  reveals.forEach(function (el) { io.observe(el); });

  // Brasas só rodam com a seção na tela; tudo pausa com a aba escondida
  var ioAtivo = new IntersectionObserver(function (es) {
    es.forEach(function (e) { e.target.classList.toggle('ativo', e.isIntersecting); });
  });
  document.querySelectorAll('.escuro').forEach(function (el) { ioAtivo.observe(el); });
  document.addEventListener('visibilitychange', function () { document.body.classList.toggle('paused', document.hidden); });

  /* ---------- A fornada: segurar para assar ---------- */
  var fornada = document.getElementById('fornada');
  var botao = document.getElementById('segurar');
  var estado = document.getElementById('estado-fornada');
  var forno = document.getElementById('forno-mini');
  var p = 0, segurando = false, fRaf = null, fLast = 0, pronto = false;
  function setP(v) {
    p = v;
    var s = p.toFixed(3);
    forno.style.setProperty('--p', s);
    botao.style.setProperty('--p', s);
  }
  function concluir() {
    pronto = true;
    fornada.classList.add('pronto');
    botao.querySelector('span:last-child').textContent = 'Fornada pronta';
    estado.textContent = 'Saiu agora: pão francês, pão com manteiga e bolo meio a meio.';
  }
  function fTick(now) {
    var dt = Math.min(100, now - (fLast || now)); fLast = now;
    if (segurando) setP(Math.min(1, p + dt / 1700));
    else setP(Math.max(0, p - dt / 900));
    if (p >= 1 && !pronto) { concluir(); }
    if ((segurando && p < 1) || (!segurando && p > 0 && !pronto)) fRaf = requestAnimationFrame(fTick);
    else { fRaf = null; fLast = 0; }
  }
  function iniciar(e) {
    if (pronto) return;
    if (e && e.type === 'pointerdown') { botao.setPointerCapture && botao.setPointerCapture(e.pointerId); }
    segurando = true;
    estado.textContent = 'Assando…';
    if (!fRaf) fRaf = requestAnimationFrame(fTick);
  }
  function soltar() {
    if (!segurando) return;
    segurando = false;
    if (!pronto) estado.textContent = p > 0 ? 'Segure mais um pouco.' : '';
    if (!fRaf && !pronto) fRaf = requestAnimationFrame(fTick);
  }
  botao.addEventListener('pointerdown', iniciar);
  botao.addEventListener('pointerup', soltar);
  botao.addEventListener('pointercancel', soltar);
  botao.addEventListener('pointerleave', soltar);
  botao.addEventListener('keydown', function (e) { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); iniciar(); } });
  botao.addEventListener('keyup', function (e) { if (e.key === ' ' || e.key === 'Enter') soltar(); });
  botao.addEventListener('contextmenu', function (e) { e.preventDefault(); });

  /* ---------- Movimento reduzido ao vivo, nas duas direções ---------- */
  var pinned = false;
  function pinToFinalStates() {
    pinned = true;
    setP(1); if (!pronto) concluir();
    reveals.forEach(function (el) { el.classList.add('in', 'feito'); });
    document.querySelectorAll('.divisor').forEach(function (el) { el.classList.add('in'); });
  }
  function unpinFinalStates() {
    if (!pinned) return;
    pinned = false;
    // a fornada volta a ser executável
    pronto = false; setP(0);
    fornada.classList.remove('pronto');
    botao.querySelector('span:last-child').textContent = 'Segure para assar';
    estado.textContent = '';
  }
  var reduz = matchMedia('(prefers-reduced-motion: reduce)');
  reduz.addEventListener('change', function (e) { if (e.matches) pinToFinalStates(); else applyHeroMode(); });
  if (reduz.matches) pinToFinalStates();

  /* ---------- Menu no celular ---------- */
  var mb = document.querySelector('.menu-botao'), menu = document.getElementById('menu');
  mb.addEventListener('click', function () {
    var aberto = menu.classList.toggle('aberto');
    mb.setAttribute('aria-expanded', String(aberto));
    mb.setAttribute('aria-label', aberto ? 'Fechar menu' : 'Abrir menu');
    topo.classList.add('solido');
  });
  menu.addEventListener('click', function (e) {
    if (e.target.closest('a')) { menu.classList.remove('aberto'); mb.setAttribute('aria-expanded', 'false'); mb.setAttribute('aria-label', 'Abrir menu'); }
  });

  /* ---------- Abas do cardápio ---------- */
  var abas = Array.prototype.slice.call(document.querySelectorAll('[role="tab"]'));
  function ativar(aba) {
    abas.forEach(function (a) {
      var sel = a === aba;
      a.setAttribute('aria-selected', String(sel));
      a.tabIndex = sel ? 0 : -1;
      document.getElementById(a.getAttribute('aria-controls')).hidden = !sel;
    });
  }
  abas.forEach(function (aba, i) {
    aba.addEventListener('click', function () { ativar(aba); });
    aba.addEventListener('keydown', function (e) {
      var alvo = null;
      if (e.key === 'ArrowRight') alvo = abas[(i + 1) % abas.length];
      if (e.key === 'ArrowLeft') alvo = abas[(i - 1 + abas.length) % abas.length];
      if (e.key === 'Home') alvo = abas[0];
      if (e.key === 'End') alvo = abas[abas.length - 1];
      if (alvo) { e.preventDefault(); ativar(alvo); alvo.focus(); }
    });
  });

  /* ---------- Formulário de encomenda ---------- */
  // Com o WhatsApp da Cristal confirmado, preencha data-whatsapp no <form> (ex.: "5584999999999").
  var form = document.getElementById('form-encomenda');
  var retorno = document.getElementById('f-retorno');
  var enviar = document.getElementById('f-enviar');
  var numero = (form.getAttribute('data-whatsapp') || '').replace(/\D/g, '');
  enviar.textContent = numero ? 'Enviar pelo WhatsApp' : 'Montar pedido';
  var hoje = new Date();
  hoje.setMinutes(hoje.getMinutes() - hoje.getTimezoneOffset());
  form.elements.data.min = hoje.toISOString().slice(0, 10);
  function limpar() {
    form.querySelectorAll('.erro').forEach(function (e) { e.remove(); });
    form.querySelectorAll('[aria-invalid]').forEach(function (e) { e.removeAttribute('aria-invalid'); e.removeAttribute('aria-errormessage'); });
  }
  function erro(campo, texto) {
    campo.setAttribute('aria-invalid', 'true');
    var s = document.createElement('span');
    s.className = 'erro'; s.id = campo.id + '-erro'; s.textContent = texto;
    campo.setAttribute('aria-errormessage', s.id);
    campo.parentNode.appendChild(s);
  }
  form.addEventListener('submit', function (e) {
    e.preventDefault(); limpar();
    var f = form.elements, falta = [];
    if (!f.nome.value.trim()) { erro(f.nome, 'Escreva seu nome para a Cristal saber quem pediu.'); falta.push(f.nome); }
    if (!f.tipo.value) { erro(f.tipo, 'Escolha o tipo de encomenda.'); falta.push(f.tipo); }
    if (!f.data.value) { erro(f.data, 'Escolha o dia da retirada.'); falta.push(f.data); }
    if (falta.length) { falta[0].focus(); retorno.textContent = ''; return; }
    var d = f.data.value.split('-');
    var msg = 'Olá, Panificadora Cristal! Quero fazer uma encomenda.\n' +
      '• Nome: ' + f.nome.value.trim() + '\n• Pedido: ' + f.tipo.value + '\n• Para: ' + d[2] + '/' + d[1] + '/' + d[0] +
      (f.detalhes.value.trim() ? '\n• Detalhes: ' + f.detalhes.value.trim() : '');
    if (numero) {
      window.open('https://wa.me/' + numero + '?text=' + encodeURIComponent(msg), '_blank', 'noopener');
      retorno.textContent = 'Pedido aberto no WhatsApp da Cristal. Falta só tocar em enviar.';
      return;
    }
    var fim = 'Pedido montado e copiado. Ligue para (84) 3213-3695 e leia o pedido, ou cole numa mensagem para a Cristal.';
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(msg).then(function () { retorno.textContent = fim; }, function () { retorno.textContent = 'Pedido montado. Ligue para (84) 3213-3695 e leia:\n' + msg; });
    } else retorno.textContent = 'Pedido montado. Ligue para (84) 3213-3695 e leia:\n' + msg;
  });

  applyHeroMode();
  checkTopo();
})();
