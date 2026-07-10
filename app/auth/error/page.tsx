import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Suspense } from "react";

async function ErrorContent({
  searchParams,
}: {
  searchParams: Promise<{ error: string, code:string }>;
}) {
  const params = await searchParams;

  return (
     <Card>
            <CardHeader>
              <CardTitle className="text-2xl">
               {params?.error == "true" ? "Sorry, something went wrong.":params.code}
              </CardTitle>
            </CardHeader>
            <CardContent>
      {params.error == "true" ? (
        <p className="text-sm text-muted-foreground">
          {params.code}
        </p>
      ) : params.error == "cli" ? ( <p className="text-sm text-muted-foreground">
          You may now return to the CLI
        </p>):(
        <p className="text-sm text-muted-foreground">
          An unspecified error occurred.
        </p>
      )}
                  </CardContent>
          </Card>
  );
}

export default function Page({
  searchParams,
}: {
  searchParams: Promise<{ error: string, code:string }>;
}) {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
              <Suspense>
                <ErrorContent searchParams={searchParams} />
              </Suspense>
        </div>
      </div>
    </div>
  );
}
