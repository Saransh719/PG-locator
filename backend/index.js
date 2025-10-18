import express from "express";
import { connectDB } from "./db.js";
import PG from "./pgSchema.js";

const host = process.env.IP; 
const app = express();
app.use(express.json());
connectDB();

app.get("/", (req, res) => res.send("Kahinexa API Running..."));

// Add PG
app.post("/pgs", async (req, res) => {
    const pg = new PG(req.body);
    await pg.save();
    res.json(pg);
});

// Get all PGs
app.get("/pgs", async (req, res) => {
    const pgs = await PG.find();
    res.json(pgs);
});

app.get("/pgs/search", async (req, res) => {
    const { maxPrice } = req.query;
    const result = await PG.find({ price: { $lte: maxPrice } });
    res.json(result);
});

app.listen(process.env.PORT,"0.0.0.0",function()
{
    console.log("Running on port "+process.env.PORT);
})
