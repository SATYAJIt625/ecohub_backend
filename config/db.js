/**
 * MongoDB Connection Configuration
 */

const mongoose = require('mongoose');
const dns = require('dns');

// On Windows, Node.js DNS resolver sometimes fails SRV queries for MongoDB Atlas.
// Configure fallback public DNS servers for SRV resolution if needed.
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  // Ignore if not supported in environment
}

const connectDB = async () => {
  const primaryUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ecohub';
  const fallbackUri = 'mongodb://127.0.0.1:27017/ecohub';

  try {
    const conn = await mongoose.connect(primaryUri);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return;
  } catch (error) {
    console.error(`❌ MongoDB Primary Connection Error (${primaryUri.split('@').pop()}): ${error.message}`);
    
    // If primary failed and it wasn't the local fallback, attempt local MongoDB fallback
    if (primaryUri !== fallbackUri) {
      console.log(`🔄 Attempting fallback connection to local MongoDB: ${fallbackUri}...`);
      try {
        const conn = await mongoose.connect(fallbackUri);
        console.log(`✅ MongoDB Connected (Fallback): ${conn.connection.host}`);
        return;
      } catch (fallbackError) {
        console.error(`❌ Fallback MongoDB Connection Error: ${fallbackError.message}`);
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

