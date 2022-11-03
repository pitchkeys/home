const express = require('express');
var cors = require('cors');
const mongoose = require('mongoose');

mongoose.connect("mongodb+srv://micaiahcape22:micaiah05@urlshortener.afsxdo4.mongodb.net/?retryWrites=true&w=majority", {useNewUrlParser: true}, () => {
    console.log('successfully connected to database')
})


require('dotenv').config();

const port = 9000

const app = express();
app.use(cors());
app.use(express.json())

app.get("/n", (req, res) => {
    res.send("a6ehs57r6du6g5syegybsdnutimd7nu6ry5esbdnutimn7u")
})

app.get("/api/songs/", (req, res) => {
    Songs.find({}, (err, data) => {
        if(err) return console.log(err);
        res.send(data)
    })
})

app.get("/api/songs/popular/:count", (req, res) => {
    Songs.find({}).limit(req.params.count).exec((err, data) => {
        if (err) return console.log(err)
        res.send(data)
    })
})

app.get("/api/songs/recent/:count", (req, res) => {
    Songs.find({}).limit(req.params.count).sort({date: -1}).exec((err, data) => {
        if (err) return console.log(err)
        res.send(data)
    })
})

app.get("/api/songs/:link", (req, res) => {
    if(req.params.link.length == 7){
        Songs.find({generatedLink: "/" + req.params.link}).exec((err, data) => {
            if (err) res.send(err)
            res.send(data);
        })
    }else{
        Songs.find({"download.ytLink": "https://www.youtube.com/watch?v=" + req.params.link}, (err, data) => {
            res.send(data);
        })
    }
})

app.post('/api/songs/:link', (req, res) => {
    Songs.findOneAndUpdate({generatedLink: "/" + req.params.link}, req.body, {returnOriginal: false}, (err, data) => {
        res.send(data);
    })
})

app.post('/api/songs/:link/add', (req, res) => {
    Songs.findOneAndUpdate({generatedLink: "/" + req.params.link}, req.body, {returnOriginal: false}, (err, data) => {
        res.send(data);
    })
})

app.post("/search", (req, res) => {
    console.log(req.body);
    let x = new Search(req.body);
    x.save((err, data) => {
        if(err) return console.log(err)
        console.log(data);
    })
    res.send("successfully added " + req.body + " to database")
})

app.get("/search", (req, res) => {
    let query = {
        types: req.query.types.split(""),
        files: req.query.files.split(""), //in order, refers to mid, mp3, mscz, pdf, yt
        notecount: req.query.noteCount.split(","),
        bpm: req.query.bpm.split(","),
        rating: req.query.rating.split(","),
        duration: req.query.duration.split(","),
        numRatings: req.query.numRatings.split(",")
    }

    let fileProcessing = [
        {"download.midiLink": {$regex: ".mid"}},
        {"download.audioLink": {$regex: "."}},
        {"download.msczLink": {$regex: ".mscz"}},
        {"download.sheetMusic": {$regex: ".pdf"}},
        {"download.ytLink": {$regex: "youtube"}},
    ]
    let needProcessing = false
    //processing into filters
    let fil = [];
    for(let i = 0; i < query.types.length; i++){
        fil.push({filters: {$regex: parseInt(query.types[i])}})
    }

    let fixedFiles = [];
    
    for (let i = 0; i < query.files.length; i++){
        if(query.files[i] == 1){
            fixedFiles.push(fileProcessing[i]);
        }
    }
    let criteria = {}
    let r = req.query.order.split(',')[0]
    if(r == "relevance" || r == "numRatings" || r == "rating" || r == "download"){
        console.log("crap. its one of these three")
        needProcessing = true
        
    }else{
        criteria = {[r]: parseInt(req.query.order.split(',')[1])}
        //console.log(criteria);
    }
    

    Songs.find({
        
        notecount: {$gte: parseInt(query.notecount[0]), $lte: parseInt(query.notecount[1])}, 
        bpm: {$gte: parseInt(query.bpm[0]), $lte: parseInt(query.bpm[1])}, 
        duration: {$gte: parseInt(query.duration[0]), $lte: parseInt(query.duration[1])},
        $and: [{$or: fil}, {$or: fixedFiles}]
        
    }).sort(criteria).exec((err, data) => {
        if(err) return console.log(err);
        if(!needProcessing){
            res.send(data)
        }else{
            res.send(data)
        }
        
    })
})

const song = new mongoose.Schema({
    songname: String,
    date: Number,
    desc: String,
    duration: Number,
    bpm: Number,
    notecount: Number,
    filters: String,
    keywords: [String],
    generatedLink: String,
    credits: {
        link: [String],
        textToDisplay: String,
    },

    download: {
        audioLink: String,
        midiLink: String,
        msczLink: String,
        ytLink: String,
        sheetMusic: String,
        coverImage: String,
    },

    stats: {
        ratings: [String],
        midiDownloads: Number,
        mp3Downloads: Number,
        msczDownloads: Number,
        pdfDownloads: Number,
        visits: Number,  
    },
})

const Songs = mongoose.model('Songs', song);

app.post('/add', (req, res) => {
    let s = new Songs(req.body);
    s.save((err, data) => {
        if (err) console.log(err);
        console.log(data);
    })
})



app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
  });

app.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
});