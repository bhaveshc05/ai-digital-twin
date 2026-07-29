const app = require('./app');
require('dotenv').config({ path: '../.env' });

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Node.js backend server running on http://localhost:${PORT}`);
});