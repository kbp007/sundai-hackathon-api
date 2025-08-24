const express = require('express');
const { supabase } = require('../config/supabase');

const router = express.Router();

// Get public hackathon statistics
router.get('/stats', async (req, res) => {
  try {
    // Get total participants
    const { count: totalParticipants } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    // Get experience level distribution
    const { data: experienceData } = await supabase
      .from('profiles')
      .select('experience_level');

    // Get skills distribution
    const { data: skillsData } = await supabase
      .from('profiles')
      .select('skills');

    // Get team size preferences
    const { data: teamSizeData } = await supabase
      .from('profiles')
      .select('team_size_preference');

    // Get LinkedIn industry distribution
    const { data: industryData } = await supabase
      .from('profiles')
      .select('linkedin_industry');

    // Calculate statistics
    const experienceDistribution = experienceData?.reduce((acc, profile) => {
      const level = profile.experience_level || 'not_specified';
      acc[level] = (acc[level] || 0) + 1;
      return acc;
    }, {});

    const skillCounts = {};
    skillsData?.forEach(profile => {
      if (profile.skills) {
        profile.skills.forEach(skill => {
          skillCounts[skill] = (skillCounts[skill] || 0) + 1;
        });
      }
    });

    const topSkills = Object.entries(skillCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([skill, count]) => ({ skill, count }));

    const teamSizeDistribution = teamSizeData?.reduce((acc, profile) => {
      const size = profile.team_size_preference || 'not_specified';
      acc[size] = (acc[size] || 0) + 1;
      return acc;
    }, {});

    const industryDistribution = industryData?.reduce((acc, profile) => {
      const industry = profile.linkedin_industry || 'not_specified';
      acc[industry] = (acc[industry] || 0) + 1;
      return acc;
    }, {});

    // Get recent activity
    const { data: recentProfiles } = await supabase
      .from('profiles')
      .select('username, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    res.json({
      hackathon_stats: {
        total_participants: totalParticipants,
        experience_distribution: experienceDistribution,
        top_skills: topSkills,
        team_size_preferences: teamSizeDistribution,
        industry_distribution: industryDistribution,
        recent_joiners: recentProfiles
      },
      last_updated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Get public stats error:', error);
    res.status(500).json({ error: 'Failed to get statistics' });
  }
});

// Get public participant directory (limited info)
router.get('/participants', async (req, res) => {
  try {
    const { limit = 50, offset = 0, skills, experience_level, industry } = req.query;

    let query = supabase
      .from('profiles')
      .select('username, full_name, avatar_url, bio, skills, experience_level, team_size_preference, linkedin_headline, linkedin_industry, created_at')
      .order('created_at', { ascending: false });

    // Apply filters
    if (skills) {
      const skillArray = skills.split(',');
      query = query.overlaps('skills', skillArray);
    }

    if (experience_level) {
      query = query.eq('experience_level', experience_level);
    }

    if (industry) {
      query = query.eq('linkedin_industry', industry);
    }

    // Apply pagination
    query = query.range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    const { data: participants, error, count } = await query;

    if (error) throw error;

    res.json({
      participants,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: count || participants.length
      }
    });

  } catch (error) {
    console.error('Get participants error:', error);
    res.status(500).json({ error: 'Failed to get participants' });
  }
});

