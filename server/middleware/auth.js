const config = require("../config/config");
const jwt = require('jsonwebtoken')

exports.verifyUserToken = (req, res, next) => {
    let token = req.headers.authorization;
    if (!token) return res.status(401).send({error: "Access Denied / Unauthorized request"});

    try {
        token = token.split(' ')[1]

        if (token === undefined || !token) return res.status(401).send({error: 'Unauthorized request'});

        let verifiedUser = jwt.verify(token, config.TOKEN_SECRET); 
        if (!verifiedUser) return res.status(401).send({error: 'Unauthorized request'})

        next();
    } catch (error) {
        res.status(400).send({error: "Invalid Token"});
    }

}