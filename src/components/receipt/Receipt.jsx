"use client";

import { useRef } from "react";
import { useShopSettings } from "@/context/ShopSettingsContext";
import { Button } from "@/components/ui/button";
import { Printer, Download } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ReceiptContent from "./ReceiptContent";

export default function Receipt({ open, onOpenChange, customer, paymentType }) {
  const { settings } = useShopSettings();
  const receiptRef = useRef(null);

  const getPrintStyles = () => {
    return `
      @page {
        size: 80mm auto;
        margin: 0;
      }
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      body {
        font-family: 'Courier New', monospace;
        font-size: 12px;
        padding: 10px;
        color: #000;
        width: 80mm;
        margin: 0 auto;
      }
      .receipt-container {
        width: 100%;
        max-width: 80mm;
        margin: 0 auto;
      }
      .divider {
        border-top: 1px dashed #000;
        margin: 8px 0;
      }
      .divider-thick {
        border-top: 2px solid #000;
        margin: 8px 0;
      }
      .center {
        text-align: center;
      }
      .right {
        text-align: right;
      }
      .bold {
        font-weight: bold;
      }
      .shop-name {
        font-size: 16px;
        font-weight: bold;
        margin: 5px 0;
        text-transform: uppercase;
      }
      .shop-info {
        font-size: 10px;
        line-height: 1.4;
        margin: 5px 0;
      }
      .receipt-title {
        font-size: 14px;
        font-weight: bold;
        margin: 10px 0;
        text-transform: uppercase;
      }
      .info-line {
        font-size: 11px;
        line-height: 1.5;
        margin: 2px 0;
      }
      .item-row {
        display: flex;
        justify-content: space-between;
        font-size: 11px;
        margin: 3px 0;
      }
      .item-name {
        flex: 1;
      }
      .item-price {
        text-align: right;
      }
      .total-row {
        display: flex;
        justify-content: space-between;
        font-size: 12px;
        margin: 4px 0;
      }
      .total-row.final {
        font-weight: bold;
        font-size: 14px;
      }
      .footer {
        text-align: center;
        font-size: 10px;
        margin-top: 15px;
        line-height: 1.4;
      }
      @media print {
        body {
          padding: 5px;
        }
      }
    `;
  };

  const handlePrint = () => {
    if (!customer || !receiptRef.current) return;

    const printWindow = window.open("", "_blank");
    const printContent = receiptRef.current.innerHTML;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt - ${customer?.fullName || "Customer"}</title>
          <style>${getPrintStyles()}</style>
        </head>
        <body>
          ${printContent}
        </body>
      </html>
    `);
    
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const handleDownload = () => {
    if (!customer || !receiptRef.current) return;

    const printContent = receiptRef.current.innerHTML;
    const blob = new Blob([`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt - ${customer?.fullName || "Customer"}</title>
          <style>${getPrintStyles()}</style>
        </head>
        <body>
          ${printContent}
        </body>
      </html>
    `], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `receipt-${customer?.fullName || "customer"}-${Date.now()}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!customer) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Receipt</span>
            <div className="flex gap-2 pr-8">
              <Button onClick={handlePrint} variant="outline" size="sm">
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
              <Button onClick={handleDownload} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <ReceiptContent
          customer={customer}
          settings={settings}
          paymentType={paymentType}
          receiptRef={receiptRef}
        />
      </DialogContent>
    </Dialog>
  );
}
