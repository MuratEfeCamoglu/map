(function () {
  'use strict';

  let CATEGORIES = [
    { id: 'flort', label: 'Flört', color: '#e84393', emoji: '', isDefault: true },
    { id: 'sevgili', label: 'Sevgili', color: '#0984e3', emoji: '', isDefault: true },
    { id: 'hoslanma', label: 'Hoşlanma', color: '#00b894', emoji: '', isDefault: true },
    { id: 'iyidir', label: 'Kızları/Oğlanları İyidir', color: '#f39c12', emoji: '', isDefault: true },
  ];

  let CAT_MAP = Object.fromEntries(CATEGORIES.map((cat) => [cat.id, cat]));
  let CAT_IDS = CATEGORIES.map((cat) => cat.id);
  const TOTAL_CITIES = 81;
  const MOBILE_LABELS = {
    Afyonkarahisar: 'Afyon',
    Balikesir: 'Balikesir',
    Canakkale: 'Canakkale',
    Eskisehir: 'Eskisehir',
    Kahramanmaras: 'K.Maras',
    Kirklareli: 'Kirklareli',
    Kirsehir: 'Kirsehir',
    Nevsehir: 'Nevsehir',
    Sanliurfa: 'S.Urfa',
  };
  const DEFAULT_COLOR = '#b0bec5';
  const DEFAULT_COLOR_DARK = '#455a64';

  let cityData = {};
  let activeCat = 'flort';
  const savedTheme = localStorage.getItem('map-theme');
  let isDark = savedTheme ? savedTheme === 'dark' : true;
  let mapSvg = null;
  let currentMapWidth = 0;

  applyTheme(isDark);

  function initCategoryButtons() {
    const bar = document.querySelector('.categories-bar');
    // Keep only summary
    const summary = bar.querySelector('.selection-summary');
    bar.innerHTML = '';
    bar.appendChild(summary);

    CATEGORIES.forEach(cat => {
      const btn = document.createElement('div');
      btn.className = `cat-btn ${activeCat === cat.id ? 'active' : ''}`;
      btn.dataset.cat = cat.id;
      btn.id = `cat-${cat.id}`;
      btn.innerHTML = `
        <span class="cat-dot" style="background:${cat.color}"></span>
        <span class="cat-label">${cat.label}</span>
        <span class="cat-count" id="count-${cat.id}">0/81</span>
        ${!cat.isDefault ? `<span class="delete-cat" data-id="${cat.id}">✕</span>` : ''}
      `;
      btn.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-cat')) {
          e.stopPropagation();
          deleteCategory(cat.id);
          return;
        }
        activeCat = cat.id;
        document.querySelectorAll('.cat-btn').forEach((item) => item.classList.remove('active'));
        btn.classList.add('active');
      });
      bar.appendChild(btn);
    });

    const addBtn = document.createElement('div');
    addBtn.className = 'cat-btn add-cat-btn';
    addBtn.innerHTML = '<span>➕ Kategori Ekle</span>';
    addBtn.addEventListener('click', () => {
      document.getElementById('addCatModal').classList.add('show');
    });
    bar.appendChild(addBtn);

    // Update export elements
    const exportStats = document.getElementById('exportStats');
    const exportLegend = document.getElementById('exportLegend');
    
    exportStats.innerHTML = '<div class="export-stats-title">İstatistik</div>';
    const totalRow = document.createElement('div');
    totalRow.className = 'export-stats-row';
    totalRow.innerHTML = `<span>Toplam</span><span id="export-count-total">0/81</span>`;
    exportStats.appendChild(totalRow);
    
    exportLegend.innerHTML = '';

    CATEGORIES.forEach(cat => {
      // Export Stats
      const row = document.createElement('div');
      row.className = 'export-stats-row';
      row.innerHTML = `<span>${cat.label}</span><span id="export-count-${cat.id}">0/81</span>`;
      exportStats.appendChild(row);

      // Export Legend
      const leg = document.createElement('div');
      leg.className = 'legend-item';
      leg.innerHTML = `<span class="legend-color" style="background:${cat.color}"></span> ${cat.label}`;
      exportLegend.appendChild(leg);
    });
  }

  initCategoryButtons();

  // Modal logic
  document.getElementById('closeModal').addEventListener('click', () => {
    document.getElementById('addCatModal').classList.remove('show');
  });
  
  document.getElementById('saveCatBtn').addEventListener('click', () => {
    const name = document.getElementById('newCatName').value.trim();
    const color = document.getElementById('newCatColor').value;
    if (!name) return;
    
    const id = 'cat_' + Date.now();
    CATEGORIES.push({ id, label: name, color, emoji: '', isDefault: false });
    syncCategoryState();
    initCategoryButtons();
    updateCounts();
    updateCitiesList();
    document.getElementById('addCatModal').classList.remove('show');
    document.getElementById('newCatName').value = '';
  });

  function deleteCategory(id) {
    CATEGORIES = CATEGORIES.filter(c => c.id !== id);
    if (activeCat === id) activeCat = CATEGORIES[0].id;
    // Remove data from cities
    Object.keys(cityData).forEach(city => {
      cityData[city] = cityData[city].filter(catId => catId !== id);
      if (cityData[city].length === 0) delete cityData[city];
    });
    syncCategoryState();
    initCategoryButtons();
    updateCounts();
    updateCitiesList();
    redrawColors();
  }

  function syncCategoryState() {
    CAT_MAP = Object.fromEntries(CATEGORIES.map((cat) => [cat.id, cat]));
    CAT_IDS = CATEGORIES.map((cat) => cat.id);
  }

  function saveCategories() {
    // No longer saving to localStorage as per request
  }

  document.getElementById('themeToggle').addEventListener('click', () => {
    isDark = !isDark;
    localStorage.setItem('map-theme', isDark ? 'dark' : 'light');
    applyTheme(isDark);
    redrawColors();
  });

  document.getElementById('resetBtn').addEventListener('click', () => {
    if (!confirm('Tum secimler sifirlanacak. Emin misin?')) return;
    cityData = {};
    redrawColors();
    updateCounts();
    updateCitiesList();
  });

  document.getElementById('downloadPngBtn').addEventListener('click', () => {
    exportCanvas().then((canvas) => {
      canvas.toBlob((blob) => downloadFile(blob, 'turkiye-haritam.png'), 'image/png');
    });
  });

  document.getElementById('downloadJpgBtn').addEventListener('click', () => {
    exportCanvas().then((canvas) => {
      canvas.toBlob((blob) => downloadFile(blob, 'turkiye-haritam.jpg'), 'image/jpeg', 0.9);
    });
  });

  document.getElementById('downloadPdfBtn').addEventListener('click', () => {
    exportCanvas().then((canvas) => {
      try {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new window.jspdf.jsPDF({
          orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
          unit: 'px',
          format: [canvas.width, canvas.height],
        });

        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
        downloadFile(pdf.output('blob'), 'turkiye-haritam.pdf');
      } catch (err) {
        console.error('PDF export error:', err);
        alert('PDF olusturulurken bir hata olustu.');
      }
    });
  });

  function applyTheme(dark) {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    document.getElementById('themeToggle').textContent = dark ? '☀️' : '🌙';
  }

  function exportCanvas() {
    const container = document.getElementById('map_container');
    const svg = container.querySelector('svg');
    const backgroundColor = isDark ? '#0f172a' : '#e0f2fe';
    const exportLabelWidth = Math.max(currentMapWidth, 760);
    const prev = {
      width: container.style.width,
      maxWidth: container.style.maxWidth,
      overflow: container.style.overflow,
      overflowX: container.style.overflowX,
      overflowY: container.style.overflowY,
      scrollLeft: container.scrollLeft,
      svgWidth: svg ? svg.style.width : '',
      svgMinWidth: svg ? svg.style.minWidth : '',
      svgMaxWidth: svg ? svg.style.maxWidth : '',
    };
    const exportWidth = Math.max(container.scrollWidth, svg ? svg.scrollWidth : 0, container.clientWidth);

    container.classList.add('is-exporting');
    container.scrollLeft = 0;
    container.style.width = exportWidth + 'px';
    container.style.maxWidth = 'none';
    container.style.overflow = 'visible';
    container.style.overflowX = 'visible';
    container.style.overflowY = 'visible';

    if (svg) {
      svg.style.width = exportWidth + 'px';
      svg.style.minWidth = exportWidth + 'px';
      svg.style.maxWidth = 'none';
    }
    if (mapSvg) updateLabelLayout(mapSvg, exportLabelWidth);

    return html2canvas(container, {
      backgroundColor,
      scale: 2,
      width: exportWidth,
      windowWidth: exportWidth,
      scrollX: 0,
      scrollY: 0,
      useCORS: true,
      allowTaint: true,
      logging: true, // Enable logging to see what's happening
      imageTimeout: 15000,
    }).catch(err => {
      console.error('html2canvas error:', err);
      alert('Goruntu olusturulurken bir hata olustu.');
      throw err;
    }).finally(() => {
      container.style.width = prev.width;
      container.style.maxWidth = prev.maxWidth;
      container.style.overflow = prev.overflow;
      container.style.overflowX = prev.overflowX;
      container.style.overflowY = prev.overflowY;
      container.scrollLeft = prev.scrollLeft;

      if (svg) {
        svg.style.width = prev.svgWidth;
        svg.style.minWidth = prev.svgMinWidth;
        svg.style.maxWidth = prev.svgMaxWidth;
      }
      if (mapSvg) updateLabelLayout(mapSvg, currentMapWidth);

      container.classList.remove('is-exporting');
    });
  }

  function downloadFile(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 100);
  }

  const tooltip = document.getElementById('tooltip');

  d3.json('tr-cities.json').then((geoData) => {
    const container = document.getElementById('map_container');
    const width = container.clientWidth || window.innerWidth;
    const height = Math.round(width * 0.52);
    const projection = d3.geoEqualEarth();
    projection.fitSize([width, height], geoData);

    const pathGen = d3.geoPath().projection(projection);
    const svg = d3
      .select('#map_container')
      .append('svg')
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet')
      .style('width', '100%')
      .style('height', 'auto')
      .style('display', 'block');

    mapSvg = svg;
    currentMapWidth = width;

    svg
      .append('g')
      .attr('class', 'provinces')
      .selectAll('path')
      .data(geoData.features)
      .join('path')
      .attr('d', pathGen)
      .attr('fill', (d) => getFill(d.properties.name))
      .attr('stroke', () => getStroke())
      .attr('stroke-width', 0.8)
      .attr('class', 'province-path')
      .style('cursor', 'pointer')
      .style('transition', 'filter 0.15s')
      .on('mouseover', function (event, d) {
        d3.select(this).style('filter', 'brightness(1.22)');
        const cats = getCityCategories(d.properties.name);
        const catInfo = cats.length
          ? cats.map((catId) => `${CAT_MAP[catId].emoji} ${CAT_MAP[catId].label}`).join(' + ')
          : '(isaretlenmemis)';
        tooltip.textContent = `${d.properties.name} - ${catInfo}`;
        tooltip.classList.add('show');
      })
      .on('mousemove', function (event) {
        tooltip.style.left = event.clientX + 'px';
        tooltip.style.top = event.clientY - 10 + 'px';
      })
      .on('mouseleave', function () {
        d3.select(this).style('filter', 'none');
        tooltip.classList.remove('show');
      })
      .on('click', function (event, d) {
        const cityName = d.properties.name;
        handleCityClick(cityName);
        d3.select(this).attr('fill', getFill(cityName));
        updateCounts();
        updateCitiesList();
        updateLabelColor(svg, cityName);
      })
      .on('contextmenu', function (event, d) {
        event.preventDefault();
        const cityName = d.properties.name;
        delete cityData[cityName];
        d3.select(this).attr('fill', getFill(cityName));
        updateCounts();
        updateCitiesList();
        updateLabelColor(svg, cityName);
      });

    svg
      .append('g')
      .attr('class', 'labels')
      .selectAll('text')
      .data(geoData.features)
      .join('text')
      .attr('x', (d) => pathGen.centroid(d)[0])
      .attr('y', (d) => pathGen.centroid(d)[1])
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('class', 'city-label')
      .attr('data-city', (d) => d.properties.name)
      .text((d) => getCityLabel(d.properties.name, width))
      .style('font-size', getLabelFontSize(width) + 'px')
      .style('fill', (d) => getLabelFill(d.properties.name))
      .style('pointer-events', 'none')
      .style('font-family', 'Inter, sans-serif')
      .style('font-weight', '600')
      .style('text-shadow', '0 1px 2px rgba(0,0,0,0.45)');

    updateCounts();
    updateCitiesList();

    window.addEventListener('resize', () => {
      const nextWidth = container.clientWidth || window.innerWidth;
      currentMapWidth = nextWidth;
      updateLabelLayout(svg, nextWidth);
    });
  });

  function getCityCategories(cityName) {
    const cats = cityData[cityName];
    return Array.isArray(cats) ? cats : [];
  }

  function handleCityClick(cityName) {
    const cats = getCityCategories(cityName);
    
    if (cats.length === 0) {
      // If empty, start from active category
      cityData[cityName] = [activeCat];
    } else {
      // Pure cycle through all categories
      const currentIdx = CAT_IDS.indexOf(cats[0]);
      if (currentIdx === -1) {
        cityData[cityName] = [CAT_IDS[0]];
      } else {
        const nextIdx = (currentIdx + 1) % CAT_IDS.length;
        cityData[cityName] = [CAT_IDS[nextIdx]];
      }
    }
  }

  function removeCityCategory(cityName, catId) {
    const cats = getCityCategories(cityName);
    const nextCats = cats.filter(id => id !== catId);
    if (nextCats.length === 0) delete cityData[cityName];
    else cityData[cityName] = nextCats;
  }

  function getFill(cityName) {
    const cats = getCityCategories(cityName);
    if (cats.length === 0) return isDark ? DEFAULT_COLOR_DARK : DEFAULT_COLOR;
    if (cats.length === 1) return CAT_MAP[cats[0]].color;
    return blendCategoryColors(cats);
  }

  function getStroke() {
    return isDark ? '#1e293b' : '#ffffff';
  }

  function getLabelFill(cityName) {
    return getCityCategories(cityName).length === 0 ? (isDark ? '#e2e8f0' : '#1e293b') : '#fff';
  }

  function blendCategoryColors(catIds) {
    const totals = catIds
      .map((catId) => hexToRgb(CAT_MAP[catId].color))
      .reduce(
        (acc, rgb) => {
          acc.r += rgb.r;
          acc.g += rgb.g;
          acc.b += rgb.b;
          return acc;
        },
        { r: 0, g: 0, b: 0 }
      );

    return rgbToHex(
      Math.round(totals.r / catIds.length),
      Math.round(totals.g / catIds.length),
      Math.round(totals.b / catIds.length)
    );
  }

  function hexToRgb(hex) {
    const value = hex.replace('#', '');
    return {
      r: parseInt(value.slice(0, 2), 16),
      g: parseInt(value.slice(2, 4), 16),
      b: parseInt(value.slice(4, 6), 16),
    };
  }

  function rgbToHex(r, g, b) {
    return `#${[r, g, b].map((value) => value.toString(16).padStart(2, '0')).join('')}`;
  }

  function getLabelFontSize(width) {
    if (width > 1400) return 8.5;
    if (width > 900) return 7.5;
    if (width > 760) return 6.8;
    if (width > 600) return 6.5;
    if (width > 420) return 5.8;
    return 5.1;
  }

  function getCityLabel(cityName, width) {
    if (width > 640) return cityName;
    if (MOBILE_LABELS[cityName]) return MOBILE_LABELS[cityName];
    if (cityName.length <= 9) return cityName;

    const compact = cityName.replace(/[aeiouAEIOU]/g, '');
    if (compact.length <= 9) return compact;
    return cityName.slice(0, 8);
  }

  function updateLabelLayout(svg, width) {
    svg
      .selectAll('.city-label')
      .text((d) => getCityLabel(d.properties.name, width))
      .style('font-size', getLabelFontSize(width) + 'px');
  }

  function redrawColors() {
    d3.selectAll('.province-path')
      .attr('fill', (d) => getFill(d.properties.name))
      .attr('stroke', () => getStroke());
    d3.selectAll('.city-label').style('fill', (d) => getLabelFill(d.properties.name));
  }

  function updateLabelColor(svg, cityName) {
    svg.select(`.labels text[data-city="${CSS.escape(cityName)}"]`).style('fill', getLabelFill(cityName));
  }

  function updateCounts() {
    const counts = {};
    CATEGORIES.forEach(cat => counts[cat.id] = 0);
    
    Object.values(cityData).forEach((cats) => {
      if (!Array.isArray(cats)) return;
      cats.forEach((catId) => {
        if (counts[catId] !== undefined) counts[catId] += 1;
      });
    });

    const totalSelected = Object.keys(cityData).length;
    document.getElementById('count-total').textContent = `${totalSelected}/${TOTAL_CITIES}`;
    document.getElementById('export-count-total').textContent = `${totalSelected}/${TOTAL_CITIES}`;

    CATEGORIES.forEach((cat) => {
      const countText = `${counts[cat.id]}/${TOTAL_CITIES}`;
      document.getElementById('count-' + cat.id).textContent = countText;
      document.getElementById('export-count-' + cat.id).textContent = countText;
    });
  }

  function updateCitiesList() {
    const grid = document.getElementById('citiesGrid');
    const section = document.getElementById('citiesSection');
    const entries = Object.entries(cityData);

    grid.innerHTML = '';
    if (entries.length === 0) {
      section.style.display = 'none';
      return;
    }

    section.style.display = '';

    CATEGORIES.forEach((cat) => {
      const cities = entries
        .filter(([, cats]) => Array.isArray(cats) && cats.includes(cat.id))
        .map(([name]) => name)
        .sort((left, right) => left.localeCompare(right, 'tr'));

      if (cities.length === 0) return;

      const group = document.createElement('div');
      group.className = 'city-group';
      group.innerHTML = `<div class="city-group-header" style="color:${cat.color}">${cat.emoji} ${cat.label} (${cities.length}/${TOTAL_CITIES})</div>`;

      cities.forEach((name) => {
        const tag = document.createElement('span');
        tag.className = 'city-tag';
        tag.style.background = getFill(name);
        tag.innerHTML = `${name} <span class="remove-tag" data-name="${name}">✕</span>`;
        tag.querySelector('.remove-tag').addEventListener('click', (event) => {
          event.stopPropagation();
          removeCityCategory(name, cat.id);
          d3.selectAll('.province-path')
            .filter((d) => d.properties.name === name)
            .attr('fill', getFill(name));
          d3.selectAll('.city-label')
            .filter((d) => d.properties.name === name)
            .style('fill', getLabelFill(name));
          updateCounts();
          updateCitiesList();
        });
        group.appendChild(tag);
      });

      grid.appendChild(group);
    });
  }
})();
