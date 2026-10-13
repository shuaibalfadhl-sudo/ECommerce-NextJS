"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useSystemSettingsWithLoading } from "@/hooks/useSystemSettings";
import styles from "./layout.module.css";

const navigation = [
  { label: "Overview", href: "/dashboard", icon: "▦" },
  { label: "Hero Slides", href: "/dashboard/hero-slides", icon: "▱" },
  { label: "Categories", href: "/dashboard/categories", icon: "◇" },
  { label: "Products", href: "/dashboard/products", icon: "◈" },
  { label: "Orders", href: "/dashboard/orders", icon: "◫" },
  { label: "Users", href: "/dashboard/users", icon: "♙" },
  { label: "System Details", href: "/dashboard/system-settings", icon: "⚙" },
];

export default function AdminShell({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const router = useRouter();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profileAvatar, setProfileAvatar] = useState("");
  const { settings, isLoading: isSettingsLoading } = useSystemSettingsWithLoading();

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      const { data } = await supabase.auth.getUser();
      if (isMounted && data.user) {
        setProfileEmail(data.user.email ?? "");
        const { data: profile } = await supabase.from("profile").select("first_name, last_name, avatar_url").eq("id", data.user.id).maybeSingle();
        const metadataName = typeof data.user.user_metadata?.full_name === "string" ? data.user.user_metadata.full_name : "";
        setProfileName(profile ? [profile.first_name, profile.last_name].filter(Boolean).join(" ") : metadataName);
        setProfileAvatar(profile?.avatar_url ?? "");
      }
    }

    void loadProfile();
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      setProfileEmail(session?.user.email ?? "");
      setProfileName(typeof session?.user.user_metadata?.full_name === "string" ? session.user.user_metadata.full_name : "");
    });

    return () => {
      isMounted = false;
      subscription.subscription.unsubscribe();
    };
  }, [pathname]);

  useEffect(() => {
    if (isSettingsLoading) return;

    function applyBranding() {
      if (document.title !== settings.siteName) {
        document.title = settings.siteName;
      }

      if (!settings.logoUrl) return;

      const icons = document.querySelectorAll<HTMLLinkElement>("link[rel~='icon']");
      if (icons.length === 0) {
        const icon = document.createElement("link");
        icon.rel = "icon";
        icon.href = settings.logoUrl;
        document.head.appendChild(icon);
        return;
      }

      icons.forEach((icon) => {
        if (icon.href !== settings.logoUrl) icon.href = settings.logoUrl;
      });
    }

    applyBranding();
    const observer = new MutationObserver(applyBranding);
    observer.observe(document.head, { childList: true, subtree: true, characterData: true });

    return () => observer.disconnect();
  }, [isSettingsLoading, settings.logoUrl, settings.siteName]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/auth");
    router.refresh();
  }

  const currentPage = navigation.find((item) =>
    item.href === "/dashboard"
      ? pathname === item.href
      : pathname.startsWith(item.href),
  );
  const currentPageLabel = pathname === "/profile" ? "My Profile" : currentPage?.label ?? "Dashboard";

  return (
    <div
      className={styles.shell}
      style={{
        "--primary-color": settings.primaryColor,
        "--secondary-color": settings.secondaryColor,
      } as React.CSSProperties}
    >
      <aside className={styles.sidebar}>
        <Link className={styles.brand} href="/dashboard">
          {settings.logoUrl && (
            <img className={styles.logoImage} src={settings.logoUrl} alt="" />
          )}
          <span>
            <strong>{settings.siteName}</strong>
            <small>Admin Portal</small>
          </span>
        </Link>

        <p className={styles.sectionLabel}>WORKSPACE</p>
        <nav className={styles.navigation} aria-label="Admin navigation">
          {navigation.map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? pathname === item.href
                : pathname.startsWith(item.href);

            return (
              <Link
                className={`${styles.navLink} ${isActive ? styles.active : ""}`}
                href={item.href}
                key={item.href}
              >
                <span className={styles.navIcon}>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className={styles.sidebarFooter}>
          <Link className={styles.storeLink} href="/">
            <span>↗</span> View storefront
          </Link>
          <button className={styles.signOut} onClick={handleSignOut} type="button">
            <span>⇥</span> Sign out
          </button>
        </div>
      </aside>

      <div className={styles.content}>
        <header className={styles.navbar}>
          <div>
            <p className={styles.breadcrumb}>
              ADMIN <span>/</span> WORKSPACE <span>/</span> {currentPageLabel}
            </p>
          </div>
          <div className={styles.navbarActions}>
            <button className={styles.iconButton} aria-label="Notifications" type="button">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
              </svg>
              <span className={styles.notificationCount}>6</span>
            </button>
            <div className={styles.profileMenu}>
              <button
                className={styles.profileButton}
                onClick={() => setIsProfileOpen((open) => !open)}
                type="button"
                aria-expanded={isProfileOpen}
              >
              <span className={styles.avatar}>{profileAvatar ? <img src={profileAvatar} alt="" /> : (profileName || profileEmail || "U").slice(0, 2).toUpperCase()}</span>
              <span>
                <strong>{profileName || profileEmail || "User"}</strong>
              </span>
                <svg className={styles.profileCaret} viewBox="0 0 12 8" aria-hidden="true">
                  <path d="m1 1 5 5 5-5" />
                </svg>
              </button>
              {isProfileOpen && (
                <div className={styles.profileDropdown}>
                  <Link href="/profile" onClick={() => setIsProfileOpen(false)}>My profile</Link>
                  <Link href="/dashboard/settings" onClick={() => setIsProfileOpen(false)}>Settings</Link>
                  <button onClick={handleSignOut} type="button">Logout</button>
                </div>
              )}
            </div>
          </div>
        </header>
        <main className={styles.main} key={pathname}>{children}</main>
      </div>
    </div>
  );
}
