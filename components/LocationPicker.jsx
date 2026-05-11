"use client";

import { useState, useEffect, useCallback } from "react";
import { Country, State, City } from "country-state-city";
import dynamic from "next/dynamic";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapPin, Navigation, Search, Loader2 } from "lucide-react";

// Leaflet must be imported client-side only (no SSR)
const MapComponent = dynamic(() => import("./LeafletMap"), { ssr: false });

/**
 * LocationPicker
 *
 * Props:
 *  - value: { country, state, city, pincode, lat, lng, address }
 *  - onChange(updatedValue): callback when any field changes
 */
export default function LocationPicker({ value = {}, onChange }) {
  const [country, setCountry] = useState(value.country || "IN");
  const [stateCode, setStateCode] = useState(value.state || "");
  const [city, setCity] = useState(value.city || "");
  const [pincode, setPincode] = useState(value.pincode || "");
  const [lat, setLat] = useState(value.lat || 20.5937);
  const [lng, setLng] = useState(value.lng || 78.9629);
  const [address, setAddress] = useState(value.address || "");
  const [isGeocoding, setIsGeocoding] = useState(false);

  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
    // Auto-geolocate if we are on the default Nagpur coordinates
    if (lat === 20.5937 && lng === 78.9629 && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const newLat = pos.coords.latitude;
          const newLng = pos.coords.longitude;
          setLat(newLat);
          setLng(newLng);
          onChange?.({ ...value, lat: newLat, lng: newLng });
        },
        () => {
          console.log("[LocationPicker] Geolocation declined or failed, staying on default.");
        }
      );
    }
  }, []);

  const countries = Country.getAllCountries();
  const states = State.getStatesOfCountry(country);
  const cities = City.getCitiesOfState(country, stateCode);

  const notify = useCallback((overrides = {}) => {
    onChange?.({
      country,
      state: stateCode,
      city,
      pincode,
      lat,
      lng,
      address,
      ...overrides,
    });
  }, [country, stateCode, city, pincode, lat, lng, address, onChange]);

  const handleCountryChange = (e) => {
    const c = e.target.value;
    setCountry(c);
    setStateCode("");
    setCity("");
    notify({ country: c, state: "", city: "" });
  };

  const handleStateChange = (e) => {
    const s = e.target.value;
    setStateCode(s);
    setCity("");
    notify({ state: s, city: "" });
  };

  const handleCityChange = (e) => {
    const c = e.target.value;
    setCity(c);
    notify({ city: c });
  };

  const handlePincodeChange = (e) => {
    const p = e.target.value.replace(/\D/g, "").slice(0, 6);
    setPincode(p);
    notify({ pincode: p });
  };

  const handleMapClick = ({ lat: newLat, lng: newLng }) => {
    setLat(newLat);
    setLng(newLng);
    notify({ lat: newLat, lng: newLng });
  };

  const handleAddressChange = (e) => {
    setAddress(e.target.value);
    notify({ address: e.target.value });
  };

  const handleFindAddress = async () => {
    if (!address && !city) return;
    
    setIsGeocoding(true);
    const query = `${address}, ${city}, ${stateCode}, ${country}`;
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
      const data = await response.json();
      
      if (data && data.length > 0) {
        const newLat = parseFloat(data[0].lat);
        const newLng = parseFloat(data[0].lon);
        setLat(newLat);
        setLng(newLng);
        notify({ lat: newLat, lng: newLng });
      }
    } catch (err) {
      console.error("[Geocoding] Failed:", err);
    } finally {
      setIsGeocoding(false);
    }
  };

  // Try to use browser geolocation to centre the map
  const handleGeolocate = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newLat = pos.coords.latitude;
        const newLng = pos.coords.longitude;
        setLat(newLat);
        setLng(newLng);
        notify({ lat: newLat, lng: newLng });
      },
      () => { }
    );
  };

  return (
    <div className="space-y-5">
      {/* Country / State / City row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Country */}
        <div className="space-y-1.5">
          <Label className="text-sm font-semibold text-gray-700">Country</Label>
          <select
            value={country}
            onChange={handleCountryChange}
            className="w-full h-12 px-3 rounded-xl border-2 border-gray-200 bg-gray-50 text-sm focus:border-red-500 focus:outline-none focus:ring-4 focus:ring-red-500/20 transition-all"
          >
            {countries.map((c) => (
              <option key={c.isoCode} value={c.isoCode}>
                {c.flag} {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* State */}
        <div className="space-y-1.5">
          <Label className="text-sm font-semibold text-gray-700">State / Province</Label>
          <select
            value={stateCode}
            onChange={handleStateChange}
            className="w-full h-12 px-3 rounded-xl border-2 border-gray-200 bg-gray-50 text-sm focus:border-red-500 focus:outline-none focus:ring-4 focus:ring-red-500/20 transition-all"
          >
            <option value="">Select State</option>
            {states.map((s) => (
              <option key={s.isoCode} value={s.isoCode}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* City */}
        <div className="space-y-1.5">
          <Label className="text-sm font-semibold text-gray-700">City / Village</Label>
          <select
            value={city}
            onChange={handleCityChange}
            className="w-full h-12 px-3 rounded-xl border-2 border-gray-200 bg-gray-50 text-sm focus:border-red-500 focus:outline-none focus:ring-4 focus:ring-red-500/20 transition-all"
          >
            <option value="">Select City</option>
            {cities.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Pincode + Address */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label className="text-sm font-semibold text-gray-700">Pincode</Label>
          <Input
            type="text"
            inputMode="numeric"
            value={pincode}
            onChange={handlePincodeChange}
            placeholder="e.g. 411001"
            maxLength={6}
            className="h-12 bg-gray-50 border-2 border-gray-200 hover:border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/20 rounded-xl transition-all font-mono"
          />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label className="text-sm font-semibold text-gray-700">
            Full Address <span className="text-red-500">*</span>
          </Label>
          <div className="flex gap-2">
            <Input
              value={address}
              onChange={handleAddressChange}
              placeholder="House/Plot, Street, Village, Taluka..."
              className="h-12 bg-gray-50 border-2 border-gray-200 hover:border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/20 rounded-xl transition-all"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleFindAddress}
              disabled={isGeocoding}
              className="h-12 px-4 border-red-200 text-red-600 hover:bg-red-50 rounded-xl"
              title="Find precise coordinates from address"
            >
              {isGeocoding ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4 mr-1" />
              )}
              {isGeocoding ? "Finding..." : "Find"}
            </Button>
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
            <MapPin className="h-4 w-4 text-red-500" />
            Pin Your Farm Location (Click on map to mark)
          </Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleGeolocate}
            className="h-8 text-xs border-red-200 text-red-600 hover:bg-red-50"
          >
            <Navigation className="h-3 w-3 mr-1" />
            Use My Location
          </Button>
        </div>

        <div className="relative w-full rounded-2xl overflow-hidden border-2 border-gray-200 shadow-md mx-auto" style={{ height: 320 }}>
          {hasMounted && (
            <MapComponent
              lat={lat}
              lng={lng}
              onMapClick={handleMapClick}
            />
          )}
        </div>

        <p className="text-xs text-gray-400">
          Coordinates: {lat.toFixed(5)}, {lng.toFixed(5)}
        </p>
      </div>
    </div>
  );
}
