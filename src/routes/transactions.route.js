// packages
const router = require('express').Router();

// custom
const client = require("../utils/single-store.util.js");
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
        VALUES (now(6), ?, ?, ?);
        `;
        const VALUE = [orgName, empEmail, amount];
        client.execute(QUERY, VALUE);
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
        FROM transactions WHERE organisation = ?`;
        let VALUE = [orgName];
        if (recipient?.length > 0) {
            QUERY += " AND recipient = ?";
            VALUE.push(recipient);
        }
        if (page?.length > 0 && !recipient?.length) {
            QUERY += " AND id < ?";
            VALUE.push(page);
        }
        QUERY += " ORDER BY id DESC LIMIT 10;"
        client.execute(QUERY, VALUE, (err, rows) => {
            if (err) throw err;
            return res.status(200).json({transactions: rows, pageState: rows.slice(-1)[0].id});
        });
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
        client.execute(QUERY, VALUE, (err, trnxs) => {
            if (err) throw err;
            const transactions = trnxs[0].count;
            QUERY = `
            SELECT sum(amount) AS count FROM transactions WHERE organisation = ?;
            `;
            VALUE = [orgName];
            client.execute(QUERY, VALUE, (err1, totals) => {
                if (err1) throw err1;
                const total = totals[0].count;
                const todayDate = getDate(new Date());
                QUERY = `
                SELECT sum(amount) AS count FROM transactions 
                WHERE organisation = ? AND id > maxTimeuuid(?);
                `;
                VALUE = [orgName, todayDate];
                client.execute(QUERY, VALUE, (err2, todays) => {
                    if (err2) throw err2;
                    const today = todays[0].count;
                    const tenDaysAgoDate = getDate(new Date(Date.now() - 864000000));
                    VALUE = [orgName, tenDaysAgoDate];
                    client.execute(QUERY, VALUE, (err3, multiDays) => {
                        if (err3) throw err3;
                        const tenDays = multiDays[0].count;
                        return res.status(200).json({today, total, transactions, tenDays});
                    });
                });
            });
        });
    } catch (err) {
        return res.status(500).json(err);
    }
});

module.exports = router;