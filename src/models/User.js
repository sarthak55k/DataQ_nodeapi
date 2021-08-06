const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Scores = require('./Scores');

const UserSchema = mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    email: {
        type: String,
        unique: true,
        required: true,
        trim: true,
        lowercase: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error("Email is invalid");
            }
        }
    },
    password: {
        type: String,
        required: true,
        minlength: 7,
        trim: true,
    },
    CurrentLevel: {
        type: Number,
        default: 0,
        validate(value) {
            if (value < 0)
                throw new Error("Level Cannot be negative");
        }
    },
    Submissions: {
        type: Map,
        of: Scores
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }]
});

//USER methods
UserSchema.methods.toJSON = function() {
    const user = this;
    const userObject = user.toObject();

    delete userObject.password;
    delete userObject.tokens;
    delete userObject.Submissions;

    return userObject;
};

UserSchema.methods.generateAuthToken = async function() {
    const user = this;
    const token = jwt.sign({ _id: user._id.toString() }, "DataQuestKey");

    user.tokens = user.tokens.concat({ token });
    await user.save();

    return token;
};

//USER model Methods
UserSchema.statics.findByCredentials = async(email, password) => {
    const user = await User.findOne({ email });
    if (!user) {
        return { code: 1, error: "No Such User in DB" };
    }
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
        throw new Error("Invalid Username-Password");
    }

    return { code: 0, user };
};

//Hash Password Before Saving
UserSchema.pre("save", async function(next) {
    const user = this;

    if (user.isModified("password")) {
        user.password = await bcrypt.hash(user.password, 8);
    }

    next();
});

const User = mongoose.model("User", UserSchema);

module.exports = User;

//HOW TO STORE DATA
// try {
//     const user = new User();
//     user.username = "username";
//     user.email = "demo@final.com";
//     user.password = "password";
//     user.CurrentLevel = 3;

//     const obj1 = {
//         maxScore: 0.7,
//         ScoreList: [
//             { Score: 0.5 },
//             { Score: 0.7 }
//         ]
//     };
//     const obj2 = {
//         maxScore: 0.8,
//         ScoreList: [
//             { Score: 0.5 },
//             { Score: 0.8 },
//             { Score: 0.7 }
//         ]
//     };

//     user.Scores = user.Scores.concat(obj1);
//     user.Scores = user.Scores.concat(obj2);
//     user.tokens = user.tokens.concat({ token: "jwtDemo" });
//     user.tokens = user.tokens.concat({ token: "jwtDemo2" });

//     await user.save();
//     console.log("Saved");
// } catch (e) {
//     console.log(e);
// }