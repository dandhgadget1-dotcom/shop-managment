"use client";

import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { MoreVertical, Edit, Trash2, CreditCard, FileText, Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, DollarSign, TrendingUp, Clock, Users, BarChart3, FolderOpen, Printer, Settings, Plus, Loader2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency } from "@/lib/utils";
import { useShop } from "@/context/ShopContext";
import CustomerCompleteForm from "./modals/CustomerCompleteForm";
import PaymentModal from "./modals/PaymentModal";
import InstallmentsLedger from "./InstallmentsLedger";
import PartialPaymentLedger from "./PartialPaymentLedger";
import DocumentsViewModal from "./modals/DocumentsViewModal";
import Receipt from "./receipt/Receipt";
import ShopSettingsModal from "./settings/ShopSettingsModal";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function CustomersTable() {
  const { customers, deleteCustomer, loading } = useShop();
  const [editingCustomerId, setEditingCustomerId] = useState(null);
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [activeSection, setActiveSection] = useState(null); // "customer", "supportingPerson", "phone", or null for all
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [ledgerCustomerId, setLedgerCustomerId] = useState(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [customerTypeFilter, setCustomerTypeFilter] = useState("all"); // "all", "direct", "installment", "partial"
  const [partialLedgerCustomerId, setPartialLedgerCustomerId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [statsModalOpen, setStatsModalOpen] = useState(false);
  const [documentsModalOpen, setDocumentsModalOpen] = useState(false);
  const [viewingCustomerId, setViewingCustomerId] = useState(null);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [receiptCustomer, setReceiptCustomer] = useState(null);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);

  const handleEdit = (id, section = null) => {
    setEditingCustomerId(id);
    setActiveSection(section);
    setCustomerModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this customer?")) {
      try {
        await deleteCustomer(id);
      } catch (error) {
        alert("Failed to delete customer. Please try again.");
        console.error("Error deleting customer:", error);
      }
    }
  };

  const handleAddPayment = (id) => {
    setSelectedCustomerId(id);
    setPaymentModalOpen(true);
  };

  const handleViewLedger = (id) => {
    setLedgerCustomerId(id);
  };

  const handleViewDocuments = (id) => {
    setViewingCustomerId(id);
    setDocumentsModalOpen(true);
  };

  const handlePrintReceipt = (customer) => {
    setReceiptCustomer(customer);
    setReceiptModalOpen(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  // Helper function to calculate payment statistics for a customer
  const getPaymentStats = (customer) => {
    if (!customer.payment) {
      return {
        remainingAmount: null,
        pendingInstallments: null,
        paidInstallments: null,
        totalInstallments: null,
      };
    }

    const payment = customer.payment;
    
    // Handle direct payments with partial payments
    if (payment.paymentType === "direct") {
      const phonePrice = Math.round(parseFloat(customer.phone?.price) || 0);
      const payments = payment.payments || [];
      const paidAmount = payments.reduce((sum, p) => sum + Math.round(parseFloat(p.amount) || 0), 0);
      const remainingAmount = Math.max(0, phonePrice - paidAmount);
      
      return {
        remainingAmount,
        pendingInstallments: null,
        paidInstallments: null,
        totalInstallments: null,
      };
    }
    
    // Handle partial payments (dedicated partial payment type)
    if (payment.paymentType === "partial") {
      const phonePrice = Math.round(parseFloat(customer.phone?.price) || 0);
      const payments = payment.payments || [];
      const paidAmount = payments.reduce((sum, p) => sum + Math.round(parseFloat(p.amount) || 0), 0);
      const remainingAmount = Math.max(0, phonePrice - paidAmount);
      
      return {
        remainingAmount,
        pendingInstallments: null,
        paidInstallments: null,
        totalInstallments: null,
      };
    }
    
    // Handle installment payments
    if (payment.paymentType === "installment") {
      const totalAmount = Math.round(payment.calculatedAmount?.totalWithInterest || 0);
      const payments = payment.payments || [];
      const paidAmount = payments.reduce((sum, p) => sum + Math.round(parseFloat(p.amount) || 0), 0);
      const remainingAmount = totalAmount - paidAmount;
      const totalInstallments = parseInt(payment.numberOfInstallments) || 0;
      const paidInstallments = payments.length;
      const pendingInstallments = totalInstallments - paidInstallments;

      return {
        remainingAmount,
        pendingInstallments,
        paidInstallments,
        totalInstallments,
      };
    }

    return {
      remainingAmount: null,
      pendingInstallments: null,
      paidInstallments: null,
      totalInstallments: null,
    };
  };

  // Filter customers based on search query and payment type
  const filteredCustomers = useMemo(() => {
    let filtered = customers;

    // Filter by payment type first
    if (customerTypeFilter !== "all") {
      filtered = filtered.filter((customer) => {
        const paymentType = customer.payment?.paymentType;
        if (customerTypeFilter === "direct") {
          return paymentType === "direct";
        } else if (customerTypeFilter === "installment") {
          return paymentType === "installment";
        } else if (customerTypeFilter === "partial") {
          return paymentType === "partial";
        }
        return true;
      });
    }

    // Then filter by search query
    if (!searchQuery.trim()) {
      return filtered;
    }

    const query = searchQuery.toLowerCase().trim();
    return filtered.filter((customer) => {
      const fullName = customer.fullName?.toLowerCase() || "";
      const idNo = customer.idNo?.toLowerCase() || "";
      const phoneName = customer.phone?.name?.toLowerCase() || "";
      const phoneModel = customer.phone?.model?.toLowerCase() || "";
      const paymentType = customer.payment?.paymentType?.toLowerCase() || "";
      const contactInfo = customer.contactInfo?.toLowerCase() || "";

      return (
        fullName.includes(query) ||
        idNo.includes(query) ||
        phoneName.includes(query) ||
        phoneModel.includes(query) ||
        paymentType.includes(query) ||
        contactInfo.includes(query)
      );
    });
  }, [customers, searchQuery, customerTypeFilter]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCustomers = filteredCustomers.slice(startIndex, endIndex);


  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Calculate statistics
  const stats = useMemo(() => {
    let totalSold = 0;
    let totalPending = 0;
    let totalPaid = 0;
    let directPayments = 0;
    let installmentPayments = 0;
    let partialPayments = 0;
    let totalCustomers = customers.length;
    let customersWithPhones = 0;
    let customersWithPayments = 0;
    let totalInstallments = 0;
    let paidInstallments = 0;

    customers.forEach((customer) => {
      const phonePrice = customer.phone ? Math.round(parseFloat(customer.phone.price) || 0) : 0;
      
      if (customer.phone) {
        customersWithPhones++;
        totalSold += phonePrice;
      }

      if (customer.payment) {
        customersWithPayments++;
        const payment = customer.payment;

        if (payment.paymentType === "direct") {
          directPayments++;
          const payments = payment.payments || [];
          const paidAmount = payments.reduce((sum, p) => sum + Math.round(parseFloat(p.amount) || 0), 0);
          totalPaid += paidAmount;
          totalPending += Math.max(0, phonePrice - paidAmount);
        } else if (payment.paymentType === "partial") {
          partialPayments++;
          const payments = payment.payments || [];
          const paidAmount = payments.reduce((sum, p) => sum + Math.round(parseFloat(p.amount) || 0), 0);
          totalPaid += paidAmount;
          totalPending += Math.max(0, phonePrice - paidAmount);
        } else if (payment.paymentType === "installment") {
          installmentPayments++;
          const totalWithInterest = Math.round(payment.calculatedAmount?.totalWithInterest || 0);
          const payments = payment.payments || [];
          const paidAmount = payments.reduce((sum, p) => sum + Math.round(parseFloat(p.amount) || 0), 0);
          totalPaid += paidAmount;
          totalPending += totalWithInterest - paidAmount;
          
          // Count installments
          const numberOfInstallments = parseInt(payment.numberOfInstallments) || 0;
          totalInstallments += numberOfInstallments;
          paidInstallments += payments.length;
        }
      } else if (customer.phone) {
        // Customer has phone but no payment set
        totalPending += phonePrice;
      }
    });

    return {
      totalSold,
      totalPending,
      totalPaid,
      directPayments,
      installmentPayments,
      partialPayments,
      totalCustomers,
      customersWithPhones,
      customersWithPayments,
      totalInstallments,
      paidInstallments,
    };
  }, [customers]);

  return (
    <>
      {/* Quick Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4">
        <div className="border border-border rounded-lg p-3 sm:p-2.5 bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/20 dark:to-green-900/10 shadow-sm">
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-1">
            <DollarSign className="h-4 w-4 sm:h-3.5 sm:w-3.5 text-green-600 dark:text-green-400 shrink-0" />
            <span className="text-[10px] sm:text-xs text-muted-foreground truncate">Total Sold</span>
          </div>
          <div className="text-base sm:text-lg font-bold text-green-700 dark:text-green-400 truncate">
            {loading ? (
              <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin inline-block" />
            ) : (
              <span className="truncate block">{formatCurrency(stats.totalSold)}</span>
            )}
          </div>
        </div>

        <div className="border border-border rounded-lg p-3 sm:p-2.5 bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-950/20 dark:to-orange-900/10 shadow-sm">
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-1">
            <Clock className="h-4 w-4 sm:h-3.5 sm:w-3.5 text-orange-600 dark:text-orange-400 shrink-0" />
            <span className="text-[10px] sm:text-xs text-muted-foreground truncate">Pending</span>
          </div>
          <div className="text-base sm:text-lg font-bold text-orange-700 dark:text-orange-400 truncate">
            {loading ? (
              <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin inline-block" />
            ) : (
              <span className="truncate block">{formatCurrency(stats.totalPending)}</span>
            )}
          </div>
        </div>

        <div className="border border-border rounded-lg p-3 sm:p-2.5 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/10 shadow-sm">
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-1">
            <TrendingUp className="h-4 w-4 sm:h-3.5 sm:w-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
            <span className="text-[10px] sm:text-xs text-muted-foreground truncate">Total Paid</span>
          </div>
          <div className="text-base sm:text-lg font-bold text-blue-700 dark:text-blue-400 truncate">
            {loading ? (
              <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin inline-block" />
            ) : (
              <span className="truncate block">{formatCurrency(stats.totalPaid)}</span>
            )}
          </div>
        </div>

        <div className="border border-border rounded-lg p-3 sm:p-2.5 bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/20 dark:to-purple-900/10 shadow-sm">
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-1">
            <Users className="h-4 w-4 sm:h-3.5 sm:w-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
            <span className="text-[10px] sm:text-xs text-muted-foreground truncate">Customers</span>
          </div>
          <div className="text-base sm:text-lg font-bold text-purple-700 dark:text-purple-400">
            {loading ? (
              <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin inline-block" />
            ) : (
              stats.totalCustomers
            )}
          </div>
        </div>
      </div>

      {/* Customer Type Filter, Search Bar and Settings */}
      <div className="mb-4 space-y-3">
        {/* Mobile: Stack vertically, Desktop: Horizontal */}
        <div className="flex flex-col sm:flex-row gap-2">
          <Tabs value={customerTypeFilter} onValueChange={(value) => {
            setCustomerTypeFilter(value);
            setCurrentPage(1); // Reset to first page when filter changes
          }} className="w-full sm:w-auto">
            <TabsList className="grid grid-cols-4 w-full sm:w-auto">
              <TabsTrigger value="all" className="text-xs sm:text-sm">All</TabsTrigger>
              <TabsTrigger value="direct" className="text-xs sm:text-sm">Direct</TabsTrigger>
              <TabsTrigger value="partial" className="text-xs sm:text-sm">Partial</TabsTrigger>
              <TabsTrigger value="installment" className="text-xs sm:text-sm">Install</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search customers..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1); // Reset to first page when search changes
              }}
              className="pl-10 w-full text-sm"
            />
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            onClick={() => handleEdit(null)}
            className="flex-1 sm:flex-initial shrink-0"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Add Customer</span>
            <span className="sm:hidden">Add</span>
          </Button>
          <ThemeToggle />
          <Button
            variant="outline"
            onClick={() => setSettingsModalOpen(true)}
            className="shrink-0"
            size="sm"
          >
            <Settings className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Settings</span>
          </Button>
        </div>
      </div>

      <div className="rounded-md border overflow-hidden relative">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading customers...</p>
            </div>
          </div>
        ) : paginatedCustomers.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            {searchQuery ? (
              <>No customers found matching &quot;{searchQuery}&quot;. Try a different search term.</>
            ) : (
              <>No customers found. Add a new customer to get started.</>
            )}
          </div>
        ) : (
          <>
            {/* Mobile Card View - Hidden on md and above */}
            <div className="md:hidden space-y-3 p-3">
              {paginatedCustomers.map((customer) => {
                const stats = getPaymentStats(customer);
                const displayAmount = stats.remainingAmount !== null ? Math.max(0, stats.remainingAmount) : null;
                const isFullyPaid = displayAmount !== null && displayAmount <= 0;
                
                return (
                  <div
                    key={customer.id}
                    className="bg-card border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow space-y-3"
                  >
                    {/* Header with Name and Actions */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-base truncate">{customer.fullName}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">ID: {customer.idNo}</p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0">
                            <MoreVertical className="h-5 w-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => handleEdit(customer.id, "customer")}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Customer
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleViewDocuments(customer.id)}>
                            <FolderOpen className="mr-2 h-4 w-4" />
                            View Documents
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleAddPayment(customer.id)}>
                            <CreditCard className="mr-2 h-4 w-4" />
                            {customer.payment ? "Edit" : "Add"} Payment
                          </DropdownMenuItem>
                          {customer.payment?.paymentType === "installment" && (
                            <DropdownMenuItem onClick={() => handleViewLedger(customer.id)}>
                              <FileText className="mr-2 h-4 w-4" />
                              View Installments
                            </DropdownMenuItem>
                          )}
                          {customer.payment?.paymentType === "partial" && (
                            <DropdownMenuItem onClick={() => setPartialLedgerCustomerId(customer.id)}>
                              <FileText className="mr-2 h-4 w-4" />
                              View Partial Payments
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => handlePrintReceipt(customer)}>
                            <Printer className="mr-2 h-4 w-4" />
                            Print Receipt
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(customer.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Phone Info */}
                    {customer.phone ? (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-muted-foreground">Phone:</span>
                          <span className="font-semibold text-sm">{customer.phone.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">{customer.phone.model}</span>
                          <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                            {formatCurrency(customer.phone.price)}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground">No phone assigned</div>
                    )}

                    {/* Payment Info */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Payment Type</p>
                        {customer.payment ? (
                          <Badge
                            variant={
                              customer.payment.paymentType === "direct" ? "default" : "secondary"
                            }
                            className="text-xs"
                          >
                            {customer.payment.paymentType === "direct"
                              ? "Direct"
                              : customer.payment.paymentType === "partial"
                              ? "Partial"
                              : "Installment"}
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">Not set</Badge>
                        )}
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Status</p>
                        {(() => {
                          if (customer.payment?.paymentType === "installment") {
                            return (
                              <Badge 
                                variant={isFullyPaid ? "success" : "outline"} 
                                className="text-xs"
                              >
                                {isFullyPaid ? "Paid" : "Active"}
                              </Badge>
                            );
                          } else if (customer.payment?.paymentType === "direct" || customer.payment?.paymentType === "partial") {
                            return (
                              <Badge 
                                variant={isFullyPaid ? "success" : "outline"} 
                                className="text-xs"
                              >
                                {isFullyPaid ? "Paid" : "Partial"}
                              </Badge>
                            );
                          } else {
                            return <Badge variant="secondary" className="text-xs">Pending</Badge>;
                          }
                        })()}
                      </div>
                    </div>

                    {/* Financial Info */}
                    {displayAmount !== null && (
                      <div className="pt-2 border-t">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Remaining:</span>
                          <span className={`font-semibold text-sm ${displayAmount > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-green-600 dark:text-green-400'}`}>
                            {formatCurrency(displayAmount)}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Installment Info */}
                    {stats.totalInstallments !== null && (
                      <div className="pt-2 border-t">
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div>
                            <p className="text-xs text-muted-foreground">Paid</p>
                            <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                              {stats.paidInstallments}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Pending</p>
                            <p className="text-sm font-semibold text-orange-600 dark:text-orange-400">
                              {stats.pendingInstallments}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Total</p>
                            <p className="text-sm font-semibold">{stats.totalInstallments}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Desktop Table View - Hidden on mobile */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[120px]">Full Name</TableHead>
                    <TableHead className="min-w-[100px]">ID Number</TableHead>
                    <TableHead className="min-w-[150px]">Phone</TableHead>
                    <TableHead className="min-w-[100px]">Payment Type</TableHead>
                    <TableHead className="min-w-[80px] hidden lg:table-cell">Status</TableHead>
                    <TableHead className="min-w-[120px] hidden lg:table-cell">Remaining Amount</TableHead>
                    <TableHead className="min-w-[100px] hidden lg:table-cell">Installments</TableHead>
                    <TableHead className="min-w-[100px] hidden xl:table-cell">Created</TableHead>
                    <TableHead className="text-right w-[50px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedCustomers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span>{customer.fullName}</span>
                      </div>
                    </TableCell>
                    <TableCell>{customer.idNo}</TableCell>
                    <TableCell>
                      {customer.phone ? (
                        <div className="space-y-1">
                          <div className="font-medium text-sm sm:text-base">
                            {customer.phone.name}
                          </div>
                          <div className="text-xs sm:text-sm text-muted-foreground">
                            {customer.phone.model}
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">No phone</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {customer.payment ? (
                        <Badge
                          variant={
                            customer.payment.paymentType === "direct" ? "default" : "secondary"
                          }
                          className="text-xs"
                        >
                          {customer.payment.paymentType === "direct"
                            ? "Direct"
                            : customer.payment.paymentType === "partial"
                            ? "Partial"
                            : "Installment"}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">Not set</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {(() => {
                        if (customer.payment?.paymentType === "installment") {
                          const stats = getPaymentStats(customer);
                          const isFullyPaid = stats.remainingAmount !== null && stats.remainingAmount <= 0;
                          return (
                            <Badge 
                              variant={isFullyPaid ? "success" : "outline"} 
                              className="text-xs"
                            >
                              {isFullyPaid ? "Paid" : "Active"}
                            </Badge>
                          );
                        } else if (customer.payment?.paymentType === "direct") {
                          const stats = getPaymentStats(customer);
                          const isFullyPaid = stats.remainingAmount !== null && stats.remainingAmount <= 0;
                          return (
                            <Badge 
                              variant={isFullyPaid ? "success" : "outline"} 
                              className="text-xs"
                            >
                              {isFullyPaid ? "Paid" : "Partial"}
                            </Badge>
                          );
                        } else if (customer.payment?.paymentType === "partial") {
                          const stats = getPaymentStats(customer);
                          const isFullyPaid = stats.remainingAmount !== null && stats.remainingAmount <= 0;
                          return (
                            <Badge 
                              variant={isFullyPaid ? "success" : "outline"} 
                              className="text-xs"
                            >
                              {isFullyPaid ? "Paid" : "Partial"}
                            </Badge>
                          );
                        } else {
                          return <Badge variant="secondary" className="text-xs">Pending</Badge>;
                        }
                      })()}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {(() => {
                        const stats = getPaymentStats(customer);
                        if (stats.remainingAmount === null) {
                          return <span className="text-muted-foreground text-sm">-</span>;
                        }
                        const displayAmount = Math.max(0, stats.remainingAmount);
                        return (
                          <span className={`font-medium text-sm ${displayAmount > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-green-600 dark:text-green-400'}`}>
                            {formatCurrency(displayAmount)}
                          </span>
                        );
                      })()}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {(() => {
                        const stats = getPaymentStats(customer);
                        if (stats.totalInstallments === null) {
                          return <span className="text-muted-foreground text-sm">-</span>;
                        }
                        return (
                          <div className="flex flex-col text-xs">
                            <span className="text-green-600 dark:text-green-400 font-medium">
                              Paid: {stats.paidInstallments}
                            </span>
                            <span className="text-orange-600 dark:text-orange-400">
                              Pending: {stats.pendingInstallments}
                            </span>
                            <span className="text-muted-foreground">
                              Total: {stats.totalInstallments}
                            </span>
                          </div>
                        );
                      })()}
                    </TableCell>
                    <TableCell className="hidden xl:table-cell text-sm">
                      {formatDate(customer.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => handleEdit(customer.id, "customer")}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Customer
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleViewDocuments(customer.id)}>
                            <FolderOpen className="mr-2 h-4 w-4" />
                            View Documents
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleAddPayment(customer.id)}>
                            <CreditCard className="mr-2 h-4 w-4" />
                            {customer.payment ? "Edit" : "Add"} Payment
                          </DropdownMenuItem>
                          {customer.payment?.paymentType === "installment" && (
                            <DropdownMenuItem onClick={() => handleViewLedger(customer.id)}>
                              <FileText className="mr-2 h-4 w-4" />
                              View Installments
                            </DropdownMenuItem>
                          )}
                          {customer.payment?.paymentType === "partial" && (
                            <DropdownMenuItem onClick={() => setPartialLedgerCustomerId(customer.id)}>
                              <FileText className="mr-2 h-4 w-4" />
                              View Partial Payments
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => handlePrintReceipt(customer)}>
                            <Printer className="mr-2 h-4 w-4" />
                            Print Receipt
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(customer.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </div>

      {/* Results Info and Items Per Page - Below the Grid */}
      <div className="mt-4 pt-4 border-t flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div className="text-xs sm:text-sm text-muted-foreground">
          {filteredCustomers.length === 0 ? (
            "No customers found"
          ) : (
            <>
              Showing {startIndex + 1} to {Math.min(endIndex, filteredCustomers.length)} of {filteredCustomers.length} customer{filteredCustomers.length !== 1 ? "s" : ""}
              {searchQuery && ` matching "${searchQuery}"`}
            </>
          )}
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label htmlFor="itemsPerPage" className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
            Items per page:
          </label>
          <select
            id="itemsPerPage"
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring flex-1 sm:flex-initial min-w-[80px]"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      {/* Pagination Controls - Below the Grid */}
      {totalPages > 1 && (
        <div className="mt-4 sm:mt-6 pt-4 border-t">
          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
              Page {currentPage} of {totalPages} ({filteredCustomers.length} total {filteredCustomers.length === 1 ? "customer" : "customers"})
            </div>
            <div className="flex items-center gap-1 sm:gap-2 flex-wrap justify-center">
              {/* First Page Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
                className="hidden sm:flex h-9"
              >
                <ChevronsLeft className="h-4 w-4" />
                First
              </Button>
              
              {/* Previous Page Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="h-9 min-w-[44px]"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="hidden sm:inline ml-1">Previous</span>
              </Button>
              
              {/* Page Number Buttons - Show fewer on mobile */}
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                  // Show first page, last page, current page, and pages around current
                  if (
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  ) {
                    return (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(page)}
                        className="min-w-[44px] h-9 text-sm"
                      >
                        {page}
                      </Button>
                    );
                  } else if (page === currentPage - 2 || page === currentPage + 2) {
                    return (
                      <span key={page} className="px-1 sm:px-2 text-muted-foreground text-sm">
                        ...
                      </span>
                    );
                  }
                  return null;
                })}
              </div>
              
              {/* Next Page Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="h-9 min-w-[44px]"
              >
                <span className="hidden sm:inline mr-1">Next</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
              
              {/* Last Page Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages}
                className="hidden sm:flex h-9"
              >
                Last
                <ChevronsRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      )}

      <CustomerCompleteForm
        open={customerModalOpen}
        onOpenChange={(open) => {
          setCustomerModalOpen(open);
          if (!open) {
            setEditingCustomerId(null);
            setActiveSection(null);
          }
        }}
        customerId={editingCustomerId}
        activeSection={activeSection}
        onSave={(customer) => {
          // Show receipt after saving if customer has payment info
          if (customer && customer.payment) {
            setReceiptCustomer(customer);
            setReceiptModalOpen(true);
          }
        }}
      />

      <PaymentModal
        open={paymentModalOpen}
        onOpenChange={setPaymentModalOpen}
        customerId={selectedCustomerId}
      />

      {ledgerCustomerId && (
        <InstallmentsLedger
          customerId={ledgerCustomerId}
          onClose={() => setLedgerCustomerId(null)}
        />
      )}

      {partialLedgerCustomerId && (
        <PartialPaymentLedger
          customerId={partialLedgerCustomerId}
          onClose={() => setPartialLedgerCustomerId(null)}
        />
      )}

      <DocumentsViewModal
        open={documentsModalOpen}
        onOpenChange={setDocumentsModalOpen}
        customer={customers.find((c) => c.id === viewingCustomerId)}
      />

      <Receipt
        open={receiptModalOpen}
        onOpenChange={setReceiptModalOpen}
        customer={receiptCustomer}
        paymentType={receiptCustomer?.payment?.paymentType || "direct"}
      />

      <ShopSettingsModal
        open={settingsModalOpen}
        onOpenChange={setSettingsModalOpen}
      />

      {/* Full Statistics Modal */}
      <Dialog open={statsModalOpen} onOpenChange={setStatsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Complete Statistics
            </DialogTitle>
            <DialogDescription>
              Detailed overview of all business statistics
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Financial Overview */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Financial Overview
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border rounded-lg p-4 bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/20 dark:to-green-900/10">
                  <div className="text-sm text-muted-foreground mb-1">Total Sold</div>
                  <div className="text-2xl font-bold text-green-700 dark:text-green-400">
                    Rs. {stats.totalSold.toFixed(2)}
                  </div>
                </div>
                <div className="border rounded-lg p-4 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/10">
                  <div className="text-sm text-muted-foreground mb-1">Total Paid</div>
                  <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                    {formatCurrency(stats.totalPaid)}
                  </div>
                </div>
                <div className="border rounded-lg p-4 bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-950/20 dark:to-orange-900/10">
                  <div className="text-sm text-muted-foreground mb-1">Total Pending</div>
                  <div className="text-2xl font-bold text-orange-700 dark:text-orange-400">
                    {formatCurrency(stats.totalPending)}
                  </div>
                </div>
              </div>
            </div>

            {/* Customer Statistics */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Users className="h-5 w-5" />
                Customer Statistics
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <div className="text-sm text-muted-foreground mb-1">Total Customers</div>
                  <div className="text-2xl font-bold">{stats.totalCustomers}</div>
                </div>
                <div className="border rounded-lg p-4">
                  <div className="text-sm text-muted-foreground mb-1">Customers with Phones</div>
                  <div className="text-2xl font-bold">{stats.customersWithPhones}</div>
                </div>
                <div className="border rounded-lg p-4">
                  <div className="text-sm text-muted-foreground mb-1">Customers with Payments</div>
                  <div className="text-2xl font-bold">{stats.customersWithPayments}</div>
                </div>
                <div className="border rounded-lg p-4">
                  <div className="text-sm text-muted-foreground mb-1">Customers without Payments</div>
                  <div className="text-2xl font-bold">
                    {stats.totalCustomers - stats.customersWithPayments}
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Statistics */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Statistics
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <div className="text-sm text-muted-foreground mb-1">Direct Payments</div>
                  <div className="text-2xl font-bold">{stats.directPayments}</div>
                </div>
                <div className="border rounded-lg p-4">
                  <div className="text-sm text-muted-foreground mb-1">Installment Plans</div>
                  <div className="text-2xl font-bold">{stats.installmentPayments}</div>
                </div>
                <div className="border rounded-lg p-4">
                  <div className="text-sm text-muted-foreground mb-1">Total Installments</div>
                  <div className="text-2xl font-bold">{stats.totalInstallments}</div>
                </div>
                <div className="border rounded-lg p-4">
                  <div className="text-sm text-muted-foreground mb-1">Paid Installments</div>
                  <div className="text-2xl font-bold">
                    {stats.paidInstallments} / {stats.totalInstallments}
                  </div>
                  {stats.totalInstallments > 0 && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {((stats.paidInstallments / stats.totalInstallments) * 100).toFixed(1)}% completion rate
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="border-t pt-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Collection Rate:</span>
                  <span className="font-semibold">
                    {stats.totalSold > 0
                      ? ((stats.totalPaid / stats.totalSold) * 100).toFixed(1)
                      : 0}
                    %
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Pending Rate:</span>
                  <span className="font-semibold">
                    {stats.totalSold > 0
                      ? ((stats.totalPending / stats.totalSold) * 100).toFixed(1)
                      : 0}
                    %
                  </span>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

