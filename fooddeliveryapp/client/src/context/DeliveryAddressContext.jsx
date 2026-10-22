import { createContext, useContext, useState } from "react";

const DELIVERY_ADDRESS_KEY = "deliveryAddress";
const DELIVERY_ADDRESSES_KEY = "deliveryAddresses";
const DeliveryAddressContext = createContext(null);

const readSavedAddresses = () => {
  const serializedAddresses = localStorage.getItem(DELIVERY_ADDRESSES_KEY);
  if (serializedAddresses) {
    const addresses = JSON.parse(serializedAddresses);
    if (Array.isArray(addresses)) {
      return [...new Set(addresses.filter((address) => typeof address === "string" && address.trim()))];
    }
  }

  const legacyAddress = localStorage.getItem(DELIVERY_ADDRESS_KEY)?.trim();
  return legacyAddress ? [legacyAddress] : [];
};

export function DeliveryAddressProvider({ children }) {
  const [deliveryAddresses, setDeliveryAddresses] = useState(readSavedAddresses);
  const [deliveryAddress, setDeliveryAddress] = useState(() => {
    const selectedAddress = localStorage.getItem(DELIVERY_ADDRESS_KEY)?.trim();
    return selectedAddress || readSavedAddresses()[0] || "";
  });

  const saveDeliveryAddress = (address) => {
    const normalizedAddress = address.trim();
    if (!normalizedAddress) return;
    setDeliveryAddresses((currentAddresses) => {
      const nextAddresses = currentAddresses.includes(normalizedAddress)
        ? currentAddresses
        : [...currentAddresses, normalizedAddress];
      localStorage.setItem(DELIVERY_ADDRESSES_KEY, JSON.stringify(nextAddresses));
      return nextAddresses;
    });
    localStorage.setItem(DELIVERY_ADDRESS_KEY, normalizedAddress);
    setDeliveryAddress(normalizedAddress);
  };

  const selectDeliveryAddress = (address) => {
    if (!deliveryAddresses.includes(address)) return;
    localStorage.setItem(DELIVERY_ADDRESS_KEY, address);
    setDeliveryAddress(address);
  };

  return (
    <DeliveryAddressContext.Provider value={{
      deliveryAddress,
      deliveryAddresses,
      saveDeliveryAddress,
      selectDeliveryAddress,
    }}>
      {children}
    </DeliveryAddressContext.Provider>
  );
}

export const useDeliveryAddress = () => useContext(DeliveryAddressContext);
