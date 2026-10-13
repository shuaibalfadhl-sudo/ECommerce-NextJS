"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import Toast from "@/components/ui/Toast";
import styles from "../../../hero-slides/page.module.css";

type Category = { id: string; name: string };

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState({ product_name: "", description: "", price: "", stock_quantity: "0", categoryId: "", isActive: true, thumbnailUrl: "", galleryUrls: [] as string[] });
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState("");
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    async function loadData() {
      const [productResult, categoryResult] = await Promise.all([
        supabase.from("products").select("product_name, description, price, stock_quantity, category_id, is_active, thumbnail_url, gallery_urls").eq("id", id).single(),
        supabase.from("categories").select("id, name").eq("is_active", true).order("name"),
      ]);
      if (productResult.error) setToast({ message: productResult.error.message, type: "error" });
      else if (productResult.data) {
        const galleryUrls = Array.isArray(productResult.data.gallery_urls) ? productResult.data.gallery_urls : [];
        setForm({ product_name: productResult.data.product_name, description: productResult.data.description ?? "", price: String(productResult.data.price), stock_quantity: String(productResult.data.stock_quantity), categoryId: productResult.data.category_id ?? "", isActive: productResult.data.is_active, thumbnailUrl: productResult.data.thumbnail_url ?? "", galleryUrls });
        setThumbnailPreview(productResult.data.thumbnail_url ?? "");
        setGalleryPreviews(galleryUrls);
      }
      if (categoryResult.error) setToast({ message: categoryResult.error.message, type: "error" });
      else setCategories((categoryResult.data ?? []) as Category[]);
      setIsLoading(false);
    }
    void loadData();
  }, [id]);

  function selectThumbnail(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    setThumbnailFile(file);
    setThumbnailPreview(URL.createObjectURL(file));
  }

  function selectGallery(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []).filter((file) => file.type.startsWith("image/"));
    setGalleryFiles(files);
    setGalleryPreviews((current) => [...current, ...files.map((file) => URL.createObjectURL(file))]);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    let thumbnailUrl = form.thumbnailUrl || null;
    const galleryUrls = [...form.galleryUrls];
    try {
      if (thumbnailFile) {
        const path = `thumbnails/${crypto.randomUUID()}-${thumbnailFile.name}`;
        const upload = await supabase.storage.from("product-thumbnails").upload(path, thumbnailFile, { upsert: false, cacheControl: "3600" });
        if (upload.error) throw new Error(upload.error.message);
        thumbnailUrl = supabase.storage.from("product-thumbnails").getPublicUrl(path).data.publicUrl;
      }
      for (const file of galleryFiles) {
        const path = `gallery/${crypto.randomUUID()}-${file.name}`;
        const upload = await supabase.storage.from("product-gallery").upload(path, file, { upsert: false, cacheControl: "3600" });
        if (upload.error) throw new Error(upload.error.message);
        galleryUrls.push(supabase.storage.from("product-gallery").getPublicUrl(path).data.publicUrl);
      }
    } catch (error) {
      setToast({ message: error instanceof Error ? error.message : "Unable to upload product images.", type: "error" });
      setIsSaving(false);
      return;
    }
    const { error } = await supabase.from("products").update({ product_name: form.product_name, description: form.description || null, price: Number(form.price), stock_quantity: Number(form.stock_quantity) || 0, category_id: form.categoryId || null, is_active: form.isActive, thumbnail_url: thumbnailUrl, gallery_urls: galleryUrls }).eq("id", id);
    setIsSaving(false);
    if (error) {
      setToast({ message: error.message, type: "error" });
      return;
    }

    router.push("/dashboard/products");
    router.refresh();
  }

  if (isLoading) return <section className={styles.page}><p className={styles.tableState}>Loading product...</p></section>;

  return (
    <>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      <section className={styles.page}>
        <div className={styles.intro}><div><p className={styles.eyebrow}>STOREFRONT CONTENT</p><h2>Edit product</h2><p className={styles.description}>Update this storefront product.</p></div><div className={styles.introActions}><Link className={styles.backLink} href="/dashboard/products">← Back to products</Link><span className={styles.tableBadge}>products</span></div></div>
        <form className={styles.card} onSubmit={handleSubmit}>
          <div className={styles.cardHeader}><div><h3>Product details</h3><p>Update product information, inventory, or visibility.</p></div></div>
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
                <small>Click to add gallery images</small>
              </label>
              {galleryPreviews.length > 0 && <div className={styles.mediaPreviews}>{galleryPreviews.map((preview) => <img key={preview} src={preview} alt="Gallery preview" />)}</div>}
            </div>
            <div className={styles.formGrid}>
            <label><span className={styles.labelText}>Product name <em>*</em></span><input value={form.product_name} onChange={(event) => setForm({ ...form, product_name: event.target.value })} required /></label>
            <label><span className={styles.labelText}>Category</span><select value={form.categoryId} onChange={(event) => setForm({ ...form, categoryId: event.target.value })}><option value="">No category</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
            <label><span className={styles.labelText}>Price <em>*</em></span><input type="number" min="0" step="0.01" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} required /></label>
            <label><span className={styles.labelText}>Stock quantity</span><input type="number" min="0" value={form.stock_quantity} onChange={(event) => setForm({ ...form, stock_quantity: event.target.value })} /></label>
            <label className={styles.fullWidth}><span className={styles.labelText}>Description</span><textarea rows={3} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
            <label className={styles.activeField}><input type="checkbox" checked={form.isActive} onChange={(event) => setForm({ ...form, isActive: event.target.checked })} /> Active product</label>
            </div>
          </div>
          <div className={styles.actions}><button className={styles.submit} disabled={isSaving} type="submit">{isSaving ? "Saving..." : "Update product"}</button></div>
        </form>
      </section>
    </>
  );
}
