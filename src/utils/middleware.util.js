// packages
const morgan = require("morgan");
const express = require("express");
const cors = require("cors");

// custom
const morganConfig = require("../configs/morgan.config");
const {verifyUser} = require("./jwt.util");

// combinig all custom middlewares
const combineMiddlewares = (app) => {
    app.use(cors());
    app.use(verifyUser);
    app.use(morgan(morganConfig));
    app.use(express.json());
};

module.exports = combineMiddlewares;
