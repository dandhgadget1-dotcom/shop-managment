"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Smartphone, DollarSign } from "lucide-react";

export default function PhoneDetailsForm({ onPriceChange }) {
  const [formData, setFormData] = useState({
    name: "",
    model: "",
    imeiNo: "",
    price: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Notify parent component when price changes
    if (name === "price" && onPriceChange) {
      onPriceChange(value);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Phone Data:", formData);
    // Handle form submission here
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="h-5 w-5" />
          Phone Details
        </CardTitle>
        <CardDescription>
          Enter the details of the phone being sold
        </CardDescription>
      </CardHeader>
      <CardContent>
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

          <Button type="submit" className="w-full">
            <Smartphone className="mr-2 h-4 w-4" />
            Save Phone Details
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

