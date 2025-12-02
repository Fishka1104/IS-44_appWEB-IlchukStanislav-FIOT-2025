// server/admin.routes.js
const express = require("express");
const pool = require("./db");
const { authRequired, requireRole } = require("./auth.middleware");

const router = express.Router();

// Хелпер для мапінгу рядка з БД в об'єкт користувача
function mapUserRow(row) {
  const rolesArr = row.roles ? row.roles.split(",") : [];
  return {
    userId: row.user_id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phoneNumber: row.phone_number,
    createdAt: row.created_at,
    roles: rolesArr
  };
}

// ===== GET /api/admin/users =====
// Повертає всіх користувачів з ролями (тільки для Admin)
router.get("/users", authRequired, requireRole("Admin"), async (req, res) => {
  try {
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
      GROUP BY u.user_id
      ORDER BY u.created_at DESC
      `
    );

    const users = rows.map(mapUserRow);
    res.json({ users });
  } catch (err) {
    console.error("GET /api/admin/users error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Взяти role_id для Admin, створити якщо немає
async function getOrCreateAdminRoleId() {
  const [rows] = await pool.query(
    "SELECT role_id FROM Roles WHERE role_name = 'Admin' LIMIT 1"
  );
  if (rows.length) return rows[0].role_id;

  const [insert] = await pool.query(
    "INSERT INTO Roles (role_name) VALUES ('Admin')"
  );
  return insert.insertId;
}

// Хелпер щоб повернути оновленого користувача
async function getUserWithRoles(userId) {
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

  if (!rows.length) return null;
  return mapUserRow(rows[0]);
}

// ===== POST /api/admin/users/:id/make-admin =====
// Додати користувачу роль Admin
router.post(
  "/users/:id/make-admin",
  authRequired,
  requireRole("Admin"),
  async (req, res) => {
    try {
      const userId = Number(req.params.id);
      const adminRoleId = await getOrCreateAdminRoleId();

      // Перевіряємо, що користувач існує
      const [userRows] = await pool.query(
        "SELECT user_id FROM Users WHERE user_id = ?",
        [userId]
      );
      if (!userRows.length) {
        return res.status(404).json({ error: "User not found" });
      }

      // Додаємо роль Admin (INSERT IGNORE, щоб не було дубля)
      await pool.query(
        "INSERT IGNORE INTO UserRoles (user_id, role_id) VALUES (?, ?)",
        [userId, adminRoleId]
      );

      const user = await getUserWithRoles(userId);
      res.json({ user });
    } catch (err) {
      console.error("POST /api/admin/users/:id/make-admin error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// ===== POST /api/admin/users/:id/remove-admin =====
// Забрати роль Admin у користувача
router.post(
  "/users/:id/remove-admin",
  authRequired,
  requireRole("Admin"),
  async (req, res) => {
    try {
      const userId = Number(req.params.id);
      const [roleRows] = await pool.query(
        "SELECT role_id FROM Roles WHERE role_name = 'Admin' LIMIT 1"
      );

      if (!roleRows.length) {
        // Немає ролі Admin – по суті вже "знято"
        const user = await getUserWithRoles(userId);
        if (!user) return res.status(404).json({ error: "User not found" });
        return res.json({ user });
      }

      const adminRoleId = roleRows[0].role_id;

      await pool.query(
        "DELETE FROM UserRoles WHERE user_id = ? AND role_id = ?",
        [userId, adminRoleId]
      );

      const user = await getUserWithRoles(userId);
      if (!user) return res.status(404).json({ error: "User not found" });

      res.json({ user });
    } catch (err) {
      console.error("POST /api/admin/users/:id/remove-admin error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// ===== DELETE /api/admin/users/:id =====
// Видалити користувача
router.delete(
  "/users/:id",
  authRequired,
  requireRole("Admin"),
  async (req, res) => {
    try {
      const userId = Number(req.params.id);

      // (Опційно) Заборонити видаляти себе
      if (req.user && req.user.userId === userId) {
        return res
          .status(400)
          .json({ error: "Ви не можете видалити власний акаунт через API" });
      }

      const [result] = await pool.query(
        "DELETE FROM Users WHERE user_id = ?",
        [userId]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({ success: true });
    } catch (err) {
      // Може впасти через зовнішні ключі (Orders, Reviews, тощо)
      console.error("DELETE /api/admin/users/:id error:", err);
      if (err.code === "ER_ROW_IS_REFERENCED_2") {
        return res.status(409).json({
          error:
            "Користувача неможливо видалити, тому що він має повʼязані дані (замовлення/відгуки тощо)"
        });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

module.exports = router;
