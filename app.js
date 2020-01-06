const express = require('express');
const app = express();

app.use(express.static(`${__dirname}/public`));

app.get('/', (req, res) => res.sendFile('index.html'));

app.post('/', (req, res) => res.statusCode(404).send('nothing here'));

app.use((err, req, res, next) => {
  // console.log(err.stack);

  const { statusCode, status } = err;

  res.status(statusCode || 500).json({
    status: status || 'error',
    message: err.message,
  });
});

module.exports = app;
