const express = require('express');
const { Client, GatewayIntentBits, ChannelType, PermissionsBitField } = require('discord.js');
const { supabase } = require('../config/supabase');
const Joi = require('joi');

const router = express.Router();

// Initialize Discord client
const discordClient = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages
  ]
});

// Connect to Discord
discordClient.login(process.env.DISCORD_TOKEN);

// Validation schemas
const createTeamChannelSchema = Joi.object({
  team_name: Joi.string().required().min(1).max(100),
  team_description: Joi.string().optional().max(500),
  member_discord_ids: Joi.array().items(Joi.string()).min(2).max(10).required(),
  project_idea: Joi.string().optional().max(1000)
});

const createMatchChannelSchema = Joi.object({
  matched_user_discord_id: Joi.string().required(),
  match_reason: Joi.string().optional()
});

// Create team channel in Discord
router.post('/create-team-channel', async (req, res) => {
  try {
    const { error, value } = createTeamChannelSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { team_name, team_description, member_discord_ids, project_idea } = value;

    // Get guild (server)
    const guild = discordClient.guilds.cache.get(process.env.DISCORD_GUILD_ID);
    if (!guild) {
      return res.status(500).json({ error: 'Discord guild not found' });
    }

    // Create team channel
    const channel = await guild.channels.create({
      name: `team-${team_name.toLowerCase().replace(/\s+/g, '-')}`,
      type: ChannelType.GuildText,
      topic: `${team_description || 'Team collaboration channel'}\n\nProject: ${project_idea || 'TBD'}`,
      permissionOverwrites: [
        {
          id: guild.id, // @everyone role
          deny: [PermissionsBitField.Flags.ViewChannel],
        },
        ...member_discord_ids.map(discordId => ({
          id: discordId,
          allow: [
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.SendMessages,
            PermissionsBitField.Flags.ReadMessageHistory,
            PermissionsBitField.Flags.AttachFiles,
            PermissionsBitField.Flags.EmbedLinks
          ],
        }))
      ]
    });

    // Create voice channel for the team
    const voiceChannel = await guild.channels.create({
      name: `🔊 ${team_name}`,
      type: ChannelType.GuildVoice,
      permissionOverwrites: [
        {
          id: guild.id,
          deny: [PermissionsBitField.Flags.ViewChannel],
        },
        ...member_discord_ids.map(discordId => ({
          id: discordId,
          allow: [
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.Connect,
            PermissionsBitField.Flags.Speak,
            PermissionsBitField.Flags.UseVAD
          ],
        }))
      ]
    });

    // Store channel info in database
    const { data: channelRecord, error: dbError } = await supabase
      .from('discord_channels')
      .insert({
        channel_id: channel.id,
        channel_name: channel.name,
        channel_type: 'team',
        team_id: null // Will be updated when team is created
      })
      .select()
      .single();

    if (dbError) throw dbError;

    // Send welcome message
    const welcomeMessage = `
🎉 **Welcome to Team ${team_name}!**

${team_description ? `**Description:** ${team_description}` : ''}
${project_idea ? `**Project Idea:** ${project_idea}` : ''}

**Team Members:**
${member_discord_ids.map(id => `<@${id}>`).join(', ')}

**Available Channels:**
• ${channel} - Main team chat
• ${voiceChannel} - Voice chat

**Next Steps:**
1. Introduce yourselves and share your skills
2. Discuss project ideas and roles
3. Set up your development environment
4. Start coding! 🚀

Good luck with your hackathon project!
    `;

    await channel.send(welcomeMessage);

    res.json({
      success: true,
      channels: {
        text_channel: {
          id: channel.id,
          name: channel.name,
          url: `https://discord.com/channels/${guild.id}/${channel.id}`
        },
        voice_channel: {
          id: voiceChannel.id,
          name: voiceChannel.name,
          url: `https://discord.com/channels/${guild.id}/${voiceChannel.id}`
        }
      },
      message: 'Team channels created successfully'
    });

  } catch (error) {
    console.error('Create team channel error:', error);
    res.status(500).json({ error: 'Failed to create team channel' });
  }
});

