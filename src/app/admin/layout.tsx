import { auth } from "@/auth";
import { redirect } from "next/navigation";
import AdminLayout from "./Admin";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) return redirect("/login");

  return <AdminLayout>{children}</AdminLayout>;
}
