"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function lockPrivate() {
  (await cookies()).delete("private_unlocked");
  redirect("/dashboard");
}
