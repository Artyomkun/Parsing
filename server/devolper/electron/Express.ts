import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ROOT = process.env.PROJECT_ROOT || __dirname;
const SERVER_PORT = Number(process.env.SERVER_PORT) || 39143;
const NODE_ENV = process.env.NODE_ENV || 'development';

const app = express();

// Настройка сервера Express
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Используем PROJECT_ROOT для обслуживания статических файлов
app.use(express.static(path.join(PROJECT_ROOT, 'public')));
app.use(express.static(path.join(PROJECT_ROOT, 'my-dynamic-site', 'public')));

// Базовый маршрут
app.get('/', (req, res) => {
  console.log('Request received from:', req.ip);
  console.log('Project root:', PROJECT_ROOT);
  res.send('Express server is running');
});

// API маршрут, который использует PROJECT_ROOT
app.get('/api/info', (req, res) => {
  res.json({
    projectRoot: PROJECT_ROOT,
    environment: NODE_ENV,
    port: SERVER_PORT,
    timestamp: new Date().toISOString()
  });
});

// Маршрут для отдачи статических файлов из проекта
app.get('/files/*', (req, res) => {
  const filePath = req.params[0];
  const fullPath = path.join(PROJECT_ROOT, filePath);
  
  // Проверяем, что файл находится внутри PROJECT_ROOT для безопасности
  if (!fullPath.startsWith(PROJECT_ROOT)) {
    return res.status(403).send('Access denied');
  }
  
  res.sendFile(fullPath, (err) => {
    if (err) {
      console.error('Error sending file:', err);
      res.status(404).send('File not found');
    }
  });
});

// Запуск сервера
app.listen(SERVER_PORT, () => {
  console.log(`Express сервер запущен на порту ${SERVER_PORT}, окружение: ${NODE_ENV}`);
  console.log(`Project root: ${PROJECT_ROOT}`);
});

export default app;