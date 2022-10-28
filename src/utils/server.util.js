// packages
const { createServer } = require("http");
const express = require("express");
const { Server } = require("socket.io");

const app = express();
const httpServer = createServer(app);

const origins = [
    "http://192.168.29.97:3000",
    "http://localhost:3000",
    "https://its-me-sv.github.io"
];

const io = new Server(httpServer, {
    cors: {
        origin: [...origins]
    }
});

module.exports = {
    app,
    httpServer,
    io
};