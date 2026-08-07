import { Link, useNavigate } from "react-router-dom";
import { useRef, useState } from "react";
import { useAppStore } from "@/lib/app-store";
import { notifyError, notifyInfo, notifySuccess } from "@/lib/notifications";
import { registerUser, verifyEmailApi } from "@/lib/api";

/* Route metadata is now supplied by index.html.
  head: () => ({
    meta: [
      { title: "Sign in — PrepHub" },
      { name: "description", content: "Sign in or create your PrepHub account." },
    ],
  }),
  component: AuthPage,
});

*/
type Mode = "login" | "register" | "otp" | "forgot" | "reset";

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [otpDigits, setOtpDigits] = useState(Array(6).fill(""));
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);
  const store = useAppStore();
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "login") {
      if (!email || !password)
        return notifyError(
          "Please fill in all required fields",
          "Enter both your email and password to sign in.",
        );

      try {
        await store.signIn(email, password);
        notifySuccess("Welcome back", "You’re signed in and ready to continue.");
        navigate("/");
      } catch (error) {
        notifyError(
          "Sign-in failed",
          error instanceof Error ? error.message : "Please check your credentials and try again.",
        );
      }
    } else if (mode === "register") {
      if (!email || !password || !name)
        return notifyError(
          "Please fill in all required fields",
          "Add your name, email, and password to create an account.",
        );

      try {
        await registerUser(email, password, name);
        store.updateProfile({ name, email });
        setOtpDigits(Array(6).fill(""));
        notifyInfo("Verification code sent", "A 6-digit code has been sent to your email.");
        setMode("otp");
      } catch (error) {
        notifyError(
          "Registration failed",
          error instanceof Error ? error.message : "We couldn’t create your account right now.",
        );
      }
    } else if (mode === "forgot") {
      if (!email)
        return notifyError(
          "Email is required",
          "Enter the email address you want to use for recovery.",
        );
      notifyInfo("Reset link sent", "Check your inbox for the recovery instructions.");
      setMode("reset");
    } else if (mode === "reset") {
      if (!password)
        return notifyError("Password is required", "Choose a new password before continuing.");
      notifySuccess("Password updated", "Please sign in with your new password.");
      setMode("login");
      setPassword("");
    }
  };

  return (
    <div className="min-h-screen bg-page grid grid-cols-1 md:grid-cols-2">
      <div className="hidden md:flex flex-col justify-between p-12 bg-surface-sunken/40 border-r border-hairline">
        <Link to="/" className="flex items-center gap-2">
          <span className="size-6 rounded-sm bg-ink" />
          <span className="font-serif italic text-2xl">PrepHub</span>
        </Link>
        <div className="max-w-md">
          <p className="font-serif text-3xl leading-snug text-balance">
            "I know exactly where I stopped."
          </p>
          <p className="mt-4 text-sm text-ink-muted">
            A calm study desk for students preparing for placements. One place to organize
            everything you're learning.
          </p>
        </div>
        <p className="text-xs text-ink-faint">© PrepHub</p>
      </div>

      <div className="flex items-center justify-center p-6 md:p-12 ph-fade-in">
        <div className="w-full max-w-sm">
          <Link to="/" className="md:hidden flex items-center gap-2 mb-8">
            <span className="size-6 rounded-sm bg-ink" />
            <span className="font-serif italic text-2xl">PrepHub</span>
          </Link>

          {mode === "otp" ? (
            <>
              <h1 className="font-serif text-3xl">Check your email</h1>
              <p className="mt-2 text-sm text-ink-muted">
                We sent a 6-digit code to {email || "your inbox"}. Enter it below to verify.
              </p>
              <div className="mt-8 flex gap-2 justify-between">
                {otpDigits.map((digit, index) => (
                  <input
                    key={index}
                    ref={(node) => {
                      otpRefs.current[index] = node;
                    }}
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(event) => {
                      const next = event.target.value.replace(/\D/g, "").slice(-1);
                      const updated = [...otpDigits];
                      updated[index] = next;
                      setOtpDigits(updated);
                      if (next && index < otpDigits.length - 1) {
                        otpRefs.current[index + 1]?.focus();
                      }
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Backspace" && !digit && index > 0) {
                        const updated = [...otpDigits];
                        updated[index - 1] = "";
                        setOtpDigits(updated);
                        otpRefs.current[index - 1]?.focus();
                      }
                    }}
                    onPaste={(event) => {
                      const pasted = event.clipboardData
                        .getData("text")
                        .replace(/\D/g, "")
                        .slice(0, 6);
                      if (!pasted) return;
                      const updated = Array(6).fill("");
                      pasted.split("").forEach((char, offset) => {
                        updated[offset] = char;
                      });
                      setOtpDigits(updated);
                      const nextIndex = Math.min(pasted.length, 6) - 1;
                      otpRefs.current[Math.min(nextIndex, 5)]?.focus();
                    }}
                    className="w-12 h-14 text-center font-serif text-2xl bg-surface ring-1 ring-hairline rounded-md focus:outline-none focus:ring-ink/30"
                  />
                ))}
              </div>
              <button
                onClick={async () => {
                  const code = otpDigits.join("");
                  if (code.length < 6) {
                    notifyError(
                      "Verification code required",
                      "Enter the full 6-digit code sent to your email.",
                    );
                    return;
                  }

                  try {
                    await verifyEmailApi(email, code);
                    await store.signIn(email, password);
                    notifySuccess("Account created", "Your PrepHub account is ready.");
                    navigate("/");
                  } catch (error) {
                    notifyError(
                      "Verification failed",
                      error instanceof Error
                        ? error.message
                        : "The code could not be verified. Please try again.",
                    );
                  }
                }}
                className="mt-8 w-full bg-ink text-page rounded-md py-2.5 text-sm font-medium hover:bg-ink/90 transition-colors"
              >
                Verify & continue
              </button>
              <button
                onClick={() => setMode("register")}
                className="mt-4 text-xs text-ink-muted hover:text-ink w-full text-center"
              >
                ← Back
              </button>
            </>
          ) : (
            <>
              <h1 className="font-serif text-3xl">
                {mode === "login" && "Welcome back."}
                {mode === "register" && "Create your desk."}
                {mode === "forgot" && "Forgot password?"}
                {mode === "reset" && "Set a new password."}
              </h1>
              <p className="mt-2 text-sm text-ink-muted">
                {mode === "login" && "Pick up right where you left off."}
                {mode === "register" && "A quiet place to organize your learning journey."}
                {mode === "forgot" && "We'll email a reset link to your inbox."}
                {mode === "reset" && "Choose a new password to secure your account."}
              </p>

              <form className="mt-8 flex flex-col gap-4" onSubmit={submit}>
                {mode === "register" && (
                  <Field
                    label="Full name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                )}
                {(mode === "login" || mode === "register" || mode === "forgot") && (
                  <Field
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                )}
                {(mode === "login" || mode === "register" || mode === "reset") && (
                  <Field
                    label={mode === "reset" ? "New password" : "Password"}
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                )}

                {mode === "login" && (
                  <button
                    type="button"
                    onClick={() => setMode("forgot")}
                    className="text-xs text-ink-muted hover:text-ink text-right -mt-2"
                  >
                    Forgot password?
                  </button>
                )}

                <button className="mt-2 w-full bg-ink text-page rounded-md py-2.5 text-sm font-medium hover:bg-ink/90 transition-colors">
                  {mode === "login" && "Sign in"}
                  {mode === "register" && "Create account"}
                  {mode === "forgot" && "Send reset link"}
                  {mode === "reset" && "Update password"}
                </button>
              </form>

              <p className="mt-6 text-sm text-ink-muted text-center">
                {mode === "login" && (
                  <>
                    New to PrepHub?{" "}
                    <button
                      onClick={() => setMode("register")}
                      className="text-ink font-medium hover:underline"
                    >
                      Create account
                    </button>
                  </>
                )}
                {mode === "register" && (
                  <>
                    Already have an account?{" "}
                    <button
                      onClick={() => setMode("login")}
                      className="text-ink font-medium hover:underline"
                    >
                      Sign in
                    </button>
                  </>
                )}
                {(mode === "forgot" || mode === "reset") && (
                  <button
                    onClick={() => setMode("login")}
                    className="text-ink font-medium hover:underline"
                  >
                    ← Back to sign in
                  </button>
                )}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-ink-muted">{label}</span>
      <input
        {...props}
        className="px-3 py-2.5 rounded-md bg-surface ring-1 ring-hairline text-sm placeholder:text-ink-faint focus:outline-none focus:ring-ink/30"
      />
    </label>
  );
}
