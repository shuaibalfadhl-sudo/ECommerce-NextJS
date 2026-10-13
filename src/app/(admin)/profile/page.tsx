"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import Toast from "@/components/ui/Toast";
import { useSystemSettings } from "@/hooks/useSystemSettings";
import styles from "./page.module.css";

export default function ProfilePage() {
  const router = useRouter();
  const { primaryColor } = useSystemSettings();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [email, setEmail] = useState("");
  const [cropPreviewUrl, setCropPreviewUrl] = useState("");
  const [cropImageSize, setCropImageSize] = useState({ width: 1, height: 1 });
  const [cropZoom, setCropZoom] = useState(1);
  const [cropPosition, setCropPosition] = useState({ x: 0, y: 0 });
  const [isDraggingCrop, setIsDraggingCrop] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    async function loadProfile() {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        router.replace("/auth");
        return;
      }
      const { data: profile } = await supabase.from("profile").select("first_name, last_name, phone_number, avatar_url").eq("id", data.user.id).maybeSingle();
      setFirstName(profile?.first_name ?? "");
      setLastName(profile?.last_name ?? "");
      setPhoneNumber(profile?.phone_number ?? "");
      setAvatarUrl(profile?.avatar_url ?? "");
      setEmail(data.user.email ?? "");
      setIsLoading(false);
    }

    void loadProfile();
  }, [router]);

  function selectAvatar(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    if (cropPreviewUrl) URL.revokeObjectURL(cropPreviewUrl);
    setCropPreviewUrl(URL.createObjectURL(file));
    setCropZoom(1);
    setCropPosition({ x: 0, y: 0 });
  }

  function cropAvatar() {
    if (!cropPreviewUrl) return;
    const image = new Image();
    image.onload = () => {
      const cropSize = 315;
      const baseScale = Math.max(cropSize / image.width, cropSize / image.height);
      const sourceSize = cropSize / (baseScale * cropZoom);
      const sourceX = (image.width - sourceSize) / 2 - cropPosition.x / (baseScale * cropZoom);
      const sourceY = (image.height - sourceSize) / 2 - cropPosition.y / (baseScale * cropZoom);
      const canvas = document.createElement("canvas");
      canvas.width = 512;
      canvas.height = 512;
      const context = canvas.getContext("2d");
      if (!context) return;
      context.drawImage(image, sourceX, sourceY, sourceSize, sourceSize, 0, 0, 512, 512);
      canvas.toBlob((blob) => {
        if (!blob) return;
        const file = new File([blob], `avatar-${Date.now()}.png`, { type: "image/png" });
        const previewUrl = URL.createObjectURL(file);
        setAvatarFile(file);
        setAvatarUrl(previewUrl);
      }, "image/png");
      URL.revokeObjectURL(cropPreviewUrl);
      setCropPreviewUrl("");
    };
    image.src = cropPreviewUrl;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setToast({ message: "Your session has expired. Please sign in again.", type: "error" });
      setIsSaving(false);
      return;
    }
    let savedAvatarUrl = avatarUrl || null;
    if (avatarFile) {
      const path = `avatars/${userData.user.id}-${crypto.randomUUID()}.png`;
      const upload = await supabase.storage.from("system-assets").upload(path, avatarFile, { upsert: false, cacheControl: "3600" });
      if (upload.error) {
        setToast({ message: upload.error.message, type: "error" });
        setIsSaving(false);
        return;
      }
      savedAvatarUrl = supabase.storage.from("system-assets").getPublicUrl(path).data.publicUrl;
    }
    const { error: profileError } = await supabase.from("profile").upsert({
      id: userData.user.id,
      first_name: firstName.trim() || null,
      last_name: lastName.trim() || null,
      phone_number: phoneNumber.trim() || null,
      avatar_url: savedAvatarUrl,
    });
    const { error } = profileError ? { error: profileError } : await supabase.auth.updateUser({ email });
    setIsSaving(false);

    if (error) {
      setToast({ message: error.message, type: "error" });
      return;
    }

    setToast({
      message: "Profile updated. Check your email if a confirmation is required.",
      type: "success",
    });
    router.refresh();
  }

  if (isLoading) return <section className={styles.page}><p>Loading profile...</p></section>;

  return (
    <section className={styles.page}>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>ACCOUNT</p>
          <h1>My profile</h1>
          <p>Update the information associated with your account.</p>
        </div>
        <Link href="/dashboard">Back to dashboard</Link>
      </div>
      <form className={styles.card} onSubmit={handleSubmit}>
        <div className={styles.profileLayout}>
          <div className={styles.avatarSection}>
            <div className={styles.avatarPreview}>{avatarUrl ? <img src={avatarUrl} alt="Profile avatar" /> : <span>{`${firstName[0] ?? ""}${lastName[0] ?? ""}` || "U"}</span>}</div>
            <label className={styles.uploadButton}>⌑ Upload photo<input type="file" accept="image/*" onChange={selectAvatar} /></label>
            <p>Upload an image and crop it before saving.</p>
          </div>
          <div className={styles.details}>
            <h2>Profile Details</h2>
            <label><span>First Name</span><input value={firstName} onChange={(event) => setFirstName(event.target.value)} /></label>
            <label><span>Last Name</span><input value={lastName} onChange={(event) => setLastName(event.target.value)} /></label>
            <label><span>Phone Number</span><input value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} /></label>
            <label><span>Email</span><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
            <div className={styles.actions}>
              <button type="submit" disabled={isSaving}>{isSaving ? "Saving..." : "Save changes"}</button>
            </div>
          </div>
        </div>
      </form>
      {cropPreviewUrl && typeof document !== "undefined" && createPortal(
        <div className={styles.cropBackdrop}>
          <div className={styles.cropModal} role="dialog" aria-modal="true" aria-label="Crop profile avatar" style={{ "--primary-color": primaryColor } as React.CSSProperties}>
            <h2>Crop your avatar</h2>
            <div className={styles.cropFrame} onPointerDown={(event) => { setIsDraggingCrop(true); setDragStart({ x: event.clientX - cropPosition.x, y: event.clientY - cropPosition.y }); }} onPointerMove={(event) => { if (!isDraggingCrop) return; setCropPosition({ x: event.clientX - dragStart.x, y: event.clientY - dragStart.y }); }} onPointerUp={() => setIsDraggingCrop(false)} onPointerCancel={() => setIsDraggingCrop(false)}>
              <img src={cropPreviewUrl} alt="Avatar crop preview" onLoad={(event) => setCropImageSize({ width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight })} style={{ width: `${Math.max(315, cropImageSize.width * (315 / Math.min(cropImageSize.width, cropImageSize.height)))}px`, transform: `translate(calc(-50% + ${cropPosition.x}px), calc(-50% + ${cropPosition.y}px)) scale(${cropZoom})` }} />
              <div className={styles.cropCircle} />
            </div>
            <label className={styles.zoomControl}>Zoom<input type="range" min="1" max="3" step="0.05" value={cropZoom} onChange={(event) => setCropZoom(Number(event.target.value))} /></label>
            <div className={styles.cropActions}><button type="button" onClick={() => { URL.revokeObjectURL(cropPreviewUrl); setCropPreviewUrl(""); }}>Cancel</button><button type="button" onClick={cropAvatar}>Crop &amp; use avatar</button></div>
          </div>
        </div>,
        document.body,
      )}
    </section>
  );
}
