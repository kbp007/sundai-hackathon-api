const express = require('express');
const { supabase } = require('../config/supabase');
const { generateToken } = require('../middleware/auth');
const Joi = require('joi');

const router = express.Router();

// Validation schemas
const profileSchema = Joi.object({
  discord_id: Joi.string().required(),
  username: Joi.string().required(),
  email: Joi.string().email().optional(),
  full_name: Joi.string().optional(),
  avatar_url: Joi.string().uri().optional(),
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

// Discord OAuth callback
router.post('/discord/callback', async (req, res) => {
  try {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({ error: 'Authorization code required' });
    }

    // Exchange code for Discord token
    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID,
        client_secret: process.env.DISCORD_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: `${process.env.API_BASE_URL}/api/auth/discord/callback`,
        scope: 'identify email',
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      return res.status(400).json({ error: 'Failed to exchange code for token' });
    }

    // Get user info from Discord
    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    const userData = await userResponse.json();

    if (!userResponse.ok) {
      return res.status(400).json({ error: 'Failed to get user info' });
    }

    // Check if user exists in database
    let { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('discord_id', userData.id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw error;
    }

    if (!profile) {
      // Create new profile
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          discord_id: userData.id,
          username: userData.username,
          email: userData.email,
          avatar_url: userData.avatar ? `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png` : null,
          full_name: userData.global_name || userData.username
        })
        .select()
        .single();

      if (createError) {
        throw createError;
      }

      profile = newProfile;
    }

    // Generate JWT token
    const token = generateToken(userData.id);

    res.json({
      token,
      user: {
        id: profile.id,
        discord_id: profile.discord_id,
        username: profile.username,
        email: profile.email,
        avatar_url: profile.avatar_url,
        full_name: profile.full_name,
        is_new_user: !profile.bio // Consider new if no bio
      }
    });

  } catch (error) {
    console.error('Discord OAuth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// Register/Update profile
router.post('/register', async (req, res) => {
  try {
    const { error, value } = profileSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // Check if profile exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('discord_id', value.discord_id)
      .single();

    let profile;
    if (existingProfile) {
      // Update existing profile
      const { data, error: updateError } = await supabase
        .from('profiles')
        .update({
          ...value,
          updated_at: new Date().toISOString()
        })
        .eq('discord_id', value.discord_id)
        .select()
        .single();

      if (updateError) throw updateError;
      profile = data;
    } else {
      // Create new profile
      const { data, error: createError } = await supabase
        .from('profiles')
        .insert(value)
        .select()
        .single();

      if (createError) throw createError;
      profile = data;
    }

    // Generate token
    const token = generateToken(profile.discord_id);

    res.json({
      token,
      user: profile,
      message: existingProfile ? 'Profile updated successfully' : 'Profile created successfully'
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Get current user
router.get('/me', async (req, res) => {
  try {
    const discord_id = req.headers['x-discord-id'];
    
    if (!discord_id) {
      return res.status(401).json({ error: 'Discord ID required' });
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('discord_id', discord_id)
      .single();

    if (error || !profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json({ user: profile });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// Refresh token
router.post('/refresh', async (req, res) => {
  try {
    const { discord_id } = req.body;
    
    if (!discord_id) {
      return res.status(400).json({ error: 'Discord ID required' });
    }

    // Verify user exists
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, discord_id, username')
      .eq('discord_id', discord_id)
      .single();

    if (error || !profile) {
      return res.status(401).json({ error: 'Invalid user' });
    }

    // Generate new token
    const token = generateToken(discord_id);

    res.json({ token });

  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({ error: 'Token refresh failed' });
  }
});

module.exports = router; 