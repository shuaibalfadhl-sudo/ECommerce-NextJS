"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useSystemSettings } from "@/hooks/useSystemSettings";
import styles from "./StorefrontFooter.module.css";

type FooterCategory = {
  name: string;
  slug: string;
};

export default function StorefrontFooter() {
  const settings = useSystemSettings();
  const [year, setYear] = useState("");
  const [categories, setCategories] = useState<FooterCategory[]>([]);
  const brandLogo = settings.secondaryLogoUrl || settings.logoUrl;
  const socialLinks = [
    { label: "Facebook", url: settings.facebookUrl, icon: "f" },
    { label: "Instagram", url: settings.instagramUrl, icon: "◎" },
    { label: "Twitter/X", url: settings.twitterUrl, icon: "𝕏" },
    { label: "KakaoTalk", url: settings.kakaoTalkUrl, icon: "●" },
  ].filter((social) => social.url);

  useEffect(() => {
    setYear(String(new Date().getFullYear()));
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadCategories() {
      const { data } = await supabase
        .from("categories")
        .select("name, slug")
        .eq("is_active", true)
        .order("name", { ascending: true });

      if (isMounted) {
        setCategories((data ?? []) as FooterCategory[]);
      }
    }

    void loadCategories();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <footer
      className={styles.footer}
      style={
        {
          "--footer-primary": settings.primaryColor || "#2d6a4f",
          "--footer-secondary": settings.secondaryColor || "#1b4332",
        } as React.CSSProperties
      }
    >
      <div className={styles.content}>
        <div className={styles.brandColumn}>
          <Link href="/" className={styles.brandBadge} aria-label={`${settings.siteName || "Home"} home`}>
            {brandLogo ? (
              <img src={brandLogo} alt="" className={styles.logo} />
            ) : (
              <span className={styles.logoPlaceholder} aria-hidden="true">{(settings.siteName || "S").slice(0, 1)}</span>
            )}
            <span>{settings.siteName}</span>
          </Link>
          {settings.tagline && <p className={styles.tagline}>{settings.tagline}</p>}
          {(settings.description || settings.address) && (
            <p className={styles.description}>{settings.description || settings.address}</p>
          )}
        </div>

        <div className={styles.column}>
          <h2>Quick Links</h2>
          <Link href="/">Home</Link>
          <Link href="/products">Shop</Link>
          <Link href="/about">About Us</Link>
          <Link href="/#contact">Contact Us</Link>
          <Link href="/faqs">FAQs</Link>
        </div>

        <div className={styles.column}>
          <h2>Categories</h2>
          {categories.map((category) => (
            <Link key={category.slug} href={`/products?category=${encodeURIComponent(category.slug)}`}>
              {category.name}
            </Link>
          ))}
        </div>

        <div className={`${styles.column} ${styles.contactColumn}`}>
          <h2>Contact</h2>
          {settings.contactNumber && (
            <a href={`tel:${settings.contactNumber}`}>
              <span className={styles.contactIcon} aria-hidden="true">⌕</span>
              Direct: {settings.contactNumber}
            </a>
          )}
          {settings.supportEmail && (
            <a href={`mailto:${settings.supportEmail}`}>
              <span className={styles.contactIcon} aria-hidden="true">✉</span>
              Email: {settings.supportEmail}
            </a>
          )}
          {settings.address && <span className={styles.address}>{settings.address}</span>}
          <h2 className={styles.supportHeading}>Support</h2>
          {settings.kakaoTalkUrl && (
            <a href={settings.kakaoTalkUrl} target="_blank" rel="noreferrer" className={styles.kakaoLink}>
              <span className={styles.kakaoIcon} aria-hidden="true">●</span>
              KakaoTalk ID
            </a>
          )}
        </div>

        <div className={styles.socialColumn}>
          <h2>Socials</h2>
          <div className={styles.socialLinks}>
            {socialLinks.map((social) => (
              <a
                key={social.label}
                href={social.url}
                target="_blank"
                rel="noreferrer"
                className={styles.socialLink}
                aria-label={social.label}
              >
                {social.icon}
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.bottomBar}>
        <span>© {year} {settings.siteName || "Storefront"}. All rights reserved.</span>
        <div className={styles.legalLinks}>
          <Link href="#privacy-policy">Privacy Policy</Link>
          <Link href="#terms-of-service">Terms of Service</Link>
        </div>
      </div>
    </footer>
  );
}
