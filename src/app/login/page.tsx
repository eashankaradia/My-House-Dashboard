import { Home } from "lucide-react";
import { GoogleSignIn } from "@/components/auth/google-sign-in";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = {
  title: "Sign in · My House Dashboard",
};

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      <div className="pointer-events-none absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
      <Card className="relative w-full max-w-md border-border/60 shadow-xl">
        <CardHeader className="items-center text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
            <Home className="h-7 w-7" />
          </div>
          <CardTitle className="text-2xl">My House Dashboard</CardTitle>
          <CardDescription className="max-w-xs">
            Your home command centre — bills, savings, projects, purchases and inspiration in one
            calm place.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <GoogleSignIn />
          <p className="text-center text-xs text-muted-foreground">
            By continuing you agree to store your household data securely in your own Supabase
            project.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
