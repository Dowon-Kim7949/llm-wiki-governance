// The client side of GET /api/orders (shared/orders-contract.json).
export type OrderStatus = "pending" | "paid" | "shipped";

export interface Order {
  id: string;
  totalCents: number;
  status: OrderStatus;
}

export async function listOrders(): Promise<Order[]> {
  const response = await fetch("/api/orders");
  if (!response.ok) throw new Error(`GET /api/orders failed: ${response.status}`);
  return response.json();
}

export function formatTotal(order: Order): string {
  return `$${(order.totalCents / 100).toFixed(2)}`;
}
