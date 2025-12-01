// JS/auth.js
const AUTH_API_URL = "http://localhost:1105/api/auth";

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.querySelector(".login-container .auth-form-card");
  const signupForm = document.querySelector(".signup-container .auth-form-card");

  const container = document.querySelector(".auth-container");
  let errorBox = document.createElement("div");
  errorBox.className = "auth-error";
  container.prepend(errorBox);

  function showError(message) {
    errorBox.textContent = message || "";
    if (message) {
      errorBox.style.display = "block";
    } else {
      errorBox.style.display = "none";
    }
  }

  async function handleLogin(event) {
    event.preventDefault();
    showError("");

    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value;

    if (!email || !password) {
      showError("Введіть email та пароль");
      return;
    }

    try {
      const res = await fetch(`${AUTH_API_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        showError(data.error || "Помилка авторизації");
        return;
      }

      // Зберігаємо токен і юзера
      localStorage.setItem("authToken", data.token);
      localStorage.setItem("currentUser", JSON.stringify(data.user));

      // Переходимо в кабінет
      window.location.href = "profile.html";
    } catch (err) {
      console.error("Login error:", err);
      showError("Помилка з'єднання з сервером");
    }
  }

  async function handleSignup(event) {
    event.preventDefault();
    showError("");

    const name = document.getElementById("signup-name").value.trim();
    const email = document.getElementById("signup-email").value.trim();
    const password = document.getElementById("signup-password").value;
    const confirmPassword = document.getElementById("confirm-password").value;

    if (!name || !email || !password || !confirmPassword) {
      showError("Заповніть усі поля форми");
      return;
    }

    if (password !== confirmPassword) {
      showError("Паролі не співпадають");
      return;
    }

    try {
      const res = await fetch(`${AUTH_API_URL}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ name, email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        showError(data.error || "Помилка реєстрації");
        return;
      }

      // Зберігаємо токен і юзера
      localStorage.setItem("authToken", data.token);
      localStorage.setItem("currentUser", JSON.stringify(data.user));

      // Переходимо в кабінет
      window.location.href = "profile.html";
    } catch (err) {
      console.error("Register error:", err);
      showError("Помилка з'єднання з сервером");
    }
  }

  if (loginForm) {
    loginForm.addEventListener("submit", handleLogin);
  }
  if (signupForm) {
    signupForm.addEventListener("submit", handleSignup);
  }
});
