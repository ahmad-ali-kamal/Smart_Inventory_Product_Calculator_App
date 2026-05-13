import Card from "../../Common/UI/Card";
import InventoryProductRow from "./InventoryProductRow";

const HEADERS = ["Product", "Category", "Status", "Qty", "Expiry Info", "Action"];
const WIDTHS  = ["16%", "16%", "16%", "16%", "16%", "20%"];

export default function InventoryTable({ products, onExpiry }) {
    return (
        <Card>
            <div className="overflow-x-auto">
                <table className="w-full border-collapse min-w-[700px]">
                    <thead>
                        <tr className="border-b border-[var(--border)] bg-[var(--muted)]/20">
                            {HEADERS.map((h, i) => (
                                <th
                                    key={h}
                                    style={{ width: WIDTHS[i] }}
                                    className={`p-4 text-[10px] font-black text-[var(--muted-foreground)] uppercase tracking-wider ${i === 0 ? 'text-left' : 'text-center'}`}
                                >
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {products.length > 0 ? (
                            products.map(product => (
                                <InventoryProductRow
                                    key={product.id}
                                    product={product}
                                    onExpiry={onExpiry}
                                />
                            ))
                        ) : (
                            <tr>
                                <td colSpan={6} className="py-16 text-center text-sm text-[var(--muted-foreground)]">
                                    No products found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </Card>
    );
}