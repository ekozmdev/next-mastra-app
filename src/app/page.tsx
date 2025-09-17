import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth";

export default async function Home() {
  const session = await getAuthSession();

  // Redirect based on authentication status
  if (session?.user) {
    redirect("/chat");
  } else {
    redirect("/auth/signin");
  }
}
