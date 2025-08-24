const fetch = require('node-fetch');

const API_BASE_URL = 'http://localhost:3000';

async function testAPI() {
  console.log('🧪 Testing Sundai Hackathon API...\n');

  try {
    // Test health endpoint
    console.log('1. Testing health endpoint...');
    const healthResponse = await fetch(`${API_BASE_URL}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData.status);
    console.log('   Service:', healthData.service);
    console.log('   Version:', healthData.version);
    console.log('');

    // Test public stats endpoint
    console.log('2. Testing public stats endpoint...');
    const statsResponse = await fetch(`${API_BASE_URL}/api/public/stats`);
    if (statsResponse.ok) {
      const statsData = await statsResponse.json();
      console.log('✅ Public stats retrieved');
      console.log('   Total participants:', statsData.hackathon_stats?.total_participants || 0);
      console.log('   Top skills:', statsData.hackathon_stats?.top_skills?.slice(0, 3).map(s => s.skill).join(', ') || 'None');
      console.log('');
    } else {
      console.log('❌ Failed to get public stats');
      console.log('');
    }

    // Test public docs endpoint
    console.log('3. Testing API documentation endpoint...');
    const docsResponse = await fetch(`${API_BASE_URL}/api/public/docs`);
    if (docsResponse.ok) {
      const docsData = await docsResponse.json();
      console.log('✅ API documentation retrieved');
      console.log('   API Name:', docsData.api_name);
      console.log('   Version:', docsData.version);
      console.log('   Description:', docsData.description);
      console.log('');
    } else {
      console.log('❌ Failed to get API documentation');
      console.log('');
    }

    // Test public participants endpoint
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

    // Test public skills endpoint
    console.log('5. Testing public skills endpoint...');
    const skillsResponse = await fetch(`${API_BASE_URL}/api/public/skills`);
    if (skillsResponse.ok) {
      const skillsData = await skillsResponse.json();
      console.log('✅ Public skills retrieved');
      console.log('   Skills found:', skillsData.skills?.length || 0);
      console.log('   Top skills:', skillsData.skills?.slice(0, 3).map(s => s.skill).join(', ') || 'None');
      console.log('');
    } else {
      console.log('❌ Failed to get public skills');
      console.log('');
    }

    console.log('🎉 API test completed successfully!');
    console.log('');
    console.log('📋 Next steps:');
    console.log('   1. Set up your environment variables in .env file');
    console.log('   2. Run "npm run setup" to create database tables');
    console.log('   3. Start the server with "npm run dev"');
    console.log('   4. Test the Discord bot with "node discord-bot.js"');
    console.log('');
    console.log('🔗 API Base URL:', API_BASE_URL);
    console.log('📚 Documentation:', `${API_BASE_URL}/api/public/docs`);

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
testAPI(); 