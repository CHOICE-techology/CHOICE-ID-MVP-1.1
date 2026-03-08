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
      // Duplicate reward (unique constraint violation)
      if (txError.code === "23505") {
        return new Response(
          JSON.stringify({ error: "Reward already granted", duplicate: true }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw txError;
    }

    // Increment choice_balance on user_profiles
    // Use raw SQL via rpc for atomic increment
    const { error: updateError } = await supabase
      .from("user_profiles")
      .update({ choice_balance: supabase.rpc ? undefined : 0 }) // placeholder
      .eq("wallet_address", user_id);

    // Actually do an atomic increment via raw update
    const { error: incError } = await supabase.rpc("increment_choice_balance", {
      p_wallet_address: user_id,
      p_amount: amount,
    });

    // If rpc doesn't exist yet, fallback to read-then-write
    if (incError) {
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("choice_balance")
        .eq("wallet_address", user_id)
        .maybeSingle();

      const currentBalance = profile?.choice_balance ?? 0;
      await supabase
        .from("user_profiles")
        .update({ choice_balance: currentBalance + amount })
        .eq("wallet_address", user_id);
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
