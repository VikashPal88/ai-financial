// components/navbar/sidebar.tsx
"use client";

import React from "react";
import {
  SidebarProvider,
  Sidebar,
  SidebarTrigger,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar-ui";

type Sidebar2Props = {
  active?: string;
  onNavigate?: (view: string) => void;
};

export default function Sidebar2({ active, onNavigate }: Sidebar2Props) {
  // helper to call parent navigation
  const handleNavigate = (value: string) => {
    onNavigate?.(value);
  };

  return (
    <SidebarProvider defaultExpanded>
      <Sidebar className="">
        {/* <SidebarHeader>
          <span className="font-bold">My App</span>
          <SidebarTrigger />
        </SidebarHeader> */}

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Main</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem value="dashboard">
                  {/* call handleNavigate when user clicks this button */}
                  <SidebarMenuButton
                    onClick={() => handleNavigate("dashboard")}
                  >
                    Dashboard
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem value="transactions">
                  <SidebarMenuButton
                    onClick={() => handleNavigate("transactions")}
                  >
                    Transactions
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem value="accounts">
                  <SidebarMenuButton onClick={() => handleNavigate("accounts")}>
                    Accounts
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem value="settings">
                  <SidebarMenuButton onClick={() => handleNavigate("settings")}>
                    Settings
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <span className="text-sm text-muted-foreground">
            v0.1 • © YourCompany
          </span>
        </SidebarFooter>
      </Sidebar>
    </SidebarProvider>
  );
}
