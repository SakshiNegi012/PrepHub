import express from "express";
import cors from "cors";
import connectDB from "./src/config/db.js";
import app from "./src/app.js";

/* dotenv.config();
connectDB();

//const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("PrepHUB Backend Running 🚀");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

*/

connectDB();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