// Create match channel for two users
router.post('/create-match-channel', async (req, res) => {
  try {
    const { error, value } = createMatchChannelSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { matched_user_discord_id, match_reason } = value;
    const current_user_discord_id = req.user.discord_id;

    // Get guild
    const guild = discordClient.guilds.cache.get(process.env.DISCORD_GUILD_ID);
    if (!guild) {
      return res.status(500).json({ error: 'Discord guild not found' });
    }

    // Get user profiles
    const { data: currentUser } = await supabase
      .from('profiles')
      .select('username, full_name')
      .eq('discord_id', current_user_discord_id)
      .single();

    const { data: matchedUser } = await supabase
      .from('profiles')
      .select('username, full_name')
      .eq('discord_id', matched_user_discord_id)
      .single();

    const channelName = `match-${currentUser?.username || 'user1'}-${matchedUser?.username || 'user2'}`.toLowerCase().replace(/\s+/g, '-');

    // Create match channel
    const channel = await guild.channels.create({
      name: channelName,
      type: ChannelType.GuildText,
      topic: `AI-generated match between ${currentUser?.full_name || currentUser?.username} and ${matchedUser?.full_name || matchedUser?.username}`,
      permissionOverwrites: [
        {
          id: guild.id,
          deny: [PermissionsBitField.Flags.ViewChannel],
        },
        {
          id: current_user_discord_id,
          allow: [
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.SendMessages,
            PermissionsBitField.Flags.ReadMessageHistory,
            PermissionsBitField.Flags.AttachFiles,
            PermissionsBitField.Flags.EmbedLinks
          ],
        },
        {
          id: matched_user_discord_id,
          allow: [
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.SendMessages,
            PermissionsBitField.Flags.ReadMessageHistory,
            PermissionsBitField.Flags.AttachFiles,
            PermissionsBitField.Flags.EmbedLinks
          ],
        }
      ]
    });

    // Store channel info
    await supabase
      .from('discord_channels')
      .insert({
        channel_id: channel.id,
        channel_name: channel.name,
        channel_type: 'match'
      });

    // Send match introduction message
    const matchMessage = `
🤝 **AI-Generated Match!**

**Participants:**
• <@${current_user_discord_id}> (${currentUser?.full_name || currentUser?.username})
• <@${matched_user_discord_id}> (${matchedUser?.full_name || matchedUser?.username})

${match_reason ? `**Why you were matched:** ${match_reason}` : '**Why you were matched:** Great potential for collaboration based on complementary skills and interests.'}

**Next Steps:**
1. Introduce yourselves and share your skills
2. Discuss potential project ideas
3. See if you'd like to form a team together
4. Use this channel to coordinate and collaborate

Good luck with your hackathon journey! 🚀
    `;

    await channel.send(matchMessage);

    res.json({
      success: true,
      channel: {
        id: channel.id,
        name: channel.name,
        url: `https://discord.com/channels/${guild.id}/${channel.id}`
      },
      message: 'Match channel created successfully'
    });

  } catch (error) {
    console.error('Create match channel error:', error);
    res.status(500).json({ error: 'Failed to create match channel' });
  }
});

// Send notification to user
router.post('/send-notification', async (req, res) => {
  try {
    const { discord_id, message, type = 'info' } = req.body;

    if (!discord_id || !message) {
      return res.status(400).json({ error: 'Discord ID and message are required' });
    }

    // Get user
    const user = await discordClient.users.fetch(discord_id);
    if (!user) {
      return res.status(404).json({ error: 'Discord user not found' });
    }

    // Create embed based on type
    const embed = {
      color: type === 'success' ? 0x00ff00 : type === 'warning' ? 0xffaa00 : type === 'error' ? 0xff0000 : 0x0099ff,
      title: type === 'success' ? '✅ Success' : type === 'warning' ? '⚠️ Warning' : type === 'error' ? '❌ Error' : 'ℹ️ Information',
      description: message,
      timestamp: new Date().toISOString(),
      footer: {
        text: 'Sundai Hackathon API'
      }
    };

    await user.send({ embeds: [embed] });

    res.json({
      success: true,
      message: 'Notification sent successfully'
    });

  } catch (error) {
    console.error('Send notification error:', error);
    res.status(500).json({ error: 'Failed to send notification' });
  }
});

