// packages
const router = require('express').Router();
const bcrypt = require("bcrypt");

// custom
const client = require("../utils/single-store.util.js");

// creating new organisation
router.post(`/create`, async (req, res) => {
    try {
        const {orgName, creator, email, password} = req.body;
        
        // checking if organisation name already taken
        let QUERY = `SELECT id FROM organisations WHERE name = ?;`;
        let VALUES = [orgName];
        const {rowLength} = await client.execute(QUERY, VALUES);
        if (rowLength) return res.status(400).json("Organisation name taken");

        // hashing password
        const salt = await bcrypt.genSalt(+process.env.SALT);
        const hashedPassword = await bcrypt.hash(password, salt);

        // inserting the record
        QUERY = `
          INSERT INTO organisations 
          (name, creator_name, email, id, password_hash, profile_picture, status)
          VALUES (?, ?, ?, now(6), ?, '', 0);
        `;
        VALUES = [orgName, creator, email, hashedPassword];
        await client.execute(QUERY, VALUES);
        return res.status(200).json("Account created successfully");
    } catch (err) {
        console.log(err);
        return res.status(500).json("Error while creating account");
    }
});

// little info about organisation
router.post(`/tiny-info`, async (req, res) => {
    try {
        const {orgName} = req.body;
        const QUERY = `
        SELECT creator_name, email, profile_picture FROM organisations
        WHERE name = ?;
        `;
        const VALUES = [orgName];
        const {rows} = await client.execute(QUERY, VALUES);
        if (!rows[0]) return res.status(400).json("Not found");
        const responseBody = {
          name: rows[0].creator_name,
          email: rows[0].email,
          profilePicture: rows[0].profile_picture
        };
        return res.status(200).json(responseBody);
    } catch (err) {
        console.log(err);
        return res.status(500).json(err);
    }
});

// update info about user
router.put(`/update`, async (req, res) => {
    try {
        const {
          orgName,
          name: creator_name, 
          email, 
          imageUrl: profile_picture,
          password
        } = req.body;
        const QUERY = `
        UPDATE organisations SET 
        creator_name = ?, email = ?, profile_picture = ?
        WHERE name = ?;
        `;
        const VALUES = [creator_name, email, profile_picture, orgName];
        await client.execute(QUERY, VALUES);
        if (password?.length > 0) {
            const salt = await bcrypt.genSalt(+process.env.SALT);
            const hashedPassword = await bcrypt.hash(password, salt);
            const QUERY1 = `UPDATE organisations SET password_hash = ? WHERE name = ?;`;
            const VALUES1 = [hashedPassword, orgName];
            await client.execute(QUERY1, VALUES1);
        }
        return res.status(200).json("OK");
    } catch (err) {
        return res.status(500).json(err);
    }
});

// info about organisation
router.post(`/info`, async (req, res) => {
    try {
        const {oid} = req.body;
        const QUERY = `SELECT creator_name, email, status, profile_picture FROM organisations WHERE id = ?;`;
        const VALUES = [oid];
        const {rows, rowLength} = await client.execute(QUERY, VALUES);
        if (!rowLength) return res.status(400).json("Not found");
        return res.status(200).json(rows[0]);
    } catch (err) {
        return res.status(500).json(err);
    }
});

// set organisation status
router.put(`/set-status`, async (req, res) => {
    try {
        const {status, orgName} = req.body;
        const QUERY = `UPDATE organisations SET status = ? WHERE name = ?;`;
        const VALUES = [status, orgName];
        await client.execute(QUERY, VALUES, {prepare: true});
        return res.status(200).json("Updated successfully");
    } catch (err) {
        return res.status(500).json(err);
    }
});

// check if organisation exits
router.post(`/check`, async (req, res) => {
    try {
        const {orgName} = req.body;
        const QUERY = `SELECT id FROM organisations WHERE name = ?;`;
        const VALUE = [orgName];
        const {rowLength} = await client.execute(QUERY, VALUE);
        return res.status(200).json({found: rowLength != 0});
    } catch (err) {
        return res.status(500).json(err);
    }
});

