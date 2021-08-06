const mongoose = require("mongoose");

mongoose.connect("mongodb+srv://sarthak55k:Sarthak@123@cluster0.xfgss.mongodb.net/dataquest?retryWrites=true&w=majority", {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true
});