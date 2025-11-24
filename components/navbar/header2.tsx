"use client";
import React from "react";
import { FloatingNav } from "./ui/floating-navbar";
import { IconHome, IconMessage, IconUser } from "@tabler/icons-react";

export function Header2() {
  const navItems = [
    {
      name: "Home",
      link: "/",
      icon: <IconHome className="h-4 w-4 text-neutral-500 dark:text-white" />,
    },
    {
      name: "About",
      link: "/about",
      icon: <IconUser className="h-4 w-4 text-neutral-500 dark:text-white" />,
    },
    {
      name: "Contact",
      link: "/contact",
      icon: (
        <IconMessage className="h-4 w-4 text-neutral-500 dark:text-white" />
      ),
    },
  ];

  return (
    // <div className=" w-full flex   fixed top-0 inset-x-0 mx-auto border border-white/[0.9] h-[40px] shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),0px_1px_0px_0px_rgba(25,28,33,0.02),0px_0px_0px_1px_rgba(25,28,33,0.08)] z-[5000] pr-8 pl-8 py-3  justify-between space-x-4 text-white">
    //   {/* logo */}
    //   <div className="z-[500] text-white">
    //     <img
    //       src="ai-finance-platform\public\WhatsApp Image 2025-08-22 at 08.36.31_a47f361f.jpg"
    //       alt=""
    //     />
    //   </div>

    //   <div>
    //     <FloatingNav navItems={navItems} className="h-[40px]" />
    //   </div>

    //   <div>
    //     <h1>Profile</h1>
    //   </div>
    // </div>
    <nav>
      <ul>
        <li>Home</li>
      </ul>
    </nav>
  );
}
