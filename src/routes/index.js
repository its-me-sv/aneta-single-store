// custom
const validationRoute = require('./validation.route');
const authRoute = require('./auth.route');
const organisationRoute = require('./organisations.route');
const employeeRoute = require('./employee.route');
const transactionsRoute = require('./transactions.route');
const projectsRoute = require('./projects.route');
const messagesRoute = require('./messages.route');

// combining all custom routes
const combineRoutes = app => {
    app.use("/api/validation", validationRoute);
    app.use("/api/auth", authRoute);
    app.use("/api/organisation", organisationRoute);
    app.use("/api/employee", employeeRoute);
    app.use("/api/transactions", transactionsRoute);
    app.use("/api/projects", projectsRoute);
    app.use("/api/messages", messagesRoute);
};

module.exports = combineRoutes;
