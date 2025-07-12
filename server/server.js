import express from "express";
import cors from "cors";
import 'dotenv/config';
import cookieParser from "cookie-parser";
import authRouter from './routes/authRoutes.js'
import session from "express-session";

import connectDB from "./config/mongodb.js";
import userRouter from "./routes/userRoutes.js";


const app = express();
const port = process.env.PORT || 4000
connectDB();

const allowedOrigins = [
  'http://localhost:5173',
  'https://nits-qc.vercel.app',
  'https://nits-qc-supernovadss-projects.vercel.app',
  'https://nits-qc-git-main-supernovadss-projects.vercel.app'
];

app.use(express.json());
app.use(cookieParser());
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log("❌ Blocked by CORS:", origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));

import session from 'express-session';

app.use(session({
  secret: process.env.SESSION_SECRET || 'qc_secret_123',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", 
    sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax" 
  }
}));


//API Endpoints
app.get("/" , (req, res) => {
    res.send("API Working");
});
app.use('/api/auth' , authRouter);
app.use('/api/user' , userRouter);

app.listen(port, () => {
    console.log(`Server started on Port : ${port}`)
});