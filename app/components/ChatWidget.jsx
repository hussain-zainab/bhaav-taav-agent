"use client";

import { useEffect, useRef, useState } from "react";

// Matches a trailing JSON block like:  {"deal_reached": true, "final_price": 2100}
// Allows the model to wrap it in a ```json fence or emit it bare at the end of the message.
const DEAL_REGEX = /\{?\s*"?deal_reached"?\s*:\s*true[^}]*\}/i;

function extractDeal(rawText) {
  const match = rawText.match(DEAL_REGEX);
  if (!match) return { displayText: rawText, deal: null };

  let jsonSlice = match[0];
  // Best-effort clean-up in case the model didn't emit strictly valid JSON
  try {
    const parsed = JSON.parse(jsonSlice.replace(/'/g, '"'));
    const displayText = rawText
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .replace(match[0], "")
      .trim();
    return { displayText, deal: parsed };
  } catch {
    return { displayText: rawText, deal: null };
  }
}

export default function ChatWidget({ product, onClose }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: `Namaste! 🙏 "${product.name}" is listed at ₹${product.listedPrice}. What price did you have in mind?`,
    },
  ]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [dealClosed, setDealClosed] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isSending]);

  async function sendMessage(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text || isSending || dealClosed) return;

    const nextMessages = [...messages, { role: "user", text }];
    setMessages(nextMessages);
    setInput("");
    setIsSending(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages,
          product,
        }),
      });

      if (!res.ok) throw new Error("Chat request failed");
      const data = await res.json();

      const { displayText, deal } = extractDeal(data.reply);

      setMessages((prev) => [...prev, { role: "assistant", text: displayText }]);

      if (deal?.deal_reached && deal?.final_price) {
        setDealClosed(true);
        await startPayment(deal.final_price);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "Arre yaar, something went wrong on my end. Try again?" },
      ]);
    } finally {
      setIsSending(false);
    }
  }

  async function startPayment(finalPrice) {
    setIsPaying(true);
    try {
      const res = await fetch("/api/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ finalPrice, productName: product.name }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Order creation failed");

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: data.amount,
        currency: data.currency,
        name: "Bhaav-Taav Bazaar",
        description: `${product.name} — negotiated deal`,
        order_id: data.orderId,
        handler: function () {
          setMessages((prev) => [
            ...prev,
            { role: "assistant", text: "✅ Payment successful! Deal done, thank you for shopping with us." },
          ]);
        },
        modal: {
          ondismiss: function () {
            setMessages((prev) => [
              ...prev,
              { role: "assistant", text: "No worries, checkout was cancelled. Let me know if you want to try again." },
            ]);
          },
        },
        theme: { color: "#171717" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "We agreed on a price, but I couldn't generate the payment link. Please try again." },
      ]);
      setDealClosed(false);
    } finally {
      setIsPaying(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-xl flex flex-col h-[85vh] sm:h-[600px]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200">
          <div>
            <p className="font-semibold text-sm">🧕 Shopkeeper — Bhaav-Taav AI</p>
            <p className="text-xs text-neutral-400">Usually replies instantly</p>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-700 text-xl leading-none px-2"
            aria-label="Close chat"
          >
            ×
          </button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap ${
                  m.role === "user"
                    ? "bg-neutral-900 text-white rounded-br-sm"
                    : "bg-neutral-100 text-neutral-800 rounded-bl-sm"
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}

          {isSending && (
            <div className="flex justify-start">
              <div className="bg-neutral-100 rounded-2xl rounded-bl-sm px-4 py-2 text-sm text-neutral-400">
                typing…
              </div>
            </div>
          )}

          {isPaying && (
            <div className="flex justify-center">
              <span className="text-xs text-neutral-400">Generating payment link…</span>
            </div>
          )}
        </div>

        {/* Input */}
        <form onSubmit={sendMessage} className="border-t border-neutral-200 p-3 flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={dealClosed || isSending}
            placeholder={dealClosed ? "Deal closed 🤝" : "Make an offer…"}
            className="flex-1 rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 disabled:bg-neutral-50"
          />
          <button
            type="submit"
            disabled={dealClosed || isSending || !input.trim()}
            className="rounded-xl bg-neutral-900 text-white px-4 py-2 text-sm font-medium disabled:opacity-40"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
