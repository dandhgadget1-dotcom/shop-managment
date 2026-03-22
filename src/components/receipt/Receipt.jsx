"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useShopSettings } from "@/context/ShopSettingsContext";
import { Button } from "@/components/ui/button";
import { Check, FileDown, Pencil, Printer, RotateCcw, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ReceiptContent from "./ReceiptContent";
import { useToast } from "@/components/ui/toast";

function getReceiptPrintStyles() {
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
}

/** Avoid Tailwind color utilities here — html2canvas cannot parse lab()/oklch() from Tailwind v4. */
const RECEIPT_WRAPPER_CLASS = "receipt-container rounded-sm";
const RECEIPT_WRAPPER_STYLE = {
  fontFamily: "'Courier New', monospace",
  fontSize: "12px",
  padding: "10px",
  width: "80mm",
  maxWidth: "100%",
  margin: "0 auto",
  outline: "none",
  backgroundColor: "#ffffff",
  color: "#000000",
  border: "1px dashed #9ca3af",
};

/**
 * Render receipt HTML in an isolated iframe with only hex-based CSS. Capturing inside the main
 * document pulls in Tailwind (lab/oklch), which html2canvas cannot parse and logs console errors.
 */
async function captureReceiptElement(sourceEl, html2canvas) {
  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  Object.assign(iframe.style, {
    position: "fixed",
    left: "-10000px",
    top: "0",
    width: "360px",
    height: "2400px",
    border: "0",
    margin: "0",
    padding: "0",
    pointerEvents: "none",
  });
  document.body.appendChild(iframe);

  const idoc = iframe.contentDocument;
  if (!idoc) {
    iframe.remove();
    throw new Error("Could not access iframe document for PDF capture.");
  }

  idoc.open();
  idoc.write(
    `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${getReceiptPrintStyles()}</style></head><body></body></html>`
  );
  idoc.close();

  const wrap = idoc.createElement("div");
  wrap.className = "receipt-container";
  Object.assign(wrap.style, {
    fontFamily: RECEIPT_WRAPPER_STYLE.fontFamily,
    fontSize: RECEIPT_WRAPPER_STYLE.fontSize,
    padding: RECEIPT_WRAPPER_STYLE.padding,
    width: RECEIPT_WRAPPER_STYLE.width,
    maxWidth: RECEIPT_WRAPPER_STYLE.maxWidth,
    margin: RECEIPT_WRAPPER_STYLE.margin,
    backgroundColor: RECEIPT_WRAPPER_STYLE.backgroundColor,
    color: RECEIPT_WRAPPER_STYLE.color,
    border: RECEIPT_WRAPPER_STYLE.border,
    boxSizing: "border-box",
  });
  wrap.innerHTML = sourceEl.innerHTML;
  idoc.body.appendChild(wrap);

  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

  try {
    const canvas = await html2canvas(wrap, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      logging: false,
      foreignObjectRendering: false,
    });
    if (!canvas.width || !canvas.height) {
      throw new Error("Capture returned an empty image.");
    }
    return canvas;
  } finally {
    iframe.remove();
  }
}

function ReceiptEditableBody({ initialHtml, innerRef }) {
  useLayoutEffect(() => {
    if (innerRef.current && initialHtml != null) {
      innerRef.current.innerHTML = initialHtml;
    }
  }, [initialHtml, innerRef]);

  return (
    <div
      ref={innerRef}
      contentEditable
      suppressContentEditableWarning
      className={RECEIPT_WRAPPER_CLASS}
      style={RECEIPT_WRAPPER_STYLE}
    />
  );
}

