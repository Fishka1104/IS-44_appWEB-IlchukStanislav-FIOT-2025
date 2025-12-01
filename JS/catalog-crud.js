// JS/catalog-crud.js – версія з REST API (Node.js + MySQL) + роль Admin
// :contentReference[oaicite:0]{index=0}

// ================== Налаштування API ==================
const API_BASE_URL = "http://localhost:1105/api/products";
const AUTH_TOKEN_KEY = "authToken";
const CURRENT_USER_KEY = "currentUser";

let isAdmin = false;

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

// ================== Стан каталогу ==================
const state = {
  currentCategory: "smartphones",
  products: [],
  isLoading: false
};

// ================== Мапінг з plain-об'єкта з API в фронтовий об'єкт ==================
function createProductFromPlain(obj) {
  return {
    productId: obj.product_id,
    categoryId: obj.category_id,
    name: obj.name,
    brand: obj.brand || "",
    type: obj.product_type || obj.type || "",
    price: Number(obj.price),
    stockQuantity:
      obj.stock_quantity !== undefined && obj.stock_quantity !== null
        ? Number(obj.stock_quantity)
        : 0,
    sku: obj.sku || "",
    imageUrl: obj.image_url || "",
    shortDescription: obj.short_description || obj.description || "",
    description: obj.description || ""
  };
}

// ================== Допоміжні: роль Admin + заголовки авторизації ==================
function detectAdminFromStorage() {
  try {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    if (!raw) return;
    const user = JSON.parse(raw);
    if (user && Array.isArray(user.roles)) {
      isAdmin = user.roles.includes("Admin");
    } else {
      isAdmin = false;
    }
  } catch (e) {
    console.error("Помилка читання currentUser з localStorage:", e);
    isAdmin = false;
  }
}

