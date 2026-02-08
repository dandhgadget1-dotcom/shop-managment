"use client";

import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useShop } from "@/context/ShopContext";
import { useShopSettings } from "@/context/ShopSettingsContext";
import { useToast } from "@/components/ui/toast";
import {
  Calendar,
  DollarSign,
  X,
  CheckCircle2,
  Clock,
  Smartphone,
  User,
  CreditCard,
  Plus,
  History,
  Edit,
  RotateCcw,
  MoreVertical,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatCurrency } from "@/lib/utils";

export default function PartialPaymentLedger({ customerId, onClose }) {
  const { getCustomerById, updateCustomer, refreshCustomers } = useShop();
  const { settings } = useShopSettings();
  const customer = getCustomerById(customerId);
  const toast = useToast();
  
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [isEditingPayment, setIsEditingPayment] = useState(false);
  const [reverseConfirmOpen, setReverseConfirmOpen] = useState(false);
  const [paymentToReverse, setPaymentToReverse] = useState(null);
  const [paymentFormData, setPaymentFormData] = useState({
    paymentDate: new Date().toISOString().split('T')[0],
    amount: "",
    notes: "",
  });
  const [isRecordingPayment, setIsRecordingPayment] = useState(false);
  const [isReversingPayment, setIsReversingPayment] = useState(false);

  if (!customer) return null;

  const payment = customer.payment;
  const phonePrice = Math.round(parseFloat(customer.phone?.price) || 0);
  const allPayments = [...(payment?.payments || [])].sort((a, b) => {
    const dateA = new Date(a.paymentDate || a.recordedAt);
    const dateB = new Date(b.paymentDate || b.recordedAt);
    return dateA - dateB;
  });
  
  const totalPaid = allPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
  const remainingAmount = Math.max(0, phonePrice - totalPaid);
  const isFullyPaid = remainingAmount === 0;
  const progressPercentage = phonePrice > 0 ? (totalPaid / phonePrice) * 100 : 0;

  const handleRecordPayment = () => {
    setIsEditingPayment(false);
    setPaymentFormData({
      paymentDate: new Date().toISOString().split('T')[0],
      amount: "",
      notes: "",
    });
    setPaymentModalOpen(true);
  };

  const handleEditPayment = (paymentRecord) => {
    setIsEditingPayment(true);
    setPaymentToReverse(paymentRecord);
    setPaymentFormData({
      paymentDate: paymentRecord?.paymentDate 
        ? new Date(paymentRecord.paymentDate).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
      amount: paymentRecord?.amount ? parseFloat(paymentRecord.amount).toFixed(2) : "",
      notes: paymentRecord?.notes || "",
    });
    setPaymentModalOpen(true);
  };

  const handleReversePayment = (paymentRecord) => {
    setPaymentToReverse(paymentRecord);
    setReverseConfirmOpen(true);
  };

  const confirmReversePayment = async () => {
    if (!paymentToReverse) return;

    setIsReversingPayment(true);
    try {
      const currentPayments = payment?.payments || [];
      const paymentId = paymentToReverse._id || paymentToReverse.id;
      
      if (!paymentId) {
        toast.error("Payment ID not found. Cannot reverse payment.");
        setIsReversingPayment(false);
        return;
      }

      const updatedPayments = currentPayments.filter(p => 
        (p._id || p.id) !== paymentId
      );

      const cleanedPayment = {
        paymentType: payment.paymentType,
        payments: updatedPayments,
      };

      await updateCustomer(customerId, {
        payment: cleanedPayment,
      });

      await refreshCustomers();
      toast.success("Payment reversed successfully");
      setReverseConfirmOpen(false);
      setPaymentToReverse(null);
    } catch (error) {
      console.error("Error reversing payment:", error);
      toast.error(error.message || "Failed to reverse payment. Please try again.");
    } finally {
      setIsReversingPayment(false);
    }
  };

  const cleanPaymentRecord = (paymentRecord) => {
    const cleaned = {
      paymentDate: paymentRecord.paymentDate ? new Date(paymentRecord.paymentDate).toISOString() : new Date().toISOString(),
      amount: parseFloat(paymentRecord.amount) || 0,
      notes: paymentRecord.notes || "",
      recordedAt: paymentRecord.recordedAt || new Date().toISOString(),
    };

    if (paymentRecord.updatedAt) {
      cleaned.updatedAt = new Date(paymentRecord.updatedAt).toISOString();
    }

    if (paymentRecord._id || paymentRecord.id) {
      cleaned._id = paymentRecord._id || paymentRecord.id;
    }

    return cleaned;
  };

  const handlePaymentSubmit = async () => {
    const paymentAmount = parseFloat(paymentFormData.amount) || 0;

    if (paymentAmount <= 0) {
      toast.error("Please enter a valid payment amount");
      return;
    }

    if (isEditingPayment && paymentToReverse) {
      const currentTotalPaid = allPayments.reduce((sum, p) => {
        if ((p._id || p.id) === (paymentToReverse._id || paymentToReverse.id)) {
          return sum; // Exclude the payment being edited
        }
        return sum + (parseFloat(p.amount) || 0);
      }, 0);
      const newTotalPaid = currentTotalPaid + paymentAmount;
      const newRemaining = phonePrice - newTotalPaid;
      
      if (newRemaining < 0) {
        toast.error(`Payment amount cannot exceed the total remaining amount of Rs. ${(phonePrice - currentTotalPaid).toFixed(2)}`);
        return;
      }
    } else {
      if (paymentAmount > remainingAmount) {
        toast.error(`Payment amount cannot exceed the remaining amount of Rs. ${remainingAmount.toFixed(2)}`);
        return;
      }
    }

    setIsRecordingPayment(true);
    try {
      const paymentRecord = {
        paymentDate: paymentFormData.paymentDate,
        amount: paymentAmount,
        notes: paymentFormData.notes || "",
        recordedAt: isEditingPayment 
          ? (paymentToReverse?.recordedAt || new Date().toISOString())
          : new Date().toISOString(),
        updatedAt: isEditingPayment ? new Date().toISOString() : undefined,
      };

      if (isEditingPayment && paymentToReverse) {
        paymentRecord._id = paymentToReverse._id || paymentToReverse.id;
      }

      const currentPayments = payment?.payments || [];
      let updatedPayments;

      if (isEditingPayment && paymentToReverse) {
        updatedPayments = currentPayments.map(p => {
          if ((p._id || p.id) === (paymentToReverse._id || paymentToReverse.id)) {
            return cleanPaymentRecord({ ...p, ...paymentRecord });
          }
          return cleanPaymentRecord(p);
        });
      } else {
        updatedPayments = [
          ...currentPayments.map(p => cleanPaymentRecord(p)),
          cleanPaymentRecord(paymentRecord)
        ];
      }

      const cleanedPayment = {
        paymentType: payment.paymentType,
        payments: updatedPayments,
      };

      await updateCustomer(customerId, {
        payment: cleanedPayment,
      });

      await refreshCustomers();
      toast.success(isEditingPayment ? "Payment updated successfully" : "Payment recorded successfully");
      setPaymentModalOpen(false);
      setIsEditingPayment(false);
      setPaymentToReverse(null);
      setPaymentFormData({
        paymentDate: new Date().toISOString().split('T')[0],
        amount: "",
        notes: "",
      });
    } catch (error) {
      console.error("Error saving payment:", error);
      toast.error(error.message || "Failed to save payment. Please try again.");
    } finally {
      setIsRecordingPayment(false);
    }
  };

  return (
    <Dialog open={!!customerId}>
      <DialogContent 
        showCloseButton={false}
        className="!max-w-[95vw] sm:!max-w-[95vw] md:!max-w-[95vw] lg:!max-w-[95vw] !w-[95vw] max-h-[95vh] p-0 gap-0 flex flex-col"
      >
        {/* Header */}
        <div className="relative bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 text-white p-4 rounded-t-lg shadow-lg flex-shrink-0">
          <DialogHeader className="relative space-y-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <CreditCard className="h-6 w-6" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold">Partial Payment Ledger</DialogTitle>
                  <DialogDescription className="text-blue-100">
                    {customer.fullName} - Payment History & Remaining Balance
                  </DialogDescription>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-white hover:bg-white/20 h-8 w-8"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </DialogHeader>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Customer & Phone Info Card */}
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Customer</p>
                </div>
                <p className="font-semibold text-base">{customer.fullName}</p>
                <p className="text-sm text-muted-foreground">ID: {customer.idNo}</p>
                <p className="text-sm text-muted-foreground">Tel: {customer.contactInfo}</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Phone</p>
                </div>
                <p className="font-semibold text-base">{customer.phone?.name}</p>
                <p className="text-sm text-muted-foreground">{customer.phone?.model}</p>
                <p className="font-semibold text-sm text-green-600 dark:text-green-400">
                  Price: {formatCurrency(phonePrice)}
                </p>
              </div>
            </div>
          </div>

          {/* Payment Summary Card */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">Total Amount</p>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{formatCurrency(phonePrice)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">Total Paid</p>
                <p className={`text-2xl font-bold ${isFullyPaid ? 'text-green-600 dark:text-green-400' : 'text-blue-700 dark:text-blue-300'}`}>
                  {formatCurrency(totalPaid)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">Remaining</p>
                <p className={`text-2xl font-bold ${isFullyPaid ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
                  {formatCurrency(remainingAmount)}
                </p>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">Payment Progress</span>
                <span className="text-xs font-semibold">{progressPercentage.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${isFullyPaid ? 'bg-green-500' : 'bg-blue-500'}`}
                  style={{ width: `${Math.min(100, progressPercentage)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Payment History Table */}
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-slate-50 dark:bg-slate-900 p-3 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-semibold text-sm">Payment History</h3>
              </div>
              <Button
                onClick={handleRecordPayment}
                disabled={isFullyPaid}
                size="sm"
                className="h-8"
              >
                <Plus className="h-4 w-4 mr-2" />
                Record Payment
              </Button>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">#</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="w-[100px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allPayments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No payments recorded yet. Click &quot;Record Payment&quot; to add the first payment.
                      </TableCell>
                    </TableRow>
                  ) : (
                    allPayments.map((paymentRecord, index) => (
                      <TableRow key={paymentRecord._id || paymentRecord.id || index}>
                        <TableCell className="font-semibold">{index + 1}</TableCell>
                        <TableCell>
                          {new Date(paymentRecord.paymentDate || paymentRecord.recordedAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-green-600 dark:text-green-400">
                          {formatCurrency(paymentRecord.amount)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {paymentRecord.notes || "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditPayment(paymentRecord)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleReversePayment(paymentRecord)}
                                className="text-destructive"
                              >
                                <RotateCcw className="mr-2 h-4 w-4" />
                                Reverse
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        {/* Payment Modal */}
        <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{isEditingPayment ? "Edit Payment" : "Record Payment"}</DialogTitle>
              <DialogDescription>
                {isEditingPayment 
                  ? "Update the payment details below"
                  : `Enter payment details. Remaining balance: ${formatCurrency(remainingAmount)}`}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="paymentDate">Payment Date</Label>
                <Input
                  id="paymentDate"
                  type="date"
                  value={paymentFormData.paymentDate}
                  onChange={(e) => setPaymentFormData(prev => ({ ...prev, paymentDate: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (Rs.)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={paymentFormData.amount}
                  onChange={(e) => setPaymentFormData(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="Enter payment amount"
                  min="0"
                  step="0.01"
                />
                {!isEditingPayment && remainingAmount > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Maximum allowed: {formatCurrency(remainingAmount)}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={paymentFormData.notes}
                  onChange={(e) => setPaymentFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Add any notes about this payment"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setPaymentModalOpen(false);
                    setIsEditingPayment(false);
                    setPaymentToReverse(null);
                  }}
                  disabled={isRecordingPayment}
                >
                  Cancel
                </Button>
                <Button onClick={handlePaymentSubmit} disabled={isRecordingPayment}>
                  {isRecordingPayment ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isEditingPayment ? "Updating..." : "Recording..."}
                    </>
                  ) : (
                    isEditingPayment ? "Update Payment" : "Record Payment"
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Reverse Payment Confirmation */}
        <Dialog open={reverseConfirmOpen} onOpenChange={setReverseConfirmOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reverse Payment</DialogTitle>
              <DialogDescription>
                Are you sure you want to reverse this payment? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            {paymentToReverse && (
              <div className="space-y-2 py-4">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Date:</span>
                  <span className="text-sm font-medium">
                    {new Date(paymentToReverse.paymentDate || paymentToReverse.recordedAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Amount:</span>
                  <span className="text-sm font-semibold text-green-600">
                    {formatCurrency(paymentToReverse.amount)}
                  </span>
                </div>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setReverseConfirmOpen(false);
                  setPaymentToReverse(null);
                }}
                disabled={isReversingPayment}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={confirmReversePayment}
                disabled={isReversingPayment}
              >
                {isReversingPayment ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Reversing...
                  </>
                ) : (
                  <>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Reverse Payment
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}
