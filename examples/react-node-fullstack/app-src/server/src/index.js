import express from "express";
import { ordersRouter } from "./routes/orders.js";

const app = express();
app.use(ordersRouter);
app.listen(process.env.PORT ?? 3000);
