"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

export type SystemSettings = {
  siteName: string;
  logoUrl: string;
  tagline: string;
  contactNumber: string;
  supportEmail: string;
  description: string;
  secondaryLogoUrl: string;
  facebookUrl: string;
  twitterUrl: string;
  instagramUrl: string;
  kakaoTalkUrl: string;
  address: string;
  primaryColor: string;
  secondaryColor: string;
  currency: string;
};

export const defaultSystemSettings: SystemSettings = {
  siteName: "",
  logoUrl: "",
  tagline: "",
  contactNumber: "",
  supportEmail: "",
  description: "",
  secondaryLogoUrl: "",
  facebookUrl: "",
  twitterUrl: "",
  instagramUrl: "",
  kakaoTalkUrl: "",
  address: "",
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
        .select(
          "site_name, logo_url, tagline, contact_number, support_email, description, secondary_logo_url, facebook_url, twitter_url, instagram_url, kakao_talk_url, address, primary_color, secondary_color, currency"
        )
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        setSettings({
          siteName: data.site_name || "",
          logoUrl: data.logo_url || "",
          tagline: data.tagline || "",
          contactNumber: data.contact_number || "",
          supportEmail: data.support_email || "",
          description: data.description || "",
          secondaryLogoUrl: data.secondary_logo_url || "",
          facebookUrl: data.facebook_url || "",
          twitterUrl: data.twitter_url || "",
          instagramUrl: data.instagram_url || "",
          kakaoTalkUrl: data.kakao_talk_url || "",
          address: data.address || "",
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