function buildAuthHeaders(isJson = true) {
  const headers = {};
  if (isJson) {
    headers["Content-Type"] = "application/json";
  }
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

// ================== DOM-посилання ==================
let categoryPageEl;

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
  productQtyEl,
  productSkuEl,
  saveProductBtnEl,
  cancelEditBtnEl;

let currentSearch = "";

// ================== Ініціалізація ==================
document.addEventListener("DOMContentLoaded", () => {
  // 1. Визначаємо, чи поточний користувач адмін
  detectAdminFromStorage();

  // 2. Кешуємо DOM
  cacheDom();

  // 3. Ховаємо адмін-панель, якщо не Admin
  applyAdminVisibility();

  initMenu();
  initFiltersAndSort();
  initSearch();

  if (isAdmin) {
    initForm();
  }

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
  // пошук — беремо з верхнього хедера
  searchInputEl = document.querySelector(".search-bar");

  productFormEl = document.getElementById("product-form");
  productIdEl = document.getElementById("product-id");
  productNameEl = document.getElementById("product-name");
  productBrandEl = document.getElementById("product-brand");
  productPriceEl = document.getElementById("product-price");
  productTypeEl = document.getElementById("product-type");
  productImageEl = document.getElementById("product-image");
  productDescEl = document.getElementById("product-desc");
  productQtyEl = document.getElementById("product-qty");
  productSkuEl = document.getElementById("product-sku");
  saveProductBtnEl = document.getElementById("save-product-btn");
  cancelEditBtnEl = document.getElementById("cancel-edit-btn");
}

function applyAdminVisibility() {
  const adminPanel = document.querySelector(".admin-panel");
  if (!isAdmin && adminPanel) {
    adminPanel.style.display = "none";
  }
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

// ================== Робота з формою (CRUD) ==================
function initForm() {
  if (!productFormEl) return;

  productFormEl.addEventListener("submit", async e => {
    e.preventDefault();

    if (!isAdmin) {
      alert("Тільки адміністратор може змінювати товари.");
      return;
    }

    const idVal = productIdEl.value;

    const data = {
      // для бекенду: або category_id, або categoryKey
      categoryKey: state.currentCategory,
      name: productNameEl.value.trim(),
      brand: productBrandEl.value.trim(),
      product_type: productTypeEl.value.trim(),
      description: productDescEl.value.trim(),
      price: Number(productPriceEl.value),
      stock_quantity: productQtyEl ? Number(productQtyEl.value || 0) : 0,
      sku: productSkuEl ? productSkuEl.value.trim() : ""
    };

    if (!data.name || !data.brand || !data.product_type || !data.price) {
      alert("Заповни всі обовʼязкові поля (назва, бренд, тип, ціна).");
      return;
    }

    if (data.price <= 0) {
      alert("Ціна має бути більшою за нуль.");
      return;
    }

    if (data.stock_quantity < 0) {
      alert("Кількість не може бути від’ємною.");
      return;
    }

    try {
      if (idVal) {
        await updateProductOnServer(Number(idVal), data);
      } else {
        await createProductOnServer(data);
      }
      resetForm();
    } catch (err) {
      console.error("Помилка збереження товару:", err);
      alert("Не вдалося зберегти товар. Деталі дивись у консолі.");
    }
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
  if (productQtyEl) productQtyEl.value = "";
  if (productSkuEl) productSkuEl.value = "";
  if (saveProductBtnEl) saveProductBtnEl.textContent = "Додати товар";
  if (cancelEditBtnEl) cancelEditBtnEl.style.display = "none";
}

// ================== Запити до REST API ==================
async function fetchProductsForCategory(categoryKey) {
  if (!productsContainerEl) return;

  state.isLoading = true;
  productsContainerEl.innerHTML =
    '<p class="loading-message">Завантаження товарів...</p>';

  try {
    const params = new URLSearchParams();
    params.set("categoryKey", categoryKey);

    const res = await fetch(`${API_BASE_URL}?${params.toString()}`);
    if (!res.ok) {
      throw new Error(`Помилка HTTP ${res.status}`);
    }

    const data = await res.json();
    state.products = Array.isArray(data)
      ? data.map(createProductFromPlain)
      : [];
  } catch (err) {
    console.error("Помилка завантаження товарів:", err);
    state.products = [];
  } finally {
    state.isLoading = false;
    renderFilteredProducts();
  }
}

async function createProductOnServer(payload) {
  const res = await fetch(API_BASE_URL, {
    method: "POST",
    headers: buildAuthHeaders(true),
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(errText || `HTTP ${res.status}`);
  }

  const created = await res.json();
  const product = createProductFromPlain(created);
  state.products.push(product);
  renderFilteredProducts();
}

async function updateProductOnServer(productId, payload) {
  const res = await fetch(`${API_BASE_URL}/${productId}`, {
    method: "PUT",
    headers: buildAuthHeaders(true),
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(errText || `HTTP ${res.status}`);
  }

  const updated = await res.json();
  const product = createProductFromPlain(updated);

  const index = state.products.findIndex(p => p.productId === productId);
  if (index !== -1) {
    state.products[index] = product;
  } else {
    state.products.push(product);
  }
  renderFilteredProducts();
}

async function deleteProductFromServer(productId) {
  const res = await fetch(`${API_BASE_URL}/${productId}`, {
    method: "DELETE",
    headers: buildAuthHeaders(false)
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(errText || `HTTP ${res.status}`);
  }

  state.products = state.products.filter(p => p.productId !== productId);
  renderFilteredProducts();
}

// ================== Перемикання категорій ==================
async function setCurrentCategory(key) {
  state.currentCategory = key;

  const conf = CATEGORY_CONFIG[key] || {
    title: "Категорія",
    subtitle: ""
  };

  if (categoryTitleEl) categoryTitleEl.textContent = conf.title;
  if (categorySubtitleEl) categorySubtitleEl.textContent = conf.subtitle || "";
  if (breadcrumbCurrentEl) breadcrumbCurrentEl.textContent = conf.title;

  // підсвітка активного пункту меню (для SPA-варіанту, через data-category)
  document.querySelectorAll(".menu-link").forEach(link => {
    if (link.dataset.category === key) {
      link.classList.add("active-category");
    } else {
      link.classList.remove("active-category");
    }
  });

  resetFilters();
  await fetchProductsForCategory(key);
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
        p.description,
        p.sku
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

  if (state.isLoading) {
    productsContainerEl.innerHTML =
      '<p class="loading-message">Завантаження товарів...</p>';
    return;
  }

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

    const stockQty =
      typeof product.stockQuantity === "number" ? product.stockQuantity : 0;
    const stockText =
      stockQty > 0
        ? `В наявності: ${stockQty} шт.`
        : "Немає в наявності";

    const skuHtml = product.sku
      ? `<p class="product-sku">Артикул: ${product.sku}</p>`
      : "";

    const adminButtonsHtml = isAdmin
      ? `
        <div class="card-admin-actions">
          <button class="edit-btn">Редагувати</button>
          <button class="delete-btn">Видалити</button>
        </div>
      `
      : "";

    card.innerHTML = `
      <div class="card-icons">
        <i class="fas fa-heart"></i>
        <i class="fas fa-balance-scale"></i>
      </div>
      <img src="${imageUrl}" alt="${product.name}">
      <h3>${product.name}</h3>
      <p class="product-brand">${product.brand || ""}</p>
      <p class="price">${product.price.toLocaleString("uk-UA")} грн</p>
      <p class="product-stock">${stockText}</p>
      ${
        product.shortDescription
          ? `<p class="product-desc">${product.shortDescription}</p>`
          : ""
      }
      ${skuHtml}
      <button class="buy-btn">Купити</button>
      ${adminButtonsHtml}
    `;

    if (isAdmin) {
      const editBtn = card.querySelector(".edit-btn");
      const deleteBtn = card.querySelector(".delete-btn");

      if (editBtn) {
        editBtn.addEventListener("click", () =>
          startEditProduct(product.productId)
        );
      }
      if (deleteBtn) {
        deleteBtn.addEventListener("click", () =>
          handleDeleteProduct(product.productId)
        );
      }
    }

    productsContainerEl.appendChild(card);
  });
}

// ================== Редагування / Видалення ==================
function startEditProduct(productId) {
  if (!isAdmin) {
    alert("Тільки адміністратор може редагувати товари.");
    return;
  }

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
  if (productQtyEl)
    productQtyEl.value =
      product.stockQuantity !== undefined && product.stockQuantity !== null
        ? product.stockQuantity
        : 0;
  if (productSkuEl) productSkuEl.value = product.sku || "";

  if (saveProductBtnEl) saveProductBtnEl.textContent = "Оновити товар";
  if (cancelEditBtnEl) cancelEditBtnEl.style.display = "inline-block";
  productNameEl.focus();
}

async function handleDeleteProduct(productId) {
  if (!isAdmin) {
    alert("Тільки адміністратор може видаляти товари.");
    return;
  }
  if (!confirm("Видалити цей товар?")) return;
  try {
    await deleteProductFromServer(productId);
  } catch (err) {
    console.error("Помилка видалення товару:", err);
    alert("Не вдалося видалити товар. Деталі дивись у консолі.");
  }
}
