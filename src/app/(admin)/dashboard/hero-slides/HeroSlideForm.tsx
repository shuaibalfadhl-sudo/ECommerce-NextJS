"use client";

import { DragEvent, FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import Toast from "@/components/ui/Toast";
import styles from "./page.module.css";

type FormState = {
  title: string;
  subtitle: string;
  imageFile: File | null;
  displayOrder: string;
  isActive: boolean;
};

type ExistingSlide = {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string;
  display_order: number;
  is_active: boolean;
};

const initialForm: FormState = {
  title: "",
  subtitle: "",
  imageFile: null,
  displayOrder: "0",
  isActive: true,
};

export default function HeroSlideForm({ initialSlide }: { initialSlide?: ExistingSlide }) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>({
    title: initialSlide?.title ?? "",
    subtitle: initialSlide?.subtitle ?? "",
    imageFile: null,
    displayOrder: String(initialSlide?.display_order ?? 0),
    isActive: initialSlide?.is_active ?? true,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(initialSlide?.image_url ?? "");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    if (!form.imageFile) {
      setImagePreviewUrl(initialSlide?.image_url ?? "");
      return;
    }

    const previewUrl = URL.createObjectURL(form.imageFile);
    setImagePreviewUrl(previewUrl);

    return () => URL.revokeObjectURL(previewUrl);
  }, [form.imageFile]);

  function updateField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function selectImage(file: File | null) {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setToast({ message: "Please select an image file.", type: "error" });
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setToast({ message: "Image must be smaller than 15MB.", type: "error" });
      return;
    }

    setToast(null);
    updateField("imageFile", file);
  }

  function handleImageDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    selectImage(event.dataTransfer.files[0] ?? null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setToast(null);
    setIsSaving(true);

    if (!form.imageFile) {
      if (!initialSlide) {
        setToast({ message: "Please select a hero slide image.", type: "error" });
        setIsSaving(false);
        return;
      }
    }

    let imageUrl = initialSlide?.image_url ?? "";
    let uploadedFilePath = "";
    if (form.imageFile) {
      const fileExtension = form.imageFile.name.split(".").pop() || "jpg";
      uploadedFilePath = `slides/${crypto.randomUUID()}.${fileExtension}`;
      const { error: uploadError } = await supabase.storage
        .from("hero-slides")
        .upload(uploadedFilePath, form.imageFile, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        setToast({ message: uploadError.message, type: "error" });
        setIsSaving(false);
        return;
      }
      imageUrl = supabase.storage.from("hero-slides").getPublicUrl(uploadedFilePath).data.publicUrl;
    }

    const values = {
      title: form.title,
      subtitle: form.subtitle || null,
      image_url: imageUrl,
      display_order: Number(form.displayOrder) || 0,
      is_active: form.isActive,
    };
    const { error: saveError } = initialSlide
      ? await supabase.from("hero_slides").update(values).eq("id", initialSlide.id)
      : await supabase.from("hero_slides").insert(values);

    setIsSaving(false);

    if (saveError) {
      if (uploadedFilePath) await supabase.storage.from("hero-slides").remove([uploadedFilePath]);
      setToast({ message: saveError.message, type: "error" });
      return;
    }

    router.push("/dashboard/hero-slides");
    router.refresh();
  }

  return (
    <>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      <form className={styles.card} onSubmit={handleSubmit}>
      <div className={styles.cardHeader}>
        <div>
          <h3>{initialSlide ? "Edit slide details" : "Slide details"}</h3>
          <p>Enter the content and display settings for this promotional slide.</p>
        </div>
        <span className={styles.required}>* Required</span>
      </div>

      <div className={styles.formGrid}>
        <label>
          <span className={styles.labelText}>Slide title <em>*</em></span>
          <input type="text" value={form.title} onChange={(event) => updateField("title", event.target.value)} placeholder="From our fields to your doorstep" required />
        </label>
        <label>
          <span className={styles.labelText}>Subtitle</span>
          <input type="text" value={form.subtitle} onChange={(event) => updateField("subtitle", event.target.value)} placeholder="Freshness you can track" />
        </label>
        <div className={`${styles.fullWidth} ${styles.formField}`}>
          <span className={styles.labelText}>Hero image {!initialSlide && <em>*</em>}</span>
          <div className={styles.uploadBox}>
            <input
              id="hero-image"
              className={styles.fileInput}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => selectImage(event.target.files?.[0] ?? null)}
            />
            <label
              className={styles.dropzone}
              htmlFor="hero-image"
              onDragOver={(event) => event.preventDefault()}
              onDrop={handleImageDrop}
            >
              {imagePreviewUrl ? (
                <img className={styles.imagePreview} src={imagePreviewUrl} alt="Selected hero slide preview" />
              ) : (
                <>
                  <span className={styles.uploadIcon}>↥</span>
                  <strong>Drag &amp; drop your image here or</strong>
                  <span className={styles.browseButton}>Browse Files</span>
                  <small>Supported formats: JPG, PNG, WEBP (Max 15MB)</small>
                </>
              )}
            </label>
            {form.imageFile && imagePreviewUrl && (
              <div className={styles.fileDetails}>
                <span>{form.imageFile.name} ({(form.imageFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                <button type="button" onClick={() => window.open(imagePreviewUrl, "_blank", "noopener,noreferrer")}>
                  View
                </button>
              </div>
            )}
          </div>
        </div>
        <label>
          <span className={styles.labelText}>Display order</span>
          <input type="number" min="0" value={form.displayOrder} onChange={(event) => updateField("displayOrder", event.target.value)} />
        </label>
        <label className={styles.activeField}>
          <input type="checkbox" checked={form.isActive} onChange={(event) => updateField("isActive", event.target.checked)} />
          Active slide
        </label>
      </div>

      <div className={styles.actions}>
        <button className={styles.submit} disabled={isSaving} type="submit">
          {isSaving ? "Saving..." : initialSlide ? "Update hero slide" : "Save hero slide"}
        </button>
      </div>
      </form>
    </>
  );
}
