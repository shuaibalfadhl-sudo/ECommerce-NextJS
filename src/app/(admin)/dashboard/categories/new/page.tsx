"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import Toast from "@/components/ui/Toast";
import styles from "../../hero-slides/page.module.css";

export default function NewCategoryPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [isSlugEdited, setIsSlugEdited] = useState(false);
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => () => {
    if (imagePreview.startsWith("blob:")) URL.revokeObjectURL(imagePreview);
  }, [imagePreview]);

  function slugify(value: string) {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function updateName(value: string) {
    setName(value);
    if (!isSlugEdited) setSlug(slugify(value));
  }

  function selectImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    let imageUrl: string | null = null;
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
    const { error } = await supabase.from("categories").insert({
      name,
      slug: slug || slugify(name),
      description: description || null,
      is_active: isActive,
      image_url: imageUrl,
    });
    setIsSaving(false);
    if (error) {
      setToast({ message: error.message, type: "error" });
      return;
    }

    router.push("/dashboard/categories");
    router.refresh();
  }

  return (
    <>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      <section className={styles.page}>
        <div className={styles.intro}>
          <div><p className={styles.eyebrow}>STOREFRONT CONTENT</p><h2>Add category</h2><p className={styles.description}>Create a category for organizing storefront products.</p></div>
          <div className={styles.introActions}><Link className={styles.backLink} href="/dashboard/categories">← Back to categories</Link><span className={styles.tableBadge}>categories</span></div>
        </div>
        <form className={styles.card} onSubmit={handleSubmit}>
          <div className={styles.cardHeader}><div><h3>Category details</h3><p>Enter the name and visibility for this category.</p></div><span className={styles.required}>* Required</span></div>
          <div className={styles.mediaFormLayout}>
            <div className={styles.mediaPanel}>
              <span>Category image</span>
              <label className={styles.mediaUpload}>
                <input className={styles.fileInput} type="file" accept="image/*" onChange={selectImage} />
                {imagePreview ? <img src={imagePreview} alt="Category preview" /> : <small>Click to upload a category image</small>}
              </label>
            </div>
            <div className={styles.formGrid}>
              <label><span className={styles.labelText}>Category name <em>*</em></span><input value={name} onChange={(event) => updateName(event.target.value)} placeholder="Fresh vegetables" required /></label>
              <label><span className={styles.labelText}>Slug <em>*</em></span><input value={slug} onChange={(event) => { setSlug(slugify(event.target.value)); setIsSlugEdited(true); }} placeholder="fresh-vegetables" required /></label>
              <label className={styles.fullWidth}><span className={styles.labelText}>Description</span><input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Optional category description" /></label>
              <label className={styles.activeField}><input type="checkbox" checked={isActive} onChange={(event) => setIsActive(event.target.checked)} /> Active category</label>
            </div>
          </div>
          <div className={styles.actions}><button className={styles.submit} disabled={isSaving} type="submit">{isSaving ? "Saving..." : "Save category"}</button></div>
        </form>
      </section>
    </>
  );
}
