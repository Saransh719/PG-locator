import mongoose from "mongoose";

const PGSchema = new mongoose.Schema({
  name: String,
  price: Number,
  location: {
    latitude: Number,
    longitude: Number,
  },
  available: {
    type: Boolean,
    default: true
  }
});

export default mongoose.model("PG", PGSchema);