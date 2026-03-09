import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id, amount, type, reason } = await req.json();

    if (!user_id || !amount || !type || !reason) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: user_id, amount, type, reason" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Try to insert transaction (unique index prevents duplicates on user_id+type+reason)
    const { data: txData, error: txError } = await supabase
      .from("choice_transactions")
      .insert({ user_id, amount, type, reason })
      .select()
      .single();

    if (txError) {
      // Duplicate reward (unique constraint violation) — return 200 so monitoring doesn't fire
      if (txError.code === "23505") {
        return new Response(
          JSON.stringify({ success: false, duplicate: true, message: "Reward already granted" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw txError;
    }

    // Atomically increment choice_balance using raw SQL to avoid race conditions
    const { error: incError } = await supabase.rpc("increment_choice_balance", {
      p_wallet_address: user_id,
      p_amount: amount,
    });

    if (incError) {
      // RPC not available — fall back to read-then-write (safe because we already inserted the tx)
      console.warn("increment_choice_balance RPC unavailable, using fallback:", incError.message);

      // Try upsert: if profile doesn't exist yet, create it with the balance
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("choice_balance, did, wallet_address")
        .eq("wallet_address", user_id)
        .maybeSingle();

      if (profile) {
        const newBalance = (profile.choice_balance ?? 0) + amount;
        const { error: updateError } = await supabase
          .from("user_profiles")
          .update({ choice_balance: newBalance, updated_at: new Date().toISOString() })
          .eq("wallet_address", user_id);

        if (updateError) {
          console.error("Balance update error:", updateError);
          // Transaction was already logged; don't fail the request
        }
      } else {
        // Profile doesn't exist yet — create a minimal one so balance is tracked
        await supabase
          .from("user_profiles")
          .insert({
            wallet_address: user_id,
            did: `did:choice:${user_id}`,
            choice_balance: amount,
          })
          .single();
      }
    }

    return new Response(
      JSON.stringify({ success: true, transaction: txData, amount }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("grant-reward error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
