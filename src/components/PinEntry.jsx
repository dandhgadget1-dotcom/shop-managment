"use client";

import { useState, useEffect, useRef } from "react";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function PinEntry({ onPinVerified }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    // Focus input on mount
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Get PIN from environment variable
    const correctPin = process.env.NEXT_PUBLIC_APP_PIN;

    if (!correctPin) {
      setError("PIN not configured. Please contact administrator.");
      setLoading(false);
      return;
    }

    // Simulate a small delay for better UX
    setTimeout(() => {
      if (pin === correctPin) {
        // Store in session storage
        sessionStorage.setItem("pin_verified", "true");
        onPinVerified();
      } else {
        setError("Invalid PIN. Please try again.");
        setPin("");
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }
      setLoading(false);
    }, 300);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="rounded-full bg-primary/10 p-4">
              <Lock className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-2xl font-bold">Enter PIN</h1>
          <p className="text-muted-foreground">
            Please enter the PIN to access the application
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pin">PIN</Label>
            <Input
              id="pin"
              ref={inputRef}
              type="password"
              value={pin}
              onChange={(e) => {
                setPin(e.target.value);
                setError("");
              }}
              placeholder="Enter PIN"
              className="text-center text-lg tracking-widest"
              disabled={loading}
              autoComplete="off"
            />
          </div>

          {error && (
            <div className="text-sm text-destructive text-center bg-destructive/10 p-2 rounded">
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={loading || !pin}
          >
            {loading ? "Verifying..." : "Verify PIN"}
          </Button>
        </form>
      </div>
    </div>
  );
}
