import { Lock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UnlockForm } from "./unlock-form";

export const metadata = { title: "Private" };

export default async function PrivateUnlockPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      <div className="pointer-events-none absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
      <Card className="relative w-full max-w-sm border-border/60 shadow-xl">
        <CardHeader className="items-center text-center">
          <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm">
            <Lock className="h-7 w-7" />
          </span>
          <CardTitle className="text-xl">Private</CardTitle>
          <CardDescription>Enter your password to continue.</CardDescription>
        </CardHeader>
        <CardContent>
          <UnlockForm next={next && next.startsWith("/") ? next : "/private"} />
        </CardContent>
      </Card>
    </main>
  );
}
