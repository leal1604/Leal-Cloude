(function () {
  'use strict';

  // WhatsApp da Cristal: preencha com DDI + DDD + número, só dígitos (ex.: '5584999999999').
  // Vazio: os botões de WhatsApp viram "Ligar agora" para (84) 3213-3695.
  var WHATSAPP = '';
  var TELEFONE = 'tel:+558432133695';

  /* Menu no celular */
  var botao = document.querySelector('.menu-botao');
  var nav = document.getElementById('nav');
  if (botao && nav) {
    botao.addEventListener('click', function () {
      var aberto = nav.classList.toggle('aberto');
      botao.setAttribute('aria-expanded', String(aberto));
      botao.setAttribute('aria-label', aberto ? 'Fechar menu' : 'Abrir menu');
    });
  }

  /* WhatsApp: com número, os links abrem a conversa; sem número, ligam */
  document.querySelectorAll('[data-whats]').forEach(function (a) {
    if (WHATSAPP) {
      a.href = 'https://wa.me/' + WHATSAPP;
      a.target = '_blank';
      a.rel = 'noopener';
      if (a.dataset.rotulo) a.textContent = a.dataset.rotulo;
      if (a.hasAttribute('aria-label')) a.setAttribute('aria-label', 'WhatsApp da Panificadora Cristal');
    } else {
      a.href = TELEFONE;
    }
  });

  /* Entradas suaves ao rolar */
  var itens = document.querySelectorAll('.revela');
  if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -30px 0px' });
    itens.forEach(function (el) { io.observe(el); });
  } else {
    itens.forEach(function (el) { el.classList.add('in'); });
  }

  /* Animações: cascata, estrelas, contagem e foto do topo */
  var calmo = matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('.cascata').forEach(function (c) {
    [].forEach.call(c.children, function (el, i) { el.style.setProperty('--i', i); });
  });
  function formata(v, casas) { return casas ? v.toFixed(casas).replace('.', ',') : Math.round(v).toLocaleString('pt-BR'); }
  function contar(el) {
    var alvo = parseFloat(el.dataset.conta), casas = parseInt(el.dataset.casas || '0', 10), t0 = null, dur = 1400;
    (function passo(t) {
      if (t0 === null) t0 = t;
      var k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      el.textContent = formata(alvo * e, casas);
      if (k < 1) requestAnimationFrame(passo);
    })(performance.now());
  }
  var anima = document.querySelectorAll('.cascata, .estrelas.acende, [data-conta]');
  if (!calmo && 'IntersectionObserver' in window) {
    document.querySelectorAll('[data-conta]').forEach(function (el) { el.textContent = formata(0, parseInt(el.dataset.casas || '0', 10)); });
    var ioA = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target;
        if (el.dataset.conta) contar(el); else el.classList.add('in');
        if (el.classList.contains('cascata')) setTimeout(function () { el.classList.add('feito'); }, 90 * el.children.length + 800);
        ioA.unobserve(el);
      });
    }, { threshold: 0.2 });
    anima.forEach(function (el) { ioA.observe(el); });
  } else {
    anima.forEach(function (el) { el.classList.add('in', 'feito'); });
  }
  // A foto do topo desce mais devagar que a página (profundidade), só enquanto o topo aparece
  var fotoTopo = document.querySelector('.hero .foto');
  if (fotoTopo && !calmo) {
    var ultimoY = -1, pedido = false;
    var mover = function () {
      pedido = false;
      var y = Math.min(window.scrollY, 700);
      if (y === ultimoY) return;
      ultimoY = y;
      fotoTopo.style.translate = '0 ' + (y * 0.25).toFixed(1) + 'px';
    };
    addEventListener('scroll', function () { if (!pedido) { pedido = true; requestAnimationFrame(mover); } }, { passive: true });
  }
  document.addEventListener('visibilitychange', function () { document.body.classList.toggle('pausado', document.hidden); });

  /* Cardápio: destaca a categoria visível */
  var chips = document.querySelectorAll('.chips a');
  if (chips.length && 'IntersectionObserver' in window) {
    var mapa = {};
    chips.forEach(function (c) { mapa[c.getAttribute('href').slice(1)] = c; });
    var ioC = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        chips.forEach(function (c) { c.classList.remove('ativo'); c.removeAttribute('aria-current'); });
        var c = mapa[e.target.id];
        if (c) { c.classList.add('ativo'); c.setAttribute('aria-current', 'true'); }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    document.querySelectorAll('.categoria').forEach(function (s) { ioC.observe(s); });
  }

  /* Formulário de pedido */
  var form = document.getElementById('form-pedido');
  if (!form) return;
  var retorno = document.getElementById('f-retorno');
  var rotulo = document.querySelector('#f-enviar span');
  rotulo.textContent = WHATSAPP ? 'Enviar pelo WhatsApp' : 'Montar pedido';
  var hoje = new Date();
  hoje.setMinutes(hoje.getMinutes() - hoje.getTimezoneOffset());
  form.elements.data.min = hoje.toISOString().slice(0, 10);

  function limpar() {
    form.querySelectorAll('.erro').forEach(function (e) { e.remove(); });
    form.querySelectorAll('[aria-invalid]').forEach(function (e) { e.removeAttribute('aria-invalid'); e.removeAttribute('aria-errormessage'); });
  }
  function erro(campo, texto) {
    var s = document.createElement('span');
    s.className = 'erro'; s.id = campo.id + '-erro'; s.textContent = texto;
    campo.setAttribute('aria-invalid', 'true');
    campo.setAttribute('aria-errormessage', s.id);
    campo.parentNode.appendChild(s);
  }
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    limpar();
    var f = form.elements, falta = [];
    if (!f.nome.value.trim()) { erro(f.nome, 'Escreva seu nome.'); falta.push(f.nome); }
    if (!f.tipo.value) { erro(f.tipo, 'Escolha o tipo de encomenda.'); falta.push(f.tipo); }
    if (!f.data.value) { erro(f.data, 'Escolha o dia da retirada.'); falta.push(f.data); }
    if (falta.length) { falta[0].focus(); retorno.textContent = ''; return; }
    var d = f.data.value.split('-');
    var msg = 'Olá, Panificadora Cristal! Quero fazer uma encomenda.\n' +
      '• Nome: ' + f.nome.value.trim() +
      (f.tel.value.trim() ? '\n• Telefone: ' + f.tel.value.trim() : '') +
      '\n• Pedido: ' + f.tipo.value +
      '\n• Para: ' + d[2] + '/' + d[1] + '/' + d[0] +
      (f.detalhes.value.trim() ? '\n• Detalhes: ' + f.detalhes.value.trim() : '');
    if (WHATSAPP) {
      window.open('https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(msg), '_blank', 'noopener');
      retorno.textContent = 'Pedido aberto no WhatsApp da Cristal. Falta só tocar em enviar.';
      return;
    }
    var ler = 'Pedido montado. Ligue para (84) 3213-3695 e leia:\n' + msg;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(msg).then(function () {
        retorno.textContent = 'Pedido montado e copiado. Ligue para (84) 3213-3695 e leia o pedido, ou cole numa mensagem para a Cristal.';
      }, function () { retorno.textContent = ler; });
    } else {
      retorno.textContent = ler;
    }
  });
})();
