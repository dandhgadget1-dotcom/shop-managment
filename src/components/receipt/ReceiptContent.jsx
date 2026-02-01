"use client";

import { formatCurrency } from "@/lib/utils";

export default function ReceiptContent({ customer, settings, paymentType, receiptRef }) {
  const formatDate = (dateString) => {
    if (!dateString) return new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
    return new Date(dateString).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  };

  const formatTime = (dateString) => {
    if (!dateString) return new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    return new Date(dateString).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  };

  if (!customer) return null;

  const phonePrice = Math.round(parseFloat(customer.phone?.price) || 0);
  const downPayment = Math.round(parseFloat(customer.payment?.downPayment) || 0);
  const remainingAmount = Math.round(parseFloat(customer.payment?.remainingAmount) || 0);
  const interestPercentage = parseFloat(customer.payment?.percentage) || 0;
  const interestAmount = Math.round((remainingAmount * interestPercentage) / 100);
  const totalWithInterest = Math.round(remainingAmount + interestAmount);
  const numberOfInstallments = parseInt(customer.payment?.numberOfInstallments) || 0;
  const installmentAmount = numberOfInstallments > 0 ? Math.ceil(totalWithInterest / numberOfInstallments) : 0;
  const currentPaymentType = paymentType || customer.payment?.paymentType || "direct";

  return (
    <div ref={receiptRef} className="receipt-container bg-white text-black" style={{ fontFamily: "'Courier New', monospace", fontSize: "12px", padding: "10px", width: "80mm", maxWidth: "100%", margin: "0 auto" }}>
      {/* Header */}
      <div className="center">
        {settings?.shopName && (
          <div className="shop-name" style={{ fontSize: "16px", fontWeight: "bold", margin: "5px 0", textTransform: "uppercase" }}>
            {settings.shopName}
          </div>
        )}
        <div className="shop-info" style={{ fontSize: "10px", lineHeight: "1.4", margin: "5px 0" }}>
          {settings?.shopAddress && <div>{settings.shopAddress}</div>}
          {settings?.shopPhone && <div>Tel: {settings.shopPhone}</div>}
          {settings?.shopEmail && <div>{settings.shopEmail}</div>}
          {settings?.ntnNumber && <div>NTN: {settings.ntnNumber}</div>}
        </div>
      </div>

      <div className="divider" style={{ borderTop: "1px dashed #000", margin: "8px 0" }}></div>

      {/* Receipt Title */}
      <div className="center receipt-title" style={{ fontSize: "14px", fontWeight: "bold", margin: "10px 0", textTransform: "uppercase" }}>
        {currentPaymentType === "direct" ? "PAYMENT RECEIPT" : "INVOICE"}
      </div>

      <div className="divider" style={{ borderTop: "1px dashed #000", margin: "8px 0" }}></div>

      {/* Date & Time */}
      <div className="info-line" style={{ fontSize: "11px", lineHeight: "1.5", margin: "2px 0" }}>
        Date: {formatDate(customer.createdAt || new Date())}
      </div>
      <div className="info-line" style={{ fontSize: "11px", lineHeight: "1.5", margin: "2px 0" }}>
        Time: {formatTime(customer.createdAt || new Date())}
      </div>

      <div className="divider" style={{ borderTop: "1px dashed #000", margin: "8px 0" }}></div>

      {/* Customer Info */}
      <div className="info-line bold" style={{ fontSize: "11px", lineHeight: "1.5", margin: "2px 0", fontWeight: "bold" }}>CUSTOMER:</div>
      <div className="info-line" style={{ fontSize: "11px", lineHeight: "1.5", margin: "2px 0" }}>{customer.fullName}</div>
      <div className="info-line" style={{ fontSize: "11px", lineHeight: "1.5", margin: "2px 0" }}>ID: {customer.idNo}</div>
      <div className="info-line" style={{ fontSize: "11px", lineHeight: "1.5", margin: "2px 0" }}>Tel: {customer.contactInfo}</div>
      {customer.address && (
        <div className="info-line" style={{ fontSize: "11px", lineHeight: "1.5", margin: "2px 0" }}>{customer.address}</div>
      )}

      <div className="divider" style={{ borderTop: "1px dashed #000", margin: "8px 0" }}></div>

      {/* Items */}
      {customer.phone && (
        <>
          <div className="item-row" style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", margin: "3px 0" }}>
            <div className="item-name" style={{ flex: "1" }}>
              <div className="bold" style={{ fontWeight: "bold" }}>{customer.phone.name}</div>
              <div style={{ fontSize: "10px" }}>{customer.phone.model} | IMEI: {customer.phone.imeiNo}</div>
            </div>
            <div className="item-price right" style={{ textAlign: "right" }}>{formatCurrency(phonePrice)}</div>
          </div>
          <div className="divider" style={{ borderTop: "1px dashed #000", margin: "8px 0" }}></div>
        </>
      )}

      {/* Payment Summary */}
      {currentPaymentType === "direct" ? (
        <>
          <div className="total-row final" style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", margin: "4px 0", fontWeight: "bold" }}>
            <span>TOTAL:</span>
            <span>{formatCurrency(phonePrice)}</span>
          </div>
          <div className="total-row" style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", margin: "4px 0" }}>
            <span>PAID:</span>
            <span className="bold" style={{ fontWeight: "bold" }}>{formatCurrency(phonePrice)}</span>
          </div>
          <div className="total-row" style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", margin: "4px 0" }}>
            <span>BALANCE:</span>
            <span>{formatCurrency(0)}</span>
          </div>
        </>
      ) : (
        <>
          <div className="total-row" style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", margin: "4px 0" }}>
            <span>Subtotal:</span>
            <span>{formatCurrency(phonePrice)}</span>
          </div>
          <div className="total-row" style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", margin: "4px 0" }}>
            <span>Down Payment:</span>
            <span>{formatCurrency(downPayment)}</span>
          </div>
          <div className="total-row" style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", margin: "4px 0" }}>
            <span>Remaining:</span>
            <span>{formatCurrency(remainingAmount)}</span>
          </div>
          {interestPercentage > 0 && (
            <>
              <div className="total-row" style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", margin: "4px 0" }}>
                <span>Interest ({interestPercentage}%):</span>
                <span>{formatCurrency(interestAmount)}</span>
              </div>
              <div className="total-row" style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", margin: "4px 0" }}>
                <span>Total with Interest:</span>
                <span>{formatCurrency(totalWithInterest)}</span>
              </div>
              {numberOfInstallments > 0 && (
                <div className="total-row" style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", margin: "4px 0" }}>
                  <span>Installments ({numberOfInstallments}x):</span>
                  <span>{formatCurrency(installmentAmount)}</span>
                </div>
              )}
            </>
          )}
          <div className="divider-thick" style={{ borderTop: "2px solid #000", margin: "8px 0" }}></div>
          <div className="total-row" style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", margin: "4px 0" }}>
            <span>PAID:</span>
            <span className="bold" style={{ fontWeight: "bold" }}>{formatCurrency(downPayment)}</span>
          </div>
          <div className="total-row final" style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", margin: "4px 0", fontWeight: "bold" }}>
            <span>BALANCE DUE:</span>
            <span>{formatCurrency(totalWithInterest - downPayment)}</span>
          </div>
        </>
      )}

      <div className="divider-thick" style={{ borderTop: "2px solid #000", margin: "8px 0" }}></div>

      {/* Footer */}
      <div className="footer center" style={{ textAlign: "center", fontSize: "10px", marginTop: "15px", lineHeight: "1.4" }}>
        <div>{settings?.footerMessage || "Thank you for your business!"}</div>
        <div style={{ marginTop: "8px", fontSize: "9px" }}>
          {formatDate(customer.createdAt || new Date())} {formatTime(customer.createdAt || new Date())}
        </div>
      </div>
    </div>
  );
}
