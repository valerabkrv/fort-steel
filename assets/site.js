/* Fort Steel — рендер каталога */

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function priceHtml(m) {
  if (!m.price || m.price === '—') return '<span class="price">Цена по запросу</span>';
  return '<span class="price">от ' + esc(m.price) + ' <small>' + esc(m.unit) + '</small></span>';
}

/* Цены из блока T123 (FS_PRICES) перекрывают цены из data.js.
   Ключ — точное название модели; неизвестные ключи не молчат, а пишут
   предупреждение в консоль, иначе опечатку в названии не заметить. */
function applyPrices(map, unit, lists) {
  if (!map) return;
  var known = {};
  lists.forEach(function (list) {
    (list || []).forEach(function (m) {
      known[m.name] = true;
      if (Object.prototype.hasOwnProperty.call(map, m.name)) {
        m.price = String(map[m.name]).trim();
        if (unit) m.unit = unit;
      }
    });
  });
  Object.keys(map).forEach(function (k) {
    if (!known[k]) console.warn('FS_PRICES: модель «' + k + '» не найдена — проверьте название');
  });
}

/* Реестр моделей: ключ «раздел-slug» -> модель. Нужен для карточек и окна. */
var MODEL_INDEX = {};

function registerModels(sectionId, models, tag) {
  models.forEach(function (m) {
    MODEL_INDEX[sectionId + '-' + m.slug] = { m: m, tag: tag };
  });
}

/* ---------- плитка модели ---------- */
function modelTile(key, m, note) {
  return '<a href="#' + key + '" class="model-tile" data-key="' + key + '">' +
    '<span class="model-tile-media">' +
      '<span class="fs-badge">Fort Steel</span>' +
      '<img src="' + m.hero + '" alt="' + esc(m.name) + '" loading="lazy">' +
      '<span class="model-tile-hint">Подробнее</span>' +
    '</span>' +
    '<span class="model-tile-body">' +
      '<span class="model-tile-name">' + esc(m.name) + '</span>' +
      '<span class="model-tile-short">' + esc(note || m.short) + '</span>' +
      '<span class="model-tile-meta">' + priceHtml(m) +
        '<span class="width">' + (m.work_width && m.work_width !== '—' ? 'раб. ' + esc(m.work_width) : '') + '</span>' +
      '</span>' +
    '</span>' +
  '</a>';
}

function renderModels(sectionId, models, tag) {
  var grid = document.getElementById(sectionId + '-grid');
  if (!grid || !models || !models.length) return;
  registerModels(sectionId, models, tag);
  grid.innerHTML = models.map(function (m) {
    return modelTile(sectionId + '-' + m.slug, m);
  }).join('');
}

/* ---------- сайдинг для ограждений ---------- */
function renderFence(elId, slugs, all) {
  var el = document.getElementById(elId);
  if (!el) return;
  var byslug = {};
  all.forEach(function (m) { byslug[m.slug] = m; });
  el.innerHTML = slugs.map(function (s) {
    var m = byslug[s];
    if (!m) return '';
    return modelTile('siding-' + m.slug, m, 'Применяется и как фасадный сайдинг, и для заполнения секций забора.');
  }).join('');
}

