import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import api from "./api";

export interface StoreConfig {
  free_shipping_threshold: number; // USD
  domestic_shipping: number;
  international_shipping: number;
  home_country: string;
}

const DEFAULTS: StoreConfig = {
  free_shipping_threshold: 100,
  domestic_shipping: 3,
  international_shipping: 25,
  home_country: "Syria",
};

const ConfigContext = createContext<StoreConfig>(DEFAULTS);

export function ConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<StoreConfig>(DEFAULTS);

  useEffect(() => {
    api
      .get("/config")
      .then((r) => setConfig({ ...DEFAULTS, ...r.data }))
      .catch(() => {
        /* keep defaults */
      });
  }, []);

  return (
    <ConfigContext.Provider value={config}>{children}</ConfigContext.Provider>
  );
}

export function useConfig() {
  return useContext(ConfigContext);
}
