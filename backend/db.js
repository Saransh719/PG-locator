import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

export const connectDB =  () => {
    mongoose.connect(process.env.MONGO_URL)
    .then( () => {
        console.log("MongoDB connected")
    })
    .catch( (err) => {
        console.log(err)
        process.exit(1);
    } )
}


