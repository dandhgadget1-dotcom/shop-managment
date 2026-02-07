"use client";

import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useShopSettings } from "@/context/ShopSettingsContext";
import { useToast } from "@/components/ui/toast";
import { MessageSquare, Loader2 } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";

const PLACEHOLDERS = [
  { key: '{customerName}', label: 'Customer Name', description: 'Customer\'s full name' },
  { key: '{phoneName}', label: 'Phone Name', description: 'Name of the phone' },
  { key: '{installmentNumber}', label: 'Installment Number', description: 'Installment number (e.g., 1, 2, 3)' },
  { key: '{dueDate}', label: 'Due Date', description: 'Due date (formatted)' },
  { key: '{amount}', label: 'Amount', description: 'Amount (Rs. X.XX)' },
  { key: '{shopName}', label: 'Shop Name', description: 'Your shop name' },
  { key: '{shopPhone}', label: 'Shop Phone', description: 'Your shop phone number' },
];

const DEFAULT_TEMPLATE = `Assalam-o-Alaikum {customerName} 👋\n\n📱 *Installment Reminder*\n\nYour installment #{installmentNumber} for *{phoneName}* is due on *{dueDate}*.\n\n💰 Amount: *Rs. {amount}*\n\nPlease make the payment on time.\n📞 Contact: {shopPhone}\n\nThank you!\n{shopName}`;

// Component to render template with placeholders as pills
function TemplatePreview({ template }) {
  const parts = [];
  let lastIndex = 0;
  const placeholderRegex = /\{(\w+)\}/g;
  let match;

  while ((match = placeholderRegex.exec(template)) !== null) {
    // Add text before placeholder
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        content: template.substring(lastIndex, match.index),
      });
    }

    // Add placeholder as pill
    const placeholderKey = match[0];
    const placeholderLabel = PLACEHOLDERS.find(p => p.key === placeholderKey)?.label || match[1];
    parts.push({
      type: 'placeholder',
      key: placeholderKey,
      label: placeholderLabel,
    });

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < template.length) {
    parts.push({
      type: 'text',
      content: template.substring(lastIndex),
    });
  }

  return (
    <div className="whitespace-pre-wrap text-sm leading-relaxed">
      {parts.map((part, index) => {
        if (part.type === 'placeholder') {
          return (
            <Badge
              key={index}
              variant="secondary"
              className="bg-primary/15 text-primary border-primary/30 font-semibold text-xs px-2.5 py-1 mx-0.5 inline-flex items-center rounded-full"
            >
              {part.label}
            </Badge>
          );
        }
        return <span key={index} className="text-foreground">{part.content}</span>;
      })}
    </div>
  );
}

export default function ReminderTemplateEditor({ open, onOpenChange }) {
  const { settings, updateSettings, loadSettings } = useShopSettings();
  const toast = useToast();
  const [template, setTemplate] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const textareaRef = useRef(null);

  // Load template when modal opens
  useEffect(() => {
    if (open) {
      const loadTemplate = async () => {
        setIsLoading(true);
        try {
          await loadSettings();
        } catch (error) {
          console.error("Error loading settings:", error);
        } finally {
          setIsLoading(false);
        }
      };
      loadTemplate();
    }
  }, [open, loadSettings]);

  // Update template when settings are loaded
  useEffect(() => {
    if (open && settings) {
      setTemplate(settings.reminderMessageTemplate || DEFAULT_TEMPLATE);
    }
  }, [settings, open]);

  const handleInsertPlaceholder = (placeholder) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = template;
    const before = text.substring(0, start);
    const after = text.substring(end);

    const newText = before + placeholder + after;
    setTemplate(newText);

    // Set cursor position after inserted placeholder
    setTimeout(() => {
      textarea.focus();
      const newPosition = start + placeholder.length;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  };


  const handleReset = () => {
    setTemplate(DEFAULT_TEMPLATE);
    toast.success("Template reset to default");
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await updateSettings({
        ...settings,
        reminderMessageTemplate: template.trim() || null,
      });
      toast.success("Reminder template saved successfully!");
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving template:", error);
      toast.error(`Failed to save template: ${error.message || 'Please try again.'}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <MessageSquare className="h-5 w-5" />
            Reminder Message Template
          </DialogTitle>
          <DialogDescription>
            Customize the default reminder message template used for all customers. Click placeholders to insert them at cursor position.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Loading template...</span>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Placeholders Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Available Placeholders</Label>
                <p className="text-xs text-muted-foreground">
                  Click to insert at cursor
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {PLACEHOLDERS.map((placeholder) => (
                  <TooltipProvider key={placeholder.key}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge
                          onClick={() => handleInsertPlaceholder(placeholder.key)}
                          variant="outline"
                          className="cursor-pointer hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all duration-200 px-3 py-1.5 text-sm font-medium"
                        >
                          {placeholder.label}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="space-y-1">
                          <p className="font-semibold">{placeholder.label}</p>
                          <p className="text-xs">{placeholder.description}</p>
                          <code className="text-xs bg-muted px-1 py-0.5 rounded mt-1 block">
                            {placeholder.key}
                          </code>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
            </div>

            {/* Template Editor */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="template" className="text-base font-semibold">
                  Message Template
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                >
                  Reset to Default
                </Button>
              </div>
              <div className="relative">
                <Textarea
                  ref={textareaRef}
                  id="template"
                  value={template}
                  onChange={(e) => setTemplate(e.target.value)}
                  placeholder={DEFAULT_TEMPLATE}
                  rows={12}
                  className="font-mono text-sm min-h-[200px]"
                />
              </div>
            </div>

            {/* Preview Section */}
            <div className="space-y-2">
              <Label className="text-base font-semibold">Preview</Label>
              <div className="bg-muted/30 rounded-lg p-4 border-2 border-dashed border-muted-foreground/20">
                <TemplatePreview template={template || DEFAULT_TEMPLATE} />
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
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Template"
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
