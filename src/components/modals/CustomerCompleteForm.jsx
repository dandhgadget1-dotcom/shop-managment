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
import {
  User,
  IdCard,
  MapPin,
  Phone,
  UserPlus,
  Smartphone,
  Upload,
  DollarSign,
  X,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Percent,
  Calendar,
  Loader2,
} from "lucide-react";
import { formatPakistanPhone, formatIdNumber } from "@/lib/utils";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useShop } from "@/context/ShopContext";
import FileUpload from "@/components/ui/file-upload";
import { cn } from "@/lib/utils";
import { uploadAPI } from "@/lib/api";
import { useToast } from "@/components/ui/toast";

export default function CustomerCompleteForm({ open, onOpenChange, customerId = null, activeSection = null, onSave = null }) {
  const { addCustomer, updateCustomer, getCustomerById, refreshCustomers } = useShop();
  const toast = useToast();
  
  // Section collapse/expand state - if activeSection is provided, only that section is expanded
  const [expandedSections, setExpandedSections] = useState(() => {
    if (activeSection) {
      return {
        customer: activeSection === "customer",
        supportingPerson: activeSection === "supportingPerson",
        phone: activeSection === "phone",
        payment: activeSection === "payment",
      };
    }
    return {
      customer: true,
      supportingPerson: true,
      phone: true,
      payment: true,
    };
  });

  const [showPaymentAfterSave, setShowPaymentAfterSave] = useState(false);

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Customer Details
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

  // Supporting Person Details
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

  // Phone Details
  const [phoneData, setPhoneData] = useState({
    name: "",
    model: "",
    imeiNo: "",
    price: "",
  });

  // Payment Details
  const [paymentType, setPaymentType] = useState("direct");
  const [paymentData, setPaymentData] = useState({
    downPayment: "",
    remainingAmount: "",
    percentage: "",
    numberOfInstallments: "",
    installmentDate: "",
  });
  const [calculatedAmount, setCalculatedAmount] = useState({
    totalWithInterest: 0,
    installmentAmount: 0,
  });

  // Load data when editing
  useEffect(() => {
    if (customerId && open) {
      const customer = getCustomerById(customerId);
      if (customer) {
        // Load customer data
        setCustomerData({
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

        // Load supporting person data
        if (customer.supportingPerson) {
          setSupportingPersonData({
            fullName: customer.supportingPerson.fullName || "",
            idNo: customer.supportingPerson.idNo || "",
            contactInfo: customer.supportingPerson.contactInfo || "",
            address: customer.supportingPerson.address || "",
            idFront: customer.supportingPerson.idFront || null,
            idBack: customer.supportingPerson.idBack || null,
          });
          setSpIdFrontPreview(customer.supportingPerson.idFrontPreview || customer.supportingPerson.idFront || null);
          setSpIdBackPreview(customer.supportingPerson.idBackPreview || customer.supportingPerson.idBack || null);
          setSpIdFrontPublicId(customer.supportingPerson.idFrontPublicId || null);
          setSpIdBackPublicId(customer.supportingPerson.idBackPublicId || null);
        }

        // Load phone data
        if (customer.phone) {
          setPhoneData({
            name: customer.phone.name || "",
            model: customer.phone.model || "",
            imeiNo: customer.phone.imeiNo || "",
            price: customer.phone.price || "",
          });
        }

        // Load payment data
        if (customer.payment) {
          setPaymentType(customer.payment.paymentType || "direct");
          
          // Format date for date input (YYYY-MM-DD)
          let formattedDate = "";
          if (customer.payment.installmentDate) {
            const date = new Date(customer.payment.installmentDate);
            if (!isNaN(date.getTime())) {
              formattedDate = date.toISOString().split('T')[0];
            }
          }
          
          // Convert numberOfInstallments to string for Select component
          const numberOfInstallments = customer.payment.numberOfInstallments 
            ? String(customer.payment.numberOfInstallments) 
            : "";
          
          setPaymentData({
            downPayment: customer.payment.downPayment || "",
            remainingAmount: customer.payment.remainingAmount || "",
            percentage: customer.payment.percentage || "",
            numberOfInstallments: numberOfInstallments,
            installmentDate: formattedDate,
          });
          if (customer.payment.calculatedAmount) {
            setCalculatedAmount(customer.payment.calculatedAmount);
          }
        }
      }
    } else if (!open) {
      // Reset all data when modal closes
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
      setPaymentType("direct");
      setPaymentData({
        downPayment: "",
        remainingAmount: "",
        percentage: "",
        numberOfInstallments: "",
        installmentDate: "",
      });
      setCalculatedAmount({
        totalWithInterest: 0,
        installmentAmount: 0,
      });
      setShowPaymentAfterSave(false);
      // Reset sections when modal closes or opens
      if (activeSection) {
        setExpandedSections({
          customer: activeSection === "customer",
          supportingPerson: activeSection === "supportingPerson",
          phone: activeSection === "phone",
          payment: activeSection === "payment",
        });
      } else {
        setExpandedSections({
          customer: true,
          supportingPerson: true,
          phone: true,
          payment: true,
        });
      }
    }
  }, [customerId, open, getCustomerById, activeSection]);

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

  const handleCustomerFileChange = async (file, side) => {
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
      // Use a temporary folder for new customers, will be moved when customer is saved
      const folder = `customers/${customerId || `temp-${Date.now()}`}/${side === "idFront" ? "id-front" : "id-back"}`;
      const result = await uploadAPI.upload(base64, folder);

      // Update state with Cloudinary URL and publicId
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
      toast.error(`Failed to upload image: ${error.message}`);
      // Reset preview on error
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

    // Set loading state
    if (side === "idFront") {
      setSpIdFrontLoading(true);
    } else {
      setSpIdBackLoading(true);
    }

    try {
      // Create preview immediately
      const reader = new FileReader();
      reader.onloadend = () => {
        if (side === "idFront") {
          setSpIdFrontPreview(reader.result);
        } else {
          setSpIdBackPreview(reader.result);
        }
      };
      reader.readAsDataURL(file);

      // Delete old image from Cloudinary if exists
      const oldPublicId = side === "idFront" ? spIdFrontPublicId : spIdBackPublicId;
      if (oldPublicId) {
        try {
          await uploadAPI.delete(oldPublicId);
        } catch (error) {
          console.warn("Failed to delete old image:", error);
        }
      }

      // Upload new image immediately
      const base64 = await fileToBase64(file);
      // Use a temporary folder for new customers, will be moved when customer is saved
      const folder = `customers/${customerId || `temp-${Date.now()}`}/supporting-person/${side === "idFront" ? "id-front" : "id-back"}`;
      const result = await uploadAPI.upload(base64, folder);

      // Update state with Cloudinary URL and publicId
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
      toast.error(`Failed to upload image: ${error.message}`);
      // Reset preview on error
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

  const handlePhoneInputChange = (e) => {
    const { name, value } = e.target;
    setPhoneData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Payment calculation logic
  const phonePrice = parseFloat(phoneData.price) || 0;

  // Calculate remaining amount when down payment or phone price changes
  useEffect(() => {
    if (paymentType === "installment" && phonePrice > 0) {
      const down = Math.round(parseFloat(paymentData.downPayment) || 0);
      const remaining = Math.round(phonePrice - down);
      const currentRemaining = Math.round(parseFloat(paymentData.remainingAmount) || 0);
      if (remaining !== currentRemaining) {
        setPaymentData((prev) => ({
          ...prev,
          remainingAmount: remaining.toString(),
        }));
      }
    }
  }, [phonePrice, paymentType, paymentData.downPayment, paymentData.remainingAmount]);

  // Calculate installment amounts
  useEffect(() => {
    if (
      paymentType === "installment" &&
      paymentData.remainingAmount &&
      paymentData.percentage &&
      paymentData.numberOfInstallments
    ) {
      const remaining = Math.round(parseFloat(paymentData.remainingAmount) || 0);
      const percentage = parseFloat(paymentData.percentage) || 0;
      const installments = parseInt(paymentData.numberOfInstallments) || 0;

      if (remaining > 0 && percentage >= 0 && installments > 0) {
        const interestAmount = Math.round((remaining * percentage) / 100);
        const totalWithInterest = Math.round(remaining + interestAmount);
        const installmentAmount = Math.ceil(totalWithInterest / installments); // Round up

        setCalculatedAmount({
          totalWithInterest: totalWithInterest,
          installmentAmount: installmentAmount,
        });
      } else {
        setCalculatedAmount({
          totalWithInterest: 0,
          installmentAmount: 0,
        });
      }
    } else if (paymentType === "direct") {
      setCalculatedAmount({
        totalWithInterest: 0,
        installmentAmount: 0,
      });
    }
  }, [paymentData.remainingAmount, paymentData.percentage, paymentData.numberOfInstallments, paymentType]);

  const handlePaymentInputChange = (e) => {
    const { name, value } = e.target;
    setPaymentData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Recalculate remaining amount if down payment changes
    if (name === "downPayment" && paymentType === "installment" && phonePrice > 0) {
      const down = Math.round(parseFloat(value) || 0);
      const remaining = Math.round(phonePrice - down);
      setPaymentData((prev) => ({
        ...prev,
        remainingAmount: remaining.toString(),
      }));
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
          // Validate base64 string
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
    if (idFrontLoading || idBackLoading || spIdFrontLoading || spIdBackLoading) {
      toast.warning("Please wait for all images to finish uploading before saving.");
      return;
    }

    setIsSaving(true);

    try {
      // Prepare payment data
      const paymentInfo = {
        paymentType,
        ...(paymentType === "installment" ? paymentData : {}),
        calculatedAmount: paymentType === "installment" && calculatedAmount.installmentAmount > 0 ? calculatedAmount : null,
      };

      // Prepare complete data with already uploaded Cloudinary URLs
      const completeData = {
        ...customerData,
        idFrontPublicId: idFrontPublicId,
        idBackPublicId: idBackPublicId,
        idFrontPreview: idFrontPreview || customerData.idFront,
        idBackPreview: idBackPreview || customerData.idBack,
        // Only include supportingPerson if at least one field has data
        ...(supportingPersonData.fullName || supportingPersonData.idNo || supportingPersonData.contactInfo || supportingPersonData.address || supportingPersonData.idFront || supportingPersonData.idBack
          ? {
              supportingPerson: {
                ...supportingPersonData,
                idFrontPublicId: spIdFrontPublicId,
                idBackPublicId: spIdBackPublicId,
                idFrontPreview: spIdFrontPreview || supportingPersonData.idFront,
                idBackPreview: spIdBackPreview || supportingPersonData.idBack,
              }
            }
          : {}),
        phone: phoneData,
        payment: paymentInfo,
      };

      if (customerId) {
        const updatedCustomer = await updateCustomer(customerId, completeData);
        toast.success("Customer updated successfully!");
        // Refresh customers list to get latest data from server
        await refreshCustomers();
        onOpenChange(false);
        // Call onSave callback if provided (for showing receipt)
        if (onSave && updatedCustomer) {
          onSave(updatedCustomer);
        }
      } else {
        const newCustomerId = await addCustomer(completeData);
        toast.success("Customer added successfully!");
        // Refresh customers list to get latest data from server
        await refreshCustomers();
        onOpenChange(false);
        // Call onSave callback if provided (for showing receipt)
        if (onSave && newCustomerId) {
          // Get the saved customer after refresh
          const savedCustomer = getCustomerById(newCustomerId);
          if (savedCustomer) {
            onSave(savedCustomer);
          }
        }
      }
    } catch (error) {
      console.error("Error saving customer:", error);
      const errorMessage = error.message || 'Please try again.';
      toast.error(`Failed to save customer: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle image deletion
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

    // Update state
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        showCloseButton={false}
        className="max-w-[95vw]! sm:max-w-[95vw]! md:max-w-[95vw]! lg:max-w-[95vw]! w-[95vw]! max-h-[95vh] overflow-y-auto"
      >
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center  text-lg">
                <User className="h-4 w-4" />
                {customerId ? "Edit Customer" : "Add New Customer"}
              </DialogTitle>
             
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-7 w-7"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Customer Details Section */}
          <div className="border rounded-md overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection("customer")}
              className="w-full flex items-center justify-between px-3 py-2 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold">Customer Details</h3>
              </div>
              {expandedSections.customer ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
            <div
              className={cn(
                "overflow-hidden transition-all duration-300 ease-in-out",
                expandedSections.customer
                  ? "max-h-[2000px] opacity-100"
                  : "max-h-0 opacity-0"
              )}
            >
              <div className="px-3 py-2 space-y-3 border-t">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2.5">
              <div className="space-y-1">
                <Label htmlFor="fullName" className="text-xs">Full Name *</Label>
                <Input
                  id="fullName"
                  name="fullName"
                  value={customerData.fullName}
                  onChange={handleCustomerInputChange}
                  placeholder="Enter customer's full name"
                  className="h-8 text-sm"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="idNo" className="text-xs">ID Number *</Label>
                <Input
                  id="idNo"
                  name="idNo"
                  value={customerData.idNo}
                  onChange={handleCustomerInputChange}
                  placeholder="xxxxx-xxxxxxx-x"
                  maxLength={15}
                  className="h-8 text-sm"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="contactInfo" className="flex items-center gap-1.5 text-xs">
                  <Phone className="h-3 w-3" />
                  Contact Information *
                </Label>
                <Input
                  id="contactInfo"
                  name="contactInfo"
                  value={customerData.contactInfo}
                  onChange={handleCustomerInputChange}
                  placeholder="03XX-XXXXXXX"
                  maxLength={12}
                  className="h-8 text-sm"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="address" className="flex items-center gap-1.5 text-xs">
                  <MapPin className="h-3 w-3" />
                  Address *
                </Label>
                <Input
                  id="address"
                  name="address"
                  value={customerData.address}
                  onChange={handleCustomerInputChange}
                  placeholder="Enter complete address"
                  className="h-8 text-sm"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <FileUpload
                id="idFront"
                label={
                  <span className="flex items-center gap-1.5">
                    <IdCard className="h-3 w-3" />
                    <span className="text-xs">Front Side of ID</span>
                  </span>
                }
                accept="image/*"
                value={customerData.idFront}
                onChange={(file) => handleCustomerFileChange(file, "idFront")}
                preview={idFrontPreview}
                onPreviewChange={setIdFrontPreview}
                isLoading={idFrontLoading}
                onDelete={() => handleDeleteImage("customer", "idFront")}
              />

              <FileUpload
                id="idBack"
                label={
                  <span className="flex items-center gap-1.5">
                    <IdCard className="h-3 w-3" />
                    <span className="text-xs">Back Side of ID</span>
                  </span>
                }
                accept="image/*"
                value={customerData.idBack}
                onChange={(file) => handleCustomerFileChange(file, "idBack")}
                preview={idBackPreview}
                onPreviewChange={setIdBackPreview}
                isLoading={idBackLoading}
                onDelete={() => handleDeleteImage("customer", "idBack")}
              />
            </div>
              </div>
            </div>
          </div>

          {/* Supporting Person Details Section */}
          <div className="border rounded-md overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection("supportingPerson")}
              className="w-full flex items-center justify-between px-3 py-2 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold">Supporting Person Details</h3>
              </div>
              {expandedSections.supportingPerson ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
            <div
              className={cn(
                "overflow-hidden transition-all duration-300 ease-in-out",
                expandedSections.supportingPerson
                  ? "max-h-[2000px] opacity-100"
                  : "max-h-0 opacity-0"
              )}
            >
              <div className="px-3 py-2 space-y-3 border-t">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2.5">
              <div className="space-y-1">
                <Label htmlFor="spFullName" className="text-xs">Full Name</Label>
                <Input
                  id="spFullName"
                  name="fullName"
                  value={supportingPersonData.fullName}
                  onChange={handleSupportingPersonInputChange}
                  placeholder="Enter supporting person's full name"
                  className="h-8 text-sm"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="spIdNo" className="text-xs">ID Number</Label>
                <Input
                  id="spIdNo"
                  name="idNo"
                  value={supportingPersonData.idNo}
                  onChange={handleSupportingPersonInputChange}
                  placeholder="xxxxx-xxxxxxx-x"
                  maxLength={15}
                  className="h-8 text-sm"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="spContactInfo" className="flex items-center gap-1.5 text-xs">
                  <Phone className="h-3 w-3" />
                  Contact Information
                </Label>
                <Input
                  id="spContactInfo"
                  name="contactInfo"
                  value={supportingPersonData.contactInfo}
                  onChange={handleSupportingPersonInputChange}
                  placeholder="Enter phone number or email"
                  className="h-8 text-sm"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="spAddress" className="flex items-center gap-1.5 text-xs">
                  <MapPin className="h-3 w-3" />
                  Address
                </Label>
                <Input
                  id="spAddress"
                  name="address"
                  value={supportingPersonData.address}
                  onChange={handleSupportingPersonInputChange}
                  placeholder="Enter complete address"
                  className="h-8 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <FileUpload
                id="spIdFront"
                label={
                  <span className="flex items-center gap-1.5">
                    <IdCard className="h-3 w-3" />
                    <span className="text-xs">Front Side of ID</span>
                  </span>
                }
                accept="image/*"
                value={supportingPersonData.idFront}
                onChange={(file) => handleSupportingPersonFileChange(file, "idFront")}
                preview={spIdFrontPreview}
                onPreviewChange={setSpIdFrontPreview}
                isLoading={spIdFrontLoading}
                onDelete={() => handleDeleteImage("supportingPerson", "idFront")}
              />

              <FileUpload
                id="spIdBack"
                label={
                  <span className="flex items-center gap-1.5">
                    <IdCard className="h-3 w-3" />
                    <span className="text-xs">Back Side of ID</span>
                  </span>
                }
                accept="image/*"
                value={supportingPersonData.idBack}
                onChange={(file) => handleSupportingPersonFileChange(file, "idBack")}
                preview={spIdBackPreview}
                onPreviewChange={setSpIdBackPreview}
                isLoading={spIdBackLoading}
                onDelete={() => handleDeleteImage("supportingPerson", "idBack")}
              />
            </div>
              </div>
            </div>
          </div>

          {/* Phone Details Section */}
          <div className="border rounded-md overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection("phone")}
              className="w-full flex items-center justify-between px-3 py-2 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold">Phone Details</h3>
              </div>
              {expandedSections.phone ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
            <div
              className={cn(
                "overflow-hidden transition-all duration-300 ease-in-out",
                expandedSections.phone
                  ? "max-h-[2000px] opacity-100"
                  : "max-h-0 opacity-0"
              )}
            >
              <div className="px-3 py-2 space-y-3 border-t">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  <div className="space-y-1">
                    <Label htmlFor="phoneName" className="text-xs">Phone Name *</Label>
                    <Input
                      id="phoneName"
                      name="name"
                      value={phoneData.name}
                      onChange={handlePhoneInputChange}
                      placeholder="e.g., iPhone 15 Pro"
                      className="h-8 text-sm"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="phoneModel" className="text-xs">Model *</Label>
                    <Input
                      id="phoneModel"
                      name="model"
                      value={phoneData.model}
                      onChange={handlePhoneInputChange}
                      placeholder="e.g., A2848"
                      className="h-8 text-sm"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="imeiNo" className="text-xs">IMEI Number *</Label>
                    <Input
                      id="imeiNo"
                      name="imeiNo"
                      value={phoneData.imeiNo}
                      onChange={handlePhoneInputChange}
                      placeholder="Enter IMEI number"
                      className="h-8 text-sm"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="price" className="flex items-center gap-1.5 text-xs">
                      <DollarSign className="h-3 w-3" />
                      Price (Rs.) *
                    </Label>
                    <Input
                      id="price"
                      name="price"
                      type="number"
                      value={phoneData.price}
                      onChange={handlePhoneInputChange}
                      placeholder="Enter phone price"
                      min="0"
                      step="1"
                      className="h-8 text-sm"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Details Section */}
          <div className="border rounded-md overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection("payment")}
              className="w-full flex items-center justify-between px-3 py-2 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold">Payment Details</h3>
              </div>
              {expandedSections.payment ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
            <div
              className={cn(
                "overflow-hidden transition-all duration-300 ease-in-out",
                expandedSections.payment
                  ? "max-h-[2000px] opacity-100"
                  : "max-h-0 opacity-0"
              )}
            >
              <div className="px-3 py-2 space-y-3 border-t">
                <div className="space-y-3">
                  <Label>Payment Type</Label>
                  <RadioGroup value={paymentType} onValueChange={setPaymentType}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="direct" id="direct" />
                      <Label htmlFor="direct" className="cursor-pointer text-sm">
                        Direct Purchase
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="installment" id="installment" />
                      <Label htmlFor="installment" className="cursor-pointer text-sm">
                        Installment Plan
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {paymentType === "installment" && (
                  <>
                    <div className="space-y-1">
                      <Label htmlFor="downPayment" className="flex items-center gap-1.5 text-xs">
                        <DollarSign className="h-3 w-3" />
                        Down Payment (Rs.)
                      </Label>
                      <Input
                        id="downPayment"
                        name="downPayment"
                        type="number"
                        value={paymentData.downPayment}
                        onChange={handlePaymentInputChange}
                        placeholder="Enter down payment amount"
                        min="0"
                        step="1"
                        className="h-8 text-sm"
                        required={paymentType === "installment"}
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="remainingAmount" className="text-xs">Remaining Amount (Rs.)</Label>
                      <Input
                        id="remainingAmount"
                        name="remainingAmount"
                        type="number"
                        value={paymentData.remainingAmount}
                        placeholder="Calculated automatically"
                        className="h-8 text-sm"
                        readOnly
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="percentage" className="flex items-center gap-1.5 text-xs">
                        <Percent className="h-3 w-3" />
                        Interest Percentage (%)
                      </Label>
                      <Input
                        id="percentage"
                        name="percentage"
                        type="number"
                        value={paymentData.percentage}
                        onChange={handlePaymentInputChange}
                        placeholder="Enter interest percentage"
                        min="0"
                        step="1"
                        className="h-8 text-sm"
                        required={paymentType === "installment"}
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="numberOfInstallments" className="text-xs">Number of Installments</Label>
                      <Select
                        value={paymentData.numberOfInstallments}
                        onValueChange={(value) =>
                          setPaymentData((prev) => ({ ...prev, numberOfInstallments: value }))
                        }
                      >
                        <SelectTrigger id="numberOfInstallments" className="h-8 text-sm">
                          <SelectValue placeholder="Select number of installments" />
                        </SelectTrigger>
                        <SelectContent>
                          {[3, 6, 9, 12, 18, 24].map((num) => (
                            <SelectItem key={num} value={num.toString()}>
                              {num} months
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="installmentDate" className="flex items-center gap-1.5 text-xs">
                        <Calendar className="h-3 w-3" />
                        Installment Start Date
                      </Label>
                      <Input
                        id="installmentDate"
                        name="installmentDate"
                        type="date"
                        value={paymentData.installmentDate}
                        onChange={handlePaymentInputChange}
                        className="h-8 text-sm"
                        required={paymentType === "installment"}
                      />
                      <p className="text-xs text-muted-foreground">
                        All installments will be scheduled based on this date
                      </p>
                    </div>

                    {calculatedAmount.installmentAmount > 0 && (
                      <div className="p-3 bg-muted rounded-lg space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">Total Amount with Interest:</span>
                          <span className="font-bold">
                            Rs. {calculatedAmount.totalWithInterest.toLocaleString('en-PK')}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">Monthly Installment:</span>
                          <span className="font-bold">
                            Rs. {calculatedAmount.installmentAmount.toLocaleString('en-PK')}
                          </span>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2">
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
                  {customerId ? "Update Customer" : "Save Customer"}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

