// JS/admin.js

const ADMIN_API_URL = "http://localhost:1105/api/admin";
const AUTH_TOKEN_KEY = "authToken";
const CURRENT_USER_KEY = "currentUser";

document.addEventListener("DOMContentLoaded", () => {
  const errorBox = document.getElementById("admin-users-error");
  const tableBody = document.querySelector("#admin-users-table tbody");
  const countSpan = document.getElementById("admin-users-count");
  const refreshBtn = document.getElementById("admin-refresh-btn");

  function showError(message) {
    if (!errorBox) return;
    if (!message) {
      errorBox.style.display = "none";
      errorBox.textContent = "";
      return;
    }
    errorBox.style.display = "block";
    errorBox.textContent = message;
  }

  function buildAuthHeaders() {
    const headers = {};
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    return headers;
  }

  function getCurrentUser() {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  // ===== Перевірка доступу до admin-панелі =====
  const currentUser = getCurrentUser();
  const token = localStorage.getItem(AUTH_TOKEN_KEY);

  if (!token || !currentUser) {
    // не залогінений – на сторінку входу
    window.location.href = "singInForm.html";
    return;
  }

  const roles = Array.isArray(currentUser.roles) ? currentUser.roles : [];
  const isAdmin = roles.includes("Admin");

  if (!isAdmin) {
    alert("Доступ до admin-панелі мають тільки користувачі з роллю Admin.");
    window.location.href = "index.html";
    return;
  }

  // ===== Завантаження користувачів =====
  async function loadUsers() {
    showError("");
    if (!tableBody) return;

    tableBody.innerHTML = `
      <tr>
        <td colspan="7" class="admin-loading">Завантаження користувачів...</td>
      </tr>
    `;

    try {
      const res = await fetch(`${ADMIN_API_URL}/users`, {
        headers: buildAuthHeaders()
      });

      if (res.status === 401 || res.status === 403) {
        showError("Сесія закінчилась або недостатньо прав. Увійдіть знову.");
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(CURRENT_USER_KEY);
        setTimeout(() => {
          window.location.href = "singInForm.html";
        }, 1500);
        return;
      }

      const data = await res.json();
      if (!res.ok) {
        showError(data.error || "Помилка завантаження користувачів");
        tableBody.innerHTML = "";
        return;
      }

      const users = data.users || [];
      renderUsers(users);
    } catch (err) {
      console.error("loadUsers error:", err);
      showError("Помилка з'єднання з сервером");
      tableBody.innerHTML = "";
    }
  }

  function renderUsers(users) {
    if (!tableBody) return;

    if (countSpan) {
      countSpan.textContent = `Користувачів: ${users.length}`;
    }

    if (!users.length) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="7" class="admin-empty">Користувачів не знайдено.</td>
        </tr>
      `;
      return;
    }

    const currentAdminId = currentUser.userId;

    tableBody.innerHTML = "";
    users.forEach(user => {
      const tr = document.createElement("tr");

      const roles = Array.isArray(user.roles) ? user.roles : [];
      const isUserAdmin = roles.includes("Admin");

      const rolesHtml = roles.length
        ? roles
            .map(
              r =>
                `<span class="badge-role ${
                  r === "Admin" ? "badge-admin" : "badge-client"
                }">${r}</span>`
            )
            .join(" ")
        : `<span class="badge-role badge-empty">Без ролей</span>`;

      const createdAt = user.createdAt
        ? new Date(user.createdAt).toLocaleString("uk-UA")
        : "";

      // Кнопки дій
      let actionsHtml = "";

      // не даємо видаляти самого себе
      if (user.userId === currentAdminId) {
        actionsHtml = `<span class="admin-note">Це ви</span>`;
      } else {
        if (isUserAdmin) {
          actionsHtml += `<button class="admin-btn admin-remove" data-action="remove-admin" data-id="${user.userId}">Зняти Admin</button>`;
        } else {
          actionsHtml += `<button class="admin-btn admin-make" data-action="make-admin" data-id="${user.userId}">Зробити Admin</button>`;
        }
        actionsHtml += `<button class="admin-btn danger" data-action="delete" data-id="${user.userId}">Видалити</button>`;
      }

      tr.innerHTML = `
        <td>${user.userId}</td>
        <td>${(user.firstName || "") + " " + (user.lastName || "")}</td>
        <td>${user.email || ""}</td>
        <td>${user.phoneNumber || ""}</td>
        <td>${rolesHtml}</td>
        <td>${createdAt}</td>
        <td>${actionsHtml}</td>
      `;

      tableBody.appendChild(tr);
    });
  }

  // ===== Обробка кліків по кнопкам в таблиці (делегування) =====
  if (tableBody) {
    tableBody.addEventListener("click", async e => {
      const btn = e.target.closest("button[data-action]");
      if (!btn) return;

      const userId = Number(btn.dataset.id);
      const action = btn.dataset.action;

      if (!userId || !action) return;

      if (action === "make-admin") {
        if (
          !confirm(
            "Надати цьому користувачу роль Admin? Він зможе керувати товарами та користувачами."
          )
        ) {
          return;
        }
        await makeAdmin(userId);
      } else if (action === "remove-admin") {
        if (
          !confirm(
            "Зняти роль Admin з цього користувача? Він втратить доступ до admin-панелі."
          )
        ) {
          return;
        }
        await removeAdmin(userId);
      } else if (action === "delete") {
        if (
          !confirm(
            "Видалити цього користувача? Цю дію не можна буде скасувати."
          )
        ) {
          return;
        }
        await deleteUser(userId);
      }
    });
  }

  // ===== Окремі запити =====
  async function makeAdmin(userId) {
    showError("");
    try {
      const res = await fetch(
        `${ADMIN_API_URL}/users/${userId}/make-admin`,
        {
          method: "POST",
          headers: buildAuthHeaders()
        }
      );
      const data = await res.json();
      if (!res.ok) {
        showError(data.error || "Не вдалося додати роль Admin");
        return;
      }
      await loadUsers();
    } catch (err) {
      console.error("makeAdmin error:", err);
      showError("Помилка з'єднання з сервером");
    }
  }

  async function removeAdmin(userId) {
    showError("");
    try {
      const res = await fetch(
        `${ADMIN_API_URL}/users/${userId}/remove-admin`,
        {
          method: "POST",
          headers: buildAuthHeaders()
        }
      );
      const data = await res.json();
      if (!res.ok) {
        showError(data.error || "Не вдалося зняти роль Admin");
        return;
      }
      await loadUsers();
    } catch (err) {
      console.error("removeAdmin error:", err);
      showError("Помилка з'єднання з сервером");
    }
  }

  async function deleteUser(userId) {
    showError("");
    try {
      const res = await fetch(
        `${ADMIN_API_URL}/users/${userId}`,
        {
          method: "DELETE",
          headers: buildAuthHeaders()
        }
      );
      const data = await res.json();
      if (!res.ok) {
        showError(
          data.error || "Не вдалося видалити користувача (може є повʼязані дані)"
        );
        return;
      }
      await loadUsers();
    } catch (err) {
      console.error("deleteUser error:", err);
      showError("Помилка з'єднання з сервером");
    }
  }

  // Кнопка Оновити
  if (refreshBtn) {
    refreshBtn.addEventListener("click", () => {
      loadUsers();
    });
  }

  // Стартове завантаження
  loadUsers();
});
