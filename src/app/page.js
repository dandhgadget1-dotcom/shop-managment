"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, ShoppingBag } from "lucide-react";
import CustomersTable from "@/components/CustomersTable";
import CustomerCompleteForm from "@/components/modals/CustomerCompleteForm";

export default function Home() {
  const [formOpen, setFormOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-4 sm:py-8 px-4 sm:px-6">
        <CustomersTable />

        <CustomerCompleteForm open={formOpen} onOpenChange={setFormOpen} />
      </div>
    </div>
  );
}
