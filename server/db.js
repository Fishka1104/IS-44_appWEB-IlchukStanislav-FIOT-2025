const mysql = require("mysql2/promise");
const dotenv = require("dotenv");

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || "127.0.0.1",
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 1105,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "Fishka3211231104_",
  database: process.env.DB_NAME || "TechStore",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Невеликий тест, щоб при старті одразу було видно, що з БД є конект
(async () => {
  try {
    const conn = await pool.getConnection();
    await conn.query("SELECT 1");
    console.log("✅ MySQL connection OK");
    conn.release();
  } catch (err) {
    console.error("❌ MySQL connection FAILED:", err.message);
  }
})();

module.exports = pool;
