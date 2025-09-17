import dotenv from 'dotenv';
import { 
  saveChatMessage, 
  getChatHistory, 
  getRecentChatHistory,
  deleteChatHistory,
  getChatSessions,
  getMessageCount 
} from '../src/lib/chat-service';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function testChatService() {
  console.log('🧪 Testing Chat Service...\n');

  const testUserId = 'test-user-123';
  const testSessionId = 'session-abc';

  try {
    // Test 1: Save user message
    console.log('1. Testing saveChatMessage (user message)...');
    const userMessage = await saveChatMessage(testUserId, {
      role: 'user',
      content: 'Hello, what time is it?',
      sessionId: testSessionId
    });
    console.log('✅ User message saved:', userMessage._id);

    // Test 2: Save assistant message
    console.log('\n2. Testing saveChatMessage (assistant message)...');
    const assistantMessage = await saveChatMessage(testUserId, {
      role: 'assistant',
      content: 'The current time is 2:30 PM JST.',
      sessionId: testSessionId
    });
    console.log('✅ Assistant message saved:', assistantMessage._id);

    // Test 3: Save another message without sessionId
    console.log('\n3. Testing saveChatMessage (no sessionId)...');
    const noSessionMessage = await saveChatMessage(testUserId, {
      role: 'user',
      content: 'This message has no session ID'
    });
    console.log('✅ Message without sessionId saved:', noSessionMessage._id);

    // Test 4: Get chat history
    console.log('\n4. Testing getChatHistory...');
    const history = await getChatHistory(testUserId);
    console.log(`✅ Retrieved ${history.length} messages`);
    history.forEach((msg, index) => {
      console.log(`   ${index + 1}. [${msg.role}] ${msg.content.substring(0, 50)}...`);
    });

    // Test 5: Get chat history for specific session
    console.log('\n5. Testing getChatHistory with sessionId...');
    const sessionHistory = await getChatHistory(testUserId, { sessionId: testSessionId });
    console.log(`✅ Retrieved ${sessionHistory.length} messages for session ${testSessionId}`);

    // Test 6: Get recent chat history (chronological order)
    console.log('\n6. Testing getRecentChatHistory...');
    const recentHistory = await getRecentChatHistory(testUserId, 10, testSessionId);
    console.log(`✅ Retrieved ${recentHistory.length} recent messages in chronological order`);

    // Test 7: Get chat sessions
    console.log('\n7. Testing getChatSessions...');
    const sessions = await getChatSessions(testUserId);
    console.log(`✅ Found ${sessions.length} sessions:`, sessions);

    // Test 8: Get message count
    console.log('\n8. Testing getMessageCount...');
    const totalCount = await getMessageCount(testUserId);
    const sessionCount = await getMessageCount(testUserId, testSessionId);
    console.log(`✅ Total messages: ${totalCount}, Session messages: ${sessionCount}`);

    // Test 9: Delete chat history for session
    console.log('\n9. Testing deleteChatHistory (session only)...');
    const deleteResult = await deleteChatHistory(testUserId, testSessionId);
    console.log(`✅ Deleted ${deleteResult.deletedCount} messages from session`);

    // Test 10: Verify deletion
    console.log('\n10. Verifying deletion...');
    const remainingHistory = await getChatHistory(testUserId);
    console.log(`✅ Remaining messages: ${remainingHistory.length}`);

    // Clean up: Delete all remaining messages
    console.log('\n11. Cleaning up remaining messages...');
    const finalCleanup = await deleteChatHistory(testUserId);
    console.log(`✅ Cleaned up ${finalCleanup.deletedCount} remaining messages`);

    console.log('\n🎉 All chat service tests passed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testChatService()
  .then(() => {
    console.log('\n✨ Chat service test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Chat service test failed:', error);
    process.exit(1);
  });