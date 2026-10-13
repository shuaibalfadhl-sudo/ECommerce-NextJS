"use client";

import { ChangeEvent, DragEvent, FormEvent, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import Toast from "@/components/ui/Toast";
import styles from "./page.module.css";

type Settings = {
  id?: string;
  siteName: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  supportEmail: string;
  contactNumber: string;
  tagline: string;
  description: string;
  secondaryLogoUrl: string;
  currency: string;
  key: string;
  value: string;
};

const emptySettings: Settings = {
  siteName: "",
  logoUrl: "",
  primaryColor: "#64748b",
  secondaryColor: "#182b44",
  supportEmail: "",
  contactNumber: "",
  tagline: "",
  description: "",
  secondaryLogoUrl: "",
  currency: "USD",
  key: "",
  value: "",
};

export default function SystemSettingsPage() {
  const [settings, setSettings] = useState<Settings>(emptySettings);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [secondaryLogoFile, setSecondaryLogoFile] = useState<File | null>(null);
  const [secondaryLogoPreview, setSecondaryLogoPreview] = useState("");
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [cropPreviewUrl, setCropPreviewUrl] = useState("");
  const [cropImageSize, setCropImageSize] = useState({ width: 1, height: 1 });
  const [cropZoom, setCropZoom] = useState(1);
  const [cropPosition, setCropPosition] = useState({ x: 0, y: 0 });
  const [isDraggingCrop, setIsDraggingCrop] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isCropping, setIsCropping] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    async function loadSettings() {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user) {
        setToast({ message: "You must be signed in to manage system settings.", type: "error" });
        setIsLoading(false);
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profile")
        .select("role")
        .eq("id", authData.user.id)
        .maybeSingle();

      if (profileError || profile?.role !== "admin") {
        setToast({ message: "Only administrators can manage system settings.", type: "error" });
        setIsLoading(false);
        return;
      }

      setIsAuthorized(true);
      const { data, error: loadError } = await supabase
        .from("system_settings")
        .select("id, site_name, logo_url, primary_color, secondary_color, support_email, contact_number, tagline, description, secondary_logo_url, currency, key, value")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (loadError) {
        setToast({ message: loadError.message, type: "error" });
      } else if (data) {
        setSettings({
          id: data.id,
          siteName: data.site_name,
          logoUrl: data.logo_url ?? "",
          primaryColor: data.primary_color ?? "#64748b",
          secondaryColor: data.secondary_color ?? "#182b44",
          supportEmail: data.support_email ?? "",
          contactNumber: data.contact_number ?? "",
          tagline: data.tagline ?? "",
          description: data.description ?? "",
          secondaryLogoUrl: data.secondary_logo_url ?? "",
          currency: data.currency ?? "USD",
          key: data.key ?? "",
          value: data.value ?? "",
        });
        setLogoPreview(data.logo_url ?? "");
        setSecondaryLogoPreview(data.secondary_logo_url ?? "");
      }
      setIsLoading(false);
    }

    void loadSettings();
  }, []);

  useEffect(() => {
    if (!logoFile) return;

    const previewUrl = URL.createObjectURL(logoFile);
    setLogoPreview(previewUrl);

    return () => URL.revokeObjectURL(previewUrl);
  }, [logoFile]);

  useEffect(() => {
    if (!secondaryLogoFile) return;

    const previewUrl = URL.createObjectURL(secondaryLogoFile);
    setSecondaryLogoPreview(previewUrl);

    return () => URL.revokeObjectURL(previewUrl);
  }, [secondaryLogoFile]);

  function updateField(field: keyof Settings, value: string) {
    setSettings((current) => ({ ...current, [field]: value }));
  }

  function handleLogoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    event.target.value = "";
    selectLogo(file);
  }

  function selectLogo(file: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setToast({ message: "Please select an image file for the logo.", type: "error" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setToast({ message: "Logo must be smaller than 5MB.", type: "error" });
      return;
    }
    setToast(null);
    if (cropPreviewUrl) URL.revokeObjectURL(cropPreviewUrl);
    setCropFile(file);
    setCropPreviewUrl(URL.createObjectURL(file));
    setCropZoom(1);
    setCropPosition({ x: 0, y: 0 });
    setIsCropping(true);
  }

  function selectSecondaryLogo(file: File | null) {
    if (!file) return;
    const supportedTypes = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];
    if (!supportedTypes.includes(file.type)) {
      setToast({ message: "Secondary logo must be a PNG, JPEG, WebP, or SVG image.", type: "error" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setToast({ message: "Secondary logo must be smaller than 5MB.", type: "error" });
      return;
    }
    setToast(null);
    setSecondaryLogoFile(file);
  }

  function handleSecondaryLogoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    event.target.value = "";
    selectSecondaryLogo(file);
  }

  function handleLogoDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    selectLogo(event.dataTransfer.files[0] ?? null);
  }

  function closeCropModal() {
    if (cropPreviewUrl) URL.revokeObjectURL(cropPreviewUrl);
    setCropFile(null);
    setCropPreviewUrl("");
    setIsCropping(false);
  }

  function handleCropImageLoad(event: React.SyntheticEvent<HTMLImageElement>) {
    setCropImageSize({
      width: event.currentTarget.naturalWidth,
      height: event.currentTarget.naturalHeight,
    });
  }

  function handleCropPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    setIsDraggingCrop(true);
    setDragStart({ x: event.clientX - cropPosition.x, y: event.clientY - cropPosition.y });
  }

  function handleCropPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!isDraggingCrop) return;
    const baseScale = 315 / Math.min(cropImageSize.width, cropImageSize.height);
    const displayedWidth = cropImageSize.width * baseScale * cropZoom;
    const displayedHeight = cropImageSize.height * baseScale * cropZoom;
    const maxX = Math.max(0, (displayedWidth - 315) / 2);
    const maxY = Math.max(0, (displayedHeight - 315) / 2);
    const nextX = event.clientX - dragStart.x;
    const nextY = event.clientY - dragStart.y;

    setCropPosition({
      x: Math.max(-maxX, Math.min(maxX, nextX)),
      y: Math.max(-maxY, Math.min(maxY, nextY)),
    });
  }

  function handleCropPointerUp(event: React.PointerEvent<HTMLDivElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setIsDraggingCrop(false);
  }

  function cropLogo() {
    if (!cropFile || !cropPreviewUrl) return;

    const image = new Image();
    image.onload = () => {
      const cropSize = 315;
      const baseScale = Math.max(cropSize / image.width, cropSize / image.height);
      const sourceSize = cropSize / (baseScale * cropZoom);
      const sourceX = (image.width - sourceSize) / 2 - cropPosition.x / (baseScale * cropZoom);
      const sourceY = (image.height - sourceSize) / 2 - cropPosition.y / (baseScale * cropZoom);
      const canvas = document.createElement("canvas");
      const outputSize = Math.min(1600, Math.round(sourceSize));

      canvas.width = outputSize;
      canvas.height = outputSize;
      const context = canvas.getContext("2d");

      if (!context) {
        setToast({ message: "Unable to prepare the cropped logo.", type: "error" });
        return;
      }

      context.beginPath();
      context.arc(outputSize / 2, outputSize / 2, outputSize / 2, 0, Math.PI * 2);
      context.clip();
      context.drawImage(image, sourceX, sourceY, sourceSize, sourceSize, 0, 0, outputSize, outputSize);

      canvas.toBlob((blob) => {
        if (!blob) {
          setToast({ message: "Unable to create the cropped logo.", type: "error" });
          return;
        }

        const croppedFile = new File([blob], `logo-${Date.now()}.png`, { type: "image/png" });
        setLogoFile(croppedFile);
        closeCropModal();
      }, "image/png");
    };
    image.onerror = () => {
      setToast({ message: "Unable to read this image for cropping.", type: "error" });
    };
    image.src = cropPreviewUrl;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isAuthorized) {
      setToast({ message: "Only administrators can manage system settings.", type: "error" });
      return;
    }
    setIsSaving(true);
    setToast(null);

    let logoUrl = settings.logoUrl || null;
    let uploadedPath = "";
    let secondaryLogoUrl = settings.secondaryLogoUrl || null;
    let secondaryUploadedPath = "";

    if (logoFile) {
      const extension = logoFile.name.split(".").pop() || "png";
      uploadedPath = `system/logo-${crypto.randomUUID()}.${extension}`;
      const { error: uploadError } = await supabase.storage
        .from("system-assets")
        .upload(uploadedPath, logoFile, { cacheControl: "3600", upsert: true });

      if (uploadError) {
        setToast({ message: uploadError.message, type: "error" });
        setIsSaving(false);
        return;
      }
      logoUrl = supabase.storage.from("system-assets").getPublicUrl(uploadedPath).data.publicUrl;
    }

    if (secondaryLogoFile) {
      const extension = secondaryLogoFile.name.split(".").pop()?.toLowerCase() || "png";
      secondaryUploadedPath = `secondary/${crypto.randomUUID()}.${extension}`;
      const { error: uploadError } = await supabase.storage
        .from("secondary-logos")
        .upload(secondaryUploadedPath, secondaryLogoFile, { cacheControl: "3600", upsert: false });

      if (uploadError) {
        if (uploadedPath) await supabase.storage.from("system-assets").remove([uploadedPath]);
        setToast({ message: `Unable to upload secondary logo: ${uploadError.message}`, type: "error" });
        setIsSaving(false);
        return;
      }
      secondaryLogoUrl = supabase.storage.from("secondary-logos").getPublicUrl(secondaryUploadedPath).data.publicUrl;
    }

    const values = {
      site_name: settings.siteName,
      logo_url: logoUrl,
      primary_color: settings.primaryColor || null,
      secondary_color: settings.secondaryColor || null,
      support_email: settings.supportEmail || null,
      contact_number: settings.contactNumber || null,
      tagline: settings.tagline || null,
      description: settings.description || null,
      secondary_logo_url: secondaryLogoUrl,
      currency: settings.currency || "USD",
      key: settings.key || null,
      value: settings.value || null,
    };

    const result = settings.id
      ? await supabase.from("system_settings").update(values).eq("id", settings.id).select("id").single()
      : await supabase.from("system_settings").insert(values).select("id").single();

    if (result.error) {
      if (uploadedPath) await supabase.storage.from("system-assets").remove([uploadedPath]);
      if (secondaryUploadedPath) await supabase.storage.from("secondary-logos").remove([secondaryUploadedPath]);
      setToast({ message: result.error.message, type: "error" });
      setIsSaving(false);
      return;
    }

    setSettings((current) => ({ ...current, id: result.data.id, logoUrl: logoUrl ?? "", secondaryLogoUrl: secondaryLogoUrl ?? "" }));
    setLogoPreview(logoUrl ?? "");
    setSecondaryLogoPreview(secondaryLogoUrl ?? "");
    setLogoFile(null);
    setSecondaryLogoFile(null);
    setToast({ message: "System details saved successfully.", type: "success" });
    setIsSaving(false);
  }

  if (isLoading) {
    return <section className={styles.page}><p className={styles.loading}>Loading system details...</p></section>;
  }

  if (!isAuthorized) {
    return (
      <>
        {toast && <Toast {...toast} onClose={() => setToast(null)} />}
        <section className={styles.page}><p className={styles.loading}>Only administrators can manage system settings.</p></section>
      </>
    );
  }

  return (
    <>
    {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    <section
      className={styles.page}
      style={{ "--primary-color": settings.primaryColor } as React.CSSProperties}
    >
      <div className={styles.intro}>
        <div>
          <p className={styles.eyebrow}>SYSTEM CONFIGURATION</p>
          <h2>System details</h2>
          <p className={styles.description}>Manage the identity and default settings used across the storefront.</p>
        </div>
        <span className={styles.tableBadge}>system_settings</span>
      </div>

      <form className={styles.card} onSubmit={handleSubmit}>
        <div className={styles.cardHeader}>
          <div>
            <h3>Store information</h3>
            <p>These settings are shared by the storefront and admin system.</p>
          </div>
          <span className={styles.required}>* Required</span>
        </div>

        <div className={styles.formGrid}>
          <label>
            <span>Site name <em>*</em></span>
            <input value={settings.siteName} onChange={(event) => updateField("siteName", event.target.value)} placeholder="Enter site name" required />
          </label>
          <label>
            <span>Support email</span>
            <input type="email" value={settings.supportEmail} onChange={(event) => updateField("supportEmail", event.target.value)} placeholder="support@example.com" />
          </label>
          <label>
            <span>Contact number</span>
            <input value={settings.contactNumber} onChange={(event) => updateField("contactNumber", event.target.value)} placeholder="+63 912 345 6789" />
          </label>
          <label>
            <span>Tagline</span>
            <input value={settings.tagline} onChange={(event) => updateField("tagline", event.target.value)} placeholder="Your store tagline" />
          </label>
          <label className={styles.fullWidth}>
            <span>Description</span>
            <textarea rows={4} value={settings.description} onChange={(event) => updateField("description", event.target.value)} placeholder="Describe your store or organization" />
          </label>
          <div className={`${styles.fullWidth} ${styles.logoRow}`}>
            <label>
              <span>Logo image</span>
              <div className={styles.uploadBox}>
              <input
                id="site-logo"
                className={styles.fileInput}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/svg+xml"
                onChange={handleLogoChange}
              />
              <label
                className={styles.dropzone}
                htmlFor="site-logo"
                onDragOver={(event) => event.preventDefault()}
                onDrop={handleLogoDrop}
              >
                {logoPreview ? (
                  <img className={styles.logoPreview} src={logoPreview} alt="Site logo preview" />
                ) : (
                  <>
                    <span className={styles.uploadIcon}>↥</span>
                    <strong>Drag &amp; drop your logo here or</strong>
                    <span className={styles.browseButton}>Browse Files</span>
                    <small>Supported formats: JPG, PNG, WEBP, SVG (Max 5MB)</small>
                  </>
                )}
                </label>
                {logoFile && logoPreview && (
                  <div className={styles.fileDetails}>
                    <span>{logoFile.name} ({(logoFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                    <button type="button" onClick={() => window.open(logoPreview, "_blank", "noopener,noreferrer")}>View</button>
                  </div>
                )}
              </div>
            </label>
            <label>
              <span>Secondary logo</span>
              <div className={styles.uploadBox}>
              <input
                id="secondary-logo"
                className={styles.fileInput}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                onChange={handleSecondaryLogoChange}
              />
              <label className={styles.dropzone} htmlFor="secondary-logo">
                {secondaryLogoPreview ? (
                  <img className={styles.logoPreview} src={secondaryLogoPreview} alt="Secondary logo preview" />
                ) : (
                  <>
                    <span className={styles.uploadIcon}>↥</span>
                    <strong>Upload your secondary logo</strong>
                    <span className={styles.browseButton}>Browse Files</span>
                    <small>Supported formats: PNG, JPEG, WEBP, SVG (Max 5MB)</small>
                  </>
                )}
                </label>
                {secondaryLogoFile && (
                  <div className={styles.fileDetails}>
                    <span>{secondaryLogoFile.name} ({(secondaryLogoFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                    <button type="button" onClick={() => window.open(secondaryLogoPreview, "_blank", "noopener,noreferrer")}>View</button>
                  </div>
                )}
              </div>
            </label>
          </div>
          <label>
            <span>Primary color</span>
            <div className={styles.colorInput}>
              <input type="color" value={settings.primaryColor} onChange={(event) => updateField("primaryColor", event.target.value)} />
              <input value={settings.primaryColor} onChange={(event) => updateField("primaryColor", event.target.value)} />
            </div>
          </label>
          <label>
            <span>Secondary color</span>
            <div className={styles.colorInput}>
              <input type="color" value={settings.secondaryColor} onChange={(event) => updateField("secondaryColor", event.target.value)} />
              <input value={settings.secondaryColor} onChange={(event) => updateField("secondaryColor", event.target.value)} />
            </div>
          </label>
          <label>
            <span>Currency</span>
            <select value={settings.currency} onChange={(event) => updateField("currency", event.target.value)}>
              <option value="USD">USD - US Dollar</option>
              <option value="PHP">PHP - Philippine Peso</option>
              <option value="KRW">KRW - Korean Won</option>
              <option value="EUR">EUR - Euro</option>
            </select>
          </label>
          <label>
            <span>Settings key</span>
            <input value={settings.key} onChange={(event) => updateField("key", event.target.value)} placeholder="store_defaults" />
          </label>
          <label className={styles.fullWidth}>
            <span>Settings value</span>
            <textarea rows={3} value={settings.value} onChange={(event) => updateField("value", event.target.value)} placeholder="Optional value for this setting key" />
          </label>
        </div>

        <div className={styles.actions}>
          <button className={styles.submit} disabled={isSaving} type="submit">
            {isSaving ? "Saving..." : "Save system details"}
          </button>
        </div>
      </form>
    </section>
    {isCropping && cropFile && (
      <div className={styles.modalBackdrop} role="presentation">
        <div className={styles.cropModal} role="dialog" aria-modal="true" aria-labelledby="crop-logo-title">
          <div className={styles.modalHeader}>
            <div>
              <p className={styles.eyebrow}>LOGO UPLOAD</p>
              <h2 id="crop-logo-title">Crop your logo</h2>
            </div>
            <button className={styles.closeButton} type="button" onClick={closeCropModal} aria-label="Close crop dialog">
              ×
            </button>
          </div>
          <p className={styles.modalDescription}>Drag the image to position it and use the slider to zoom before uploading.</p>
          <div
            className={`${styles.cropFrame} ${isDraggingCrop ? styles.cropFrameDragging : ""}`}
            onPointerDown={handleCropPointerDown}
            onPointerMove={handleCropPointerMove}
            onPointerUp={handleCropPointerUp}
            onPointerCancel={handleCropPointerUp}
          >
            <img
              className={styles.cropImage}
              src={cropPreviewUrl}
              alt="Logo crop preview"
              onLoad={handleCropImageLoad}
              style={{
                width: `${Math.max(315, cropImageSize.width * (315 / Math.min(cropImageSize.width, cropImageSize.height)))}px`,
                transform: `translate(calc(-50% + ${cropPosition.x}px), calc(-50% + ${cropPosition.y}px)) scale(${cropZoom})`,
              }}
            />
            <div className={styles.cropCircle} />
          </div>
          <div className={styles.zoomControl}>
            <span aria-hidden="true">▧</span>
            <input
              type="range"
              min="1"
              max="3"
              step="0.01"
              value={cropZoom}
              onChange={(event) => setCropZoom(Number(event.target.value))}
              aria-label="Zoom logo"
            />
            <span aria-hidden="true">▣</span>
          </div>
          <div className={styles.modalActions}>
            <button className={styles.cancelButton} type="button" onClick={closeCropModal}>Cancel</button>
            <button className={styles.submit} type="button" onClick={cropLogo}>Crop &amp; use logo</button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
