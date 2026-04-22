const fs = require("fs");
const path = require("path");
const express = require("express");

const app = express();
const port = process.env.PORT || 5001;
const logDir = path.join(__dirname, "data");
// Change 3: store transaction logs in a local json file
const logFile = path.join(logDir, "transaction-log.json");
const supportedNetworks = [
    "Ethereum Mainnet",
    "Goerli",
    "Polygon Mainnet",
    "BSC",
];

app.use(express.json());

app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");

    if (req.method === "OPTIONS") {
        return res.sendStatus(204);
    }

    next();
});

function ensureLogFile() {
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
    }

    if (!fs.existsSync(logFile)) {
        fs.writeFileSync(logFile, "[]\n");
    }
}

function readLogs() {
    ensureLogFile();

    try {
        const data = fs.readFileSync(logFile, "utf8");
        const logs = JSON.parse(data);
        return Array.isArray(logs) ? logs : [];
    } catch (error) {
        return [];
    }
}

function writeLogs(logs) {
    ensureLogFile();
    fs.writeFileSync(logFile, `${JSON.stringify(logs, null, 2)}\n`);
}

app.get("/api/health", (req, res) => {
    res.json({
        status: "ok",
        timestamp: new Date().toISOString(),
    });
});

app.get("/api/project-info", (req, res) => {
    res.json({
        projectName: "Enhanced Dex Aggregator",
        repoName: "Enhanced-Dex-aggregator",
        supportedNetworks,
    });
});

// Change 3: added simple transaction log routes
app.post("/api/transaction-log", (req, res) => {
    if (!req.body || Array.isArray(req.body) || typeof req.body !== "object") {
        return res.status(400).json({
            message: "Invalid transaction log payload",
        });
    }

    const logs = readLogs();
    const entry = {
        id: Date.now().toString(),
        savedAt: new Date().toISOString(),
        ...req.body,
    };

    logs.push(entry);
    writeLogs(logs);

    res.status(201).json({
        message: "Transaction log saved",
        entry,
    });
});

app.get("/api/transaction-log/latest", (req, res) => {
    const logs = readLogs();
    const latestEntry = logs.length > 0 ? logs[logs.length - 1] : null;

    res.json({
        entry: latestEntry,
    });
});

ensureLogFile();

app.listen(port, () => {
    console.log(`Backend server running on http://localhost:${port}`);
});
