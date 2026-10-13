"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import Toast from "@/components/ui/Toast";
import styles from "./page.module.css";

type HeroSlide = {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string;
  display_order: number;
  is_active: boolean;
};

export default function HeroSlidesPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  const filteredSlides = useMemo(() => {
    const query = search.trim().toLowerCase();
    return slides.filter((slide) => {
      const matchesSearch =
        !query ||
        slide.title.toLowerCase().includes(query) ||
        (slide.subtitle ?? "").toLowerCase().includes(query);
      const matchesStatus =
        status === "all" ||
        (status === "active" ? slide.is_active : !slide.is_active);
      return matchesSearch && matchesStatus;
    });
  }, [search, slides, status]);

  const totalPages = Math.max(1, Math.ceil(filteredSlides.length / pageSize));
  const visibleSlides = filteredSlides.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  useEffect(() => {
    async function loadSlides() {
      const { data, error: loadError } = await supabase
        .from("hero_slides")
        .select("id, title, subtitle, image_url, display_order, is_active")
        .order("display_order", { ascending: true });

      if (loadError) {
        setToast({ message: loadError.message, type: "error" });
      } else {
        setSlides((data ?? []) as HeroSlide[]);
      }
      setIsLoading(false);
    }

    void loadSlides();
  }, []);

  function updateSearch(value: string) {
    setSearch(value);
    setCurrentPage(1);
  }

  function updateStatus(value: string) {
    setStatus(value);
    setCurrentPage(1);
  }

  return (
    <>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      <section className={styles.page}>
      <div className={styles.intro}>
        <div>
          <p className={styles.eyebrow}>STOREFRONT CONTENT</p>
          <h2>Hero slides</h2>
          <p className={styles.description}>
            Manage the promotional slides that appear on the storefront hero banner.
          </p>
        </div>
        <div className={styles.introActions}>
          <span className={styles.tableBadge}>hero_slides</span>
          <Link className={styles.addButton} href="/dashboard/hero-slides/new">
            <span>+</span> Add Slides
          </Link>
        </div>
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <div>
            <h3>Registered hero slides</h3>
            <p>{slides.length} slide{slides.length === 1 ? "" : "s"} registered</p>
          </div>
          <div className={styles.tableControls}>
            <label className={styles.searchField}>
              <span>⌕</span>
              <input
                type="search"
                value={search}
                onChange={(event) => updateSearch(event.target.value)}
                placeholder="Search slides"
                aria-label="Search hero slides"
              />
            </label>
            <select value={status} onChange={(event) => updateStatus(event.target.value)} aria-label="Filter by status">
              <option value="all">All status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
        <div className={styles.tableWrapper}>
          <table>
            <thead>
              <tr>
                <th>Preview</th>
                <th>Slide details</th>
                <th>Order</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td className={styles.tableState} colSpan={5}>Loading hero slides...</td></tr>
              ) : filteredSlides.length === 0 ? (
                <tr><td className={styles.tableState} colSpan={5}>
                  {slides.length === 0
                    ? 'No hero slides registered yet. Click "Add Slides" to create the first one.'
                    : "No hero slides match the current search or status filter."}
                </td></tr>
              ) : (
                visibleSlides.map((slide) => (
                  <tr key={slide.id}>
                    <td>
                      <div
                        className={styles.preview}
                        style={{ backgroundImage: `url("${slide.image_url}")` }}
                        role="img"
                        aria-label={`${slide.title} preview`}
                      />
                    </td>
                    <td>
                      <strong>{slide.title}</strong>
                      <span>{slide.subtitle || "No subtitle"}</span>
                    </td>
                    <td>{slide.display_order}</td>
                    <td>
                      <span className={slide.is_active ? styles.activeStatus : styles.inactiveStatus}>
                        {slide.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      <Link className={styles.editButton} href={`/dashboard/hero-slides/${slide.id}/edit`}>
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className={styles.pagination}>
          <span>
            Showing {filteredSlides.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
            {" - "}
            {Math.min(currentPage * pageSize, filteredSlides.length)} of {filteredSlides.length}
          </span>
          <div>
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((page) => page - 1)}
              type="button"
            >
              Previous
            </button>
            <strong>Page {currentPage} of {totalPages}</strong>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((page) => page + 1)}
              type="button"
            >
              Next
            </button>
          </div>
        </div>
      </div>
      </section>
    </>
  );
}
