"use client";

import { useState } from "react";
import ProductCard from "./components/ProductCard";
import ChatWidget from "./components/ChatWidget";

// Single dummy product for the hackathon demo.
// LISTED_PRICE must match the price baked into the system prompt in api/chat/route.js.
export const PRODUCT = {
  id: "smartwatch-001",
  name: "Premium Smartwatch",
  description: "AMOLED display, 7-day battery, heart-rate + SpO2 tracking.",
  image:
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80",
  listedPrice: 2500,
};

export default function Home() {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-1">
          🛍️ Bhaav-Taav Bazaar
        </h1>
        <p className="text-center text-neutral-500 text-sm mb-6">
          The only store where haggling is a feature, not a bug.
        </p>

        <ProductCard
          product={PRODUCT}
          onNegotiate={() => setIsChatOpen(true)}
        />
      </div>

      {isChatOpen && (
        <ChatWidget product={PRODUCT} onClose={() => setIsChatOpen(false)} />
      )}
    </main>
  );
}
