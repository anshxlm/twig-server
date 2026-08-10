import { NextRequest } from "next/server";
import { createClient } from '@supabase/supabase-js';
import { BlobServiceClient } from '@azure/storage-blob'

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
  try {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    const name = formData.get("name") as string
    const local = formData.get("local_id") as string
    //@ts-ignore
    const sqlData = JSON.parse(formData.get("sql"))
    let repositoryId


    const { data: repoExists } = await supabase
    .from("repos")
    .select("*")
    .eq("owner_id", userId)
    .eq("name", name)
    .eq("local_id", local)
    .maybeSingle();
  
    if (repoExists) {
      repositoryId = repoExists.id;
    } else {

     const { data: nameExists } = await supabase
    .from("repos")
    .select("*")
    .eq("owner_id", userId)
    .eq("name", name)
    .maybeSingle();

  if (nameExists){
    return Response.json({ error: "Upload failed: Duplicate project name" }, { status: 500 });
  } else {
      
    const { data: NewRepo, error } = await supabase
    .from("repos")
    .insert({
        owner_id:userId,
        name: name,
        local_id: local,
    })
    .select()
    .single();

    if (error) throw error;

    repositoryId = NewRepo.id;

  }
    }

    const objects = sqlData.objects.map((object: { hash: any; type: any; data: any; }) => ({
    repository_id: repositoryId,
    hash: object.hash,
    type: object.type,
    data: object.data
}));

const branches = sqlData.branches.map((branch: { name: any; commit_hash: any; }) => ({
    repository_id: repositoryId,
    name: branch.name,
    commit_hash: branch.commit_hash
}));

  const { error: objectError } = await supabase
    .from("objects")
    .upsert(objects);

if (objectError) console.log(objectError);

  //console.log(branch)
  const { error: branchError } = await supabase
    .from("branches")
    .upsert(branches, {
        onConflict: "repository_id,name"
    });

if (branchError) console.log(branchError);

const AZURE_STORAGE_CONNECTION_STRING = ""

const blobServiceClient = BlobServiceClient.fromConnectionString(
  AZURE_STORAGE_CONNECTION_STRING
);

const containerClient = blobServiceClient.getContainerClient('objects');
//const createContainerResponse = await containerClient.create();
for (const file of files) {

const blockBlobClient = containerClient.getBlockBlobClient(file.name.slice(0,2) + '/' + file.name);
const arrayBuffer = await file.arrayBuffer();
const buffer = Buffer.from(arrayBuffer);
const uploadBlobResponse = await blockBlobClient.upload(buffer, buffer.length);

}

    return Response.json({ success: true, message: "Uploaded!" });
  } catch (err) {
    console.log(err)
    return Response.json({ error: "Upload failed" }, { status: 500 });
  }
}
