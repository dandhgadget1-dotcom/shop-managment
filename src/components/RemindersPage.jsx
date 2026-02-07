"use client";

import { useState, useEffect, useRef } from "react";
import { useShopSettings } from "@/context/ShopSettingsContext";
import { remindersAPI } from "@/lib/api";
import { generateReminderMessage } from "@/lib/reminderMessages";
import { useToast } from "@/components/ui/toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Bell,
  Copy,
  Check,
  Calendar,
  DollarSign,
  User,
  Smartphone,
  Phone,
  AlertCircle,
  Clock,
  RefreshCw,
  X,
  Trash2,
  RotateCcw,
  Edit,
  Save,
  MessageCircle,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function RemindersPage() {
  const { settings } = useShopSettings();
  const toast = useToast();
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(false); // Start with false - no auto-loading
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [shopInfo, setShopInfo] = useState({ shopName: '', shopPhone: '' });
  const [dismissedReminders, setDismissedReminders] = useState(new Set());
  const [showUndoOption, setShowUndoOption] = useState(null); // { customerId, installmentNumber }
  const [editingMessage, setEditingMessage] = useState(null); // { customerId, installmentNumber, message }
  const [editedMessageText, setEditedMessageText] = useState("");
  const [customMessages, setCustomMessages] = useState(new Map()); // Map of reminderKey -> custom message
  const toastRef = useRef(toast);
  const dismissedRemindersRef = useRef(new Set()); // Ref to access current dismissed reminders in fetchReminders

  // Update toast ref when it changes
  useEffect(() => {
    toastRef.current = toast;
  }, [toast]);

  // Load dismissed reminders and cached reminders from localStorage on mount (only once)
  useEffect(() => {
    // Load dismissed reminders
    const storedDismissed = localStorage.getItem('dismissedReminders');
    if (storedDismissed) {
      try {
        const dismissed = JSON.parse(storedDismissed);
        const dismissedSet = new Set(dismissed);
        setDismissedReminders(dismissedSet);
        dismissedRemindersRef.current = dismissedSet; // Also update ref
      } catch (error) {
        console.error('Error loading dismissed reminders:', error);
      }
    }

    // Load cached reminders if they exist
    const storedReminders = localStorage.getItem('cachedReminders');
    const storedShopInfo = localStorage.getItem('cachedShopInfo');
    if (storedReminders) {
      try {
        const cachedReminders = JSON.parse(storedReminders);
        const cachedShop = storedShopInfo ? JSON.parse(storedShopInfo) : { shopName: '', shopPhone: '' };
        
        // Filter out dismissed reminders from cached data
        const currentDismissed = dismissedRemindersRef.current;
        const now = new Date();
        const filteredReminders = cachedReminders.map(reminder => ({
          ...reminder,
          pendingInstallments: reminder.pendingInstallments.filter(inst => {
            const reminderKey = `${reminder.customerId}-${inst.number}`;
            // Don't show if dismissed
            if (currentDismissed.has(reminderKey)) {
              return false;
            }
            // Don't show if expired (10 days after due date)
            const expiryDate = new Date(inst.expiryDate);
            return expiryDate >= now;
          }),
        })).filter(reminder => reminder.pendingInstallments.length > 0);
        
        setReminders(filteredReminders);
        setShopInfo(cachedShop);
      } catch (error) {
        console.error('Error loading cached reminders:', error);
      }
    }

    // Load custom messages from localStorage
    const storedCustomMessages = localStorage.getItem('customReminderMessages');
    if (storedCustomMessages) {
      try {
        const customMessagesObj = JSON.parse(storedCustomMessages);
        const customMessagesMap = new Map(Object.entries(customMessagesObj));
        setCustomMessages(customMessagesMap);
      } catch (error) {
        console.error('Error loading custom messages:', error);
      }
    }
  }, []);

  const fetchReminders = async () => {
    try {
      setLoading(true);
      const response = await remindersAPI.getAll();
      if (response.success) {
        // Get current dismissed reminders from ref (always up-to-date)
        const currentDismissed = dismissedRemindersRef.current;
        
        // Filter out dismissed reminders and expired ones immediately
        const now = new Date();
        const filteredReminders = (response.reminders || []).map(reminder => ({
          ...reminder,
          pendingInstallments: reminder.pendingInstallments.filter(inst => {
            const reminderKey = `${reminder.customerId}-${inst.number}`;
            // Don't show if dismissed
            if (currentDismissed.has(reminderKey)) {
              return false;
            }
            // Don't show if expired (10 days after due date)
            const expiryDate = new Date(inst.expiryDate);
            return expiryDate >= now;
          }),
        })).filter(reminder => reminder.pendingInstallments.length > 0);
        
        setReminders(filteredReminders);
        const shopData = response.shop || { shopName: '', shopPhone: '' };
        setShopInfo(shopData);
        
        // Save to localStorage for persistence
        try {
          localStorage.setItem('cachedReminders', JSON.stringify(response.reminders || []));
          localStorage.setItem('cachedShopInfo', JSON.stringify(shopData));
        } catch (error) {
          console.error('Error saving reminders to cache:', error);
        }
      }
    } catch (error) {
      console.error("Error fetching reminders:", error);
      toastRef.current?.error(error.message || "Failed to load reminders");
    } finally {
      setLoading(false);
    }
  };

  // NO automatic API calls - only when refresh button is clicked

  const getReminderMessage = (customer, installment) => {
    const reminderKey = `${customer.customerId}-${installment.number}`;
    // Check if there's a custom message
    if (customMessages.has(reminderKey)) {
      return customMessages.get(reminderKey);
    }
    // Otherwise generate message using template from settings
    const shopInfoWithTemplate = {
      ...shopInfo,
      reminderMessageTemplate: settings?.reminderMessageTemplate || null,
    };
    return generateReminderMessage(customer, installment, shopInfoWithTemplate);
  };

  const handleCopyMessage = async (customer, installment, index) => {
    try {
      const message = getReminderMessage(customer, installment);
      await navigator.clipboard.writeText(message);
      setCopiedIndex(index);
      toastRef.current?.success("Reminder message copied to clipboard!");
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (error) {
      console.error("Error copying message:", error);
      toastRef.current?.error("Failed to copy message");
    }
  };

  // Format phone number for WhatsApp (wa.me format: 923001234567, no +)
  const formatPhoneForWhatsApp = (phoneNumber) => {
    if (!phoneNumber) return null;
    
    // Remove all non-digit characters
    let cleaned = phoneNumber.replace(/[^\d]/g, '');
    
    // If it starts with +92, remove the +
    if (cleaned.startsWith('92') && cleaned.length === 12) {
      return cleaned;
    }
    
    // If it starts with 0, replace with 92
    if (cleaned.startsWith('0') && cleaned.length === 11) {
      return '92' + cleaned.substring(1);
    }
    
    // If it's 10 digits, add 92
    if (cleaned.length === 10) {
      return '92' + cleaned;
    }
    
    // If it's already 12 digits starting with 92, return as is
    if (cleaned.length === 12 && cleaned.startsWith('92')) {
      return cleaned;
    }
    
    return null;
  };

  const handleOpenWhatsApp = (customer, installment) => {
    const phoneNumber = formatPhoneForWhatsApp(customer.contactInfo);
    
    if (!phoneNumber) {
      toastRef.current?.error("Invalid phone number format");
      return;
    }
    
    const message = getReminderMessage(customer, installment);
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    
    // Open WhatsApp with pre-filled message
    // Note: User will need to click send in WhatsApp (this is the only way without API services)
    window.open(whatsappUrl, '_blank');
    toastRef.current?.success("Opening WhatsApp with message ready to send!");
  };

  const handleEditMessage = (customer, installment) => {
    const reminderKey = `${customer.customerId}-${installment.number}`;
    const currentMessage = getReminderMessage(customer, installment);
    setEditingMessage({ customerId: customer.customerId, installmentNumber: installment.number });
    setEditedMessageText(currentMessage);
  };

  const handleSaveMessage = (customerId, installmentNumber) => {
    const reminderKey = `${customerId}-${installmentNumber}`;
    const newCustomMessages = new Map(customMessages);
    
    if (editedMessageText.trim()) {
      newCustomMessages.set(reminderKey, editedMessageText.trim());
    } else {
      // If empty, remove custom message to use default
      newCustomMessages.delete(reminderKey);
    }
    
    setCustomMessages(newCustomMessages);
    
    // Save to localStorage
    try {
      const customMessagesObj = Object.fromEntries(newCustomMessages);
      localStorage.setItem('customReminderMessages', JSON.stringify(customMessagesObj));
    } catch (error) {
      console.error('Error saving custom messages:', error);
    }
    
    setEditingMessage(null);
    setEditedMessageText("");
    toastRef.current?.success("Reminder message updated!");
  };

  const handleResetMessage = (customerId, installmentNumber) => {
    const reminderKey = `${customerId}-${installmentNumber}`;
    const newCustomMessages = new Map(customMessages);
    newCustomMessages.delete(reminderKey);
    setCustomMessages(newCustomMessages);
    
    // Save to localStorage
    try {
      const customMessagesObj = Object.fromEntries(newCustomMessages);
      localStorage.setItem('customReminderMessages', JSON.stringify(customMessagesObj));
    } catch (error) {
      console.error('Error saving custom messages:', error);
    }
    
    toastRef.current?.success("Message reset to default");
  };

  const handleDismissReminder = (customerId, installmentNumber) => {
    const reminderKey = `${customerId}-${installmentNumber}`;
    const newDismissed = new Set(dismissedReminders);
    newDismissed.add(reminderKey);
    setDismissedReminders(newDismissed);
    dismissedRemindersRef.current = newDismissed; // Update ref immediately
    
    // Save to localStorage
    try {
      localStorage.setItem('dismissedReminders', JSON.stringify(Array.from(newDismissed)));
    } catch (error) {
      console.error('Error saving dismissed reminders:', error);
    }
    
    // Show undo option
    setShowUndoOption({ customerId, installmentNumber });
    
    // Remove from current reminders list immediately
    setReminders(prevReminders => 
      prevReminders.map(reminder => ({
        ...reminder,
        pendingInstallments: reminder.pendingInstallments.filter(
          inst => `${reminder.customerId}-${inst.number}` !== reminderKey
        ),
      })).filter(reminder => reminder.pendingInstallments.length > 0)
    );
    
    toastRef.current?.success("Reminder dismissed");
  };

  const handleUndoDismiss = (customerId, installmentNumber) => {
    const reminderKey = `${customerId}-${installmentNumber}`;
    const newDismissed = new Set(dismissedReminders);
    newDismissed.delete(reminderKey);
    setDismissedReminders(newDismissed);
    dismissedRemindersRef.current = newDismissed; // Update ref immediately
    setShowUndoOption(null);
    
    // Save to localStorage
    try {
      localStorage.setItem('dismissedReminders', JSON.stringify(Array.from(newDismissed)));
    } catch (error) {
      console.error('Error saving dismissed reminders:', error);
    }
    
    // Re-fetch reminders to show the dismissed one again
    fetchReminders();
    
    toastRef.current?.success("Reminder restored");
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getDaysText = (daysDiff, isOverdue) => {
    if (isOverdue) {
      const daysOverdue = Math.abs(daysDiff);
      return daysOverdue === 1 ? "1 day overdue" : `${daysOverdue} days overdue`;
    }
    if (daysDiff === 0) return "Due today";
    if (daysDiff === 1) return "Due tomorrow";
    return `Due in ${daysDiff} days`;
  };

  const formatExpiryDate = (expiryDateString) => {
    const expiryDate = new Date(expiryDateString);
    return expiryDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading reminders...</p>
        </div>
      </div>
    );
  }

  // Show empty state if no reminders and not loading
  if (!loading && reminders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="p-4 bg-muted rounded-full">
          <Bell className="h-12 w-12 text-muted-foreground" />
        </div>
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">No Reminders</h3>
          <p className="text-muted-foreground">
            There are no pending installments due within the next 3 days.
          </p>
        </div>
        <Button onClick={fetchReminders} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="h-6 w-6" />
            Payment Reminders
          </h2>
          <p className="text-muted-foreground mt-1">
            {reminders.length} customer{reminders.length !== 1 ? "s" : ""} with pending installments
          </p>
        </div>
        <Button onClick={fetchReminders} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Undo notification */}
      {showUndoOption && (
        <div className="bg-primary/10 border border-primary/20 rounded-md p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-primary" />
            <span className="text-sm">Reminder dismissed. Click undo to restore it.</span>
          </div>
          <Button
            onClick={() => handleUndoDismiss(showUndoOption.customerId, showUndoOption.installmentNumber)}
            variant="outline"
            size="sm"
            className="h-7"
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            Undo
          </Button>
        </div>
      )}

      <div className="grid gap-4">
        {reminders.map((reminder, reminderIndex) => {
          return reminder.pendingInstallments.map((installment, instIndex) => {
            const uniqueIndex = `${reminderIndex}-${instIndex}`;
            const isCopied = copiedIndex === uniqueIndex;
            const reminderKey = `${reminder.customerId}-${installment.number}`;
            const hasCustomMessage = customMessages.has(reminderKey);
            const message = getReminderMessage(reminder, installment);
            const isEditing = editingMessage?.customerId === reminder.customerId && 
                            editingMessage?.installmentNumber === installment.number;

            return (
              <Card
                key={uniqueIndex}
                className={`${
                  installment.isOverdue
                    ? "border-destructive/50 bg-destructive/5"
                    : installment.isDueToday
                    ? "border-orange-500/50 bg-orange-50 dark:bg-orange-950/20"
                    : "border-border"
                }`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <User className="h-5 w-5" />
                        {reminder.customerName}
                      </CardTitle>
                      <CardDescription className="mt-1 flex items-center gap-4 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Phone className="h-3.5 w-3.5" />
                          {reminder.contactInfo}
                        </span>
                        <span className="flex items-center gap-1">
                          <Smartphone className="h-3.5 w-3.5" />
                          {reminder.phoneName}
                        </span>
                      </CardDescription>
                    </div>
                    <Badge
                      variant={
                        installment.isOverdue
                          ? "destructive"
                          : installment.isDueToday
                          ? "default"
                          : "secondary"
                      }
                      className="ml-2"
                    >
                      {installment.isOverdue ? (
                        <AlertCircle className="h-3 w-3 mr-1" />
                      ) : (
                        <Clock className="h-3 w-3 mr-1" />
                      )}
                      {getDaysText(installment.daysDiff, installment.isOverdue)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Due Date</p>
                          <p className="font-semibold">{formatDate(installment.dueDate)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Amount</p>
                          <p className="font-semibold text-green-600 dark:text-green-400">
                            {formatCurrency(installment.amount)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">
                            {installment.isExpiringSoon ? (
                              <span className="text-orange-600 dark:text-orange-400 font-semibold">
                                Expires Soon
                              </span>
                            ) : (
                              "Expires"
                            )}
                          </p>
                          <p className={`font-semibold text-xs ${
                            installment.isExpiringSoon 
                              ? "text-orange-600 dark:text-orange-400" 
                              : "text-muted-foreground"
                          }`}>
                            {formatExpiryDate(installment.expiryDate)}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {installment.daysUntilExpiry > 0 
                              ? `${installment.daysUntilExpiry} day${installment.daysUntilExpiry !== 1 ? 's' : ''} left`
                              : 'Expired'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-semibold text-muted-foreground">
                              Installment #{installment.number} - Reminder Message
                            </p>
                            {hasCustomMessage && (
                              <Badge variant="secondary" className="text-xs">
                                Custom
                              </Badge>
                            )}
                          </div>
                          <div className="bg-muted/50 rounded-md p-3 whitespace-pre-wrap font-mono text-xs">
                            {message}
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 shrink-0">
                          <Button
                            onClick={() => handleCopyMessage(reminder, installment, uniqueIndex)}
                            variant={isCopied ? "default" : "outline"}
                            size="sm"
                          >
                            {isCopied ? (
                              <>
                                <Check className="h-4 w-4 mr-2" />
                                Copied!
                              </>
                            ) : (
                              <>
                                <Copy className="h-4 w-4 mr-2" />
                                Copy
                              </>
                            )}
                          </Button>
                          <Button
                            onClick={() => handleOpenWhatsApp(reminder, installment)}
                            variant="outline"
                            size="sm"
                            className="bg-green-50 hover:bg-green-100 dark:bg-green-950/20 dark:hover:bg-green-950/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800"
                            title="Opens WhatsApp with message ready - just click send!"
                          >
                            <MessageCircle className="h-4 w-4 mr-2" />
                            Open WhatsApp
                          </Button>
                          <Button
                            onClick={() => handleEditMessage(reminder, installment)}
                            variant="outline"
                            size="sm"
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Message
                          </Button>
                          {hasCustomMessage && (
                            <Button
                              onClick={() => handleResetMessage(reminder.customerId, installment.number)}
                              variant="outline"
                              size="sm"
                              className="text-xs"
                            >
                              Reset to Default
                            </Button>
                          )}
                          <Button
                            onClick={() => handleDismissReminder(reminder.customerId, installment.number)}
                            variant="outline"
                            size="sm"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Mark as Sent
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          });
        })}
      </div>

      {/* Edit Message Dialog */}
      <Dialog open={!!editingMessage} onOpenChange={(open) => {
        if (!open) {
          setEditingMessage(null);
          setEditedMessageText("");
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Edit Reminder Message
            </DialogTitle>
            <DialogDescription>
              Customize the reminder message. You can add bank details, change the language, or add any additional information.
              The message will be saved for this specific reminder.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                value={editedMessageText}
                onChange={(e) => setEditedMessageText(e.target.value)}
                placeholder="Enter your custom reminder message..."
                className="min-h-[300px] font-mono text-sm"
                rows={12}
              />
              <p className="text-xs text-muted-foreground">
                Tip: You can include details like bank account numbers, payment methods, or any other information you want to share.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setEditingMessage(null);
                  setEditedMessageText("");
                }}
              >
                Cancel
              </Button>
              {editingMessage && customMessages.has(`${editingMessage.customerId}-${editingMessage.installmentNumber}`) && (
                <Button
                  variant="outline"
                  onClick={() => {
                    if (editingMessage) {
                      handleResetMessage(editingMessage.customerId, editingMessage.installmentNumber);
                      setEditingMessage(null);
                      setEditedMessageText("");
                    }
                  }}
                >
                  Reset to Default
                </Button>
              )}
              <Button
                onClick={() => {
                  if (editingMessage) {
                    handleSaveMessage(editingMessage.customerId, editingMessage.installmentNumber);
                  }
                }}
              >
                <Save className="h-4 w-4 mr-2" />
                Save Message
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
