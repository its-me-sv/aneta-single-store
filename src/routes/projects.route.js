// packages
const router = require('express').Router();

// custom
const client = require("../utils/single-store.util.js");

// create new project
router.post(`/create`, async (req, res) => {
    try {
        const {orgName, projName, projDesc} = req.body;
        // checking if already exists
        let QUERY = `
        SELECT id FROM projects 
        WHERE organisation = ? AND name = ?;
        `;
        let VALUE = [orgName, projName];
        client.execute(QUERY, VALUE, (err, rows) => {
            if (err) throw err;
            const rowLength = rows.length;
            if (rowLength > 0) return res.status(400).json("Name already used");
            QUERY = `
            INSERT INTO projects (organisation, name, description, id, status)
            VALUES (?, ?, ?, now(6), 1);
            `;
            VALUE = [orgName, projName, projDesc];
            client.execute(QUERY, VALUE, (err1) => {
                if (err1) throw err1;
                return res.status(200).json("Project created successfully");
            });
        });
    } catch (err) {
        return res.status(500).json(err);
    }
});

// fetch projects
router.post(`/fetch`, async (req, res) => {
    try {
        const {orgName, page} = req.body;
        const {status} = req.query;
        let QUERY = `
        SELECT id, name, description FROM projects
        WHERE organisation = ? AND status = ?
        `;
        let VALUE = [orgName, +status];
        if (page?.length > 0) {
            QUERY += " AND id < ?";
            VALUE.push(page);
        }
        QUERY += " ORDER BY id DESC LIMIT 4;";
        client.execute(QUERY, VALUE, (err, rows) => {
            if (err) throw err;
            return res.status(200).json({projects: rows, pageState: rows.slice(-1)[0].id});
        });
    } catch (err) {
        return res.status(500).json(err);
    }
});

// find project id by name
router.post(`/find`, async (req, res) => {
    try {
        const {orgName, projName} = req.body;
        const QUERY = `
        SELECT id FROM projects
        WHERE organisation = ? AND name = ?;
        `;
        const VALUE = [orgName, projName];
        client.execute(QUERY, VALUE, (err, rows) => {
            if (err) throw err;
            const rowLength = rows.length;
            if (rowLength < 1) return res.status(400).json("Couldn't find project");
            return res.status(200).json(rows[0]);
        });
    } catch (err) {
        return res.status(500).json(err);
    }
});

// project overview with id
router.post(`/overview`, async (req, res) => {
    try {
        const {id} = req.body;
        const QUERY = `
        SELECT name, description, status, resources
        FROM projects WHERE id = ?;`;
        const VALUE = [id];
        client.execute(QUERY, VALUE, (err, rows) => {
            if (err) throw err;
            const rowLength = rows.length;
            if (!rowLength) return res.status(400).json("Not found");
            return res.status(200).json(rows[0]||{});
        });
    } catch (err) {
        return res.status(500).json(err);
    }
});

// update status
router.put(`/set-status`, async (req, res) => {
    try {
        const {orgName, projName, status} = req.body;
        const QUERY = `
        UPDATE projects SET status = ?
        WHERE organisation = ? AND name = ?;
        `;
        const VALUE = [status, orgName, projName];
        client.execute(QUERY, VALUE);
        return res.status(200).json("Project Status Updated");
    } catch (err) {
        return res.status(500).json(err);
    }
});

// update description
router.put(`/set-desc`, async (req, res) => {
    try {
        const {orgName, projName, desc} = req.body;
        const QUERY = `
        UPDATE projects SET description = ?
        WHERE organisation = ? AND name = ?;
        `;
        const VALUE = [desc, orgName, projName];
        client.execute(QUERY, VALUE);
        return res.status(200).json("Project Description Updated");
    } catch (err) {
        return res.status(500).json(err);
    }
});

