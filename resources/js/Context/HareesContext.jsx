import React, { createContext, useContext, useState } from 'react';

const InventoryContext = createContext();

export const HareesProvider = ({ children }) => {
    // بيانات افتراضية (Mock Data) تشبه الصور التي أرسلتِها
    const [products, setProducts] = useState([
        { id: 1, name: 'خيوط قطنية - أحمر', sku: 'INV-001', stock: 150, category: 'منسوجات' },
        { id: 2, name: 'إبر تطريز مقاس 5', sku: 'INV-002', stock: 45, category: 'أدوات' },
    ]);

    const [batches, setBatches] = useState([
        { id: 101, productId: 1, batchNo: 'B-2024-01', expiryDate: '2026-05-10', quantity: 50, status: 'نشط' },
        { id: 102, productId: 1, batchNo: 'B-2024-02', expiryDate: '2026-08-15', quantity: 100, status: 'نشط' },
        { id: 103, productId: 2, batchNo: 'B-2024-05', expiryDate: '2024-06-01', quantity: 10, status: 'قريب الانتهاء' },
    ]);

    // إحصائيات سريعة للـ Dashboard
    const stats = {
        totalProducts: products.length,
        expiringSoon: batches.filter(b => b.status === 'قريب الانتهاء').length,
        lowStock: products.filter(p => p.stock < 50).length,
    };

    return (
        <InventoryContext.Provider value={{ products, batches, stats, setProducts, setBatches }}>
            {children}
        </InventoryContext.Provider>
    );
};

export const useHarees = () => useContext(InventoryContext);