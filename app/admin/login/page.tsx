import Link from "next/link";
import { redirect } from "next/navigation";
import { loginAction } from "@/app/actions";
import { SparkIcon } from "@/components/Icons";
import { SetupNotice } from "@/components/SetupNotice";
import { SubmitButton } from "@/components/SubmitButton";
import { isAdmin } from "@/lib/auth";
import { getMissingConfig } from "@/lib/config";

export const dynamic = "force-dynamic";

export default async function Login({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const missingConfig = getMissingConfig();
  if (missingConfig.length > 0) {
    return <SetupNotice missing={missingConfig} />;
  }

  if (await isAdmin()) {
    redirect("/admin");
  }

  const params = await searchParams;

  return (
    <main className="login">
      <section className="panel auth-card">
        <div className="brand auth-brand">
          <div className="mark">D</div>
          <div>
            <h1>Dumpyard</h1>
            <p>Admin access</p>
          </div>
        </div>
        <div className="eyebrow">
          <SparkIcon />
          Private dashboard
        </div>

        {params.error ? (
          <p className="toast error">That password did not match.</p>
        ) : null}

        <form action={loginAction} className="form">
          <label className="field">
            <span>Password</span>
            <input
              autoComplete="current-password"
              autoFocus
              className="input"
              name="password"
              required
              type="password"
            />
          </label>
          <SubmitButton pendingLabel="Checking...">
            Enter Admin
          </SubmitButton>
          <Link className="btn" href="/">
            Back to public view
          </Link>
        </form>
      </section>
    </main>
  );
}
