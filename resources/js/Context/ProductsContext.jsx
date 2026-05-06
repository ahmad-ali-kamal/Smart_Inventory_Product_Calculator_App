import { createContext, useContext, useState } from "react";

const ProductsContext = createContext(null);

const INITIAL_PRODUCTS = [
  { id: 1, sku: "TLE-001", name: "Marble Elegance Tile", category: "Flooring", active: true, image: "https://images.unsplash.com/photo-1615971677499-5467cbab01c0?w=80&h=80&fit=crop" },
  { id: 2, sku: "CGT-002", name: "Cement Gray Tile", category: "Flooring", active: true, image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=80&h=80&fit=crop" },
  { id: 3, sku: "WDP-003", name: "Oak Hardwood Plank", category: "Flooring", active: false, image: "https://images.unsplash.com/photo-1541123437800-1bb1317badc2?w=80&h=80&fit=crop" },
  { id: 4, sku: "PWP-004", name: "Porcelain White Panel", category: "Wall Tiles", active: false, image: "https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=80&h=80&fit=crop" },
  { id: 5, sku: "SDS-005", name: "Slate Dark Stone", category: "Natural Stone", active: false, image: "https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=80&h=80&fit=crop" },
  { id: 6, sku: "TRT-006", name: "Terracotta Rustic Tile", category: "Flooring", active: false, image: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=80&h=80&fit=crop" },
  { id: 7, sku: "LVP-007", name: "Luxury Vinyl Plank", category: "Vinyl", active: false, image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=80&h=80&fit=crop" },
  { id: 8, sku: "MGT-008", name: "Mosaic Glass Tile", category: "Decorative", active: false, image: "https://images.unsplash.com/photo-1558618047-f4e90167a213?w=80&h=80&fit=crop" },
  { id: 9, sku: "BWT-009", name: "Black Walnut Timber", category: "Flooring", active: false, image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=80&h=80&fit=crop" },
  { id: 10, sku: "CPT-010", name: "Cobalt Pool Tile", category: "Pool", active: false, image: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=80&h=80&fit=crop" },
  { id: 11, sku: "GRT-011", name: "Granite Ridge Tile", category: "Natural Stone", active: false, image: "https://images.unsplash.com/photo-1615971677499-5467cbab01c0?w=80&h=80&fit=crop" },
  { id: 12, sku: "HXT-012", name: "Hex Metro Tile", category: "Wall Tiles", active: false, image: "https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=80&h=80&fit=crop" },
  { id: 13, sku: "IVT-013", name: "Ivory Travertine", category: "Natural Stone", active: false, image: "https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=80&h=80&fit=crop" },
  { id: 14, sku: "JDP-014", name: "Jade Polished Stone", category: "Decorative", active: false, image: "https://images.unsplash.com/photo-1558618047-f4e90167a213?w=80&h=80&fit=crop" },
  { id: 15, sku: "KLT-015", name: "Kilim Pattern Tile", category: "Decorative", active: false, image: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=80&h=80&fit=crop" },
  { id: 16, sku: "LMT-016", name: "Limestone Matt Tile", category: "Natural Stone", active: false, image: "https://images.unsplash.com/photo-1541123437800-1bb1317badc2?w=80&h=80&fit=crop" },
  { id: 17, sku: "MNT-017", name: "Midnight Navy Tile", category: "Wall Tiles", active: false, image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=80&h=80&fit=crop" },
  { id: 18, sku: "NQP-018", name: "Nordic Quarry Plank", category: "Flooring", active: false, image: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=80&h=80&fit=crop" },
  { id: 19, sku: "OGT-019", name: "Onyx Gloss Tile", category: "Wall Tiles", active: false, image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=80&h=80&fit=crop" },
  { id: 20, sku: "PBT-020", name: "Pebble Beach Tile", category: "Pool", active: false, image: "https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=80&h=80&fit=crop" },
];

export function ProductsProvider({ children }) {
  const [products, setProducts] = useState(INITIAL_PRODUCTS);
  const [calcRules, setCalcRules] = useState({ coverage: 8.0, waste: 9.0 });

  const toggleProduct = (id) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, active: !p.active } : p))
    );
  };

  const updateCalcRules = (rules) => setCalcRules(rules);

  const activeProducts = products.filter((p) => p.active);

  return (
    <ProductsContext.Provider value={{ products, activeProducts, toggleProduct, calcRules, updateCalcRules }}>
      {children}
    </ProductsContext.Provider>
  );
}

export function useProducts() {
  return useContext(ProductsContext);
}
