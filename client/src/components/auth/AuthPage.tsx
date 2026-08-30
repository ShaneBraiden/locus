import React, { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  User,
} from "lucide-react";
import { useAuth } from "../../auth/AuthContext";
import { Logo } from "../Logo";
import { Button, cx, inputClass } from "../../ui";

type Mode = "login" | "register";

interface FieldErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

interface FieldProps {
  id: string;
  label: string;
  type: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  icon: React.ComponentType<{ className?: string }>;
  error?: string;
  autoComplete?: string;
  disabled?: boolean;
  trailing?: React.ReactNode;
}

function Field({
  id,
  label,
  type,
  value,
  onChange,
  placeholder,
  icon: Icon,
  error,
  autoComplete,
  disabled,
  trailing,
}: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-xs font-semibold text-ink-700">
        {label}
      </label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
        <input
          id={id}
          name={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          // `pr-[2.75rem]`, not `pr-12` — see the note in `inputClass`: the
          // spacing compression block rewrites step 12 to 28px, which is
          // narrower than the toggle button it has to clear.
          className={cx(inputClass(!!error, true), trailing ? "pr-[2.75rem]" : "pr-4")}
        />
        {trailing && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2">{trailing}</div>
        )}
      </div>
      {error && (
        <p
          id={`${id}-error`}
          role="alert"
          className="flex items-center gap-1 text-tiny font-semibold text-bad-700"
        >
          <AlertCircle className="h-3 w-3 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

function PasswordToggle({
  visible,
  onToggle,
}: {
  visible: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      tabIndex={-1}
      aria-label={visible ? "Hide password" : "Show password"}
      className="rounded-full p-2 text-ink-500 transition-colors hover:bg-ink-100 hover:text-ink-700 cursor-pointer"
    >
      {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </button>
  );
}

export default function AuthPage() {
  const { login, register, loginAsGuest } = useAuth();

  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const isRegister = mode === "register";

  const switchMode = (next: Mode) => {
    if (next === mode || isSubmitting) return;
    setMode(next);
    setFieldErrors({});
    setServerError(null);
    setPassword("");
    setConfirmPassword("");
    setShowPassword(false);
  };

  const validate = (): FieldErrors => {
    const errors: FieldErrors = {};

    if (isRegister && !name.trim()) {
      errors.name = "Tell us what to call you.";
    }
    if (!email.trim()) {
      errors.email = "Email is required.";
    } else if (!EMAIL_RE.test(email.trim())) {
      errors.email = "That doesn't look like a valid email.";
    }
    if (!password) {
      errors.password = "Password is required.";
    } else if (password.length < 6) {
      errors.password = "Password must be at least 6 characters.";
    }
    if (isRegister) {
      if (!confirmPassword) {
        errors.confirmPassword = "Please confirm your password.";
      } else if (confirmPassword !== password) {
        errors.confirmPassword = "Passwords don't match.";
      }
    }

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setServerError(null);
    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsSubmitting(true);
    try {
      if (isRegister) {
        await register(name, email, password);
      } else {
        await login(email, password);
      }
    } catch (err: any) {
      if (mountedRef.current) {
        setServerError(err?.message || "Something went wrong. Please try again.");
      }
    } finally {
      if (mountedRef.current) setIsSubmitting(false);
    }
  };

  return (
    /* ONE CARD.
     *
     * The previous version of this page was a split screen: a graphite brand
     * panel on the left carrying a headline, a paragraph of positioning copy
     * and a three-figure stat strip, with the form on the right. All of that
     * is gone.
     *
     * The argument for it was that a bare form gives the product no first
     * impression. That was true of a grey box on a grey field. It is not true
     * any more — the page now has the atmosphere behind it, and a single pane
     * of glass floating in an open sky is a considerably stronger first
     * impression than a stat strip nobody reads on the way to a password
     * field. Everything that panel said is said better by the field itself.
     *
     * What is left is the shortest path from arriving to being signed in.
     */
    <div className="relative flex min-h-[100dvh] w-full items-center justify-center px-4 py-10 font-sans text-ink-900">

      <div className="w-full max-w-[26rem]">

        {/* Brand, above the card rather than inside it. The card is the form;
            putting the mark in it would make the form look like it starts
            with a logo. */}
        <div className="mb-5 flex items-center justify-center gap-2.5">
          <Logo className="h-9 w-9 rounded-lg" />
          <span className="font-display text-lg font-bold tracking-tight">northr</span>
        </div>

        {/* The card. `has-cloud--auth` is the strongest cloud layer in the
            system, and this is the only surface that gets it: the auth page
            is the one screen with no data on it, so it is the one screen that
            can afford weather.

            `rounded-3xl` overrides the capsule `.nav-float` now carries. That
            class is shared with the floating nav, which is 56px tall and reads
            correctly as a capsule; this card is 500px tall and would read as a
            pill the size of a door. Same surface treatment, different shape —
            which is the distinction the radius ramp exists to make. */}
        <div className="nav-float has-cloud has-cloud--auth overflow-hidden rounded-3xl p-6 sm:p-7">

          <div className="mb-5">
            <h1 className="font-display text-2xl font-bold text-ink-950">
              {isRegister ? "Create your account" : "Welcome back"}
            </h1>
            <p className="mt-1 text-sm text-ink-600">
              {isRegister
                ? "A minute to set up."
                : "Pick up where you left off."}
            </p>
          </div>

          {/* Mode switch. A segmented control rather than a link, because the
              two modes are peers here — this page is as much a front door for
              a new user as it is for a returning one. */}
          <div
            role="tablist"
            aria-label="Authentication mode"
            className="mb-5 grid grid-cols-2 gap-1 rounded-full bg-white/45 p-1 shadow-[inset_0_1px_0_0_rgb(255_255_255/0.7)]"
          >
            {(["login", "register"] as Mode[]).map((m) => (
              <button
                key={m}
                role="tab"
                type="button"
                aria-selected={mode === m}
                onClick={() => switchMode(m)}
                className={`rounded-full px-3 py-2 text-sm font-bold transition-all duration-150 ease-[cubic-bezier(0.2,0,0,1)] ${
                  mode === m
                    ? "bg-white text-ink-900 shadow-e1"
                    : "text-ink-500 hover:text-ink-800"
                }`}
              >
                {m === "login" ? "Sign in" : "Register"}
              </button>
            ))}
          </div>

          {serverError && (
            <div
              role="alert"
              className="mb-4 flex items-start gap-2 rounded-2xl bg-bad-50/90 px-3.5 py-2.5"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-bad-500" />
              <p className="text-sm font-medium leading-relaxed text-bad-700">
                {serverError}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-3.5">
            {isRegister && (
              <Field
                id="name"
                label="Full name"
                type="text"
                value={name}
                onChange={setName}
                placeholder="Your name"
                icon={User}
                error={fieldErrors.name}
                autoComplete="name"
                disabled={isSubmitting}
              />
            )}

            <Field
              id="email"
              label="Email"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="you@example.com"
              icon={Mail}
              error={fieldErrors.email}
              autoComplete="email"
              disabled={isSubmitting}
            />

            <Field
              id="password"
              label="Password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={setPassword}
              placeholder={isRegister ? "At least 6 characters" : "Password"}
              icon={Lock}
              error={fieldErrors.password}
              autoComplete={isRegister ? "new-password" : "current-password"}
              disabled={isSubmitting}
              trailing={
                <PasswordToggle
                  visible={showPassword}
                  onToggle={() => setShowPassword((v) => !v)}
                />
              }
            />

            {isRegister && (
              <Field
                id="confirmPassword"
                label="Confirm password"
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={setConfirmPassword}
                placeholder="Re-enter your password"
                icon={Lock}
                error={fieldErrors.confirmPassword}
                autoComplete="new-password"
                disabled={isSubmitting}
              />
            )}

            <Button
              type="submit"
              variant="inverse"
              size="lg"
              block
              disabled={isSubmitting}
              className="mt-1"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{isRegister ? "Creating account" : "Signing in"}</span>
                </>
              ) : (
                <>
                  <span>{isRegister ? "Create account" : "Sign in"}</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <div className="my-4 flex items-center gap-3">
            <span className="h-px flex-1 bg-ink-200/70" />
            <span className="eyebrow">or</span>
            <span className="h-px flex-1 bg-ink-200/70" />
          </div>

          <Button variant="outline" size="lg" block onClick={loginAsGuest} disabled={isSubmitting}>
            Continue as guest
          </Button>
          <p className="mt-2 text-center text-tiny text-ink-500">
            Guest progress is saved on this device only.
          </p>
        </div>
      </div>
    </div>
  );
}
