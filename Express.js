const express = require('express');
const path = require('path');

const app = express();

// Раздача статических файлов из папки Parsing
app.use(express.static(path.join(__dirname, 'Parsing')));

app.listen(33369, () => {
  console.log('Сервер запущен на порту 33369');
});