import { useEffect, useState } from "react";
import { formatTotal, listOrders, type Order } from "../api/orders";

export function OrderList() {
  const [orders, setOrders] = useState<Order[]>([]);
  useEffect(() => {
    listOrders().then(setOrders);
  }, []);
  return (
    <ul>
      {orders.map((order) => (
        <li key={order.id}>
          {order.id}: {formatTotal(order)} ({order.status})
        </li>
      ))}
    </ul>
  );
}
