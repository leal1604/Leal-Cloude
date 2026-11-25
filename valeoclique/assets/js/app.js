/* Vale o Clique – vitrine de afiliado (sem bibliotecas) */
(function () {
  'use strict';

  var ICONS = {
    laptop: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5" width="16" height="11" rx="1.5"/><path d="M2 19h20" class="accent"/></svg>',
    headphones: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 15v-3a8 8 0 0116 0v3"/><rect x="3" y="14" width="4" height="6" rx="1.5" class="accent"/><rect x="17" y="14" width="4" height="6" rx="1.5" class="accent"/></svg>',
    home: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6" class="accent"/></svg>',
    washer: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="3" width="16" height="18" rx="2"/><circle cx="12" cy="13" r="4.5" class="accent"/><path d="M7 6.5h2"/></svg>',
    tools: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 6.5a4 4 0 00-5.3 5.3L3.5 17.5l3 3 5.7-5.7a4 4 0 005.3-5.3l-2.3 2.3-2.4-.6-.6-2.4z"/><path d="M15 15l5 5" class="accent"/></svg>',
    beauty: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 21h6V11H9z"/><path d="M10 11V6l4-3v8" class="accent"/></svg>',
    car: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 16v-3l2-5h14l2 5v3H3z"/><circle cx="7.5" cy="17" r="1.8" class="accent"/><circle cx="16.5" cy="17" r="1.8" class="accent"/></svg>',
    gamepad: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 8h12a4 4 0 014 4l-1 5a2.5 2.5 0 01-4.4 1L15 16H9l-1.6 2a2.5 2.5 0 01-4.4-1L2 12a4 4 0 014-4z"/><path d="M8 11v3M6.5 12.5h3" class="accent"/><circle cx="16" cy="12" r=".8" class="accent"/></svg>',
    all: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5" class="accent"/><rect x="4" y="13" width="7" height="7" rx="1.5" class="accent"/><rect x="13" y="13" width="7" height="7" rx="1.5"/></svg>'
  };
  var HEART = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7.5-4.6-9.5-9.3C1 8 3.4 4.5 7 4.5c2 0 3.5 1.1 5 2.9 1.5-1.8 3-2.9 5-2.9 3.6 0 6 3.5 4.5 7.2C19.5 16.4 12 21 12 21z"/></svg>';
  var WA = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20l1.3-3.8A8 8 0 1112 20a8 8 0 01-3.9-1z"/><path d="M9 9.5c0 2.5 2.5 5 5 5l1.2-1.2-1.8-.9-.8.8c-.9-.3-1.9-1.3-2.3-2.3l.8-.8-.9-1.8z" fill="currentColor" stroke="none"/></svg>';
  var ARROW = '<svg viewBox="0 0 24 24" aria-hidden="true" style="width:16px;height:16px"><path d="M9 6l6 6-6 6"/></svg>';

  var $ = function (s) { return document.querySelector(s); };
  var data, cats = [], products = [], catById = {};
  var state = { q: '', cats: [], min: 0, max: 0, priceTouched: false, noPrice: true, rating: 0, sort: 'rank', favOnly: false };
  var FAV_KEY = 'vc_favoritos';
  var favs = readFavs();
  var bounds = { min: 0, max: 0 };

  /* ---------- utilidades ---------- */
  function readFavs() { try { return JSON.parse(localStorage.getItem(FAV_KEY)) || []; } catch (e) { return []; } }
  function saveFavs() { try { localStorage.setItem(FAV_KEY, JSON.stringify(favs)); } catch (e) {} }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function norm(s) { return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
  var eur = new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' });
  var num = new Intl.NumberFormat('pt-PT');
  function ddmm(iso) { var p = String(iso || '').split('-'); return p.length === 3 ? p[2] + '/' + p[1] : ''; }
  function toast(msg) { var t = $('#toast'); t.textContent = msg; t.classList.add('is-on'); clearTimeout(toast._t); toast._t = setTimeout(function () { t.classList.remove('is-on'); }, 2200); }
  function track(name, params) { if (typeof window.gtag === 'function') window.gtag('event', name, params); }

  /* ---------- carregar dados ---------- */
  fetch('products.json', { cache: 'no-cache' })
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(init)
    .catch(function () {
      $('#resultsMeta').textContent = 'Não foi possível carregar os produtos. Se abriu o ficheiro diretamente no computador, use um servidor (veja o README).';
    });

  function init(json) {
    data = json;
    cats = json.categorias || [];
    cats.forEach(function (c) { catById[c.id] = c; });
    products = (json.produtos || []).filter(function (p) { return p && p.link && catById[p.categoria]; });

    var prices = products.map(function (p) { return p.preco; }).filter(function (v) { return typeof v === 'number'; });
    bounds.min = prices.length ? Math.floor(Math.min.apply(null, prices)) : 0;
    bounds.max = prices.length ? Math.ceil(Math.max.apply(null, prices)) : 0;
    state.min = bounds.min; state.max = bounds.max;

    document.querySelectorAll('.js-updated').forEach(function (el) { el.textContent = ddmm(json.atualizadoEm); });
    $('#year').textContent = new Date().getFullYear();

    buildCategoryUI();
    setupPrice();
    bindEvents();
    readHash();
    updateFavCount();
    render();
  }

  /* ---------- categorias (menu, botões, filtros, gaveta) ---------- */
  function countIn(id) { return products.filter(function (p) { return p.categoria === id; }).length; }

  function buildCategoryUI() {
    var nav = '<li><button data-cat="">Todas</button></li>';
    var btns = '<button class="cat-btn" data-cat="">' + ICONS.all + '<span>Todas</span></button>';
    var checks = '', drawer = '<li><button data-cat="">' + ICONS.all + 'Todas</button></li>';
    cats.forEach(function (c) {
      var ic = ICONS[c.icone] || ICONS.all;
      nav += '<li><button data-cat="' + esc(c.id) + '">' + esc(c.nome) + '</button></li>';
      btns += '<button class="cat-btn" data-cat="' + esc(c.id) + '">' + ic + '<span>' + esc(c.nome) + '</span></button>';
      checks += '<label class="check"><input type="checkbox" value="' + esc(c.id) + '"> ' + esc(c.nome) + ' <small>(' + countIn(c.id) + ')</small></label>';
      drawer += '<li><button data-cat="' + esc(c.id) + '">' + ic + esc(c.nome) + '</button></li>';
    });
    $('#catNav').innerHTML = nav;
    $('#catButtons').innerHTML = btns;
    $('#catChecks').innerHTML = checks;
    $('#drawerCats').innerHTML = drawer;
  }

  function selectSingleCat(id) {
    state.cats = id ? [id] : [];
    state.favOnly = false;
    syncChecks();
    render();
    closeDrawer();
    var target = $('#produtos');
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function syncChecks() {
    document.querySelectorAll('#catChecks input').forEach(function (i) { i.checked = state.cats.indexOf(i.value) > -1; });
    var single = state.cats.length === 1 ? state.cats[0] : (state.cats.length === 0 ? '' : null);
    document.querySelectorAll('[data-cat]').forEach(function (b) { b.classList.toggle('is-active', single !== null && b.getAttribute('data-cat') === single); });
    $('#favToggle').setAttribute('aria-pressed', String(state.favOnly));
  }

  /* ---------- preço ---------- */
  function setupPrice() {
    ['#priceMin', '#priceMax'].forEach(function (s) { var el = $(s); el.min = bounds.min; el.max = bounds.max; });
    $('#priceMin').value = state.min; $('#priceMax').value = state.max;
    paintRange();
  }
  function paintRange() {
    var span = (bounds.max - bounds.min) || 1;
    var a = (state.min - bounds.min) / span * 100, b = (state.max - bounds.min) / span * 100;
    $('#rangeFill').style.left = a + '%'; $('#rangeFill').style.right = (100 - b) + '%';
    $('#priceMinOut').textContent = eur.format(state.min);
    $('#priceMaxOut').textContent = eur.format(state.max);
  }

  /* ---------- eventos ---------- */
  function bindEvents() {
    document.addEventListener('click', function (e) {
      var c = e.target.closest('[data-cat]');
      if (c) { selectSingleCat(c.getAttribute('data-cat')); return; }

      var fav = e.target.closest('.card__fav');
      if (fav) { toggleFav(fav.getAttribute('data-id'), fav); return; }

      var sh = e.target.closest('.card__share');
      if (sh) { share(sh.getAttribute('data-id')); return; }

      var out = e.target.closest('a[data-out]');
      if (out) track('click_afiliado', { produto: out.getAttribute('data-out') });
    });

    var timer;
    $('#search').addEventListener('input', function (e) {
      $('#searchClear').hidden = !e.target.value;
      clearTimeout(timer);
      timer = setTimeout(function () { state.q = e.target.value.trim(); render(); }, 120);
    });
    $('#search').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); $('#produtos').scrollIntoView({ behavior: 'smooth' }); e.target.blur(); }
    });
    $('#searchClear').addEventListener('click', function () { $('#search').value = ''; this.hidden = true; state.q = ''; render(); $('#search').focus(); });

    $('#catChecks').addEventListener('change', function () {
      state.cats = Array.prototype.map.call(document.querySelectorAll('#catChecks input:checked'), function (i) { return i.value; });
      syncChecks(); render();
    });

    $('#priceMin').addEventListener('input', function (e) {
      state.min = Math.min(+e.target.value, state.max); e.target.value = state.min; state.priceTouched = true; paintRange(); render();
    });
    $('#priceMax').addEventListener('input', function (e) {
      state.max = Math.max(+e.target.value, state.min); e.target.value = state.max; state.priceTouched = true; paintRange(); render();
    });
    $('#includeNoPrice').addEventListener('change', function (e) { state.noPrice = e.target.checked; render(); });
    document.querySelectorAll('input[name="rating"]').forEach(function (r) {
      r.addEventListener('change', function () { state.rating = +r.value; render(); });
    });
    $('#sort').addEventListener('change', function (e) { state.sort = e.target.value; render(); });

    $('#resetFilters').addEventListener('click', resetAll);
    $('#emptyReset').addEventListener('click', resetAll);

    $('#favToggle').addEventListener('click', function () {
      state.favOnly = !state.favOnly;
      if (state.favOnly && !favs.length) toast('Ainda não tem favoritos. Toque no coração de um produto.');
      syncChecks(); render();
      $('#produtos').scrollIntoView({ behavior: 'smooth' });
    });

    // gaveta
    $('#menuBtn').addEventListener('click', openDrawer);
    $('#drawerClose').addEventListener('click', closeDrawer);
    $('#drawerBackdrop').addEventListener('click', closeDrawer);
    document.querySelectorAll('#drawer a').forEach(function (a) { a.addEventListener('click', function () { closeDrawer(); openDetails(a.getAttribute('href')); }); });
    document.querySelectorAll('.footer a[href^="#"]').forEach(function (a) { a.addEventListener('click', function () { openDetails(a.getAttribute('href')); }); });

    // filtros (telemóvel)
    $('#filterBtn').addEventListener('click', openFilters);
    $('#filtersClose').addEventListener('click', closeFilters);
    $('#filtersApply').addEventListener('click', function () { closeFilters(); $('#produtos').scrollIntoView({ behavior: 'smooth' }); });
    $('#filtersBackdrop').addEventListener('click', closeFilters);

    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { closeDrawer(); closeFilters(); } });

    // voltar ao topo
    var toTop = $('#toTop');
    window.addEventListener('scroll', function () { toTop.hidden = window.scrollY < 600; }, { passive: true });
    toTop.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });

    window.addEventListener('hashchange', readHash);
  }

  function openDetails(hash) { var d = hash && document.querySelector(hash); if (d && d.tagName === 'DETAILS') d.open = true; }
  function readHash() {
    var h = location.hash;
    if (/^#produto-/.test(h)) {
      var el = document.querySelector(h);
      if (el) setTimeout(function () { el.scrollIntoView({ block: 'center' }); el.classList.add('is-hl'); }, 50);
    } else openDetails(h);
  }

  function lock(on) { document.body.style.overflow = on ? 'hidden' : ''; }
  function openDrawer() { $('#drawer').classList.add('is-open'); $('#drawer').setAttribute('aria-hidden', 'false'); $('#drawerBackdrop').hidden = false; $('#menuBtn').setAttribute('aria-expanded', 'true'); lock(true); }
  function closeDrawer() { $('#drawer').classList.remove('is-open'); $('#drawer').setAttribute('aria-hidden', 'true'); $('#drawerBackdrop').hidden = true; $('#menuBtn').setAttribute('aria-expanded', 'false'); lock(false); }
  function openFilters() { $('#filters').classList.add('is-open'); $('#filtersBackdrop').hidden = false; $('#filterBtn').setAttribute('aria-expanded', 'true'); lock(true); }
  function closeFilters() { $('#filters').classList.remove('is-open'); $('#filtersBackdrop').hidden = true; $('#filterBtn').setAttribute('aria-expanded', 'false'); lock(false); }

  function resetAll() {
    state.q = ''; state.cats = []; state.min = bounds.min; state.max = bounds.max; state.priceTouched = false;
    state.noPrice = true; state.rating = 0; state.favOnly = false;
    $('#search').value = ''; $('#searchClear').hidden = true;
    $('#includeNoPrice').checked = true;
    document.querySelector('input[name="rating"][value="0"]').checked = true;
    setupPrice(); syncChecks(); render();
  }

  /* ---------- favoritos e partilha ---------- */
  function toggleFav(id, btn) {
    var i = favs.indexOf(id);
    if (i > -1) { favs.splice(i, 1); toast('Removido dos favoritos'); }
    else { favs.push(id); toast('Guardado nos favoritos ♥'); track('favorito', { produto: id }); }
    saveFavs(); updateFavCount();
    if (btn) { btn.setAttribute('aria-pressed', String(i === -1)); btn.setAttribute('aria-label', i === -1 ? 'Remover dos favoritos' : 'Guardar nos favoritos'); }
    if (state.favOnly) render();
  }
  function updateFavCount() { $('#favCount').textContent = favs.length; }

  function share(id) {
    var p = products.find(function (x) { return x.id === id; });
    if (!p) return;
    var page = location.href.split('#')[0] + '#produto-' + p.id;
    var text = p.nome + ' – #' + p.ranking + ' mais vendido em ' + catById[p.categoria].nome + ' na Amazon.\nVeja aqui: ' + page;
    track('partilha_whatsapp', { produto: id });
    window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank', 'noopener');
  }

  /* ---------- filtro + render ---------- */
  function matches(p) {
    if (state.favOnly && favs.indexOf(p.id) === -1) return false;
    if (state.cats.length && state.cats.indexOf(p.categoria) === -1) return false;
    if (state.q) {
      var hay = norm(p.nome + ' ' + catById[p.categoria].nome);
      var words = norm(state.q).split(/\s+/).filter(Boolean);
      for (var i = 0; i < words.length; i++) if (hay.indexOf(words[i]) === -1) return false;
    }
    if (typeof p.preco === 'number') { if (p.preco < state.min || p.preco > state.max) return false; }
    else if (!state.noPrice) return false;
    if (state.rating && !(p.avaliacao >= state.rating)) return false;
    return true;
  }

  function sorter(a, b) {
    var pa = typeof a.preco === 'number' ? a.preco : null, pb = typeof b.preco === 'number' ? b.preco : null;
    switch (state.sort) {
      case 'price-asc': return (pa === null) - (pb === null) || pa - pb;
      case 'price-desc': return (pa === null) - (pb === null) || pb - pa;
      case 'reviews': return (b.numAvaliacoes || 0) - (a.numAvaliacoes || 0);
      default: return a.ranking - b.ranking;
    }
  }

  function stars(p) {
    if (typeof p.avaliacao !== 'number') return '';
    var pct = Math.max(0, Math.min(100, p.avaliacao / 5 * 100));
    return '<div class="stars" title="Avaliação na Amazon à data da consulta"><span class="stars__bar" aria-hidden="true">★★★★★<span style="width:' + pct + '%">★★★★★</span></span>' +
      '<span>' + p.avaliacao.toLocaleString('pt-PT') + (p.numAvaliacoes ? ' (' + num.format(p.numAvaliacoes) + ')' : '') + '</span>' +
      '<span class="sr-only">' + p.avaliacao + ' de 5 estrelas, ' + (p.numAvaliacoes || 0) + ' avaliações na Amazon</span></div>';
  }

  function card(p) {
    var c = catById[p.categoria];
    var isFav = favs.indexOf(p.id) > -1;
    var rel = 'sponsored nofollow noopener';
    var showPrice = data.mostrarPrecos !== false;
    var priceHtml = '';
    if (showPrice && typeof p.preco === 'number') {
      priceHtml = '<p class="price">' + eur.format(p.preco) + '</p>';
    } else if (showPrice) {
      priceHtml = '<p class="price price--none">Preço indisponível na consulta</p>';
    }
    return '<article class="card" id="produto-' + esc(p.id) + '">' +
      '<span class="card__rank">#' + p.ranking + ' <small>em ' + esc(c.nome) + '</small></span>' +
      '<button class="card__fav" data-id="' + esc(p.id) + '" aria-pressed="' + isFav + '" aria-label="' + (isFav ? 'Remover dos favoritos' : 'Guardar nos favoritos') + '">' + HEART + '</button>' +
      '<button class="card__share" data-id="' + esc(p.id) + '" aria-label="Partilhar no WhatsApp">' + WA + '</button>' +
      '<a class="card__img" href="' + esc(p.link) + '" target="_blank" rel="' + rel + '" data-out="' + esc(p.id) + '" tabindex="-1">' +
        '<img src="' + esc(p.imagem) + '" alt="' + esc(p.nome) + '" loading="lazy" decoding="async" width="400" height="400" referrerpolicy="no-referrer"></a>' +
      '<div class="card__body">' +
        '<h4 class="card__title"><a href="' + esc(p.link) + '" target="_blank" rel="' + rel + '" data-out="' + esc(p.id) + '">' + esc(p.nome) + '</a></h4>' +
        stars(p) + priceHtml +
        '<a class="btn btn--primary" href="' + esc(p.link) + '" target="_blank" rel="' + rel + '" data-out="' + esc(p.id) + '">Ver preço atual na Amazon ' + ARROW + '</a>' +
      '</div></article>';
  }

  function render() {
    var list = products.filter(matches).sort(sorter);
    var out = '';
    var grouped = state.sort === 'rank' && !state.q && !state.favOnly;

    if (grouped) {
      cats.forEach(function (c) {
        var items = list.filter(function (p) { return p.categoria === c.id; });
        if (!items.length) return;
        out += '<section class="cat-section" aria-labelledby="h-' + c.id + '"><div class="cat-section__head"><h3 id="h-' + c.id + '">Mais vendidos em ' + esc(c.nome) + '</h3>' +
          '<a href="' + esc(data.fonteUrl || 'https://www.amazon.es/gp/bestsellers/') + '" target="_blank" rel="nofollow noopener">Fonte: Amazon.es</a></div>' +
          '<div class="grid">' + items.map(card).join('') + '</div></section>';
      });
    } else if (list.length) {
      out = '<div class="grid">' + list.map(card).join('') + '</div>';
    }
    $('#sections').innerHTML = out;
    $('#empty').hidden = list.length > 0;

    var title = state.favOnly ? 'Os seus favoritos'
      : state.q ? 'Resultados para “' + state.q + '”'
      : state.cats.length === 1 ? 'Mais vendidos em ' + catById[state.cats[0]].nome
      : 'Mais vendidos na Amazon';
    $('#resultsTitle').textContent = title;
    $('#resultsMeta').hidden = true;

    var n = (state.cats.length ? 1 : 0) + (state.priceTouched && (state.min > bounds.min || state.max < bounds.max) ? 1 : 0) + (state.rating ? 1 : 0) + (!state.noPrice ? 1 : 0);
    $('#filterCount').hidden = !n; $('#filterCount').textContent = n;
  }
})();
