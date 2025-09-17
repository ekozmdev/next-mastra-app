import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function testChatAPI() {
  console.log('🧪 Testing Chat API Integration...\n');

  const baseUrl = 'http://localhost:3000';
  
  try {
    console.log('ℹ️  Note: This test requires the Next.js server to be running');
    console.log('ℹ️  Run "npm run dev" in another terminal first\n');

    // Test 1: Test chat history API without authentication (should fail)
    console.log('1. Testing chat history API without authentication...');
    try {
      const response = await fetch(`${baseUrl}/api/chat/history`);
      if (response.status === 401) {
        console.log('✅ Correctly rejected unauthenticated request');
      } else {
        console.log('❌ Should have rejected unauthenticated request');
      }
    } catch (error) {
      console.log('ℹ️  Server not running or connection failed:', (error as Error).message);
      console.log('ℹ️  Please start the development server with "npm run dev"');
      return;
    }

    // Test 2: Test chat API without authentication (should fail)
    console.log('\n2. Testing chat API without authentication...');
    const chatResponse = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Hello' }]
      })
    });
    
    if (chatResponse.status === 401) {
      console.log('✅ Correctly rejected unauthenticated chat request');
    } else {
      console.log('❌ Should have rejected unauthenticated chat request');
    }

    console.log('\n✅ API authentication tests completed');
    console.log('\nℹ️  To test authenticated functionality:');
    console.log('   1. Start the dev server: npm run dev');
    console.log('   2. Open http://localhost:3000');
    console.log('   3. Sign up/sign in');
    console.log('   4. Test the chat functionality in the UI');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testChatAPI()
  .then(() => {
    console.log('\n✨ Chat API test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Chat API test failed:', error);
    process.exit(1);
  });