import { useState, useEffect } from "react";
import { useShipping } from "../../hooks/useShipping";
import { MapPin, Map, Building, Truck } from "lucide-react";
import { formatCurrency } from "../../utils/formatters";

type CheckoutShippingSectionProps = {
  customerAddress: string;
  provinceId: string;
  cityId: string;
  selectedCourier: string;
  selectedService: string;
  deliveryMethod: "shipping" | "pickup";
  loading: boolean;
  totalWeight: number; // in grams
  onChangeDeliveryMethod: (method: "shipping" | "pickup") => void;
  onChangeAddress: (value: string) => void;
  onChangeProvince: (value: string) => void;
  onChangeCity: (value: string) => void;
  onChangeShipping: (courier: string, service: string, cost: number) => void;
};

export function CheckoutShippingSection({
  customerAddress,
  provinceId,
  cityId,
  selectedCourier,
  selectedService,
  loading,
  deliveryMethod,
  totalWeight,
  onChangeDeliveryMethod,
  onChangeAddress,
  onChangeProvince,
  onChangeCity,
  onChangeShipping,
}: CheckoutShippingSectionProps) {
  const {
    provinces,
    cities,
    shippingCosts,
    isLoadingProvinces,
    isLoadingCities,
    isLoadingCost,
    fetchShippingCost,
  } = useShipping(provinceId, totalWeight);

  const [localCourier, setLocalCourier] = useState<string>(
    selectedCourier || "jne",
  );

  useEffect(() => {
    if (cityId) {
      fetchShippingCost(cityId, "153", localCourier); // Default origin is Jakarta Selatan (153)
    }
  }, [cityId, localCourier, totalWeight]);

  return (
    <div className="space-y-5 mb-8">
      <div className="flex items-center justify-between border-b border-rose-100 pb-2">
        <h2 className="text-lg font-bold text-gray-900">Delivery Method</h2>
      </div>

      <div className="flex gap-4 mb-4">
        <label
          className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border cursor-not-allowed transition-all border-gray-200 text-gray-400 bg-gray-50`}
        >
          <input
            type="radio"
            name="deliveryMethod"
            value="shipping"
            checked={deliveryMethod === "shipping"}
            onChange={() => onChangeDeliveryMethod("shipping")}
            className="hidden"
            disabled
          />
          <Truck size={20} />
          <div className="flex flex-col items-center">
            <span className="font-bold">Shipping</span>
            <span className="text-xs">Coming Soon</span>
          </div>
        </label>
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

      {deliveryMethod === "shipping" && (
        <>
          <div className="space-y-1.5">
            <label
              htmlFor="address"
              className="text-sm font-semibold text-neutral-950"
            >
              Full Address <span className="text-red-500">*</span>
            </label>
            <div className="relative flex items-start">
              <MapPin
                className="absolute left-3.5 top-3.5 text-gray-400 pointer-events-none"
                size={18}
              />
              <textarea
                id="address"
                value={customerAddress}
                onChange={(e) => onChangeAddress(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-rose-100 focus:ring-primary focus:border-primary text-sm py-3 pr-4 pl-11 outline-none transition-all"
                placeholder="e.g. Jl. Kenanga No. 5 RT 02/RW 03"
                disabled={loading}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label
                htmlFor="province_id"
                className="text-sm font-semibold text-neutral-950"
              >
                Province <span className="text-red-500">*</span>
              </label>
              <div className="relative flex items-center">
                <Map
                  className="absolute left-3.5 text-gray-400 pointer-events-none"
                  size={18}
                />
                <select
                  id="province_id"
                  value={provinceId}
                  onChange={(e) => onChangeProvince(e.target.value)}
                  disabled={loading || isLoadingProvinces}
                  className="w-full rounded-lg border border-rose-100 focus:ring-primary focus:border-primary text-sm py-3 pr-4 pl-11 outline-none transition-all appearance-none bg-white"
                >
                  <option value="" disabled>
                    {isLoadingProvinces
                      ? "Loading provinces..."
                      : "Select Province"}
                  </option>
                  {provinces.map((prov) => (
                    <option key={prov.province_id} value={prov.province_id}>
                      {prov.province}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="city_id"
                className="text-sm font-semibold text-neutral-950"
              >
                City / Regency <span className="text-red-500">*</span>
              </label>
              <div className="relative flex items-center">
                <Building
                  className="absolute left-3.5 text-gray-400 pointer-events-none"
                  size={18}
                />
                <select
                  id="city_id"
                  value={cityId}
                  onChange={(e) => onChangeCity(e.target.value)}
                  disabled={loading || !provinceId || isLoadingCities}
                  className="w-full rounded-lg border border-rose-100 focus:ring-primary focus:border-primary text-sm py-3 pr-4 pl-11 outline-none transition-all appearance-none bg-white"
                >
                  <option value="" disabled>
                    {!provinceId
                      ? "Select province first"
                      : isLoadingCities
                        ? "Loading cities..."
                        : "Select City / Regency"}
                  </option>
                  {cities.map((city) => (
                    <option key={city.city_id} value={city.city_id}>
                      {city.type} {city.city_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {cityId && (
            <div className="space-y-3 pt-4 border-t border-rose-100">
              <h3 className="text-sm font-semibold text-neutral-950 flex items-center gap-2">
                <Truck size={18} className="text-primary" />
                Shipping Method
              </h3>

              <div className="flex gap-3 mb-4">
                {["jne", "pos", "tiki"].map((courier) => (
                  <button
                    key={courier}
                    type="button"
                    onClick={() => setLocalCourier(courier)}
                    className={`flex-1 py-2 text-xs font-bold uppercase rounded-lg border transition-all ${localCourier === courier ? "border-primary bg-primary/5 text-primary" : "border-gray-200 text-gray-500 hover:border-primary/50"}`}
                  >
                    {courier}
                  </button>
                ))}
              </div>

              {isLoadingCost ? (
                <div className="text-sm text-gray-500 flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                  Calculating shipping cost...
                </div>
              ) : shippingCosts.length > 0 ? (
                <div className="space-y-3">
                  {shippingCosts.map((serviceGroup, index) => {
                    const costs = serviceGroup?.costs || [];
                    return costs.map((costDetail: any, idx: number) => {
                      const isSelected =
                        selectedCourier ===
                          (serviceGroup.code || serviceGroup.name) &&
                        selectedService === costDetail.service;
                      const costValue =
                        costDetail.cost?.[0]?.value ?? costDetail.value ?? 0;
                      const etd =
                        costDetail.cost?.[0]?.etd ?? costDetail.etd ?? "-";
                      return (
                        <div
                          key={`${serviceGroup.code || index}-${costDetail.service || idx}-${idx}`}
                          onClick={() =>
                            onChangeShipping(
                              serviceGroup.code ||
                                serviceGroup.name ||
                                selectedCourier,
                              costDetail.service,
                              costValue,
                            )
                          }
                          className={`p-3 rounded-lg border cursor-pointer transition-all ${isSelected ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-gray-200 hover:border-primary/50"}`}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-sm font-bold text-gray-900">
                                {(
                                  serviceGroup.code ||
                                  serviceGroup.name ||
                                  selectedCourier
                                ).toUpperCase()}{" "}
                                - {costDetail.service}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {costDetail.description}
                              </p>
                              <p className="text-xs text-gray-500 mt-0.5">
                                Estimasi: {etd} hari
                              </p>
                            </div>
                            <p className="text-sm font-bold text-primary">
                              {formatCurrency(costValue)}
                            </p>
                          </div>
                        </div>
                      );
                    });
                  })}
                </div>
              ) : (
                <div className="text-sm text-red-500">
                  Could not find shipping costs for this location.
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
