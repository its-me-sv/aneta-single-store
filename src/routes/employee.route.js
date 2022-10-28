// packages
const router = require('express').Router();
const bcrypt = require("bcrypt");

// custom
const client = require("../utils/single-store.util.js");

// creating new employee
router.post(`/create`, async (req, res) => {
    try {
        const { orgName, name, email, role, password } = req.body;
        
        // checking if email already taken
        let QUERY = `
        SELECT id FROM employee 
        WHERE organisation = ? AND email = ?;
        `;
        let VALUES = [orgName, email];
        const { rowLength } = await client.execute(QUERY, VALUES);
        if (rowLength) return res.status(400).json("Email taken");

        // hashing password
        const salt = await bcrypt.genSalt(+process.env.SALT);
        const hashedPassword = await bcrypt.hash(password, salt);

        // inserting the record
        QUERY = `
        INSERT INTO employee 
        (organisation, name, email, role, password_hash, id, joined, leaves, request, status, profile_picture)
        VALUES (?, ?, ?, ?, ?, now(6), false, 0, false, 0, '');
        `;
        VALUES = [orgName, name, email, role, hashedPassword];
        await client.execute(QUERY, VALUES);
        return res.status(200).json("Account created successfully");
    } catch (err) {
        console.log(err);
        return res.status(500).json("Error while creating account");
    }
});

// info about user
router.post(`/info`, async (req, res) => {
    try {
        const {id} = req.body;
        const QUERY = `
        SELECT profile_picture, status, email, name, role
        FROM employee WHERE id = ?;
        `;
        const VALUE = [id];
        const {rows} = await client.execute(QUERY, VALUE);
        if (!rows[0]) return res.status(400).json("Not found");
        return res.status(200).json(rows[0]);
    } catch (err) {
        return res.status(500).json(err);
    }
});

// find leaves
router.post(`/leaves`, async (req, res) => {
    try {
        const {id} = req.body;
        const QUERY = `SELECT leaves FROM employee WHERE id = ?;`;
        const VALUE = [id];
        const {rows} = await client.execute(QUERY, VALUE);
        if (!rows[0]) return res.status(400).json("Not Found");
        return res.status(200).json(rows[0]);
    } catch (err) {
        return res.status(500).json(err);
    }
});

// tiny info about employee
router.post(`/tiny-info`, async (req, res) => {
    try {
        const {id} = req.body;
        const QUERY = `
        SELECT profile_picture, name
        FROM employee WHERE id = ?;
        `;
        const VALUE = [id];
        const { rows } = await client.execute(QUERY, VALUE);
        if (!rows[0]) return res.status(400).json("Not found");
        return res.status(200).json(rows[0]);
    } catch (err) {
        return res.status(500).json(err);
    }
});

// update employee
router.put(`/update`, async (req, res) => {
    try {
        const {name, imageUrl, password, orgName, email} = req.body;
        const QUERY = `
        UPDATE employee SET name = ?, profile_picture = ?
        WHERE organisation = ? AND email = ?;
        `;
        const VALUE = [name, imageUrl, orgName, email];
        await client.execute(QUERY, VALUE);
        if (password?.length > 0) {
            const salt = await bcrypt.genSalt(+process.env.SALT);
            const hashedPassword = await bcrypt.hash(password, salt);
            const QUERY1 = `UPDATE employee SET password_hash = ? 
            WHERE organisation = ? AND email = ?;`;
            const VALUES1 = [hashedPassword, orgName, email];
            await client.execute(QUERY1, VALUES1);
        }
        return res.status(200).json("OK");
    } catch (err) {
        console.log(err);
        return res.status(500).json(err);
    }
});

// get employee skill
router.post(`/skills`, async (req, res) => {
    try {
        const {id} = req.body;
        const QUERY = `SELECT skills FROM employee WHERE id = ?;`;
        const VALUE = [id];
        const {rows} = await client.execute(QUERY, VALUE);
        return res.status(200).json(rows[0]||{});
    } catch (err) {
      return res.status(500).json(err);
    }
});

// add skill
router.put(`/add-skill`, async (req, res) => {
    try {
        const {email, orgName, skill} = req.body;
        const QUERY = `
        UPDATE employee SET skills = skills + ?
        WHERE organisation = ? AND email = ?;`;
        const VALUE = [[skill], orgName, email];
        await client.execute(QUERY, VALUE, {prepare: true});
        return res.status(200).json("Skill added");
    } catch (err) {
        console.log(err);
        return res.status(500).json(err);
    }
});

