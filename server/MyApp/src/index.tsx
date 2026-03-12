import express, { Application, Request, Response } from 'express';

const app: Application = express();
const PORT = process.env.MyApp_PORT;

// Простейший API
app.get('/api/hello', (req: Request, res: Response) => {
  res.json({ message: 'Hello from backend!' });
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
