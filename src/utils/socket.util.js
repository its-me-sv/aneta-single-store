// custom
const client = require("./single-store.util");
const {removeUser} = require("./jwt.util");

// add to sockets table
const registerSocket = async (userId, socketId) => {
    const QUERY = `INSERT INTO sockets(id, socket_id) VALUES (?, ?);`;
    const VALUES = [userId, socketId];
    try {
        client.execute(QUERY, VALUES);
    } catch (err) {
        console.log(err);
    }
};

// remove from sockets table
const unRegisterSocket = async (socketId) => {
    const QUERY = `SELECT id FROM sockets WHERE socket_id = ?;`;
    const VALUES = [socketId];
    try {
        const { _rows: rows } = client.execute(QUERY, VALUES);
        const rowLength = rows.length;
        if (!rowLength) return;
        const id = String(rows[0].id);
        if (!id || !id.length) return;
        const QUERY1 = `DELETE FROM sockets WHERE id = ?;`;
        const VALUES1 = [id];
        client.execute(QUERY1, VALUES1);
        removeUser(id);
    } catch (err) {
        console.log(err);
    }
};

// handling sockets
const socketHandler = io => {
    // user logs in
    io.on("connection", socket => {
        console.log(`[SERVER] ${socket.id} Connected`);
        const userId = socket?.handshake?.query?.userId;
        if (userId && userId.length > 0) 
          registerSocket(userId, socket.id);
        // user leaves tab or logs out
        socket.on("disconnect", () => {
            console.log(`[SERVER] ${socket.id} Disconnected`);
            unRegisterSocket(socket.id);
        });
        // user joins the specific room
        socket.on("joinRoom", roomId => {
            socket.join(roomId);
            console.log(`[SERVER] ${socket.id} joined ${roomId}`);
        });
        // user leaves the specific room
        socket.on("leaveRoom", roomId => {
            socket.leave(roomId);
            console.log(`[SERVER] ${socket.id} left ${roomId}`);
        });
        // user creates account in organisation
        socket.on("createAcc", roomId => {
            socket.broadcast.to(roomId).emit("createAcc");
            console.log(`[SERVER] ${socket.id} notifies ${roomId}`);
        });
        // user puts message
        socket.on("newMsg", ({roomId, msgObj}) => {
            socket.broadcast.to(roomId).emit("newMsg", msgObj);
            console.log(`[SERVER] ${socket.id} messages ${roomId}`);
        });
    });
};

module.exports = socketHandler;
