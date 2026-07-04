import { NextRequest } from "next/server";
import { createClient } from '@supabase/supabase-js';
import { put } from "@vercel/blob"

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

  const userId = data.user.id;
  console.log(`${userId} uploading`);

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File
    const name = formData.get("name") as string
    
    const blob = await put(userId + '/' + name.slice(0,20) + '.txt', file, { access: 'private' });

    return Response.json({ success: true, message: "Uploaded!" });
  } catch (err) {
    console.log(err)
    return Response.json({ error: "Upload failed" }, { status: 500 });
  }
}