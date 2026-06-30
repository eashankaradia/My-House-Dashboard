"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { PasswordSignIn } from "./password-sign-in";
import { SignUp } from "./sign-up";
import { GoogleSignIn } from "./google-sign-in";

export function AuthTabs() {
  const [mode, setMode] = React.useState<"signin" | "signup">("signin");

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 rounded-lg border bg-muted/30 p-1 text-sm font-medium">
        <button
          type="button"
          onClick={() => setMode("signin")}
          className={cn("rounded-md py-1.5 transition-colors", mode === "signin" ? "bg-background shadow-sm" : "text-muted-foreground")}
        >
          Sign in
        </button>
        <button
          type="button"
          onClick={() => setMode("signup")}
          className={cn("rounded-md py-1.5 transition-colors", mode === "signup" ? "bg-background shadow-sm" : "text-muted-foreground")}
        >
          Create account
        </button>
      </div>

      {mode === "signin" ? (
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
        <SignUp />
      )}
    </div>
  );
}
