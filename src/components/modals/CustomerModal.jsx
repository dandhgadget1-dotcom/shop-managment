"use client";

import { useState, useEffect } from "react";
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
import { Upload, User, IdCard, MapPin, Phone as PhoneIcon, Loader2 } from "lucide-react";
import { useShop } from "@/context/ShopContext";
import { uploadAPI } from "@/lib/api";
import FileUpload from "@/components/ui/file-upload";
import { formatPakistanPhone, formatIdNumber } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";

export default function CustomerModal({ open, onOpenChange, customerId = null }) {
  const { addCustomer, updateCustomer, getCustomerById } = useShop();
  const toast = useToast();
  const [formData, setFormData] = useState({
    fullName: "",
    idNo: "",
    contactInfo: "",
    address: "",
    idFront: null,
    idBack: null,
  });

  const [idFrontPreview, setIdFrontPreview] = useState(null);
  const [idBackPreview, setIdBackPreview] = useState(null);
  const [idFrontPublicId, setIdFrontPublicId] = useState(null);
  const [idBackPublicId, setIdBackPublicId] = useState(null);
  const [idFrontLoading, setIdFrontLoading] = useState(false);
  const [idBackLoading, setIdBackLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load form data when modal opens - this is a valid use case for useEffect
  useEffect(() => {
    if (customerId) {
      const customer = getCustomerById(customerId);
      if (customer) {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        setFormData({
          fullName: customer.fullName || "",
          idNo: customer.idNo || "",
          contactInfo: customer.contactInfo || "",
          address: customer.address || "",
          idFront: customer.idFront || null,
          idBack: customer.idBack || null,
        });
        setIdFrontPreview(customer.idFrontPreview || customer.idFront || null);
        setIdBackPreview(customer.idBackPreview || customer.idBack || null);
        setIdFrontPublicId(customer.idFrontPublicId || null);
        setIdBackPublicId(customer.idBackPublicId || null);
      }
    } else {
      // Reset form for new customer
      // eslint-disable-next-line react-hooks/exhaustive-deps
      setFormData({
        fullName: "",
        idNo: "",
        contactInfo: "",
        address: "",
        idFront: null,
        idBack: null,
      });
      setIdFrontPreview(null);
      setIdBackPreview(null);
      setIdFrontPublicId(null);
      setIdBackPublicId(null);
      setIdFrontLoading(false);
      setIdBackLoading(false);
      setIsSaving(false);
    }
  }, [customerId, open, getCustomerById]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;
    
    // Format ID number
    if (name === "idNo") {
      formattedValue = formatIdNumber(value);
    }
    // Format phone number
    else if (name === "contactInfo") {
      formattedValue = formatPakistanPhone(value);
    }
    
    setFormData((prev) => ({
      ...prev,
      [name]: formattedValue,
    }));
  };

  const handleFileChange = async (file, side) => {
    if (!file) return;

    // Set loading state
    if (side === "idFront") {
      setIdFrontLoading(true);
    } else {
      setIdBackLoading(true);
    }

    try {
      // Create preview immediately
      const reader = new FileReader();
      reader.onloadend = () => {
        if (side === "idFront") {
          setIdFrontPreview(reader.result);
        } else {
          setIdBackPreview(reader.result);
        }
      };
      reader.readAsDataURL(file);

      // Delete old image from Cloudinary if exists
      const oldPublicId = side === "idFront" ? idFrontPublicId : idBackPublicId;
      if (oldPublicId) {
        try {
          await uploadAPI.delete(oldPublicId);
        } catch (error) {
          console.warn("Failed to delete old image:", error);
        }
      }

      // Upload new image immediately
      const base64 = await fileToBase64(file);
      const folder = `customers/${customerId || `temp-${Date.now()}`}/${side === "idFront" ? "id-front" : "id-back"}`;
      const result = await uploadAPI.upload(base64, folder);

      // Update state with Cloudinary URL and publicId
      if (side === "idFront") {
        setFormData((prev) => ({
          ...prev,
          idFront: result.url,
        }));
        setIdFrontPublicId(result.publicId);
        setIdFrontPreview(result.url);
      } else {
        setFormData((prev) => ({
          ...prev,
          idBack: result.url,
        }));
        setIdBackPublicId(result.publicId);
        setIdBackPreview(result.url);
      }
    } catch (error) {
      console.error(`Error uploading ${side}:`, error);
      alert(`Failed to upload image: ${error.message}`);
      // Reset preview on error
      if (side === "idFront") {
        setIdFrontPreview(null);
        setFormData((prev) => ({ ...prev, idFront: null }));
      } else {
        setIdBackPreview(null);
        setFormData((prev) => ({ ...prev, idBack: null }));
      }
    } finally {
      if (side === "idFront") {
        setIdFrontLoading(false);
      } else {
        setIdBackLoading(false);
      }
    }
  };

  const handleDeleteImage = async (side) => {
    const publicId = side === "idFront" ? idFrontPublicId : idBackPublicId;
    if (publicId) {
      try {
        await uploadAPI.delete(publicId);
      } catch (error) {
        console.warn("Failed to delete image from Cloudinary:", error);
      }
    }

    if (side === "idFront") {
      setFormData((prev) => ({ ...prev, idFront: null }));
      setIdFrontPreview(null);
      setIdFrontPublicId(null);
    } else {
      setFormData((prev) => ({ ...prev, idBack: null }));
      setIdBackPreview(null);
      setIdBackPublicId(null);
    }
  };

  // Helper function to convert File to base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      // Check file size (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB in bytes
      if (file.size > maxSize) {
        reject(new Error(`File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size of 10MB. Please compress the image or use a smaller file.`));
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        try {
          const result = reader.result;
          if (!result || typeof result !== 'string') {
            reject(new Error('Failed to read file as base64'));
            return;
          }
          resolve(result);
        } catch (error) {
          reject(new Error(`Error processing file: ${error.message}`));
        }
      };
      reader.onerror = (error) => {
        reject(new Error(`Failed to read file: ${error.message || 'Unknown error'}`));
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check if any images are still uploading
    if (idFrontLoading || idBackLoading) {
      toast.warning("Please wait for all images to finish uploading before saving.");
      return;
    }

    setIsSaving(true);

    try {
      const customerData = {
        ...formData,
        idFrontPublicId: idFrontPublicId,
        idBackPublicId: idBackPublicId,
        idFrontPreview: idFrontPreview || formData.idFront,
        idBackPreview: idBackPreview || formData.idBack,
      };

      if (customerId) {
        await updateCustomer(customerId, customerData);
        toast.success("Customer updated successfully!");
      } else {
        await addCustomer(customerData);
        toast.success("Customer added successfully!");
      }

      onOpenChange(false);
      // Reset form
      setFormData({
        fullName: "",
        idNo: "",
        contactInfo: "",
        address: "",
        idFront: null,
        idBack: null,
      });
      setIdFrontPreview(null);
      setIdBackPreview(null);
      setIdFrontPublicId(null);
      setIdBackPublicId(null);
    } catch (error) {
      console.error("Error saving customer:", error);
      const errorMessage = error.message || 'Please try again.';
      toast.error(`Failed to save customer: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[95vh] overflow-y-auto w-[95vw] sm:w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {customerId ? "Edit Customer" : "Add Customer Details"}
          </DialogTitle>
          <DialogDescription>
            Enter the customer&apos;s personal information and ID documents
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              name="fullName"
              value={formData.fullName}
              onChange={handleInputChange}
              placeholder="Enter customer's full name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="idNo">ID Number</Label>
            <Input
              id="idNo"
              name="idNo"
              value={formData.idNo}
              onChange={handleInputChange}
              placeholder="Enter ID number"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactInfo" className="flex items-center gap-2">
              <PhoneIcon className="h-4 w-4" />
              Contact Information
            </Label>
            <Input
              id="contactInfo"
              name="contactInfo"
              value={formData.contactInfo}
              onChange={handleInputChange}
              placeholder="Enter phone number or email"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Address
            </Label>
            <Textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              placeholder="Enter complete address"
              rows={3}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <FileUpload
              id="idFront"
              label={
                <span className="flex items-center gap-2">
                  <IdCard className="h-4 w-4" />
                  Front Side of ID
                </span>
              }
              accept="image/*"
              value={formData.idFront}
              onChange={(file) => handleFileChange(file, "idFront")}
              preview={idFrontPreview}
              onPreviewChange={setIdFrontPreview}
              isLoading={idFrontLoading}
              onDelete={() => handleDeleteImage("idFront")}
              required={!customerId}
            />

            <FileUpload
              id="idBack"
              label={
                <span className="flex items-center gap-2">
                  <IdCard className="h-4 w-4" />
                  Back Side of ID
                </span>
              }
              accept="image/*"
              value={formData.idBack}
              onChange={(file) => handleFileChange(file, "idBack")}
              preview={idBackPreview}
              onPreviewChange={setIdBackPreview}
              isLoading={idBackLoading}
              onDelete={() => handleDeleteImage("idBack")}
              required={!customerId}
            />
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button type="submit" className="w-full sm:w-auto" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  {customerId ? "Update" : "Save"} Customer
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

