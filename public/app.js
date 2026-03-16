/* =============================================================
   TÜRKIYE HARITAM - app.js
   D3.js + GeoJSON category-based interactive map
   ============================================================= */
(function () {
  'use strict';

  /* ---- Category definitions ---- */
  const CATEGORIES = [
    { id: 'tatil',     label: 'Tatil',   color: '#e74c3c', emoji: '🏖️' },
    { id: 'yolda',     label: 'Yolda',   color: '#3498db', emoji: '🚗' },
    { id: 'gezilen',   label: 'Gezilen', color: '#27ae60', emoji: '🧭' },
    { id: 'yasanilan', label: 'Yaşanılan', color: '#f39c12', emoji: '🏠' },
  ];

  const CAT_MAP   = Object.fromEntries(CATEGORIES.map(c => [c.id, c]));
  const CAT_IDS   = CATEGORIES.map(c => c.id);
  const TOTAL_CITIES = 81;
  const DEFAULT_COLOR   = '#b0bec5';
  const DEFAULT_COLOR_DARK = '#455a64';
  const HOVER_LIGHTEN = 0.2;

  /* ---- State ---- */
  let cityData  = {};  // { cityName: catId }
  let activeCat = 'tatil';
  let isDark    = localStorage.getItem('map-theme') === 'dark';

  /* ---- Apply initial theme ---- */
  applyTheme(isDark);

  /* ---- Category button selection ---- */
  document.querySelectorAll('.cat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      activeCat = btn.dataset.cat;
      document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  /* ---- Theme toggle ---- */
  document.getElementById('themeToggle').addEventListener('click', () => {
    isDark = !isDark;
    localStorage.setItem('map-theme', isDark ? 'dark' : 'light');
    applyTheme(isDark);
    redrawColors();
  });

  function applyTheme(dark) {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    document.getElementById('themeToggle').textContent = dark ? '☀️' : '🌙';
  }

  /* ---- Reset ---- */
  document.getElementById('resetBtn').addEventListener('click', () => {
    if (!confirm('Tüm seçimler sıfırlanacak. Emin misin?')) return;
    cityData = {};
    redrawColors();
    updateCounts();
    updateCitiesList();
  });

  /* ---- Download Helpers ---- */
  function exportCanvas() {
    const container = document.getElementById('map_container');
    const bkg = isDark ? '#0f172a' : '#e0f2fe';
    container.classList.add('is-exporting');
    return html2canvas(container, { backgroundColor: bkg, scale: 2 })
      .finally(() => {
        container.classList.remove('is-exporting');
      });
  }

  function downloadFile(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  }

  document.getElementById('downloadPngBtn').addEventListener('click', () => {
    exportCanvas().then(canvas => {
      canvas.toBlob(blob => {
        downloadFile(blob, 'turkiye-haritam.png');
      }, 'image/png');
    });
  });

  document.getElementById('downloadJpgBtn').addEventListener('click', () => {
    exportCanvas().then(canvas => {
      canvas.toBlob(blob => {
        downloadFile(blob, 'turkiye-haritam.jpg');
      }, 'image/jpeg', 0.9);
    });
  });

  document.getElementById('downloadPdfBtn').addEventListener('click', () => {
    exportCanvas().then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const { jsPDF } = window.jspdf;
      
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });
      
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      const blob = pdf.output('blob');
      downloadFile(blob, 'turkiye-haritam.pdf');
    });
  });

  /* ============================================================
     D3 MAP
  ============================================================ */
  const tooltip = document.getElementById('tooltip');

  d3.json('tr-cities.json').then(function (geoData) {

    const container    = document.getElementById('map_container');
    const W            = container.clientWidth  || window.innerWidth;
    const H            = Math.round(W * 0.52);  // aspect ratio ~Turkey

    const projection = d3.geoEqualEarth();
    projection.fitSize([W, H], geoData);

    const pathGen = d3.geoPath().projection(projection);

    const svg = d3.select('#map_container')
      .append('svg')
      .attr('viewBox', `0 0 ${W} ${H}`)
      .attr('preserveAspectRatio', 'xMidYMid meet')
      .style('width', '100%')
      .style('height', 'auto')
      .style('display', 'block');

    /* ---- Province paths ---- */
    svg.append('g')
      .attr('class', 'provinces')
      .selectAll('path')
      .data(geoData.features)
      .join('path')
        .attr('d', pathGen)
        .attr('fill',   d => getFill(d.properties.name))
        .attr('stroke', d => getStroke())
        .attr('stroke-width', 0.8)
        .attr('class', 'province-path')
        .style('cursor', 'pointer')
        .style('transition', 'filter 0.15s')
        .on('mouseover', function (event, d) {
          d3.select(this).style('filter', 'brightness(1.22)');
          const cat = cityData[d.properties.name];
          const catInfo = cat ? `${CAT_MAP[cat].emoji} ${CAT_MAP[cat].label}` : '(işaretlenmemiş)';
          tooltip.textContent = `${d.properties.name} — ${catInfo}`;
          tooltip.classList.add('show');
        })
        .on('mousemove', function (event) {
          tooltip.style.left = event.clientX + 'px';
          tooltip.style.top  = (event.clientY - 10) + 'px';
        })
        .on('mouseleave', function () {
          d3.select(this).style('filter', 'none');
          tooltip.classList.remove('show');
        })
        .on('click', function (event, d) {
          const name = d.properties.name;
          const cur  = cityData[name];
          if (!cur) {
            cityData[name] = activeCat;
          } else {
            const idx = CAT_IDS.indexOf(cur);
            if (idx < CAT_IDS.length - 1) {
              cityData[name] = CAT_IDS[idx + 1];
            } else {
              delete cityData[name];
            }
          }
          d3.select(this).attr('fill', getFill(name));
          updateCounts();
          updateCitiesList();
          updateLabelColor(svg, name);
        })
        .on('contextmenu', function (event, d) {
          event.preventDefault();
          const name = d.properties.name;
          delete cityData[name];
          d3.select(this).attr('fill', getFill(name));
          updateCounts();
          updateCitiesList();
          updateLabelColor(svg, name);
        });

    /* ---- City name labels ---- */
    svg.append('g')
      .attr('class', 'labels')
      .selectAll('text')
      .data(geoData.features)
      .join('text')
        .attr('x', d => pathGen.centroid(d)[0])
        .attr('y', d => pathGen.centroid(d)[1])
        .text(d => d.properties.name)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'central')
        .attr('class', 'city-label')
        .attr('data-city', d => d.properties.name)
        .style('font-size', getLabelFontSize(W) + 'px')
        .style('fill', d => getLabelFill(d.properties.name))
        .style('pointer-events', 'none')
        .style('font-family', 'Inter, sans-serif')
        .style('font-weight', '600')
        .style('text-shadow', `0 1px 2px rgba(0,0,0,0.45)`);

    /* ---- Init state ---- */
    updateCounts();
    updateCitiesList();

    /* ---- Responsive resize ---- */
    window.addEventListener('resize', () => {
      // SVG scales via viewBox + 100% width, no redraw needed
    });
  });

  /* ============================================================
     HELPERS
  ============================================================ */
  function getFill(cityName) {
    const cat = cityData[cityName];
    if (!cat) return isDark ? DEFAULT_COLOR_DARK : DEFAULT_COLOR;
    return CAT_MAP[cat].color;
  }

  function getStroke() {
    return isDark ? '#1e293b' : '#ffffff';
  }

  function getLabelFill(cityName) {
    const cat = cityData[cityName];
    if (!cat) return isDark ? '#e2e8f0' : '#1e293b';
    return '#fff';
  }

  function getLabelFontSize(W) {
    if (W > 1400) return 8.5;
    if (W > 900)  return 7.5;
    if (W > 600)  return 6.5;
    return 5.5;
  }

  function redrawColors() {
    d3.selectAll('.province-path')
      .attr('fill',   d => getFill(d.properties.name))
      .attr('stroke', () => getStroke());
    d3.selectAll('.city-label')
      .style('fill', d => getLabelFill(d.properties.name));
  }

  function updateLabelColor(svg, cityName) {
    svg.select(`.labels text[data-city="${CSS.escape(cityName)}"]`)
      .style('fill', getLabelFill(cityName));
  }

  function updateCounts() {
    const counts = { tatil: 0, yolda: 0, gezilen: 0, yasanilan: 0 };
    Object.values(cityData).forEach(cat => { if (counts[cat] !== undefined) counts[cat]++; });
    const totalSelected = Object.keys(cityData).length;
    document.getElementById('count-total').textContent = `${totalSelected}/${TOTAL_CITIES}`;
    document.getElementById('export-count-total').textContent = `${totalSelected}/${TOTAL_CITIES}`;
    CATEGORIES.forEach(c => {
      const countText = `${counts[c.id]}/${TOTAL_CITIES}`;
      document.getElementById('count-' + c.id).textContent = countText;
      document.getElementById('export-count-' + c.id).textContent = countText;
    });
  }

  function updateCitiesList() {
    const grid    = document.getElementById('citiesGrid');
    const section = document.getElementById('citiesSection');
    grid.innerHTML = '';
    const entries = Object.entries(cityData);
    if (entries.length === 0) { section.style.display = 'none'; return; }
    section.style.display = '';

    // Group by category
    CATEGORIES.forEach(cat => {
      const cities = entries.filter(([, c]) => c === cat.id).map(([n]) => n).sort((a, b) => a.localeCompare(b, 'tr'));
      if (cities.length === 0) return;
      const group = document.createElement('div');
      group.className = 'city-group';
      group.innerHTML = `<div class="city-group-header" style="color:${cat.color}">${cat.emoji} ${cat.label} (${cities.length}/${TOTAL_CITIES})</div>`;
      cities.forEach(name => {
        const tag = document.createElement('span');
        tag.className = 'city-tag';
        tag.style.background = cat.color;
        tag.innerHTML = `${name} <span class="remove-tag" data-name="${name}">✕</span>`;
        tag.querySelector('.remove-tag').addEventListener('click', (e) => {
          e.stopPropagation();
          delete cityData[name];
          d3.selectAll('.province-path')
            .filter(d => d.properties.name === name)
            .attr('fill', getFill(name));
          updateCounts();
          updateCitiesList();
        });
        group.appendChild(tag);
      });
      grid.appendChild(group);
    });
  }

})();
