import fs from "fs";
import path from "path";
import { spawn } from "child_process";
import { connections, processes } from "../index.js";

export const runCode = (req, res) => {
  const { language, code, clientId } = req.body;

  const runners = {
    php: { file: "code.php", cmd: ["php", "code.php"] },
    python: { file: "code.py", cmd: ["python3", "code.py"] },
    node: { file: "code.js", cmd: ["node", "code.js"] },
    java: {
      file: "Main.java",
      cmd: ["sh", "-c", "javac Main.java && java Main"]
    },
    cpp: {
      file: "code.cpp",
      cmd: ["sh", "-c", "g++ code.cpp -o code && ./code"]
    }
  };

  const tempDir = path.join(process.cwd(), "temp");
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

  if (!runners[language]) {
    return res.status(400).json({ error: "Unsupported language" });
  }

  const filePath = path.join(tempDir, runners[language].file);
  fs.writeFileSync(filePath, code);

  // Directly spawn compiler/runtime (not docker)
  const proc = spawn(runners[language].cmd[0], runners[language].cmd.slice(1), {
    cwd: tempDir,
    stdio: ["pipe", "pipe", "pipe"],
    shell: true
  });

  processes.set(clientId, proc);
  const ws = connections.get(clientId);

  if (ws) ws.send(JSON.stringify({ type: "start" }));

  // Timeout safeguard (30s)
  const timeout = setTimeout(() => {
    if (processes.has(clientId)) {
      proc.kill("SIGTERM");
      processes.delete(clientId);
      if (ws) ws.send(JSON.stringify({
        type: "error",
        data: "Process timed out after 30 seconds"
      }));
      if (ws) ws.send(JSON.stringify({ type: "close", code: -1 }));
    }
  }, 30000);

  // STDOUT
  proc.stdout.on("data", (chunk) => {
    if (ws) ws.send(JSON.stringify({
      type: "stdout",
      data: chunk.toString()
    }));
  });

  // STDERR
  proc.stderr.on("data", (chunk) => {
    if (ws) ws.send(JSON.stringify({
      type: "stderr",
      data: chunk.toString()
    }));
  });

  // Exit
  proc.on("close", (code) => {
    clearTimeout(timeout);
    processes.delete(clientId);
    if (ws) ws.send(JSON.stringify({ type: "close", code }));
  });

  // Errors
  proc.on("error", (error) => {
    clearTimeout(timeout);
    processes.delete(clientId);
    if (ws) ws.send(JSON.stringify({
      type: "error",
      data: error.message
    }));
  });

  res.json({ status: "started" });
};

// unchanged
export const handleUserInput = (clientId, input) => {
  const proc = processes.get(clientId);
  if (proc && proc.stdin && proc.stdin.writable) {
    proc.stdin.write(input);
  }
};

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
