"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CustomersTable from "@/components/CustomersTable";
import RemindersPage from "@/components/RemindersPage";
import { Users, Bell } from "lucide-react";

export default function Home() {
  const [activeTab, setActiveTab] = useState("customers");

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-4 sm:py-8 px-4 sm:px-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="customers" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Customers
            </TabsTrigger>
            <TabsTrigger value="reminders" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Reminders
            </TabsTrigger>
          </TabsList>

          <TabsContent value="customers" className="mt-0">
            <CustomersTable />
          </TabsContent>

          <TabsContent value="reminders" className="mt-0">
            <RemindersPage />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
