const { supabaseAdmin } = require('../src/config/supabase');

const setupDatabase = async () => {
  console.log('🚀 Setting up Sundai Hackathon Database...');

  try {
    // Create enhanced profiles table with additional context
    const { error: profilesError } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS profiles (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          discord_id VARCHAR(255) UNIQUE,
          username VARCHAR(255) NOT NULL,
          email VARCHAR(255),
          full_name VARCHAR(255),
          avatar_url TEXT,
          bio TEXT,
          skills TEXT[],
          interests TEXT[],
          experience_level VARCHAR(50),
          github_url VARCHAR(255),
          linkedin_url VARCHAR(255),
          portfolio_url VARCHAR(255),
          timezone VARCHAR(50),
          availability JSONB,
          project_preferences JSONB,
          team_size_preference VARCHAR(50),
          communication_preferences JSONB,
          
          -- Additional context fields
          linkedin_headline VARCHAR(255),
          linkedin_summary TEXT,
          linkedin_industry VARCHAR(100),
          linkedin_location VARCHAR(100),
          linkedin_company VARCHAR(100),
          linkedin_position VARCHAR(100),
          linkedin_experience JSONB,
          linkedin_education JSONB,
          linkedin_certifications JSONB,
          linkedin_volunteer JSONB,
          linkedin_languages JSONB,
          linkedin_skills JSONB,
          
          -- Additional hackathon context
          hackathon_experience INTEGER DEFAULT 0,
          hackathon_wins INTEGER DEFAULT 0,
          hackathon_projects JSONB,
          preferred_technologies TEXT[],
          preferred_domains TEXT[],
          collaboration_style VARCHAR(50),
          time_commitment VARCHAR(50),
          remote_preference BOOLEAN DEFAULT true,
          
          -- Metadata
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          profile_completion_percentage INTEGER DEFAULT 0
        );
      `
    });

    if (profilesError) {
      console.error('Error creating profiles table:', profilesError);
    } else {
      console.log('✅ Enhanced profiles table created');
    }

    // Create API keys table
    const { error: apiKeysError } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS api_keys (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          key_hash VARCHAR(255) UNIQUE NOT NULL,
          name VARCHAR(100) NOT NULL,
          description TEXT,
          permissions TEXT[] DEFAULT ARRAY['read'],
          created_by UUID REFERENCES profiles(id),
          is_active BOOLEAN DEFAULT true,
          expires_at TIMESTAMP WITH TIME ZONE,
          revoked_at TIMESTAMP WITH TIME ZONE,
          last_used_at TIMESTAMP WITH TIME ZONE,
          usage_count INTEGER DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (apiKeysError) {
      console.error('Error creating api_keys table:', apiKeysError);
    } else {
      console.log('✅ API keys table created');
    }

    // Create teams table
    const { error: teamsError } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS teams (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          project_idea TEXT,
          required_skills TEXT[],
          max_members INTEGER DEFAULT 4,
          current_members INTEGER DEFAULT 0,
          status VARCHAR(50) DEFAULT 'open',
          created_by UUID REFERENCES profiles(id),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (teamsError) {
      console.error('Error creating teams table:', teamsError);
    } else {
      console.log('✅ Teams table created');
    }

    // Create team_members table
    const { error: teamMembersError } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS team_members (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
          profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
          role VARCHAR(100),
          joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(team_id, profile_id)
        );
      `
    });

    if (teamMembersError) {
      console.error('Error creating team_members table:', teamMembersError);
    } else {
      console.log('✅ Team members table created');
    }

    // Create matches table for AI-generated matches
    const { error: matchesError } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS matches (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
          matched_profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
          match_score DECIMAL(3,2),
          match_reason TEXT,
          status VARCHAR(50) DEFAULT 'pending',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(profile_id, matched_profile_id)
        );
      `
    });

    if (matchesError) {
      console.error('Error creating matches table:', matchesError);
    } else {
      console.log('✅ Matches table created');
    }

    // Create API usage logs table
    const { error: usageLogsError } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS api_usage_logs (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          api_key_id UUID REFERENCES api_keys(id),
          endpoint VARCHAR(255) NOT NULL,
          method VARCHAR(10) NOT NULL,
          status_code INTEGER,
          response_time INTEGER,
          user_agent TEXT,
          ip_address INET,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (usageLogsError) {
      console.error('Error creating api_usage_logs table:', usageLogsError);
    } else {
      console.log('✅ API usage logs table created');
    }

    // Create RLS policies
    console.log('🔒 Setting up Row Level Security...');

    // Enable RLS on all tables
    const tables = ['profiles', 'api_keys', 'teams', 'team_members', 'matches', 'api_usage_logs'];
    
    for (const table of tables) {
      await supabaseAdmin.rpc('exec_sql', {
        sql: `ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;`
      });
    }

    // Profiles policies - allow read access with API key, write access to own profile
    await supabaseAdmin.rpc('exec_sql', {
      sql: `
        CREATE POLICY "API key can read all profiles" ON profiles
        FOR SELECT USING (true);
        
        CREATE POLICY "Users can update own profile" ON profiles
        FOR UPDATE USING (discord_id = current_setting('request.jwt.claims')::json->>'discord_id');
        
        CREATE POLICY "Users can insert own profile" ON profiles
        FOR INSERT WITH CHECK (discord_id = current_setting('request.jwt.claims')::json->>'discord_id');
      `
    });

    // API keys policies
    await supabaseAdmin.rpc('exec_sql', {
      sql: `
        CREATE POLICY "Users can manage own API keys" ON api_keys
        FOR ALL USING (created_by = (SELECT id FROM profiles WHERE discord_id = current_setting('request.jwt.claims')::json->>'discord_id'));
      `
    });

    // Teams policies
    await supabaseAdmin.rpc('exec_sql', {
      sql: `
        CREATE POLICY "API key can read all teams" ON teams
        FOR SELECT USING (true);
        
        CREATE POLICY "Users can create teams" ON teams
        FOR INSERT WITH CHECK (created_by = (SELECT id FROM profiles WHERE discord_id = current_setting('request.jwt.claims')::json->>'discord_id'));
        
        CREATE POLICY "Team creators can update teams" ON teams
        FOR UPDATE USING (created_by = (SELECT id FROM profiles WHERE discord_id = current_setting('request.jwt.claims')::json->>'discord_id'));
      `
    });

    console.log('✅ Database setup completed successfully!');
    console.log('📊 Tables created: profiles, api_keys, teams, team_members, matches, api_usage_logs');
    console.log('🔒 Row Level Security enabled');
    console.log('🎯 Enhanced profiles with LinkedIn context and additional hackathon data');

  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }
};

// Run setup if called directly
if (require.main === module) {
  setupDatabase();
}

module.exports = { setupDatabase }; 