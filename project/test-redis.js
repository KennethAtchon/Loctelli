const redis = require('redis');

async function testRedis() {
  console.log('🔍 Testing Redis connection...');
  
  const client = redis.createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
  });

  client.on('error', (err) => {
    console.error('❌ Redis Client Error:', err);
  });

  client.on('connect', () => {
    console.log('✅ Redis Client Connected');
  });

  try {
    await client.connect();
    
    // Test basic operations
    console.log('🔍 Testing SET operation...');
    await client.set('test_key', 'test_value');
    console.log('✅ SET operation successful');
    
    console.log('🔍 Testing GET operation...');
    const value = await client.get('test_key');
    console.log(`✅ GET operation successful: ${value}`);
    
    console.log('🔍 Testing DEL operation...');
    await client.del('test_key');
    console.log('✅ DEL operation successful');
    
    console.log('🔍 Testing GET after DEL...');
    const deletedValue = await client.get('test_key');
    console.log(`✅ GET after DEL: ${deletedValue} (should be null)`);
    
    await client.quit();
    console.log('✅ Redis test completed successfully');
    
  } catch (error) {
    console.error('❌ Redis test failed:', error);
  }
}

testRedis(); 