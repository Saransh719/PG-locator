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
    const { maxPrice, location } = req.query;

    const query = {};
    if (maxPrice) {
        query.price = { $lte: Number(maxPrice) };
    }
    if (location) {
        query.location = { $regex: location, $options: "i" }; // Case-insensitive substring match
    }

    try {
        const result = await PG.find(query);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch PGs" });
    }
});

app.put("/pgs/:id", async (req, res) => {
    const { id } = req.params;
    const { name, price, lat,lng,location, available } = req.body;

    const updatedPg = await PG.findByIdAndUpdate(
      id,
      { name, price, location, available,lat,lng },
      { new: true, runValidators: true }
    );

    if (!updatedPg) {
      return res.status(404).json({ message: "PG not found" });
    }

    res.json(updatedPg);

});
app.listen(process.env.PORT,"0.0.0.0",function()
{
    console.log("Running on port "+process.env.PORT);
})
