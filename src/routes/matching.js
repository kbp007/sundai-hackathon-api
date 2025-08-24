const express = require('express');
const { supabase } = require('../config/supabase');
const OpenAI = require('openai');
const Joi = require('joi');

const router = express.Router();

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Validation schemas
const matchRequestSchema = Joi.object({
  max_matches: Joi.number().min(1).max(10).default(5),
  min_score: Joi.number().min(0).max(1).default(0.7),
  skills_focus: Joi.array().items(Joi.string()).optional(),
  experience_level: Joi.string().valid('beginner', 'intermediate', 'advanced', 'expert').optional()
});

// AI-powered matching algorithm
const findMatches = async (userProfile, allProfiles, options = {}) => {
  const { max_matches = 5, min_score = 0.7, skills_focus = [] } = options;
  
  const matches = [];
  
  for (const potentialMatch of allProfiles) {
    if (potentialMatch.id === userProfile.id) continue;
    
    // Calculate match score using AI
    const matchScore = await calculateMatchScore(userProfile, potentialMatch, skills_focus);
    
    if (matchScore >= min_score) {
      matches.push({
        profile: potentialMatch,
        score: matchScore,
        reasons: await generateMatchReasons(userProfile, potentialMatch)
      });
    }
  }
  
  // Sort by score and return top matches
  return matches
    .sort((a, b) => b.score - a.score)
    .slice(0, max_matches);
};

// Calculate match score using OpenAI
const calculateMatchScore = async (profile1, profile2, skillsFocus = []) => {
  try {
    const prompt = `
    Analyze the compatibility between two hackathon participants and provide a match score from 0.0 to 1.0.

    Participant 1:
    - Skills: ${profile1.skills?.join(', ') || 'Not specified'}
    - Interests: ${profile1.interests?.join(', ') || 'Not specified'}
    - Experience Level: ${profile1.experience_level || 'Not specified'}
    - Bio: ${profile1.bio || 'Not specified'}
    - Team Size Preference: ${profile1.team_size_preference || 'Not specified'}

    Participant 2:
    - Skills: ${profile2.skills?.join(', ') || 'Not specified'}
    - Interests: ${profile2.interests?.join(', ') || 'Not specified'}
    - Experience Level: ${profile2.experience_level || 'Not specified'}
    - Bio: ${profile2.bio || 'Not specified'}
    - Team Size Preference: ${profile2.team_size_preference || 'Not specified'}

    Skills Focus Areas: ${skillsFocus.join(', ')}

    Consider:
    1. Skill complementarity (different but complementary skills)
    2. Shared interests and project alignment
    3. Experience level compatibility
    4. Team size preferences
    5. Communication style compatibility

    Return only a number between 0.0 and 1.0 representing the match score.
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 10,
      temperature: 0.3,
    });

    const score = parseFloat(completion.choices[0].message.content.trim());
    return isNaN(score) ? 0.5 : Math.max(0, Math.min(1, score));

  } catch (error) {
    console.error('Error calculating match score:', error);
    // Fallback to simple scoring
    return calculateFallbackScore(profile1, profile2);
  }
};

// Fallback scoring algorithm
const calculateFallbackScore = (profile1, profile2) => {
  let score = 0.5; // Base score
  
  // Skill complementarity
  const skills1 = new Set(profile1.skills || []);
  const skills2 = new Set(profile2.skills || []);
  const skillOverlap = [...skills1].filter(skill => skills2.has(skill)).length;
  const skillComplementarity = Math.min(skillOverlap / Math.max(skills1.size, skills2.size, 1), 1);
  score += skillComplementarity * 0.2;
  
  // Experience level compatibility
  if (profile1.experience_level && profile2.experience_level) {
    const levels = ['beginner', 'intermediate', 'advanced', 'expert'];
    const level1 = levels.indexOf(profile1.experience_level);
    const level2 = levels.indexOf(profile2.experience_level);
    const levelDiff = Math.abs(level1 - level2);
    score += (1 - levelDiff / 3) * 0.15;
  }
  
  // Team size preference compatibility
  if (profile1.team_size_preference === profile2.team_size_preference) {
    score += 0.15;
  }
  
  return Math.min(score, 1);
};

// Generate match reasons using AI
const generateMatchReasons = async (profile1, profile2) => {
  try {
    const prompt = `
    Explain why these two hackathon participants would make a great team in 2-3 concise sentences.

    Participant 1: ${profile1.username}
    - Skills: ${profile1.skills?.join(', ') || 'Not specified'}
    - Bio: ${profile1.bio || 'Not specified'}

    Participant 2: ${profile2.username}
    - Skills: ${profile2.skills?.join(', ') || 'Not specified'}
    - Bio: ${profile2.bio || 'Not specified'}

    Focus on skill complementarity, shared interests, and potential project synergies.
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 150,
      temperature: 0.7,
    });

    return completion.choices[0].message.content.trim();

  } catch (error) {
    console.error('Error generating match reasons:', error);
    return "Great potential for collaboration based on complementary skills and interests.";
  }
};

