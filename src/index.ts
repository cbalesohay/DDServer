const myRequire = createRequire(import.meta.url);
myRequire('dotenv').config();
const express = myRequire('express');
const bodyParser = myRequire('body-parser');
const MONGODB_URI = process.env.API_KEY;
const mongoose = myRequire('mongoose');
const app = express();
var cors = myRequire('cors');
app.use(cors());
const PORT = process.env.PORT || 4000;
import { createRequire } from 'module';
import { OrchardManager } from './orchardManager.js';
export default app;

const orchard = new OrchardManager();

// Run function every 15 minutes to process data
// Doesnt need to be any more than 15 minutes, because the data wont change that often
setInterval(async () => {
  try {
    await orchard.process_data();
  } catch (error) {
    console.error('Error during periodic data processing:', error);
  }
}, 15 * 60 * 1000); // 15 minutes in milliseconds

// Async handler to catch errors in async routes
const asyncHandler = (fn: any) => (req: any, res: any, next: any) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Connection to SOAC test database
mongoose
  .connect(MONGODB_URI)
  .then(() => console.log('Connected to SOAC MongoDB'))
  .catch((err: any) => console.error('MongoDB connection error:', err));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());
app.listen(PORT, () => {
  console.log(`Server running on EC2 port ${PORT}`);
});

app.get('/send-fast', asyncHandler(orchard.send_fast_data)); // Sends most updated data
app.post('/new-date', asyncHandler(orchard.set_new_date.bind(orchard))); // Sets new date for the metric
app.post('/re-calc-data', asyncHandler(orchard.reset_year_data.bind(orchard))); // Resets the year data for the metric
app.get('/health', (req: any, res: any) => {
  res.status(200).send('OK'); // Health check route
});
// Error-handling middleware
app.use((err: any, req: any, res: any, next: any) => {
  console.error('Error occurred:', err.message);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
    },
  });
});