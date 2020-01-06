const express = require('express');
const app = express();

app.use(express.json());
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

app.post('/upload', (req, res) => {
  console.log('submitted!');
  res.send('done');
});

app.use((err, req, res, next) => {
  const { statusCode, status } = err;

  res.status(statusCode || 500).json({
    status: status || 'error',
    message: err.message,
  });
});

module.exports = app;
