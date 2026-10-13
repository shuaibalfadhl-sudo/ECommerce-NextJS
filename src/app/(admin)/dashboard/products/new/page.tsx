"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import Toast from "@/components/ui/Toast";
import styles from "../../hero-slides/page.module.css";

type Category = { id: string; name: string };

export default function NewProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [categorySearch, setCategorySearch] = useState("");
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState("");
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
  const [form, setForm] = useState({ product_name: "", description: "", price: "", stock_quantity: "0", categoryId: "", isActive: true });
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => () => {
    [...galleryPreviews, thumbnailPreview].filter((url) => url.startsWith("blob:")).forEach((url) => URL.revokeObjectURL(url));
  }, [galleryPreviews, thumbnailPreview]);

  useEffect(() => {
    async function loadCategories() {
      const { data, error } = await supabase.from("categories").select("id, name").eq("is_active", true).order("name");
      if (error) setToast({ message: error.message, type: "error" });
      else setCategories((data ?? []) as Category[]);
    }
    void loadCategories();
  }, []);

  function updateField(field: keyof typeof form, value: string | boolean) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  const filteredCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(categorySearch.trim().toLowerCase()),
  );
  const selectedCategory = categories.find((category) => category.id === form.categoryId);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    const uploadImages = async (files: File[], folder: string) => {
      const urls: string[] = [];
      for (const file of files) {
        const path = `${folder}/${crypto.randomUUID()}-${file.name}`;
        const bucket = folder === "thumbnails" ? "product-thumbnails" : "product-gallery";
        const upload = await supabase.storage.from(bucket).upload(path, file, { upsert: false, cacheControl: "3600" });
        if (upload.error) throw new Error(upload.error.message);
        urls.push(supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl);
      }
      return urls;
    };

    try {
      const [thumbnailUrls, galleryUrls] = await Promise.all([
        uploadImages(thumbnailFile ? [thumbnailFile] : [], "thumbnails"),
        uploadImages(galleryFiles, "gallery"),
      ]);
      const { error } = await supabase.from("products").insert({
        product_name: form.product_name,
        description: form.description || null,
        price: Number(form.price),
        stock_quantity: Number(form.stock_quantity) || 0,
        category_id: form.categoryId || null,
        is_active: form.isActive,
        thumbnail_url: thumbnailUrls[0] ?? null,
        gallery_urls: galleryUrls,
      });
      if (error) throw new Error(error.message);
    } catch (error) {
      setToast({ message: error instanceof Error ? error.message : "Unable to upload product images.", type: "error" });
      setIsSaving(false);
      return;
    }
    setIsSaving(false);
    router.push("/dashboard/products");
    router.refresh();
  }

  function selectThumbnail(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    setThumbnailFile(file);
    setThumbnailPreview(URL.createObjectURL(file));
  }

  function selectGallery(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []).filter((file) => file.type.startsWith("image/"));
    setGalleryFiles(files);
    setGalleryPreviews(files.map((file) => URL.createObjectURL(file)));
  }

  return (
    <>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      <section className={styles.page}>
        <div className={styles.intro}><div><p className={styles.eyebrow}>STOREFRONT CONTENT</p><h2>Add product</h2><p className={styles.description}>Create a product for your storefront catalog.</p></div><div className={styles.introActions}><Link className={styles.backLink} href="/dashboard/products">← Back to products</Link><span className={styles.tableBadge}>products</span></div></div>
        <form className={styles.card} onSubmit={handleSubmit}>
          <div className={styles.cardHeader}><div><h3>Product details</h3><p>Enter the product information and inventory details.</p></div><span className={styles.required}>* Required</span></div>
          <div className={styles.mediaFormLayout}>
            <div className={styles.mediaPanel}>
              <span>Thumbnail</span>
              <label className={styles.mediaUpload}>
                <input className={styles.fileInput} type="file" accept="image/*" onChange={selectThumbnail} />
                {thumbnailPreview ? <img src={thumbnailPreview} alt="Product thumbnail preview" /> : <small>Click to upload a thumbnail</small>}
              </label>
              <span>Gallery images</span>
              <label className={styles.mediaUpload}>
                <input className={styles.fileInput} type="file" accept="image/*" multiple onChange={selectGallery} />
                <small>Click to select multiple gallery images</small>
              </label>
              {galleryPreviews.length > 0 && <div className={styles.mediaPreviews}>{galleryPreviews.map((preview) => <img key={preview} src={preview} alt="Gallery preview" />)}</div>}
            </div>
            <div className={styles.formGrid}>
            <label><span className={styles.labelText}>Product name <em>*</em></span><input value={form.product_name} onChange={(event) => updateField("product_name", event.target.value)} placeholder="Fresh tomatoes" required /></label>
            <label className={styles.comboboxField}>
              <span className={styles.labelText}>Category</span>
              <div className={styles.comboboxInputWrapper}>
                <input
                  value={isCategoryMenuOpen ? categorySearch : selectedCategory?.name ?? ""}
                  onChange={(event) => {
                    setCategorySearch(event.target.value);
                    setIsCategoryMenuOpen(true);
                  }}
                  onFocus={() => {
                    setCategorySearch("");
                    setIsCategoryMenuOpen(true);
                  }}
                  placeholder="Search categories"
                  aria-label="Search categories"
                  aria-expanded={isCategoryMenuOpen}
                  role="combobox"
                />
                {isCategoryMenuOpen && (
                  <div className={styles.comboboxMenu} role="listbox">
                  <button
                    className={styles.comboboxOption}
                    type="button"
                    onClick={() => {
                      updateField("categoryId", "");
                      setCategorySearch("");
                      setIsCategoryMenuOpen(false);
                    }}
                  >
                    No category
                  </button>
                  {filteredCategories.length === 0 ? (
                    <span className={styles.comboboxEmpty}>No categories found</span>
                  ) : (
                    filteredCategories.map((category) => (
                      <button
                        className={styles.comboboxOption}
                        key={category.id}
                        type="button"
                        onClick={() => {
                          updateField("categoryId", category.id);
                          setCategorySearch("");
                          setIsCategoryMenuOpen(false);
                        }}
                      >
                        {category.name}
                      </button>
                    ))
                  )}
                  </div>
                )}
              </div>
            </label>
            <label><span className={styles.labelText}>Price <em>*</em></span><input type="number" min="0" step="0.01" value={form.price} onChange={(event) => updateField("price", event.target.value)} placeholder="0.00" required /></label>
            <label><span className={styles.labelText}>Stock quantity</span><input type="number" min="0" value={form.stock_quantity} onChange={(event) => updateField("stock_quantity", event.target.value)} /></label>
            <label className={styles.fullWidth}><span className={styles.labelText}>Description</span><textarea rows={3} value={form.description} onChange={(event) => updateField("description", event.target.value)} placeholder="Optional product description" /></label>
            <label className={styles.activeField}><input type="checkbox" checked={form.isActive} onChange={(event) => updateField("isActive", event.target.checked)} /> Active product</label>
            </div>
          </div>
          <div className={styles.actions}><button className={styles.submit} disabled={isSaving} type="submit">{isSaving ? "Saving..." : "Save product"}</button></div>
        </form>
      </section>
    </>
  );
}
