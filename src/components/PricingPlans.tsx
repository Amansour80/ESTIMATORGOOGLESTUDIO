import { useState, useEffect } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { useOrganization } from '../contexts/OrganizationContext';
import { supabase } from '../lib/supabase';

interface PricingPlansProps {
  onSelectPlan?: (plan: string, billingCycle: string) => void;
}

export default function PricingPlans({ onSelectPlan }: PricingPlansProps) {
  const { subscription } = useOrganization();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');
  const [loading, setLoading] = useState<string | null>(null);
  const [loadingPricing, setLoadingPricing] = useState(true);
  const [pricingData, setPricingData] = useState<Record<string, { monthly: number; annual: number; userLimit: number }>>({});

  useEffect(() => {
    loadPricingConfig();
  }, []);

  const loadPricingConfig = async () => {
    setLoadingPricing(true);
    try {
      const { data, error } = await supabase
        .from('pricing_config')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;

      if (data) {
        const pricing: Record<string, { monthly: number; annual: number; userLimit: number }> = {};
        data.forEach(p => {
          pricing[p.plan] = {
            monthly: parseFloat(p.monthly_price),
            annual: parseFloat(p.annual_price),
            userLimit: p.user_limit,
          };
        });
        setPricingData(pricing);
      }
    } catch (error) {
      console.error('Error loading pricing config:', error);
    } finally {
      setLoadingPricing(false);
    }
  };

  const getPlans = () => {
    const getUserCountText = (planId: string) => {
      const limit = pricingData[planId]?.userLimit || 0;
      if (limit === 1) return '1 User';
      if (limit >= 100) return 'Unlimited Users';
      return `Up to ${limit} Users`;
    };

    return [
      {
        name: 'Free',
        price: pricingData['free'] || { monthly: 0, annual: 0 },
        description: 'Perfect for individuals getting started',
        features: [
          getUserCountText('free'),
          '5 Projects per estimator type',
          'Basic exports (Excel, PDF)',
          'Community support',
          'All estimator types',
        ],
        cta: 'Current Plan',
        popular: false,
        planId: 'free',
      },
      {
        name: 'Starter',
        price: pricingData['starter'] || { monthly: 29, annual: 290 },
        description: 'Great for small teams',
        features: [
          getUserCountText('starter'),
          'Unlimited Projects',
          'Advanced exports & comparisons',
          'Email support',
          'Company branding',
          'All estimator types',
        ],
        cta: 'Upgrade to Starter',
        popular: true,
        planId: 'starter',
      },
      {
        name: 'Professional',
        price: pricingData['professional'] || { monthly: 49, annual: 490 },
        description: 'For growing businesses',
        features: [
          getUserCountText('professional'),
          'Everything in Starter',
          'Custom templates & libraries',
          'Priority support',
          'Advanced analytics',
          'API access',
        ],
        cta: 'Upgrade to Professional',
        popular: false,
        planId: 'professional',
      },
      {
        name: 'Enterprise',
        price: pricingData['enterprise'] || { monthly: 99, annual: 990 },
        description: 'For large organizations',
        features: [
          getUserCountText('enterprise'),
          'Everything in Professional',
          'Dedicated support',
          'Custom integrations',
          'Training & onboarding',
          'SLA guarantees',
        ],
        cta: 'Upgrade to Enterprise',
        popular: false,
        planId: 'enterprise',
      },
    ];
  };

  const plans = getPlans();

  const handleSelectPlan = async (planId: string) => {
    if (planId === 'free' || planId === subscription?.plan) {
      return;
    }

    setLoading(planId);

    if (onSelectPlan) {
      await onSelectPlan(planId, billingCycle);
    }

    setLoading(null);
  };

  if (loadingPricing) {
    return (
      <div className="text-center py-12">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="mt-4 text-gray-600">Loading pricing plans...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Billing Toggle */}
      <div className="flex justify-center items-center gap-4">
        <span className={`text-sm font-medium ${billingCycle === 'monthly' ? 'text-gray-900' : 'text-gray-500'}`}>
          Monthly
        </span>
        <button
          onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annual' : 'monthly')}
          className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 bg-blue-600"
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              billingCycle === 'annual' ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
        <span className={`text-sm font-medium ${billingCycle === 'annual' ? 'text-gray-900' : 'text-gray-500'}`}>
          Annual
        </span>
        {billingCycle === 'annual' && (
          <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
            Save 17%
          </span>
        )}
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => {
          const price = billingCycle === 'annual' ? plan.price.annual : plan.price.monthly;
          const isCurrentPlan = plan.planId === subscription?.plan;
          const isDisabled = plan.planId === 'free' || isCurrentPlan;

          return (
            <div
              key={plan.planId}
              className={`relative rounded-lg border-2 p-6 flex flex-col ${
                plan.popular
                  ? 'border-blue-600 shadow-xl'
                  : 'border-gray-200'
              } ${isCurrentPlan ? 'bg-gray-50' : 'bg-white'}`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="px-4 py-1 bg-blue-600 text-white text-sm font-semibold rounded-full">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <p className="text-sm text-gray-600 mb-4">{plan.description}</p>

                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900">${price}</span>
                  {price > 0 && (
                    <span className="text-gray-600">
                      /{billingCycle === 'annual' ? 'year' : 'month'}
                    </span>
                  )}
                  {billingCycle === 'annual' && price > 0 && (
                    <div className="text-sm text-gray-500 mt-1">
                      ${(price / 12).toFixed(0)}/month billed annually
                    </div>
                  )}
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => handleSelectPlan(plan.planId)}
                disabled={isDisabled || loading !== null}
                className={`w-full py-3 px-4 rounded-md font-semibold transition-colors flex items-center justify-center gap-2 ${
                  plan.popular && !isCurrentPlan
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : isCurrentPlan
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {loading === plan.planId && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
                {isCurrentPlan ? 'Current Plan' : plan.cta}
              </button>
            </div>
          );
        })}
      </div>

      {/* Feature Comparison Note */}
      <div className="text-center text-sm text-gray-600 mt-8">
        <p>All plans include access to HK, FM MEP, and Retrofit estimators.</p>
        <p className="mt-2">Need a custom plan? Contact us for Enterprise pricing.</p>
      </div>
    </div>
  );
}
