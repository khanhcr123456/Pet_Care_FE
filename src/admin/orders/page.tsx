import React, { useEffect, useState, useMemo } from 'react';
import Request_API from '../../service/api_request';
import OrdersClient from './OrdersClient';

export default function OrdersPage() {
    const [invoices, setInvoices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const apiClient = useMemo(() => new Request_API(), []);

    useEffect(() => {
        apiClient.getInvoices(1, 100)
            .then((payload) => {
                const rawInvoices = payload?.data?.docs || payload?.data || payload || [];
                const invArray = Array.isArray(rawInvoices) ? rawInvoices : [];
                const productOrders = invArray.filter((inv: any) => {
                    const type = String(inv.itemType || inv.type || "").toLowerCase();
                    return type === "product" || type === "products" || (Array.isArray(inv.items) && inv.items.some((i: any) => {
                        const itemType = String(i.type || "").toLowerCase();
                        return itemType === "product" || itemType === "products" || i.product;
                    }));
                });
                setInvoices(productOrders);
            })
            .catch(err => console.error("Lỗi khi fetch hóa đơn:", err))
            .finally(() => setLoading(false));
    }, [apiClient]);

    if (loading) {
        return (
            <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
                Đang tải dữ liệu đơn hàng...
            </div>
        );
    }

    return <OrdersClient initialInvoices={invoices} />;
}
