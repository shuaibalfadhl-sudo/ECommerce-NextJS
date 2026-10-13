"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useSystemSettingsWithLoading } from "@/hooks/useSystemSettings";
import styles from "./StorefrontNavbar.module.css";

interface CategoryItem {
  id?: string;
  label: string;
  icon?: string;
  href: string;
}

const fallbackCategories: CategoryItem[] = [
  { label: "Beans", icon: "🫘", href: "/products?category=beans" },
  { label: "Fruits", icon: "🍓", href: "/products?category=fruits" },
  { label: "Leaves", icon: "🥬", href: "/products?category=leaves" },
  { label: "Roots", icon: "🥕", href: "/products?category=roots" },
  { label: "Tuber", icon: "🥔", href: "/products?category=tuber" },
];

export default function StorefrontNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { settings } = useSystemSettingsWithLoading();

  const [categories, setCategories] = useState<CategoryItem[]>(fallbackCategories);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isLoginDropdownOpen, setIsLoginDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userFirstName, setUserFirstName] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  const categoryRef = useRef<HTMLDivElement>(null);
  const loginRef = useRef<HTMLDivElement>(null);

  // Load auth state + profile first name + role
  useEffect(() => {
    let isMounted = true;

    async function loadUserProfile(userId: string, email: string) {
      if (!isMounted) return;
      setUserEmail(email);

      const { data: profile } = await supabase
        .from("profile")
        .select("first_name, role")
        .eq("id", userId)
        .maybeSingle();

      if (isMounted) {
        setUserFirstName(profile?.first_name ?? null);
        setUserRole(profile?.role ?? null);
      }
    }

    async function checkAuth() {
      const { data } = await supabase.auth.getUser();
      if (isMounted && data.user) {
        await loadUserProfile(data.user.id, data.user.email ?? "");
      }
    }
    void checkAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!isMounted) return;
      if (session?.user) {
        await loadUserProfile(session.user.id, session.user.email ?? "");
      } else {
        setUserEmail(null);
        setUserFirstName(null);
        setUserRole(null);
      }
    });

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Load categories from database if available
  useEffect(() => {
    let isMounted = true;
    async function fetchCategories() {
      try {
        const { data, error } = await supabase
          .from("categories")
          .select("id, name, slug")
          .eq("is_active", true)
          .order("name");

        if (!error && data && data.length > 0 && isMounted) {
          const mapped: CategoryItem[] = data.map((cat) => ({
            id: cat.id,
            label: cat.name,
            icon: "🌿",
            href: `/products?category=${encodeURIComponent(cat.slug || cat.name.toLowerCase())}`,
          }));
          setCategories(mapped);
        }
      } catch {
        // Fall back to default
      }
    }
    void fetchCategories();

    return () => {
      isMounted = false;
    };
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (categoryRef.current && !categoryRef.current.contains(event.target as Node)) {
        setIsCategoryOpen(false);
      }
      if (loginRef.current && !loginRef.current.contains(event.target as Node)) {
        setIsLoginDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close category dropdown on route change
  useEffect(() => {
    setIsCategoryOpen(false);
    setIsLoginDropdownOpen(false);
  }, [pathname]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push("/products");
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setUserEmail(null);
    setIsLoginDropdownOpen(false);
    router.push("/");
    router.refresh();
  }

  // Sync page title and favicon from system settings
  useEffect(() => {
    if (settings.siteName) {
      document.title = settings.siteName;
    }

    if (settings.logoUrl) {
      // Reuse an existing tracked element rather than removing/adding,
      // which avoids removeChild crashes during React navigation unmount.
      let link = document.querySelector<HTMLLinkElement>("link#app-favicon");
      if (!link) {
        link = document.createElement("link");
        link.id = "app-favicon";
        link.rel = "icon";
        link.type = "image/png";
        document.head.appendChild(link);
      }
      link.href = settings.logoUrl;
      document.querySelectorAll<HTMLLinkElement>("link[rel~='icon']").forEach((icon) => {
        if (icon.href !== settings.logoUrl) icon.href = settings.logoUrl;
      });
    }
    const observer = new MutationObserver(() => {
      if (settings.logoUrl) {
        const trackedLink = document.querySelector<HTMLLinkElement>("link#app-favicon");
        if (trackedLink && trackedLink.href !== settings.logoUrl) trackedLink.href = settings.logoUrl;
        document.querySelectorAll<HTMLLinkElement>("link[rel~='icon']").forEach((icon) => {
          if (icon.href !== settings.logoUrl) icon.href = settings.logoUrl;
        });
      }
    });
    observer.observe(document.head, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [settings.siteName, settings.logoUrl]);

  return (
    <div
      className={styles.navbarWrapper}
      style={
        {
          "--primary": settings.primaryColor,
          "--secondary": settings.secondaryColor,
        } as React.CSSProperties
      }
    >
      {/* =========================================
          TIER 1: Utility Bar
          ========================================= */}
      <div className={styles.utilityBar}>
        <div className={styles.utilityLinks}>
          <Link href="#about">About us</Link>
          <span className={styles.utilityDivider} aria-hidden="true" />
          <Link href="#delivery">Free Delivery</Link>
          <span className={styles.utilityDivider} aria-hidden="true" />
          <Link href="#returns">Returns Policy</Link>
        </div>

        <div className={styles.utilityRight} ref={loginRef}>
          <button
            type="button"
            className={styles.loginTrigger}
            onClick={() => setIsLoginDropdownOpen((prev) => !prev)}
            aria-expanded={isLoginDropdownOpen}
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
            </svg>
            <span>{userEmail ? (userFirstName ?? "Account") : "Login"}</span>
            <span aria-hidden="true">⌄</span>
          </button>

          {isLoginDropdownOpen && (
            <div className={styles.loginDropdown}>
              {userEmail ? (
                <>
                  {userRole === "admin" && (
                    <Link href="/dashboard" onClick={() => setIsLoginDropdownOpen(false)}>
                      Dashboard
                    </Link>
                  )}
                  <Link href="/profile" onClick={() => setIsLoginDropdownOpen(false)}>
                    Profile
                  </Link>
                  <button type="button" onClick={handleLogout}>
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link href="/auth" onClick={() => setIsLoginDropdownOpen(false)}>
                    Sign In
                  </Link>
                  <Link href="/auth" onClick={() => setIsLoginDropdownOpen(false)}>
                    Create Account
                  </Link>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* =========================================
          TIER 2: Brand Header, Search, Cart
          ========================================= */}
      <header className={styles.brandHeader}>
        <Link className={styles.brandLink} href="/">
          <div className={styles.logoCircle}>
            {settings.logoUrl && (
              <img
                src={settings.logoUrl}
                alt={settings.siteName}
                className={styles.logoImage}
              />
            )}
          </div>
          <div className={styles.brandTextGroup}>
            <div className={styles.dotRow} aria-hidden="true">
              <span className={`${styles.dot} ${styles.dotGreen}`} />
              <span className={`${styles.dot} ${styles.dotBlue}`} />
              <span className={`${styles.dot} ${styles.dotRed}`} />
              <span className={`${styles.dot} ${styles.dotYellow}`} />
              <span className={`${styles.dot} ${styles.dotOrange}`} />
            </div>
            <span className={styles.brandTitle}>{settings.siteName}</span>
          </div>
        </Link>

        <form className={styles.searchContainer} onSubmit={handleSearchSubmit}>
          <input
            type="search"
            className={styles.searchInput}
            placeholder="Search for a product or brand"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search products"
          />
          <button type="submit" className={styles.searchButton} aria-label="Search">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </button>
        </form>

        <div className={styles.headerActions}>
          <Link href="#wishlist" className={styles.actionItem}>
            <span className={styles.actionIcon} aria-hidden="true">
              <svg
                width="19"
                height="19"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
              </svg>
            </span>
            <span>Wishlist</span>
          </Link>

          <Link href="/cart" className={styles.actionItem}>
            <span className={styles.actionIcon} aria-hidden="true">
              <svg
                width="19"
                height="19"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="8" cy="21" r="1" />
                <circle cx="19" cy="21" r="1" />
                <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
              </svg>
            </span>
            <span>Cart</span>
          </Link>
        </div>
      </header>

      {/* =========================================
          TIER 3: Sticky Main Navigation
          ========================================= */}
      <nav className={styles.stickyNavigation} aria-label="Main navigation">
        <div className={styles.categoryDropdownWrapper} ref={categoryRef}>
          <button
            type="button"
            className={styles.categoryButton}
            onClick={() => setIsCategoryOpen((prev) => !prev)}
            aria-expanded={isCategoryOpen}
          >
            <span className={styles.gridIcon} aria-hidden="true">
              <span className={styles.gridDot} />
              <span className={styles.gridDot} />
              <span className={styles.gridDot} />
              <span className={styles.gridDot} />
              <span className={styles.gridDot} />
              <span className={styles.gridDot} />
              <span className={styles.gridDot} />
              <span className={styles.gridDot} />
              <span className={styles.gridDot} />
            </span>
            <span>All Categories</span>
            <span className={`${styles.chevronIcon} ${isCategoryOpen ? styles.chevronRotated : ""}`}>
              ▼
            </span>
          </button>

          {isCategoryOpen && (
            <div className={styles.categoryMenu}>
              {categories.map((cat) => (
                <Link
                  key={cat.label}
                  href={cat.href}
                  className={styles.categoryMenuItem}
                  onClick={() => setIsCategoryOpen(false)}
                >
                  <span className={styles.categoryItemIcon}>{cat.icon || "🌿"}</span>
                  <span>{cat.label}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className={styles.navLinks}>
          <Link
            href="/"
            className={`${styles.navLink} ${pathname === "/" ? styles.navLinkActive : ""}`}
          >
            Home
          </Link>
          <Link
            href="/products"
            className={`${styles.navLink} ${pathname.startsWith("/products") ? styles.navLinkActive : ""}`}
          >
            Shop
          </Link>
          <Link href="#contact" className={styles.navLink}>
            Contact Us
          </Link>
        </div>

        <div className={styles.navRight}>
          {settings.contactNumber && <a href={`tel:${settings.contactNumber}`} className={styles.phoneButton}>
            <span className={styles.phoneIcon} aria-hidden="true">
              📞
            </span>
            <span>{settings.contactNumber}</span>
          </a>}
        </div>
      </nav>
    </div>
  );
}
