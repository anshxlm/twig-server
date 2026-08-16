
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Suspense } from "react";
import { BlobServiceClient } from '@azure/storage-blob'


interface PageProps {
  params: Promise<{ 
    user: string; 
    repo: string; 
    branch: string; 
    commit?: string[];
  }>;
}

async function FileExplorer({ paramsPromise }: { paramsPromise: PageProps["params"] }) {
  const { user, repo, branch, commit } = await paramsPromise;
  
  const currentPath = commit ? commit.join("/") : null;

   const supabase = await createClient();

  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) {
    redirect("/auth/login");
  }

  const {data:repos, error:repoError} = await supabase.from('repos').select("*").eq("owner_id", data.claims.sub).eq("name", repo)
  if (repoError || !repos || repos.length === 0) {
    return <div>Repository not found.</div>;
  }


  const {data:branches, error:branchError} = await supabase.from('branches').select("*").eq("repository_id", repos[0].id).eq("name", branch)
  let hash = branches![0].commit_hash

  const historyArr = []; 
  const visited = new Set<string>();

if (!commit){

  while (hash && !visited.has(hash)) {
    visited.add(hash);

    const {data:getCommit} = await supabase.from('objects').select('*').eq('hash', hash)
    if (!getCommit || getCommit.length === 0) break;

    try {
      const commit = JSON.parse(getCommit[0].data)
      historyArr.push({hash:hash, message:commit.message})
      hash = commit.parent;
    } catch (e) {
      break;
    }
  }

  return (
    <div>
            <h1>{currentPath}</h1>
     {historyArr!.map((commit, index) =>(
    <a href={"/u/" + repo + '/' + branch + '/' + commit.hash} key={index} className="text-purple-500 text-xl font-bold hover:text-indigo-500 text-xl font-bold ">
    • {commit.message} <br></br>
  </a>
  ))}  
    
    </div>
  );
} else {

  const depth = currentPath?.split('/')

  if (depth?.length == 1){

  const {data:commitFiles, error:branchError} = await supabase.from('objects').select("*").eq("hash", commit)
  
  const guiArray = []

    const {data:tree} = await supabase.from('objects').select("*").eq("hash", JSON.parse(commitFiles![0].data).tree)
    const treeIn = JSON.parse(tree![0]!.data);

    for (let i = 0; i < treeIn.length; i++) {

        const last = i === treeIn.length - 1;

        guiArray.push(treeIn[i]);

        }
  


  return (
    <div>
      {guiArray.map((item, index) =>(
         <a href={item.type == "tree" ? "/u/" + repo + '/' + branch + '/' + currentPath + '/' + item.hash : "/u/" + repo + '/' + branch + '/' + currentPath + '/file/' + item.hash} key={index} className="text-purple-500 text-xl font-bold hover:text-indigo-500 text-xl font-bold ">
    {item.type == "tree" ? "> ":"• "}{item.name} <br></br>
  </a>
      ))}
    </div>
  );
  } else {

  
  if (depth?.at(-2) == "file"){

    async function verify_ownership(){

      let {data: verification} = await supabase.from('objects').select('*').eq('hash', depth?.at(-3))
      if (!verification![0]){
        return false
      }

      if (verification![0]!.type == "commit"){
        const content = JSON.parse(verification![0]!.data);
        ({data: verification} = await supabase.from('objects').select('*').eq('hash', content.tree))
      }

      const verifyContent = JSON.parse(verification![0]!.data);

      for (const obj of verifyContent){
        if (obj.hash == depth?.at(-1)) {

          const {data: repo} = await supabase.from('repos').select('*').eq('id', verification![0]!.repository_id)
          console.log(repo)
          for (const item of repo!){
            console.log(item.owner_id)
            if (item){
            return true
          }
        }

        }
      }

      return false

    }
    
    if (await verify_ownership()){

        const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING

const blobServiceClient = BlobServiceClient.fromConnectionString(
  AZURE_STORAGE_CONNECTION_STRING!
);


const containerClient = blobServiceClient.getContainerClient('objects');
const tempBlockBlobClient = containerClient.getBlockBlobClient(depth?.at(-1)?.slice(0,2) + '/' + depth?.at(-1));
const downloadBlockBlobResponse = await tempBlockBlobClient.download(0);

async function streamToText(readable:any) {
  readable.setEncoding('utf8');
  let data = '';
  for await (const chunk of readable) {
    data += chunk;
  }
  return data;
}

const fileContent = await streamToText(downloadBlockBlobResponse.readableStreamBody)

return (<pre className="text-[12px] font-mono p-4 rounded-md border border-[#d0d7de] bg-grey text-white leading-5 w-full text-left min-h-[50vh] overflow-auto">{fileContent}</pre>)

    } else {
      return "Not Authorized OR Not Found"
    }


  } else {

    const {data:commitFiles, error:branchError} = await supabase.from('objects').select("*").eq("hash", depth?.at(-1))
  
  const guiArray = []
    const treeIn = JSON.parse(commitFiles![0].data);

    for (let i = 0; i < treeIn.length; i++) {

        const last = i === treeIn.length - 1;

        guiArray.push(treeIn[i]);

        }
  

  return (
    <div>
      {guiArray.map((item, index) =>(
         <a href={item.type == "tree" ? "/u/" + repo + '/' + branch + '/' + currentPath + '/' + item.hash : "/u/" + repo + '/' + branch + '/' + currentPath + '/file/' + item.hash} key={index} className="text-purple-500 text-xl font-bold hover:text-indigo-500 text-xl font-bold ">
    {item.type == "tree" ? "> ":"• "} {item.name} <br></br>
  </a>
      ))}
    </div>
  );

  }
}
}
}


export default async function ProtectedPage({ params }: PageProps) {
  return (
<div className="flex-1 w-full flex flex-col gap-12 px-4 md:px-8"> 
  <div className="flex flex-col gap-2 items-stretch w-full">
    <Suspense fallback={<div>Loading...</div>}>
      <FileExplorer paramsPromise={params} />
    </Suspense>
  </div>
</div>
  );
}