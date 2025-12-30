import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Users, CreditCard, Globe, Save, UserPlus, Trash2, Shield, Lock, UserCog, LayoutDashboard, DollarSign, Briefcase, Upload, X, Image, Workflow, Layout } from 'lucide-react';
import { useOrganization } from '../contexts/OrganizationContext';
import { usePermissions } from '../hooks/usePermissions';
import { supabase } from '../lib/supabase';
import PricingPlans from '../components/PricingPlans';
import ComplementaryUserManager from '../components/ComplementaryUserManager';
import SuperAdminDashboard from '../components/SuperAdminDashboard';
import PricingConfig from '../components/PricingConfig';
import RoleManager from '../components/roles/RoleManager';
import WorkflowManager from '../components/workflows/WorkflowManager';
import { CostReviewWorkflowManager } from '../components/pm/CostReviewWorkflowManager';
import WorkspaceCustomization from '../components/WorkspaceCustomization';
import {
  updateOrganization,
  getOrganizationMembers,
  inviteUserToOrganization,
  updateMemberRole,
  removeMemberFromOrganization,
  getActiveMemberCount,
  getOrganizationRolesForDropdown,
  MemberWithUser
} from '../utils/organizationDatabase';

type TabType = 'general' | 'users' | 'roles' | 'workflows' | 'cost-workflows' | 'workspace' | 'admin-dashboard' | 'complementary' | 'pricing-config' | 'subscription';

const CURRENCIES = [
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ' },
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'SAR', name: 'Saudi Riyal', symbol: 'ر.س' },
  { code: 'QAR', name: 'Qatari Riyal', symbol: 'ر.ق' },
  { code: 'OMR', name: 'Omani Rial', symbol: 'ر.ع.' },
  { code: 'KWD', name: 'Kuwaiti Dinar', symbol: 'د.ك' },
];

const DATE_FORMATS = [
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (25/12/2024)' },
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (12/25/2024)' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (2024-12-25)' },
];

const TIMEZONES = [
  { value: 'Asia/Dubai', label: 'Dubai (GMT+4)' },
  { value: 'Asia/Riyadh', label: 'Riyadh (GMT+3)' },
  { value: 'Europe/London', label: 'London (GMT+0)' },
  { value: 'America/New_York', label: 'New York (GMT-5)' },
  { value: 'Asia/Singapore', label: 'Singapore (GMT+8)' },
];

