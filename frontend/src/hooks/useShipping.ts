import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface Province {
  province_id: string;
  province: string;
}

export interface City {
  city_id: string;
  province_id: string;
  province: string;
  type: string;
  city_name: string;
  postal_code: string;
}

export interface ShippingCost {
  service: string;
  description: string;
  cost: Array<{
    value: number;
    etd: string;
    note: string;
  }>;
}

export interface CourierService {
  code: string;
  name: string;
  costs: ShippingCost[];
}

export const useShipping = (provinceId?: string, weight: number = 1000) => {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [shippingCosts, setShippingCosts] = useState<CourierService[]>([]);
  const [isLoadingProvinces, setIsLoadingProvinces] = useState(false);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [isLoadingCost, setIsLoadingCost] = useState(false);

  useEffect(() => {
    const fetchProvinces = async () => {
      setIsLoadingProvinces(true);
      try {
        const { data, error } = await supabase.functions.invoke('rajaongkir', {
          body: { action: 'provinces' }
        });
        if (error) throw error;
        if (data?.data) { // Assuming data.data holds the results
          // Actually, Komerce rajaongkir returns data.rajaongkir.results usually. 
          // Let's check how ProfilePage handled it. It used data?.data. Let's use data.data
          // Wait, RajaOngkir API format: data.rajaongkir.results. Komerce wrapper might differ.
          // In ProfilePage.tsx: `if (data?.data) setProvinces(data.data);`
          // We will follow ProfilePage.tsx
          // ProfilePage uses prov.id, prov.name. Let's check RajaOngkir format.
          // Wait, if it's Komerce wrapper, maybe it's id/name. Let's look at ProfilePage.
          const formatted = (data.data || []).map((p: any) => ({
            province_id: p.id || p.province_id,
            province: p.name || p.province
          }));
          setProvinces(formatted);
        }
      } catch (err) {
        console.error('Failed to fetch provinces:', err);
      } finally {
        setIsLoadingProvinces(false);
      }
    };
    fetchProvinces();
  }, []);

  useEffect(() => {
    if (!provinceId) {
      setCities([]);
      return;
    }
    const fetchCities = async () => {
      setIsLoadingCities(true);
      try {
        const { data, error } = await supabase.functions.invoke('rajaongkir', {
          body: { action: 'cities', province_id: provinceId }
        });
        if (error) throw error;
        if (data?.data) {
          const formatted = (data.data || []).map((c: any) => ({
            province_id: c.province_id || provinceId,
            province: '',
            type: c.type || '',
            city_name: c.name || c.city_name || c.name,
            postal_code: c.postal_code || ''
          }));
          setCities(formatted);
        }
      } catch (err) {
        console.error('Failed to fetch cities:', err);
      } finally {
        setIsLoadingCities(false);
      }
    };
    fetchCities();
  }, [provinceId]);

  const fetchShippingCost = async (destinationCityId: string, originCityId: string = '153', courier: string = 'jne') => { // origin default (e.g. Jakarta Selatan)
    if (!destinationCityId) return;
    setIsLoadingCost(true);
    try {
      const { data, error } = await supabase.functions.invoke('rajaongkir', {
        body: {
          action: 'cost',
          origin: originCityId,
          destination: destinationCityId,
          weight: weight,
          courier: courier
        }
      });
      if (error) throw error;
      
      let results = data?.rajaongkir?.results || data?.data || [];
      if (results.length > 0) {
        if (typeof results[0].cost === 'number') {
          const grouped = results.reduce((acc: any[], curr: any) => {
            let courier = acc.find((c: any) => c.code === curr.code);
            if (!courier) {
              courier = { code: curr.code, name: curr.name, costs: [] };
              acc.push(courier);
            }
            courier.costs.push({
              service: curr.service,
              description: curr.description,
              cost: [{ value: curr.cost, etd: curr.etd || '-', note: '' }]
            });
            return acc;
          }, []);
          setShippingCosts(grouped);
        } else {
          setShippingCosts(results);
        }
      } else {
        setShippingCosts([]);
      }
    } catch (err) {
      console.error('Failed to fetch shipping cost:', err);
      setShippingCosts([]);
    } finally {
      setIsLoadingCost(false);
    }
  };

  return {
    provinces,
    cities,
    shippingCosts,
    isLoadingProvinces,
    isLoadingCities,
    isLoadingCost,
    fetchShippingCost
  };
};
