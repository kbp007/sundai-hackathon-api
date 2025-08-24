const fetch = require('node-fetch');

const API_BASE_URL = 'http://localhost:3000';

async function testAPIKeys() {
  console.log('🔑 Testing Sundai Hackathon API Key System...\n');

  try {
    // Test 1: Health check
    console.log('1. Testing health endpoint...');
    const healthResponse = await fetch(`${API_BASE_URL}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData.status);
    console.log('   Version:', healthData.version);
    console.log('   Features:', Object.keys(healthData.features).join(', '));
    console.log('');

    // Test 2: Public stats (no auth required)
    console.log('2. Testing public stats endpoint...');
    const statsResponse = await fetch(`${API_BASE_URL}/api/public/stats`);
    if (statsResponse.ok) {
      const statsData = await statsResponse.json();
      console.log('✅ Public stats retrieved');
      console.log('   Total participants:', statsData.hackathon_stats?.total_participants || 0);
      console.log('   Industry distribution:', Object.keys(statsData.hackathon_stats?.industry_distribution || {}).length, 'industries');
      console.log('');
    } else {
      console.log('❌ Failed to get public stats');
      console.log('');
    }

    // Test 3: API documentation
    console.log('3. Testing API documentation endpoint...');
    const docsResponse = await fetch(`${API_BASE_URL}/api/public/docs`);
    if (docsResponse.ok) {
      const docsData = await docsResponse.json();
      console.log('✅ API documentation retrieved');
      console.log('   API Name:', docsData.api_name);
      console.log('   Version:', docsData.version);
      console.log('   Authentication:', docsData.authentication.type);
      console.log('   Available endpoints:', Object.keys(docsData.endpoints).length, 'categories');
      console.log('');
    } else {
      console.log('❌ Failed to get API documentation');
      console.log('');
    }

    // Test 4: Public participants (no auth required)
    console.log('4. Testing public participants endpoint...');
    const participantsResponse = await fetch(`${API_BASE_URL}/api/public/participants?limit=5`);
    if (participantsResponse.ok) {
      const participantsData = await participantsResponse.json();
      console.log('✅ Public participants retrieved');
      console.log('   Participants found:', participantsData.participants?.length || 0);
      console.log('   Pagination:', participantsData.pagination);
      console.log('');
    } else {
      console.log('❌ Failed to get public participants');
      console.log('');
    }

    // Test 5: Available skills
    console.log('5. Testing skills endpoint...');
    const skillsResponse = await fetch(`${API_BASE_URL}/api/public/skills`);
    if (skillsResponse.ok) {
      const skillsData = await skillsResponse.json();
      console.log('✅ Skills retrieved');
      console.log('   Skills found:', skillsData.skills?.length || 0);
      console.log('   Top skills:', skillsData.skills?.slice(0, 3).map(s => s.skill).join(', ') || 'None');
      console.log('');
    } else {
      console.log('❌ Failed to get skills');
      console.log('');
    }

    // Test 6: Available industries
    console.log('6. Testing industries endpoint...');
    const industriesResponse = await fetch(`${API_BASE_URL}/api/public/industries`);
    if (industriesResponse.ok) {
      const industriesData = await industriesResponse.json();
      console.log('✅ Industries retrieved');
      console.log('   Industries found:', industriesData.industries?.length || 0);
      console.log('   Top industries:', industriesData.industries?.slice(0, 3).map(i => i.industry).join(', ') || 'None');
      console.log('');
    } else {
      console.log('❌ Failed to get industries');
      console.log('');
    }

    console.log('🎉 API Key System Test Completed Successfully!');
    console.log('');
    console.log('📋 Next Steps:');
    console.log('   1. Set up your environment variables in .env file');
    console.log('   2. Run "npm run setup" to create database tables');
    console.log('   3. Start the server with "npm run dev"');
    console.log('   4. Generate API keys for your local tools');
    console.log('');
    console.log('🔗 API Base URL:', API_BASE_URL);
    console.log('📚 Documentation:', `${API_BASE_URL}/api/public/docs`);
    console.log('');
    console.log('💡 API Key Usage Examples:');
    console.log('   - Generate key: POST /api/keys/generate');
    console.log('   - Use key: X-API-Key: your_key_here');
    console.log('   - Access data: GET /api/public/participants');
    console.log('   - AI matching: GET /api/matching/ai-matches');

  } catch (error) {
    console.error('❌ API test failed:', error.message);
    console.log('');
    console.log('🔧 Troubleshooting:');
    console.log('   1. Make sure the server is running on port 3000');
    console.log('   2. Check that all dependencies are installed');
    console.log('   3. Verify your environment variables are set');
  }
}

// Run the test
testAPIKeys(); 