require("dotenv").config();
const express = require("express");
require("./db/mongoose");
const Endpoints = require("./routers/endpoints");

const app = express();
const port = process.env.PORT || 8001;

app.use(express.json());

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept, Authorization"
    );
    next();
});
app.use(Endpoints);

app.listen(port, async() => {
    console.log("LISTEN TO PORT " + port);
});