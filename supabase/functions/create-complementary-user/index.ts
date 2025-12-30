import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface CreateUserRequest {
  email: string;
  password: string;
  fullName?: string;
  plan?: 'free' | 'starter' | 'professional' | 'enterprise';
}

const PLAN_LIMITS = {
  free: 1,
  starter: 5,
  professional: 20,
  enterprise: 100,
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      }
    );

    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { data: isSuperAdmin, error: checkError } = await supabaseAdmin
      .rpc('is_super_admin', { check_user_id: user.id });

    if (checkError || !isSuperAdmin) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: Super admin access required' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { email, password, fullName, plan = 'free' }: CreateUserRequest = await req.json();

    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: 'Email and password are required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (createError) {
      return new Response(
        JSON.stringify({ error: createError.message }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    await new Promise(resolve => setTimeout(resolve, 500));

    const { error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .update({
        complementary_account: true,
        created_by: user.id,
        full_name: fullName || null,
      })
      .eq('id', newUser.user.id);

    if (profileError) {
      console.error('Failed to update user profile:', profileError);
    }

    const { data: newUserOrg } = await supabaseAdmin
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', newUser.user.id)
      .single();

    if (newUserOrg) {
      const userLimit = PLAN_LIMITS[plan];
      const periodEnd = new Date();
      periodEnd.setFullYear(periodEnd.getFullYear() + 100);

      const { error: subError } = await supabaseAdmin
        .from('subscriptions')
        .update({
          plan: plan,
          user_limit: userLimit,
          amount: 0,
          status: 'active',
          current_period_end: periodEnd.toISOString(),
        })
        .eq('organization_id', newUserOrg.organization_id);

      if (subError) {
        console.error('Failed to update subscription:', subError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Complementary user created successfully',
        userId: newUser.user.id,
        email: newUser.user.email,
        plan: plan,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error creating complementary user:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});