import mongoose from "mongoose";
import config from "./config.js";

/* const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected");
  } catch (error) {
    console.error("DB Error:", error.message);
    process.exit(1);
  }
}; */

async function connectDB(){

  await mongoose.connect(config.MONGO_URI)
  console.log("MongoDB Connected");

}

export default connectDB;