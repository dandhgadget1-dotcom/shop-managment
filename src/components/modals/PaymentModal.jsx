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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreditCard, Calendar, Percent, DollarSign } from "lucide-react";
import { useShop } from "@/context/ShopContext";

export default function PaymentModal({ open, onOpenChange, customerId }) {
  const { getCustomerById, updateCustomer } = useShop();
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

  const customer = customerId ? getCustomerById(customerId) : null;
  const phonePrice = customer?.phone?.price ? parseFloat(customer.phone.price) : 0;

  useEffect(() => {
    if (customer?.payment) {
      const payment = customer.payment;
      setPaymentType(payment.paymentType || "direct");
      setFormData({
        downPayment: payment.downPayment || "",
        remainingAmount: payment.remainingAmount || "",
        percentage: payment.percentage || "",
        numberOfInstallments: payment.numberOfInstallments || "",
        installmentDate: payment.installmentDate || "",
      });
    }
  }, [customer, open]);

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
      const percentage = parseFloat(formData.percentage);
      const installments = parseInt(formData.numberOfInstallments);

      if (remaining > 0 && percentage >= 0 && installments > 0) {
        const interestAmount = (remaining * percentage) / 100;
        const totalWithInterest = remaining + interestAmount;
        const installmentAmount = totalWithInterest / installments;

        setCalculatedAmount({
          totalWithInterest: totalWithInterest,
          installmentAmount: installmentAmount,
        });
      }
    }
  }, [formData.remainingAmount, formData.percentage, formData.numberOfInstallments, paymentType]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === "downPayment" && paymentType === "installment" && phonePrice > 0) {
      const down = parseFloat(value) || 0;
      const remaining = phonePrice - down;
      setFormData((prev) => ({
        ...prev,
        remainingAmount: remaining.toFixed(2),
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const paymentData = {
        paymentType,
        ...(paymentType === "installment" ? formData : {}),
        calculatedAmount: paymentType === "installment" ? calculatedAmount : null,
      };

      await updateCustomer(customerId, {
        payment: paymentData,
      });

      onOpenChange(false);
    } catch (error) {
      console.error("Error saving payment:", error);
      alert("Failed to save payment. Please try again.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[95vh] overflow-y-auto w-[95vw] sm:w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Details
          </DialogTitle>
          <DialogDescription>
            Select payment method and enter payment information
          </DialogDescription>
        </DialogHeader>
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

          <div className="flex flex-col sm:flex-row justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button type="submit" className="w-full sm:w-auto">
              <CreditCard className="mr-2 h-4 w-4" />
              {paymentType === "direct" ? "Complete Purchase" : "Save Installment Plan"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

