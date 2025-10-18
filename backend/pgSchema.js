import mongoose from "mongoose";

const PGSchema = new mongoose.Schema({
  name: String,
  price: Number,
  lat: Number,
  lng: Number,
  location: String,
  available: {
    type: Boolean,
    default: true,
  },
});

export default mongoose.model("PG", PGSchema);