// Search participants publicly
router.get('/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    const { limit = 20 } = req.query;

    const { data: participants, error } = await supabase
      .from('profiles')
      .select('username, full_name, avatar_url, bio, skills, experience_level, linkedin_headline, linkedin_industry')
      .or(`username.ilike.%${query}%,full_name.ilike.%${query}%,bio.ilike.%${query}%,linkedin_headline.ilike.%${query}%`)
      .limit(parseInt(limit));

    if (error) throw error;

    res.json({ participants });

  } catch (error) {
    console.error('Search participants error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// Get participants by skill
router.get('/skills/:skill', async (req, res) => {
  try {
    const { skill } = req.params;
    const { limit = 20 } = req.query;

    const { data: participants, error } = await supabase
      .from('profiles')
      .select('username, full_name, avatar_url, bio, skills, experience_level, linkedin_headline')
      .contains('skills', [skill])
      .limit(parseInt(limit));

    if (error) throw error;

    res.json({ participants });

  } catch (error) {
    console.error('Get participants by skill error:', error);
    res.status(500).json({ error: 'Failed to get participants by skill' });
  }
});

// Get participants by industry
router.get('/industry/:industry', async (req, res) => {
  try {
    const { industry } = req.params;
    const { limit = 20 } = req.query;

    const { data: participants, error } = await supabase
      .from('profiles')
      .select('username, full_name, avatar_url, bio, skills, experience_level, linkedin_headline, linkedin_industry')
      .eq('linkedin_industry', industry)
      .limit(parseInt(limit));

    if (error) throw error;

    res.json({ participants });

  } catch (error) {
    console.error('Get participants by industry error:', error);
    res.status(500).json({ error: 'Failed to get participants by industry' });
  }
});

// Get API documentation
router.get('/docs', async (req, res) => {
  res.json({
    api_name: 'Sundai Hackathon API',
    version: '2.0.0',
    description: 'Public hackathon database with API key authentication and AI-powered team matching',
    base_url: `${req.protocol}://${req.get('host')}/api`,
    authentication: {
      type: 'API Key',
      header: 'X-API-Key: your_api_key_here',
      note: 'Generate API keys at /api/keys/generate'
    },
    endpoints: {
      public: {
        'GET /public/stats': 'Get hackathon statistics',
        'GET /public/participants': 'Get public participant directory',
        'GET /public/search/:query': 'Search participants',
        'GET /public/skills/:skill': 'Get participants by skill',
        'GET /public/industry/:industry': 'Get participants by industry',
        'GET /public/docs': 'API documentation'
      },
      api_keys: {
        'POST /api/keys/generate': 'Generate new API key',
        'GET /api/keys/list': 'List your API keys',
        'PUT /api/keys/:keyId': 'Update API key',
        'DELETE /api/keys/:keyId': 'Revoke API key',
        'GET /api/keys/:keyId/stats': 'Get API key usage stats'
      },
      auth: {
        'POST /auth/register': 'Register/update profile',
        'GET /auth/me': 'Get current user',
        'POST /auth/refresh': 'Refresh token'
      },
      profiles: {
        'GET /profiles': 'Get all profiles (API key required)',
        'GET /profiles/me': 'Get own profile',
        'PUT /profiles/me': 'Update own profile',
        'GET /profiles/:id': 'Get specific profile',
        'GET /profiles/search/:query': 'Search profiles',
        'GET /profiles/skills/:skill': 'Get profiles by skill',
        'GET /profiles/stats/overview': 'Get profile statistics'
      },
      matching: {
        'GET /matching/ai-matches': 'Get AI-powered matches',
        'GET /matching/history': 'Get match history',
        'POST /matching/:matchId/respond': 'Accept/reject match',
        'POST /matching/team-recommendations': 'Get team recommendations'
      }
    },
    data_schema: {
      profiles: {
        basic_info: ['username', 'full_name', 'email', 'bio', 'avatar_url'],
        skills: ['skills', 'experience_level', 'preferred_technologies'],
        linkedin: ['linkedin_headline', 'linkedin_industry', 'linkedin_experience', 'linkedin_education'],
        hackathon: ['hackathon_experience', 'hackathon_wins', 'preferred_domains', 'collaboration_style'],
        preferences: ['team_size_preference', 'time_commitment', 'remote_preference']
      }
    },
    rate_limiting: {
      window: '15 minutes',
      limit: '100 requests per IP'
    },
    contact: {
      project: 'Sundai Hackathon API',
      description: 'Open source hackathon networking tool'
    }
  });
});

// Get API health status
router.get('/health', async (req, res) => {
  try {
    // Test database connection
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    const dbStatus = error ? 'error' : 'healthy';

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: dbStatus,
        api: 'healthy'
      },
      version: '2.0.0',
      features: {
        api_keys: true,
        linkedin_integration: true,
        ai_matching: true,
        public_access: true
      }
    });

  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'error',
        api: 'error'
      },
      error: error.message
    });
  }
});

// Get available skills
router.get('/skills', async (req, res) => {
  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('skills');

    if (error) throw error;

    const skillCounts = {};
    profiles?.forEach(profile => {
      if (profile.skills) {
        profile.skills.forEach(skill => {
          skillCounts[skill] = (skillCounts[skill] || 0) + 1;
        });
      }
    });

    const skills = Object.entries(skillCounts)
      .sort(([,a], [,b]) => b - a)
      .map(([skill, count]) => ({ skill, count }));

    res.json({ skills });

  } catch (error) {
    console.error('Get skills error:', error);
    res.status(500).json({ error: 'Failed to get skills' });
  }
});

// Get available industries
router.get('/industries', async (req, res) => {
  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('linkedin_industry');

    if (error) throw error;

    const industryCounts = {};
    profiles?.forEach(profile => {
      if (profile.linkedin_industry) {
        industryCounts[profile.linkedin_industry] = (industryCounts[profile.linkedin_industry] || 0) + 1;
      }
    });

    const industries = Object.entries(industryCounts)
      .sort(([,a], [,b]) => b - a)
      .map(([industry, count]) => ({ industry, count }));

    res.json({ industries });

  } catch (error) {
    console.error('Get industries error:', error);
    res.status(500).json({ error: 'Failed to get industries' });
  }
});

// Get experience levels
router.get('/experience-levels', async (req, res) => {
  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('experience_level');

    if (error) throw error;

    const levelCounts = profiles?.reduce((acc, profile) => {
      const level = profile.experience_level || 'not_specified';
      acc[level] = (acc[level] || 0) + 1;
      return acc;
    }, {});

    const levels = Object.entries(levelCounts || {})
      .map(([level, count]) => ({ level, count }))
      .sort((a, b) => b.count - a.count);

    res.json({ experience_levels: levels });

  } catch (error) {
    console.error('Get experience levels error:', error);
    res.status(500).json({ error: 'Failed to get experience levels' });
  }
});

module.exports = router; 