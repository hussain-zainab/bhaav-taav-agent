import Razorpay from "razorpay";

const MIN_PRICE = 1900; // Kept in sync with app/api/chat/route.js — final safety check before money moves.
const MAX_PRICE = 2500; // Can never exceed the listed MRP either.

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export async function POST(req) {
  try {
    const { finalPrice, productName } = await req.json();

    if (typeof finalPrice !== "number" || !Number.isFinite(finalPrice)) {
      return Response.json({ error: "Invalid final price" }, { status: 400 });
    }

    // Hard server-side clamp — this is the last line of defense before an
    // actual payment order is created, independent of anything the LLM said.
    if (finalPrice < MIN_PRICE || finalPrice > MAX_PRICE) {
      return Response.json(
        { error: `Price ₹${finalPrice} is outside the allowed range ₹${MIN_PRICE}–₹${MAX_PRICE}` },
        { status: 400 }
      );
    }

    const order = await razorpay.orders.create({
      amount: Math.round(finalPrice * 100), // Razorpay expects the amount in paise
      currency: "INR",
      receipt: `bhaavtaav_${Date.now()}`,
      notes: {
        product: productName || "Negotiated item",
        negotiated_price: String(finalPrice),
      },
    });

    return Response.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (err) {
    console.error("payment route error:", err);
    return Response.json({ error: "Failed to create payment order" }, { status: 500 });
  }
}
