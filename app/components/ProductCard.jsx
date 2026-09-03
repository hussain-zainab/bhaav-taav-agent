export default function ProductCard({ product, onNegotiate }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
      <img
        src={product.image}
        alt={product.name}
        className="w-full h-56 object-cover"
      />
      <div className="p-5">
        <h2 className="text-lg font-semibold">{product.name}</h2>
        <p className="text-neutral-500 text-sm mt-1">{product.description}</p>

        <div className="flex items-baseline gap-2 mt-4">
          <span className="text-2xl font-bold">
            ₹{product.listedPrice.toLocaleString("en-IN")}
          </span>
          <span className="text-xs text-neutral-400 line-through">
            ₹{Math.round(product.listedPrice * 1.2).toLocaleString("en-IN")}
          </span>
        </div>

        <button
          onClick={onNegotiate}
          className="mt-5 w-full rounded-xl bg-neutral-900 text-white font-medium py-3 hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2"
        >
          💬 Negotiate Price
        </button>
      </div>
    </div>
  );
}
