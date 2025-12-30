import { useState, useEffect } from 'react';
import { UserPlus, Trash2, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ComplementaryUser {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  plan?: string;
}

export default function ComplementaryUserManager() {
  const [users, setUsers] = useState<ComplementaryUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [plan, setPlan] = useState<'free' | 'starter' | 'professional' | 'enterprise'>('free');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    loadComplementaryUsers();
  }, []);

  const loadComplementaryUsers = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('No session found');
        setLoading(false);
        return;
      }

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/list-complementary-users`;
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setUsers(result.users);
      } else {
        console.error('Failed to load complementary users:', result.error);
      }
    } catch (error) {
      console.error('Error loading complementary users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    if (!email || !password) {
      alert('Email and password are required');
      return;
    }

    if (password.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }

    setCreating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('Please log in to create users');
        return;
      }

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-complementary-user`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          fullName: fullName || undefined,
          plan,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        alert('Complementary user created successfully!');
        setEmail('');
        setPassword('');
        setFullName('');
        setPlan('free');
        setShowForm(false);
        await loadComplementaryUsers();
      } else {
        alert(`Failed to create user: ${result.error || 'Unknown error'}`);
      }
    } catch (error: any) {
      console.error('Error creating complementary user:', error);
      alert(`Failed to create user: ${error.message}`);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (!confirm(`Are you sure you want to delete the user "${userEmail}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('Please log in to delete users');
        return;
      }

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-complementary-user`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        alert('User deleted successfully');
        await loadComplementaryUsers();
      } else {
        alert(`Failed to delete user: ${result.error || 'Unknown error'}`);
      }
    } catch (error: any) {
      console.error('Error deleting user:', error);
      alert(`Failed to delete user: ${error.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Complementary Accounts</h3>
          <p className="text-sm text-gray-600 mt-1">
            Create and manage additional user accounts
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          {showForm ? 'Cancel' : 'Create User'}
        </button>
      </div>

      {showForm && (
        <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
          <h4 className="font-semibold text-gray-800 mb-4">Create New Complementary User</h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="user@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                  placeholder="Minimum 6 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name (Optional)
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subscription Plan *
              </label>
              <select
                value={plan}
                onChange={(e) => setPlan(e.target.value as 'free' | 'starter' | 'professional' | 'enterprise')}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="free">Free (1 user)</option>
                <option value="starter">Starter (5 users)</option>
                <option value="professional">Professional (20 users)</option>
                <option value="enterprise">Enterprise (100 users)</option>
              </select>
              <p className="mt-1 text-sm text-gray-500">
                Complementary users get the plan for free with no expiration
              </p>
            </div>

            <button
              onClick={handleCreateUser}
              disabled={creating || !email || !password}
              className="w-full px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {creating ? 'Creating User...' : 'Create Complementary User'}
            </button>
          </div>
        </div>
      )}

      <div>
        <h4 className="font-semibold text-gray-800 mb-4">Existing Complementary Users</h4>
        {loading ? (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-8 border border-gray-200 rounded-lg bg-gray-50">
            <p className="text-gray-500">No complementary users created yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div>
                  <div className="font-medium text-gray-800">{user.email}</div>
                  {user.full_name && (
                    <div className="text-sm text-gray-600">{user.full_name}</div>
                  )}
                  <div className="text-xs text-gray-500 mt-1">
                    Created {new Date(user.created_at).toLocaleDateString()}
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteUser(user.id, user.email)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  title="Delete user"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
