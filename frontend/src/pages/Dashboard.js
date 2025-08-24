import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Key, 
  Users, 
  Activity, 
  TrendingUp, 
  Zap,
  ArrowRight,
  Code,
  Database,
  Globe,
  Copy
} from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/public/stats');
      setStats(response.data.hackathon_stats);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      title: 'Generate API Key',
      description: 'Create a new API key for your tools',
      icon: Key,
      href: '/api-keys',
      color: 'bg-blue-500',
      gradient: 'from-blue-500 to-blue-600'
    },
    {
      title: 'View Participants',
      description: 'Browse hackathon participants',
      icon: Users,
      href: '/participants',
      color: 'bg-green-500',
      gradient: 'from-green-500 to-green-600'
    },
    {
      title: 'API Documentation',
      description: 'Learn how to use the API',
      icon: Code,
      href: '/docs',
      color: 'bg-purple-500',
      gradient: 'from-purple-500 to-purple-600'
    },
    {
      title: 'Public Stats',
      description: 'View hackathon statistics',
      icon: TrendingUp,
      href: '/stats',
      color: 'bg-orange-500',
      gradient: 'from-orange-500 to-orange-600'
    }
  ];

  const features = [
    {
      title: 'Rich Participant Data',
      description: 'Access detailed profiles with LinkedIn context, skills, and hackathon experience',
      icon: Database
    },
    {
      title: 'AI-Powered Matching',
      description: 'Use OpenAI to find optimal team synergies and generate match recommendations',
      icon: Zap
    },
    {
      title: 'Public API Access',
      description: 'Open endpoints for community tools, datasets, and local applications',
      icon: Globe
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sundai-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.username || 'User'}! 👋
          </h1>
          <p className="text-gray-600">
            Ready to build amazing tools with the Sundai Hackathon API?
          </p>
        </motion.div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
        >
          <div className="card">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Participants</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_participants || 0}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Activity className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Users</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.total_participants ? Math.floor(stats.total_participants * 0.8) : 0}
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Top Skills</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.top_skills ? stats.top_skills.length : 0}
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Key className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">API Keys</p>
                <p className="text-2xl font-bold text-gray-900">-</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mb-8"
      >
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.title}
                to={action.href}
                className="card hover:shadow-md transition-shadow duration-200 group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`p-3 rounded-lg ${action.color} text-white`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-sundai-600 transition-colors">
                        {action.title}
                      </h3>
                      <p className="text-sm text-gray-600">{action.description}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-sundai-600 transition-colors" />
                </div>
              </Link>
            );
          })}
        </div>
      </motion.div>

      {/* Features */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="mb-8"
      >
        <h2 className="text-xl font-semibold text-gray-900 mb-4">API Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div key={feature.title} className="card">
                <div className="flex items-center mb-4">
                  <div className="p-2 bg-sundai-100 rounded-lg">
                    <Icon className="w-6 h-6 text-sundai-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 ml-3">
                    {feature.title}
                  </h3>
                </div>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Getting Started */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="card bg-gradient-to-r from-sundai-50 to-blue-50 border-sundai-200"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Ready to get started?
            </h2>
            <p className="text-gray-600 mb-4">
              Generate your first API key and start building amazing tools with the hackathon data.
            </p>
            <Link
              to="/api-keys"
              className="btn-primary inline-flex items-center space-x-2"
            >
              <Key className="w-4 h-4" />
              <span>Generate API Key</span>
            </Link>
          </div>
          <div className="hidden md:block">
            <div className="w-24 h-24 bg-gradient-to-br from-sundai-400 to-blue-500 rounded-full flex items-center justify-center">
              <Zap className="w-12 h-12 text-white" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* API Usage Example */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="mt-8"
      >
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick API Example</h2>
        <div className="card bg-gray-900 text-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Get Participants</h3>
            <button
              onClick={() => navigator.clipboard.writeText(`curl -H "X-API-Key: YOUR_API_KEY" \\
  https://api.sundai-hackathon.com/api/public/participants`)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
          <pre className="text-sm overflow-x-auto">
            <code>{`curl -H "X-API-Key: YOUR_API_KEY" \\
  https://api.sundai-hackathon.com/api/public/participants`}</code>
          </pre>
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard; 