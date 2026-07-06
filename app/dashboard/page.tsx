import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { InfoIcon } from "lucide-react";
import { Suspense } from "react";

async function UserDetails() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) {
    redirect("/auth/login");
  }

 // const { data:allRepos, error:repoError} 
 const {data:repos, error:repoError} = await supabase.from('repos').select("*")
  return (
  <div>
  {repos!.map((repo, index) =>(
    <a href={"/user/am/" + repo.name} key={index} className="text-purple-500 text-xl font-bold hover:text-indigo-500 text-xl font-bold ">
    • {repo.name} <br></br>
  </a>
  ))}  
    </div>
  
  )
}

export default function ProtectedPage() {
  return (
    <div className="flex-1 w-full flex flex-col gap-12">
      <div className="w-full">
      </div>
      <div className="flex flex-col gap-2 items-start">
        <h2 className="font-bold text-3xl mb-4">Your repositories:</h2>
          <Suspense  fallback={<div>Loading repositories...</div>}>
            <UserDetails />
          </Suspense>
      </div>
    </div>
  );
}
