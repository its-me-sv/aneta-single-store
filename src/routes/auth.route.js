// packages
const router = require("express").Router();
const bcrypt = require("bcrypt");

// custom
const client = require("../utils/single-store.util");
const { 
    isUserLoggedIn, 
    generateAccessToken, 
    generateRefreshToken, 
    removeUser
} = require("../utils/jwt.util");

// logging in organisation head
router.post("/org-login", async (req, res) => {
    try {
        const { orgName, password } = req.body;

        const QUERY1 = `
        SELECT id, password_hash, name FROM organisations
        WHERE name = ?
        `;
        const VALUES1 = [orgName];

        client.execute(QUERY1, VALUES1, async (err, rows) => {
            if (err) throw err;
            if (rows.length < 1)
                return res.status(400).json("Account not found");
            const user = rows[0];
            const isValid = await bcrypt.compare(password, user.password_hash);
            if (!isValid)
                return res.status(400).json("Invalid login credentials");
            if (await isUserLoggedIn(user.id))
                return res.status(400).json("Already logged in");
            const QUERY = `UPDATE organisations SET status = ? WHERE name = ?;`;
            const VALUES = [2, orgName];
            client.execute(QUERY, VALUES);
            const sessionToken = await generateAccessToken(user.id);
            return res.status(200).json({
                id: user.id,
                token: sessionToken,
                orgName: user.name
            });
        });
    } catch (err) {
        return res.status(500).json(err);
    }
});

// logging in employee
router.post("/emp-login", async (req, res) => {
    try {
        const {orgName, email, password} = req.body;

        let QUERY = `
        SELECT id, password_hash FROM employee
        WHERE organisation = ? AND email = ?;
        `;
        let VALUES = [orgName, email];

        client.execute(QUERY, VALUES, async (err, rows) => {
            if (err) throw err;
            if (rows.length < 1)
                return res.status(400).json("Account not found");
            const user = rows[0];
            const isValid = await bcrypt.compare(password, user.password_hash);
            if (!isValid)
                return res.status(400).json("Invalid login credentials");
            if (await isUserLoggedIn(user.id))
                return res.status(400).json("Already logged in");
            QUERY = `
            UPDATE employee SET status = ? 
            WHERE organisation = ? AND email = ?;`;
            VALUES = [2, orgName, email];
            client.execute(QUERY, VALUES);
    
            const sessionToken = await generateAccessToken(user.id);
            return res.status(200).json({
                id: user.id,
                token: sessionToken,
                orgName,
                email
            });
        });
    } catch (err) {
        console.log(err);
        return res.status(500).json(err);
    }
});

// generating refresh token
router.post("/refresh", async (req, res) => {
    try {
        const token = await generateRefreshToken(req.userId);
        if (!token)
            return res.status(400).json("Cannot refresh token");
        return res.status(200).json({ token });
    } catch (err) {
        console.log(err);
        return res.status(500).json(err);
    }
});

// logging out user
router.delete("/logout", async (req, res) => {
    const { userId } = req;
    try {
        const isLogged = await isUserLoggedIn(userId);
        if (!isLogged)
            return res.status(400).json("Not logged in");
        await removeUser(userId);
        return res.status(200).json("Logged out successfully");
    } catch (err) {
        console.log(err);
        return res.status(500).json(err);
    }
});

module.exports = router;
