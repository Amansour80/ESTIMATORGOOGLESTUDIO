import { useState, useEffect } from 'react';
import { Users, Calendar, DollarSign, Search, CreditCard as Edit, Pause, Play, Trash2, Save, X, Building2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface UserSubscription {
  user_id: string;
  email: string;
  full_name: string | null;
  organization_id: string;
  organization_name: string;
  role: string;
  plan: string;
  status: string;
  user_limit: number;
  amount: number;
  billing_cycle: string;
  current_period_start: string;
  current_period_end: string;
  created_at: string;
  complementary_account: boolean;
}

interface EditingSubscription {
  user_id: string;
  organization_id: string;
  role: string;
  plan: string;
  status: string;
  user_limit: number;
  amount: number;
  current_period_end: string;
}

interface Organization {
  id: string;
  name: string;
}

interface AssigningOrganization {
  user_id: string;
  email: string;
  selected_org_id: string;
  create_new_org: boolean;
  new_org_name: string;
}

export default function SuperAdminDashboard() {
  const [users, setUsers] = useState<UserSubscription[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlan, setFilterPlan] = useState<string>('all');
  const [editingUser, setEditingUser] = useState<EditingSubscription | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [assigningOrg, setAssigningOrg] = useState<AssigningOrganization | null>(null);

  useEffect(() => {
    loadAllUsers();
    loadOrganizations();
  }, []);

  const loadOrganizations = async () => {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name')
        .order('name');

      if (error) throw error;
      if (data) setOrganizations(data);
    } catch (error) {
      console.error('Error loading organizations:', error);
    }
  };

  useEffect(() => {
    let filtered = users;

    if (searchTerm) {
      filtered = filtered.filter(u =>
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.organization_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterPlan !== 'all') {
      filtered = filtered.filter(u => u.plan === filterPlan);
    }

    setFilteredUsers(filtered);
  }, [users, searchTerm, filterPlan]);

  const loadAllUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select(`
          id,
          full_name,
          complementary_account,
          created_at
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        // Get all user emails in one call
        const userIds = data.map(p => p.id);
        const { data: emailData } = await supabase.rpc('get_user_emails', { user_ids: userIds });
        const emailMap = new Map(emailData?.map(e => [e.id, e.email]) || []);

        const usersWithDetails = await Promise.all(
          data.map(async (profile) => {
            const { data: orgMember } = await supabase
              .from('organization_members')
              .select('organization_id, role')
              .eq('user_id', profile.id)
              .maybeSingle();

            let orgData = null;
            let subData = null;

            if (orgMember) {
              const { data: org } = await supabase
                .from('organizations')
                .select('id, name')
                .eq('id', orgMember.organization_id)
                .maybeSingle();

              const { data: sub } = await supabase
                .from('subscriptions')
                .select('*')
                .eq('organization_id', orgMember.organization_id)
                .maybeSingle();

              orgData = org;
              subData = sub;
            }

            return {
              user_id: profile.id,
              email: emailMap.get(profile.id) || 'Unknown',
              full_name: profile.full_name,
              organization_id: orgData?.id || '',
              organization_name: orgData?.name || 'No Organization',
              role: orgMember?.role || 'none',
              plan: subData?.plan || 'none',
              status: subData?.status || 'inactive',
              user_limit: subData?.user_limit || 0,
              amount: subData?.amount || 0,
              billing_cycle: subData?.billing_cycle || 'monthly',
              current_period_start: subData?.current_period_start || '',
              current_period_end: subData?.current_period_end || '',
              created_at: profile.created_at,
              complementary_account: profile.complementary_account,
            };
          })
        );

        setUsers(usersWithDetails as UserSubscription[]);
        setFilteredUsers(usersWithDetails as UserSubscription[]);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubscription = (user: UserSubscription) => {
    setEditingUser({
      user_id: user.user_id,
      organization_id: user.organization_id,
      role: user.role,
      plan: user.plan,
      status: user.status,
      user_limit: user.user_limit,
      amount: user.amount,
      current_period_end: user.current_period_end.split('T')[0],
    });
  };

  const handleSaveSubscription = async () => {
    if (!editingUser) return;

    try {
      const user = users.find(u => u.user_id === editingUser.user_id);

      if (!user) {
        alert('User not found');
        return;
      }

      if (!user.organization_id) {
        alert('User does not have an organization. Cannot update subscription.');
        return;
      }

      const { data, error } = await supabase
        .from('subscriptions')
        .update({
          plan: editingUser.plan,
          status: editingUser.status,
          user_limit: editingUser.user_limit,
          amount: editingUser.amount,
          current_period_end: new Date(editingUser.current_period_end).toISOString(),
        })
        .eq('organization_id', user.organization_id)
        .select();

      if (error) throw error;

      if (editingUser.role !== user.role) {
        const { error: roleError } = await supabase
          .from('organization_members')
          .update({ role: editingUser.role })
          .eq('user_id', editingUser.user_id)
          .eq('organization_id', editingUser.organization_id);

        if (roleError) throw roleError;
      }

      if (!data || data.length === 0) {
        alert('No subscription found for this organization. Creating one...');

        const { error: insertError } = await supabase
          .from('subscriptions')
          .insert({
            organization_id: user.organization_id,
            plan: editingUser.plan,
            status: editingUser.status,
            user_limit: editingUser.user_limit,
            amount: editingUser.amount,
            billing_cycle: 'monthly',
            current_period_start: new Date().toISOString(),
            current_period_end: new Date(editingUser.current_period_end).toISOString(),
          });

        if (insertError) throw insertError;
      }

      alert('Subscription updated successfully!');
      setEditingUser(null);
      await loadAllUsers();
    } catch (error: any) {
      console.error('Error updating subscription:', error);
      alert(`Failed to update subscription: ${error.message}`);
    }
  };

  const handleAssignOrganization = (user: UserSubscription) => {
    setAssigningOrg({
      user_id: user.user_id,
      email: user.email,
      selected_org_id: user.organization_id || '',
      create_new_org: false,
      new_org_name: '',
    });
  };

  const handleSaveOrganizationAssignment = async () => {
    if (!assigningOrg) return;

    try {
      let orgId = assigningOrg.selected_org_id;

      // Create new organization if requested
      if (assigningOrg.create_new_org && assigningOrg.new_org_name.trim()) {
        const { data: newOrg, error: orgError } = await supabase
          .from('organizations')
          .insert({ name: assigningOrg.new_org_name.trim() })
          .select()
          .single();

        if (orgError) throw orgError;
        orgId = newOrg.id;
      }

      if (!orgId) {
        alert('Please select or create an organization');
        return;
      }

      // First, delete ALL existing memberships for this user
      const { error: deleteError } = await supabase
        .from('organization_members')
        .delete()
        .eq('user_id', assigningOrg.user_id);

      if (deleteError) {
        console.error('Error deleting existing memberships:', deleteError);
        throw deleteError;
      }

      // Now insert the new membership (using upsert to handle any edge cases)
      const { error: upsertError } = await supabase
        .from('organization_members')
        .upsert({
          user_id: assigningOrg.user_id,
          organization_id: orgId,
          role: 'owner',
          status: 'active',
        }, {
          onConflict: 'organization_id,user_id',
          ignoreDuplicates: false
        });

      if (upsertError) {
        console.error('Error creating membership:', upsertError);
        throw upsertError;
      }

      // Create a default subscription for the organization if it doesn't exist
      const { data: existingSub } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('organization_id', orgId)
        .maybeSingle();

      if (!existingSub) {
        const { error: subError } = await supabase
          .from('subscriptions')
          .insert({
            organization_id: orgId,
            plan: 'free',
            status: 'active',
            user_limit: 1,
            amount: 0,
            billing_cycle: 'monthly',
            current_period_start: new Date().toISOString(),
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          });

        if (subError) throw subError;
      }

      alert('Organization assigned successfully!');
      setAssigningOrg(null);
      await loadAllUsers();
      await loadOrganizations();
    } catch (error: any) {
      console.error('Error assigning organization:', error);
      alert(`Failed to assign organization: ${error.message}`);
    }
  };

  const handleToggleStatus = async (user: UserSubscription) => {
    try {
      const newStatus = user.status === 'active' ? 'cancelled' : 'active';

      const { error } = await supabase
        .from('subscriptions')
        .update({ status: newStatus })
        .eq('organization_id', user.organization_id);

      if (error) throw error;

      alert(`Subscription ${newStatus === 'active' ? 'activated' : 'paused'} successfully!`);
      await loadAllUsers();
    } catch (error: any) {
      console.error('Error toggling status:', error);
      alert(`Failed to update status: ${error.message}`);
    }
  };

  const handleDeleteUser = async (user: UserSubscription) => {
    if (!confirm(`Are you sure you want to delete "${user.email}"? This will permanently delete their account and all data.`)) {
      return;
    }

    try {
      const { error } = await supabase.auth.admin.deleteUser(user.user_id);
      if (error) throw error;

      alert('User deleted successfully');
      await loadAllUsers();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      alert(`Failed to delete user: ${error.message}`);
    }
  };

  const getPlanBadgeColor = (plan: string) => {
    switch (plan) {
      case 'free': return 'bg-gray-100 text-gray-800';
      case 'starter': return 'bg-blue-100 text-blue-800';
      case 'professional': return 'bg-green-100 text-green-800';
      case 'enterprise': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'past_due': return 'bg-yellow-100 text-yellow-800';
      case 'trialing': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const stats = {
    total: users.length,
    active: users.filter(u => u.status === 'active').length,
    free: users.filter(u => u.plan === 'free').length,
    paid: users.filter(u => u.plan !== 'free' && u.plan !== 'none').length,
    complementary: users.filter(u => u.complementary_account).length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-800">All Users & Subscriptions</h3>
        <p className="text-sm text-gray-600 mt-1">
          View and manage all user accounts and their subscription plans
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-blue-700 mb-1">
            <Users className="w-4 h-4" />
            <span className="text-sm font-medium">Total Users</span>
          </div>
          <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-green-700 mb-1">
            <Play className="w-4 h-4" />
            <span className="text-sm font-medium">Active</span>
          </div>
          <p className="text-2xl font-bold text-green-900">{stats.active}</p>
        </div>

        <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-gray-700 mb-1">
            <Users className="w-4 h-4" />
            <span className="text-sm font-medium">Free Plan</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.free}</p>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-orange-700 mb-1">
            <DollarSign className="w-4 h-4" />
            <span className="text-sm font-medium">Paid Plans</span>
          </div>
          <p className="text-2xl font-bold text-orange-900">{stats.paid}</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-purple-700 mb-1">
            <Users className="w-4 h-4" />
            <span className="text-sm font-medium">Complementary</span>
          </div>
          <p className="text-2xl font-bold text-purple-900">{stats.complementary}</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by email, name, or organization..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          value={filterPlan}
          onChange={(e) => setFilterPlan(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Plans</option>
          <option value="free">Free</option>
          <option value="starter">Starter</option>
          <option value="professional">Professional</option>
          <option value="enterprise">Enterprise</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">User</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Organization</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Role</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Plan</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Period End</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Type</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.user_id} className="hover:bg-gray-50">
                  {editingUser?.user_id === user.user_id ? (
                    <>
                      <td className="px-4 py-3" colSpan={8}>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
                          <div className="font-semibold text-gray-800">Editing: {user.email}</div>
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Role</label>
                              <select
                                value={editingUser.role}
                                onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                              >
                                <option value="owner">Owner</option>
                                <option value="admin">Admin</option>
                                <option value="estimator">Estimator</option>
                                <option value="viewer">Viewer</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Plan</label>
                              <select
                                value={editingUser.plan}
                                onChange={(e) => setEditingUser({ ...editingUser, plan: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                              >
                                <option value="free">Free</option>
                                <option value="starter">Starter</option>
                                <option value="professional">Professional</option>
                                <option value="enterprise">Enterprise</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                              <select
                                value={editingUser.status}
                                onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                              >
                                <option value="active">Active</option>
                                <option value="cancelled">Cancelled</option>
                                <option value="past_due">Past Due</option>
                                <option value="trialing">Trialing</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">User Limit</label>
                              <input
                                type="number"
                                value={editingUser.user_limit}
                                onChange={(e) => setEditingUser({ ...editingUser, user_limit: parseInt(e.target.value) })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Amount</label>
                              <input
                                type="number"
                                value={editingUser.amount}
                                onChange={(e) => setEditingUser({ ...editingUser, amount: parseFloat(e.target.value) })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                              />
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-xs font-medium text-gray-700 mb-1">Period End Date</label>
                              <input
                                type="date"
                                value={editingUser.current_period_end}
                                onChange={(e) => setEditingUser({ ...editingUser, current_period_end: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                              />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={handleSaveSubscription}
                              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                            >
                              <Save className="w-4 h-4" />
                              Save Changes
                            </button>
                            <button
                              onClick={() => setEditingUser(null)}
                              className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 text-sm"
                            >
                              <X className="w-4 h-4" />
                              Cancel
                            </button>
                          </div>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-800">{user.email}</div>
                        {user.full_name && <div className="text-sm text-gray-600">{user.full_name}</div>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-800">{user.organization_name}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium capitalize ${
                          user.role === 'owner' ? 'bg-blue-100 text-blue-800' :
                          user.role === 'admin' ? 'bg-green-100 text-green-800' :
                          user.role === 'estimator' ? 'bg-orange-100 text-orange-800' :
                          user.role === 'viewer' ? 'bg-gray-100 text-gray-800' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium capitalize ${getPlanBadgeColor(user.plan)}`}>
                          {user.plan}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusBadgeColor(user.status)}`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-800">
                          {user.current_period_end ? new Date(user.current_period_end).toLocaleDateString() : 'N/A'}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {user.complementary_account && (
                          <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            Complementary
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleAssignOrganization(user)}
                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                            title="Assign organization"
                          >
                            <Building2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEditSubscription(user)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                            title="Edit subscription"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(user)}
                            className={`p-2 rounded-md transition-colors ${
                              user.status === 'active'
                                ? 'text-orange-600 hover:bg-orange-50'
                                : 'text-green-600 hover:bg-green-50'
                            }`}
                            title={user.status === 'active' ? 'Pause subscription' : 'Activate subscription'}
                          >
                            {user.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                            title="Delete user"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {filteredUsers.length === 0 && !loading && (
        <div className="text-center py-12 border border-gray-200 rounded-lg bg-gray-50">
          <p className="text-gray-500">No users found matching your filters</p>
        </div>
      )}

      {assigningOrg && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold mb-4">Assign Organization</h3>
            <p className="text-sm text-gray-600 mb-4">User: {assigningOrg.email}</p>

            <div className="space-y-4">
              <div>
                <label className="flex items-center space-x-2 mb-3">
                  <input
                    type="radio"
                    checked={!assigningOrg.create_new_org}
                    onChange={() => setAssigningOrg({ ...assigningOrg, create_new_org: false })}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm font-medium text-gray-700">Select existing organization</span>
                </label>
                {!assigningOrg.create_new_org && (
                  <select
                    value={assigningOrg.selected_org_id}
                    onChange={(e) => setAssigningOrg({ ...assigningOrg, selected_org_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select an organization</option>
                    {organizations.map((org) => (
                      <option key={org.id} value={org.id}>
                        {org.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="flex items-center space-x-2 mb-3">
                  <input
                    type="radio"
                    checked={assigningOrg.create_new_org}
                    onChange={() => setAssigningOrg({ ...assigningOrg, create_new_org: true })}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm font-medium text-gray-700">Create new organization</span>
                </label>
                {assigningOrg.create_new_org && (
                  <input
                    type="text"
                    value={assigningOrg.new_org_name}
                    onChange={(e) => setAssigningOrg({ ...assigningOrg, new_org_name: e.target.value })}
                    placeholder="Organization name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setAssigningOrg(null)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveOrganizationAssignment}
                className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
