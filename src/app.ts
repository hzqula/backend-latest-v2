import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";
import { HttpError } from "./utils/error";
import authRoutes from "./routes/auth.route";
import { PORT } from "./configs/env";

const app: Application = express();

// Middleware
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", authRoutes);

// Error Handling
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  if (error instanceof HttpError) {
    res.status(error.status).json({ error: error.message });
  } else {
    console.error("Unexpected error:", error);
    res.status(500).json({ error: "Terjadi kesalahan pada server" });
  }
});

// Start Server
app.get("/", (req: Request, res: Response) => {
  res.send("Welcome to Latest API");
});
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
