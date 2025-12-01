// JS/main.js

// Логіка каталогу (кнопка "Каталог товарів")
document.addEventListener("DOMContentLoaded", () => {
  const wrapper = document.querySelector(".catalog-wrapper");
  const toggleBtn = document.getElementById("catalog-toggle");
  const dropdown = document.getElementById("catalog-dropdown");

  if (!wrapper || !toggleBtn || !dropdown) return;

  toggleBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    wrapper.classList.toggle("open");
  });

  document.addEventListener("click", (e) => {
    if (!wrapper.contains(e.target)) wrapper.classList.remove("open");
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") wrapper.classList.remove("open");
  });
});

// Логіка кнопки "Увійти / Мій профіль" у шапці
document.addEventListener("DOMContentLoaded", () => {
  const userMenu = document.querySelector(".user-menu");
  if (!userMenu) return;

  const links = userMenu.querySelectorAll(".lastdiv-a");
  if (!links.length) return;

  // припускаємо, що останній .lastdiv-a в .user-menu — це "Увійти/Мій профіль"
  const authLink = links[links.length - 1];
  const span = authLink.querySelector("span");

  const token = localStorage.getItem("authToken");

  if (token) {
    authLink.href = "profile.html";
    if (span) span.textContent = "Мій Профіль";
  } else {
    authLink.href = "singInForm.html";
    if (span) span.textContent = "Увійти";
  }
});
