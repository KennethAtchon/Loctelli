// Simple test script to validate scraping MVP
const axios = require('axios');

const API_BASE = 'http://localhost:8000';
const API_KEY = process.env.API_KEY || 'your-api-key';

// Mock authentication for testing
const authHeaders = {
  'Authorization': 'Bearer test-jwt-token',
  'x-api-key': API_KEY,
  'Content-Type': 'application/json'
};

async function testScrapingMVP() {
  console.log('🧪 Testing Scraping MVP...\n');

  try {
    // 1. Test service status
    console.log('1️⃣ Testing service status...');
    const statusResponse = await axios.get(`${API_BASE}/scraping/service-status`, {
      headers: authHeaders
    });
    console.log('✅ Service Status:', statusResponse.data);

    // 2. Test URL validation
    console.log('\n2️⃣ Testing URL validation...');
    const urlTestResponse = await axios.post(`${API_BASE}/scraping/test-url`, {
      url: 'https://httpbin.org/html'
    }, {
      headers: authHeaders
    });
    console.log('✅ URL Validation:', urlTestResponse.data);

    // 3. Create a simple scraping job
    console.log('\n3️⃣ Creating scraping job...');
    const jobData = {
      name: 'Test Job - httpbin.org',
      description: 'MVP test job to scrape httpbin.org',
      targetUrl: 'https://httpbin.org/html',
      maxPages: 1,
      maxDepth: 1,
      selectors: {
        title: 'title',
        heading: 'h1'
      },
      delayMin: 1000,
      delayMax: 2000,
      timeout: 30000
    };

    const createResponse = await axios.post(`${API_BASE}/scraping/jobs`, jobData, {
      headers: authHeaders
    });
    console.log('✅ Job Created:', createResponse.data);

    const jobId = createResponse.data.data.id;

    // 4. Start the job
    console.log('\n4️⃣ Starting scraping job...');
    const startResponse = await axios.post(`${API_BASE}/scraping/jobs/${jobId}/start`, {}, {
      headers: authHeaders
    });
    console.log('✅ Job Started:', startResponse.data);

    // 5. Monitor job progress
    console.log('\n5️⃣ Monitoring job progress...');
    let jobCompleted = false;
    let attempts = 0;
    const maxAttempts = 30; // 30 seconds max

    while (!jobCompleted && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      
      const statusResponse = await axios.get(`${API_BASE}/scraping/jobs/${jobId}/status`, {
        headers: authHeaders
      });
      
      const status = statusResponse.data.data.status;
      console.log(`📊 Job Status: ${status} (attempt ${attempts + 1}/${maxAttempts})`);
      
      if (status === 'COMPLETED' || status === 'FAILED' || status === 'CANCELLED') {
        jobCompleted = true;
        
        // 6. Get results if completed
        if (status === 'COMPLETED') {
          console.log('\n6️⃣ Getting job results...');
          const resultsResponse = await axios.get(`${API_BASE}/scraping/jobs/${jobId}/results`, {
            headers: authHeaders
          });
          console.log('✅ Job Results:', JSON.stringify(resultsResponse.data, null, 2));
        }
      }
      
      attempts++;
    }

    if (!jobCompleted) {
      console.log('⏰ Job did not complete within timeout period');
    }

    console.log('\n🎉 MVP Test Complete!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    if (error.response?.status === 401) {
      console.log('💡 Note: This test requires proper authentication. Update authHeaders with valid JWT token.');
    }
  }
}

// Run the test
testScrapingMVP();