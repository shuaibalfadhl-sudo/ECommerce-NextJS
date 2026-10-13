"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import Toast from "@/components/ui/Toast";
import styles from "../../../hero-slides/page.module.css";

export default function EditCategoryPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [form, setForm] = useState({ name: "", slug: "", description: "", isActive: true, imageUrl: "" });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    async function loadCategory() {
      const { data, error } = await supabase.from("categories").select("name, slug, description, is_active, image_url").eq("id", id).single();
      if (error) setToast({ message: error.message, type: "error" });
      else if (data) {
        setForm({ name: data.name, slug: data.slug, description: data.description ?? "", isActive: data.is_active, imageUrl: data.image_url ?? "" });
        setImagePreview(data.image_url ?? "");
      }
      setIsLoading(false);
    }
    void loadCategory();
  }, [id]);

  function selectImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    let imageUrl = form.imageUrl || null;
    if (imageFile) {
      const path = `categories/${crypto.randomUUID()}-${imageFile.name}`;
      const upload = await supabase.storage.from("categories").upload(path, imageFile, { upsert: false, cacheControl: "3600" });
      if (upload.error) {
        setToast({ message: upload.error.message, type: "error" });
        setIsSaving(false);
        return;
      }
      imageUrl = supabase.storage.from("categories").getPublicUrl(path).data.publicUrl;
    }
    const { error } = await supabase.from("categories").update({ name: form.name, slug: form.slug, description: form.description || null, is_active: form.isActive, image_url: imageUrl }).eq("id", id);
    setIsSaving(false);
    if (error) {
      setToast({ message: error.message, type: "error" });
      return;
    }

    router.push("/dashboard/categories");
    router.refresh();
  }

  if (isLoading) return <section className={styles.page}><p className={styles.tableState}>Loading category...</p></section>;

  return (
    <>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      <section className={styles.page}>
        <div className={styles.intro}><div><p className={styles.eyebrow}>STOREFRONT CONTENT</p><h2>Edit category</h2><p className={styles.description}>Update this storefront category.</p></div><div className={styles.introActions}><Link className={styles.backLink} href="/dashboard/categories">← Back to categories</Link><span className={styles.tableBadge}>categories</span></div></div>
        <form className={styles.card} onSubmit={handleSubmit}>
          <div className={styles.cardHeader}><div><h3>Category details</h3><p>Update the name, slug, description, or visibility.</p></div></div>
          <div className={styles.mediaFormLayout}>
            <div className={styles.mediaPanel}>
              <span>Category image</span>
              <label className={styles.mediaUpload}>
                <input className={styles.fileInput} type="file" accept="image/*" onChange={selectImage} />
                {imagePreview ? <img src={imagePreview} alt="Category preview" /> : <small>Click to upload a category image</small>}
              </label>
            </div>
            <div className={styles.formGrid}>
              <label><span className={styles.labelText}>Category name <em>*</em></span><input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></label>
              <label><span className={styles.labelText}>Slug <em>*</em></span><input value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") })} required /></label>
              <label className={styles.fullWidth}><span className={styles.labelText}>Description</span><input value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
              <label className={styles.activeField}><input type="checkbox" checked={form.isActive} onChange={(event) => setForm({ ...form, isActive: event.target.checked })} /> Active category</label>
            </div>
          </div>
          <div className={styles.actions}><button className={styles.submit} disabled={isSaving} type="submit">{isSaving ? "Saving..." : "Update category"}</button></div>
        </form>
      </section>
    </>
  );
}
