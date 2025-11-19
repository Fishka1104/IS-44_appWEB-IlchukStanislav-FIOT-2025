
// TechStore generic Frontend CRUD for all categories (localStorage)
// Brand & Type are SELECT dropdowns populated per category.

(function(){
  const PLACEHOLDER_IMG = 'https://via.placeholder.com/300x200?text=TechStore';

  // Options for dropdowns per category
  const OPTIONS = {
    'smartphones': {
      brands: ['Apple','Samsung','Xiaomi','realme','Nokia'],
      types:  [['smartphone','Смартфони'],['button','Кнопкові телефони']]
    },
    'tv': {
      brands: ['Samsung','LG','Sony','Philips','Xiaomi'],
      types:  [['tv','Телевізори'],['soundbar','Саундбари'],['speakers','Акустика']]
    },
    'notebooks': {
      brands: ['Lenovo','HP','ASUS','Acer','Apple'],
      types:  [['office','Для роботи та навчання'],['gaming','Ігрові'],['ultrabook','Ультрабуки']]
    },
    'kitchen': {
      brands: ['Philips','Tefal','Bosch','Gorenje','Zelmer'],
      types:  [['blender','Блендери'],['kettle','Чайники'],['microwave','Мікрохвильові печі'],['multicooker','Мультиварки']]
    },
    'home-tech': {
      brands: ['Philips','Bosch','LG','Xiaomi','Dyson'],
      types:  [['vacuum','Пилососи'],['iron','Праски'],['air_purifier','Очищувачі повітря']]
    },
    'gaming': {
      brands: ['Sony','Microsoft','Nintendo','Logitech','Razer'],
      types:  [['console','Консолі'],['controller','Контролери'],['accessory','Аксесуари']]
    },
    'dishes': {
      brands: ['Tefal','BergHOFF','Pyrex','Luminarc','Villeroy & Boch'],
      types:  [['pan','Сковорідки'],['pot','Каструлі'],['tableware','Столовий посуд']]
    },
    'photo-video': {
      brands: ['Canon','Nikon','Sony','GoPro','Panasonic'],
      types:  [['camera','Фотоапарати'],['lens','Об\'єктиви'],['action','Екшн-камери']]
    },
    'beauty': {
      brands: ['Philips','Braun','Remington','Xiaomi','Rowenta'],
      types:  [['hairdryer','Фени'],['trimmer','Тримери'],['straightener','Випрямлячі']]
    },
    'auto-tools': {
      brands: ['Bosch','Xiaomi','Michelin','Osram','Dremel'],
      types:  [['car_accessory','Автоаксесуари'],['compressor','Компресори'],['tool','Інструменти']]
    },
    'sport': {
      brands: ['Adidas','Nike','Xiaomi','Garmin','Trek'],
      types:  [['fitness','Фітнес'],['bike','Вело'],['sport_accessory','Аксесуари']]
    },
    'home-garden': {
      brands: ['Gardena','Bosch','Karcher','Fiskars','Stihl'],
      types:  [['mower','Газонокосарки'],['trimmer','Тримери'],['tool','Інструменти']]
    },
    'kids': {
      brands: ['LEGO','Chicco','Pampers','Fisher-Price','Philips Avent'],
      types:  [['toy','Іграшки'],['stroller','Коляски'],['care','Догляд']]
    }
  };

  // Default seed products per category (3 кожній)
  const DEFAULT_PRODUCTS = {
    'smartphones': [
      {id:1, name:'Apple iPhone 13 128GB', brand:'Apple', type:'smartphone', price:32999, image:PLACEHOLDER_IMG, desc:'OLED, A15, камера 12 Мп'},
      {id:2, name:'Samsung Galaxy A55 5G', brand:'Samsung', type:'smartphone', price:19499, image:PLACEHOLDER_IMG, desc:'AMOLED, 8 ГБ RAM'},
      {id:3, name:'Xiaomi Redmi Note 13', brand:'Xiaomi', type:'smartphone', price:10999, image:PLACEHOLDER_IMG, desc:'AMOLED 120Гц, 8/256'}
    ],
    'tv': [
      {id:1, name:'Samsung 55\" 4K Smart TV', brand:'Samsung', type:'tv', price:19999, image:PLACEHOLDER_IMG, desc:'4K UHD, Smart TV'},
      {id:2, name:'LG 50\" 4K NanoCell', brand:'LG', type:'tv', price:17999, image:PLACEHOLDER_IMG, desc:'HDR10, ThinQ AI'},
      {id:3, name:'Sony HT-S400 Soundbar', brand:'Sony', type:'soundbar', price:8999, image:PLACEHOLDER_IMG, desc:'Саундбар 2.1'}
    ],
    'notebooks': [
      {id:1, name:'Lenovo IdeaPad 3 15', brand:'Lenovo', type:'office', price:19999, image:PLACEHOLDER_IMG, desc:'Ryzen 5, 8/512'},
      {id:2, name:'ASUS TUF Gaming F15', brand:'ASUS', type:'gaming', price:34999, image:PLACEHOLDER_IMG, desc:'RTX 3050, 16/512'},
      {id:3, name:'Apple MacBook Air 13', brand:'Apple', type:'ultrabook', price:39999, image:PLACEHOLDER_IMG, desc:'M1, 8/256'}
    ],
    'kitchen': [
      {id:1, name:'Philips Блендер ProMix', brand:'Philips', type:'blender', price:1899, image:PLACEHOLDER_IMG, desc:'Міцна ніжка, насадки'},
      {id:2, name:'Tefal Чайник 1.7 л', brand:'Tefal', type:'kettle', price:1299, image:PLACEHOLDER_IMG, desc:'Швидкий нагрів'},
      {id:3, name:'Bosch Мікрохвильова піч', brand:'Bosch', type:'microwave', price:4999, image:PLACEHOLDER_IMG, desc:'20 л, кварц гриль'}
    ],
    'home-tech': [
      {id:1, name:'Xiaomi Робот-пилосос', brand:'Xiaomi', type:'vacuum', price:8999, image:PLACEHOLDER_IMG, desc:'Лідар, автодок'},
      {id:2, name:'Philips Праска Steam', brand:'Philips', type:'iron', price:1599, image:PLACEHOLDER_IMG, desc:'Паровий удар'},
      {id:3, name:'Dyson Очищувач повітря', brand:'Dyson', type:'air_purifier', price:13999, image:PLACEHOLDER_IMG, desc:'HEPA фільтр'}
    ],
    'gaming': [
      {id:1, name:'Sony PlayStation 5', brand:'Sony', type:'console', price:22999, image:PLACEHOLDER_IMG, desc:'SSD, DualSense'},
      {id:2, name:'Xbox Wireless Controller', brand:'Microsoft', type:'controller', price:2499, image:PLACEHOLDER_IMG, desc:'Bluetooth'},
      {id:3, name:'Logitech G502 HERO', brand:'Logitech', type:'accessory', price:1999, image:PLACEHOLDER_IMG, desc:'Gaming миша'}
    ],
    'dishes': [
      {id:1, name:'Tefal Сковорода 28 см', brand:'Tefal', type:'pan', price:999, image:PLACEHOLDER_IMG, desc:'Антипригарне покриття'},
      {id:2, name:'Luminarc Набір тарілок (12)', brand:'Luminarc', type:'tableware', price:799, image:PLACEHOLDER_IMG, desc:'12 предметів'},
      {id:3, name:'BergHOFF Каструля 5 л', brand:'BergHOFF', type:'pot', price:1799, image:PLACEHOLDER_IMG, desc:'Нержавіюча сталь'}
    ],
    'photo-video': [
      {id:1, name:'Canon EOS M50', brand:'Canon', type:'camera', price:22999, image:PLACEHOLDER_IMG, desc:'APS-C, 4K'},
      {id:2, name:'Sony FE 50mm f/1.8', brand:'Sony', type:'lens', price:7999, image:PLACEHOLDER_IMG, desc:'Повний кадр'},
      {id:3, name:'GoPro HERO 11', brand:'GoPro', type:'action', price:15999, image:PLACEHOLDER_IMG, desc:'5.3K, стабілізація'}
    ],
    'beauty': [
      {id:1, name:'Philips Фен 2200W', brand:'Philips', type:'hairdryer', price:1499, image:PLACEHOLDER_IMG, desc:'Іонізація'},
      {id:2, name:'Braun Триммер', brand:'Braun', type:'trimmer', price:1299, image:PLACEHOLDER_IMG, desc:'Насадки'},
      {id:3, name:'Remington Випрямляч', brand:'Remington', type:'straightener', price:1099, image:PLACEHOLDER_IMG, desc:'Керамічні пластини'}
    ],
    'auto-tools': [
      {id:1, name:'Bosch Компресор', brand:'Bosch', type:'compressor', price:1899, image:PLACEHOLDER_IMG, desc:'12V, автостоп'},
      {id:2, name:'Xiaomi Зарядний кабель', brand:'Xiaomi', type:'car_accessory', price:299, image:PLACEHOLDER_IMG, desc:'Type-C'},
      {id:3, name:'Dremel Мультитул', brand:'Dremel', type:'tool', price:2199, image:PLACEHOLDER_IMG, desc:'Комплект насадок'}
    ],
    'sport': [
      {id:1, name:'Garmin Forerunner', brand:'Garmin', type:'fitness', price:7999, image:PLACEHOLDER_IMG, desc:'GPS, пульс'},
      {id:2, name:'Trek Велосипед FX', brand:'Trek', type:'bike', price:18999, image:PLACEHOLDER_IMG, desc:'Легкий алюміній'},
      {id:3, name:'Xiaomi Смарт-ваги', brand:'Xiaomi', type:'sport_accessory', price:999, image:PLACEHOLDER_IMG, desc:'Bluetooth'}
    ],
    'home-garden': [
      {id:1, name:'Karcher Мийка', brand:'Karcher', type:'tool', price:6499, image:PLACEHOLDER_IMG, desc:'120 бар'},
      {id:2, name:'Gardena Тример', brand:'Gardena', type:'trimmer', price:2499, image:PLACEHOLDER_IMG, desc:'Електричний'},
      {id:3, name:'Fiskars Секатор', brand:'Fiskars', type:'tool', price:699, image:PLACEHOLDER_IMG, desc:'Лезо з сталі'}
    ],
    'kids': [
      {id:1, name:'LEGO Classic 11005', brand:'LEGO', type:'toy', price:1499, image:PLACEHOLDER_IMG, desc:'500 деталей'},
      {id:2, name:'Chicco Прогулянкова коляска', brand:'Chicco', type:'stroller', price:3999, image:PLACEHOLDER_IMG, desc:'Легка'},
      {id:3, name:'Pampers Pants 4', brand:'Pampers', type:'care', price:599, image:PLACEHOLDER_IMG, desc:'Велика упаковка'}
    ]
  };

  let products = [];
  let editingId = null;
  let STORAGE_KEY = '';

  document.addEventListener('DOMContentLoaded', init);

  function init(){
    try {
      const page = document.querySelector('.category-page');
      if (!page) return;
      const category = page.dataset.category || 'notebooks';
      STORAGE_KEY = `techstore_${category}`;

      seedIfNeeded(category);
      populateSelects(category);
      setupEvents();
      renderProducts();

      // expose simple debug helper
      window.TechStore = {
        dump: () => JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]'),
        clear: () => { localStorage.removeItem(STORAGE_KEY); alert('Дані очищено. Перезавантажте сторінку.'); }
      };
    } catch (e) {
      console.error('Init error:', e);
    }
  }

  function seedIfNeeded(category){
    let parsed = null;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw){
      try { parsed = JSON.parse(raw); } catch(e){ parsed = null; }
    }
    if (!Array.isArray(parsed) || parsed.length === 0){
      products = (DEFAULT_PRODUCTS[category] || []).map(p => ({...p}));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
    } else {
      products = parsed;
    }
  }

  function populateSelects(category){
    const opts = OPTIONS[category] || {brands:[], types:[]};

    const brandSel = ensureSelect('product-brand', 'Оберіть бренд');
    const typeSel  = ensureSelect('product-type',  'Оберіть призначення/тип');

    fillSelect(brandSel, opts.brands, 'Оберіть бренд');
    fillSelect(typeSel,  opts.types,  'Оберіть призначення/тип');
  }

  function ensureSelect(id, placeholder){
    let node = document.getElementById(id);
    if (!node) return null;
    if (node.tagName.toLowerCase() === 'select') return node;
    const sel = document.createElement('select');
    sel.id = id; sel.required = true; sel.className = node.className;
    node.parentNode.replaceChild(sel, node);
    return sel;
  }

  function fillSelect(select, list, placeholder){
    if (!select) return;
    select.innerHTML = '';
    const ph = document.createElement('option');
    ph.value = ''; ph.textContent = placeholder;
    select.appendChild(ph);
    list.forEach(item => {
      let value, label;
      if (Array.isArray(item)) { value = item[0]; label = item[1]; }
      else { value = item; label = item; }
      const opt = document.createElement('option');
      opt.value = value; opt.textContent = label;
      select.appendChild(opt);
    });
  }

  function setupEvents(){
    const form = document.getElementById('product-form');
    const cancelBtn = document.getElementById('cancel-edit-btn');
    const sortSelect = document.getElementById('sort-select');
    const applyFiltersBtn = document.getElementById('apply-filters');
    const resetFiltersBtn = document.getElementById('reset-filters');
    const productsContainer = document.getElementById('products-container');

    if (form) form.addEventListener('submit', handleFormSubmit);
    if (cancelBtn) cancelBtn.addEventListener('click', handleCancelEdit);
    if (sortSelect) sortSelect.addEventListener('change', renderProducts);
    if (applyFiltersBtn) applyFiltersBtn.addEventListener('click', renderProducts);
    if (resetFiltersBtn) resetFiltersBtn.addEventListener('click', resetFilters);

    if (productsContainer) {
      productsContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;
        const id = parseInt(btn.dataset.id, 10);
        if (btn.classList.contains('edit-btn')) startEdit(id);
        else if (btn.classList.contains('delete-btn')) deleteProduct(id);
      });
    }
  }

  function handleFormSubmit(e){
    e.preventDefault();
    const data = readForm();
    if (!data) return;
    if (editingId){
      products = products.map(p => p.id === editingId ? {...p, ...data} : p);
    } else {
      const newId = products.length ? Math.max(...products.map(p=>p.id)) + 1 : 1;
      products.push({ id:newId, ...data });
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
    renderProducts(); resetForm();
  }

  function readForm(){
    const name  = (document.getElementById('product-name')?.value || '').trim();
    const brand = (document.getElementById('product-brand')?.value || '').trim();
    const type  = (document.getElementById('product-type')?.value || '').trim();
    const price = Number(document.getElementById('product-price')?.value || 0);
    const image = (document.getElementById('product-image')?.value || '').trim() || PLACEHOLDER_IMG;
    const desc  = (document.getElementById('product-desc')?.value || '').trim();

    if (!name || !brand || !type || !price) {
      alert('Заповніть обовʼязкові поля.'); return null;
    }
    return { name, brand, type, price, image, desc };
  }

  function resetForm(){
    editingId = null;
    const form = document.getElementById('product-form');
    if (form) form.reset();
    const saveBtn = document.getElementById('save-product-btn');
    if (saveBtn) saveBtn.textContent = 'Додати товар';
    const cancelBtn = document.getElementById('cancel-edit-btn');
    if (cancelBtn) cancelBtn.style.display = 'none';
  }

  function handleCancelEdit(){ resetForm(); }

  function startEdit(id){
    const p = products.find(x => x.id === id); if (!p) return;
    editingId = id;
    setValue('product-name',  p.name);
    ensureSelected('product-brand', p.brand);
    ensureSelected('product-type',  p.type);
    setValue('product-price', p.price);
    setValue('product-image', p.image);
    setValue('product-desc',  p.desc);
    const saveBtn = document.getElementById('save-product-btn');
    if (saveBtn) saveBtn.textContent = 'Зберегти зміни';
    const cancelBtn = document.getElementById('cancel-edit-btn');
    if (cancelBtn) cancelBtn.style.display = 'inline-block';
  }

  function setValue(id, v){ const el = document.getElementById(id); if (el) el.value = v; }

  function ensureSelected(selectId, value){
    const sel = document.getElementById(selectId);
    if (!sel) return;
    let exists = false;
    for (const opt of sel.options) { if (opt.value === value) { exists = true; break; } }
    if (!exists && value) {
      const extra = document.createElement('option');
      extra.value = value; extra.textContent = value; sel.appendChild(extra);
    }
    sel.value = value || '';
  }

  function deleteProduct(id){
    if (!confirm('Видалити цей товар?')) return;
    products = products.filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
    renderProducts();
  }

  function getFilteredAndSortedProducts(){
    const brandChecked = Array.from(document.querySelectorAll('input[name="brand"]:checked')).map(x => x.value);
    const typeChecked  = Array.from(document.querySelectorAll('input[name="type"]:checked')).map(x => x.value);
    const minPriceVal = Number(document.getElementById('min-price')?.value) || null;
    const maxPriceVal = Number(document.getElementById('max-price')?.value) || null;
    const sortVal = document.getElementById('sort-select')?.value || 'default';

    let list = [...products];
    if (brandChecked.length) list = list.filter(p => brandChecked.includes(p.brand));
    if (typeChecked.length)  list = list.filter(p => typeChecked.includes(p.type));
    if (minPriceVal !== null) list = list.filter(p => p.price >= minPriceVal);
    if (maxPriceVal !== null && maxPriceVal > 0) list = list.filter(p => p.price <= maxPriceVal);

    if (sortVal === 'price-asc') list.sort((a,b)=>a.price-b.price);
    else if (sortVal === 'price-desc') list.sort((a,b)=>b.price-a.price);

    return list;
  }

  function resetFilters(){
    document.querySelectorAll('input[name="brand"]').forEach(ch => ch.checked = false);
    document.querySelectorAll('input[name="type"]').forEach(ch => ch.checked = false);
    const min = document.getElementById('min-price'); if (min) min.value = '';
    const max = document.getElementById('max-price'); if (max) max.value = '';
    const sort = document.getElementById('sort-select'); if (sort) sort.value = 'default';
    renderProducts();
  }

  function renderProducts(){
    const container = document.getElementById('products-container');
    if (!container) return;
    const list = getFilteredAndSortedProducts();
    container.innerHTML = '';
    list.forEach(p => {
      const card = document.createElement('div');
      card.className = 'product-card';
      card.innerHTML = `
        <div class="card-icons">
          <i class="fas fa-heart"></i>
          <i class="fas fa-balance-scale"></i>
        </div>
        <img src="${p.image || PLACEHOLDER_IMG}" alt="${escapeHtml(p.name)}">
        <h3>${escapeHtml(p.name)}</h3>
        <div class="button-group">
          <button class="info-btn"><i class="fas fa-info-circle"></i> Інформація</button>
        </div>
        <p class="price">${formatPrice(p.price)} грн</p>
        <p style="font-size:13px;color:#4b5563;min-height:32px;">${escapeHtml(p.desc||'')}</p>
        <button class="buy-btn">Купити</button>
        <div class="card-admin-actions">
          <button class="edit-btn" data-id="${p.id}">Редагувати</button>
          <button class="delete-btn" data-id="${p.id}">Видалити</button>
        </div>
      `;
      container.appendChild(card);
    });
    const c = document.getElementById('product-count'); if (c) c.textContent = `Товарів: ${list.length}`;
  }

  function formatPrice(v){ return Number(v).toLocaleString('uk-UA'); }
  function escapeHtml(t){ return (t||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
})();


// [PATCH 2] Add delegated handlers for #apply-filters and #cancel-edit-btn
// so that Apply/Reset filters and Cancel Edit always work.

function onDocumentClick(e){
  // Скинути фільтри
  if (e.target.closest('#reset-filters')) {
    resetFilters();
    return;
  }
  // Застосувати фільтри
  if (e.target.closest('#apply-filters')) {
    renderProducts();
    return;
  }
  // Скасувати редагування
  if (e.target.closest('#cancel-edit-btn')) {
    handleCancelEdit();
    return;
  }
  // Редагувати
  const editBtn = e.target.closest('.edit-btn');
  if (editBtn) {
    const id = parseInt(editBtn.dataset.id, 10);
    startEdit(id);
    return;
  }
  // Видалити
  const delBtn = e.target.closest('.delete-btn');
  if (delBtn) {
    const id = parseInt(delBtn.dataset.id, 10);
    deleteProduct(id);
    return;
  }
}