// get employee
router.post(`/employee`, async (req, res) => {
    try {
        const {orgName, page, keyword} = req.body;
        const {joined} = req.query;
        let QUERY = `
        SELECT id FROM employee 
        WHERE organisation = ? AND joined = ?;`;
        let VALUE = [orgName, joined === 'true'];
        if (keyword?.length > 0) {
            let allResources = [];
            const VALUES = [orgName, joined === 'true', keyword];
            const QUERY1 = `
            SELECT id FROM employee WHERE organisation = ? 
            AND joined = ? AND name = ?;`;
            const {rows: r1} = await client.execute(QUERY1, VALUES);
            allResources = allResources.concat(r1);
            const QUERY2 = `
            SELECT id FROM employee WHERE organisation = ? 
            AND joined = ? AND email = ?;`;
            const {rows: r2} = await client.execute(QUERY2, VALUES);
            allResources = allResources.concat(r2);
            const QUERY3 = `
            SELECT id FROM employee WHERE organisation = ? 
            AND joined = ? AND role = ?;`;
            const {rows: r3} = await client.execute(QUERY3, VALUES);
            allResources = allResources.concat(r3);
            return res.status(200).json({ resource: allResources, pageState: null });
        }
        const queryOptions = {
          prepare: true,
          fetchSize: 7
        };
        if (page?.length > 0) queryOptions.pageState = page;
        const {rows, pageState} = await client.execute(QUERY, VALUE, {...queryOptions});
        return res.status(200).json({ resource: rows, pageState });
    } catch (err) {
        return res.status(500).json(err);
    }
});

// resource overview
router.post(`/resource-overview`, async (req, res) => {
    try {
        const {id} = req.body;
        const QUERY = `
        SELECT skills, projects, joined, email, request, leaves, role
        FROM employee WHERE id = ?;
        `;
        const VALUE = [id];
        const {rows} = await client.execute(QUERY, VALUE);
        return res.status(200).json(rows[0]||{});
    } catch (err) {
        return res.status(500).json(err);
    }
});

// hire resource
router.put(`/hire`, async (req, res) => {
    try {
        const {orgName, email} = req.body;
        const QUERY = `
        UPDATE employee SET joined = true
        WHERE organisation = ? AND email = ?;
        `;
        const VALUE = [orgName, email];
        await client.execute(QUERY, VALUE);
        return res.status(200).json("Resource hired");
    } catch (err) {
        return res.status(500).json(err);
    }
});

// deny resource
router.put(`/deny`, async (req, res) => {
    try {
        const {orgName, email} = req.body;
        const query = `
        DELETE FROM employee
        WHERE organisation = ? AND email = ?;
        `;
        const params = [orgName, email];
        await client.batch([{query, params}], {prepare: true});
        return res.status(200).json("Resource denied");
    } catch (err) {
        return res.status(500).json(err);
    }
});

// accept leave
router.put(`/accept-leave`, async (req, res) => {
    try {
        const {email, orgName, leaves} = req.body;
        const QUERY = `
        UPDATE employee SET leaves = ?, request = false
        WHERE organisation = ? AND email = ?;
        `;
        const VALUE = [leaves, orgName, email];
        await client.execute(QUERY, VALUE, {prepare: true});
        return res.status(200).json("Leave accepted");
    } catch (err) {
        return res.status(500).json(err);
    }
});

// simple profile info for organisation and employee
router.post(`/comm-info`, async (req, res) => {
    try {
        const {id} = req.body;
        const resBody = {
          name: '-------',
          status: 0,
          email: '-------',
          role: '-------',
          image: ''
        };
        // checking in organisation
        let QUERY = `
        SELECT creator_name, status, email, profile_picture
        FROM organisations WHERE id = ?;
        `;
        let VALUE = [id];
        let {rows: orgs, rowLength} = await client.execute(QUERY, VALUE);
        if (rowLength > 0) {
            resBody.name = orgs[0].creator_name;
            resBody.status = orgs[0].status;
            resBody.email = orgs[0].email;
            resBody.role = "Organisation Manager";
            resBody.image = orgs[0].profile_picture;
            return res.status(200).json(resBody);
        }
        // checking in employee
        QUERY = `
        SELECT name, status, email, profile_picture, role
        FROM employee WHERE id = ?;
        `;
        VALUE = [id];
        let {rows: emps} = await client.execute(QUERY, VALUE);
        if (emps?.length > 0) {
            resBody.name = emps[0].name;
            resBody.status = emps[0].status;
            resBody.email = emps[0].email;
            resBody.role = emps[0].role;
            resBody.image = emps[0].profile_picture;
        }
        return res.status(200).json(resBody);
    } catch (err) {
        return res.status(500).json(err);
    }
});

// find id by organisation name
router.post(`/get-id`, async (req, res) => {
  try {
      const {orgName} = req.body;
      const QUERY = `SELECT id FROM organisations WHERE name = ?;`;
      const VALUE = [orgName];
      const {rows} = await client.execute(QUERY, VALUE);
      return res.status(200).json(rows[0]);
  } catch (err) {
      return res.status(500).json(err);
  }
});

module.exports = router;