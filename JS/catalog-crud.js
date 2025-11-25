// JS/catalog-crud.js

// ================== Конфіг категорій (заголовки, описи) ==================
const CATEGORY_CONFIG = {
  smartphones: {
    title: "Смартфони та телефони",
    subtitle: "Обирайте сучасні смартфони, кнопкові телефони та аксесуари у TechStore."
  },
  tv: {
    title: "Телевізори і аудіотехніка",
    subtitle: "Все для кіно, музики та домашнього затишку."
  },
  notebooks: {
    title: "Ноутбуки, ПК і Планшети",
    subtitle: "Рішення для роботи, навчання та ігор."
  },
  kitchen: {
    title: "Техніка для кухні",
    subtitle: "Готуйте із задоволенням."
  },
  "home-tech": {
    title: "Техніка для дому",
    subtitle: "Комфорт і чистота у вашій оселі."
  },
  gaming: {
    title: "Ігрова зона",
    subtitle: "Консолі, периферія та аксесуари для геймерів."
  },
  dishes: {
    title: "Посуд",
    subtitle: "Щоденний посуд та набори для свят."
  },
  "photo-video": {
    title: "Фото і відео",
    subtitle: "Камери, аксесуари та все для зйомки."
  },
  beauty: {
    title: "Краса та здоров'я",
    subtitle: "Техніка та гаджети для турботи про себе."
  },
  "auto-tools": {
    title: "Авто і інструменти",
    subtitle: "Все для авто та домашнього майстра."
  },
  sport: {
    title: "Спорт і туризм",
    subtitle: "Товари для активного відпочинку."
  },
  "home-garden": {
    title: "Товари для дому та саду",
    subtitle: "Все для дому, саду та дачі."
  },
  kids: {
    title: "Товари для дітей",
    subtitle: "Іграшки, техніка та аксесуари для малюків."
  }
};

// Ключ для localStorage
const STORAGE_KEY_PREFIX = "ts_products_";

// Початкові (стартові) товари — для прикладу (лише смартфони).
// Для інших категорій можеш додати свої, або залишити порожньо.
const SEED_PRODUCTS = {
  smartphones: [
    {
      product_id: 1,
      name: "iPhone 15 Pro",
      brand: "Apple",
      type: "smartphone",
      price: 45999,
      image_url: "img/smartphone1.png",
      short_description: "Флагманський смартфон Apple з потужною камерою."
    },
    {
      product_id: 2,
      name: "Samsung Galaxy S24",
      brand: "Samsung",
      type: "smartphone",
      price: 39999,
      image_url: "img/smartphone2.png",
      short_description: "Топовий Android-смартфон для щоденних задач."
    },
    {
      product_id: 3,
      name: "Nokia 3310 (2024)",
      brand: "Nokia",
      type: "button",
      price: 1999,
      image_url: "img/smartphone3.png",
      short_description: "Надійний кнопковий телефон."
    }
  ]
};

// ================== Стан каталогу ==================
const state = {
  currentCategory: "smartphones",
  products: [] // товари поточної категорії
};

// ================== Допоміжне: створити Product / об'єкт ==================
// Якщо ти вже підключив models.js з класом Product — використає його.
// Якщо ні — буде простий JS-об’єкт, але інтерфейс однаковий.
// ================== Допоміжне: створити об'єкт товару для каталогу ==================
function createProductFromPlain(obj) {
  // Спеціально НЕ використовуємо клас Product з models.js,
  // щоб не втрачати brand, type та short_description.
  return {
    productId: obj.product_id,
    name: obj.name,
    brand: obj.brand || "",
    type: obj.type || "",
    price: Number(obj.price),
    imageUrl: obj.image_url || "",
    shortDescription: obj.short_description || obj.description || "",
    description: obj.description || ""
  };
}


