import { Suspense } from "react";
import LoginForm from "./login-form";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50">
          <p className="text-sm text-slate-500">読み込み中…</p>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
