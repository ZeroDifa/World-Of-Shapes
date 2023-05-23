const config = require("../config/config");
const jwt = require('jsonwebtoken')

function getCookie(cookieName, headers) {
    const cookies = headers.cookie;
    if (cookies) {
        const cookieList = cookies.split('; ');
        for (let i = 0; i < cookieList.length; i++) {
            const cookie = cookieList[i].split('=');
            const name = cookie[0];
            const value = cookie[1];
            if (name === cookieName) {
                return decodeURIComponent(value);
            }
        }
    }
    return null;
}
exports.getCookie = getCookie;

exports.verifyUserToken = (req, res, next) => {
    const token = getCookie('jwt', req.headers);
    if (token == null) return res.status(401).send({ error: "Access Denied / Unauthorized request" });

    try {
        if (token === undefined || !token) return res.status(401).send({ error: 'Unauthorized request' });

        let verifiedUser = jwt.verify(token, config.TOKEN_SECRET);
        if (!verifiedUser) return res.status(401).send({ error: 'Unauthorized request' })

        next();
    } catch (error) {
        res.status(400).send({ error: "Invalid Token" });
    }

}