import 'dotenv/config';
import app from './app.js';
import { initializeDatabase } from './database/connection.js';

const port = Number(process.env.PORT || 10000);
initializeDatabase();
app.listen(port, '0.0.0.0', () => {
  console.log(`Editorial CMS listening on port ${port}`);
});
