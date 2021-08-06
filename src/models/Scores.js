const mongoose = require("mongoose");
const validator = require("validator");

const Scores = mongoose.Schema({
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
    ScoreList: [{
        Score60: {
            type: Number,
            validate(value) {
                if (value < 0)
                    throw new Error("Score Cannot be Negative")
            }
        },
        Score100: {
            type: Number,
            validate(value) {
                if (value < 0)
                    throw new Error("Score Cannot be Negative")
            }
        },
        SubmissionDate: {
            type: Date,
            default: Date.now
        }
    }]
});

module.exports = Scores;