import fs from "fs";
import path from "path";
import { spawn } from "child_process";
import { connections, processes } from "../index.js";

export const runCode = (req, res) => {
  const { language, code, clientId } = req.body;

  if (!clientId) return res.status(400).json({ error: "clientId is required" });

  // Define runners for each language
  const runners = {
    php: { file: "code.php", cmd: ["php", "code.php"] },
    python: { file: "code.py", cmd: ["python3", "code.py"] },
    node: { file: "code.js", cmd: ["node", "code.js"] },
    java: { file: "Main.java" },
    cpp: { file: "code.cpp" }
  };

  if (!runners[language]) {
    return res.status(400).json({ error: "Unsupported language" });
  }

  // Create unique temp folder per client
  const tempDir = path.join(process.cwd(), "temp", clientId);
  fs.mkdirSync(tempDir, { recursive: true });

  // Write code to file
  const filePath = path.join(tempDir, runners[language].file);
  fs.writeFileSync(filePath, code, { encoding: "utf8" });

  const ws = connections.get(clientId);
  if (ws) ws.send(JSON.stringify({ type: "start" }));

  // Timeout (30s)
  const timeout = setTimeout(() => {
    const proc = processes.get(clientId);
    if (proc) {
      proc.kill("SIGTERM");
      processes.delete(clientId);
      if (ws) ws.send(JSON.stringify({
        type: "error",
        data: "Process timed out after 30 seconds"
      }));
      if (ws) ws.send(JSON.stringify({ type: "close", code: -1 }));
    }
  }, 30000);

  // Helper to handle stdout/stderr
  const attachOutput = (proc) => {
    proc.stdout.on("data", chunk => ws?.send(JSON.stringify({ type: "stdout", data: chunk.toString() })));
    proc.stderr.on("data", chunk => ws?.send(JSON.stringify({ type: "stderr", data: chunk.toString() })));
    proc.on("close", code => {
      clearTimeout(timeout);
      processes.delete(clientId);
      ws?.send(JSON.stringify({ type: "close", code }));
    });
    proc.on("error", error => {
      clearTimeout(timeout);
      processes.delete(clientId);
      ws?.send(JSON.stringify({ type: "error", data: error.message }));
    });
  };

  // Handle Java
  if (language === "java") {
    const compile = spawn("javac", ["Main.java"], { cwd: tempDir, shell: true });
    compile.stderr.on("data", chunk => ws?.send(JSON.stringify({ type: "stderr", data: chunk.toString() })));
    compile.on("close", code => {
      if (code === 0) {
        const run = spawn("java", ["Main"], { cwd: tempDir, shell: true });
        processes.set(clientId, run);
        attachOutput(run);
      } else {
        clearTimeout(timeout);
        ws?.send(JSON.stringify({ type: "close", code: -1 }));
      }
    });
    processes.set(clientId, compile);
    return res.json({ status: "started" });
  }

  // Handle C++
  if (language === "cpp") {
    const compile = spawn("g++", ["code.cpp", "-o", "code"], { cwd: tempDir, shell: true });
    compile.stderr.on("data", chunk => ws?.send(JSON.stringify({ type: "stderr", data: chunk.toString() })));
    compile.on("close", code => {
      if (code === 0) {
        const run = spawn("./code", [], { cwd: tempDir, shell: true });
        processes.set(clientId, run);
        attachOutput(run);
      } else {
        clearTimeout(timeout);
        ws?.send(JSON.stringify({ type: "close", code: -1 }));
      }
    });
    processes.set(clientId, compile);
    return res.json({ status: "started" });
  }

  // Handle PHP, Python, Node
  const proc = spawn(runners[language].cmd[0], runners[language].cmd.slice(1), {
    cwd: tempDir,
    stdio: ["pipe", "pipe", "pipe"],
    shell: true
  });
  processes.set(clientId, proc);
  attachOutput(proc);

  res.json({ status: "started" });
};

// Handle user input
export const handleUserInput = (clientId, input) => {
  const proc = processes.get(clientId);
  if (proc && proc.stdin && proc.stdin.writable) {
    proc.stdin.write(input.endsWith("\n") ? input : input + "\n");
  }
};

// Send input via API
export const sendInput = (req, res) => {
  const { clientId, input } = req.body;
  const proc = processes.get(clientId);

  if (proc && proc.stdin && proc.stdin.writable) {
    const inputToSend = input.endsWith("\n") ? input : input + "\n";
    proc.stdin.write(inputToSend);
    proc.stdin.end();
    res.json({ status: "input_sent" });
  } else {
    res.status(400).json({ error: "Process not found or not writable" });
  }
};

// Kill process
export const killProcess = (req, res) => {
  const { clientId } = req.body;
  const proc = processes.get(clientId);

  if (proc) {
    proc.kill("SIGTERM");
    processes.delete(clientId);
    res.json({ status: "process_killed" });
  } else {
    res.status(400).json({ error: "Process not found" });
  }
};
