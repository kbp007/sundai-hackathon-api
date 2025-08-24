import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  User, 
  Mail, 
  MapPin, 
  Briefcase, 
  Github, 
  Linkedin, 
  Save, 
  Edit3,
  Loader2,
  CheckCircle
} from 'lucide-react';
import { motion } from 'framer-motion';

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    bio: user?.bio || '',
    skills: user?.skills?.join(', ') || '',
    experience_level: user?.experience_level || 'beginner',
    github_url: user?.github_url || '',
    linkedin_url: user?.linkedin_url || '',
    timezone: user?.timezone || '',
    team_size_preference: user?.team_size_preference || '3-4',
    time_commitment: user?.time_commitment || 'full-time',
    remote_preference: user?.remote_preference !== false
  });

  const experienceLevels = [
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' },
    { value: 'expert', label: 'Expert' }
  ];

  const teamSizeOptions = [
    { value: '1-2', label: '1-2 people' },
    { value: '3-4', label: '3-4 people' },
    { value: '5+', label: '5+ people' }
  ];

  const timeCommitmentOptions = [
    { value: 'part-time', label: 'Part-time' },
    { value: 'full-time', label: 'Full-time' },
    { value: 'weekend-only', label: 'Weekend only' }
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const profileData = {
      ...formData,
      skills: formData.skills.split(',').map(skill => skill.trim()).filter(skill => skill)
    };

    const result = await updateProfile(profileData);
    
    if (result.success) {
      setIsEditing(false);
    }
    
    setLoading(false);
  };

  const getCompletionPercentage = () => {
    const fields = [
      user?.full_name,
      user?.bio,
      user?.skills?.length > 0,
      user?.experience_level,
      user?.github_url,
      user?.linkedin_url
    ];
    
    const completed = fields.filter(Boolean).length;
    return Math.round((completed / fields.length) * 100);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile</h1>
            <p className="text-gray-600">
              Manage your profile information and preferences
            </p>
          </div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="btn-secondary flex items-center space-x-2"
          >
            {isEditing ? (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>View</span>
              </>
            ) : (
              <>
                <Edit3 className="w-4 h-4" />
                <span>Edit</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Profile Completion */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card mb-8"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Profile Completion</h2>
          <span className="text-sm font-medium text-gray-600">
            {getCompletionPercentage()}% Complete
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-sundai-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${getCompletionPercentage()}%` }}
          ></div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Form */}
        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              {isEditing ? 'Edit Profile' : 'Profile Information'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="input-field pl-10 disabled:bg-gray-50 disabled:text-gray-500"
                      placeholder="Enter your full name"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="input-field pl-10 bg-gray-50 text-gray-500"
                      placeholder="Email address"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bio
                </label>
                <textarea
                  name="bio"
                  rows="4"
                  value={formData.bio}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="input-field disabled:bg-gray-50 disabled:text-gray-500"
                  placeholder="Tell us about yourself..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Skills (comma-separated)
                </label>
                <input
                  type="text"
                  name="skills"
                  value={formData.skills}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="input-field disabled:bg-gray-50 disabled:text-gray-500"
                  placeholder="e.g., JavaScript, Python, React, Node.js"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Experience Level
                  </label>
                  <select
                    name="experience_level"
                    value={formData.experience_level}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="input-field disabled:bg-gray-50 disabled:text-gray-500"
                  >
                    {experienceLevels.map(level => (
                      <option key={level.value} value={level.value}>
                        {level.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Timezone
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      name="timezone"
                      value={formData.timezone}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="input-field pl-10 disabled:bg-gray-50 disabled:text-gray-500"
                      placeholder="e.g., UTC-5, PST"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    GitHub URL
                  </label>
                  <div className="relative">
                    <Github className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="url"
                      name="github_url"
                      value={formData.github_url}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="input-field pl-10 disabled:bg-gray-50 disabled:text-gray-500"
                      placeholder="https://github.com/username"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    LinkedIn URL
                  </label>
                  <div className="relative">
                    <Linkedin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="url"
                      name="linkedin_url"
                      value={formData.linkedin_url}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="input-field pl-10 disabled:bg-gray-50 disabled:text-gray-500"
                      placeholder="https://linkedin.com/in/username"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Team Size
                  </label>
                  <select
                    name="team_size_preference"
                    value={formData.team_size_preference}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="input-field disabled:bg-gray-50 disabled:text-gray-500"
                  >
                    {teamSizeOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time Commitment
                  </label>
                  <select
                    name="time_commitment"
                    value={formData.time_commitment}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="input-field disabled:bg-gray-50 disabled:text-gray-500"
                  >
                    {timeCommitmentOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    name="remote_preference"
                    checked={formData.remote_preference}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="rounded border-gray-300 text-sundai-600 focus:ring-sundai-500 disabled:opacity-50"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Prefer remote collaboration
                  </span>
                </label>
              </div>

              {isEditing && (
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="flex-1 btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 btn-primary flex items-center justify-center space-x-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Save Changes</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </form>
          </motion.div>
        </div>

        {/* Profile Summary */}
        <div className="lg:col-span-1">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Profile Summary</h2>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-sundai-100 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-sundai-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {user?.full_name || 'Not set'}
                  </p>
                  <p className="text-sm text-gray-600">@{user?.username}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Quick Stats</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Experience:</span>
                    <span className="font-medium text-gray-900 capitalize">
                      {user?.experience_level || 'Not set'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Skills:</span>
                    <span className="font-medium text-gray-900">
                      {user?.skills?.length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Team Size:</span>
                    <span className="font-medium text-gray-900">
                      {user?.team_size_preference || 'Not set'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Remote:</span>
                    <span className="font-medium text-gray-900">
                      {user?.remote_preference ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
              </div>

              {user?.skills && user.skills.length > 0 && (
                <div className="border-t pt-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {user.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-sundai-100 text-sundai-800"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Profile; 