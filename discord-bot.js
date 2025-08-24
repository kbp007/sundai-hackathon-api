const { Client, GatewayIntentBits, SlashCommandBuilder, EmbedBuilder } = require('discord.js');
require('dotenv').config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages
  ]
});

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

// Slash commands
const commands = [
  new SlashCommandBuilder()
    .setName('profile')
    .setDescription('View or update your hackathon profile')
    .addSubcommand(subcommand =>
      subcommand
        .setName('view')
        .setDescription('View your current profile'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('update')
        .setDescription('Update your profile')
        .addStringOption(option =>
          option.setName('bio')
            .setDescription('Your bio')
            .setRequired(false))
        .addStringOption(option =>
          option.setName('skills')
            .setDescription('Your skills (comma-separated)')
            .setRequired(false))
        .addStringOption(option =>
          option.setName('experience')
            .setDescription('Your experience level')
            .addChoices(
              { name: 'Beginner', value: 'beginner' },
              { name: 'Intermediate', value: 'intermediate' },
              { name: 'Advanced', value: 'advanced' },
              { name: 'Expert', value: 'expert' }
            )
            .setRequired(false))),

  new SlashCommandBuilder()
    .setName('matches')
    .setDescription('Get AI-powered team matches')
    .addIntegerOption(option =>
      option.setName('count')
        .setDescription('Number of matches to get')
        .setRequired(false)
        .setMinValue(1)
        .setMaxValue(10)),

  new SlashCommandBuilder()
    .setName('stats')
    .setDescription('View hackathon statistics'),

  new SlashCommandBuilder()
    .setName('search')
    .setDescription('Search for participants')
    .addStringOption(option =>
      option.setName('query')
        .setDescription('Search term')
        .setRequired(true)),

  new SlashCommandBuilder()
    .setName('team')
    .setDescription('Team management commands')
    .addSubcommand(subcommand =>
      subcommand
        .setName('create')
        .setDescription('Create a team channel')
        .addStringOption(option =>
          option.setName('name')
            .setDescription('Team name')
            .setRequired(true))
        .addStringOption(option =>
          option.setName('description')
            .setDescription('Team description')
            .setRequired(false))
        .addStringOption(option =>
          option.setName('members')
            .setDescription('Team member Discord IDs (comma-separated)')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('recommend')
        .setDescription('Get AI team recommendations')
        .addStringOption(option =>
          option.setName('project')
            .setDescription('Project idea')
            .setRequired(true))
        .addStringOption(option =>
          option.setName('skills')
            .setDescription('Required skills (comma-separated)')
            .setRequired(false))
        .addIntegerOption(option =>
          option.setName('size')
            .setDescription('Team size')
            .setRequired(false)
            .setMinValue(2)
            .setMaxValue(6)))
];

// Register slash commands
client.once('ready', async () => {
  console.log(`🤖 Discord Bot logged in as ${client.user.tag}`);
  
  try {
    await client.application.commands.set(commands);
    console.log('✅ Slash commands registered');
  } catch (error) {
    console.error('❌ Failed to register slash commands:', error);
  }
});

// Handle slash commands
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName } = interaction;

  try {
    switch (commandName) {
      case 'profile':
        await handleProfileCommand(interaction);
        break;
      case 'matches':
        await handleMatchesCommand(interaction);
        break;
      case 'stats':
        await handleStatsCommand(interaction);
        break;
      case 'search':
        await handleSearchCommand(interaction);
        break;
      case 'team':
        await handleTeamCommand(interaction);
        break;
      default:
        await interaction.reply({ content: 'Unknown command', ephemeral: true });
    }
  } catch (error) {
    console.error(`Error handling command ${commandName}:`, error);
    await interaction.reply({ 
      content: 'An error occurred while processing your command.', 
      ephemeral: true 
    });
  }
});

