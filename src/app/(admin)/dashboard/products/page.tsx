"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { supabase } from "@/lib/supabase/client";
import Toast from "@/components/ui/Toast";
import styles from "../hero-slides/page.module.css";

type Product = {
  id: string;
  product_name: string;
  description: string | null;
  price: number;
  stock_quantity: number;
  thumbnail_url: string | null;
  is_active: boolean;
};

export default function ProductsAdminPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const pageSize = 5;
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [previewImage, setPreviewImage] = useState("");

  useEffect(() => {
    async function loadProducts() {
      const { data, error } = await supabase.from("products").select("id, product_name, description, price, stock_quantity, thumbnail_url, is_active").order("product_name", { ascending: true });
      if (error) setToast({ message: error.message, type: "error" });
      else setProducts((data ?? []) as Product[]);
      setIsLoading(false);
    }
    void loadProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return products.filter((product) =>
      (!query || product.product_name.toLowerCase().includes(query) || (product.description ?? "").toLowerCase().includes(query)) &&
      (status === "all" || (status === "active" ? product.is_active : !product.is_active)),
    );
  }, [products, search, status]);
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const visibleProducts = filteredProducts.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      <section className={styles.page}>
        <div className={styles.intro}>
          <div><p className={styles.eyebrow}>STOREFRONT CONTENT</p><h2>Products</h2><p className={styles.description}>Manage the products available in your storefront.</p></div>
          <div className={styles.introActions}><span className={styles.tableBadge}>products</span><Link className={styles.addButton} href="/dashboard/products/new"><span>+</span> Add Product</Link></div>
        </div>
        <div className={styles.tableCard}>
          <div className={styles.tableHeader}><div><h3>Registered products</h3><p>{products.length} product{products.length === 1 ? "" : "s"} registered</p></div><div className={styles.tableControls}><label className={styles.searchField}><span>⌕</span><input type="search" value={search} onChange={(event) => { setSearch(event.target.value); setCurrentPage(1); }} placeholder="Search products" aria-label="Search products" /></label><select value={status} onChange={(event) => { setStatus(event.target.value); setCurrentPage(1); }} aria-label="Filter products by status"><option value="all">All status</option><option value="active">Active</option><option value="inactive">Inactive</option></select></div></div>
          <div className={styles.tableWrapper}><table><thead><tr><th>Thumbnail</th><th>Product</th><th>Price</th><th>Stock</th><th>Status</th><th>Action</th></tr></thead><tbody>
            {isLoading ? <tr><td className={styles.tableState} colSpan={6}>Loading products...</td></tr> : filteredProducts.length === 0 ? <tr><td className={styles.tableState} colSpan={6}>{products.length === 0 ? 'No products registered yet. Click "Add Product" to create the first one.' : "No products match the search."}</td></tr> : visibleProducts.map((product) => <tr key={product.id}><td>{product.thumbnail_url ? <button className={styles.imagePreviewButton} type="button" onClick={() => setPreviewImage(product.thumbnail_url ?? "")}><img className={styles.tableImage} src={product.thumbnail_url} alt={`${product.product_name} thumbnail`} /></button> : <span className={styles.noImage}>No image</span>}</td><td><strong>{product.product_name}</strong><span>{product.description || "No description"}</span></td><td>{Number(product.price).toFixed(2)}</td><td>{product.stock_quantity}</td><td><span className={product.is_active ? styles.activeStatus : styles.inactiveStatus}>{product.is_active ? "Active" : "Inactive"}</span></td><td><Link className={styles.editButton} href={`/dashboard/products/${product.id}/edit`}>Edit</Link></td></tr>)}
          </tbody></table></div>
          <div className={styles.pagination}><span>Showing {filteredProducts.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, filteredProducts.length)} of {filteredProducts.length}</span><div><button type="button" disabled={currentPage === 1} onClick={() => setCurrentPage((page) => page - 1)}>Previous</button><strong>Page {currentPage} of {totalPages}</strong><button type="button" disabled={currentPage === totalPages} onClick={() => setCurrentPage((page) => page + 1)}>Next</button></div></div>
        </div>
      </section>
      {previewImage && typeof document !== "undefined" && createPortal(
        <div className={styles.previewModalBackdrop} role="presentation" onClick={() => setPreviewImage("")}>
          <div className={styles.previewModal} role="dialog" aria-modal="true" aria-label="Product image preview" onClick={(event) => event.stopPropagation()}>
            <button className={styles.previewClose} type="button" onClick={() => setPreviewImage("")} aria-label="Close image preview">×</button>
            <img src={previewImage} alt="Product full-size preview" />
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
