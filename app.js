const express = require('express');
const fs = require('fs');
const app = express();
const multer = require('multer');
const moment = require('moment');
const { execSync } = require('child_process');

const storage = multer.diskStorage({
  destination: './uploads',
  filename: (req, file, cb) => cb(null, file.originalname),
});

const upload = multer({ storage });

app.use(express.static(`${__dirname}/public`));

app.use((req, res, next) => {
  console.log(
    `Method: '${req.method}', URL: ${req.originalUrl}, Body: ${JSON.stringify(
      req.body,
    )}`,
  );
  next();
});

app.get('/', (req, res) => res.sendFile('index.html'));

app.post('/upload', upload.single('upload-pdf'), (req, res) => {
  console.log('submitted!', req.file, JSON.stringify(req.body));
  res.json(req.body);
});

app.use((err, req, res, next) => {
  const { statusCode, status } = err;

  res.status(statusCode || 500).json({
    status: status || 'error',
    message: err.message,
  });
});

module.exports = app;
