import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/components/login-form";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-sm px-4 py-14">
      {/* LoginForm reads ?error= from the URL, which is request-time data. */}
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
