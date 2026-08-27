/* Fort Steel — рендер каталога */

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function priceHtml(m) {
  if (!m.price || m.price === '—') return '<span class="price">Цена по запросу</span>';
  return '<span class="price">от ' + esc(m.price) + ' <small>' + esc(m.unit) + '</small></span>';
}

/* ---------- сетка карточек моделей ---------- */
function modelCards(sectionId, models) {
  return models.map(function (m) {
    return '<a href="#' + sectionId + '-' + m.slug + '" class="series-card">' +
      '<div class="img-wrap">' +
        '<span class="fs-badge">Fort Steel</span>' +
        '<img src="' + m.hero + '" alt="' + esc(m.name) + '" loading="lazy">' +
      '</div>' +
      '<div class="body">' +
        '<h3>' + esc(m.name) + '</h3>' +
        '<p>' + esc(m.short) + '</p>' +
        '<div class="meta">' + priceHtml(m) +
          '<span class="width">' + (m.work_width && m.work_width !== '—' ? 'раб. ' + esc(m.work_width) : '') + '</span>' +
        '</div>' +
      '</div>' +
    '</a>';
  }).join('');
}

/* ---------- развёрнутый блок модели ---------- */
function modelBlock(sectionId, m, tag) {
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

  return '<div class="collection-block" id="' + sectionId + '-' + m.slug + '">' +
    '<div class="collection-head">' +
      '<div class="collection-hero-col">' +
        '<div class="collection-hero">' +
          '<span class="fs-badge">Fort Steel</span>' +
          '<img id="hero-' + sectionId + '-' + m.slug + '" src="' + m.hero + '" alt="' + esc(m.name) + '">' +
        '</div>' +
        '<a href="#contacts" class="btn">Узнать цену и наличие</a>' +
      '</div>' +
      '<div class="collection-head-text">' +
        '<span class="collection-tag">' + esc(tag) + '</span>' +
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
    '</div>' +
  '</div>';
}

function renderModels(sectionId, models, tag) {
  var grid = document.getElementById(sectionId + '-grid');
  var blocks = document.getElementById(sectionId + '-blocks');
  if (!grid || !blocks || !models || !models.length) return;
  grid.innerHTML = modelCards(sectionId, models);
  blocks.innerHTML = models.map(function (m) { return modelBlock(sectionId, m, tag); }).join('');
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

/* ---------- сайдинг для ограждений ---------- */
function renderFence(elId, slugs, all) {
  var el = document.getElementById(elId);
  if (!el) return;
  var byslug = {};
  all.forEach(function (m) { byslug[m.slug] = m; });
  el.innerHTML = slugs.map(function (s) {
    var m = byslug[s];
    if (!m) return '';
    return '<a href="#siding-' + m.slug + '" class="series-card">' +
      '<div class="img-wrap">' +
        '<span class="fs-badge">Fort Steel</span>' +
        '<img src="' + m.hero + '" alt="' + esc(m.name) + '" loading="lazy">' +
      '</div>' +
      '<div class="body"><h3>' + esc(m.name) + '</h3>' +
      '<p>Применяется и как фасадный сайдинг, и для заполнения секций забора.</p>' +
      '<div class="meta">' + priceHtml(m) + '</div></div></a>';
  }).join('');
}
