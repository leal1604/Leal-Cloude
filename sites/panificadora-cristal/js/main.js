(function () {
  // Menu no celular
  var botao = document.querySelector('.menu-botao');
  var menu = document.getElementById('menu');
  if (botao && menu) {
    botao.addEventListener('click', function () {
      var aberto = menu.classList.toggle('aberto');
      botao.setAttribute('aria-expanded', String(aberto));
      botao.setAttribute('aria-label', aberto ? 'Fechar menu' : 'Abrir menu');
    });
    menu.addEventListener('click', function (e) {
      if (e.target.closest('a')) {
        menu.classList.remove('aberto');
        botao.setAttribute('aria-expanded', 'false');
        botao.setAttribute('aria-label', 'Abrir menu');
      }
    });
  }

  // Abas do cardápio (setas do teclado navegam entre categorias)
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

  // Revelar ao rolar
  var itens = document.querySelectorAll('.revelar');
  if ('IntersectionObserver' in window) {
    var obs = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('visivel'); obs.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    itens.forEach(function (el) { obs.observe(el); });
  } else {
    itens.forEach(function (el) { el.classList.add('visivel'); });
  }

  // Encomendas: monta a mensagem do pedido.
  // Quando a Cristal confirmar o WhatsApp comercial, preencha data-whatsapp no <form>
  // (ex.: data-whatsapp="5584999999999") e o botão passa a abrir a conversa direto.
  var form = document.getElementById('form-encomenda');
  if (!form) return;
  var retorno = document.getElementById('f-retorno');
  var enviar = document.getElementById('f-enviar');
  var numero = (form.getAttribute('data-whatsapp') || '').replace(/\D/g, '');
  enviar.textContent = numero ? 'Enviar pelo WhatsApp' : 'Montar e copiar pedido';

  var hoje = new Date();
  hoje.setMinutes(hoje.getMinutes() - hoje.getTimezoneOffset());
  form.elements.data.min = hoje.toISOString().slice(0, 10);

  function limparErros() {
    form.querySelectorAll('.erro').forEach(function (e) { e.remove(); });
    form.querySelectorAll('[aria-invalid]').forEach(function (e) { e.removeAttribute('aria-invalid'); });
  }
  function erro(campo, texto) {
    campo.setAttribute('aria-invalid', 'true');
    var s = document.createElement('span');
    s.className = 'erro';
    s.id = campo.id + '-erro';
    s.textContent = texto;
    campo.setAttribute('aria-describedby', s.id);
    campo.parentNode.appendChild(s);
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    limparErros();
    var f = form.elements;
    var faltando = [];
    if (!f.nome.value.trim()) { erro(f.nome, 'Informe seu nome para a Cristal saber quem pediu.'); faltando.push(f.nome); }
    if (!f.tipo.value) { erro(f.tipo, 'Escolha o tipo de encomenda.'); faltando.push(f.tipo); }
    if (!f.data.value) { erro(f.data, 'Escolha a data de retirada ou entrega.'); faltando.push(f.data); }
    if (faltando.length) { faltando[0].focus(); retorno.textContent = ''; return; }

    var d = f.data.value.split('-');
    var msg = 'Olá, Panificadora Cristal! Gostaria de fazer uma encomenda.\n' +
      '• Nome: ' + f.nome.value.trim() + '\n' +
      '• Pedido: ' + f.tipo.value + '\n' +
      '• Para: ' + d[2] + '/' + d[1] + '/' + d[0] +
      (f.detalhes.value.trim() ? '\n• Detalhes: ' + f.detalhes.value.trim() : '');

    if (numero) {
      window.open('https://wa.me/' + numero + '?text=' + encodeURIComponent(msg), '_blank', 'noopener');
      retorno.textContent = 'Pedido aberto no WhatsApp. É só enviar a mensagem.';
      return;
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(msg).then(function () {
        retorno.textContent = 'Pedido copiado. Cole na conversa com a Cristal ou leia ao telefone: (84) 3213-3695.';
      }, function () {
        retorno.textContent = msg;
      });
    } else {
      retorno.textContent = msg;
    }
  });
})();