// Get AI-powered matches for current user
router.get('/ai-matches', async (req, res) => {
  try {
    const { error, value } = matchRequestSchema.validate(req.query);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // Get current user's profile
    const { data: userProfile, error: userError } = await supabase
      .from('profiles')
      .select('*')
      .eq('discord_id', req.user.discord_id)
      .single();

    if (userError || !userProfile) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    // Get all other profiles
    const { data: allProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .neq('id', userProfile.id);

    if (profilesError) throw profilesError;

    // Find matches
    const matches = await findMatches(userProfile, allProfiles, value);

    // Store matches in database
    for (const match of matches) {
      await supabase
        .from('matches')
        .upsert({
          profile_id: userProfile.id,
          matched_profile_id: match.profile.id,
          match_score: match.score,
          match_reason: match.reasons,
          status: 'pending'
        }, { onConflict: 'profile_id,matched_profile_id' });
    }

    res.json({
      matches: matches.map(match => ({
        profile: {
          id: match.profile.id,
          username: match.profile.username,
          full_name: match.profile.full_name,
          avatar_url: match.profile.avatar_url,
          bio: match.profile.bio,
          skills: match.profile.skills,
          experience_level: match.profile.experience_level
        },
        score: match.score,
        reasons: match.reasons
      })),
      total_found: matches.length
    });

  } catch (error) {
    console.error('AI matching error:', error);
    res.status(500).json({ error: 'Failed to generate matches' });
  }
});

// Get user's match history
router.get('/history', async (req, res) => {
  try {
    const { data: matches, error } = await supabase
      .from('matches')
      .select(`
        *,
        matched_profile:profiles!matches_matched_profile_id_fkey(
          id, username, full_name, avatar_url, bio, skills, experience_level
        )
      `)
      .eq('profile_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ matches });

  } catch (error) {
    console.error('Get match history error:', error);
    res.status(500).json({ error: 'Failed to get match history' });
  }
});

// Accept or reject a match
router.post('/:matchId/respond', async (req, res) => {
  try {
    const { matchId } = req.params;
    const { action } = req.body; // 'accept' or 'reject'

    if (!['accept', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action. Must be "accept" or "reject"' });
    }

    const { data: match, error: updateError } = await supabase
      .from('matches')
      .update({ status: action === 'accept' ? 'accepted' : 'rejected' })
      .eq('id', matchId)
      .eq('profile_id', req.user.id)
      .select()
      .single();

    if (updateError || !match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    res.json({
      match,
      message: `Match ${action}ed successfully`
    });

  } catch (error) {
    console.error('Respond to match error:', error);
    res.status(500).json({ error: 'Failed to respond to match' });
  }
});

// Get team recommendations based on project idea
router.post('/team-recommendations', async (req, res) => {
  try {
    const { project_idea, required_skills, team_size = 4 } = req.body;

    if (!project_idea) {
      return res.status(400).json({ error: 'Project idea is required' });
    }

    // Get all profiles
    const { data: allProfiles, error } = await supabase
      .from('profiles')
      .select('*')
      .neq('discord_id', req.user.discord_id);

    if (error) throw error;

    // Use AI to find best team composition
    const prompt = `
    Given this hackathon project idea and required skills, recommend the best team composition from these participants.

    Project Idea: ${project_idea}
    Required Skills: ${required_skills?.join(', ') || 'Not specified'}
    Team Size: ${team_size} people

    Available Participants:
    ${allProfiles.map(p => `${p.username}: ${p.skills?.join(', ') || 'No skills specified'} - ${p.bio || 'No bio'}`).join('\n')}

    Return a JSON array of ${team_size} participant usernames that would work best together for this project.
    Consider skill complementarity, experience levels, and team dynamics.
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 500,
      temperature: 0.7,
    });

    const recommendedUsernames = JSON.parse(completion.choices[0].message.content);
    
    // Get full profiles for recommended team
    const recommendedTeam = allProfiles.filter(profile => 
      recommendedUsernames.includes(profile.username)
    );

    res.json({
      project_idea,
      recommended_team: recommendedTeam,
      team_size: recommendedTeam.length,
      reasoning: await generateTeamReasoning(project_idea, recommendedTeam)
    });

  } catch (error) {
    console.error('Team recommendations error:', error);
    res.status(500).json({ error: 'Failed to generate team recommendations' });
  }
});

// Generate team reasoning
const generateTeamReasoning = async (projectIdea, team) => {
  try {
    const prompt = `
    Explain why this team composition would be excellent for this hackathon project.

    Project: ${projectIdea}
    
    Team Members:
    ${team.map(member => `${member.username}: ${member.skills?.join(', ') || 'No skills'} - ${member.bio || 'No bio'}`).join('\n')}

    Provide 2-3 sentences explaining the team's strengths and how they complement each other.
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 200,
      temperature: 0.7,
    });

    return completion.choices[0].message.content.trim();

  } catch (error) {
    console.error('Error generating team reasoning:', error);
    return "This team has complementary skills that would work well together for the project.";
  }
};

module.exports = router; 