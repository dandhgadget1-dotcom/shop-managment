"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { shopAPI } from "@/lib/api";

const ShopSettingsContext = createContext();

const DEFAULT_SETTINGS = {
  shopName: "",
  shopAddress: "",
  shopPhone: "",
  shopEmail: "",
  ntnNumber: "",
  footerMessage: "Thank you for your business!",
  enableAutoReminders: false,
  enableManualReminders: true,
  reminderDaysAhead: 7,
  reminderMessageTemplate: null,
};

export function ShopSettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      const data = await shopAPI.get();
      setSettings(data);
    } catch (error) {
      console.error("Error loading shop settings:", error);
      // Keep default settings on error
    } finally {
      setLoading(false);
    }
  }, []); // Memoize to prevent infinite loops

  // Load settings from API on mount
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Save settings to API
  const updateSettings = async (newSettings) => {
    try {
      // Just send the settings directly - no complex merging needed
      const saved = await shopAPI.update(newSettings);
      setSettings(saved);
      return saved;
    } catch (error) {
      console.error("Error updating shop settings:", error);
      throw error;
    }
  };

  return (
    <ShopSettingsContext.Provider value={{ settings, updateSettings, loading, loadSettings }}>
      {children}
    </ShopSettingsContext.Provider>
  );
}

export function useShopSettings() {
  const context = useContext(ShopSettingsContext);
  if (!context) {
    throw new Error("useShopSettings must be used within ShopSettingsProvider");
  }
  return context;
}