// ================== Збереження в localStorage ==================
function loadProducts(categoryKey) {
  const raw = localStorage.getItem(STORAGE_KEY_PREFIX + categoryKey);
  if (!raw) {
    const seed = SEED_PRODUCTS[categoryKey] || [];
    return seed.map(createProductFromPlain);
  }
  try {
    const arr = JSON.parse(raw);
    return arr.map(createProductFromPlain);
  } catch (e) {
    console.error("Помилка читання localStorage", e);
    return [];
  }
}

function saveProducts(categoryKey, products) {
  const plain = products.map(p => ({
    product_id: p.productId,
    name: p.name,
    description: p.description || p.shortDescription || "",
    price: p.price,
    brand: p.brand || null,
    type: p.type || null,
    image_url: p.imageUrl || null,
    short_description: p.shortDescription || null
  }));

  localStorage.setItem(
    STORAGE_KEY_PREFIX + categoryKey,
    JSON.stringify(plain)
  );
}

let categoryPageEl;

// ================== DOM-посилання ==================
let categoryTitleEl,
  categorySubtitleEl,
  breadcrumbCurrentEl,
  productCountEl,
  sortSelectEl,
  minPriceEl,
  maxPriceEl,
  applyFiltersBtn,
  resetFiltersBtn,
  productsContainerEl,
  searchInputEl;

let productFormEl,
  productIdEl,
  productNameEl,
  productBrandEl,
  productPriceEl,
  productTypeEl,
  productImageEl,
  productDescEl,
  saveProductBtnEl,
  cancelEditBtnEl;

let currentSearch = "";

// ================== Ініціалізація ==================
document.addEventListener("DOMContentLoaded", () => {
  cacheDom();
  initMenu();
  initFiltersAndSort();
  initSearch();
  initForm();

  // стартуємо з тієї категорії, що прочитали з секції
  setCurrentCategory(state.currentCategory);
});


function cacheDom() {
  categoryPageEl = document.querySelector(".category-page");
  // якщо на сторінці задано data-category — використовуємо її
  if (categoryPageEl && categoryPageEl.dataset.category) {
    state.currentCategory = categoryPageEl.dataset.category;
  }

  categoryTitleEl =
    document.querySelector(".category-title") ||
    document.getElementById("category-title");
  categorySubtitleEl =
    document.querySelector(".category-subtitle") ||
    document.getElementById("category-subtitle");
  breadcrumbCurrentEl =
    document.querySelector(".breadcrumbs span:last-child") ||
    document.getElementById("breadcrumb-current");

  productCountEl = document.getElementById("product-count");
  sortSelectEl = document.getElementById("sort-select");
  minPriceEl = document.getElementById("min-price");
  maxPriceEl = document.getElementById("max-price");
  applyFiltersBtn = document.getElementById("apply-filters");
  resetFiltersBtn = document.getElementById("reset-filters");
  productsContainerEl = document.getElementById("products-container");
  searchInputEl = document.querySelector(".search-bar");

  productFormEl = document.getElementById("product-form");
  productIdEl = document.getElementById("product-id");
  productNameEl = document.getElementById("product-name");
  productBrandEl = document.getElementById("product-brand");
  productPriceEl = document.getElementById("product-price");
  productTypeEl = document.getElementById("product-type");
  productImageEl = document.getElementById("product-image");
  productDescEl = document.getElementById("product-desc");
  saveProductBtnEl = document.getElementById("save-product-btn");
  cancelEditBtnEl = document.getElementById("cancel-edit-btn");
}


// ================== Меню категорій ==================
function initMenu() {
  document.querySelectorAll(".menu-list").forEach(menu => {
    menu.addEventListener("click", e => {
      const link = e.target.closest(".menu-link");
      if (!link) return;

      const key = link.dataset.category;
      // якщо data-category немає — це звичайне посилання, даємо браузеру перейти по href
      if (!key) return;

      e.preventDefault();
      setCurrentCategory(key);
    });
  });
}