// Get Discord server info
router.get('/server-info', async (req, res) => {
  try {
    const guild = discordClient.guilds.cache.get(process.env.DISCORD_GUILD_ID);
    if (!guild) {
      return res.status(404).json({ error: 'Discord guild not found' });
    }

    const channels = guild.channels.cache
      .filter(channel => channel.type === ChannelType.GuildText)
      .map(channel => ({
        id: channel.id,
        name: channel.name,
        topic: channel.topic,
        member_count: channel.members?.size || 0
      }));

    res.json({
      guild: {
        id: guild.id,
        name: guild.name,
        member_count: guild.memberCount,
        icon_url: guild.iconURL()
      },
      channels
    });

  } catch (error) {
    console.error('Get server info error:', error);
    res.status(500).json({ error: 'Failed to get server info' });
  }
});

// Bulk create channels for accepted matches
router.post('/bulk-create-match-channels', async (req, res) => {
  try {
    // Get all accepted matches
    const { data: acceptedMatches, error } = await supabase
      .from('matches')
      .select(`
        *,
        profile:profiles!matches_profile_id_fkey(discord_id, username),
        matched_profile:profiles!matches_matched_profile_id_fkey(discord_id, username)
      `)
      .eq('status', 'accepted');

    if (error) throw error;

    const createdChannels = [];

    for (const match of acceptedMatches) {
      try {
        const guild = discordClient.guilds.cache.get(process.env.DISCORD_GUILD_ID);
        if (!guild) continue;

        const channelName = `match-${match.profile.username}-${match.matched_profile.username}`.toLowerCase().replace(/\s+/g, '-');

        // Check if channel already exists
        const existingChannel = guild.channels.cache.find(ch => ch.name === channelName);
        if (existingChannel) continue;

        const channel = await guild.channels.create({
          name: channelName,
          type: ChannelType.GuildText,
          topic: `AI-generated match between ${match.profile.username} and ${match.matched_profile.username}`,
          permissionOverwrites: [
            {
              id: guild.id,
              deny: [PermissionsBitField.Flags.ViewChannel],
            },
            {
              id: match.profile.discord_id,
              allow: [
                PermissionsBitField.Flags.ViewChannel,
                PermissionsBitField.Flags.SendMessages,
                PermissionsBitField.Flags.ReadMessageHistory,
                PermissionsBitField.Flags.AttachFiles,
                PermissionsBitField.Flags.EmbedLinks
              ],
            },
            {
              id: match.matched_profile.discord_id,
              allow: [
                PermissionsBitField.Flags.ViewChannel,
                PermissionsBitField.Flags.SendMessages,
                PermissionsBitField.Flags.ReadMessageHistory,
                PermissionsBitField.Flags.AttachFiles,
                PermissionsBitField.Flags.EmbedLinks
              ],
            }
          ]
        });

        // Store channel info
        await supabase
          .from('discord_channels')
          .insert({
            channel_id: channel.id,
            channel_name: channel.name,
            channel_type: 'match'
          });

        createdChannels.push({
          match_id: match.id,
          channel_id: channel.id,
          channel_name: channel.name
        });

        // Send welcome message
        const welcomeMessage = `
🤝 **AI-Generated Match Channel Created!**

**Participants:**
• <@${match.profile.discord_id}> (${match.profile.username})
• <@${match.matched_profile.discord_id}> (${match.matched_profile.username})

**Match Reason:** ${match.match_reason || 'Great potential for collaboration based on complementary skills and interests.'}

**Next Steps:**
1. Introduce yourselves and share your skills
2. Discuss potential project ideas
3. See if you'd like to form a team together
4. Use this channel to coordinate and collaborate

Good luck with your hackathon journey! 🚀
        `;

        await channel.send(welcomeMessage);

      } catch (channelError) {
        console.error(`Error creating channel for match ${match.id}:`, channelError);
      }
    }

    res.json({
      success: true,
      created_channels: createdChannels.length,
      channels: createdChannels,
      message: `Successfully created ${createdChannels.length} match channels`
    });

  } catch (error) {
    console.error('Bulk create channels error:', error);
    res.status(500).json({ error: 'Failed to create channels' });
  }
});

module.exports = router; 