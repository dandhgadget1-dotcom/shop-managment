"use client";

import { useState, useEffect } from "react";
import PinEntry from "./PinEntry";

export default function PinProtection({ children }) {
  const [isVerified, setIsVerified] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Check session storage for PIN verification
    const verified = sessionStorage.getItem("pin_verified");
    
    if (verified === "true") {
      setIsVerified(true);
    }
    
    setIsChecking(false);
  }, []);

  const handlePinVerified = () => {
    setIsVerified(true);
  };

  // Show loading state while checking
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Show PIN entry if not verified
  if (!isVerified) {
    return <PinEntry onPinVerified={handlePinVerified} />;
  }

  // Show application if verified
  return <>{children}</>;
}
