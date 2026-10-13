import Link from "next/link";
import HeroSlideForm from "../HeroSlideForm";
import styles from "../page.module.css";

export default function NewHeroSlidePage() {
  return (
    <section className={styles.page}>
      <div className={styles.intro}>
        <div>
          <p className={styles.eyebrow}>STOREFRONT CONTENT</p>
          <h2>Add hero slide</h2>
          <p className={styles.description}>
            Register a promotional slide for the storefront hero banner.
          </p>
        </div>
        <div className={styles.introActions}>
          <Link className={styles.backLink} href="/dashboard/hero-slides">
            ← Back to hero slides
          </Link>
          <span className={styles.tableBadge}>hero_slides</span>
        </div>
      </div>
      <HeroSlideForm />
    </section>
  );
}
