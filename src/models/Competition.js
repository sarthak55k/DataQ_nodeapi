const mongoose = require("mongoose");
const validator = require("validator");
const Scores = require('./Scores');

const CompSchema = mongoose.Schema({
    CompID: {
        type: Number,
        default: 0,
        unique: true,
        validate(value) {
            if (value < 0)
                throw new Error("Competition ID cannot be negative");
        }
    },
    Name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    Introduction: {
        type: String,
        default: "Competition Created",
        trim: true
    },
    Rules: {
        type: String,
        default: "Rules Blah Blah",
        trim: true
    },
    TrainLink: {
        type: String,
        default: "Link Broken",
        trim: true
    },
    TestLink: {
        type: String,
        default: "Link Broken",
        trim: true
    },
    SampleLink: {
        type: String,
        default: "Link Broken",
        trim: true
    },

    TotalSubs: {
        type: Number,
        default: 0
    },

    ThresholdScore60: {
        type: Number,
        default: 0,
        validate(value) {
            if (value < 0)
                throw new Error("Competition Threshold Score cannot be negative");
        }
    },

    Submissions: [{
        username: {
            type: String,
            required: true
        },
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

        IndividualTotalSubs: {
            type: Number,
            default: 0
        },
    }]
});
//Competition Methods
CompSchema.methods.getIntro = function() {
    const comp = this;
    const compObject = comp.toObject();

    delete compObject.Submissions;
    delete compObject.TestLink;
    delete compObject.TrainLink;

    return compObject;
}

//Total Submission Count
CompSchema.pre("save", async function(next) {
    const comp = this;

    comp.TotalSubs += 1;
    next();
})

const Competition = mongoose.model("Competition", CompSchema);

module.exports = Competition;

//HOW TO STORE DATA
// try {
//     const comp = new Competition({
//         Submissions: {}
//     });
//     comp.CompID = 0;
//     comp.Name = "Competition 1";
//     comp.Introduction = "Intro 1";

//     const Score1 = {
//         maxScore100: 0.8,
//         maxScore60: 0.93,
//         ScoreList: [
//             { Score60: 0.8, Score100: 0.6 },
//             { Score60: 0.93, Score100: 0.8 }
//         ]
//     };
//     const Score2 = {
//         maxScore100: 0.75,
//         maxScore60: 0.9,
//         ScoreList: [
//             { Score60: 0.6, Score100: 0.5 },
//             { Score60: 0.9, Score100: 0.75 }
//         ]
//     };

//     // comp.set('Submissions.User1', Score1);
//     // comp.set('Submissions.User2', Score2);
//     comp.Submissions.set("User1", Score1);

//     await comp.save();
//     console.log("Saved");
//     console.log(comp.get("Submissions.User1"));

// } catch (e) {
//     console.log(e);
// }