export default function Receipt({ open, onOpenChange, customer, paymentType, installmentReceipt }) {
  const { settings } = useShopSettings();
  const toast = useToast();
  const receiptRef = useRef(null);
  const [editedHtml, setEditedHtml] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editSeed, setEditSeed] = useState("");
  const [pdfLoading, setPdfLoading] = useState(false);
  const pdfBusyRef = useRef(false);

  const customerKey =
    customer?.id ?? customer?._id ?? customer?.idNo ?? customer?.fullName ?? "";

  const installmentReceiptKey = installmentReceipt
    ? `inst-${installmentReceipt.installmentNumber}-${installmentReceipt.paymentRecord?._id || installmentReceipt.paymentRecord?.id || ""}-${installmentReceipt.paymentRecord?.paymentDate || ""}-${installmentReceipt.paymentRecord?.amount || ""}`
    : "full";

  useEffect(() => {
    if (!open) {
      setEditedHtml(null);
      setIsEditing(false);
    }
  }, [open]);

  useEffect(() => {
    setEditedHtml(null);
    setIsEditing(false);
  }, [customerKey, installmentReceiptKey]);

  const openPrintWindow = useCallback(() => {
    if (!customer || !receiptRef.current) return;

    const printWindow = window.open("", "_blank");
    const printContent = receiptRef.current.innerHTML;
    const titleExtra = installmentReceipt
      ? ` — Installment #${installmentReceipt.installmentNumber}`
      : "";

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt${titleExtra} - ${customer?.fullName || "Customer"}</title>
          <style>${getReceiptPrintStyles()}</style>
        </head>
        <body>
          <div class="receipt-container">${printContent}</div>
        </body>
      </html>
    `);

    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  }, [customer, installmentReceipt]);

  const downloadPdf = useCallback(async () => {
    const el = receiptRef.current;
    if (!customer || !el || pdfBusyRef.current) return;

    pdfBusyRef.current = true;
    setPdfLoading(true);
    try {
      const [html2canvasMod, jspdfMod] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);
      const html2canvas = html2canvasMod.default;
      const JsPDF = jspdfMod.jsPDF ?? jspdfMod.default;
      if (typeof JsPDF !== "function") {
        throw new Error("jsPDF could not be loaded.");
      }

      const canvas = await captureReceiptElement(el, html2canvas);

      const imgData = canvas.toDataURL("image/png");
      const pageWidthMm = 80;
      const pageHeightMm = Math.max((canvas.height / canvas.width) * pageWidthMm, 20);

      const pdf = new JsPDF({
        unit: "mm",
        format: [pageWidthMm, pageHeightMm],
      });

      pdf.addImage(imgData, "PNG", 0, 0, pageWidthMm, pageHeightMm);

      const safeName = String(customer.fullName || "customer")
        .replace(/[/\\?%*:|"<>]/g, "")
        .replace(/\s+/g, "-")
        .slice(0, 80) || "customer";
      const filePrefix = installmentReceipt
        ? `receipt-inst${installmentReceipt.installmentNumber}-${safeName}`
        : `receipt-${safeName}`;
      pdf.save(`${filePrefix}-${Date.now()}.pdf`);
    } catch (e) {
      console.error(e);
      const hint =
        /Failed to fetch dynamically imported module|Loading CSS chunk|Cannot find module/i.test(
          String(e?.message)
        );
      toast.error(
        hint
          ? "PDF export libraries are missing. Run npm install in the project folder, restart the dev server, and try again."
          : e?.message
            ? `Could not create PDF: ${e.message}`
            : "Could not create PDF. Try Print, or restart the app after npm install."
      );
    } finally {
      pdfBusyRef.current = false;
      setPdfLoading(false);
    }
  }, [customer, installmentReceipt, toast]);

  const startEdit = () => {
    const el = receiptRef.current;
    if (!el) return;
    setEditSeed(el.innerHTML);
    setIsEditing(true);
  };

  const finishEdit = () => {
    const el = receiptRef.current;
    if (el) setEditedHtml(el.innerHTML);
    setIsEditing(false);
  };

  const cancelEdit = () => {
    setIsEditing(false);
  };

  const revertReceipt = () => {
    setEditedHtml(null);
    setIsEditing(false);
  };

  if (!customer) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <span className="pt-0.5">
              {installmentReceipt ? "Installment receipt" : "Receipt"}
            </span>
            <div className="flex flex-wrap items-center gap-2 pr-8">
              <Button
                type="button"
                onClick={downloadPdf}
                variant="default"
                size="sm"
                disabled={pdfLoading}
              >
                <FileDown className="h-4 w-4 mr-2" />
                {pdfLoading ? "Preparing…" : "Download PDF"}
              </Button>
              <Button type="button" onClick={openPrintWindow} variant="outline" size="sm">
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
              {!isEditing && (
                <Button onClick={startEdit} variant="outline" size="sm">
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
              {isEditing && (
                <>
                  <Button onClick={finishEdit} variant="default" size="sm">
                    <Check className="h-4 w-4 mr-2" />
                    Done
                  </Button>
                  <Button onClick={cancelEdit} variant="outline" size="sm">
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </>
              )}
              {editedHtml !== null && !isEditing && (
                <Button onClick={revertReceipt} variant="ghost" size="sm">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Revert
                </Button>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <p className="text-muted-foreground text-xs -mt-2 mb-2">
          Receipt edits are only for this window—printing, and PDF downloads do not change saved
          customer records.
        </p>

        {isEditing ? (
          <ReceiptEditableBody initialHtml={editSeed} innerRef={receiptRef} />
        ) : editedHtml !== null ? (
          <div
            ref={receiptRef}
            className={RECEIPT_WRAPPER_CLASS}
            style={RECEIPT_WRAPPER_STYLE}
            dangerouslySetInnerHTML={{ __html: editedHtml }}
          />
        ) : (
          <ReceiptContent
            customer={customer}
            settings={settings}
            paymentType={paymentType}
            receiptRef={receiptRef}
            installmentReceipt={installmentReceipt}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
