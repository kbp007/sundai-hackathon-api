const express = require('express');
const { supabase } = require('../config/supabase');
const Joi = require('joi');

const router = express.Router();

// Validation schemas
const updateProfileSchema = Joi.object({
  bio: Joi.string().max(500).optional(),
  skills: Joi.array().items(Joi.string()).optional(),
  interests: Joi.array().items(Joi.string()).optional(),
  experience_level: Joi.string().valid('beginner', 'intermediate', 'advanced', 'expert').optional(),
  github_url: Joi.string().uri().optional(),
  linkedin_url: Joi.string().uri().optional(),
  portfolio_url: Joi.string().uri().optional(),
  timezone: Joi.string().optional(),
  availability: Joi.object().optional(),
  project_preferences: Joi.object().optional(),
  team_size_preference: Joi.string().valid('2-3', '4-5', '6+').optional(),
  communication_preferences: Joi.object().optional()
});

// Get all profiles (with optional filtering)
router.get('/', async (req, res) => {
  try {
    const { 
      skills, 
      experience_level, 
      team_size_preference, 
      limit = 50, 
      offset = 0 
    } = req.query;

    let query = supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url, bio, skills, experience_level, team_size_preference, created_at')
      .order('created_at', { ascending: false });

    // Apply filters
    if (skills) {
      const skillArray = skills.split(',');
      query = query.overlaps('skills', skillArray);
    }

    if (experience_level) {
      query = query.eq('experience_level', experience_level);
    }

    if (team_size_preference) {
      query = query.eq('team_size_preference', team_size_preference);
    }

    // Apply pagination
    query = query.range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    const { data: profiles, error, count } = await query;

    if (error) throw error;

    res.json({
      profiles,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: count || profiles.length
      }
    });

  } catch (error) {
    console.error('Get profiles error:', error);
    res.status(500).json({ error: 'Failed to get profiles' });
  }
});

// Get specific profile by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json({ profile });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// Update own profile
router.put('/me', async (req, res) => {
  try {
    const { error, value } = updateProfileSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { data: profile, error: updateError } = await supabase
      .from('profiles')
      .update({
        ...value,
        updated_at: new Date().toISOString()
      })
      .eq('discord_id', req.user.discord_id)
      .select()
      .single();

    if (updateError) throw updateError;

    res.json({
      profile,
      message: 'Profile updated successfully'
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Get own profile
router.get('/me', async (req, res) => {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('discord_id', req.user.discord_id)
      .single();

    if (error || !profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json({ profile });

  } catch (error) {
    console.error('Get own profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// Search profiles
router.get('/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    const { limit = 20 } = req.query;

    // Search in username, full_name, bio, and skills
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url, bio, skills, experience_level')
      .or(`username.ilike.%${query}%,full_name.ilike.%${query}%,bio.ilike.%${query}%`)
      .limit(parseInt(limit));

    if (error) throw error;

    res.json({ profiles });

  } catch (error) {
    console.error('Search profiles error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// Get profiles by skills
router.get('/skills/:skill', async (req, res) => {
  try {
    const { skill } = req.params;
    const { limit = 20 } = req.query;

    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url, bio, skills, experience_level')
      .contains('skills', [skill])
      .limit(parseInt(limit));

    if (error) throw error;

    res.json({ profiles });

  } catch (error) {
    console.error('Get profiles by skill error:', error);
    res.status(500).json({ error: 'Failed to get profiles by skill' });
  }
});

// Get profile statistics
router.get('/stats/overview', async (req, res) => {
  try {
    // Get total count
    const { count: totalProfiles } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    // Get experience level distribution
    const { data: experienceStats } = await supabase
      .from('profiles')
      .select('experience_level');

    // Get most common skills
    const { data: allProfiles } = await supabase
      .from('profiles')
      .select('skills');

    const skillCounts = {};
    allProfiles?.forEach(profile => {
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

    const experienceDistribution = experienceStats?.reduce((acc, profile) => {
      const level = profile.experience_level || 'not_specified';
      acc[level] = (acc[level] || 0) + 1;
      return acc;
    }, {});

    res.json({
      total_profiles: totalProfiles,
      experience_distribution: experienceDistribution,
      top_skills: topSkills
    });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to get statistics' });
  }
});

module.exports = router; 