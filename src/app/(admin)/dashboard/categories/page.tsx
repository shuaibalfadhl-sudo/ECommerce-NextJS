"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { supabase } from "@/lib/supabase/client";
import Toast from "@/components/ui/Toast";
import styles from "../hero-slides/page.module.css";

type Category = {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  is_active: boolean;
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const pageSize = 5;
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [previewImage, setPreviewImage] = useState("");

  useEffect(() => {
    async function loadCategories() {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, description, image_url, is_active")
        .order("name", { ascending: true });

      if (error) setToast({ message: error.message, type: "error" });
      else setCategories((data ?? []) as Category[]);
      setIsLoading(false);
    }

    void loadCategories();
  }, []);

  const filteredCategories = useMemo(() => {
    const query = search.trim().toLowerCase();
    return categories.filter((category) =>
      !query ||
      category.name.toLowerCase().includes(query) ||
      (category.description ?? "").toLowerCase().includes(query),
    ).filter((category) =>
      status === "all" || (status === "active" ? category.is_active : !category.is_active),
    );
  }, [categories, search, status]);
  const totalPages = Math.max(1, Math.ceil(filteredCategories.length / pageSize));
  const visibleCategories = filteredCategories.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      <section className={styles.page}>
        <div className={styles.intro}>
          <div>
            <p className={styles.eyebrow}>STOREFRONT CONTENT</p>
            <h2>Categories</h2>
            <p className={styles.description}>Organize your products into storefront categories.</p>
          </div>
          <div className={styles.introActions}>
            <span className={styles.tableBadge}>categories</span>
            <Link className={styles.addButton} href="/dashboard/categories/new"><span>+</span> Add Category</Link>
          </div>
        </div>
        <div className={styles.tableCard}>
          <div className={styles.tableHeader}>
            <div>
              <h3>Registered categories</h3>
              <p>{categories.length} categor{categories.length === 1 ? "y" : "ies"} registered</p>
            </div>
            <div className={styles.tableControls}>
              <label className={styles.searchField}>
                <span>⌕</span>
                <input type="search" value={search} onChange={(event) => { setSearch(event.target.value); setCurrentPage(1); }} placeholder="Search categories" aria-label="Search categories" />
              </label>
              <select value={status} onChange={(event) => { setStatus(event.target.value); setCurrentPage(1); }} aria-label="Filter categories by status">
                <option value="all">All status</option><option value="active">Active</option><option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          <div className={styles.tableWrapper}>
            <table>
              <thead><tr><th>Image</th><th>Name</th><th>Description</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>
                {isLoading ? (
                  <tr><td className={styles.tableState} colSpan={5}>Loading categories...</td></tr>
                ) : filteredCategories.length === 0 ? (
                  <tr><td className={styles.tableState} colSpan={5}>{categories.length === 0 ? 'No categories registered yet. Click "Add Category" to create the first one.' : "No categories match the search."}</td></tr>
                ) : visibleCategories.map((category) => (
                  <tr key={category.id}>
                    <td>{category.image_url ? <button className={styles.imagePreviewButton} type="button" onClick={() => setPreviewImage(category.image_url ?? "")}><img className={styles.tableImage} src={category.image_url} alt={`${category.name} preview`} /></button> : <span className={styles.noImage}>No image</span>}</td>
                    <td><strong>{category.name}</strong></td>
                    <td>{category.description || "No description"}</td>
                    <td><span className={category.is_active ? styles.activeStatus : styles.inactiveStatus}>{category.is_active ? "Active" : "Inactive"}</span></td>
                    <td><Link className={styles.editButton} href={`/dashboard/categories/${category.id}/edit`}>Edit</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className={styles.pagination}>
            <span>Showing {filteredCategories.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, filteredCategories.length)} of {filteredCategories.length}</span>
            <div><button type="button" disabled={currentPage === 1} onClick={() => setCurrentPage((page) => page - 1)}>Previous</button><strong>Page {currentPage} of {totalPages}</strong><button type="button" disabled={currentPage === totalPages} onClick={() => setCurrentPage((page) => page + 1)}>Next</button></div>
          </div>
        </div>
      </section>
      {previewImage && typeof document !== "undefined" && createPortal(
        <div className={styles.previewModalBackdrop} role="presentation" onClick={() => setPreviewImage("")}>
          <div className={styles.previewModal} role="dialog" aria-modal="true" aria-label="Category image preview" onClick={(event) => event.stopPropagation()}>
            <button className={styles.previewClose} type="button" onClick={() => setPreviewImage("")} aria-label="Close image preview">×</button>
            <img src={previewImage} alt="Category full-size preview" />
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
