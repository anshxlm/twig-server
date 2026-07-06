import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Suspense } from "react";


interface PageProps {
  params: Promise<{ user: string; repo: string }>;
}

async function UserDetails({ paramsPromise }: { paramsPromise: PageProps["params"] }) {
  const { user, repo } = await paramsPromise;

  const supabase = await createClient();

  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) {
    redirect("/auth/login");
  }

  return (
    <div>
     <h1 className="font-bold text-3xl mb-4">{user}/{repo}</h1>
    
    </div>
  );
}

export default async function ProtectedPage({ params }: PageProps) {


  return (
    <div className="flex-1 w-full flex flex-col gap-12">
      <div className="flex flex-col gap-2 items-start">
        <Suspense fallback={<div>Loading repositories...</div>}>
          <UserDetails paramsPromise={params} />
        </Suspense>
      </div>
    </div>
  );
}