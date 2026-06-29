import { GoogleSignIn } from "@/components/auth/google-sign-in";
import { PasswordSignIn } from "@/components/auth/password-sign-in";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = {
  title: "Sign in · My House Dashboard",
};

export default function LoginPage() {
  const configured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      <div className="pointer-events-none absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
      <Card className="relative w-full max-w-md border-border/60 shadow-xl">
        <CardHeader className="items-center text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/logo.png" alt="My House" className="mb-3 h-16 w-16 rounded-2xl object-contain shadow-lg" />
          <CardTitle className="text-2xl">My House Dashboard</CardTitle>
          <CardDescription className="max-w-xs">
            Your home command centre — bills, savings, projects, purchases and inspiration in one
            calm place.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {configured ? (
            <>
              <PasswordSignIn />
              <div className="flex items-center gap-3">
                <span className="h-px flex-1 bg-border" />
                <span className="text-xs text-muted-foreground">or</span>
                <span className="h-px flex-1 bg-border" />
              </div>
              <GoogleSignIn />
            </>
          ) : (
            <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
              This deployment needs <code>NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
              <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> before sign-in can be used.
            </div>
          )}
          <p className="text-center text-xs text-muted-foreground">
            Your household data is stored securely in your own Supabase project.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
