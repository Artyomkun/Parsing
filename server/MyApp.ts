import express from "express";
import path from "path";
import dotenv from "dotenv";

dotenv.config(); // загружаем .env

const app = express();

// ===== Чтение порта из .env =====
const PORT = process.env.MyApp_PORT;
if (!PORT) {
  throw new Error("MyApp_PORT is not defined in .env");
}

// Middleware
app.use(express.json());

// Простейший API
app.post("/api/parse", (req, res) => {
  const { type, data } = req.body;
  let result = data;

  try {
    switch (type) {
      case "json":
        result = JSON.stringify(JSON.parse(data), null, 2);
        break;
      case "json2xml":
        result = `<root>${data}</root>`;
        break;
    }
    res.json({ result });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Отдаём React-приложение (через CDN)
app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "my-dynamic-site/index.html")); // если есть готовый HTML
});

// ===== Запуск сервера =====
app.listen(PORT, () => {
  console.log(`🚀 Server running`); // не показываем порт
});
