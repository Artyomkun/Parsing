import express from 'express';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config(); // загружаем .env

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// используем PORT из env, по умолчанию 39144
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 39144;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Раздача статики
app.use(express.static(path.join(__dirname, 'Parsing/dist')));

// Простейший CORS proxy
app.get('/proxy', async (req, res) => {
  const url = req.query.url as string;
  if (!url) return res.status(400).send('No URL provided');
  try {
    const response = await fetch(url);
    const text = await response.text();
    res.send(text);
  } catch (e: never) {
    res.status(500).send(e.message);
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
