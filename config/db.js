/**
 * MongoDB Connection Configuration
 */

const mongoose = require('mongoose');
const dns = require('dns');

// On Windows dev machines, Node.js DNS resolver sometimes fails SRV queries.
// Configure public DNS servers to fix Atlas SRV resolution.
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  // Ignore if not supported in environment (e.g., some cloud runners)
}

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error('❌ MONGODB_URI environment variable is not set!');
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(uri);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);

    // In development, try falling back to local MongoDB
    if (process.env.NODE_ENV !== 'production') {
      const fallbackUri = 'mongodb://127.0.0.1:27017/ecohub';
      console.log(`🔄 Attempting fallback to local MongoDB: ${fallbackUri}...`);
      try {
        const conn = await mongoose.connect(fallbackUri);
        console.log(`✅ MongoDB Connected (Fallback): ${conn.connection.host}`);
        return;
      } catch (fallbackError) {
        console.error(`❌ Fallback MongoDB Error: ${fallbackError.message}`);
      }
    }

    process.exit(1);
  }
};

// Handle connection events
mongoose.connection.on('disconnected', () => {
  console.log('⚠️  MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
  console.log('✅ MongoDB reconnected');
});

module.exports = connectDB;


