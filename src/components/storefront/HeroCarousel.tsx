"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useSystemSettingsWithLoading } from "@/hooks/useSystemSettings";
import styles from "./HeroCarousel.module.css";

interface Slide {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string;
  link_url: string | null;
  display_order: number;
}

const AUTOPLAY_DELAY = 5000; // ms

export default function HeroCarousel() {
  const { settings } = useSystemSettingsWithLoading();
  const [slides, setSlides] = useState<Slide[]>([]);
  const [current, setCurrent] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch active slides ordered by display_order
  useEffect(() => {
    let isMounted = true;
    async function fetchSlides() {
      const { data } = await supabase
        .from("hero_slides")
        .select("id, title, subtitle, image_url, link_url, display_order")
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (isMounted) {
        setSlides((data ?? []) as Slide[]);
        setIsLoading(false);
      }
    }
    void fetchSlides();
    return () => {
      isMounted = false;
    };
  }, []);

  // Autoplay
  useEffect(() => {
    if (slides.length <= 1 || isPaused) return;
    timerRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, AUTOPLAY_DELAY);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [slides.length, isPaused]);

  function goTo(index: number) {
    setCurrent(index);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, AUTOPLAY_DELAY);
  }

  function prev() {
    goTo((current - 1 + slides.length) % slides.length);
  }

  function next() {
    goTo((current + 1) % slides.length);
  }

  if (isLoading) {
    return <div className={styles.skeleton} aria-hidden="true" />;
  }

  if (slides.length === 0) {
    return null;
  }

  return (
    <section
      className={styles.carousel}
      aria-label="Promotional banner carousel"
      style={
        {
          "--primary": settings.primaryColor || "#2d6a4f",
          "--secondary": settings.secondaryColor || "#1b4332",
          "--carousel-bg": settings.primaryColor
            ? `color-mix(in srgb, ${settings.primaryColor} 6%, #faf7f2)`
            : "#f6efe3",
        } as React.CSSProperties
      }
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Slides track */}
      <div className={styles.track}>
        {slides.map((s, i) => (
          <div
            key={s.id}
            className={`${styles.slide} ${i === current ? styles.slideActive : ""}`}
            aria-hidden={i !== current}
          >
            {/* Left Content Area */}
            <div className={styles.content}>
              <h1 className={styles.title}>{s.title}</h1>
              {s.subtitle && <p className={styles.subtitle}>{s.subtitle}</p>}
              <Link className={styles.cta} href={s.link_url || "/products"}>
                Shop Now
              </Link>
            </div>

            {/* Right Image with smooth blend mask */}
            <div className={styles.imageWrapper}>
              <img
                src={s.image_url}
                alt=""
                className={styles.slideImage}
                loading={i === 0 ? "eager" : "lazy"}
                draggable={false}
              />
              <div className={styles.imageOverlay} />
            </div>
          </div>
        ))}
      </div>

      {/* Thin Chevron Arrows */}
      {slides.length > 1 && (
        <>
          <button
            type="button"
            className={`${styles.arrow} ${styles.arrowPrev}`}
            onClick={prev}
            aria-label="Previous slide"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <button
            type="button"
            className={`${styles.arrow} ${styles.arrowNext}`}
            onClick={next}
            aria-label="Next slide"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </>
      )}

      {/* Capsule Dot Indicators */}
      {slides.length > 1 && (
        <div className={styles.capsulePagination} role="tablist" aria-label="Slide indicators">
          {slides.map((s, i) => (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={i === current}
              aria-label={`Go to slide ${i + 1}: ${s.title}`}
              className={`${styles.dot} ${i === current ? styles.dotActive : ""}`}
              onClick={() => goTo(i)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
