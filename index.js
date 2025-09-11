import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import { spawn } from "child_process";
import { router } from "./routers/authRouter.js";
import {lessonRouter} from "./routers/lessonRouter.js";
import { courseRouter } from "./routers/courseRouter.js";
import { categoryRouter } from "./routers/categoryRouter.js";
import { quizRouter } from "./routers/quizRouter.js";
import http from 'http';
import { WebSocketServer } from "ws";
import { ideRouter } from "./routers/ideRouter.js";
import { userRouter } from "./routers/userRouter.js";
import { paymentRouter } from "./routers/paymentRoutes.js";
import { enrollmentRouter } from "./routers/enrollmentRouter.js";
import { videoRouter } from "./routers/videoRouter.js";
import dashboardRouter from "./routers/dashboardRouter.js";

const pythonProcess = spawn("./python-service/env/Scripts/python", ["python-service/khqr.py",],{
  env: {...process.env}
});

pythonProcess.stdout.on("data", (data) => {
  console.log(`[PYTHON] ${data.toString()}`);
});

pythonProcess.stderr.on("data", (data) => {
  console.error(`[PYTHON LOG] ${data.toString()}`);
});

pythonProcess.on("close", (code) => {
  console.log(`[PYTHON] Process exited with code ${code}`);
});


const app = express();
app.use(cors());
app.use(helmet());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Connected to database MongoDB");
  })
  .catch((err) => {
    console.log(err);
  });
app.use("/api/auth", router);
app.use("/api/lessons", lessonRouter);
app.use("/api/course", courseRouter);
app.use("/api/category", categoryRouter);
app.use('/api/ide', ideRouter);
app.use('/api/quiz', quizRouter);
app.use("/api/user", userRouter);
app.use("/api/payment", paymentRouter);
app.use("/api/enrollment", enrollmentRouter);
app.use("/api/video", videoRouter);
app.use("/api/dashboard", dashboardRouter);

const server = http.createServer(app);

export const wss = new WebSocketServer({ server });
export const connections = new Map();
export const processes = new Map();

wss.on("connection", (ws) => {
  console.log("Client connected");

  ws.on("message", (rawMsg) => {
    try {
      const msg = JSON.parse(rawMsg);
      if (msg.clientId) {
        connections.set(msg.clientId, ws);
        console.log(`Registered client ${msg.clientId}`);
      }
      if (msg.type === "stdin") {
        // Find the process for this client and write input
        const proc = processes.get(msg.clientId); // <--- new map you'll maintain in runCode
        if (proc) {
          let input = msg.data;
          if (input === "\r") input = "\n"; // normalize enter key
          proc.stdin.write(input);
      }
    }
    } catch(error) {
      console.log(error);
    }
  });

  ws.on("close", () => {
    for (const [id, socket] of connections.entries()) {
      if (socket === ws){
       connections.delete(id);
    
       const proc = processes.get(id);
        if (proc) {
          proc.kill("SIGKILL");
          processes.delete(id);
        }
      }
    }
  });
});

server.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});
