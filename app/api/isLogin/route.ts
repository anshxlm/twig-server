import { NextRequest } from "next/server";
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
   process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.split(" ")[1];

  if (!token) {
    return Response.json({ error: "Missing token" }, { status: 401 });
  }
  const { data, error } = await supabase.auth.refreshSession({ refresh_token: token });

  if (error || !data.user) {
    return Response.json({ error: "Invalid or expired session" }, { status: 401 });
  }

    return Response.json({ success: true, message: "Verified login" });
}