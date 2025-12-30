import { useState, useEffect } from 'react';
import { DollarSign, Save, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface PlanPricing {
  plan: string;
  monthlyPrice: number;
  annualPrice: number;
  userLimit: number;
}

const DEFAULT_PRICING: PlanPricing[] = [
  { plan: 'free', monthlyPrice: 0, annualPrice: 0, userLimit: 1 },
  { plan: 'starter', monthlyPrice: 49, annualPrice: 470, userLimit: 5 },
  { plan: 'professional', monthlyPrice: 149, annualPrice: 1430, userLimit: 20 },
  { plan: 'enterprise', monthlyPrice: 499, annualPrice: 4790, userLimit: 100 },
];

export default function PricingConfig() {
  const [pricing, setPricing] = useState<PlanPricing[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPricing();
  }, []);

  const loadPricing = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('pricing_config')
        .select('*')
        .order('plan');

      if (error) throw error;

      if (data && data.length > 0) {
        const formattedPricing = data.map(p => ({
          plan: p.plan,
          monthlyPrice: parseFloat(p.monthly_price),
          annualPrice: parseFloat(p.annual_price),
          userLimit: p.user_limit,
        }));
        setPricing(formattedPricing);
      }
    } catch (error) {
      console.error('[PRICING] Error loading pricing:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePriceChange = (plan: string, field: keyof PlanPricing, value: number) => {
    setPricing(prev =>
      prev.map(p =>
        p.plan === plan ? { ...p, [field]: value } : p
      )
    );
  };

  const handleSave = async () => {
    setSaving(true);
    let savedCount = 0;
    try {
      for (const plan of pricing) {
        const updateData = {
          monthly_price: plan.monthlyPrice.toString(),
          annual_price: plan.annualPrice.toString(),
          user_limit: plan.userLimit,
          updated_at: new Date().toISOString(),
        };

        const { data, error } = await supabase
          .from('pricing_config')
          .update(updateData)
          .eq('plan', plan.plan)
          .select();

        if (error) {
          console.error(`[PRICING] Error updating ${plan.plan}:`, error);
          alert(`Failed to save ${plan.plan}: ${error.message}\n\nCode: ${error.code}\nDetails: ${error.details}\nHint: ${error.hint}`);
          throw error;
        }

        if (!data || data.length === 0) {
          console.error(`[PRICING] No data returned for ${plan.plan}`);
          alert(`Warning: No rows updated for ${plan.plan}. The plan may not exist in the database.`);
        } else {
          savedCount++;
        }
      }

      if (savedCount === pricing.length) {
        alert(`✅ Successfully saved all ${savedCount} pricing configurations!`);
      } else {
        alert(`⚠️ Partially saved: ${savedCount}/${pricing.length} plans updated.`);
      }

      await loadPricing();
    } catch (error: any) {
      console.error('[PRICING] Error saving pricing:', error);
      alert(`Failed to save pricing: ${error.message || JSON.stringify(error)}`);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('Reset all pricing to default values?')) return;

    setSaving(true);
    try {
      for (const plan of DEFAULT_PRICING) {
        const { error } = await supabase
          .from('pricing_config')
          .update({
            monthly_price: plan.monthlyPrice,
            annual_price: plan.annualPrice,
            user_limit: plan.userLimit,
          })
          .eq('plan', plan.plan);

        if (error) throw error;
      }
      alert('Pricing reset to defaults!');
      await loadPricing();
    } catch (error: any) {
      console.error('Error resetting pricing:', error);
      alert(`Failed to reset pricing: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'free': return 'border-gray-200 bg-gray-50';
      case 'starter': return 'border-blue-200 bg-blue-50';
      case 'professional': return 'border-green-200 bg-green-50';
      case 'enterprise': return 'border-orange-200 bg-orange-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="mt-4 text-gray-600">Loading pricing configuration...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Subscription Pricing Configuration</h3>
          <p className="text-sm text-gray-600 mt-1">
            Configure pricing for each subscription tier (prices are for display purposes)
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Reset to Default
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {pricing.map((plan) => (
          <div
            key={plan.plan}
            className={`border-2 rounded-lg p-6 ${getPlanColor(plan.plan)}`}
          >
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="w-5 h-5 text-gray-700" />
              <h4 className="text-lg font-bold capitalize text-gray-800">{plan.plan} Plan</h4>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monthly Price (USD)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    value={plan.monthlyPrice}
                    onChange={(e) => handlePriceChange(plan.plan, 'monthlyPrice', parseFloat(e.target.value) || 0)}
                    disabled={plan.plan === 'free'}
                    className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Annual Price (USD)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    value={plan.annualPrice}
                    onChange={(e) => handlePriceChange(plan.plan, 'annualPrice', parseFloat(e.target.value) || 0)}
                    disabled={plan.plan === 'free'}
                    className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    min="0"
                    step="0.01"
                  />
                </div>
                {plan.plan !== 'free' && (
                  <p className="mt-1 text-xs text-gray-500">
                    Savings: ${((plan.monthlyPrice * 12) - plan.annualPrice).toFixed(2)}/year
                    ({(((plan.monthlyPrice * 12 - plan.annualPrice) / (plan.monthlyPrice * 12)) * 100).toFixed(0)}% discount)
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  User Limit
                </label>
                <input
                  type="number"
                  value={plan.userLimit}
                  onChange={(e) => handlePriceChange(plan.plan, 'userLimit', parseInt(e.target.value) || 1)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="1"
                />
              </div>

              {plan.monthlyPrice > 0 && (
                <div className="pt-4 border-t border-gray-300">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Monthly per user:</span>
                    <span className="font-semibold text-gray-800">
                      ${(plan.monthlyPrice / plan.userLimit).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-gray-600">Annual per user:</span>
                    <span className="font-semibold text-gray-800">
                      ${(plan.annualPrice / plan.userLimit).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">Note:</h4>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>These prices are displayed to users on the pricing page</li>
          <li>Actual billing is handled through Stripe integration</li>
          <li>The Free plan cannot have pricing changed</li>
          <li>User limits control how many team members can be added to an organization</li>
        </ul>
      </div>
    </div>
  );
}
