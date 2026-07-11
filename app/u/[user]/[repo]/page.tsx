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
  const {data:repos, error:repoError} = await supabase.from('repos').select("*").eq("owner_id", data!.claims.sub).eq("name", repo)
  const {data:branches, error:branchError} = await supabase.from('branches').select("*").eq("repository_id", repos![0].id)

  if (error || !data?.claims) {
    redirect("/auth/login");
  }

  return (
    <div>
     {branches!.map((branch, index) =>(
    <a href={"/u/am/" + repo + '/' + branch.name} key={index} className="text-purple-500 text-xl font-bold hover:text-indigo-500 text-xl font-bold ">
    • {branch.name} <br></br>
  </a>
  ))}  
    
    </div>
  );
}

export default async function ProtectedPage({ params }: PageProps) {


  return (
    <div className="flex-1 w-full flex flex-col gap-12">
      <div className="flex flex-col gap-2 items-start">
        <Suspense fallback={<div>Loading branches...</div>}>
          <UserDetails paramsPromise={params} />
        </Suspense>
      </div>
    </div>
  );
}