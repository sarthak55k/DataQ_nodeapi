const mongoose = require("mongoose");
const validator = require("validator");

const LeaderboardSchema = mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    Final100: {
        type: Number,
        validate(value) {
            if (value < 0)
                throw new Error("Score Cannot be negative");
        }
    },
    Final60: {
        type: Number,
        validate(value) {
            if (value < 0)
                throw new Error("Score Cannot be negative");
        }
    },
    FinalDate: {
        type: Date,
        default: Date.now
    },
    AllScores: [{
        maxScore100: {
            type: Number,
            validate(value) {
                if (value < 0)
                    throw new Error("Score Cannot be negative");
            }
        },
        maxScore60: {
            type: Number,
            validate(value) {
                if (value < 0)
                    throw new Error("Score Cannot be negative");
            }
        },
        maxDate: {
            type: Date,
            default: Date.now
        },
    }]
});

const Leaderboard = mongoose.model("Leaderboard", LeaderboardSchema);

module.exports = Leaderboard;