/* ---------- содержимое окна модели ---------- */
function modelDetailHtml(key) {
  var rec = MODEL_INDEX[key];
  if (!rec) return '';
  var m = rec.m;

  var props = [
    ['Рабочая ширина', m.work_width],
    ['Ширина фактическая', m.full_width],
    ['Толщина профиля', m.thickness],
    ['Длина', m.length],
    ['Тип установки', m.install],
    ['Имитация', m.imitation]
  ].filter(function (p) { return p[1] && p[1] !== '—'; });

  var propsHtml = props.map(function (p) {
    return '<div><span class="k">' + p[0] + '</span><span class="v">' + esc(p[1]) + '</span></div>';
  }).join('');

  var shots = [m.hero].concat(m.gallery || []).filter(function (src, i, arr) {
    return src && arr.indexOf(src) === i;
  }).slice(0, 10);

  var thumbs = shots.length < 2 ? '' : '<div class="model-thumbs">' + shots.map(function (src, i) {
    return '<button type="button" class="model-thumb' + (i === 0 ? ' is-active' : '') + '" data-img="' + src + '">' +
      '<img src="' + src + '" alt="' + esc(m.name) + ' — фото ' + (i + 1) + '" loading="lazy"></button>';
  }).join('') + '</div>';

  return '<div class="collection-head">' +
      '<div class="collection-hero-col">' +
        '<div class="collection-hero">' +
          '<span class="fs-badge">Fort Steel</span>' +
          '<img class="model-modal-photo" src="' + shots[0] + '" alt="' + esc(m.name) + '">' +
        '</div>' +
        thumbs +
        '<a href="#contacts" class="btn">Купить</a>' +
      '</div>' +
      '<div class="collection-head-text">' +
        '<span class="collection-tag">' + esc(rec.tag) + '</span>' +
        '<div class="collection-title-row">' +
          '<h3 class="section-title collection-title" style="font-size:22px">' + esc(m.name) + '</h3>' +
          (m.price && m.price !== '—'
            ? '<div class="collection-price">Цена от <span>' + esc(m.price) + '</span> ' + esc(m.unit) + '</div>'
            : '') +
        '</div>' +
        '<p class="section-sub">' + esc(m.description) + '</p>' +
        '<div class="model-props">' + propsHtml + '</div>' +
        '<p class="model-note">' + esc(m.extra) + '</p>' +
      '</div>' +
    '</div>';
}

/* ---------- окно модели ---------- */
var MODAL = null;          // корневой элемент окна
var MODAL_PUSHED = false;  // добавляли ли мы запись в историю
var MODAL_SCROLL = null;   // сохранённые inline-стили overflow

