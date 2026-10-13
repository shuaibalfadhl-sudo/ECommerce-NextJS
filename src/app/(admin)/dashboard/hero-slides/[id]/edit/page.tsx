"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import HeroSlideForm from "../../HeroSlideForm";
import Toast from "@/components/ui/Toast";
import styles from "../../page.module.css";

type HeroSlide = {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string;
  display_order: number;
  is_active: boolean;
};

export default function EditHeroSlidePage() {
  const params = useParams<{ id: string }>();
  const [slide, setSlide] = useState<HeroSlide | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    async function loadSlide() {
      const { data, error: loadError } = await supabase
        .from("hero_slides")
        .select("id, title, subtitle, image_url, display_order, is_active")
        .eq("id", params.id)
        .single();

      if (loadError) setToast({ message: loadError.message, type: "error" });
      else setSlide(data as HeroSlide);
    }

    void loadSlide();
  }, [params.id]);

  return (
    <>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      <section className={styles.page}>
      <div className={styles.intro}>
        <div>
          <p className={styles.eyebrow}>STOREFRONT CONTENT</p>
          <h2>Edit hero slide</h2>
          <p className={styles.description}>Update the selected storefront hero slide.</p>
        </div>
        <div className={styles.introActions}>
          <Link className={styles.backLink} href="/dashboard/hero-slides">
            ← Back to hero slides
          </Link>
          <span className={styles.tableBadge}>hero_slides</span>
        </div>
      </div>
      {slide ? <HeroSlideForm initialSlide={slide} /> : !toast && <p>Loading hero slide...</p>}
      </section>
    </>
  );
}
