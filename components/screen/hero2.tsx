"use client";

import React, { useEffect, useRef } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { BackgroundBeams } from "./ui/background-beams";
import { LampContainer } from "./ui/lamp";
import { motion } from "motion/react";
import { Cover } from "./ui/cover";
import { Vortex } from "./ui/vortex";

const HeroSection2 = () => {
  return (
    <section className="pt-24 pb-20 px-4 bg-black">
      <div className="w-[calc(100%-4rem)] mx-auto rounded-md  h-screen overflow-hidden">
        <Vortex
          backgroundColor="black"
          className="flex items-center flex-col justify-center px-2 md:px-10 py-4 w-full h-full"
        >
          <h2 className="text-white text-2xl md:text-6xl font-bold text-center">
            Manage Your Finances <br /> with Intelligence
          </h2>
          <p className="text-white text-sm md:text-2xl max-w-xl mt-6 text-center">
            An AI-powered financial management platform that helps you track,
            analyze, and optimize your spending with real-time insights.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-4 mt-6">
            <Link href="/dashboard">
              <Button size="lg" className="px-8">
                Get Started
              </Button>
            </Link>
          </div>
        </Vortex>
      </div>
    </section>
  );
};

export default HeroSection2;
