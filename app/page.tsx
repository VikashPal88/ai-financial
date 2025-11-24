'use client";';
import React from "react";
import Sidebar2 from "@/components/navbar/sidebar";
import Header from "@/components/navbar/header";
import { checkUser } from "@/lib/checkUser";
import { auth } from "@clerk/nextjs/server";
import CompanyScreen from "@/components/screen/CompanyScreen";

const Home = async () => {
  const { userId } = await auth();
  console.log("Auth in HomeScreen:", userId);

  if (!userId || !userId) {
    return <CompanyScreen />;
  }
  return (
    <div className="flex flex-col h-screen bg-bg-note">
      <header className="w-full bg-white shadow-sm pl-4 pr-4 flex-shrink-0">
        <Header />
      </header>
      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar2 />

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <div className="absolute inset-0 bg-doodle-bg bg-cover bg-center bg-no-repeat opacity-5 pointer-events-none" />
          <div className="relative flex flex-col h-full pt-5 z-10">
            <div className="flex-1 overflow-y-auto min-w-0">
              {/* <Scroll /> */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
