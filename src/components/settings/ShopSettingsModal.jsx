"use client";

import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { useShopSettings } from "@/context/ShopSettingsContext";
import { useToast } from "@/components/ui/toast";
import { Settings, Loader2, MessageSquare, Bell, Calendar, Info, CheckCircle2, XCircle } from "lucide-react";

export default function ShopSettingsModal({ open, onOpenChange }) {
  const { settings, updateSettings, loadSettings } = useShopSettings();
  const toast = useToast();
  const [formData, setFormData] = useState({
    shopName: "",
    shopAddress: "",
    shopPhone: "",
    shopEmail: "",
    ntnNumber: "",
    footerMessage: "Thank you for your business!",
    enableAutoReminders: false,
    enableManualReminders: true,
    reminderDaysAhead: 7,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const isSubmittingRef = useRef(false);

  // Reload settings from database when modal opens
  useEffect(() => {
    if (open) {
      const loadLatestSettings = async () => {
        setIsLoading(true);
        try {
          await loadSettings(); // Reload from database
        } catch (error) {
          console.error("Error loading settings:", error);
        } finally {
          setIsLoading(false);
        }
      };
      loadLatestSettings();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]); // Only reload when modal opens, not when loadSettings changes

  // Update form data when settings are loaded
  useEffect(() => {
    if (open && settings) {
      setFormData({
        shopName: settings.shopName || "",
        shopAddress: settings.shopAddress || "",
        shopPhone: settings.shopPhone || "",
        shopEmail: settings.shopEmail || "",
        ntnNumber: settings.ntnNumber || "",
        footerMessage: settings.footerMessage || "Thank you for your business!",
        enableAutoReminders: settings.enableAutoReminders ?? false,
        enableManualReminders: settings.enableManualReminders ?? true,
        reminderDaysAhead: settings.reminderDaysAhead ?? 7,
      });
    }
  }, [settings, open]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (type === 'number' ? parseInt(value) || 0 : value),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent event bubbling

    // Prevent double submission using ref (more reliable than state)
    if (isSubmittingRef.current || isSaving) {
      return;
    }

    isSubmittingRef.current = true;
    setIsSaving(true);

    try {
      // updateSettings already updates the context with the saved data from API
      await updateSettings(formData);
      toast.success("Shop settings saved successfully!");
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving shop settings:", error);
      toast.error(`Failed to save shop settings: ${error.message || 'Please try again.'}`);
    } finally {
      setIsSaving(false);
      isSubmittingRef.current = false;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Shop Settings
          </DialogTitle>
          <DialogDescription>
            Configure your shop details for receipts and invoices
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Loading settings...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
          {/* Shop Name */}
          <div className="space-y-2">
            <Label htmlFor="shopName">Shop Name *</Label>
            <Input
              id="shopName"
              name="shopName"
              value={formData.shopName}
              onChange={handleInputChange}
              placeholder="Enter shop name"
              required
            />
          </div>

          {/* Shop Address */}
          <div className="space-y-2">
            <Label htmlFor="shopAddress">Shop Address</Label>
            <Textarea
              id="shopAddress"
              name="shopAddress"
              value={formData.shopAddress}
              onChange={handleInputChange}
              placeholder="Enter shop address"
              rows={3}
            />
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="shopPhone">Phone Number</Label>
              <Input
                id="shopPhone"
                name="shopPhone"
                value={formData.shopPhone}
                onChange={handleInputChange}
                placeholder="Enter phone number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="shopEmail">Email</Label>
              <Input
                id="shopEmail"
                name="shopEmail"
                type="email"
                value={formData.shopEmail}
                onChange={handleInputChange}
                placeholder="Enter email address"
              />
            </div>
          </div>

          {/* Tax Information */}
          <div className="space-y-2">
            <Label htmlFor="ntnNumber">NTN Number</Label>
            <Input
              id="ntnNumber"
              name="ntnNumber"
              value={formData.ntnNumber}
              onChange={handleInputChange}
              placeholder="Enter NTN number"
            />
          </div>

          {/* Footer Message */}
          <div className="space-y-2">
            <Label htmlFor="footerMessage">Footer Message</Label>
            <Textarea
              id="footerMessage"
              name="footerMessage"
              value={formData.footerMessage}
              onChange={handleInputChange}
              placeholder="Message to display on receipt footer"
              rows={2}
            />
          </div>

          {/* WhatsApp Settings Section */}
          <Separator className="my-8" />
          
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <MessageSquare className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">WhatsApp Reminder Settings</h3>
                <p className="text-sm text-muted-foreground">Configure automatic and manual WhatsApp notifications</p>
              </div>
            </div>
            
            <div className="space-y-5">
              {/* Enable Manual Reminders */}
              <div className="p-5 border rounded-lg bg-card hover:bg-accent/50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Bell className="h-5 w-5 text-primary" />
                      <Label htmlFor="enableManualReminders" className="text-base font-semibold cursor-pointer">
                        Manual WhatsApp Reminders
                      </Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              className="text-muted-foreground hover:text-foreground transition-colors"
                              onClick={(e) => e.preventDefault()}
                            >
                              <Info className="h-4 w-4" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="right" className="max-w-xs">
                            <p>Allow sending WhatsApp reminders manually from the Installments Ledger. When enabled, you&apos;ll see a message icon button next to each pending installment.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant={formData.enableManualReminders ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        enableManualReminders: !prev.enableManualReminders,
                      }));
                    }}
                    className="gap-2 min-w-[100px]"
                  >
                    {formData.enableManualReminders ? (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        Enabled
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4" />
                        Disabled
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Enable Automatic Reminders */}
              <div className="p-5 border rounded-lg bg-card hover:bg-accent/50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-primary" />
                      <Label htmlFor="enableAutoReminders" className="text-base font-semibold cursor-pointer">
                        Automatic WhatsApp Reminders
                      </Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              className="text-muted-foreground hover:text-foreground transition-colors"
                              onClick={(e) => e.preventDefault()}
                            >
                              <Info className="h-4 w-4" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="right" className="max-w-xs">
                            <p>Automatically send WhatsApp reminders daily for upcoming installments. The system will check for installments due within the configured days ahead and send reminders automatically.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant={formData.enableAutoReminders ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        enableAutoReminders: !prev.enableAutoReminders,
                      }));
                    }}
                    className="gap-2 min-w-[100px]"
                  >
                    {formData.enableAutoReminders ? (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        Enabled
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4" />
                        Disabled
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Reminder Days Ahead */}
              <div className="p-5 border rounded-lg bg-card">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    <Label htmlFor="reminderDaysAhead" className="text-base font-semibold">
                      Reminder Days Ahead
                    </Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            className="text-muted-foreground hover:text-foreground transition-colors"
                            onClick={(e) => e.preventDefault()}
                          >
                            <Info className="h-4 w-4" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="max-w-xs">
                          <p>Number of days before the installment due date to send reminders. For example, if set to 7, reminders will be sent 7 days before each installment is due.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div className="flex items-center gap-3">
                    <Input
                      id="reminderDaysAhead"
                      name="reminderDaysAhead"
                      type="number"
                      min="1"
                      max="30"
                      value={formData.reminderDaysAhead}
                      onChange={handleInputChange}
                      placeholder="7"
                      className="w-24"
                    />
                    <span className="text-sm text-muted-foreground">days</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Settings"
              )}
            </Button>
          </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

