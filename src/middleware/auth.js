const jwt = require("jsonwebtoken");
const User = require("../models/User");

const auth = async(req, res, next) => {
    try {
        const token = req.header("Authorization").replace("Bearer ", "");
        const decoded = jwt.verify(token, "DataQuestKey");
        const user = await User.findOne({
            _id: decoded._id,
            "tokens.token": token
        });
        if (!user) {
            throw new Error("AUTHENTICATION FAILED");
        }

        req.token = token;
        req.user = user;
        next();
    } catch (e) {
        res.status(401).send({ error: "AUTHENTICATION REQUIRED" });
    }
};

module.exports = auth;