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
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  User,
  IdCard,
  MapPin,
  Phone,
  UserPlus,
  Smartphone,
  ChevronRight,
  ChevronLeft,
  Check,
  Loader2,
} from "lucide-react";
import { useShop } from "@/context/ShopContext";
import { uploadAPI } from "@/lib/api";
import { formatPakistanPhone, formatIdNumber } from "@/lib/utils";
import FileUpload from "@/components/ui/file-upload";
import { uploadAPI } from "@/lib/api";

export default function AddCustomerWizard({ open, onOpenChange }) {
  const { addCustomer } = useShop();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  // Step 1: Customer Details
  const [customerData, setCustomerData] = useState({
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

  // Step 2: Supporting Person Details
  const [supportingPersonData, setSupportingPersonData] = useState({
    fullName: "",
    idNo: "",
    contactInfo: "",
    address: "",
    idFront: null,
    idBack: null,
  });

  const [spIdFrontPreview, setSpIdFrontPreview] = useState(null);
  const [spIdBackPreview, setSpIdBackPreview] = useState(null);
  const [spIdFrontPublicId, setSpIdFrontPublicId] = useState(null);
  const [spIdBackPublicId, setSpIdBackPublicId] = useState(null);
  const [spIdFrontLoading, setSpIdFrontLoading] = useState(false);
  const [spIdBackLoading, setSpIdBackLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Step 3: Phone Details
  const [phoneData, setPhoneData] = useState({
    name: "",
    model: "",
    imeiNo: "",
    imeiNo2: "",
    price: "",
  });

  // Reset all data when modal closes
  useEffect(() => {
    if (!open) {
      setCurrentStep(1);
      setCustomerData({
        fullName: "",
        idNo: "",
        contactInfo: "",
        address: "",
        idFront: null,
        idBack: null,
      });
      setSupportingPersonData({
        fullName: "",
        idNo: "",
        contactInfo: "",
        address: "",
        idFront: null,
        idBack: null,
      });
      setPhoneData({
        name: "",
        model: "",
        imeiNo: "",
        imeiNo2: "",
        price: "",
      });
      setIdFrontPreview(null);
      setIdBackPreview(null);
      setIdFrontPublicId(null);
      setIdBackPublicId(null);
      setIdFrontLoading(false);
      setIdBackLoading(false);
      setSpIdFrontPreview(null);
      setSpIdBackPreview(null);
      setSpIdFrontPublicId(null);
      setSpIdBackPublicId(null);
      setSpIdFrontLoading(false);
      setSpIdBackLoading(false);
      setIsSaving(false);
    }
  }, [open]);

  const handleCustomerInputChange = (e) => {
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
    
    setCustomerData((prev) => ({
      ...prev,
      [name]: formattedValue,
    }));
  };

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const maxSize = 10 * 1024 * 1024;
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

  const handleCustomerFileChange = async (file, side) => {
    if (!file) return;

    if (side === "idFront") {
      setIdFrontLoading(true);
    } else {
      setIdBackLoading(true);
    }

    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (side === "idFront") {
          setIdFrontPreview(reader.result);
        } else {
          setIdBackPreview(reader.result);
        }
      };
      reader.readAsDataURL(file);

      const oldPublicId = side === "idFront" ? idFrontPublicId : idBackPublicId;
      if (oldPublicId) {
        try {
          await uploadAPI.delete(oldPublicId);
        } catch (error) {
          console.warn("Failed to delete old image:", error);
        }
      }

      const base64 = await fileToBase64(file);
      const folder = `customers/temp-${Date.now()}/${side === "idFront" ? "id-front" : "id-back"}`;
      const result = await uploadAPI.upload(base64, folder);

      if (side === "idFront") {
        setCustomerData((prev) => ({
          ...prev,
          idFront: result.url,
        }));
        setIdFrontPublicId(result.publicId);
        setIdFrontPreview(result.url);
      } else {
        setCustomerData((prev) => ({
          ...prev,
          idBack: result.url,
        }));
        setIdBackPublicId(result.publicId);
        setIdBackPreview(result.url);
      }
    } catch (error) {
      console.error(`Error uploading ${side}:`, error);
      alert(`Failed to upload image: ${error.message}`);
      if (side === "idFront") {
        setIdFrontPreview(null);
        setCustomerData((prev) => ({ ...prev, idFront: null }));
      } else {
        setIdBackPreview(null);
        setCustomerData((prev) => ({ ...prev, idBack: null }));
      }
    } finally {
      if (side === "idFront") {
        setIdFrontLoading(false);
      } else {
        setIdBackLoading(false);
      }
    }
  };

  const handleSupportingPersonInputChange = (e) => {
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
    
    setSupportingPersonData((prev) => ({
      ...prev,
      [name]: formattedValue,
    }));
  };

  const handleSupportingPersonFileChange = async (file, side) => {
    if (!file) return;

    if (side === "idFront") {
      setSpIdFrontLoading(true);
    } else {
      setSpIdBackLoading(true);
    }

    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (side === "idFront") {
          setSpIdFrontPreview(reader.result);
        } else {
          setSpIdBackPreview(reader.result);
        }
      };
      reader.readAsDataURL(file);

      const oldPublicId = side === "idFront" ? spIdFrontPublicId : spIdBackPublicId;
      if (oldPublicId) {
        try {
          await uploadAPI.delete(oldPublicId);
        } catch (error) {
          console.warn("Failed to delete old image:", error);
        }
      }

      const base64 = await fileToBase64(file);
      const folder = `customers/temp-${Date.now()}/supporting-person/${side === "idFront" ? "id-front" : "id-back"}`;
      const result = await uploadAPI.upload(base64, folder);

      if (side === "idFront") {
        setSupportingPersonData((prev) => ({
          ...prev,
          idFront: result.url,
        }));
        setSpIdFrontPublicId(result.publicId);
        setSpIdFrontPreview(result.url);
      } else {
        setSupportingPersonData((prev) => ({
          ...prev,
          idBack: result.url,
        }));
        setSpIdBackPublicId(result.publicId);
        setSpIdBackPreview(result.url);
      }
    } catch (error) {
      console.error(`Error uploading ${side}:`, error);
      alert(`Failed to upload image: ${error.message}`);
      if (side === "idFront") {
        setSpIdFrontPreview(null);
        setSupportingPersonData((prev) => ({ ...prev, idFront: null }));
      } else {
        setSpIdBackPreview(null);
        setSupportingPersonData((prev) => ({ ...prev, idBack: null }));
      }
    } finally {
      if (side === "idFront") {
        setSpIdFrontLoading(false);
      } else {
        setSpIdBackLoading(false);
      }
    }
  };

  const handleDeleteImage = async (type, side) => {
    const publicId = type === "customer" 
      ? (side === "idFront" ? idFrontPublicId : idBackPublicId)
      : (side === "idFront" ? spIdFrontPublicId : spIdBackPublicId);

    if (publicId) {
      try {
        await uploadAPI.delete(publicId);
      } catch (error) {
        console.warn("Failed to delete image from Cloudinary:", error);
      }
    }

    if (type === "customer") {
      if (side === "idFront") {
        setCustomerData((prev) => ({ ...prev, idFront: null }));
        setIdFrontPreview(null);
        setIdFrontPublicId(null);
      } else {
        setCustomerData((prev) => ({ ...prev, idBack: null }));
        setIdBackPreview(null);
        setIdBackPublicId(null);
      }
    } else {
      if (side === "idFront") {
        setSupportingPersonData((prev) => ({ ...prev, idFront: null }));
        setSpIdFrontPreview(null);
        setSpIdFrontPublicId(null);
      } else {
        setSupportingPersonData((prev) => ({ ...prev, idBack: null }));
        setSpIdBackPreview(null);
        setSpIdBackPublicId(null);
      }
    }
  };

  const handlePhoneInputChange = (e) => {
    const { name, value } = e.target;
    setPhoneData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleStep1Submit = (e) => {
    e.preventDefault();
    // Validate step 1
    if (
      !customerData.fullName ||
      !customerData.idNo ||
      !customerData.contactInfo ||
      !customerData.address ||
      !customerData.idFront ||
      !customerData.idBack
    ) {
      return;
    }
    setCurrentStep(2);
  };

  const handleStep2Submit = (e) => {
    e.preventDefault();
    // Validate step 2
    if (
      !supportingPersonData.fullName ||
      !supportingPersonData.idNo ||
      !supportingPersonData.contactInfo ||
      !supportingPersonData.address ||
      !supportingPersonData.idFront ||
      !supportingPersonData.idBack
    ) {
      return;
    }
    setCurrentStep(3);
  };

  // Helper function to convert File to base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };


  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    // Validate step 3
    if (!phoneData.name || !phoneData.model || !phoneData.imeiNo || !phoneData.price) {
      return;
    }

    // Check if any images are still uploading
    if (idFrontLoading || idBackLoading || spIdFrontLoading || spIdBackLoading) {
      alert("Please wait for all images to finish uploading before saving.");
      return;
    }

    setIsSaving(true);

    try {
      // Save all data with already uploaded Cloudinary URLs
      const newCustomer = {
        ...customerData,
        idFrontPublicId: idFrontPublicId,
        idBackPublicId: idBackPublicId,
        idFrontPreview: idFrontPreview || customerData.idFront,
        idBackPreview: idBackPreview || customerData.idBack,
        supportingPerson: {
          ...supportingPersonData,
          idFrontPublicId: spIdFrontPublicId,
          idBackPublicId: spIdBackPublicId,
          idFrontPreview: spIdFrontPreview || supportingPersonData.idFront,
          idBackPreview: spIdBackPreview || supportingPersonData.idBack,
        },
        phone: phoneData,
      };

      await addCustomer(newCustomer);
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving customer:", error);
      alert(`Failed to save customer: ${error.message || 'Please try again.'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const renderStepIndicator = () => {
    return (
      <div className="flex items-center justify-between mb-4 sm:mb-6 gap-2">
        {[1, 2, 3].map((step) => (
          <div key={step} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div
                className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border-2 ${
                  currentStep === step
                    ? "bg-primary text-primary-foreground border-primary"
                    : currentStep > step
                    ? "bg-green-500 text-white border-green-500"
                    : "bg-background border-muted-foreground text-muted-foreground"
                }`}
              >
                {currentStep > step ? (
                  <Check className="h-4 w-4 sm:h-5 sm:w-5" />
                ) : (
                  <span className="font-semibold text-sm sm:text-base">{step}</span>
                )}
              </div>
              <span
                className={`text-[10px] sm:text-xs mt-1 sm:mt-2 text-center ${
                  currentStep === step
                    ? "text-foreground font-medium"
                    : "text-muted-foreground"
                }`}
              >
                {step === 1
                  ? "Customer"
                  : step === 2
                  ? "Supporting"
                  : "Phone"}
              </span>
            </div>
            {step < totalSteps && (
              <div
                className={`h-0.5 flex-1 mx-1 sm:mx-2 ${
                  currentStep > step ? "bg-green-500" : "bg-muted"
                }`}
              />
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-[95vw] sm:!max-w-[95vw] md:!max-w-[95vw] lg:!max-w-[95vw] w-[95vw] max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Add New Customer
          </DialogTitle>
          <DialogDescription>
            Complete all steps to add a new customer with their details
          </DialogDescription>
        </DialogHeader>

        {renderStepIndicator()}

        <Separator className="mb-6" />

        {/* Step 1: Customer Details */}
        {currentStep === 1 && (
          <form onSubmit={handleStep1Submit} className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="default">Step 1 of 3</Badge>
                <h3 className="text-lg font-semibold">Customer Details</h3>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  name="fullName"
                  value={customerData.fullName}
                  onChange={handleCustomerInputChange}
                  placeholder="Enter customer's full name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="idNo">ID Number</Label>
                <Input
                  id="idNo"
                  name="idNo"
                  value={customerData.idNo}
                  onChange={handleCustomerInputChange}
                  placeholder="xxxxx-xxxxxxx-x"
                  maxLength={15}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactInfo" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Contact Information
                </Label>
                <Input
                  id="contactInfo"
                  name="contactInfo"
                  value={customerData.contactInfo}
                  onChange={handleCustomerInputChange}
                  placeholder="03XX-XXXXXXX"
                  maxLength={12}
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
                  value={customerData.address}
                  onChange={handleCustomerInputChange}
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
                  value={customerData.idFront}
                  onChange={(file) => handleCustomerFileChange(file, "idFront")}
                  preview={idFrontPreview}
                  onPreviewChange={setIdFrontPreview}
                  isLoading={idFrontLoading}
                  onDelete={() => handleDeleteImage("customer", "idFront")}
                  required
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
                  value={customerData.idBack}
                  onChange={(file) => handleCustomerFileChange(file, "idBack")}
                  preview={idBackPreview}
                  onPreviewChange={setIdBackPreview}
                  isLoading={idBackLoading}
                  onDelete={() => handleDeleteImage("customer", "idBack")}
                  required
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button type="submit" className="w-full sm:w-auto">
                Next: Supporting Person
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </form>
        )}

        {/* Step 2: Supporting Person Details */}
        {currentStep === 2 && (
          <form onSubmit={handleStep2Submit} className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="default">Step 2 of 3</Badge>
                <h3 className="text-lg font-semibold">Supporting Person Details</h3>
              </div>

              <div className="space-y-2">
                <Label htmlFor="spFullName">Full Name</Label>
                <Input
                  id="spFullName"
                  name="fullName"
                  value={supportingPersonData.fullName}
                  onChange={handleSupportingPersonInputChange}
                  placeholder="Enter supporting person's full name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="spIdNo">ID Number</Label>
                <Input
                  id="spIdNo"
                  name="idNo"
                  value={supportingPersonData.idNo}
                  onChange={handleSupportingPersonInputChange}
                  placeholder="Enter ID number"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="spContactInfo" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Contact Information
                </Label>
                <Input
                  id="spContactInfo"
                  name="contactInfo"
                  value={supportingPersonData.contactInfo}
                  onChange={handleSupportingPersonInputChange}
                  placeholder="Enter phone number or email"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="spAddress" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Address
                </Label>
                <Textarea
                  id="spAddress"
                  name="address"
                  value={supportingPersonData.address}
                  onChange={handleSupportingPersonInputChange}
                  placeholder="Enter complete address"
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <FileUpload
                  id="spIdFront"
                  label={
                    <span className="flex items-center gap-2">
                      <IdCard className="h-4 w-4" />
                      Front Side of ID
                    </span>
                  }
                  accept="image/*"
                  value={supportingPersonData.idFront}
                  onChange={(file) => handleSupportingPersonFileChange(file, "idFront")}
                  preview={spIdFrontPreview}
                  onPreviewChange={setSpIdFrontPreview}
                  isLoading={spIdFrontLoading}
                  onDelete={() => handleDeleteImage("supportingPerson", "idFront")}
                  required
                />

                <FileUpload
                  id="spIdBack"
                  label={
                    <span className="flex items-center gap-2">
                      <IdCard className="h-4 w-4" />
                      Back Side of ID
                    </span>
                  }
                  accept="image/*"
                  value={supportingPersonData.idBack}
                  onChange={(file) => handleSupportingPersonFileChange(file, "idBack")}
                  preview={spIdBackPreview}
                  onPreviewChange={setSpIdBackPreview}
                  isLoading={spIdBackLoading}
                  onDelete={() => handleDeleteImage("supportingPerson", "idBack")}
                  required
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between gap-2 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep(1)}
                className="w-full sm:w-auto"
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>
              <Button type="submit" className="w-full sm:w-auto">
                Next: Phone Details
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </form>
        )}

        {/* Step 3: Phone Details */}
        {currentStep === 3 && (
          <form onSubmit={handleFinalSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="default">Step 3 of 3</Badge>
                <h3 className="text-lg font-semibold">Phone Details</h3>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phoneName">Phone Name</Label>
                <Input
                  id="phoneName"
                  name="name"
                  value={phoneData.name}
                  onChange={handlePhoneInputChange}
                  placeholder="e.g., iPhone 15 Pro"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phoneModel">Model</Label>
                <Input
                  id="phoneModel"
                  name="model"
                  value={phoneData.model}
                  onChange={handlePhoneInputChange}
                  placeholder="e.g., A2848"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="imeiNo">IMEI Number 1</Label>
                <Input
                  id="imeiNo"
                  name="imeiNo"
                  value={phoneData.imeiNo}
                  onChange={handlePhoneInputChange}
                  placeholder="Enter first IMEI number"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="imeiNo2">IMEI Number 2</Label>
                <Input
                  id="imeiNo2"
                  name="imeiNo2"
                  value={phoneData.imeiNo2}
                  onChange={handlePhoneInputChange}
                  placeholder="Enter second IMEI number (optional)"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price" className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  Price
                </Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  value={phoneData.price}
                  onChange={handlePhoneInputChange}
                  placeholder="Enter phone price"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between gap-2 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep(2)}
                className="w-full sm:w-auto"
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>
              <Button type="submit" className="w-full sm:w-auto" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Complete & Save
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