// Profile command handler
async function handleProfileCommand(interaction) {
  const subcommand = interaction.options.getSubcommand();
  const userId = interaction.user.id;

  if (subcommand === 'view') {
    // Get user profile from API
    const response = await fetch(`${API_BASE_URL}/api/profiles/me`, {
      headers: {
        'Authorization': `Bearer ${await getTokenForUser(userId)}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      await interaction.reply({ 
        content: 'Profile not found. Please register first with `/profile update`.', 
        ephemeral: true 
      });
      return;
    }

    const { profile } = await response.json();
    
    const embed = new EmbedBuilder()
      .setTitle(`👤 ${profile.full_name || profile.username}`)
      .setThumbnail(profile.avatar_url)
      .addFields(
        { name: 'Username', value: profile.username, inline: true },
        { name: 'Experience', value: profile.experience_level || 'Not specified', inline: true },
        { name: 'Team Size Preference', value: profile.team_size_preference || 'Not specified', inline: true },
        { name: 'Bio', value: profile.bio || 'No bio provided', inline: false },
        { name: 'Skills', value: profile.skills?.join(', ') || 'No skills listed', inline: false }
      )
      .setColor(0x0099ff)
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });

  } else if (subcommand === 'update') {
    const bio = interaction.options.getString('bio');
    const skills = interaction.options.getString('skills');
    const experience = interaction.options.getString('experience');

    const updateData = {};
    if (bio) updateData.bio = bio;
    if (skills) updateData.skills = skills.split(',').map(s => s.trim());
    if (experience) updateData.experience_level = experience;

    if (Object.keys(updateData).length === 0) {
      await interaction.reply({ 
        content: 'Please provide at least one field to update.', 
        ephemeral: true 
      });
      return;
    }

    // Update profile via API
    const response = await fetch(`${API_BASE_URL}/api/profiles/me`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${await getTokenForUser(userId)}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    });

    if (!response.ok) {
      await interaction.reply({ 
        content: 'Failed to update profile. Please try again.', 
        ephemeral: true 
      });
      return;
    }

    await interaction.reply({ 
      content: '✅ Profile updated successfully!', 
      ephemeral: true 
    });
  }
}

// Matches command handler
async function handleMatchesCommand(interaction) {
  const count = interaction.options.getInteger('count') || 5;
  const userId = interaction.user.id;

  await interaction.deferReply();

  try {
    const response = await fetch(`${API_BASE_URL}/api/matching/ai-matches?max_matches=${count}`, {
      headers: {
        'Authorization': `Bearer ${await getTokenForUser(userId)}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      await interaction.editReply('Failed to get matches. Please try again.');
      return;
    }

    const { matches } = await response.json();

    if (matches.length === 0) {
      await interaction.editReply('No matches found. Try updating your profile with more details!');
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle('🤖 AI-Powered Matches')
      .setDescription(`Found ${matches.length} potential teammates for you!`)
      .setColor(0x00ff00);

    matches.forEach((match, index) => {
      embed.addFields({
        name: `${index + 1}. ${match.profile.full_name || match.profile.username}`,
        value: `**Score:** ${(match.score * 100).toFixed(1)}%\n**Skills:** ${match.profile.skills?.join(', ') || 'None'}\n**Reason:** ${match.reasons}`,
        inline: false
      });
    });

    await interaction.editReply({ embeds: [embed] });

  } catch (error) {
    console.error('Error getting matches:', error);
    await interaction.editReply('An error occurred while getting matches.');
  }
}

// Stats command handler
async function handleStatsCommand(interaction) {
  await interaction.deferReply();

  try {
    const response = await fetch(`${API_BASE_URL}/api/public/stats`);
    const { hackathon_stats } = await response.json();

    const embed = new EmbedBuilder()
      .setTitle('📊 Hackathon Statistics')
      .setColor(0x0099ff)
      .addFields(
        { name: 'Total Participants', value: hackathon_stats.total_participants.toString(), inline: true },
        { name: 'Top Skills', value: hackathon_stats.top_skills?.slice(0, 3).map(s => s.skill).join(', ') || 'None', inline: true },
        { name: 'Recent Joiners', value: hackathon_stats.recent_joiners?.slice(0, 3).map(p => p.username).join(', ') || 'None', inline: true }
      )
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });

  } catch (error) {
    console.error('Error getting stats:', error);
    await interaction.editReply('Failed to get statistics.');
  }
}

// Search command handler
async function handleSearchCommand(interaction) {
  const query = interaction.options.getString('query');
  
  await interaction.deferReply();

  try {
    const response = await fetch(`${API_BASE_URL}/api/public/search/${encodeURIComponent(query)}`);
    const { participants } = await response.json();

    if (participants.length === 0) {
      await interaction.editReply(`No participants found for "${query}"`);
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle(`🔍 Search Results for "${query}"`)
      .setDescription(`Found ${participants.length} participants`)
      .setColor(0x0099ff);

    participants.slice(0, 5).forEach(participant => {
      embed.addFields({
        name: participant.full_name || participant.username,
        value: `**Skills:** ${participant.skills?.join(', ') || 'None'}\n**Experience:** ${participant.experience_level || 'Not specified'}`,
        inline: true
      });
    });

    await interaction.editReply({ embeds: [embed] });

  } catch (error) {
    console.error('Error searching:', error);
    await interaction.editReply('Failed to search participants.');
  }
}

// Team command handler
async function handleTeamCommand(interaction) {
  const subcommand = interaction.options.getSubcommand();
  const userId = interaction.user.id;

  if (subcommand === 'create') {
    const name = interaction.options.getString('name');
    const description = interaction.options.getString('description');
    const members = interaction.options.getString('members');

    await interaction.deferReply();

    try {
      const memberIds = members.split(',').map(id => id.trim());
      
      const response = await fetch(`${API_BASE_URL}/api/discord/create-team-channel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await getTokenForUser(userId)}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          team_name: name,
          team_description: description,
          member_discord_ids: memberIds
        })
      });

      if (!response.ok) {
        await interaction.editReply('Failed to create team channel.');
        return;
      }

      const result = await response.json();
      
      const embed = new EmbedBuilder()
        .setTitle('🎉 Team Created!')
        .setDescription(`Team "${name}" has been created successfully!`)
        .addFields(
          { name: 'Text Channel', value: `[${result.channels.text_channel.name}](${result.channels.text_channel.url})`, inline: true },
          { name: 'Voice Channel', value: `[${result.channels.voice_channel.name}](${result.channels.voice_channel.url})`, inline: true }
        )
        .setColor(0x00ff00);

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error('Error creating team:', error);
      await interaction.editReply('Failed to create team.');
    }

  } else if (subcommand === 'recommend') {
    const project = interaction.options.getString('project');
    const skills = interaction.options.getString('skills');
    const size = interaction.options.getInteger('size') || 4;

    await interaction.deferReply();

    try {
      const response = await fetch(`${API_BASE_URL}/api/matching/team-recommendations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await getTokenForUser(userId)}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          project_idea: project,
          required_skills: skills ? skills.split(',').map(s => s.trim()) : undefined,
          team_size: size
        })
      });

      if (!response.ok) {
        await interaction.editReply('Failed to get team recommendations.');
        return;
      }

      const { recommended_team, reasoning } = await response.json();

      const embed = new EmbedBuilder()
        .setTitle('🤖 AI Team Recommendations')
        .setDescription(`**Project:** ${project}`)
        .addFields(
          { name: 'Recommended Team', value: recommended_team.map(m => m.full_name || m.username).join(', '), inline: false },
          { name: 'Reasoning', value: reasoning, inline: false }
        )
        .setColor(0x00ff00);

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error('Error getting team recommendations:', error);
      await interaction.editReply('Failed to get team recommendations.');
    }
  }
}

// Helper function to get token for user (simplified - in real app, you'd store tokens)
async function getTokenForUser(userId) {
  // This is a simplified version - in a real implementation, you'd:
  // 1. Store user tokens securely
  // 2. Handle token refresh
  // 3. Implement proper OAuth flow
  
  // For demo purposes, we'll use a placeholder
  return 'demo_token';
}

// Error handling
client.on('error', error => {
  console.error('Discord client error:', error);
});

process.on('unhandledRejection', error => {
  console.error('Unhandled promise rejection:', error);
});

// Login
client.login(process.env.DISCORD_TOKEN);

console.log('🤖 Starting Discord bot...'); 