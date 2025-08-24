const jwt = require('jsonwebtoken');
const { supabase } = require('../config/supabase');

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verify user exists in database
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, discord_id, username')
      .eq('discord_id', decoded.discord_id)
      .single();

    if (error || !profile) {
      return res.status(401).json({ error: 'Invalid token - user not found' });
    }

    // Add user info to request
    req.user = {
      id: profile.id,
      discord_id: profile.discord_id,
      username: profile.username
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    return res.status(500).json({ error: 'Authentication error' });
  }
};

const generateToken = (discord_id) => {
  return jwt.sign(
    { discord_id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
};

module.exports = {
  authenticateToken,
  generateToken
}; 