function modalRoot() {
  if (MODAL) return MODAL;
  var host = document.querySelector('.fs') || document.body;
  MODAL = document.createElement('div');
  MODAL.className = 'model-modal';
  MODAL.setAttribute('role', 'dialog');
  MODAL.setAttribute('aria-modal', 'true');
  MODAL.innerHTML =
    '<div class="model-modal-backdrop" data-close="1"></div>' +
    '<div class="model-modal-dialog">' +
      '<button type="button" class="model-modal-close" data-close="1" aria-label="Закрыть">&times;</button>' +
      '<div class="model-modal-body"></div>' +
    '</div>';
  host.appendChild(MODAL);

  MODAL.addEventListener('click', function (e) {
    var t = e.target;
    if (t.getAttribute && t.getAttribute('data-close')) { e.preventDefault(); closeModel(); return; }

    var thumb = t.closest ? t.closest('.model-thumb') : null;
    if (thumb) {
      var photo = MODAL.querySelector('.model-modal-photo');
      if (photo) photo.src = thumb.getAttribute('data-img');
      Array.prototype.forEach.call(MODAL.querySelectorAll('.model-thumb'), function (x) {
        x.classList.remove('is-active');
      });
      thumb.classList.add('is-active');
      return;
    }

    var cta = t.closest ? t.closest('a[href="#contacts"]') : null;
    if (cta) {
      e.preventDefault();
      /* историю правим сами: history.back() восстановил бы прокрутку
         и отменил переход к контактам */
      MODAL_PUSHED = false;
      try { history.replaceState(null, '', location.pathname + location.search); } catch (err) {}
      closeModel(true);
      var c = document.getElementById('contacts');
      if (c) c.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });

  return MODAL;
}

function openModel(key, push) {
  if (!MODEL_INDEX[key]) return;
  var el = modalRoot();
  el.querySelector('.model-modal-body').innerHTML = modelDetailHtml(key);
  el.classList.add('is-open');
  el.scrollTop = 0;

  if (MODAL_SCROLL === null) {
    MODAL_SCROLL = [document.documentElement.style.overflow, document.body.style.overflow];
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
  }
  if (push) {
    try { history.pushState({ fsModel: key }, '', '#' + key); MODAL_PUSHED = true; } catch (err) {}
  }
  var close = el.querySelector('.model-modal-close');
  if (close) close.focus();
}

function closeModel(fromHistory) {
  if (!MODAL || !MODAL.classList.contains('is-open')) return;
  MODAL.classList.remove('is-open');
  MODAL.querySelector('.model-modal-body').innerHTML = '';
  if (MODAL_SCROLL) {
    document.documentElement.style.overflow = MODAL_SCROLL[0];
    document.body.style.overflow = MODAL_SCROLL[1];
    MODAL_SCROLL = null;
  }
  if (!fromHistory) {
    if (MODAL_PUSHED) { MODAL_PUSHED = false; history.back(); }
    else {
      try { history.replaceState(null, '', location.pathname + location.search); } catch (err) {}
    }
  }
}

function initModelModal() {
  document.addEventListener('click', function (e) {
    var tile = e.target.closest ? e.target.closest('.model-tile') : null;
    if (!tile) return;
    var key = tile.getAttribute('data-key');
    if (!MODEL_INDEX[key]) return;
    e.preventDefault();
    openModel(key, true);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' || e.keyCode === 27) closeModel();
  });

  window.addEventListener('popstate', function () {
    var key = (location.hash || '').replace(/^#/, '');
    MODAL_PUSHED = false;
    if (MODEL_INDEX[key]) openModel(key, false);
    else closeModel(true);
  });

  var start = (location.hash || '').replace(/^#/, '');
  if (MODEL_INDEX[start]) openModel(start, false);
}

/* ---------- покрытия ---------- */
function renderCoatings(elId, coatings) {
  var el = document.getElementById(elId);
  if (!el) return;
  el.innerHTML = coatings.map(function (c) {
    var swatches = c.colors.map(function (col, i) {
      return '<button type="button" class="swatch' + (i === 0 ? ' is-active' : '') + '" data-img="' + col.img + '" data-name="' + esc(col.name) + '">' +
        '<img src="' + col.img + '" alt="' + esc(c.name) + ' — ' + esc(col.name) + '" loading="lazy">' +
        '<span>' + esc(col.name) + '</span>' +
      '</button>';
    }).join('');
    return '<div class="collection-block" id="coating-' + c.slug + '">' +
      '<div class="collection-head">' +
        '<div class="collection-hero-col">' +
          '<div class="coating-preview">' +
            '<img id="cprev-' + c.slug + '" src="' + c.colors[0].img + '" alt="' + esc(c.name) + '">' +
          '</div>' +
          '<div class="coating-current" id="cname-' + c.slug + '">' + esc(c.colors[0].name) + '</div>' +
        '</div>' +
        '<div class="collection-head-text">' +
          '<span class="collection-tag">' + esc(c.tag) + '</span>' +
          '<div class="collection-title-row">' +
            '<h3 class="section-title" style="font-size:22px">' + esc(c.name) +
              '<span class="count-badge">' + c.colors.length + ' цв.</span></h3>' +
          '</div>' +
          '<p class="section-sub" style="margin-bottom:0">' + esc(c.description) + '</p>' +
        '</div>' +
      '</div>' +
      '<h4 class="collection-subheading">Палитра ' + esc(c.name) + '</h4>' +
      '<div class="swatch-grid">' + swatches + '</div>' +
    '</div>';
  }).join('');

  coatings.forEach(function (c) {
    var block = document.getElementById('coating-' + c.slug);
    var prev = document.getElementById('cprev-' + c.slug);
    var label = document.getElementById('cname-' + c.slug);
    if (!block || !prev) return;
    var sw = block.querySelectorAll('.swatch');
    Array.prototype.forEach.call(sw, function (b) {
      b.addEventListener('click', function () {
        Array.prototype.forEach.call(sw, function (x) { x.classList.remove('is-active'); });
        b.classList.add('is-active');
        prev.src = b.getAttribute('data-img');
        if (label) label.textContent = b.getAttribute('data-name');
      });
    });
  });
}
