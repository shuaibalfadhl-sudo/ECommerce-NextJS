"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

export type SystemSettings = {
  siteName: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  currency: string;
};

export const defaultSystemSettings: SystemSettings = {
  siteName: "",
  logoUrl: "",
  primaryColor: "",
  secondaryColor: "",
  currency: "USD",
};

export function useSystemSettings() {
  return useSystemSettingsWithLoading().settings;
}

export function useSystemSettingsWithLoading() {
  const [settings, setSettings] = useState<SystemSettings>(defaultSystemSettings);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadSettings() {
      const { data } = await supabase
        .from("system_settings")
        .select("site_name, logo_url, primary_color, secondary_color, currency")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        setSettings({
          siteName: data.site_name || "",
          logoUrl: data.logo_url || "",
          primaryColor: data.primary_color || "",
          secondaryColor: data.secondary_color || "",
          currency: data.currency || defaultSystemSettings.currency,
        });
      }
      setIsLoading(false);
    }

    void loadSettings();
  }, []);

  return { settings, isLoading };
}
