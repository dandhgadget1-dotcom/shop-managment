"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Upload, User, IdCard } from "lucide-react";

export default function CustomerForm() {
  const [formData, setFormData] = useState({
    fullName: "",
    idNo: "",
    idFront: null,
    idBack: null,
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
    console.log("Customer Data:", formData);
    // Handle form submission here
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Customer Details
        </CardTitle>
        <CardDescription>
          Enter the customer&apos;s personal information and ID documents
        </CardDescription>
      </CardHeader>
      <CardContent>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="idFront" className="flex items-center gap-2">
                <IdCard className="h-4 w-4" />
                Front Side of ID
              </Label>
              <div className="space-y-2">
                <Input
                  id="idFront"
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
              <Label htmlFor="idBack" className="flex items-center gap-2">
                <IdCard className="h-4 w-4" />
                Back Side of ID
              </Label>
              <div className="space-y-2">
                <Input
                  id="idBack"
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

          <Button type="submit" className="w-full">
            <Upload className="mr-2 h-4 w-4" />
            Save Customer Details
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

