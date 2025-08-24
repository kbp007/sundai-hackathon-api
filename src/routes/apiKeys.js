const express = require('express');
const { supabase } = require('../config/supabase');
const crypto = require('crypto');
const Joi = require('joi');

const router = express.Router();

// Validation schemas
const generateKeySchema = Joi.object({
  name: Joi.string().required().min(1).max(100),
  description: Joi.string().optional().max(500),
  permissions: Joi.array().items(Joi.string().valid('read', 'write', 'admin')).default(['read']),
  expires_at: Joi.date().optional().min('now')
});

const updateKeySchema = Joi.object({
  name: Joi.string().optional().min(1).max(100),
  description: Joi.string().optional().max(500),
  permissions: Joi.array().items(Joi.string().valid('read', 'write', 'admin')).optional(),
  is_active: Joi.boolean().optional()
});

// Generate new API key
router.post('/generate', async (req, res) => {
  try {
    const { error, value } = generateKeySchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { name, description, permissions, expires_at } = value;

    // Generate API key
    const apiKey = `sundai_${crypto.randomBytes(32).toString('hex')}`;
    const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');

    // Store in database
    const { data: keyRecord, error: dbError } = await supabase
      .from('api_keys')
      .insert({
        key_hash: keyHash,
        name,
        description,
        permissions,
        expires_at: expires_at || null,
        created_by: req.user?.id || null,
        is_active: true
      })
      .select()
      .single();

    if (dbError) throw dbError;

    res.json({
      success: true,
      api_key: apiKey, // Only returned once
      key_info: {
        id: keyRecord.id,
        name: keyRecord.name,
        description: keyRecord.description,
        permissions: keyRecord.permissions,
        created_at: keyRecord.created_at,
        expires_at: keyRecord.expires_at
      },
      message: 'API key generated successfully. Store it securely - it won\'t be shown again!'
    });

  } catch (error) {
    console.error('Generate API key error:', error);
    res.status(500).json({ error: 'Failed to generate API key' });
  }
});

// List user's API keys
router.get('/list', async (req, res) => {
  try {
    const { data: keys, error } = await supabase
      .from('api_keys')
      .select('id, name, description, permissions, created_at, expires_at, is_active, last_used_at')
      .eq('created_by', req.user?.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      keys: keys || [],
      total: keys?.length || 0
    });

  } catch (error) {
    console.error('List API keys error:', error);
    res.status(500).json({ error: 'Failed to list API keys' });
  }
});

// Update API key
router.put('/:keyId', async (req, res) => {
  try {
    const { keyId } = req.params;
    const { error, value } = updateKeySchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { data: key, error: updateError } = await supabase
      .from('api_keys')
      .update({
        ...value,
        updated_at: new Date().toISOString()
      })
      .eq('id', keyId)
      .eq('created_by', req.user?.id)
      .select()
      .single();

    if (updateError || !key) {
      return res.status(404).json({ error: 'API key not found' });
    }

    res.json({
      success: true,
      key,
      message: 'API key updated successfully'
    });

  } catch (error) {
    console.error('Update API key error:', error);
    res.status(500).json({ error: 'Failed to update API key' });
  }
});

// Revoke API key
router.delete('/:keyId', async (req, res) => {
  try {
    const { keyId } = req.params;

    const { data: key, error: deleteError } = await supabase
      .from('api_keys')
      .update({ 
        is_active: false,
        revoked_at: new Date().toISOString()
      })
      .eq('id', keyId)
      .eq('created_by', req.user?.id)
      .select()
      .single();

    if (deleteError || !key) {
      return res.status(404).json({ error: 'API key not found' });
    }

    res.json({
      success: true,
      message: 'API key revoked successfully'
    });

  } catch (error) {
    console.error('Revoke API key error:', error);
    res.status(500).json({ error: 'Failed to revoke API key' });
  }
});

// Get API key usage stats
router.get('/:keyId/stats', async (req, res) => {
  try {
    const { keyId } = req.params;

    const { data: key, error } = await supabase
      .from('api_keys')
      .select('id, name, created_at, last_used_at, usage_count')
      .eq('id', keyId)
      .eq('created_by', req.user?.id)
      .single();

    if (error || !key) {
      return res.status(404).json({ error: 'API key not found' });
    }

    res.json({
      key_stats: key
    });

  } catch (error) {
    console.error('Get API key stats error:', error);
    res.status(500).json({ error: 'Failed to get API key stats' });
  }
});

module.exports = router; 