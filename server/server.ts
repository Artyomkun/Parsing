import 'dotenv/config';
import express from 'express';
import type { Request, Response } from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT;
const MONGODB_URI = process.env.MONGODB_URI;

const app = express();
let server: http.Server;

// Подключение к MongoDB
async function connectDatabase() {
  if (MONGODB_URI) {
    await mongoose.connect(MONGODB_URI);
    console.log('Подключено к MongoDB по MONGODB_URI');
  } else {
    const mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
    console.log('Подключено к временной базе MongoMemoryServer');
  }
}

// Модель пользователя
const userSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  email: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});
const User = mongoose.model('User', userSchema);

async function startServer() {
  await connectDatabase();

  app.use(express.json());
  app.use(express.static(path.join(__dirname, 'public')));

  app.get('/', (_req, res) => res.send('Server is alive'));

  // Генерация случайного ID через uuidv4
  app.post('/generate-secure-id', (_req, res) => {
    const id = uuidv4();
    res.json({ id });
  });

  // Регистрация пользователя
  interface RegisterBody {
    username: string;
    email: string;
  }

  app.post('/register', async (req: Request<{}, {}, RegisterBody>, res: Response) => {
    try {
      const { username, email } = req.body;
      if (!username || !email) {
        return res.status(400).json({ error: 'username и email обязательны' });
      }

      const existingUser = await User.findOne({ $or: [{ username }, { email }] }).exec();
      if (existingUser) {
        return res.status(409).json({ error: 'Пользователь с таким именем или email уже существует' });
      }

      const newUser = new User({ id: uuidv4(), username, email });
      await newUser.save();

      res.status(201).json(newUser);
    } catch (err) {
      console.error('Ошибка регистрации:', err);
      res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
  });

  server = http.createServer(app);
  server.listen(PORT, () => {
    console.log(`Сервер запущен по адресу http://localhost:${PORT}`);
  });
}

process.on('SIGINT', () => server?.close());
process.on('SIGTERM', () => server?.close());

startServer().catch((err) => {
  console.error('Ошибка при запуске:', err);
  process.exit(1);
});
