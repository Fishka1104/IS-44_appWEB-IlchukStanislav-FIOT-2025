const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const productsRouter = require("./products.routes");
const authRouter = require("./auth.routes");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 1105;

// Глобальні middleware
app.use(cors());          // Дозволяє CORS-запити з фронтенду
app.use(express.json());  // Дозволяє приймати JSON у тілі запитів

// Простий маршрут-перевірка
app.get("/", (req, res) => {
  res.send("TechStore API is running");
});

// REST для товарів
app.use("/api/products", productsRouter);

app.use("/api/auth", authRouter);

// 404 для невідомих маршрутів
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Старт
app.listen(PORT, () => {
  console.log(`TechStore API listening on http://localhost:${PORT}`);
});