export default function Settings() {
  const { organization, subscription, loading, refreshOrganization, refreshSubscription } = useOrganization();
  const { canUpdateSettings, canManageUsers, canViewSubscription, userRole, loading: permissionsLoading } = usePermissions();
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [checkingSuperAdmin, setCheckingSuperAdmin] = useState(true);
  const [saving, setSaving] = useState(false);
  const [members, setMembers] = useState<MemberWithUser[]>([]);
  const [memberCount, setMemberCount] = useState(0);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // General settings state
  const [orgName, setOrgName] = useState('');
  const [currency, setCurrency] = useState('AED');
  const [vatRate, setVatRate] = useState(0);
  const [dateFormat, setDateFormat] = useState('DD/MM/YYYY');
  const [timezone, setTimezone] = useState('Asia/Dubai');

  // User invitation state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<string>('');
  const [inviting, setInviting] = useState(false);
  const [availableRoles, setAvailableRoles] = useState<{ id: string; name: string; type: 'system' | 'custom' }[]>([]);

  // Logo upload state
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  useEffect(() => {
    checkSuperAdminStatus();
  }, []);

  useEffect(() => {
    if (organization) {
      setOrgName(organization.name);
      setCurrency(organization.currency);
      setVatRate(organization.vat_rate);
      setDateFormat(organization.date_format);
      setTimezone(organization.timezone);
      setLogoUrl(organization.logo_url || null);
      setLogoPreview(organization.logo_url || null);
      loadAvailableRoles();
    }
  }, [organization]);

  const loadAvailableRoles = async () => {
    if (!organization) return;
    const roles = await getOrganizationRolesForDropdown(organization.id);
    setAvailableRoles(roles);
    // Set default role to first available role
    if (roles.length > 0 && !inviteRole) {
      setInviteRole(roles[0].id);
    }
  };

  const checkSuperAdminStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsSuperAdmin(false);
        setCurrentUser(null);
        return;
      }

      setCurrentUser(user);

      const { data, error } = await supabase.rpc('is_super_admin', {
        check_user_id: user.id
      });

      if (!error && data === true) {
        setIsSuperAdmin(true);
      }
    } catch (error) {
      console.error('Error checking super admin status:', error);
    } finally {
      setCheckingSuperAdmin(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'users' && organization) {
      loadMembers();
      loadMemberCount();
    }
  }, [activeTab, organization]);

  const loadMembers = async () => {
    if (!organization) return;
    setLoadingMembers(true);
    const result = await getOrganizationMembers(organization.id);
    if (result.success && result.data) {
      setMembers(result.data);
    }
    setLoadingMembers(false);
  };

  const loadMemberCount = async () => {
    if (!organization) return;
    const result = await getActiveMemberCount(organization.id);
    if (result.success && result.count !== undefined) {
      setMemberCount(result.count);
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !organization) return;

    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('File size must be less than 2MB');
      return;
    }

    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      alert('Only PNG, JPG, JPEG, and SVG files are allowed');
      return;
    }

    setUploadingLogo(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${organization.id}/logo.${fileExt}`;

      if (logoUrl) {
        const oldPath = logoUrl.split('/').pop();
        if (oldPath) {
          await supabase.storage
            .from('organization-logos')
            .remove([`${organization.id}/${oldPath}`]);
        }
      }

      const { error: uploadError } = await supabase.storage
        .from('organization-logos')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('organization-logos')
        .getPublicUrl(fileName);

      const result = await updateOrganization(organization.id, {
        logo_url: publicUrl,
      });

      if (result.success) {
        setLogoUrl(publicUrl);
        setLogoPreview(publicUrl);
        await refreshOrganization();
        alert('Logo uploaded successfully!');
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      console.error('Logo upload error:', error);
      alert(`Failed to upload logo: ${error.message}`);
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleRemoveLogo = async () => {
    if (!organization || !logoUrl) return;

    if (!confirm('Remove organization logo?')) return;

    try {
      const fileName = logoUrl.split('/').slice(-2).join('/');

      await supabase.storage
        .from('organization-logos')
        .remove([fileName]);

      const result = await updateOrganization(organization.id, {
        logo_url: null,
      });

      if (result.success) {
        setLogoUrl(null);
        setLogoPreview(null);
        await refreshOrganization();
        alert('Logo removed successfully!');
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      console.error('Logo removal error:', error);
      alert(`Failed to remove logo: ${error.message}`);
    }
  };

  const handleSaveGeneral = async () => {
    if (!organization) return;

    setSaving(true);
    const result = await updateOrganization(organization.id, {
      name: orgName,
      currency,
      vat_rate: vatRate,
      date_format: dateFormat,
      timezone,
    });

    if (result.success) {
      alert('Settings saved successfully!');
      await refreshOrganization();
    } else {
      alert(`Failed to save settings: ${result.error}`);
    }
    setSaving(false);
  };

  const handleInviteUser = async () => {
    if (!organization || !inviteEmail) return;

    setInviting(true);
    const result = await inviteUserToOrganization(organization.id, inviteEmail, inviteRole);

    if (result.success) {
      alert('User invited successfully!');
      setInviteEmail('');
      await loadMembers();
      await loadMemberCount();
    } else {
      alert(`Failed to invite user: ${result.error}`);
    }
    setInviting(false);
  };

  const handleRemoveMember = async (memberId: string, email?: string) => {
    if (!confirm(`Remove ${email || 'this user'} from the organization?`)) return;

    const result = await removeMemberFromOrganization(memberId);
    if (result.success) {
      alert('Member removed successfully!');
      await loadMembers();
      await loadMemberCount();
    } else {
      alert(`Failed to remove member: ${result.error}`);
    }
  };

  const handleChangeRole = async (memberId: string, newRoleId: string) => {
    const result = await updateMemberRole(memberId, newRoleId);
    if (result.success) {
      alert('Role updated successfully!');
      await loadMembers();
      await loadAvailableRoles();
    } else {
      alert(`Failed to update role: ${result.error}`);
    }
  };

  const handleUpgrade = async (plan: string, billingCycle: string) => {
    if (!organization) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('Please log in to upgrade your plan');
        return;
      }

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout-session`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ plan, billingCycle }),
      });

      const data = await response.json();

      if (response.ok && data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else {
        alert(`Failed to create checkout session: ${data.error || 'Unknown error'}`);
      }
    } catch (error: any) {
      console.error('Upgrade error:', error);
      alert(`Failed to upgrade: ${error.message}`);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-blue-100 text-blue-800';
      case 'admin': return 'bg-green-100 text-green-800';
      case 'estimator': return 'bg-orange-100 text-orange-800';
      case 'viewer': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPlanBadgeColor = (plan: string) => {
    switch (plan) {
      case 'free': return 'bg-gray-100 text-gray-800';
      case 'starter': return 'bg-blue-100 text-blue-800';
      case 'professional': return 'bg-purple-100 text-purple-800';
      case 'enterprise': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading || permissionsLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 font-semibold mb-2">Unable to load organization</p>
          <p className="text-gray-600">Please try refreshing the page</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <SettingsIcon className="w-8 h-8" />
            Settings
          </h1>
          <p className="text-blue-100">Manage your organization settings, users, and subscription</p>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <div className="flex overflow-x-auto">
              {isSuperAdmin && (
                <button
                  onClick={() => setActiveTab('admin-dashboard')}
                  className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors whitespace-nowrap ${
                    activeTab === 'admin-dashboard'
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <LayoutDashboard className="w-5 h-5" />
                  Admin Dashboard
                </button>
              )}
              <button
                onClick={() => setActiveTab('general')}
                className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors whitespace-nowrap ${
                  activeTab === 'general'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Globe className="w-5 h-5" />
                General Settings
              </button>
              <button
                onClick={() => setActiveTab('workspace')}
                className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors whitespace-nowrap ${
                  activeTab === 'workspace'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Layout className="w-5 h-5" />
                Workspace
              </button>
              {canManageUsers() && (
                <button
                  onClick={() => setActiveTab('users')}
                  className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors whitespace-nowrap ${
                    activeTab === 'users'
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <Users className="w-5 h-5" />
                  User Management
                </button>
              )}
              {canManageUsers() && (
                <button
                  onClick={() => setActiveTab('roles')}
                  className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors whitespace-nowrap ${
                    activeTab === 'roles'
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <Shield className="w-5 h-5" />
                  Roles & Permissions
                </button>
              )}
              {canManageUsers() && (
                <button
                  onClick={() => setActiveTab('workflows')}
                  className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors whitespace-nowrap ${
                    activeTab === 'workflows'
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <Workflow className="w-5 h-5" />
                  Approval Workflows
                </button>
              )}
              {canManageUsers() && (
                <button
                  onClick={() => setActiveTab('cost-workflows')}
                  className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors whitespace-nowrap ${
                    activeTab === 'cost-workflows'
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <DollarSign className="w-5 h-5" />
                  Cost Reviews
                </button>
              )}
              {isSuperAdmin && (
                <button
                  onClick={() => setActiveTab('complementary')}
                  className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors whitespace-nowrap ${
                    activeTab === 'complementary'
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <UserCog className="w-5 h-5" />
                  Complementary Users
                </button>
              )}
              {isSuperAdmin && (
                <button
                  onClick={() => setActiveTab('pricing-config')}
                  className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors whitespace-nowrap ${
                    activeTab === 'pricing-config'
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <DollarSign className="w-5 h-5" />
                  Pricing Config
                </button>
              )}
              {canViewSubscription() && (
                <button
                  onClick={() => setActiveTab('subscription')}
                  className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors whitespace-nowrap ${
                    activeTab === 'subscription'
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <CreditCard className="w-5 h-5" />
                  Subscription
                </button>
              )}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'admin-dashboard' && isSuperAdmin && (
              <SuperAdminDashboard />
            )}

            {activeTab === 'general' && (
              <div className="space-y-6">
                {!canUpdateSettings() && (
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                    <div className="flex items-center gap-2">
                      <Lock className="w-5 h-5 text-yellow-600" />
                      <p className="text-sm text-yellow-700">
                        <strong>View-only mode:</strong> You need Admin or Owner role to modify these settings. Your current role: <span className="capitalize">{userRole || 'unknown'}</span>
                      </p>
                    </div>
                  </div>
                )}

                <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
                  <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                    <Image className="w-5 h-5" />
                    Organization Logo
                  </label>
                  <div className="flex items-start gap-6">
                    {logoPreview ? (
                      <div className="relative group">
                        <img
                          src={logoPreview}
                          alt="Organization Logo"
                          className="w-32 h-32 object-contain border-2 border-gray-300 rounded-lg bg-white"
                        />
                        {canUpdateSettings() && (
                          <button
                            onClick={handleRemoveLogo}
                            className="absolute -top-2 -right-2 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Remove logo"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-white">
                        <Image className="w-12 h-12 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="text-sm text-gray-600 mb-3">
                        Upload your organization logo. It will appear in the app and on all exported documents (PDF and Excel).
                      </p>
                      <p className="text-xs text-gray-500 mb-4">
                        Recommended: 200x200px to 800x800px • Max 2MB • PNG, JPG, or SVG
                      </p>
                      {canUpdateSettings() && (
                        <label className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer transition-colors">
                          <Upload className="w-4 h-4" />
                          {uploadingLogo ? 'Uploading...' : logoPreview ? 'Replace Logo' : 'Upload Logo'}
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                            onChange={handleLogoUpload}
                            disabled={uploadingLogo}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Organization Name
                  </label>
                  <input
                    type="text"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    disabled={!canUpdateSettings()}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="My Company"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Currency
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    disabled={!canUpdateSettings()}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    {CURRENCIES.map((curr) => (
                      <option key={curr.code} value={curr.code}>
                        {curr.code} - {curr.name} ({curr.symbol})
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-sm text-gray-500">
                    This currency will be used throughout all estimators
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    VAT/Tax Rate (%)
                  </label>
                  <input
                    type="number"
                    value={vatRate}
                    onChange={(e) => setVatRate(parseFloat(e.target.value) || 0)}
                    min="0"
                    max="100"
                    step="0.1"
                    disabled={!canUpdateSettings()}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="5.0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date Format
                  </label>
                  <select
                    value={dateFormat}
                    onChange={(e) => setDateFormat(e.target.value)}
                    disabled={!canUpdateSettings()}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    {DATE_FORMATS.map((format) => (
                      <option key={format.value} value={format.value}>
                        {format.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Timezone
                  </label>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    disabled={!canUpdateSettings()}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    {TIMEZONES.map((tz) => (
                      <option key={tz.value} value={tz.value}>
                        {tz.label}
                      </option>
                    ))}
                  </select>
                </div>

                {canUpdateSettings() && (
                  <button
                    onClick={handleSaveGeneral}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Save className="w-5 h-5" />
                    {saving ? 'Saving...' : 'Save Settings'}
                  </button>
                )}
              </div>
            )}

            {activeTab === 'workspace' && currentUser && (
              <WorkspaceCustomization user={currentUser} />
            )}

            {activeTab === 'users' && (
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold text-blue-900">Active Users</h3>
                      <p className="text-sm text-blue-700">
                        {memberCount} of {subscription?.user_limit || 0} users
                      </p>
                    </div>
                    {subscription && memberCount >= subscription.user_limit && (
                      <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
                        Limit Reached
                      </span>
                    )}
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <UserPlus className="w-5 h-5" />
                    Invite User
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="user@example.com"
                      className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    />
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    >
                      {availableRoles.map(role => (
                        <option key={role.id} value={role.id}>
                          {role.name} {role.type === 'custom' && '(Custom)'}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={handleInviteUser}
                      disabled={inviting || !inviteEmail || (subscription && memberCount >= subscription.user_limit)}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {inviting ? 'Inviting...' : 'Invite'}
                    </button>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    Note: User must already have an account before you can invite them
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-800 mb-4">Organization Members</h3>
                  {loadingMembers ? (
                    <div className="text-center py-8">
                      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                    </div>
                  ) : members.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No members yet</p>
                  ) : (
                    <div className="space-y-2">
                      {members.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <span className="font-medium text-gray-800">
                                {member.first_name && member.last_name
                                  ? `${member.first_name} ${member.last_name}`
                                  : member.first_name || member.last_name || member.email || member.user_email}
                              </span>
                              {(member.first_name || member.last_name) && (
                                <span className="text-sm text-gray-600">({member.email || member.user_email})</span>
                              )}
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(member.role)}`}>
                                {member.role_name || (member.role.charAt(0).toUpperCase() + member.role.slice(1))}
                              </span>
                              {member.status === 'pending' && (
                                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                                  Pending
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-500 mt-1">
                              {member.joined_at
                                ? `Joined ${new Date(member.joined_at).toLocaleDateString()}`
                                : `Invited ${new Date(member.invited_at).toLocaleDateString()}`}
                            </p>
                          </div>
                          {member.role !== 'owner' && (
                            <div className="flex items-center gap-2">
                              <select
                                value={member.role_id || member.role}
                                onChange={(e) => handleChangeRole(member.id, e.target.value)}
                                className="px-3 py-1 border border-gray-300 rounded-md text-sm"
                              >
                                {availableRoles.map(role => (
                                  <option key={role.id} value={role.id}>
                                    {role.name} {role.type === 'custom' && '(Custom)'}
                                  </option>
                                ))}
                              </select>
                              <button
                                onClick={() => handleRemoveMember(member.id, member.email || member.user_email || '')}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                title="Remove member"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'complementary' && isSuperAdmin && (
              <ComplementaryUserManager />
            )}


            {activeTab === 'roles' && (
              <RoleManager />
            )}

            {activeTab === 'workflows' && (
              <WorkflowManager />
            )}

            {activeTab === 'cost-workflows' && (
              <CostReviewWorkflowManager />
            )}

            {activeTab === 'pricing-config' && isSuperAdmin && (
              <PricingConfig />
            )}

            {activeTab === 'subscription' && subscription && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-700 font-medium mb-1">Current Plan</p>
                    <p className={`text-2xl font-bold capitalize ${getPlanBadgeColor(subscription.plan)}`}>
                      {subscription.plan}
                    </p>
                  </div>

                  <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-700 font-medium mb-1">Status</p>
                    <p className="text-2xl font-bold capitalize text-green-900">{subscription.status}</p>
                  </div>

                  <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg">
                    <p className="text-sm text-purple-700 font-medium mb-1">User Limit</p>
                    <p className="text-2xl font-bold text-purple-900">
                      {memberCount} / {subscription.user_limit}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-6">
                    {subscription.plan === 'free' ? 'Upgrade Your Plan' : 'Available Plans'}
                  </h3>
                  <PricingPlans onSelectPlan={handleUpgrade} />
                </div>

                <div className="border border-gray-200 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Subscription Details
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between py-2 border-b border-gray-200">
                      <span className="text-gray-600">Billing Cycle</span>
                      <span className="font-medium text-gray-900 capitalize">{subscription.billing_cycle}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-200">
                      <span className="text-gray-600">Amount</span>
                      <span className="font-medium text-gray-900">
                        {subscription.amount > 0 ? `${subscription.amount} ${organization.currency}` : 'Free'}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-200">
                      <span className="text-gray-600">Current Period</span>
                      <span className="font-medium text-gray-900">
                        {new Date(subscription.current_period_start).toLocaleDateString()} - {new Date(subscription.current_period_end).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                {subscription.plan !== 'free' && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-2">Need to make changes to your subscription?</p>
                    <button className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors text-sm">
                      Manage Billing
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
