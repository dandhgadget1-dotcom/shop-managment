"use client";

import { useRef, useState } from "react";
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function FileUpload({
  id,
  label,
  accept = "image/*",
  value,
  onChange,
  preview,
  onPreviewChange,
  required = false,
  className,
  isLoading = false,
  onDelete,
}) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith("image/")) {
        handleFileSelect(file);
      }
    }
  };

  const handleFileSelect = (file) => {
    onChange(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      onPreviewChange(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleRemove = async (e) => {
    e.stopPropagation();
    if (onDelete) {
      await onDelete();
    }
    onChange(null);
    onPreviewChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={cn("space-y-1", className)}>
      {label && (
        <label htmlFor={id} className="text-xs font-medium">
          {label}
        </label>
      )}
      <div
        onClick={handleClick}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative border-2 border-dashed rounded-md p-2 transition-all cursor-pointer group",
          "hover:border-primary hover:bg-primary/5",
          isDragging && "border-primary bg-primary/10 scale-[1.02]",
          preview && "border-primary/50 bg-primary/5",
          !preview && "border-muted-foreground/25"
        )}
      >
        <input
          ref={fileInputRef}
          id={id}
          type="file"
          accept={accept}
          onChange={handleInputChange}
          className="hidden"
          required={required && !preview}
        />

        {isLoading ? (
          <div className="relative w-full h-16 rounded overflow-hidden border bg-muted animate-pulse">
            <div className="w-full h-full flex items-center justify-center">
              <Loader2 className="h-4 w-4 text-primary animate-spin" />
            </div>
            <p className="text-[9px] text-center text-muted-foreground mt-0.5">
              Uploading...
            </p>
          </div>
        ) : preview ? (
          <div className="relative">
            <div className="relative w-full h-16 rounded overflow-hidden border bg-muted">
              <img
                src={preview}
                alt="Preview"
                className="w-full h-full object-contain"
              />
              <button
                type="button"
                onClick={handleRemove}
                className="absolute top-0.5 right-0.5 p-0.5 bg-destructive text-destructive-foreground rounded-full shadow-md hover:bg-destructive/90 transition-colors"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </div>
            <p className="text-[9px] text-center text-muted-foreground mt-0.5">
              Click to replace
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center space-y-1 py-1.5">
            <div className="p-1 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
              {isDragging ? (
                <Upload className="h-3.5 w-3.5 text-primary animate-bounce" />
              ) : (
                <ImageIcon className="h-3.5 w-3.5 text-primary" />
              )}
            </div>
            <div className="space-y-0">
              <p className="text-[10px] font-medium">
                {isDragging ? "Drop here" : "Click or drag"}
              </p>
              <p className="text-[9px] text-muted-foreground">
                ID Card
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

