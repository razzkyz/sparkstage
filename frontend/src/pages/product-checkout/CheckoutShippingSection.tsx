import { Building } from "lucide-react";

type CheckoutShippingSectionProps = {
  deliveryMethod: "shipping" | "pickup";
  onChangeDeliveryMethod: (method: "shipping" | "pickup") => void;
};

export function CheckoutShippingSection({
  deliveryMethod,
  onChangeDeliveryMethod,
}: CheckoutShippingSectionProps) {
  return (
    <div className="space-y-5 mb-8">
      <div className="flex items-center justify-between border-b border-rose-100 pb-2">
        <h2 className="text-lg font-bold text-gray-900">Delivery Method</h2>
      </div>

      <div className="flex gap-4 mb-4">
        <label
          className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border cursor-pointer transition-all ${deliveryMethod === "pickup" ? "border-primary bg-primary/5 text-primary ring-1 ring-primary" : "border-gray-200 text-gray-500 hover:border-primary/50"}`}
        >
          <input
            type="radio"
            name="deliveryMethod"
            value="pickup"
            checked={deliveryMethod === "pickup"}
            onChange={() => onChangeDeliveryMethod("pickup")}
            className="hidden"
          />
          <Building size={20} />
          <span className="font-bold">Store Pickup</span>
        </label>
      </div>

      {deliveryMethod === "pickup" && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
          <p className="font-semibold mb-1">Store Pickup Selected</p>
          <p>Please come to our store location to pick up your order. Make sure to bring your order confirmation when you arrive.</p>
        </div>
      )}
    </div>
  );
}
