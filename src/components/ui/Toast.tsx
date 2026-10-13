"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { useSystemSettings } from "@/hooks/useSystemSettings";
import styles from "./Toast.module.css";

type ToastProps = {
  message: string;
  type: "success" | "error";
  onClose: () => void;
};

export default function Toast({ message, type, onClose }: ToastProps) {
  const settings = useSystemSettings();
  useEffect(() => {
    const timeout = window.setTimeout(onClose, 4500);
    return () => window.clearTimeout(timeout);
  }, [message, onClose]);

  const toast = (
    <div
      className={`${styles.toast} ${styles[type]}`}
      style={{ "--toast-primary": settings.primaryColor } as React.CSSProperties}
      role={type === "error" ? "alert" : "status"}
    >
      <span className={styles.icon}>{type === "success" ? "✓" : "!"}</span>
      <span className={styles.message}>{message}</span>
      <button onClick={onClose} type="button" aria-label="Close notification">×</button>
    </div>
  );

  return typeof document === "undefined" ? null : createPortal(toast, document.body);
}
