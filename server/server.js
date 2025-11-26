const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const productsRouter = require("./products.routes");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 1105;

// Middleware
app.use(cors());
app.use(express.json());

// Простий ping
app.get("/", (req, res) => {
  res.send("TechStore API is running");
});

// REST для товарів
app.use("/api/products", productsRouter);

// 404 для невідомих маршрутів
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Старт
app.listen(PORT, () => {
  console.log(`TechStore API listening on http://localhost:${PORT}`);
});
