import Link from "next/link";
import StorefrontNavbar from "@/components/storefront/StorefrontNavbar";
import styles from "./page.module.css";

const categories = [
  { label: "Beans", icon: "🫘" },
  { label: "Fruits", icon: "🍓" },
  { label: "Leaves", icon: "🥬" },
  { label: "Roots", icon: "🥕" },
  { label: "Tuber", icon: "🥔" },
];

export default function Home() {
  return (
    <main className={styles.page}>
      <StorefrontNavbar />

      <section className={styles.hero} aria-labelledby="hero-title">
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>Ttangk e ut Harvest</p>
          <h1 id="hero-title">
            From our fields to your doorstep—
            <span>freshness you can track.</span>
          </h1>
          <p className={styles.tags}>#FarmToTable #SustainableSourcing #FreshProduce</p>
          <Link className={styles.shopButton} href="/products">
            ▣&nbsp; Shop Now
          </Link>
        </div>
        <div className={styles.heroFarmer} aria-hidden="true">
          <span>👩🏻‍🌾</span>
        </div>
        <div className={styles.sliderDots} aria-label="Slide 1 of 3">
          <span className={styles.activeDot} />
          <span />
          <span />
        </div>
      </section>

      <section className={styles.categories} aria-label="Shop by category">
        {categories.map((category) => (
          <Link className={styles.category} href="/products" key={category.label}>
            <span className={styles.categoryIcon}>{category.icon}</span>
            <strong>{category.label}</strong>
          </Link>
        ))}
      </section>
    </main>
  );
}
