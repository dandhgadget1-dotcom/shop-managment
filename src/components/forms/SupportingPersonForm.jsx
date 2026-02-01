"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Upload, UserPlus, IdCard, MapPin, Phone } from "lucide-react";

export default function SupportingPersonForm() {
  const [formData, setFormData] = useState({
    fullName: "",
    idNo: "",
    idFront: null,
    idBack: null,
    address: "",
    contactInfo: "",
  });

  const [idFrontPreview, setIdFrontPreview] = useState(null);
  const [idBackPreview, setIdBackPreview] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e, side) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        [side]: file,
      }));

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        if (side === "idFront") {
          setIdFrontPreview(reader.result);
        } else {
          setIdBackPreview(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Supporting Person Data:", formData);
    // Handle form submission here
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Supporting Person Details
        </CardTitle>
        <CardDescription>
          Enter the supporting person's information, address, and contact details
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="spFullName">Full Name</Label>
            <Input
              id="spFullName"
              name="fullName"
              value={formData.fullName}
              onChange={handleInputChange}
              placeholder="Enter supporting person's full name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="spIdNo">ID Number</Label>
            <Input
              id="spIdNo"
              name="idNo"
              value={formData.idNo}
              onChange={handleInputChange}
              placeholder="Enter ID number"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="spIdFront" className="flex items-center gap-2">
                <IdCard className="h-4 w-4" />
                Front Side of ID
              </Label>
              <div className="space-y-2">
                <Input
                  id="spIdFront"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, "idFront")}
                  className="cursor-pointer"
                  required
                />
                {idFrontPreview && (
                  <div className="mt-2">
                    <img
                      src={idFrontPreview}
                      alt="ID Front Preview"
                      className="w-full h-48 object-contain border rounded-md"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="spIdBack" className="flex items-center gap-2">
                <IdCard className="h-4 w-4" />
                Back Side of ID
              </Label>
              <div className="space-y-2">
                <Input
                  id="spIdBack"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, "idBack")}
                  className="cursor-pointer"
                  required
                />
                {idBackPreview && (
                  <div className="mt-2">
                    <img
                      src={idBackPreview}
                      alt="ID Back Preview"
                      className="w-full h-48 object-contain border rounded-md"
                    />
                  </div>
                )}
              </div>
            </div>
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

          <div className="space-y-2">
            <Label htmlFor="contactInfo" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
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

          <Button type="submit" className="w-full">
            <Upload className="mr-2 h-4 w-4" />
            Save Supporting Person Details
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

