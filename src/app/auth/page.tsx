"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loginAction } from "./actions";
import { useSystemSettingsWithLoading } from "@/hooks/useSystemSettings";
import Toast from "@/components/ui/Toast";
import styles from "./page.module.css";

type AuthMode = "login" | "register";

export default function AuthPage() {
  const router = useRouter();
  const { settings, isLoading } = useSystemSettingsWithLoading();
  const [mode, setMode] = useState<AuthMode>("login");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const isRegistering = mode === "register";

  useEffect(() => {
    if (isLoading) return;

    function applyBranding() {
      if (document.title !== settings.siteName) {
        document.title = settings.siteName;
      }

      if (!settings.logoUrl) return;

      let icon = document.querySelector<HTMLLinkElement>("link#app-favicon");
      if (!icon) {
        icon = document.createElement("link");
        icon.id = "app-favicon";
        icon.rel = "icon";
        document.head.appendChild(icon);
      }
      if (icon.href !== settings.logoUrl) icon.href = settings.logoUrl;
      document.querySelectorAll<HTMLLinkElement>("link[rel~='icon']").forEach((existingIcon) => {
        if (existingIcon.href !== settings.logoUrl) existingIcon.href = settings.logoUrl;
      });
    }

    applyBranding();
    const observer = new MutationObserver(applyBranding);
    observer.observe(document.head, { childList: true, subtree: true, characterData: true });

    return () => observer.disconnect();
  }, [isLoading, settings.logoUrl, settings.siteName]);

  function changeMode(nextMode: AuthMode) {
    setMode(nextMode);
    setToast(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setToast(null);
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append("email", email);
    formData.append("password", password);
    formData.append("mode", mode);
    if (isRegistering) {
      formData.append("firstName", firstName);
      formData.append("lastName", lastName);
    }

    const result = await loginAction(formData);

    setIsSubmitting(false);

    if (result.error) {
      setToast({ message: result.error, type: "error" });
      return;
    }

    if (result.success) {
      if (result.message) {
        setToast({ message: result.message, type: "success" });
        setPassword("");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    }
  }

  return (
    <>
    {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    {isLoading && (
      <main className={styles.loadingPage} aria-label="Loading system settings">
        <div className={styles.loadingIndicator} />
      </main>
    )}
    {!isLoading && (
    <main
      className={styles.page}
      style={{
        "--primary-color": settings.primaryColor,
        "--secondary-color": settings.secondaryColor,
      } as React.CSSProperties}
    >
      <section className={`${styles.card} ${isRegistering ? styles.cardReverse : ""}`} aria-labelledby="auth-title">
        <div className={styles.leftPanel}>
          {settings.logoUrl && (
            <div className={styles.logoContainer}>
              <img className={styles.logoImage} src={settings.logoUrl} alt="" />
            </div>
          )}
          <h1 className={styles.brandTitle}>{settings.siteName}</h1>
          {settings.tagline && <h2 className={styles.brandSubtitle}>{settings.tagline}</h2>}
        </div>
        
        <div className={styles.rightPanel}>
          <div className={styles.formHeader}>
            <h2 id="auth-title">{isRegistering ? "Create Account" : "Sign In"}</h2>
            <p>
              {isRegistering
                ? "Get started by creating your new account"
                : "Enter your details to access your dashboard."}
            </p>
          </div>

          <form key={mode} className={styles.form} onSubmit={handleSubmit}>
            {isRegistering && (
              <>
                <input id="firstName" name="firstName" type="text" autoComplete="given-name" placeholder="First Name" value={firstName} onChange={(event) => setFirstName(event.target.value)} required />
                <input id="lastName" name="lastName" type="text" autoComplete="family-name" placeholder="Last Name" value={lastName} onChange={(event) => setLastName(event.target.value)} required />
              </>
            )}

            {!isRegistering && <label htmlFor="email">Email</label>}
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder={isRegistering ? "shuaibalfadhl@gmail.com" : "you@example.com"}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />

            {!isRegistering && <label htmlFor="password">Password</label>}
            <input
              id="password"
              name="password"
              type="password"
              autoComplete={isRegistering ? "new-password" : "current-password"}
              placeholder="••••••••••"
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />

            <button className={styles.submit} disabled={isSubmitting} type="submit">
              {isSubmitting ? "Please wait..." : isRegistering ? "Register" : "Sign In"}
            </button>
            
            <div className={styles.toggleText}>
              {isRegistering ? "Already have an account? " : "Don't have an account? "}
              <button
                type="button"
                className={styles.toggleLink}
                onClick={() => changeMode(isRegistering ? "login" : "register")}
              >
                {isRegistering ? "Sign In" : "Register"}
              </button>
            </div>
          </form>
        </div>
      </section>
    </main>
    )}
    </>
  );
}
