import "./globals.css";
import Script from "next/script";

export const metadata = {
  title: "Bhaav-Taav — AI Bargain Agent",
  description: "Negotiate your price with an AI shopkeeper before checkout.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-neutral-50 text-neutral-900 antialiased">
        {children}
        {/* Loaded once, globally, so ChatWidget can call window.Razorpay */}
        <Script
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
