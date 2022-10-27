// packages
const mysql = require("mysql2");

// custom
const clientConfig = require("../configs/db.config");

const singleStoreClient = mysql.createConnection(clientConfig);

singleStoreClient.connect(err => {
  if (err) {
    console.log("[SERVER] ERROR -", err);
    process.exit(1);
  } else {
    console.log("[SERVER] Connected to SingleStore"); 
  }
});

module.exports = singleStoreClient;
