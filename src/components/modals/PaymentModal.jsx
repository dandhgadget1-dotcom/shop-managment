"use client";

import { useState, useEffect, useMemo } from "react";
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
import { CreditCard, Calendar, Percent, DollarSign, Plus, Trash2 } from "lucide-react";
import { useShop } from "@/context/ShopContext";
import { formatCurrency } from "@/lib/utils";

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
  const [directPayments, setDirectPayments] = useState([]);
  const [newPayment, setNewPayment] = useState({
    paymentDate: new Date().toISOString().split('T')[0],
    amount: "",
    notes: "",
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
      // Load payments for direct type
      if (payment.paymentType === "direct" && payment.payments) {
        setDirectPayments(payment.payments);
      } else {
        setDirectPayments([]);
      }
    } else {
      setDirectPayments([]);
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
      phonePrice > 0 &&
      formData.percentage &&
      formData.numberOfInstallments
    ) {
      const downPayment = parseFloat(formData.downPayment) || 0;
      const remaining = parseFloat(formData.remainingAmount) || (phonePrice - downPayment);
      const percentage = parseFloat(formData.percentage);
      const installments = parseInt(formData.numberOfInstallments);

      if (percentage >= 0 && installments > 0) {
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
      } else {
        setCalculatedAmount({
          totalWithInterest: 0,
          installmentAmount: 0,
        });
      }
    } else if (paymentType === "direct" || paymentType === "partial") {
      setCalculatedAmount({
        totalWithInterest: 0,
        installmentAmount: 0,
      });
    }
  }, [formData.remainingAmount, formData.downPayment, formData.percentage, formData.numberOfInstallments, paymentType, phonePrice]);

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

  const handleAddDirectPayment = () => {
    const amount = parseFloat(newPayment.amount) || 0;
    if (amount <= 0) {
      alert("Please enter a valid payment amount");
      return;
    }

    const totalPaid = directPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
    if (totalPaid + amount > phonePrice) {
      alert(`Payment amount exceeds remaining balance. Maximum allowed: Rs. ${(phonePrice - totalPaid).toFixed(2)}`);
      return;
    }

    const paymentRecord = {
      paymentDate: newPayment.paymentDate,
      amount: amount,
      notes: newPayment.notes || "",
      recordedAt: new Date().toISOString(),
    };

    setDirectPayments([...directPayments, paymentRecord]);
    setNewPayment({
      paymentDate: new Date().toISOString().split('T')[0],
      amount: "",
      notes: "",
    });
  };

  const handleRemoveDirectPayment = (index) => {
    setDirectPayments(directPayments.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const paymentData = {
        paymentType,
        ...(paymentType === "installment" ? formData : {}),
        calculatedAmount: paymentType === "installment" ? calculatedAmount : null,
        ...(paymentType === "direct" ? { payments: directPayments } : {}),
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

  // Calculate payment stats for direct payments
  const directPaymentStats = useMemo(() => {
    const totalPaid = directPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
    const remaining = Math.max(0, phonePrice - totalPaid);
    return { totalPaid, remaining, isFullyPaid: remaining === 0 };
  }, [directPayments, phonePrice]);

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
                  Direct Purchase (Full Payment)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="partial" id="partial" />
                <Label htmlFor="partial" className="cursor-pointer">
                  Partial Payment
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

          {(paymentType === "direct" || paymentType === "partial") && (
            <>
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total Amount:</span>
                    <span className="font-bold text-lg">{formatCurrency(phonePrice)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total Paid:</span>
                    <span className={`font-bold ${directPaymentStats.isFullyPaid ? 'text-green-600' : 'text-orange-600'}`}>
                      {formatCurrency(directPaymentStats.totalPaid)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-t pt-2">
                    <span className="font-medium">Remaining:</span>
                    <span className={`font-bold ${directPaymentStats.isFullyPaid ? 'text-green-600' : 'text-orange-600'}`}>
                      {formatCurrency(directPaymentStats.remaining)}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-base font-semibold">Payment Records</Label>
                  
                  {directPayments.length > 0 && (
                    <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-3">
                      {directPayments.map((payment, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-background rounded border">
                          <div className="flex-1">
                            <div className="font-medium">{formatCurrency(payment.amount)}</div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(payment.paymentDate).toLocaleDateString()}
                              {payment.notes && ` • ${payment.notes}`}
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveDirectPayment(index)}
                            className="h-8 w-8"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="space-y-2 border rounded-md p-3 bg-muted/50">
                    <Label className="text-sm font-semibold">Add Payment</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <Input
                        type="date"
                        value={newPayment.paymentDate}
                        onChange={(e) => setNewPayment(prev => ({ ...prev, paymentDate: e.target.value }))}
                        className="h-9"
                      />
                      <Input
                        type="number"
                        placeholder="Amount"
                        value={newPayment.amount}
                        onChange={(e) => setNewPayment(prev => ({ ...prev, amount: e.target.value }))}
                        min="0"
                        step="0.01"
                        className="h-9"
                      />
                      <div className="flex gap-2">
                        <Input
                          type="text"
                          placeholder="Notes (optional)"
                          value={newPayment.notes}
                          onChange={(e) => setNewPayment(prev => ({ ...prev, notes: e.target.value }))}
                          className="h-9 flex-1"
                        />
                        <Button
                          type="button"
                          onClick={handleAddDirectPayment}
                          disabled={directPaymentStats.isFullyPaid}
                          className="h-9"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {directPaymentStats.remaining > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Maximum allowed: {formatCurrency(directPaymentStats.remaining)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

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
                  placeholder="Enter down payment amount (0 if none)"
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
              {paymentType === "direct" ? "Complete Purchase" 
               : paymentType === "partial" ? "Save Partial Payment Plan"
               : "Save Installment Plan"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

