const app = require('./app');

const PORT = process.env.PORT || 8888;

app.listen(PORT, () =>
  console.log(`digital signage server is listening on port ${PORT}`),
);
