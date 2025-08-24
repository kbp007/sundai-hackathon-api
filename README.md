# 🚀 Sundai Hackathon API

A powerful public hackathon database with API key authentication and AI-powered team matching. Built for creating synergies among hackathon participants and providing rich data for local tools and projects.

## ✨ Features

- **🔑 API Key Authentication**: Generate and manage API keys for secure access
- **🤖 AI-Powered Matching**: Uses OpenAI to find optimal team synergies based on skills, interests, and experience
- **📊 Rich Participant Data**: Enhanced profiles with LinkedIn context, hackathon experience, and detailed skills
- **🌐 Public API**: Open endpoints for community tools and datasets
- **🔐 Secure**: Row Level Security (RLS) with Supabase
- **⚡ High Performance**: Built with Express.js and Supabase for scalability

## 🏗️ Architecture

```
Local Tools/Apps ↔ API Server ↔ Supabase Database
                              ↓
                        OpenAI API (AI Matching)
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- Supabase account
- OpenAI API Key

### 1. Clone and Install

```bash
git clone <repository-url>
cd sundai-api
npm install
```

### 2. Environment Setup

Copy the environment template and fill in your credentials:

```bash
cp env.example .env
```

Fill in your `.env` file:

```env
# Supabase Configuration
SUPABASE_URL=your_supabase_url_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# JWT Configuration
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=24h

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Server Configuration
PORT=3000
NODE_ENV=development
```

### 3. Database Setup

Run the database setup script to create all necessary tables:

```bash
npm run setup
```

### 4. Start the Server

```bash
# Development
npm run dev

# Production
npm start
```

The API will be available at `http://localhost:3000`

## 📚 API Documentation

### Authentication

The API uses API key authentication. Include your API key in the header:

```
X-API-Key: your_api_key_here
```

### Core Endpoints

#### 🔑 API Key Management

```http
POST /api/keys/generate
GET /api/keys/list
PUT /api/keys/:keyId
DELETE /api/keys/:keyId
GET /api/keys/:keyId/stats
```

#### 🔐 Authentication

```http
POST /api/auth/register
GET /api/auth/me
POST /api/auth/refresh
```

#### 👥 Profiles

```http
GET /api/profiles
GET /api/profiles/me
PUT /api/profiles/me
GET /api/profiles/:id
GET /api/profiles/search/:query
GET /api/profiles/skills/:skill
```

#### 🤖 AI Matching

```http
GET /api/matching/ai-matches
GET /api/matching/history
POST /api/matching/:matchId/respond
POST /api/matching/team-recommendations
```

#### 🌐 Public API

```http
GET /api/public/stats
GET /api/public/participants
GET /api/public/search/:query
GET /api/public/skills/:skill
GET /api/public/industry/:industry
GET /api/public/docs
```

## 🎯 Usage Examples

### 1. Generate API Key

```javascript
const response = await fetch('/api/keys/generate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + jwt_token
  },
  body: JSON.stringify({
    name: "My Local Tool",
    description: "Tool for hackathon participant analysis",
    permissions: ["read", "write"]
  })
});

const { api_key, key_info } = await response.json();
console.log('Your API Key:', api_key);
```

### 2. Get Participants with API Key

```javascript
const response = await fetch('/api/public/participants?limit=50&skills=javascript,python', {
  headers: {
    'X-API-Key': 'your_api_key_here'
  }
});

const { participants, pagination } = await response.json();
console.log('Participants:', participants);
```

### 3. Get AI-Powered Matches

```javascript
const response = await fetch('/api/matching/ai-matches?max_matches=5&min_score=0.7', {
  headers: {
    'X-API-Key': 'your_api_key_here'
  }
});

const { matches, total_found } = await response.json();
console.log('AI Matches:', matches);
```

### 4. Search by Industry

```javascript
const response = await fetch('/api/public/industry/Technology?limit=20');
const { participants } = await response.json();
console.log('Tech participants:', participants);
```

## 🤖 AI Matching Algorithm

The AI matching system uses OpenAI's GPT models to:

1. **Analyze Compatibility**: Evaluate skill complementarity, experience levels, and interests
2. **Generate Match Scores**: Provide 0.0-1.0 compatibility scores
3. **Explain Matches**: Generate human-readable explanations for why people match
4. **Recommend Teams**: Suggest optimal team compositions for specific projects

### Match Scoring Factors

- **Skill Complementarity**: Different but complementary skills
- **Shared Interests**: Common project interests and goals
- **Experience Compatibility**: Balanced experience levels
- **Team Preferences**: Matching team size and communication preferences
- **Communication Style**: Compatibility in working styles

## 📊 Enhanced Data Schema

### Profiles Table

The enhanced profiles include:

```sql
-- Basic Information
username, full_name, email, bio, avatar_url

-- Skills & Experience
skills, experience_level, preferred_technologies

-- LinkedIn Integration
linkedin_headline, linkedin_industry, linkedin_experience, linkedin_education

-- Hackathon Context
hackathon_experience, hackathon_wins, preferred_domains, collaboration_style

-- Preferences
team_size_preference, time_commitment, remote_preference
```

## 🗄️ Database Schema

### API Keys Table
```sql
CREATE TABLE api_keys (
  id UUID PRIMARY KEY,
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
```

### Enhanced Profiles Table
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  discord_id VARCHAR(255) UNIQUE,
  username VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  full_name VARCHAR(255),
  avatar_url TEXT,
  bio TEXT,
  skills TEXT[],
  interests TEXT[],
  experience_level VARCHAR(50),
  
  -- LinkedIn Context
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
  
  -- Hackathon Context
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
```

## 🚀 Deployment

### Environment Variables for Production

```env
NODE_ENV=production
PORT=3000
CORS_ORIGIN=https://your-frontend-domain.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

- **Issues**: Create an issue on GitHub
- **Discussions**: Use GitHub Discussions
- **Documentation**: Check `/api/public/docs` endpoint

## 🎉 Why This Project?

This API solves real problems in hackathon environments:

- **Rich Data**: Enhanced profiles with LinkedIn context and hackathon experience
- **API Key Access**: Secure, scalable access for local tools and applications
- **AI-powered Matching**: Intelligent team formation using OpenAI
- **Public Access**: Available for community tools and datasets
- **Open Source**: Available for all hackathons to use and improve

Perfect for:
- 🏆 Hackathon organizers
- 👥 Team formation tools
- 📊 Community analytics
- 🤖 AI-powered networking apps
- 🛠️ Local tools and projects

---

**Built with ❤️ for the hackathon community** 