// remove skill
router.put(`/remove-skill`, async (req, res) => {
    try {
        const {email, orgName, skill} = req.body;
        const QUERY = `
        UPDATE employee SET skills = skills - ?
        WHERE organisation = ? AND email = ?;`;
        const VALUE = [[skill], orgName, email];
        await client.execute(QUERY, VALUE, {prepare: true});
        return res.status(200).json("Skill removed");
    } catch (err) {
        console.log(err);
        return res.status(500).json(err);
    }
});

// get employee projects
router.post(`/projects`, async (req, res) => {
    try {
      const { id } = req.body;
      const QUERY = `SELECT projects FROM employee WHERE id = ?;`;
      const VALUE = [id];
      const { rows } = await client.execute(QUERY, VALUE);
      return res.status(200).json(rows[0] || {});
    } catch (err) {
      return res.status(500).json(err);
    }
});

// add project
router.put(`/add-project`, async (req, res) => {
    try {
        const {id, orgName, project} = req.body;
        const QUERY = `
        UPDATE employee SET project = project + ?
        WHERE organisation = ? IF id = ?;`;
        const VALUE = [[project], orgName, id];
        await client.execute(QUERY, VALUE, {prepare: true});
        return res.status(200).json("Project added");
    } catch (err) {
        console.log(err);
        return res.status(500).json(err);
    }
});

// remove project
router.put(`/remove-project`, async (req, res) => {
    try {
        const { id, orgName, project } = req.body;
        const QUERY = `
        UPDATE employee SET project = project - ?
        WHERE organisation = ? IF id = ?;`;
        const VALUE = [[project], orgName, id];
        await client.execute(QUERY, VALUE, { prepare: true });
        return res.status(200).json("Project removed");
    } catch (err) {
        console.log(err);
        return res.status(500).json(err);
    }
});

// get status and request
router.post(`/stat-req`, async (req, res) => {
    try {
        const {id} = req.body;
        const QUERY = `
        SELECT request, status FROM employee
        WHERE id = ?;
        `;
        const VALUE = [id];
        const {rows} = await client.execute(QUERY, VALUE);
        return res.status(200).json(rows[0]||{});
    } catch (err) {
        return res.status(500).json(err);
    }
});

// update status
router.put(`/set-status`, async (req, res) => {
    try {
        const {orgName, status, email} = req.body;
        const QUERY = `
        UPDATE employee SET status = ?
        WHERE organisation = ? AND email = ?;
        `;
        const VALUE = [status, orgName, email];
        await client.execute(QUERY, VALUE, {prepare: true});
        return res.status(200).json("Status updated");
    } catch (err) {
        return res.status(500).json(err);
    }
});

// get joined status
router.post(`/joined`, async (req, res) => {
    try {
        const {id} = req.body;
        const QUERY = `SELECT joined FROM employee WHERE id = ?;`;
        const VALUE = [id];
        const {rows} = await client.execute(QUERY, VALUE);
        return res.status(200).json(rows[0]||{});
    } catch (err) {
        return res.status(500).json(err);
    }
});

// get for resource status
router.post(`/for-resource`, async (req, res) => {
    try {
        const {id} = req.body;
        const QUERY = `
        SELECT name, role, request FROM employee
        WHERE id = ?;
        `;
        const VALUE = [id];
        const {rows} = await client.execute(QUERY, VALUE);
        return res.status(200).json(rows[0]||{});
    } catch (err) {
        return res.status(500).json(err);
    }
});

// request leave
router.put(`/leave-request`, async (req, res) => {
    try {
        const {orgName, email} = req.body;
        const QUERY = `
        UPDATE employee SET request = true
        WHERE organisation = ? AND email = ?;
        `;
        const VALUE = [orgName, email];
        await client.execute(QUERY, VALUE);
        return res.status(200).json("Leave requested");
    } catch (err) {
        return res.status(500).json(err);
    }
});

// employee stats for dashoboard
router.post(`/stats`, async (req, res) => {
    try {
        const {orgName} = req.body;
        let roles = ['Developer', 'Tester', 'Support', 'Project Manager'];
        let resBody = {};
        let QUERY, VALUE, result;
        for (let role of roles) {
            QUERY = `
            SELECT count(id) AS count FROM employee 
            WHERE organisation = ? AND role = ? AND joined = true;
            `;
            VALUE = [orgName, role];
            result = (await client.execute(QUERY, VALUE)).rows[0].count;
            resBody[role] = result;
        }
        QUERY = `
        SELECT count(id) AS count FROM employee 
        WHERE organisation = ? AND joined = false;
        `;
        VALUE = [orgName];
        result = (await client.execute(QUERY, VALUE)).rows[0].count;
        resBody["Candidates"] = result;
        return res.status(200).json(resBody);
    } catch (err) {
        return res.status(500).json(err);
    }
});

module.exports = router;
