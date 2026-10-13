import Link from "next/link";
import StorefrontNavbar from "@/components/storefront/StorefrontNavbar";
import StorefrontFooter from "@/components/storefront/StorefrontFooter";
import HeroCarousel from "@/components/storefront/HeroCarousel";
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

      <HeroCarousel />

      <section className={styles.categories} aria-label="Shop by category">
        {categories.map((category) => (
          <Link className={styles.category} href="/products" key={category.label}>
            <span className={styles.categoryIcon}>{category.icon}</span>
            <strong>{category.label}</strong>
          </Link>
        ))}
      </section>

      <StorefrontFooter />
    </main>
  );
}
