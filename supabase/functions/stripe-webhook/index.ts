import { createClient } from 'npm:@supabase/supabase-js@2';
import Stripe from 'npm:stripe@14';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
});

const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') || '';
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      return new Response(
        JSON.stringify({ error: 'Missing stripe-signature header' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.text();
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return new Response(
        JSON.stringify({ error: 'Webhook signature verification failed' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const organizationId = session.metadata?.organization_id;
        const plan = session.metadata?.plan;
        const billingCycle = session.metadata?.billing_cycle;
        const userLimit = parseInt(session.metadata?.user_limit || '1');

        if (!organizationId || !plan) {
          console.error('Missing metadata in checkout session');
          break;
        }

        // Update subscription
        await supabase
          .from('subscriptions')
          .update({
            plan,
            billing_cycle: billingCycle,
            user_limit: userLimit,
            amount: (session.amount_total || 0) / 100,
            status: 'active',
            stripe_subscription_id: session.subscription as string,
            stripe_customer_id: session.customer as string,
            current_period_start: new Date().toISOString(),
            current_period_end: new Date(
              Date.now() + (billingCycle === 'annual' ? 365 : 30) * 24 * 60 * 60 * 1000
            ).toISOString(),
          })
          .eq('organization_id', organizationId);

        console.log(`Subscription activated for organization ${organizationId}`);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // Find organization by customer ID
        const { data: orgSubscription } = await supabase
          .from('subscriptions')
          .select('organization_id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (orgSubscription) {
          const status = subscription.status === 'active' ? 'active' :
                        subscription.status === 'past_due' ? 'past_due' :
                        subscription.status === 'canceled' ? 'cancelled' : 'active';

          await supabase
            .from('subscriptions')
            .update({
              status,
              current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            })
            .eq('organization_id', orgSubscription.organization_id);

          console.log(`Subscription updated for organization ${orgSubscription.organization_id}`);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // Find organization by customer ID
        const { data: orgSubscription } = await supabase
          .from('subscriptions')
          .select('organization_id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (orgSubscription) {
          // Downgrade to free plan
          await supabase
            .from('subscriptions')
            .update({
              plan: 'free',
              user_limit: 1,
              amount: 0,
              status: 'cancelled',
              billing_cycle: 'monthly',
              stripe_subscription_id: null,
            })
            .eq('organization_id', orgSubscription.organization_id);

          console.log(`Subscription cancelled for organization ${orgSubscription.organization_id}`);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        // Find organization by customer ID
        const { data: orgSubscription } = await supabase
          .from('subscriptions')
          .select('organization_id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (orgSubscription) {
          await supabase
            .from('subscriptions')
            .update({ status: 'past_due' })
            .eq('organization_id', orgSubscription.organization_id);

          console.log(`Payment failed for organization ${orgSubscription.organization_id}`);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(
      JSON.stringify({ received: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
