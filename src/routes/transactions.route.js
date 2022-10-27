// packages
const router = require('express').Router();

// custom
const client = require("../utils/astra-db.util");
const getDate = require("../utils/get-date.util");

// payroles
const salary = {
  "Developer": 8146.9167,
  "Tester": 4045.67,
  "Support": 5520,
  "Project Manager": 9666.67
};

// make new transaction
router.post(`/new`, async (req, res) => {
    try {
        const {orgName, empEmail, role} = req.body;
        const amount = salary[role];
        const QUERY = `
        INSERT INTO transactions (id, organisation, recipient, amount)
        VALUES (now(), ?, ?, ?);
        `;
        const VALUE = [orgName, empEmail, amount];
        await client.execute(QUERY, VALUE, {prepare: true});
        return res.status(200).json("Transaction made successfully");
    } catch (err) {
        return res.status(500).json(err);
    }
});

// get transactions
router.post(`/fetch`, async (req, res) => {
    try {
        const {orgName, page, recipient} = req.body;
        let QUERY = `
        SELECT id, amount, recipient 
        FROM transactions WHERE organisation = ?;`;
        let VALUE = [orgName];
        if (recipient?.length > 0) {
            QUERY = `
            SELECT id, amount, recipient FROM transactions 
            WHERE organisation = ? AND recipient = ?;`;
            VALUE = [orgName, recipient];
        }
        const queryOptions = {
            prepare: true,
            fetchSize: 10
        };
        if (page?.length > 0) queryOptions.pageState = page;
        if (recipient?.length > 0) {
            delete queryOptions.pageState;
            delete queryOptions.fetchSize;
        }
        const {rows, pageState} = await client.execute(QUERY, VALUE, {...queryOptions});
        return res.status(200).json({transactions: rows, pageState});
    } catch (err) {
        return res.status(500).json(err);
    }
});

// financial stats for dashboard
router.post(`/stats`, async (req, res) => {
    try {
        const {orgName} = req.body;
        let QUERY = `
        SELECT count(id) AS count FROM transactions WHERE organisation = ?;
        `;
        let VALUE = [orgName];
        const transactions = (await client.execute(QUERY, VALUE)).rows[0].count;
        QUERY = `
        SELECT sum(amount) AS count FROM transactions WHERE organisation = ?;
        `;
        VALUE = [orgName];
        const total = (await client.execute(QUERY, VALUE)).rows[0].count;
        const todayDate = getDate(new Date());
        QUERY = `
        SELECT sum(amount) AS count FROM transactions 
        WHERE organisation = ? AND id > maxTimeuuid(?);
        `;
        VALUE = [orgName, todayDate];
        const today = (await client.execute(QUERY, VALUE, {prepare: true})).rows[0].count;
        const tenDaysAgoDate = getDate(new Date(Date.now() - 864000000));
        VALUE = [orgName, tenDaysAgoDate];
        const tenDays = (await client.execute(QUERY, VALUE, {prepare: true})).rows[0].count;
        return res.status(200).json({today, total, transactions, tenDays});
    } catch (err) {
        return res.status(500).json(err);
    }
});

module.exports = router;