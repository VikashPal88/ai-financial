// components/HeroSection.tsx
"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Check, Mic, Camera, Wallet } from "lucide-react";

type HeroProps = {
  onPrimary?: () => void;
  onSecondary?: () => void;
};

export default function HeroSection3({ onPrimary, onSecondary }: HeroProps) {
  return (
    <header className="bg-gradient-to-b from-white to-slate-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16 lg:py-24">
        <div className="grid gap-12 lg:grid-cols-12 items-center">
          {/* Left content */}
          <div className="lg:col-span-7">
            <div className="max-w-xl">
              <p className="inline-flex items-center gap-2 rounded-full bg-amber-100 text-amber-800 px-3 py-1 text-sm font-medium mb-4">
                <Wallet className="h-4 w-4" />
                New: Add transactions by voice, receipt or form
              </p>

              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
                Money management made effortless.
                <br />
                Track. Automate. Grow.
              </h1>

              <p className="mt-6 text-lg text-slate-600">
                Centralize your finances with a modern app that understands you
                — add transactions by voice, scan receipts, and get smart
                insights to stay on top of spending.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-3 sm:items-center">
                <Button
                  onClick={onPrimary}
                  className="inline-flex items-center gap-3 bg-gradient-to-br from-emerald-500 to-blue-600 text-white shadow-md hover:brightness-95"
                >
                  Start tracking — it's free
                </Button>

                <Button
                  variant="outline"
                  onClick={onSecondary}
                  className="inline-flex items-center gap-3"
                >
                  Get a tour
                </Button>
              </div>

              <ul className="mt-8 grid gap-3 sm:grid-cols-2">
                <li className="flex items-start gap-3">
                  <span className="flex-none bg-green-50 text-green-700 rounded-full p-2">
                    <Mic className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="font-medium text-slate-900">Voice input</p>
                    <p className="text-sm text-slate-600">
                      Add transactions in seconds — just speak naturally.
                    </p>
                  </div>
                </li>

                <li className="flex items-start gap-3">
                  <span className="flex-none bg-pink-50 text-pink-700 rounded-full p-2">
                    <Camera className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="font-medium text-slate-900">Scan receipts</p>
                    <p className="text-sm text-slate-600">
                      Auto-extract amount, date and category from photos.
                    </p>
                  </div>
                </li>

                <li className="flex items-start gap-3">
                  <span className="flex-none bg-sky-50 text-sky-700 rounded-full p-2">
                    <Check className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="font-medium text-slate-900">
                      Smart categorization
                    </p>
                    <p className="text-sm text-slate-600">
                      Auto-match categories and suggest recurring rules.
                    </p>
                  </div>
                </li>

                <li className="flex items-start gap-3">
                  <span className="flex-none bg-yellow-50 text-yellow-700 rounded-full p-2">
                    <Wallet className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="font-medium text-slate-900">
                      All accounts in one place
                    </p>
                    <p className="text-sm text-slate-600">
                      Connect or manually add accounts and balances.
                    </p>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          {/* Right visual / mockup */}
          <div className="lg:col-span-5">
            <div className="relative mx-auto w-full max-w-md">
              <div className="rounded-2xl bg-gradient-to-br from-white to-slate-50 border p-1 shadow-lg">
                <div className="rounded-xl bg-white p-6">
                  {/* Mock phone card */}
                  <div className="w-full h-[460px] md:h-[520px] relative overflow-hidden rounded-lg bg-gradient-to-b from-slate-900 to-slate-800 text-white">
                    {/* header */}
                    <div className="p-4 flex items-center justify-between">
                      <div>
                        <div className="text-xs opacity-80">Today</div>
                        <div className="text-sm font-semibold">Nov 5, 2025</div>
                      </div>
                      <div className="text-xs opacity-80">Balance</div>
                    </div>

                    {/* content */}
                    <div className="p-6">
                      <div className="rounded-lg bg-white/5 p-4 mb-4">
                        <div className="text-sm opacity-80">Last action</div>
                        <div className="mt-2 flex items-center justify-between">
                          <div>
                            <div className="text-sm">Dinner</div>
                            <div className="text-xs opacity-70">
                              Voice • 10:12 PM
                            </div>
                          </div>
                          <div className="text-lg font-semibold">- ₹300</div>
                        </div>
                      </div>

                      <div className="grid gap-3">
                        <div className="flex items-center justify-between">
                          <div className="text-sm opacity-80">Groceries</div>
                          <div className="text-sm font-medium">₹1,250</div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="text-sm opacity-80">Transport</div>
                          <div className="text-sm font-medium">₹420</div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="text-sm opacity-80">
                            Subscriptions
                          </div>
                          <div className="text-sm font-medium">₹299</div>
                        </div>
                      </div>
                    </div>

                    {/* bottom CTA */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-900/70 via-transparent">
                      <div className="flex gap-3">
                        <div className="flex-1">
                          <div className="text-xs opacity-70">Quick add</div>
                          <div className="mt-2 flex gap-2">
                            <button className="flex-1 rounded-md bg-white/10 py-2 text-sm">
                              + Receipt
                            </button>
                            <button className="flex-1 rounded-md bg-white/10 py-2 text-sm">
                              + Voice
                            </button>
                          </div>
                        </div>
                        <div className="w-28 rounded-md bg-white/10 p-3 text-center">
                          <div className="text-xs opacity-70">Monthly</div>
                          <div className="text-sm font-semibold">₹52,300</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>{" "}
              {/* card wrapper end */}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
