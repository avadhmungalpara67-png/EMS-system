import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { auth } from "@/lib/auth";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EMS — Employee Management System",
  description: "Employee registration, directory, and RBAC-driven admin portal",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const session = await auth();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="h-full bg-slate-50 text-slate-900">
        {session ? (
          <div className="flex h-full">
            <Sidebar user={session.user} />
            <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
              <TopBar role={session.user.role} />
              <main className="flex-1">{children}</main>
            </div>
          </div>
        ) : (
          <main>{children}</main>
        )}
      </body>
    </html>
  );
}
