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
import { generateReminderMessage } from "@/lib/reminderMessages";
import {
  Calendar,
  DollarSign,
  TrendingUp,
  X,
  CheckCircle2,
  Clock,
  AlertCircle,
  Smartphone,
  User,
  Percent,
  CreditCard,
  Plus,
  History,
  Edit,
  RotateCcw,
  MoreVertical,
  MessageSquare,
  Copy,
  Check,
  MessageCircle,
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

export default function InstallmentsLedger({ customerId, onClose }) {
  const { getCustomerById, updateCustomer, customers, refreshCustomers } = useShop();
  const { settings } = useShopSettings();
  const customer = getCustomerById(customerId);
  const toast = useToast();
  
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState(null);
  const [isEditingPayment, setIsEditingPayment] = useState(false);
  const [reverseConfirmOpen, setReverseConfirmOpen] = useState(false);
  const [paymentToReverse, setPaymentToReverse] = useState(null);
  const [paymentFormData, setPaymentFormData] = useState({
    paymentDate: new Date().toISOString().split('T')[0],
    amount: "",
    notes: "",
  });
  const [allowFlexiblePayment, setAllowFlexiblePayment] = useState(false);
  const [copiedInstallmentNumber, setCopiedInstallmentNumber] = useState(null);

  // Smart payment allocation algorithm
  const allocatePayments = useMemo(() => {
    if (!customer?.payment || customer.payment.paymentType !== "installment") {
      return { installments: [], unallocatedAmount: 0 };
    }

    const payment = customer.payment;
    const numberOfInstallments = parseInt(payment.numberOfInstallments) || 0;
    const installmentAmount = payment.calculatedAmount?.installmentAmount || 0;
    const startDate = new Date(payment.installmentDate);
    const allPayments = [...(payment.payments || [])].sort((a, b) => {
      // Sort by payment date, then by recorded date
      const dateA = new Date(a.paymentDate || a.recordedAt);
      const dateB = new Date(b.paymentDate || b.recordedAt);
      return dateA - dateB;
    });

    // Initialize installments
    const installmentsList = [];
    for (let i = 0; i < numberOfInstallments; i++) {
      const installmentDate = new Date(startDate);
      installmentDate.setMonth(startDate.getMonth() + i);
      installmentsList.push({
        number: i + 1,
        date: installmentDate,
        requiredAmount: installmentAmount,
        paidAmount: 0,
        remainingAmount: installmentAmount,
        status: "pending",
        paymentRecords: [],
        allocationDetails: [],
      });
    }

    // Allocate payments to installments
    let currentInstallmentIndex = 0;
    let unallocatedAmount = 0;

    for (const paymentRecord of allPayments) {
      const paymentAmount = parseFloat(paymentRecord.amount) || 0;
      let remainingPayment = paymentAmount;

      // If payment has a specific installment number, try to allocate to that first
      if (paymentRecord.installmentNumber) {
        const targetIndex = paymentRecord.installmentNumber - 1;
        if (targetIndex >= 0 && targetIndex < installmentsList.length) {
          const installment = installmentsList[targetIndex];
          if (installment.remainingAmount > 0) {
            const allocation = Math.min(remainingPayment, installment.remainingAmount);
            installment.paidAmount += allocation;
            installment.remainingAmount -= allocation;
            installment.paymentRecords.push(paymentRecord);
            installment.allocationDetails.push({
              paymentId: paymentRecord._id || paymentRecord.id,
              amount: allocation,
              date: paymentRecord.paymentDate,
            });
            remainingPayment -= allocation;
            
            if (installment.remainingAmount === 0) {
              installment.status = "paid";
            } else {
              installment.status = "partial";
            }
          }
        }
      }

      // Allocate remaining payment amount to subsequent installments
      while (remainingPayment > 0 && currentInstallmentIndex < installmentsList.length) {
        const installment = installmentsList[currentInstallmentIndex];
        
        if (installment.remainingAmount > 0) {
          const allocation = Math.min(remainingPayment, installment.remainingAmount);
          installment.paidAmount += allocation;
          installment.remainingAmount -= allocation;
          
          // Only add payment record if not already added
          if (!installment.paymentRecords.find(p => 
            (p._id || p.id) === (paymentRecord._id || paymentRecord.id)
          )) {
            installment.paymentRecords.push(paymentRecord);
          }
          
          installment.allocationDetails.push({
            paymentId: paymentRecord._id || paymentRecord.id,
            amount: allocation,
            date: paymentRecord.paymentDate,
          });
          
          remainingPayment -= allocation;
          
          if (installment.remainingAmount === 0) {
            installment.status = "paid";
            currentInstallmentIndex++;
          } else {
            installment.status = "partial";
          }
        } else {
          currentInstallmentIndex++;
        }
      }

      // If there's still remaining payment after all installments, it's unallocated
      if (remainingPayment > 0) {
        unallocatedAmount += remainingPayment;
      }
    }

    return { installments: installmentsList, unallocatedAmount };
  }, [customer]);

  const installments = allocatePayments.installments;

  // Calculate total remaining amount across all installments
  const totalRemainingAmount = useMemo(() => {
    if (!installments || installments.length === 0) return 0;
    return installments.reduce((sum, i) => sum + Math.max(0, i.remainingAmount), 0);
  }, [installments]);

  if (!customer) return null;

  const payment = customer.payment;
  const totalAmount = payment?.calculatedAmount?.totalWithInterest || 0;
  const allPayments = payment?.payments || [];
  const paidAmount = allPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
  const remainingAmount = totalAmount - paidAmount;
  const paidInstallments = installments.filter(i => i.status === "paid").length;
  const partialInstallments = installments.filter(i => i.status === "partial").length;
  const pendingInstallments = installments.filter(i => i.status === "pending").length;
  const progressPercentage = installments.length > 0 
    ? (installments.reduce((sum, i) => sum + i.paidAmount, 0) / (installments.reduce((sum, i) => sum + i.requiredAmount, 0))) * 100 
    : 0;

  const handleRecordPayment = (installment = null) => {
    setSelectedInstallment(installment);
    setIsEditingPayment(false);
    setAllowFlexiblePayment(!installment);
    setPaymentFormData({
      paymentDate: new Date().toISOString().split('T')[0],
      amount: "", // Let user enter any amount - no default restriction
      notes: "",
    });
    setPaymentModalOpen(true);
  };

  const handleEditPayment = (paymentRecord) => {
    // Find which installment this payment belongs to
    const installment = installments.find(i => 
      i.paymentRecords.some(p => (p._id || p.id) === (paymentRecord._id || paymentRecord.id))
    );
    setSelectedInstallment(installment);
    setIsEditingPayment(true);
    setAllowFlexiblePayment(false);
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

  // Format phone number for WhatsApp (wa.me format: 923001234567, no +)
  const formatPhoneForWhatsApp = (phoneNumber) => {
    if (!phoneNumber) return null;
    
    // Remove all non-digit characters
    let cleaned = phoneNumber.replace(/[^\d]/g, '');
    
    // If it starts with +92, remove the +
    if (cleaned.startsWith('92') && cleaned.length === 12) {
      return cleaned;
    }
    
    // If it starts with 0, replace with 92
    if (cleaned.startsWith('0') && cleaned.length === 11) {
      return '92' + cleaned.substring(1);
    }
    
    // If it's 10 digits, add 92
    if (cleaned.length === 10) {
      return '92' + cleaned;
    }
    
    // If it's already 12 digits starting with 92, return as is
    if (cleaned.length === 12 && cleaned.startsWith('92')) {
      return cleaned;
    }
    
    return null;
  };

  const getReminderMessage = (installment) => {
    if (!customer || !customer.contactInfo) {
      return null;
    }

    // Get shop settings for message generation
    const shopInfo = {
      shopName: settings?.shopName || 'Our Shop',
      shopPhone: settings?.shopPhone || '',
      reminderMessageTemplate: settings?.reminderMessageTemplate || null,
    };

    // Create reminder data structure
    const reminderData = {
      customerName: customer.fullName,
      phoneName: customer.phone?.name || 'N/A',
      customerId: customer.id,
    };

    const installmentData = {
      number: installment.number,
      dueDate: installment.date.toISOString(),
      amount: installment.requiredAmount,
    };

    // Check for custom message in localStorage
    const reminderKey = `${customer.id}-${installment.number}`;
    let message;
    try {
      const storedCustomMessages = localStorage.getItem('customReminderMessages');
      if (storedCustomMessages) {
        const customMessages = JSON.parse(storedCustomMessages);
        if (customMessages[reminderKey]) {
          message = customMessages[reminderKey];
        }
      }
    } catch (error) {
      console.error('Error loading custom message:', error);
    }

    // If no custom message, generate default
    if (!message) {
      message = generateReminderMessage(reminderData, installmentData, shopInfo);
    }

    return message;
  };

  const handleCopyReminderMessage = async (installment) => {
    if (!customer || !customer.contactInfo) {
      toast.error("Customer does not have contact information.");
      return;
    }

    try {
      const message = getReminderMessage(installment);
      if (!message) {
        toast.error("Failed to generate reminder message.");
        return;
      }

      await navigator.clipboard.writeText(message);
      
      setCopiedInstallmentNumber(installment.number);
      toast.success(`Reminder message for installment #${installment.number} copied to clipboard!`);
      
      setTimeout(() => {
        setCopiedInstallmentNumber(null);
      }, 2000);
    } catch (error) {
      console.error("Error copying reminder message:", error);
      toast.error("Failed to copy reminder message");
    }
  };

  const handleOpenWhatsApp = (installment) => {
    if (!customer || !customer.contactInfo) {
      toast.error("Customer does not have contact information.");
      return;
    }

    const phoneNumber = formatPhoneForWhatsApp(customer.contactInfo);
    
    if (!phoneNumber) {
      toast.error("Invalid phone number format");
      return;
    }
    
    const message = getReminderMessage(installment);
    if (!message) {
      toast.error("Failed to generate reminder message.");
      return;
    }
    
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
    toast.success("Opening WhatsApp...");
  };

  // Calculate how payment will be allocated
  const calculatePaymentAllocation = (paymentAmount) => {
    if (!paymentAmount || paymentAmount <= 0) return [];
    
    const allocations = [];
    let remaining = parseFloat(paymentAmount);
    let currentIndex = 0;
    
    while (remaining > 0 && currentIndex < installments.length) {
      const installment = installments[currentIndex];
      if (installment.remainingAmount > 0) {
        const allocation = Math.min(remaining, installment.remainingAmount);
        allocations.push({
          installmentNumber: installment.number,
          amount: allocation,
          remainingAfter: installment.remainingAmount - allocation,
        });
        remaining -= allocation;
      }
      currentIndex++;
    }
    
    if (remaining > 0) {
      allocations.push({
        installmentNumber: null,
        amount: remaining,
        remainingAfter: null,
        note: "Excess amount",
      });
    }
    
    return allocations;
  };

  const confirmReversePayment = async () => {
    if (!paymentToReverse || !(paymentToReverse._id || paymentToReverse.id)) return;

    try {
      const currentPayments = payment?.payments || [];
      const paymentId = paymentToReverse._id || paymentToReverse.id;
      const updatedPayments = currentPayments
        .filter(p => (p._id || p.id) !== paymentId)
        .map(p => cleanPaymentRecord(p));

      // Clean the payment object before sending
      const cleanedPayment = {
        paymentType: payment.paymentType,
        downPayment: payment.downPayment || 0,
        remainingAmount: payment.remainingAmount || 0,
        percentage: payment.percentage || 0,
        numberOfInstallments: payment.numberOfInstallments || 0,
        installmentDate: payment.installmentDate ? new Date(payment.installmentDate).toISOString() : undefined,
        calculatedAmount: payment.calculatedAmount || {},
        payments: updatedPayments,
      };

      await updateCustomer(customerId, {
        payment: cleanedPayment,
      });

      // Refresh customers list to get latest data from server
      await refreshCustomers();

      setReverseConfirmOpen(false);
      setPaymentToReverse(null);
      toast.success("Payment reversed successfully");
    } catch (error) {
      console.error("Error reversing payment:", error);
      toast.error(error.message || "Failed to reverse payment. Please try again.");
    }
  };

  // Helper function to clean payment record for API
  const cleanPaymentRecord = (record) => {
    if (!record) return null;
    
    const cleaned = {
      paymentDate: record.paymentDate ? new Date(record.paymentDate).toISOString() : new Date().toISOString(),
      amount: parseFloat(record.amount) || 0,
      notes: record.notes || "",
    };
    
    // Include installmentNumber only if it has a valid value (null is allowed for flexible payments)
    if (record.installmentNumber !== undefined && record.installmentNumber !== null) {
      cleaned.installmentNumber = parseInt(record.installmentNumber);
    } else if (record.installmentNumber === null) {
      // Explicitly set to null for flexible payments
      cleaned.installmentNumber = null;
    }
    
    // Include timestamps if they exist
    if (record.recordedAt) {
      cleaned.recordedAt = new Date(record.recordedAt).toISOString();
    }
    if (record.updatedAt) {
      cleaned.updatedAt = new Date(record.updatedAt).toISOString();
    }
    
    // Include _id if it exists (for updates) - MongoDB needs this for subdocuments
    if (record._id) {
      cleaned._id = record._id;
    } else if (record.id && typeof record.id === 'string') {
      cleaned._id = record.id;
    }
    
    return cleaned;
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    const paymentAmount = parseFloat(paymentFormData.amount) || 0;
    if (paymentAmount <= 0) {
      toast.error("Payment amount must be greater than 0");
      return;
    }

    // Validate that payment doesn't exceed total remaining amount
    if (isEditingPayment && paymentToReverse) {
      // When editing, calculate what the new total would be
      const currentTotalPaid = allPayments.reduce((sum, p) => {
        if ((p._id || p.id) === (paymentToReverse._id || paymentToReverse.id)) {
          return sum; // Exclude the payment being edited
        }
        return sum + (parseFloat(p.amount) || 0);
      }, 0);
      const newTotalPaid = currentTotalPaid + paymentAmount;
      const newRemaining = totalAmount - newTotalPaid;
      
      if (newRemaining < 0) {
        toast.error(`Payment amount cannot exceed the total remaining amount of Rs. ${totalRemainingAmount.toFixed(2)}`);
        return;
      }
    } else {
      // When adding new payment, check against total remaining
      if (paymentAmount > totalRemainingAmount) {
        toast.error(`Payment amount cannot exceed the total remaining amount of Rs. ${totalRemainingAmount.toFixed(2)}`);
        return;
      }
    }

    try {
      const paymentRecord = {
        installmentNumber: selectedInstallment?.number || null, // Optional for flexible payments
        paymentDate: paymentFormData.paymentDate,
        amount: paymentAmount,
        notes: paymentFormData.notes || "",
        recordedAt: isEditingPayment 
          ? (paymentToReverse?.recordedAt || new Date().toISOString())
          : new Date().toISOString(),
        updatedAt: isEditingPayment ? new Date().toISOString() : undefined,
      };

      // Include _id if editing
      if (isEditingPayment && paymentToReverse) {
        paymentRecord._id = paymentToReverse._id || paymentToReverse.id;
      }

      const currentPayments = payment?.payments || [];
      let updatedPayments;

      if (isEditingPayment && paymentToReverse) {
        // Update existing payment
        const paymentId = paymentToReverse._id || paymentToReverse.id;
        updatedPayments = currentPayments.map(p => {
          if ((p._id || p.id) === paymentId) {
            return cleanPaymentRecord({ ...p, ...paymentRecord });
          }
          return cleanPaymentRecord(p);
        });
      } else {
        // Add new payment - smart allocation will handle distribution
        updatedPayments = [
          ...currentPayments.map(p => cleanPaymentRecord(p)),
          cleanPaymentRecord(paymentRecord)
        ];
      }

      // Clean the payment object before sending
      const cleanedPayment = {
        paymentType: payment.paymentType,
        downPayment: payment.downPayment || 0,
        remainingAmount: payment.remainingAmount || 0,
        percentage: payment.percentage || 0,
        numberOfInstallments: payment.numberOfInstallments || 0,
        installmentDate: payment.installmentDate ? new Date(payment.installmentDate).toISOString() : undefined,
        calculatedAmount: payment.calculatedAmount || {},
        payments: updatedPayments,
      };

      await updateCustomer(customerId, {
        payment: cleanedPayment,
      });

      // Refresh customers list to get latest data from server
      await refreshCustomers();

      toast.success(isEditingPayment ? "Payment updated successfully" : "Payment recorded successfully");
      setPaymentModalOpen(false);
      setSelectedInstallment(null);
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
    }
  };

  return (
    <Dialog open={!!customerId} >
      <DialogContent 
        showCloseButton={false}
        className="!max-w-[95vw] sm:!max-w-[95vw] md:!max-w-[95vw] lg:!max-w-[95vw] !w-[95vw] max-h-[95vh] p-0 gap-0 flex flex-col"
      >
        {/* Compact Header with gradient and shadow */}
        <div className="relative bg-gradient-to-br from-primary via-primary/95 to-primary/90 text-primary-foreground p-2 rounded-t-lg shadow-lg flex-shrink-0">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djJoLTJ2LTJoMnptMC0yMHYyaC0yVjEyaDJ6TTIwIDM0djJoLTJ2LTJoMnptMC0yMHYyaC0yVjEyaDJ6TTM2IDIwVjE4aDJ2MmgtMnptLTIwIDB2LTJoMnYyaC0yek0xOCAxOGgydjJoLTJ6bTI0IDBoMnYyaC0yeiIvPjwvZz48L2c+PC9zdmc+')] opacity-20"></div>
          <DialogHeader className="relative space-y-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="relative p-1 bg-white/20 rounded-md backdrop-blur-md shadow-lg ring-1 ring-white/30">
                  <Calendar className="h-3.5 w-3.5" />
                  <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-400 rounded-full border border-white shadow-sm"></div>
                </div>
                <div>
                  <DialogTitle className="text-base sm:text-lg font-bold tracking-tight leading-tight">
                    Installments Ledger
                  </DialogTitle>
                  <DialogDescription className="text-primary-foreground/90 text-[10px] sm:text-xs leading-tight">
                    Payment schedule for <span className="font-semibold">{customer.fullName}</span>
                  </DialogDescription>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-primary-foreground hover:bg-white/20 rounded-full h-7 w-7 transition-all duration-200 flex-shrink-0"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </DialogHeader>
        </div>

        <div className="p-3 sm:p-4 space-y-3 bg-gradient-to-b from-background to-muted/20 overflow-y-auto flex-1 min-h-0">
          {/* Compact Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
            <div className="relative border border-blue-200/60 dark:border-blue-800/60 bg-gradient-to-br from-blue-50 via-blue-50/80 to-white dark:from-blue-950/40 dark:via-blue-900/30 dark:to-blue-950/50 rounded-md shadow-sm hover:shadow-md transition-all duration-300 p-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] sm:text-xs font-semibold text-muted-foreground/80 uppercase tracking-wide">
                  Total Amount
                </span>
                <div className="p-0.5 bg-blue-100 dark:bg-blue-900/50 rounded-md">
                  <DollarSign className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <div className="text-base sm:text-lg lg:text-xl font-bold text-blue-700 dark:text-blue-300 leading-none">
                Rs. {totalAmount.toFixed(2)}
              </div>
              <p className="text-[10px] text-muted-foreground/70 flex items-center gap-1 mt-0.5">
                <span className="w-1 h-1 rounded-full bg-blue-500"></span>
                Including interest
              </p>
            </div>

            <div className="relative border border-green-200/60 dark:border-green-800/60 bg-gradient-to-br from-green-50 via-green-50/80 to-white dark:from-green-950/40 dark:via-green-900/30 dark:to-green-950/50 rounded-md shadow-sm hover:shadow-md transition-all duration-300 p-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] sm:text-xs font-semibold text-muted-foreground/80 uppercase tracking-wide">
                  Paid Amount
                </span>
                <div className="p-0.5 bg-green-100 dark:bg-green-900/50 rounded-md">
                  <CheckCircle2 className="h-3 w-3 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <div className="text-base sm:text-lg lg:text-xl font-bold text-green-700 dark:text-green-300 leading-none">
                Rs. {paidAmount.toFixed(2)}
              </div>
              <p className="text-[10px] text-muted-foreground/70 flex items-center gap-1 mt-0.5">
                <span className="w-1 h-1 rounded-full bg-green-500"></span>
                {progressPercentage.toFixed(0)}% completed
              </p>
            </div>

            <div className="relative border border-orange-200/60 dark:border-orange-800/60 bg-gradient-to-br from-orange-50 via-orange-50/80 to-white dark:from-orange-950/40 dark:via-orange-900/30 dark:to-orange-950/50 rounded-md shadow-sm hover:shadow-md transition-all duration-300 p-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] sm:text-xs font-semibold text-muted-foreground/80 uppercase tracking-wide">
                  Remaining
                </span>
                <div className="p-0.5 bg-orange-100 dark:bg-orange-900/50 rounded-md">
                  <AlertCircle className="h-3 w-3 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
              <div className="text-base sm:text-lg lg:text-xl font-bold text-orange-700 dark:text-orange-300 leading-none">
                Rs. {remainingAmount.toFixed(2)}
              </div>
              <p className="text-[10px] text-muted-foreground/70 flex items-center gap-1 mt-0.5">
                <span className="w-1 h-1 rounded-full bg-orange-500"></span>
                Outstanding balance
              </p>
            </div>

            <div className="relative border border-purple-200/60 dark:border-purple-800/60 bg-gradient-to-br from-purple-50 via-purple-50/80 to-white dark:from-purple-950/40 dark:via-purple-900/30 dark:to-purple-950/50 rounded-md shadow-sm hover:shadow-md transition-all duration-300 p-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] sm:text-xs font-semibold text-muted-foreground/80 uppercase tracking-wide">
                  Pending
                </span>
                <div className="p-0.5 bg-purple-100 dark:bg-purple-900/50 rounded-md">
                  <Clock className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
              <div className="text-base sm:text-lg lg:text-xl font-bold text-purple-700 dark:text-purple-300 leading-none">
                {pendingInstallments}
              </div>
              <p className="text-[10px] text-muted-foreground/70 flex items-center gap-1 mt-0.5">
                <span className="w-1 h-1 rounded-full bg-purple-500"></span>
                {partialInstallments > 0 && `${partialInstallments} partial, `}
                {pendingInstallments} pending of {installments.length}
              </p>
            </div>
          </div>

          {/* Compact Progress Bar */}
          {installments.length > 0 && (
            <div className="border border-border rounded-md shadow-sm bg-gradient-to-br from-background to-muted/30 p-2">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="h-3.5 w-3.5 text-primary" />
                    <span className="font-semibold text-sm">Payment Progress</span>
                  </div>
                  <Badge variant="secondary" className="text-xs font-medium px-2 py-0.5">
                    {paidInstallments} paid{partialInstallments > 0 && `, ${partialInstallments} partial`} of {installments.length}
                  </Badge>
                </div>
                <div className="relative w-full bg-muted/60 rounded-full h-2.5 overflow-hidden shadow-inner">
                  <div
                    className="h-full bg-gradient-to-r from-green-500 via-green-500 to-green-600 transition-all duration-700 ease-out rounded-full relative overflow-hidden"
                    style={{ width: `${progressPercentage}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-foreground/60">
                      {progressPercentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
   {/* Compact Installment Schedule Table */}
   <div className="border border-border rounded-md shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-muted/50 to-muted/30 border-b px-2 py-1.5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <div className="flex items-center gap-2 text-sm font-bold">
                    <div className="p-1 bg-primary/10 rounded-md">
                      <TrendingUp className="h-3.5 w-3.5 text-primary" />
                    </div>
                    Installment Schedule
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Starting from{" "}
                    <span className="font-semibold text-foreground">
                      {payment?.installmentDate
                        ? new Date(payment.installmentDate).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })
                        : "N/A"}
                    </span>
                    {allocatePayments.unallocatedAmount > 0 && (
                      <span className="ml-2 text-green-600 dark:text-green-400 font-semibold">
                        • Rs. {allocatePayments.unallocatedAmount.toFixed(2)} unallocated
                      </span>
                    )}
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleRecordPayment(null)}
                  className="h-7 px-2 text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Record Payment
                </Button>
              </div>
            </div>
            <div className="p-0">
              <div className="rounded-lg border-0 overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/60 hover:bg-muted/60">
                        <TableHead className="font-bold text-xs uppercase tracking-wide py-2">Number</TableHead>
                        <TableHead className="font-bold text-xs uppercase tracking-wide py-2">Due Date</TableHead>
                        <TableHead className="text-right font-bold text-xs uppercase tracking-wide py-2">Required</TableHead>
                        <TableHead className="text-right font-bold text-xs uppercase tracking-wide py-2">Paid</TableHead>
                        <TableHead className="text-right font-bold text-xs uppercase tracking-wide py-2">Remaining</TableHead>
                        <TableHead className="text-right font-bold text-xs uppercase tracking-wide py-2">Status</TableHead>
                        <TableHead className="text-center font-bold text-xs uppercase tracking-wide py-2">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {installments.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={7}
                            className="text-center py-12 text-muted-foreground"
                          >
                            <div className="flex flex-col items-center gap-2">
                              <Calendar className="h-12 w-12 opacity-50" />
                              <p>No installments scheduled</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        installments.map((installment) => {
                          const now = new Date();
                          const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
                          const isOverdue =
                            (installment.status === "pending" || installment.status === "partial") &&
                            new Date(installment.date) < now;
                          const isDueSoon =
                            (installment.status === "pending" || installment.status === "partial") &&
                            new Date(installment.date) >= now &&
                            new Date(installment.date) <= sevenDaysFromNow;

                          return (
                            <TableRow
                              key={installment.number}
                              className={`transition-colors duration-200 ${
                                isOverdue
                                  ? "bg-destructive/5 hover:bg-destructive/10 border-l-2 border-destructive"
                                  : isDueSoon
                                  ? "bg-orange-50 dark:bg-orange-950/20 hover:bg-orange-100 dark:hover:bg-orange-950/30 border-l-2 border-orange-500"
                                  : "hover:bg-muted/50 border-l-2 border-transparent"
                              }`}
                            >
                              <TableCell className="font-semibold py-2">
                                <div className="flex items-center gap-2">
                                  <div
                                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shadow-sm ${
                                      installment.status === "paid"
                                        ? "bg-gradient-to-br from-green-500 to-green-600 text-white"
                                        : isOverdue
                                        ? "bg-gradient-to-br from-destructive to-destructive/80 text-white"
                                        : isDueSoon
                                        ? "bg-gradient-to-br from-orange-500 to-orange-600 text-white"
                                        : "bg-gradient-to-br from-muted to-muted/80 text-muted-foreground"
                                    }`}
                                  >
                                    {installment.number}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="py-2">
                                <div className="flex items-center gap-2">
                                  <div className="p-1 bg-primary/10 rounded-md">
                                    <Calendar className="h-3 w-3 text-primary" />
                                  </div>
                                  <div>
                                    <div className="font-semibold text-sm">
                                      {installment.date.toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                        year: "numeric",
                                      })}
                                    </div>
                                    <div className="text-[10px] text-muted-foreground font-medium">
                                      {installment.date.toLocaleDateString("en-US", {
                                        weekday: "short",
                                      })}
                                    </div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-right py-2">
                                <div className="flex flex-col items-end">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <span className="font-bold text-sm text-foreground">
                                      Rs. {installment.requiredAmount.toFixed(2)}
                                    </span>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-right py-2">
                                <div className="flex flex-col items-end">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <span className="font-bold text-sm text-green-600 dark:text-green-400">
                                      Rs. {installment.paidAmount.toFixed(2)}
                                    </span>
                                  </div>
                                  {installment.paidAmount > 0 && installment.status === "partial" && (
                                    <span className="text-[10px] text-muted-foreground mt-0.5">
                                      {((installment.paidAmount / installment.requiredAmount) * 100).toFixed(0)}%
                                    </span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-right py-2">
                                <div className="flex flex-col items-end">
                                  {installment.remainingAmount > 0 ? (
                                    <>
                                      <div className="flex items-center justify-end gap-1.5">
                                        <span className="font-bold text-sm text-orange-600 dark:text-orange-400">
                                          Rs. {installment.remainingAmount.toFixed(2)}
                                        </span>
                                      </div>
                                    </>
                                  ) : (
                                    <span className="text-xs text-muted-foreground">-</span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-right py-2">
                                {installment.status === "paid" ? (
                                  <Badge
                                    variant="default"
                                    className="bg-gradient-to-r from-green-600 to-green-700 text-white shadow-sm px-2 py-0.5 text-xs"
                                  >
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    Paid
                                  </Badge>
                                ) : installment.status === "partial" ? (
                                  <Badge
                                    variant="secondary"
                                    className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white shadow-sm px-2 py-0.5 text-xs"
                                  >
                                    <AlertCircle className="h-3 w-3 mr-1" />
                                    Partial
                                  </Badge>
                                ) : isOverdue ? (
                                  <Badge variant="destructive" className="shadow-sm px-2 py-0.5 text-xs">
                                    <AlertCircle className="h-3 w-3 mr-1" />
                                    Overdue
                                  </Badge>
                                ) : isDueSoon ? (
                                  <Badge
                                    variant="secondary"
                                    className="bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-sm px-2 py-0.5 text-xs"
                                  >
                                    <Clock className="h-3 w-3 mr-1" />
                                    Due Soon
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="shadow-sm px-2 py-0.5 text-xs border">
                                    <Clock className="h-3 w-3 mr-1" />
                                    Pending
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-center py-2">
                                {installment.paidAmount > 0 ? (
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-7 px-2 text-xs"
                                      >
                                        <MoreVertical className="h-3 w-3 mr-1" />
                                        Actions
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-56">
                                      <div className="px-2 py-1.5 text-xs text-muted-foreground space-y-1">
                                        <div className="font-semibold">Payment Details:</div>
                                        {installment.paymentRecords.length > 0 ? (
                                          installment.paymentRecords.map((paymentRecord, idx) => (
                                            <div key={idx} className="text-[10px] border-l-2 border-primary/30 pl-2 ml-1">
                                              <div>
                                                Rs. {parseFloat(paymentRecord.amount || 0).toFixed(2)} on{" "}
                                                {paymentRecord.paymentDate 
                                                  ? new Date(paymentRecord.paymentDate).toLocaleDateString("en-US", {
                                                      month: "short",
                                                      day: "numeric",
                                                      year: "numeric",
                                                    })
                                                  : "N/A"}
                                              </div>
                                              {paymentRecord.notes && (
                                                <div className="mt-0.5 italic text-muted-foreground">
                                                  {paymentRecord.notes}
                                                </div>
                                              )}
                                            </div>
                                          ))
                                        ) : (
                                          <div className="text-[10px]">No payment details</div>
                                        )}
                                      </div>
                                      <DropdownMenuSeparator />
                                      {installment.remainingAmount > 0 && (
                                        <>
                                          <DropdownMenuItem
                                            onClick={() => handleRecordPayment(installment)}
                                            className="cursor-pointer"
                                          >
                                            <Plus className="h-4 w-4 mr-2" />
                                            Add Payment
                                          </DropdownMenuItem>
                                          <DropdownMenuItem
                                            onClick={() => handleCopyReminderMessage(installment)}
                                            className="cursor-pointer"
                                          >
                                            {copiedInstallmentNumber === installment.number ? (
                                              <>
                                                <Check className="h-4 w-4 mr-2" />
                                                Message Copied!
                                              </>
                                            ) : (
                                              <>
                                                <MessageSquare className="h-4 w-4 mr-2" />
                                                Copy Reminder Message
                                              </>
                                            )}
                                          </DropdownMenuItem>
                                          <DropdownMenuItem
                                            onClick={() => handleOpenWhatsApp(installment)}
                                            className="cursor-pointer"
                                          >
                                            <MessageCircle className="h-4 w-4 mr-2" />
                                            Send via WhatsApp
                                          </DropdownMenuItem>
                                        </>
                                      )}
                                      {installment.paymentRecords.length > 0 && installment.paymentRecords.map((paymentRecord, idx) => (
                                        <div key={idx}>
                                          <DropdownMenuItem
                                            onClick={() => handleEditPayment(paymentRecord)}
                                            className="cursor-pointer"
                                          >
                                            <Edit className="h-4 w-4 mr-2" />
                                            Edit Payment (Rs. {parseFloat(paymentRecord.amount || 0).toFixed(2)})
                                          </DropdownMenuItem>
                                          <DropdownMenuItem
                                            onClick={() => handleReversePayment(paymentRecord)}
                                            className="cursor-pointer text-destructive"
                                          >
                                            <RotateCcw className="h-4 w-4 mr-2" />
                                            Reverse Payment (Rs. {parseFloat(paymentRecord.amount || 0).toFixed(2)})
                                          </DropdownMenuItem>
                                        </div>
                                      ))}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                ) : (
                                  <div className="flex items-center gap-1">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleRecordPayment(installment)}
                                      className="h-7 px-2 text-xs"
                                    >
                                      <Plus className="h-3 w-3 mr-1" />
                                      Record Payment
                                    </Button>
                                    {customer.contactInfo && (
                                      <>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => handleCopyReminderMessage(installment)}
                                          className="h-7 px-2 text-xs"
                                          title="Copy reminder message"
                                        >
                                          {copiedInstallmentNumber === installment.number ? (
                                            <Check className="h-3 w-3" />
                                          ) : (
                                            <MessageSquare className="h-3 w-3" />
                                          )}
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => handleOpenWhatsApp(installment)}
                                          className="h-7 px-2 text-xs bg-green-50 hover:bg-green-100 dark:bg-green-950/20 dark:hover:bg-green-950/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800"
                                          title="Send via WhatsApp"
                                        >
                                          <MessageCircle className="h-3 w-3" />
                                        </Button>
                                      </>
                                    )}
                                  </div>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </div>
          
          {/* Compact Payment Terms */}
          {payment && payment.paymentType === "installment" && (
            <div className="bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 border border-primary/20 rounded-md shadow-sm overflow-hidden">
              <div className="px-2 pt-2 pb-1.5 bg-gradient-to-r from-primary/10 to-primary/5 border-b">
                <div className="flex items-center gap-2 text-sm font-bold">
                  <div className="p-1 bg-primary/20 rounded-md">
                    <CreditCard className="h-3.5 w-3.5 text-primary" />
                  </div>
                  Payment Terms
                </div>
              </div>
              <div className="px-2 pb-2 pt-2">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                  <div className="space-y-1 p-2 rounded-md bg-background/50 border border-border/50 hover:border-primary/30 transition-colors">
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
                      <DollarSign className="h-3 w-3 text-primary" />
                      <span>Down Payment</span>
                    </div>
                    <p className="text-base sm:text-lg font-bold break-words leading-tight text-foreground">
                      Rs. {payment.downPayment || "0.00"}
                    </p>
                  </div>
                  <div className="space-y-1 p-2 rounded-md bg-background/50 border border-border/50 hover:border-primary/30 transition-colors">
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
                      <Percent className="h-3 w-3 text-primary" />
                      <span>Interest Rate</span>
                    </div>
                    <p className="text-base sm:text-lg font-bold break-words leading-tight text-foreground">
                      {payment.percentage || "0"}%
                    </p>
                  </div>
                  <div className="space-y-1 p-2 rounded-md bg-background/50 border border-border/50 hover:border-primary/30 transition-colors">
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
                      <Calendar className="h-3 w-3 text-primary" />
                      <span>Installments</span>
                    </div>
                    <p className="text-base sm:text-lg font-bold break-words leading-tight text-foreground">
                      {payment.numberOfInstallments} months
                    </p>
                  </div>
                  <div className="space-y-1 p-2 rounded-md bg-background/50 border border-border/50 hover:border-primary/30 transition-colors">
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
                      <TrendingUp className="h-3 w-3 text-primary" />
                      <span>Monthly Payment</span>
                    </div>
                    <p className="text-base sm:text-lg font-bold break-words leading-tight text-green-600 dark:text-green-400">
                      Rs. {payment.calculatedAmount?.installmentAmount.toFixed(2) || "0.00"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* Compact Customer & Phone Info Cards */}
          <TooltipProvider>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Customer Info */}
              <div className="border border-border rounded-md shadow-sm hover:shadow-md transition-shadow duration-300 bg-gradient-to-br from-background to-muted/20 overflow-hidden">
                <div className="px-2 pt-2 pb-1.5 bg-gradient-to-r from-primary/5 to-primary/10 border-b">
                  <div className="flex items-center gap-2 text-sm font-bold">
                    <div className="p-1 bg-primary/10 rounded-md">
                      <User className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <span className="truncate">Customer Information</span>
                  </div>
                </div>
                <div className="px-2 pb-2 pt-2">
                  <div className="flex flex-col md:flex-row md:gap-3 space-y-1.5 md:space-y-0">
                    <div className="flex-1 space-y-0.5 min-w-0">
                      <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Full Name</p>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <p className="font-semibold text-sm truncate text-foreground">{customer.fullName}</p>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{customer.fullName}</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <div className="flex-1 space-y-0.5 min-w-0">
                      <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">ID Number</p>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <p className="font-semibold text-sm truncate font-mono text-foreground">{customer.idNo}</p>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{customer.idNo}</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    {customer.contactInfo && (
                      <div className="flex-1 space-y-0.5 min-w-0">
                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Contact</p>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <p className="font-semibold text-sm truncate text-foreground">{customer.contactInfo}</p>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{customer.contactInfo}</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Phone Details */}
              {customer.phone && (
                <div className="border border-border rounded-md shadow-sm hover:shadow-md transition-shadow duration-300 bg-gradient-to-br from-background to-muted/20 overflow-hidden">
                  <div className="px-2 pt-2 pb-1.5 bg-gradient-to-r from-primary/5 to-primary/10 border-b">
                    <div className="flex items-center gap-2 text-sm font-bold">
                      <div className="p-1 bg-primary/10 rounded-md">
                        <Smartphone className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <span className="truncate">Phone Details</span>
                    </div>
                  </div>
                  <div className="px-2 pb-2 pt-2">
                    <div className="flex flex-col md:flex-row md:gap-3 space-y-1.5 md:space-y-0">
                      <div className="flex-1 space-y-0.5 min-w-0">
                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Phone Name</p>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <p className="font-semibold text-sm truncate text-foreground">{customer.phone.name}</p>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{customer.phone.name}</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <div className="flex-1 space-y-0.5 min-w-0">
                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Model</p>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <p className="font-semibold text-sm truncate text-foreground">{customer.phone.model}</p>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{customer.phone.model}</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <div className="flex-1 space-y-0.5 min-w-0">
                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Price</p>
                        <p className="font-semibold text-sm truncate text-green-600 dark:text-green-400">Rs. {customer.phone.price}</p>
                      </div>
                      <div className="flex-1 space-y-0.5 min-w-0">
                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">IMEI</p>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <p className="font-semibold font-mono text-xs truncate text-foreground bg-muted/50 p-1 rounded-md">
                              {customer.phone.imeiNo}
                              {customer.phone.imeiNo2 && ` / ${customer.phone.imeiNo2}`}
                            </p>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="space-y-1">
                              <p className="font-mono">IMEI 1: {customer.phone.imeiNo}</p>
                              {customer.phone.imeiNo2 && (
                                <p className="font-mono">IMEI 2: {customer.phone.imeiNo2}</p>
                              )}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </TooltipProvider>

          {/* Payment History Section */}
          {allPayments.length > 0 && (
            <div className="border border-border rounded-md shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-muted/50 to-muted/30 border-b px-2 py-1.5">
                <div className="flex items-center gap-2 text-sm font-bold">
                  <div className="p-1 bg-primary/10 rounded-md">
                    <History className="h-3.5 w-3.5 text-primary" />
                  </div>
                  Payment History
                </div>
              </div>
              <div className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/60 hover:bg-muted/60">
                        <TableHead className="font-bold text-xs uppercase tracking-wide py-2">Installment #</TableHead>
                        <TableHead className="font-bold text-xs uppercase tracking-wide py-2">Payment Date</TableHead>
                        <TableHead className="text-right font-bold text-xs uppercase tracking-wide py-2">Amount</TableHead>
                        <TableHead className="font-bold text-xs uppercase tracking-wide py-2">Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allPayments
                        .sort((a, b) => {
                          const dateA = new Date(a.paymentDate || a.recordedAt);
                          const dateB = new Date(b.paymentDate || b.recordedAt);
                          return dateB - dateA; // Most recent first
                        })
                        .map((paymentRecord, index) => {
                          // Find which installments this payment was allocated to
                          const allocatedInstallments = installments.filter(i => 
                            i.paymentRecords.some(p => (p._id || p.id) === (paymentRecord._id || paymentRecord.id))
                          );
                          return (
                          <TableRow key={index} className="hover:bg-muted/50">
                            <TableCell className="font-semibold py-2">
                              <div className="flex items-center gap-1 flex-wrap">
                                {paymentRecord.installmentNumber ? (
                                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shadow-sm bg-gradient-to-br from-green-500 to-green-600 text-white">
                                    {paymentRecord.installmentNumber}
                                  </div>
                                ) : allocatedInstallments.length > 0 ? (
                                  allocatedInstallments.map((inst, idx) => (
                                    <div 
                                      key={idx}
                                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shadow-sm bg-gradient-to-br from-blue-500 to-blue-600 text-white"
                                      title={`Installment #${inst.number}`}
                                    >
                                      {inst.number}
                                    </div>
                                  ))
                                ) : (
                                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shadow-sm bg-gradient-to-br from-gray-500 to-gray-600 text-white">
                                    ?
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="py-2">
                              <div className="flex items-center gap-2">
                                <div className="p-1 bg-primary/10 rounded-md">
                                  <Calendar className="h-3 w-3 text-primary" />
                                </div>
                                <div>
                                  <div className="font-semibold text-sm">
                                    {new Date(paymentRecord.paymentDate).toLocaleDateString("en-US", {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                    })}
                                  </div>
                                  <div className="text-[10px] text-muted-foreground font-medium">
                                    {new Date(paymentRecord.paymentDate).toLocaleDateString("en-US", {
                                      weekday: "short",
                                    })}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-right py-2">
                              <div className="flex items-center justify-end gap-1.5">
                                <span className="font-bold text-sm text-green-600 dark:text-green-400">
                                  Rs. {parseFloat(paymentRecord.amount || 0).toFixed(2)}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="py-2">
                              <div className="space-y-1">
                                <span className="text-sm text-muted-foreground">
                                  {paymentRecord.notes || "-"}
                                </span>
                                {allocatedInstallments.length > 1 && (
                                  <div className="text-[10px] text-muted-foreground">
                                    Allocated to installments: {allocatedInstallments.map(i => `#${i.number}`).join(", ")}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                        })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}

       
        </div>
      </DialogContent>

      {/* Payment Recording Modal */}
      <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              {isEditingPayment ? "Edit Payment" : "Record Payment"}
            </DialogTitle>
            <DialogDescription>
              {isEditingPayment 
                ? `Edit payment record`
                : selectedInstallment 
                ? `Record payment for Installment #${selectedInstallment.number} (Remaining: Rs. ${selectedInstallment.remainingAmount.toFixed(2)})`
                : `Record flexible payment - will be automatically allocated to pending installments`}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePaymentSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="paymentDate">Payment Date</Label>
              <Input
                id="paymentDate"
                type="date"
                value={paymentFormData.paymentDate}
                onChange={(e) =>
                  setPaymentFormData({ ...paymentFormData, paymentDate: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">
                Amount
                {selectedInstallment && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    (Remaining: Rs. {selectedInstallment.remainingAmount.toFixed(2)})
                  </span>
                )}
              </Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={paymentFormData.amount}
                onChange={(e) =>
                  setPaymentFormData({ ...paymentFormData, amount: e.target.value })
                }
                required
                placeholder={selectedInstallment ? `Remaining: Rs. ${selectedInstallment.remainingAmount.toFixed(2)}` : "Enter payment amount"}
              />
              {!selectedInstallment && (
                <p className="text-xs text-muted-foreground">
                  Total remaining amount: Rs. {totalRemainingAmount.toFixed(2)}. This payment will be automatically allocated to the oldest pending installment(s).
                </p>
              )}
              {selectedInstallment && (
                <p className="text-xs text-muted-foreground">
                  Remaining balance for this installment: Rs. {selectedInstallment.remainingAmount.toFixed(2)}
                </p>
              )}
              {paymentFormData.amount && parseFloat(paymentFormData.amount) > totalRemainingAmount && (
                <p className="text-xs text-destructive font-medium">
                  ⚠️ Payment amount exceeds total remaining amount (Rs. {totalRemainingAmount.toFixed(2)}). Please enter a valid amount.
                </p>
              )}
              {paymentFormData.amount && parseFloat(paymentFormData.amount) > 0 && (
                <div className="mt-2 p-2 bg-muted/50 rounded-md border border-border">
                  <div className="text-xs font-semibold mb-1.5">Payment Allocation Preview:</div>
                  {calculatePaymentAllocation(paymentFormData.amount).map((allocation, idx) => (
                    <div key={idx} className="text-xs text-muted-foreground flex items-center justify-between py-0.5">
                      <span>
                        {allocation.installmentNumber 
                          ? `Installment #${allocation.installmentNumber}`
                          : allocation.note}
                      </span>
                      <span className="font-semibold text-foreground">
                        Rs. {allocation.amount.toFixed(2)}
                        {allocation.remainingAfter !== null && (
                          <span className="text-muted-foreground ml-1">
                            (Remaining: Rs. {allocation.remainingAfter.toFixed(2)})
                          </span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={paymentFormData.notes}
                onChange={(e) =>
                  setPaymentFormData({ ...paymentFormData, notes: e.target.value })
                }
                placeholder="Add any additional notes about this payment..."
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setPaymentModalOpen(false);
                  setSelectedInstallment(null);
                  setIsEditingPayment(false);
                  setPaymentFormData({
                    paymentDate: new Date().toISOString().split('T')[0],
                    amount: "",
                    notes: "",
                  });
                }}
              >
                Cancel
              </Button>
              <Button type="submit">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                {isEditingPayment ? "Update Payment" : "Record Payment"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reverse Payment Confirmation Dialog */}
      <Dialog open={reverseConfirmOpen} onOpenChange={setReverseConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Reverse Payment
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to reverse this payment?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-muted/50 p-3 rounded-md space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Payment Date:</span>
                <span className="font-semibold">
                  {paymentToReverse?.paymentDate 
                    ? new Date(paymentToReverse.paymentDate).toLocaleDateString()
                    : "N/A"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Amount:</span>
                <span className="font-semibold text-green-600 dark:text-green-400">
                  Rs. {paymentToReverse?.amount 
                    ? parseFloat(paymentToReverse.amount).toFixed(2)
                    : "0.00"}
                </span>
              </div>
              {paymentToReverse?.installmentNumber && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Installment #:</span>
                  <span className="font-semibold">
                    {paymentToReverse.installmentNumber}
                  </span>
                </div>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              This action will remove the payment and recalculate installment balances. This cannot be undone.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setReverseConfirmOpen(false);
                setPaymentToReverse(null);
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmReversePayment}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reverse Payment
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
