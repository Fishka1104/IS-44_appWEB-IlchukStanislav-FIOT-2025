// server/auth.routes.js
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("./db");
const { authRequired } = require("./auth.middleware");

const router = express.Router();

// ====================== helpers ======================

function mapUserRow(row, rolesArr) {
  return {
    userId: row.user_id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phoneNumber: row.phone_number,
    createdAt: row.created_at,
    roles: rolesArr || []
  };
}

function signToken(user) {
  const payload = {
    userId: user.userId,
    roles: user.roles || []
  };

  const secret = process.env.JWT_SECRET || "dev-secret";
  const expiresIn = process.env.JWT_EXPIRES_IN || "1d";

  return jwt.sign(payload, secret, { expiresIn });
}

// ====================== routes ======================

/**
 * POST /api/auth/register
 * body: { name, email, password }
 * name → first_name, last_name поки що null
 */
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ error: "Поля 'name', 'email' та 'password' є обов'язковими" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ error: "Пароль має містити щонайменше 6 символів" });
    }

    // Перевіряємо, чи email вже використовується
    const [existing] = await pool.query(
      "SELECT user_id FROM Users WHERE email = ?",
      [email]
    );

    if (existing.length > 0) {
      return res.status(409).json({ error: "Користувач з таким email вже існує" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Додаємо користувача
    const [insertUser] = await pool.query(
      `
      INSERT INTO Users (first_name, last_name, email, phone_number, password_hash)
      VALUES (?, ?, ?, ?, ?)
      `,
      [name, null, email, null, passwordHash]
    );

    const userId = insertUser.insertId;

    // Беремо роль Client (якщо її немає – створюємо)
    let clientRoleId;

    const [roleRows] = await pool.query(
      "SELECT role_id FROM Roles WHERE role_name = 'Client' LIMIT 1"
    );

    if (roleRows.length > 0) {
      clientRoleId = roleRows[0].role_id;
    } else {
      const [insertRole] = await pool.query(
        "INSERT INTO Roles (role_name) VALUES ('Client')"
      );
      clientRoleId = insertRole.insertId;
    }

    // Прив'язуємо роль до користувача
    await pool.query(
      "INSERT INTO UserRoles (user_id, role_id) VALUES (?, ?)",
      [userId, clientRoleId]
    );

    // Читаємо користувача назад (щоб отримати created_at і ролі)
    const [userRows] = await pool.query(
      `
      SELECT 
        u.user_id,
        u.first_name,
        u.last_name,
        u.email,
        u.phone_number,
        u.created_at,
        GROUP_CONCAT(r.role_name) AS roles
      FROM Users u
      LEFT JOIN UserRoles ur ON ur.user_id = u.user_id
      LEFT JOIN Roles r ON r.role_id = ur.role_id
      WHERE u.user_id = ?
      GROUP BY u.user_id
      `,
      [userId]
    );

    const userRow = userRows[0];
    const rolesArr = userRow.roles ? userRow.roles.split(",") : ["Client"];
    const user = mapUserRow(userRow, rolesArr);
    const token = signToken(user);

    res.status(201).json({ token, user });
  } catch (err) {
    console.error("POST /api/auth/register error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /api/auth/login
 * body: { email, password }
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "Поля 'email' та 'password' є обов'язковими" });
    }

    const [rows] = await pool.query(
      `
      SELECT 
        u.user_id,
        u.first_name,
        u.last_name,
        u.email,
        u.phone_number,
        u.password_hash,
        u.created_at,
        GROUP_CONCAT(r.role_name) AS roles
      FROM Users u
      LEFT JOIN UserRoles ur ON ur.user_id = u.user_id
      LEFT JOIN Roles r ON r.role_id = ur.role_id
      WHERE u.email = ?
      GROUP BY u.user_id
      LIMIT 1
      `,
      [email]
    );

    if (!rows.length) {
      return res.status(401).json({ error: "Невірний email або пароль" });
    }

    const dbUser = rows[0];

    const passwordMatch = await bcrypt.compare(
      password,
      dbUser.password_hash
    );

    if (!passwordMatch) {
      return res.status(401).json({ error: "Невірний email або пароль" });
    }

    const rolesArr = dbUser.roles ? dbUser.roles.split(",") : [];
    const user = mapUserRow(dbUser, rolesArr);
    const token = signToken(user);

    res.json({ token, user });
  } catch (err) {
    console.error("POST /api/auth/login error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/auth/me
 * Повертає дані поточного користувача за токеном
 */
router.get("/me", authRequired, async (req, res) => {
  try {
    const userId = req.user.userId;

    const [rows] = await pool.query(
      `
      SELECT 
        u.user_id,
        u.first_name,
        u.last_name,
        u.email,
        u.phone_number,
        u.created_at,
        GROUP_CONCAT(r.role_name) AS roles
      FROM Users u
      LEFT JOIN UserRoles ur ON ur.user_id = u.user_id
      LEFT JOIN Roles r ON r.role_id = ur.role_id
      WHERE u.user_id = ?
      GROUP BY u.user_id
      `,
      [userId]
    );

    if (!rows.length) {
      return res.status(404).json({ error: "User not found" });
    }

    const dbUser = rows[0];
    const rolesArr = dbUser.roles ? dbUser.roles.split(",") : [];
    const user = mapUserRow(dbUser, rolesArr);

    res.json({ user });
  } catch (err) {
    console.error("GET /api/auth/me error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * PUT /api/auth/me
 * Оновлення профілю поточного користувача
 * body: { firstName?, lastName?, phoneNumber?, email? }
 */
router.put("/me", authRequired, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { firstName, lastName, phoneNumber, email } = req.body;

    if (!firstName && !lastName && !phoneNumber && !email) {
      return res
        .status(400)
        .json({ error: "Немає даних для оновлення" });
    }

    // Перевірка унікальності email (якщо змінюємо)
    if (email) {
      const [emailRows] = await pool.query(
        "SELECT user_id FROM Users WHERE email = ? AND user_id <> ?",
        [email, userId]
      );
      if (emailRows.length > 0) {
        return res
          .status(409)
          .json({ error: "Користувач з таким email вже існує" });
      }
    }

    // Перевірка унікальності телефону (якщо змінюємо, і поле не пусте)
    if (phoneNumber) {
      const [phoneRows] = await pool.query(
        "SELECT user_id FROM Users WHERE phone_number = ? AND user_id <> ?",
        [phoneNumber, userId]
      );
      if (phoneRows.length > 0) {
        return res
          .status(409)
          .json({ error: "Користувач з таким телефоном вже існує" });
      }
    }

    // Оновлюємо дані
    await pool.query(
      `
      UPDATE Users
      SET
        first_name = COALESCE(?, first_name),
        last_name = COALESCE(?, last_name),
        phone_number = COALESCE(?, phone_number),
        email = COALESCE(?, email)
      WHERE user_id = ?
      `,
      [
        firstName || null,
        lastName || null,
        phoneNumber || null,
        email || null,
        userId
      ]
    );

    // Читаємо оновленого юзера
    const [rows] = await pool.query(
      `
      SELECT 
        u.user_id,
        u.first_name,
        u.last_name,
        u.email,
        u.phone_number,
        u.created_at,
        GROUP_CONCAT(r.role_name) AS roles
      FROM Users u
      LEFT JOIN UserRoles ur ON ur.user_id = u.user_id
      LEFT JOIN Roles r ON r.role_id = ur.role_id
      WHERE u.user_id = ?
      GROUP BY u.user_id
      `,
      [userId]
    );

    if (!rows.length) {
      return res.status(404).json({ error: "User not found" });
    }

    const dbUser = rows[0];
    const rolesArr = dbUser.roles ? dbUser.roles.split(",") : [];
    const user = mapUserRow(dbUser, rolesArr);

    res.json({ user });
  } catch (err) {
    console.error("PUT /api/auth/me error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
