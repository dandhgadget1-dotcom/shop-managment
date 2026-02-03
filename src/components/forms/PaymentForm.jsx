"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreditCard, Calendar, Percent, DollarSign } from "lucide-react";

export default function PaymentForm({ phonePrice = 0 }) {
  const [paymentType, setPaymentType] = useState("direct");
  const [formData, setFormData] = useState({
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

  useEffect(() => {
    if (paymentType === "installment" && phonePrice > 0) {
      const down = parseFloat(formData.downPayment) || 0;
      const remaining = phonePrice - down;
      setFormData((prev) => ({
        ...prev,
        remainingAmount: remaining.toFixed(2),
      }));
    }
  }, [phonePrice, paymentType, formData.downPayment]);

  useEffect(() => {
    if (
      paymentType === "installment" &&
      formData.remainingAmount &&
      formData.percentage &&
      formData.numberOfInstallments
    ) {
      const remaining = parseFloat(formData.remainingAmount);
      const downPayment = parseFloat(formData.downPayment) || 0;
      const percentage = parseFloat(formData.percentage);
      const installments = parseInt(formData.numberOfInstallments);

      if (phonePrice > 0 && percentage >= 0 && installments > 0) {
        // If down payment is 0, apply interest to full phone price
        // Otherwise, apply interest to remaining amount
        const baseAmount = downPayment === 0 ? phonePrice : remaining;
        const interestAmount = (baseAmount * percentage) / 100;
        const totalWithInterest = baseAmount + interestAmount;
        const installmentAmount = totalWithInterest / installments;

        setCalculatedAmount({
          totalWithInterest: totalWithInterest,
          installmentAmount: installmentAmount,
        });
      }
    }
  }, [formData.remainingAmount, formData.downPayment, formData.percentage, formData.numberOfInstallments, paymentType, phonePrice]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Recalculate remaining amount if down payment changes
    if (name === "downPayment" && paymentType === "installment" && phonePrice > 0) {
      const down = parseFloat(value) || 0;
      const remaining = phonePrice - down;
      setFormData((prev) => ({
        ...prev,
        remainingAmount: remaining.toFixed(2),
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const paymentData = {
      paymentType,
      ...(paymentType === "installment" ? formData : {}),
      calculatedAmount: paymentType === "installment" ? calculatedAmount : null,
    };
    console.log("Payment Data:", paymentData);
    // Handle form submission here
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Payment Details
        </CardTitle>
        <CardDescription>
          Select payment method and enter payment information
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <Label>Payment Type</Label>
            <RadioGroup value={paymentType} onValueChange={setPaymentType}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="direct" id="direct" />
                <Label htmlFor="direct" className="cursor-pointer">
                  Direct Purchase
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="installment" id="installment" />
                <Label htmlFor="installment" className="cursor-pointer">
                  Installment Plan
                </Label>
              </div>
            </RadioGroup>
          </div>

          {paymentType === "installment" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="downPayment" className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Down Payment
                </Label>
                <Input
                  id="downPayment"
                  name="downPayment"
                  type="number"
                  value={formData.downPayment}
                  onChange={handleInputChange}
                  placeholder="Enter down payment amount"
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="remainingAmount">Remaining Amount</Label>
                <Input
                  id="remainingAmount"
                  name="remainingAmount"
                  type="number"
                  value={formData.remainingAmount}
                  onChange={handleInputChange}
                  placeholder="Remaining amount after down payment"
                  min="0"
                  step="0.01"
                  required
                  readOnly
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="percentage" className="flex items-center gap-2">
                  <Percent className="h-4 w-4" />
                  Interest Percentage (%)
                </Label>
                <Input
                  id="percentage"
                  name="percentage"
                  type="number"
                  value={formData.percentage}
                  onChange={handleInputChange}
                  placeholder="Enter interest percentage"
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="numberOfInstallments">Number of Installments</Label>
                <Select
                  value={formData.numberOfInstallments}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, numberOfInstallments: value }))
                  }
                >
                  <SelectTrigger id="numberOfInstallments">
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

              <div className="space-y-2">
                <Label htmlFor="installmentDate" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Installment Start Date
                </Label>
                <Input
                  id="installmentDate"
                  name="installmentDate"
                  type="date"
                  value={formData.installmentDate}
                  onChange={handleInputChange}
                  required
                />
                <p className="text-sm text-muted-foreground">
                  All installments will be scheduled based on this date
                </p>
              </div>

              {calculatedAmount.installmentAmount > 0 && (
                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">Total Amount with Interest:</span>
                    <span className="font-bold">
                      Rs. {calculatedAmount.totalWithInterest.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Monthly Installment:</span>
                    <span className="font-bold">
                      Rs. {calculatedAmount.installmentAmount.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </>
          )}

          <Button type="submit" className="w-full">
            <CreditCard className="mr-2 h-4 w-4" />
            {paymentType === "direct" ? "Complete Purchase" : "Save Installment Plan"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

