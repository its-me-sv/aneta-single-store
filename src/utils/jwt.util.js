// packages
const jwt = require("jsonwebtoken");

// custom
const client = require("./single-store.util");

// endpoints that need not require token
const whitelist = [
    "/api/validation/server",
    "/api/validation/db",
    "/api/organisation/create",
    "/api/auth/org-login",
    "/api/employee/create",
    "/api/auth/emp-login",
    "/api/organisation/check",
];

const isUserLoggedIn = async userId => {
    const {_rows: rows} = client.execute(`SELECT id FROM tokens WHERE id = ?`, [userId]);
    const rowLength = rows.length;
    return rowLength > 0;
};

const loginUser = async (userId, token) => {
    const QUERY = `INSERT INTO tokens (id, tkn) VALUES (?, ?)`;
    const VALUES = [userId, token];
    client.execute(QUERY, VALUES);
};

const removeUser = async userId => {
    try {
        if (!userId || !userId.length) return;
        const QUERY = `DELETE FROM tokens WHERE id = ?`;
        const VALUES = [userId];
        client.execute(QUERY, VALUES);
    } catch (err) {
        console.log(err);
    }
};

const generateAccessToken = async userId => {
    if (await isUserLoggedIn(userId)) return null;

    const token = jwt.sign({ id: userId }, process.env.JWT_SECRET);
    await loginUser(userId, token);
    return token;
};

const generateRefreshToken = async userId => {
    if (!(await isUserLoggedIn(userId))) return null;
    await removeUser(userId);

    const token = jwt.sign({ id: userId }, process.env.JWT_SECRET);
    await loginUser(userId, token);
    return token;
};

const verifyUser = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (whitelist.includes(req.path))
        return next();

    if (!authHeader)
        return res.status(400).json("You are NOT Authenticated");

    const token = authHeader.split(" ")[1];
    try {
        const { id } = jwt.verify(token, process.env.JWT_SECRET);
        const QUERY = `SELECT tkn FROM tokens WHERE id = ?`;
        const VALUES = [id];
        const { _rows: rows } = client.execute(QUERY, VALUES);
        const rowLength = rows.length;
        if (!isUserLoggedIn(id) || !rowLength || rows[0].tkn != token)
            throw new Error("Not valid");
        req.userId = id;
        return next();
    } catch (err) {
        return res.status(400).json("You are NOT Authorized");
    }
};

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    verifyUser,
    isUserLoggedIn,
    removeUser
};