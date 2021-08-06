const express = require("express");
var multer = require("multer");
const fs = require("fs");
const path = require("path");
const csv = require('csv-parse');
const Axios = require("axios");

const User = require("../models/User");
const Competition = require("../models/Competition");
const Leaderboard = require("../models/Leaderboard");
const auth = require("../middleware/auth");
const { response } = require("express");

const Endpoints = express.Router();
var upload = multer();

//Check If Logged In
Endpoints.get("/isLoggedIn", auth, (req, res) => {
    
    res.status(200).send({ isLogged: true });
});

// Log In
Endpoints.post("/login", (req, res) => {
    
    User.findByCredentials(
        req.body.email,
        req.body.password
    ).then((obj) => {
        
        var user;
        //  obj.code == 1 means the user data is not present in our database so we need to fetch it from pulzion database
        if (obj.code == 1) {
            
            Axios.post(`${process.env.EMS_SERVER}/auth/login`, {
                    email: req.body.email,
                    password: req.body.password
                })
                .then(response => {
                    
                    if (response.data.error)
                        return res.status(400).send(response.data.error)
                    
                    user = new User({
                        username: response.data.user.fname + " " + response.data.user.lname,
                        email: req.body.email,
                        password: req.body.password,
                        Submissions: {}
                    });
                    
                    let leaderboard = new Leaderboard({
                        username: response.data.user.fname + " " + response.data.user.lname,
                        Final100: 0,
                        Final60: 0,
                        AllScores: []
                    });
                    leaderboard.save();
                    
                    user.save().then(user => {
                        user.generateAuthToken().then(token => {
                            
                            return res.status(200).send({ token, user: user.toJSON() });
                        }).catch(e => {
                            return res.status(401).send(e);
                        })
                    })
                
                })
                .catch(err => {
                    return res.status(400).send(err);
                })
        // if present then just fetch from our database and return it
        } else {
            user = obj.user;
            user.generateAuthToken().then(token => {
                
                return res.status(200).send({ token, user: user.toJSON() });
            }).catch(e => {
                return res.status(401).send(e);
            })
        }
    
    }).catch(_err => {
        return res.status(400).send({ error: "Invalid Username or Password" });
    })
});

//Get All Competition Intro
Endpoints.get("/competitions", auth, (req, res) => {
    
    Competition.find({}, (err, competitions) => {
        
        if (err)
            res.status(400).send("Database Fetch Error");
        
        const allComp = [];
        competitions.forEach(comp => {                  // home page - competions intro
            allComp.push(comp.getIntro());
        });
        
        Leaderboard.find({}).sort([
            ["Final60", -1]                             // for main leaderboad data jsut showing 60% test dataset score. 
        ]).then((leader) => {
            
            let rank = leader.findIndex(obj => obj.username === req.user.username)
            
            res.send({
                user: req.user,
                allCompetitions: allComp,
                rank
            });
        
        }).catch(_err => {
            res.status(404).send("Leaderboard Fetch Issue");
        })
    })
});

//Get Specific Competition Details
Endpoints.post("/competition/View", auth, (req, res) => {
    Competition.findOne({ CompID: req.body.CompID })
        .then(Comp => {
            
            if (!Comp)
                return res.status(401).send("No Such Competition");
            
            const CompObj = Comp.toObject();
            delete CompObj.Submissions;
            
            // main not understood-- ???
            Competition.aggregate([
                    { $match: { CompID: parseInt(req.body.CompID) } },
                    { $unwind: '$Submissions' },
                    { $sort: { 'Submissions.maxScore60': -1 } },
                    { $project: { Submissions: 1 } }    // why this
                ])
                .then(aggrScores => {
                    
                    let SubmissionsLeft = 10;
                    let day = new Date;
                    const sbs = req.user.Submissions.get(req.body.CompID.toString());
                    
                    if (sbs !== undefined) {
                        const subs = sbs.ScoreList;
                        
                        for (let ind = subs.length - 1; ind >= 0; ind -= 1) {
                            if (subs[ind].SubmissionDate.getDate() == day.getDate())
                                SubmissionsLeft -= 1;
                            else
                                break;
                        }
                    }
                    
                    res.send({
                        user: req.user.toJSON(),
                        Competition: CompObj,
                        Scores: aggrScores,
                        SubmissionsLeft
                    });
                
                }).catch(e => {
                    res.status(400).send({
                        error: e,
                        message: "Database Fetch At Aggregate caused fault"
                    });
                });
        
        }).catch(err => {
            res.status(400).send(e);
        })

});

