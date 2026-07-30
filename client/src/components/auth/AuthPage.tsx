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
import { Button, Wash, cx, inputClass } from "../../ui";

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
        <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
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
          className={cx(inputClass(!!error, true), trailing ? "pr-11" : "pr-3")}
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
    // Split screen: brand on the left, form on the right. The old page was a
    // single grey box centred on a grey field, which gave the product no
    // first impression at all.
    <div className="grid min-h-[100dvh] w-full font-sans text-ink-900 lg:grid-cols-[1.1fr_1fr]">

      {/* Brand panel — desktop only. Deep loam rather than near-black: the
          panel should read as forest floor, not as a void. */}
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-ink-900 p-12 lg:flex">
        {/*
          Two ambient washes. Moss drifts slowly at top-left, clay sits still
          at bottom-right — one moving element per screen is enough to feel
          alive, and the second would start competing. Both are blurred past
          recognition so what registers is warmth, not a shape.
        */}
        <Wash
          shape={0}
          tone="moss"
          animate
          className="-left-32 -top-32 h-[36rem] w-[36rem] opacity-30"
        />
        <Wash
          shape={2}
          tone="clay"
          className="-bottom-40 -right-24 h-[30rem] w-[30rem] opacity-25"
        />

        <div className="relative flex items-center gap-3">
          <Logo className="h-11 w-11 rounded-full" />
          <div>
            <div className="font-display text-xl font-bold tracking-tight text-white">northr</div>
            <div className="font-sans text-micro font-extrabold uppercase tracking-[0.14em] text-white/40">
              Your Career OS
            </div>
          </div>
        </div>

        <div className="relative max-w-md">
          <h2 className="font-display text-4xl font-bold leading-[1.05] tracking-tight text-white text-balance">
            From clinical chaos to{" "}
            <span className="text-gradient-moss">actual clarity.</span>
          </h2>
          <p className="mt-5 text-base leading-relaxed text-white/60 text-pretty">
            FAB just talks to you. Underneath, every answer maps onto a 25-item
            psychometric instrument and a 127-career fit table — so what comes out
            the other end is a real answer, not a personality quiz.
          </p>
        </div>

        <dl className="relative grid grid-cols-3 gap-6 border-t border-white/10 pt-6">
          {[
            ["127", "careers scored"],
            ["26", "degree pathways"],
            ["11", "languages"],
          ].map(([n, label]) => (
            <div key={label}>
              <dt data-numeric className="font-display text-2xl font-bold text-moss-300">
                {n}
              </dt>
              <dd className="mt-1 font-sans text-micro font-extrabold uppercase tracking-[0.14em] text-white/40">
                {label}
              </dd>
            </div>
          ))}
        </dl>
      </aside>

      {/* Form panel */}
      <main className="relative flex items-center justify-center overflow-hidden bg-ink-50 px-4 py-10 sm:px-8">
        {/* A single sand wash bled off the bottom-left corner. Barely there —
            enough that the form sits on a field rather than on a flat fill,
            never enough to fight the inputs for attention. */}
        <Wash
          shape={4}
          tone="sand"
          className="-bottom-48 -left-32 h-[28rem] w-[28rem] opacity-40"
        />

        <div className="relative w-full max-w-sm">
          {/* Compact brand lockup, mobile only. */}
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <Logo className="h-10 w-10 rounded-full" />
            <span className="font-display text-xl font-bold tracking-tight">northr</span>
          </div>

          <div className="mb-6">
            <h1 className="font-display text-2xl font-bold text-ink-950">
              {isRegister ? "Create your account" : "Welcome back"}
            </h1>
            <p className="mt-1.5 text-sm text-ink-500">
              {isRegister
                ? "A minute to set up. Your progress follows you across devices."
                : "Pick up exactly where you left off."}
            </p>
          </div>

          <div
            role="tablist"
            aria-label="Authentication mode"
            className="mb-6 grid grid-cols-2 gap-1 rounded-full border border-ink-200/60 bg-ink-100/70 p-1.5"
          >
            {(["login", "register"] as Mode[]).map((m) => (
              <button
                key={m}
                role="tab"
                type="button"
                aria-selected={mode === m}
                onClick={() => switchMode(m)}
                className={`rounded-full px-3 py-2 text-sm font-bold transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                  mode === m
                    ? "bg-ink-25 text-ink-900 shadow-soft"
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
            className="mb-5 flex items-start gap-2 rounded-lg border border-bad-100 bg-bad-50 px-3 py-2.5"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-bad-500" />
            <p className="text-sm font-medium leading-relaxed text-bad-700">
              {serverError}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
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

          <div className="my-5 flex items-center gap-3">
            <span className="h-px flex-1 bg-ink-100" />
            <span className="eyebrow">or</span>
            <span className="h-px flex-1 bg-ink-100" />
          </div>

          <Button variant="outline" size="lg" block onClick={loginAsGuest} disabled={isSubmitting}>
            Continue as guest
          </Button>
          <p className="mt-2 text-center text-tiny text-ink-500">
            Guest progress is saved on this device only.
          </p>

          <p className="mt-6 text-center text-sm text-ink-500">
            {isRegister ? "Already have an account?" : "Need an account?"}{" "}
            <button
              type="button"
              onClick={() => switchMode(isRegister ? "login" : "register")}
              className="font-semibold text-ink-900 underline decoration-moss-400 decoration-2 underline-offset-4 transition-colors hover:text-moss-700"
            >
              {isRegister ? "Sign in" : "Register"}
            </button>
          </p>
        </div>
      </main>
    </div>
  );
}
