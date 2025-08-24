import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Key, 
  Plus, 
  Copy, 
  Trash2, 
  Eye, 
  EyeOff, 
  Loader2,
  CheckCircle,
  AlertCircle,
  Calendar,
  Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const ApiKeys = () => {
  const { generateApiKey, getApiKeys, revokeApiKey } = useAuth();
  const [apiKeys, setApiKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showNewKey, setShowNewKey] = useState(false);
  const [newKeyData, setNewKeyData] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: ['read']
  });

  const permissions = [
    { value: 'read', label: 'Read Access', description: 'View data and statistics' },
    { value: 'write', label: 'Write Access', description: 'Create and update data' },
    { value: 'admin', label: 'Admin Access', description: 'Full access to all features' }
  ];

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const fetchApiKeys = async () => {
    const result = await getApiKeys();
    if (result.success) {
      setApiKeys(result.data.keys || []);
    }
    setLoading(false);
  };

  const handleGenerateKey = async (e) => {
    e.preventDefault();
    setGenerating(true);

    const result = await generateApiKey(formData);
    
    if (result.success) {
      setNewKeyData(result.data);
      setShowNewKey(true);
      setShowModal(false);
      setFormData({ name: '', description: '', permissions: ['read'] });
      fetchApiKeys();
    }
    
    setGenerating(false);
  };

  const handleRevokeKey = async (keyId) => {
    if (window.confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) {
      const result = await revokeApiKey(keyId);
      if (result.success) {
        fetchApiKeys();
      }
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('API key copied to clipboard!');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (isActive) => {
    return isActive ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100';
  };

  const getStatusIcon = (isActive) => {
    return isActive ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-sundai-600" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">API Keys</h1>
        <p className="text-gray-600">
          Generate and manage API keys to access the Sundai Hackathon database
        </p>
      </div>

      {/* Generate New Key Button */}
      <div className="mb-8">
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Generate New API Key</span>
        </button>
      </div>

      {/* API Keys List */}
      <div className="grid gap-6">
        {apiKeys.length === 0 ? (
          <div className="card text-center py-12">
            <Key className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No API keys yet</h3>
            <p className="text-gray-600 mb-4">
              Generate your first API key to start accessing the hackathon database
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="btn-primary"
            >
              Generate API Key
            </button>
          </div>
        ) : (
          apiKeys.map((key) => (
            <motion.div
              key={key.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{key.name}</h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(key.is_active)}`}>
                      {getStatusIcon(key.is_active)}
                      <span className="ml-1">{key.is_active ? 'Active' : 'Revoked'}</span>
                    </span>
                  </div>
                  
                  {key.description && (
                    <p className="text-gray-600 mb-3">{key.description}</p>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">
                        Created: {formatDate(key.created_at)}
                      </span>
                    </div>
                    
                    {key.last_used_at && (
                      <div className="flex items-center space-x-2">
                        <Activity className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">
                          Last used: {formatDate(key.last_used_at)}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-2">
                      <Key className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">
                        Usage: {key.usage_count || 0} requests
                      </span>
                    </div>
                  </div>

                  <div className="mt-3">
                    <div className="flex flex-wrap gap-2">
                      {key.permissions.map((permission) => (
                        <span
                          key={permission}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-sundai-100 text-sundai-800"
                        >
                          {permission}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  {key.is_active && (
                    <button
                      onClick={() => handleRevokeKey(key.id)}
                      className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                      title="Revoke key"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Generate Key Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="card max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Generate New API Key</h2>
              
              <form onSubmit={handleGenerateKey} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Key Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input-field"
                    placeholder="e.g., My Local Tool"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description (optional)
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input-field"
                    rows="3"
                    placeholder="What will you use this key for?"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Permissions
                  </label>
                  <div className="space-y-2">
                    {permissions.map((permission) => (
                      <label key={permission.value} className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={formData.permissions.includes(permission.value)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({
                                ...formData,
                                permissions: [...formData.permissions, permission.value]
                              });
                            } else {
                              setFormData({
                                ...formData,
                                permissions: formData.permissions.filter(p => p !== permission.value)
                              });
                            }
                          }}
                          className="rounded border-gray-300 text-sundai-600 focus:ring-sundai-500"
                        />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {permission.label}
                          </div>
                          <div className="text-xs text-gray-500">
                            {permission.description}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={generating}
                    className="flex-1 btn-primary flex items-center justify-center space-x-2"
                  >
                    {generating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Generating...</span>
                      </>
                    ) : (
                      <>
                        <Key className="w-4 h-4" />
                        <span>Generate Key</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* New Key Display */}
      <AnimatePresence>
        {showNewKey && newKeyData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowNewKey(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="card max-w-lg w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-6">
                <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  API Key Generated Successfully!
                </h2>
                <p className="text-gray-600">
                  Copy your API key now. You won't be able to see it again.
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between">
                  <code className="text-sm text-gray-800 break-all">
                    {newKeyData.api_key}
                  </code>
                  <button
                    onClick={() => copyToClipboard(newKeyData.api_key)}
                    className="ml-2 p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-md transition-colors"
                    title="Copy to clipboard"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="flex">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                      Important Security Notice
                    </h3>
                    <p className="text-sm text-yellow-700 mt-1">
                      Store this API key securely. It provides access to your account and cannot be recovered if lost.
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowNewKey(false)}
                className="w-full btn-primary"
              >
                Got it, I've copied my key
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ApiKeys; 