//Submissions
Endpoints.post("/submission", auth, (req, res) => {
    
    let CompRating = {
        0: 100,
        1: 250,
        2: 400
    }
    
    //FROM Django Server
    let Score60 = req.body.Score60,
        Score100 = req.body.Score100;
    
    let CompScores = req.user.Submissions.get(req.body.CompID.toString())
    
    //New Score for Contest
    if (CompScores === undefined) {
        
        CompScores = {
            maxScore100: Score100,
            maxScore60: Score60,
            maxDate: new Date,
            ScoreList: []
        };
        CompScores.ScoreList = CompScores.ScoreList.concat({ Score100, Score60 });
        
        Competition.findOne({ CompID: req.body.CompID })
            .then(comp => {
                
                comp.Submissions.push({
                    username: req.user.username,
                    maxScore100: Score100,
                    maxScore60: Score60,
                    maxDate: new Date,
                    IndividualTotalSubs: 1
                });
                comp.save();
            })
            .catch(err => {
                throw new Error("Database Fetch Error");
            })
        
        Leaderboard.findOne({ username: req.user.username })
            .then(board => {
                
                board.AllScores.push({
                    maxScore100: Score100,
                    maxScore60: Score60,
                    maxDate: new Date
                });
                board.Final100 += CompRating[req.body.CompID] * Score100;
                board.Final60 += CompRating[req.body.CompID] * Score60;
                board.FinalDate = new Date;
                board.save();
            }).catch((_err) => {
                throw new Error("Database Fetch Error");
            })
    
    } else {
        
        CompScores.ScoreList = CompScores.ScoreList.concat({ Score100, Score60 });
        
        if (CompScores.maxScore100 < Score100 || (CompScores.maxScore100 == Score100 && CompScores.maxScore60 < Score60)) {
            
            CompScores.maxScore100 = Score100;
            CompScores.maxScore60 = Score60;
            CompScores.maxDate = new Date;
            
            Competition.findOneAndUpdate({
                    CompID: req.body.CompID,
                    "Submissions.username": req.user.username
                }, {
                    "Submissions.$.maxScore100": Score100,
                    "Submissions.$.maxScore60": Score60,
                    "Submissions.$.maxDate": new Date,
                    $inc: { "Submissions.$.IndividualTotalSubs": 1 }
                })
                .then(competition => {
                    
                    competition.save();
                })
                .catch(err => {
                    res.status(402).send(err);
                })
            
            Leaderboard.findOne({ username: req.user.username })
                .then(board => {
                    
                    board.Final100 -= board.AllScores[req.body.CompID].maxScore100 * CompRating[req.body.CompID];
                    board.Final100 += CompRating[req.body.CompID] * Score100;
                    board.AllScores[req.body.CompID].maxScore100 = Score100;
                    
                    board.Final60 -= board.AllScores[req.body.CompID].maxScore60 * CompRating[req.body.CompID];
                    board.Final60 += CompRating[req.body.CompID] * Score60;
                    board.AllScores[req.body.CompID].maxScore60 = Score60;
                    
                    board.FinalDate = new Date;
                    board.AllScores[req.body.CompID].maxDate = new Date;
                    board.save();
                
                })
                .catch(_err => {
                    throw new Error("Database Fetch Error");
                })
        
        } else {
            Competition.findOneAndUpdate({
                    CompID: req.body.CompID,
                    "Submissions.username": req.user.username
                }, {
                    $inc: { "Submissions.$.IndividualTotalSubs": 1 }
                })
                .then(competition => {
                    
                    competition.save();
                })
                .catch(err => {
                    res.status(402).send(err);
                })
        }
    }
    
    if (Score60 >= req.body.ThresholdScore60) {
        req.user.CurrentLevel = Math.max(req.user.CurrentLevel, req.body.CompID + 1);
    }
    
    req.user.Submissions.set(req.body.CompID.toString(), CompScores);
    req.user.save().catch(err => {
        console.log(err);
        console.log("Multiple Saves on Same User");
    });
    
    res.send({ user: req.user, Score100, Score60 });
});
    
// Get Main LeaderBoard
Endpoints.get("/leaderboard", (_req, res) => {
    
    Leaderboard.find({}).sort([
        ["Final60", -1]
    ]).then(leader => {
        
        res.send({
            Leaderboard: leader
        
        });
    
    }).catch(_err => {
        res.status(404).send("Leaderboard Fetch Issue");
    })

});

// TEST
Endpoints.get("/test", (req, res) => {
    
    console.log(req.body);
    res.send(req.body)

});

module.exports = Endpoints;