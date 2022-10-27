const morganConfig = (tokens, req, res) => {
    return "[SERVER] " + [
        tokens.method(req, res),
        tokens.url(req, res),
        tokens.status(req, res),
        tokens['response-time'](req, res), 'ms'
    ].join(' ');
};

module.exports = morganConfig;
