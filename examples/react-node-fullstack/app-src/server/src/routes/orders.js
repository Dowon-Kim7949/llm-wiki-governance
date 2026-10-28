// The server side of GET /api/orders (shared/orders-contract.json).
import { Router } from "express";

const ORDERS = [
  { id: "o-1001", totalCents: 4200, status: "paid" },
  { id: "o-1002", totalCents: 1599, status: "pending" }
];

export const ordersRouter = Router();

ordersRouter.get("/api/orders", (request, response) => {
  response.json(ORDERS);
});