// add employee to project
router.put(`/add-emp`, async (req, res) => {
    try {
        const {orgName, email, projName} = req.body;
        // find emp id
        let QUERY = `
        SELECT id FROM employee
        WHERE organisation = ? AND email = ?;
        `;
        let VALUE = [orgName, email];
        client.execute(QUERY, VALUE, (err, rows) => {
            if (err) throw err;
            const rowLength = rows.length;
            if (!rowLength) throw new Error("Resource not found");
            const empId = String(rows[0].id);
            // fetch project's resources
            QUERY = `
              SELECT resources FROM projects
              WHERE organisation = ? AND name = ?;
            `;
            VALUE = [orgName, projName];
            client.execute(QUERY, VALUE, (err1, projects) => {
                if (err1) throw err;
                let project = projects[0].resources;
                project = {resources: [...project.resources, empId]};
                // add emp id to project's rescources
                QUERY = `
                UPDATE projects SET resources = ?
                WHERE organisation = ? AND name = ?;
                `;
                VALUE = [project, orgName, projName];
                client.execute(QUERY, VALUE);
                // fetch employer's projects
                QUERY = `
                  SELECT projects FROM employee
                  WHERE organisation = ? AND email = ?;
                `;
                VALUE = [orgName, email];
                client.execute(QUERY, VALUE, (err2, empProj) => {
                    if (err2) throw err2;
                    let emp = empProj[0].projects;
                    emp = {projects: [...emp.projects, projName]};
                    // add project name to employer's projects
                    QUERY = `
                    UPDATE employee SET projects = ?
                    WHERE organisation = ? AND email = ?;
                    `;
                    const VALUE = [emp, orgName, email];
                    client.execute(QUERY, VALUE);
                    return res.status(200).json({id: empId});
                });
            });
        });
    } catch (err) {
        return res.status(500).json(err);
    }
});

// remove employee from project
router.put(`/rem-emp`, async (req, res) => {
    try {
        const {orgName, email, projName, empId} = req.body;
        // selecting project resources
        let QUERY = `
        SELECT resources FROM projects
        WHERE organisation = ? AND name = ?;
        `;
        let VALUE = [orgName, projName];
        client.execute(QUERY, VALUE, (err, projects) => {
            if (err) throw err;
            let project = projects[0].resources;
            project = { resources: project.resources.filter(val => val !== empId) };
            // remove emp id from project's rescources
            QUERY = `
            UPDATE projects SET resources = ?
            WHERE organisation = ? AND name = ?;
            `;
            VALUE = [project, orgName, projName];
            client.execute(QUERY, VALUE);
            // selecting employer's projects
            QUERY = `
            SELECT projects FROM employee
            WHERE organisation = ? AND email = ?;
            `;
            VALUE = [orgName, email];
            client.execute(QUERY, VALUE, (err1, empProj) => {
                if (err1) throw err1;
                let emp = empProj[0].projects;
                emp = { projects: emp.projects.filter(val => val !== projName) };
                // remove project name from employer's projects
                QUERY = `
                UPDATE employee SET projects = ?
                WHERE organisation = ? AND email = ?;
                `;
                VALUE = [emp, orgName, email];
                client.execute(QUERY, VALUE);
                return res.status(200).json("Resource removed successfully");
            });
        });
    } catch (err) {
        return res.status(500).json(err);
    }
});

// projects stats for dashoboard
router.post(`/stats`, async (req, res) => {
    try {
        const {orgName} = req.body;
        let stats = ['Stalled', 'Active', 'Completed'];
        let resBody = {};
        let QUERY, VALUE;
        for (let status in stats) {
            QUERY = `
            SELECT count(id) as count FROM projects 
            WHERE organisation = ? AND status = ?;
            `;
            VALUE = [orgName, status];
            client.execute(QUERY, VALUE, (err, rows) => {
                if (err) throw err;
                resBody[stats[status]] = rows[0].count;
            });
        }
        return res.status(200).json(resBody);
    } catch (err) {
        return res.status(500).json(err);
    }
});

module.exports = router;
