const express = require("express");
const router = express.Router();
const pool = require("./db");

// Мапа "ключ категорії на фронті" -> category_id в БД
// ПІДРЕДАГУЙ під свої реальні ID з таблиці Categories
const CATEGORY_KEY_TO_ID = {
  smartphones: 1,
  tv: 2,
  notebooks: 3,
  kitchen: 4,
  "home-tech": 5,
  gaming: 6,
  dishes: 7,
  "photo-video": 8,
  beauty: 9,
  "auto-tools": 10,
  sport: 11,
  "home-garden": 12,
  kids: 13
};

// ================== GET /api/products ==================
// Повертає список товарів з фільтрами
// Приклади:
//   GET /api/products
//   GET /api/products?categoryKey=notebooks
//   GET /api/products?categoryId=3
//   GET /api/products?brand=Apple&type=office
//   GET /api/products?minPrice=1000&maxPrice=20000&sort=price-asc
//   GET /api/products?search=Samsung
router.get("/", async (req, res) => {
  try {
    const {
      categoryKey,
      categoryId,
      search,
      brand,
      type, // product_type
      minPrice,
      maxPrice,
      sort
    } = req.query;

    let sql = `
      SELECT 
        product_id,
        category_id,
        name,
        brand,
        product_type,
        description,
        price,
        stock_quantity,
        sku,
        created_at
      FROM Products
      WHERE 1=1
    `;
    const params = [];

    // категорія
    let catId = categoryId ? Number(categoryId) : null;
    if (!catId && categoryKey) {
      catId = CATEGORY_KEY_TO_ID[categoryKey] || null;
    }
    if (catId) {
      sql += " AND category_id = ?";
      params.push(catId);
    }

    // бренд
    if (brand) {
      sql += " AND brand = ?";
      params.push(brand);
    }

    // тип / призначення
    if (type) {
      sql += " AND product_type = ?";
      params.push(type);
    }

    // діапазон ціни
    if (minPrice) {
      sql += " AND price >= ?";
      params.push(Number(minPrice));
    }
    if (maxPrice) {
      sql += " AND price <= ?";
      params.push(Number(maxPrice));
    }

    // пошук
    if (search) {
      const like = `%${search}%`;
      sql +=
        " AND (name LIKE ? OR description LIKE ? OR sku LIKE ? OR brand LIKE ?)";
      params.push(like, like, like, like);
    }

    // сортування
    if (sort === "price-asc") {
      sql += " ORDER BY price ASC";
    } else if (sort === "price-desc") {
      sql += " ORDER BY price DESC";
    } else {
      sql += " ORDER BY product_id ASC";
    }

    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error("GET /api/products error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ================== GET /api/products/:id ==================
router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [rows] = await pool.query(
      `
      SELECT 
        product_id,
        category_id,
        name,
        brand,
        product_type,
        description,
        price,
        stock_quantity,
        sku,
        created_at
      FROM Products
      WHERE product_id = ?
      `,
      [id]
    );

    if (!rows.length) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error("GET /api/products/:id error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ================== POST /api/products ==================
// Створити новий товар
router.post("/", async (req, res) => {
  try {
    const {
      category_id,
      categoryKey, // можна передавати або category_id, або categoryKey
      name,
      brand,
      product_type,
      description,
      price,
      stock_quantity,
      sku
    } = req.body;

    let catId = category_id ? Number(category_id) : null;
    if (!catId && categoryKey) {
      catId = CATEGORY_KEY_TO_ID[categoryKey] || null;
    }

    if (!name || !price) {
      return res
        .status(400)
        .json({ error: "Fields 'name' and 'price' are required" });
    }

    const numericPrice = Number(price);
    const stockQty =
      stock_quantity !== undefined && stock_quantity !== null
        ? Number(stock_quantity)
        : 0;

    if (numericPrice <= 0) {
      return res
        .status(400)
        .json({ error: "Price must be a positive number" });
    }

    if (stockQty < 0) {
      return res
        .status(400)
        .json({ error: "stock_quantity cannot be negative" });
    }

    const [result] = await pool.query(
      `
      INSERT INTO Products
        (category_id, name, brand, product_type, description, price, stock_quantity, sku)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [catId, name, brand || null, product_type || null, description || null, numericPrice, stockQty, sku || null]
    );

    const insertedId = result.insertId;

    const [rows] = await pool.query(
      `
      SELECT 
        product_id,
        category_id,
        name,
        brand,
        product_type,
        description,
        price,
        stock_quantity,
        sku,
        created_at
      FROM Products
      WHERE product_id = ?
      `,
      [insertedId]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    // можливий дублікат SKU
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "SKU must be unique" });
    }

    console.error("POST /api/products error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ================== PUT /api/products/:id ==================
// Оновити товар (повна/часткова заміна полів)
router.put("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const {
      category_id,
      categoryKey,
      name,
      brand,
      product_type,
      description,
      price,
      stock_quantity,
      sku
    } = req.body;

    let catId = category_id ? Number(category_id) : null;
    if (!catId && categoryKey) {
      catId = CATEGORY_KEY_TO_ID[categoryKey] || null;
    }

    // спочатку перевіримо, що товар існує
    const [existingRows] = await pool.query(
      "SELECT * FROM Products WHERE product_id = ?",
      [id]
    );
    if (!existingRows.length) {
      return res.status(404).json({ error: "Product not found" });
    }
    const existing = existingRows[0];

    const newName = name !== undefined ? name : existing.name;
    const newBrand = brand !== undefined ? brand : existing.brand;
    const newType =
      product_type !== undefined ? product_type : existing.product_type;
    const newDescription =
      description !== undefined ? description : existing.description;
    const newPrice =
      price !== undefined ? Number(price) : Number(existing.price);
    const newStock =
      stock_quantity !== undefined
        ? Number(stock_quantity)
        : Number(existing.stock_quantity);
    const newSku = sku !== undefined ? sku : existing.sku;
    const newCatId =
      catId !== null && catId !== undefined ? catId : existing.category_id;

    if (!newName || newPrice <= 0) {
      return res
        .status(400)
        .json({ error: "Invalid name or price in update" });
    }
    if (newStock < 0) {
      return res
        .status(400)
        .json({ error: "stock_quantity cannot be negative" });
    }

    await pool.query(
      `
      UPDATE Products
      SET
        category_id = ?,
        name = ?,
        brand = ?,
        product_type = ?,
        description = ?,
        price = ?,
        stock_quantity = ?,
        sku = ?
      WHERE product_id = ?
      `,
      [
        newCatId,
        newName,
        newBrand || null,
        newType || null,
        newDescription || null,
        newPrice,
        newStock,
        newSku || null,
        id
      ]
    );

    const [rows] = await pool.query(
      `
      SELECT 
        product_id,
        category_id,
        name,
        brand,
        product_type,
        description,
        price,
        stock_quantity,
        sku,
        created_at
      FROM Products
      WHERE product_id = ?
      `,
      [id]
    );

    res.json(rows[0]);
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "SKU must be unique" });
    }

    console.error("PUT /api/products/:id error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ================== DELETE /api/products/:id ==================
router.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    const [result] = await pool.query(
      "DELETE FROM Products WHERE product_id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json({ success: true });
  } catch (err) {
    // Наприклад, може впасти через FK (Orders -> OrderItems -> Products)
    console.error("DELETE /api/products/:id error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
