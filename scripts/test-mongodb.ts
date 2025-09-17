import dotenv from 'dotenv';
import { testConnection } from '../src/lib/mongodb';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function main() {
  console.log('Testing Mongoose MongoDB connection...');
  console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'Set' : 'Not set');
  
  const isConnected = await testConnection();
  
  if (isConnected) {
    console.log('✅ Mongoose MongoDB connection test passed');
    process.exit(0);
  } else {
    console.log('❌ Mongoose MongoDB connection test failed');
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Test script error:', error);
  process.exit(1);
});