// packages
const router = require('express').Router();
const timeuuid = require('cassandra-driver').types.TimeUuid;

// custom
const client = require("../utils/astra-db.util");

// new message
router.post(`/new`, async (req, res) => {
    try {
        const {sender, reciever, orgName, msg} = req.body;
        const chatId = [sender, reciever].sort().join('');
        const msgId = timeuuid.now();
        const QUERY = `
        INSERT INTO messages (organisation, chat_id, id, message, sender)
        VALUES (?, ?, now(), ?, ?);
        `;
        const VALUE = [orgName, chatId, msg, sender];
        await client.execute(QUERY, VALUE);
        const resBody = {id: msgId, message: msg, sender};
        return res.status(200).json(resBody);
    } catch (err) {
        return res.status(500).json(err);
    }
});

// fetch messages
router.post(`/fetch`, async (req, res) => {
    try {
        const {sender, reciever, orgName, page} = req.body;
        const chatId = [sender, reciever].sort().join('');
        const QUERY = `
        SELECT id, message, sender FROM messages 
        WHERE organisation = ? AND chat_id = ?;`;
        const VALUE = [orgName, chatId];
        const queryOptions = {
          prepare: true,
          fetchSize: 10
        };
        if (page?.length > 0) queryOptions.pageState = page;
        const {rows, pageState} = await client.execute(QUERY, VALUE, {...queryOptions});
        return res.status(200).json({messages: rows.reverse(), pageState});
    } catch (err) {
        return res.status(500).json(err);
    }
});

module.exports = router;