// ================== Фільтри, сортування ==================
function initFiltersAndSort() {
  if (applyFiltersBtn) {
    applyFiltersBtn.addEventListener("click", () => {
      renderFilteredProducts();
    });
  }
  if (resetFiltersBtn) {
    resetFiltersBtn.addEventListener("click", () => {
      resetFilters();
      renderFilteredProducts();
    });
  }
  if (sortSelectEl) {
    sortSelectEl.addEventListener("change", () => {
      renderFilteredProducts();
    });
  }
}

function initSearch() {
  if (!searchInputEl) return;
  searchInputEl.addEventListener("input", () => {
    currentSearch = searchInputEl.value.trim().toLowerCase();
    renderFilteredProducts();
  });
}

// ================== Форма CRUD ==================
function initForm() {
  if (!productFormEl) return;

  productFormEl.addEventListener("submit", e => {
    e.preventDefault();

    const idVal = productIdEl.value;

    const data = {
      product_id: idVal ? Number(idVal) : Date.now(), // тимчасовий id
      name: productNameEl.value.trim(),
      brand: productBrandEl.value.trim(),
      type: productTypeEl.value.trim(),
      price: Number(productPriceEl.value),
      image_url: productImageEl.value.trim(),
      short_description: productDescEl.value.trim()
    };

    if (!data.name || !data.brand || !data.type || !data.price) {
      alert("Заповни всі обовʼязкові поля (назва, бренд, тип, ціна).");
      return;
    }

    const product = createProductFromPlain(data);

    if (idVal) {
      // UPDATE
      const index = state.products.findIndex(
        p => p.productId === Number(idVal)
      );
      if (index !== -1) {
        state.products[index] = product;
      }
    } else {
      // CREATE
      state.products.push(product);
    }

    saveProducts(state.currentCategory, state.products);
    resetForm();
    renderFilteredProducts();
  });

  if (cancelEditBtnEl) {
    cancelEditBtnEl.addEventListener("click", () => {
      resetForm();
    });
  }
}

function resetForm() {
  if (!productFormEl) return;
  productFormEl.reset();
  productIdEl.value = "";
  if (saveProductBtnEl) saveProductBtnEl.textContent = "Додати товар";
  if (cancelEditBtnEl) cancelEditBtnEl.style.display = "none";
}

// ================== Перемикання категорій ==================
function setCurrentCategory(key) {
  state.currentCategory = key;
  state.products = loadProducts(key);

  const conf = CATEGORY_CONFIG[key] || {
    title: "Категорія",
    subtitle: ""
  };

  if (categoryTitleEl) categoryTitleEl.textContent = conf.title;
  if (categorySubtitleEl) categorySubtitleEl.textContent = conf.subtitle || "";
  if (breadcrumbCurrentEl) breadcrumbCurrentEl.textContent = conf.title;

  // підсвітка активного пункту меню
  document.querySelectorAll(".menu-link").forEach(link => {
    if (link.dataset.category === key) {
      link.classList.add("active-category");
    } else {
      link.classList.remove("active-category");
    }
  });

  resetFilters();
  renderFilteredProducts();
}

function resetFilters() {
  document
    .querySelectorAll('input[name="brand"], input[name="type"]')
    .forEach(cb => (cb.checked = false));

  if (minPriceEl) minPriceEl.value = "";
  if (maxPriceEl) maxPriceEl.value = "";
  if (sortSelectEl) sortSelectEl.value = "default";
}

