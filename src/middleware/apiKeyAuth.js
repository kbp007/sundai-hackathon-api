const crypto = require('crypto');
const { supabase } = require('../config/supabase');

const authenticateApiKey = async (req, res, next) => {
  const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');

  if (!apiKey) {
    return res.status(401).json({ error: 'API key required' });
  }

  try {
    // Hash the provided API key
    const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');

    // Find the API key in database
    const { data: keyRecord, error } = await supabase
      .from('api_keys')
      .select('*')
      .eq('key_hash', keyHash)
      .eq('is_active', true)
      .single();

    if (error || !keyRecord) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    // Check if key is expired
    if (keyRecord.expires_at && new Date() > new Date(keyRecord.expires_at)) {
      return res.status(401).json({ error: 'API key expired' });
    }

    // Update usage stats
    await supabase
      .from('api_keys')
      .update({
        last_used_at: new Date().toISOString(),
        usage_count: (keyRecord.usage_count || 0) + 1
      })
      .eq('id', keyRecord.id);

    // Add API key info to request
    req.apiKey = {
      id: keyRecord.id,
      name: keyRecord.name,
      permissions: keyRecord.permissions,
      created_by: keyRecord.created_by
    };

    next();
  } catch (error) {
    console.error('API key authentication error:', error);
    return res.status(500).json({ error: 'Authentication error' });
  }
};

const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.apiKey) {
      return res.status(401).json({ error: 'API key required' });
    }

    if (!req.apiKey.permissions.includes(permission) && !req.apiKey.permissions.includes('admin')) {
      return res.status(403).json({ error: `Permission '${permission}' required` });
    }

    next();
  };
};

module.exports = {
  authenticateApiKey,
  requirePermission
}; 