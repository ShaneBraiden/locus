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
      <label htmlFor={id} className="block text-xs font-semibold text-slate-700">
        {label}
      </label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
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
          className={`w-full rounded-lg border bg-white py-3 pl-10 text-sm text-slate-900 placeholder-slate-400 transition focus:outline-none focus:ring-3 disabled:cursor-not-allowed disabled:opacity-60 ${
            trailing ? "pr-11" : "pr-4"
          } ${
            error
              ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100"
              : "border-slate-200 focus:border-[#4C1D95] focus:ring-purple-100"
          }`}
        />
        {trailing && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2">{trailing}</div>
        )}
      </div>
      {error && (
        <p
          id={`${id}-error`}
          className="flex items-center gap-1 text-xs font-medium text-rose-600"
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
      className="rounded-md p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
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
    <div className="flex min-h-[100dvh] w-full items-center justify-center bg-slate-100 px-4 py-8 font-sans text-slate-900">
      <div className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold text-slate-950">
            {isRegister ? "Create account" : "Sign in"}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {isRegister ? "Register to continue." : "Welcome back to Northr."}
          </p>
        </div>

        <div
          role="tablist"
          aria-label="Authentication mode"
          className="mb-6 grid grid-cols-2 gap-2"
        >
          {(["login", "register"] as Mode[]).map((m) => (
            <button
              key={m}
              role="tab"
              type="button"
              aria-selected={mode === m}
              onClick={() => switchMode(m)}
              className={`rounded-lg border px-3 py-2 text-sm font-semibold transition-colors cursor-pointer ${
                mode === m
                  ? "border-[#4C1D95] bg-[#4C1D95] text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {m === "login" ? "Login" : "Register"}
            </button>
          ))}
        </div>

        {serverError && (
          <div
            role="alert"
            className="mb-5 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
            <p className="text-sm font-medium leading-relaxed text-rose-800">
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

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#4C1D95] px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-[#3B0764] focus:outline-none focus:ring-3 focus:ring-purple-200 disabled:cursor-not-allowed disabled:opacity-70 cursor-pointer"
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
          </button>
        </form>

        <button
          type="button"
          onClick={loginAsGuest}
          disabled={isSubmitting}
          className="mt-3 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-3 focus:ring-slate-100 disabled:opacity-60 cursor-pointer"
        >
          Continue as guest
        </button>

        <p className="mt-5 text-center text-sm text-slate-500">
          {isRegister ? "Already have an account?" : "Need an account?"}{" "}
          <button
            type="button"
            onClick={() => switchMode(isRegister ? "login" : "register")}
            className="font-semibold text-[#4C1D95] underline-offset-2 transition-colors hover:text-[#3B0764] hover:underline cursor-pointer"
          >
            {isRegister ? "Sign in" : "Register"}
          </button>
        </p>
      </div>
    </div>
  );
}
