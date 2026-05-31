import Link from "next/link";
import { redirect } from "next/navigation";
import { loginAction } from "@/app/actions";
import { SetupNotice } from "@/components/SetupNotice";
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
      <section className="panel">
        <div className="brand" style={{ marginBottom: 22 }}>
          <div className="mark">D</div>
          <div>
            <h1>Dumpyard</h1>
            <p>Admin login</p>
          </div>
        </div>

        {params.error ? (
          <p className="notice">That password did not match.</p>
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
          <button className="btn primary" type="submit">
            Enter Admin
          </button>
          <Link className="btn" href="/">
            Back to public view
          </Link>
        </form>
      </section>
    </main>
  );
}
