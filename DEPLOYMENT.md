# Sundai Hackathon API - Deployment Guide

## Quick Deploy Options

### 🚀 Option 1: Render (Recommended - Full Stack)

**Backend + Frontend on Render**

1. **Fork/Clone this repository to your GitHub account**

2. **Sign up for Render** at https://render.com

3. **Deploy Backend:**
   - Go to Render Dashboard → "New" → "Web Service"
   - Connect your GitHub repository
   - Configure:
     - **Name**: `sundai-api-backend`
     - **Environment**: `Node`
     - **Build Command**: `npm install`
     - **Start Command**: `npm start`
     - **Plan**: Free

4. **Set Environment Variables** (in Render Dashboard):
   ```
   NODE_ENV=production
   PORT=10000
   JWT_SECRET=your-secret-key-here
   SUPABASE_URL=your-supabase-url
   SUPABASE_ANON_KEY=your-supabase-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
   OPENAI_API_KEY=your-openai-api-key
   ```

5. **Deploy Frontend:**
   - Go to Render Dashboard → "New" → "Static Site"
   - Connect your GitHub repository
   - Configure:
     - **Name**: `sundai-api-frontend`
     - **Build Command**: `cd frontend && npm install && npm run build`
     - **Publish Directory**: `frontend/build`
     - **Plan**: Free

6. **Set Frontend Environment Variable:**
   ```
   REACT_APP_API_URL=https://your-backend-url.onrender.com
   ```

### 🚀 Option 2: Vercel + Railway

**Frontend on Vercel, Backend on Railway**

1. **Deploy Backend to Railway:**
   - Go to https://railway.app
   - Connect GitHub repository
   - Set environment variables (same as above)
   - Deploy

2. **Deploy Frontend to Vercel:**
   - Go to https://vercel.com
   - Import GitHub repository
   - Set environment variable:
     ```
     REACT_APP_API_URL=https://your-railway-backend-url
     ```
   - Deploy

### 🚀 Option 3: Heroku

1. **Install Heroku CLI**
2. **Login to Heroku:**
   ```bash
   heroku login
   ```

3. **Create Heroku app:**
   ```bash
   heroku create sundai-hackathon-api
   ```

4. **Set environment variables:**
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set JWT_SECRET=your-secret-key-here
   heroku config:set SUPABASE_URL=your-supabase-url
   heroku config:set SUPABASE_ANON_KEY=your-supabase-anon-key
   heroku config:set SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
   heroku config:set OPENAI_API_KEY=your-openai-api-key
   ```

5. **Deploy:**
   ```bash
   git push heroku main
   ```

## Pre-Deployment Checklist

### ✅ Database Setup
Before deploying, ensure your Supabase database is set up:

```bash
# Run the setup script locally first
npm run setup
```

### ✅ Environment Variables
Ensure all required environment variables are set:
- `JWT_SECRET` - Secret key for JWT tokens
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `OPENAI_API_KEY` - OpenAI API key for AI matching

### ✅ Frontend Configuration
The frontend will automatically use the correct API URL based on the environment:
- Development: `http://localhost:3001`
- Production: Uses `REACT_APP_API_URL` environment variable

## Post-Deployment

### 🔗 Update CORS Settings
If you encounter CORS issues, update your backend CORS configuration in `src/index.js`:

```javascript
app.use(cors({
  origin: ['https://your-frontend-domain.com', 'http://localhost:3000'],
  credentials: true
}));
```

### 🔗 Test Your Deployment
1. **Test Backend API:**
   ```bash
   curl https://your-backend-url.com/api/public/stats
   ```

2. **Test Frontend:**
   - Visit your frontend URL
   - Try registering/logging in
   - Generate an API key
   - Test API endpoints

### 🔗 API Documentation
Your API documentation is available at:
```
https://your-backend-url.com/api/public/docs
```

## Troubleshooting

### Common Issues:

1. **Build Failures:**
   - Check that all dependencies are in `package.json`
   - Ensure Node.js version compatibility

2. **Environment Variables:**
   - Verify all required variables are set
   - Check for typos in variable names

3. **Database Connection:**
   - Ensure Supabase credentials are correct
   - Check if database tables exist

4. **CORS Errors:**
   - Update CORS configuration with your frontend domain
   - Check browser console for specific errors

### Support:
- Check the logs in your deployment platform
- Verify environment variables are correctly set
- Test API endpoints individually

## Security Notes

⚠️ **Important Security Considerations:**

1. **Never commit `.env` files** to version control
2. **Use strong JWT secrets** in production
3. **Regularly rotate API keys**
4. **Monitor API usage** and set rate limits
5. **Keep dependencies updated**

Your Sundai Hackathon API is now ready to help participants find synergies and build amazing projects! 🚀 