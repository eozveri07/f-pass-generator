import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function TwoFactorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) return redirect("/login");

  return children;
}
