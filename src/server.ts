import express from "express";
import cors from "cors";
import Router from "./server.controller";
const app = express();

app.use(cors());
app.use(express.json());

Router(app);
export default app;
