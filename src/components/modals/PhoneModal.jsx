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
import { Button } from "@/components/ui/button";
import { Smartphone, DollarSign } from "lucide-react";
import { useShop } from "@/context/ShopContext";

export default function PhoneModal({ open, onOpenChange, customerId, phoneId = null }) {
  const { getCustomerById, updateCustomer } = useShop();
  
  // Get initial form data from customer
  const getInitialFormData = () => {
    if (customerId && open) {
      const customer = getCustomerById(customerId);
      if (customer?.phone) {
        const phone = customer.phone;
        return {
          name: phone.name || "",
          model: phone.model || "",
          imeiNo: phone.imeiNo || "",
          price: phone.price || "",
        };
      }
    }
    return {
      name: "",
      model: "",
      imeiNo: "",
      price: "",
    };
  };

  const [formData, setFormData] = useState(getInitialFormData);

  // Update form data when customer or modal state changes
  // This is a valid use case: loading form data when modal opens
  useEffect(() => {
    if (open) {
      setFormData(getInitialFormData());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId, open]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateCustomer(customerId, {
        phone: formData,
      });

      // Reset form
      setFormData({
        name: "",
        model: "",
        imeiNo: "",
        price: "",
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving phone details:", error);
      alert("Failed to save phone details. Please try again.");
    }
  };

  const handleOpenChange = (isOpen) => {
    if (!isOpen) {
      // Reset form when closing
      setFormData({
        name: "",
        model: "",
        imeiNo: "",
        price: "",
      });
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="w-[95vw] sm:w-full max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Phone Details
          </DialogTitle>
          <DialogDescription>Enter the details of the phone being sold</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="phoneName">Phone Name</Label>
            <Input
              id="phoneName"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="e.g., iPhone 15 Pro"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phoneModel">Model</Label>
            <Input
              id="phoneModel"
              name="model"
              value={formData.model}
              onChange={handleInputChange}
              placeholder="e.g., A2848"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="imeiNo">IMEI Number</Label>
            <Input
              id="imeiNo"
              name="imeiNo"
              value={formData.imeiNo}
              onChange={handleInputChange}
              placeholder="Enter IMEI number"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="price" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Price
            </Label>
            <Input
              id="price"
              name="price"
              type="number"
              value={formData.price}
              onChange={handleInputChange}
              placeholder="Enter phone price"
              min="0"
              step="0.01"
              required
            />
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button type="submit" className="w-full sm:w-auto">
              <Smartphone className="mr-2 h-4 w-4" />
              Save Phone Details
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