// ================== Отримати відфільтрований список ==================
function getFilteredProducts() {
  let filtered = [...state.products];

  // бренд
  const selectedBrands = Array.from(
    document.querySelectorAll('input[name="brand"]:checked')
  ).map(cb => cb.value);

  if (selectedBrands.length) {
    filtered = filtered.filter(p => selectedBrands.includes(p.brand));
  }

  // тип
  const selectedTypes = Array.from(
    document.querySelectorAll('input[name="type"]:checked')
  ).map(cb => cb.value);

  if (selectedTypes.length) {
    filtered = filtered.filter(p => selectedTypes.includes(p.type));
  }

  // ціна
  const minPrice = minPriceEl ? Number(minPriceEl.value) : NaN;
  const maxPrice = maxPriceEl ? Number(maxPriceEl.value) : NaN;

  if (!Number.isNaN(minPrice) && minPrice > 0) {
    filtered = filtered.filter(p => p.price >= minPrice);
  }
  if (!Number.isNaN(maxPrice) && maxPrice > 0) {
    filtered = filtered.filter(p => p.price <= maxPrice);
  }

  // пошук
  if (currentSearch) {
    filtered = filtered.filter(p => {
      const haystack = [
        p.name,
        p.brand,
        p.type,
        p.shortDescription,
        p.description
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(currentSearch);
    });
  }

  // сортування
  switch (sortSelectEl ? sortSelectEl.value : "default") {
    case "price-asc":
      filtered.sort((a, b) => a.price - b.price);
      break;
    case "price-desc":
      filtered.sort((a, b) => b.price - a.price);
      break;
    default:
      // за id (порядок додавання)
      filtered.sort((a, b) => a.productId - b.productId);
  }

  return filtered;
}

// ================== Рендер товарів ==================
function renderFilteredProducts() {
  if (!productsContainerEl) return;

  const products = getFilteredProducts();
  productsContainerEl.innerHTML = "";

  if (productCountEl) {
    productCountEl.textContent = `Товарів: ${products.length}`;
  }

  if (!products.length) {
    productsContainerEl.innerHTML =
      '<p class="empty-message">Нічого не знайдено. Додай товар через адмін-панель або змінити фільтри.</p>';
    return;
  }

  products.forEach(product => {
    const card = document.createElement("div");
    card.className = "product-card";
    card.dataset.id = product.productId;

    const imageUrl =
      product.imageUrl || product.image_url || "img/placeholder.png";

card.innerHTML = `
      <div class="card-icons">
        <i class="fas fa-heart"></i>
        <i class="fas fa-balance-scale"></i>
      </div>
      <img src="${imageUrl}" alt="${product.name}">
      <h3>${product.name}</h3>
      <p class="product-brand">${product.brand || ""}</p>
      <p class="price">${product.price.toLocaleString("uk-UA")} грн</p>
      ${
        product.shortDescription
          ? `<p class="product-desc">${product.shortDescription}</p>`
          : ""
      }
      <button class="buy-btn">Купити</button>
      <div class="card-admin-actions">
        <button class="edit-btn">Редагувати</button>
        <button class="delete-btn">Видалити</button>
      </div>
    `;

    const editBtn = card.querySelector(".edit-btn");
    const deleteBtn = card.querySelector(".delete-btn");

    editBtn.addEventListener("click", () =>
      startEditProduct(product.productId)
    );
    deleteBtn.addEventListener("click", () =>
      deleteProduct(product.productId)
    );

    productsContainerEl.appendChild(card);
  });
}

// ================== Редагування / Видалення ==================
function startEditProduct(productId) {
  const product = state.products.find(p => p.productId === productId);
  if (!product) return;

  productIdEl.value = product.productId;
  productNameEl.value = product.name || "";
  productBrandEl.value = product.brand || "";
  productPriceEl.value = product.price || "";
  productTypeEl.value = product.type || "";
  productImageEl.value = product.imageUrl || product.image_url || "";
  productDescEl.value =
    product.shortDescription || product.description || "";

  if (saveProductBtnEl) saveProductBtnEl.textContent = "Оновити товар";
  if (cancelEditBtnEl) cancelEditBtnEl.style.display = "inline-block";
  productNameEl.focus();
}

function deleteProduct(productId) {
  if (!confirm("Видалити цей товар?")) return;

  state.products = state.products.filter(p => p.productId !== productId);
  saveProducts(state.currentCategory, state.products);
  renderFilteredProducts();
}
