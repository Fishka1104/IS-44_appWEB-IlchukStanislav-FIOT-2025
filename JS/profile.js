// JS/profile.js
const AUTH_API_URL = "http://localhost:1105/api/auth";

document.addEventListener("DOMContentLoaded", () => {
  const logoutLink = document.getElementById("logout-link");

  const spanFirstName = document.getElementById("profile-first-name");
  const spanLastName = document.getElementById("profile-last-name");
  const spanPhone = document.getElementById("profile-phone");
  const spanEmail = document.getElementById("profile-email");
  const spanCreatedAt = document.getElementById("profile-created-at");

  const viewBlock = document.getElementById("profile-view");
  const editForm = document.getElementById("profile-edit-form");

  const btnEdit = document.getElementById("profile-edit-btn");
  const btnSave = document.getElementById("profile-save-btn");
  const btnCancel = document.getElementById("profile-cancel-btn");

  const inputFirstName = document.getElementById("edit-first-name");
  const inputLastName = document.getElementById("edit-last-name");
  const inputPhone = document.getElementById("edit-phone");
  const inputEmail = document.getElementById("edit-email");

  // ===== helper-и =====
  function formatDateTime(dtString) {
    if (!dtString) return "";
    const d = new Date(dtString);
    if (isNaN(d.getTime())) return dtString;
    return d.toLocaleString("uk-UA");
  }

  function fillViewFromUser(user) {
    if (!user) return;
    spanFirstName.textContent = user.firstName || "";
    spanLastName.textContent = user.lastName || "";
    spanPhone.textContent = user.phoneNumber || "";
    spanEmail.textContent = user.email || "";
    spanCreatedAt.textContent = formatDateTime(user.createdAt);
  }

  function fillEditFormFromUser(user) {
    if (!user) return;
    inputFirstName.value = user.firstName || "";
    inputLastName.value = user.lastName || "";
    inputPhone.value = user.phoneNumber || "";
    inputEmail.value = user.email || "";
  }

  function getUserFromStorage() {
    const raw = localStorage.getItem("currentUser");
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  function saveUserToStorage(user) {
    localStorage.setItem("currentUser", JSON.stringify(user));
  }

  function switchToViewMode() {
    viewBlock.style.display = "grid";
    editForm.style.display = "none";
    btnEdit.style.display = "inline-block";
    btnSave.style.display = "none";
    btnCancel.style.display = "none";
  }

  function switchToEditMode() {
    viewBlock.style.display = "none";
    editForm.style.display = "grid";
    btnEdit.style.display = "none";
    btnSave.style.display = "inline-block";
    btnCancel.style.display = "inline-block";
  }

  async function fetchMeAndRefresh() {
    const token = localStorage.getItem("authToken");
    if (!token) {
      // якщо токена немає — викидаємо на сторінку входу
      window.location.href = "singInForm.html";
      return;
    }

    try {
      const res = await fetch(`${AUTH_API_URL}/me`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem("authToken");
        localStorage.removeItem("currentUser");
        window.location.href = "singInForm.html";
        return;
      }

      const data = await res.json();
      if (res.ok && data.user) {
        saveUserToStorage(data.user);
        fillViewFromUser(data.user);
      } else {
        console.error("Помилка /me:", data);
      }
    } catch (err) {
      console.error("Помилка запиту /me:", err);
    }
  }

  // ===== логіка сторінки =====

  // якщо немає токена взагалі — на сторінку логіну
  const token = localStorage.getItem("authToken");
  if (!token) {
    window.location.href = "singInForm.html";
    return;
  }

  const storedUser = getUserFromStorage();
  if (storedUser) {
    fillViewFromUser(storedUser);
  }

  // дотягуємо свіжі дані з бекенда
  fetchMeAndRefresh();

  // ЛОГАУТ: чистимо все і перекидаємо на ГОЛОВНУ (index.html)
  if (logoutLink) {
    logoutLink.addEventListener("click", (e) => {
      e.preventDefault();
      localStorage.removeItem("authToken");
      localStorage.removeItem("currentUser");
      window.location.href = "index.html";
    });
  }

  // Перехід у режим редагування
  if (btnEdit) {
    btnEdit.addEventListener("click", (e) => {
      e.preventDefault();
      const user = getUserFromStorage();
      if (!user) return;
      fillEditFormFromUser(user);
      switchToEditMode();
    });
  }

  // Скасування редагування
  if (btnCancel) {
    btnCancel.addEventListener("click", (e) => {
      e.preventDefault();
      switchToViewMode();
    });
  }

  // Збереження змін
  if (btnSave) {
    btnSave.addEventListener("click", async (e) => {
      e.preventDefault();

      const token = localStorage.getItem("authToken");
      if (!token) {
        window.location.href = "singInForm.html";
        return;
      }

      const payload = {
        firstName: inputFirstName.value.trim(),
        lastName: inputLastName.value.trim(),
        phoneNumber: inputPhone.value.trim(),
        email: inputEmail.value.trim()
      };

      try {
        const res = await fetch(`${AUTH_API_URL}/me`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (!res.ok) {
          console.error("Profile update error:", data);
          alert(data.error || "Помилка збереження профілю");
          return;
        }

        if (data.user) {
          saveUserToStorage(data.user);
          fillViewFromUser(data.user);
        }

        switchToViewMode();
        alert("Профіль успішно оновлено");
      } catch (err) {
        console.error("Profile update error:", err);
        alert("Помилка з'єднання з сервером");
      }
    });
  }
});
