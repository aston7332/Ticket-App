const express = require("express");
const app = express();
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const ticket = require("./models/tickets");
const methodOverride = require('method-override');
const tickets = require("./models/tickets");
const multer = require('multer');
const fs = require('fs');


//image upload
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './images');
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + "_" + Date.now() + "_" + file.originalname);
    }
})

var upload = multer({
    storage: storage,
}).single("image");

dotenv.config();
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(methodOverride('_method'));
app.use(express.static("./images"));


mongoose.connect('mongodb://localhost:27017/tickets', { useNewUrlParser: true }, () => {
    console.log("Connected to db!");

    app.get('/', (req, res) => {
        res.render('tickets.ejs');
    });

    // Creating a POST request
    app.post('/', upload, async (req, res) => {
        const ticket = require("./models/tickets");
        const ticket1 = new ticket({
            task: req.body.task,
            dis: req.body.dis,
            img: req.file.filename,            
        });
        try {
            await ticket1.save();
            res.redirect("/list");
        } catch (err) {
            res.status(500).send(err);
        }
    });


    // Creating a CREAT and SEARCH request to get list
    app.get('/list', async (req, res) => {
        let name = "";
        if (req.query.task != undefined) {
            name = req.query.task;
        }
        try {
            let result = await ticket.find({ "task": { $regex: ".*" + name + ".*" } }).then((tickets) => {
                res.render("list.ejs", { tickets: tickets, name: name })
            })
        } catch (err) {
            res.status(500).send(err);
        }
    })


    // Creating a UPDATE request
    app.get('/ticketEdit/:id', (req, res) => {
        ticket.findById(req.params.id, function (err, tasks) {
            res.render('ticketEdit', { tickets: tasks });
        })
    })
    app.put('/ticketEdit/:id', upload, async (req, res) => {
        let myObjectId = mongoose.Types.ObjectId(req.params.id);
        let new_image = "";

        if (req.file) {
            new_image = req.file.filename;
            try {
                fs.unlinkSync("./images/" + req.body.old_image);
            } catch (err) {
                console.log(err);
            }
        } else {
            new_image = req.body.old_image;
        }
        try {
            let result = await ticket.findByIdAndUpdate(myObjectId, { task: req.body.task, dis: req.body.dis, img: new_image }).then(tickets => {
                res.redirect(`/list`)
            })
        } catch (err) {
            console.log(err.message)
        }
    })

    // Creating a DELETE request
    app.route("/remove/:id").get((req, res) => {
        const id = req.params.id;
        ticket.findByIdAndRemove(id, (err, result) => {
            if (result.img != '') {
                try {
                    fs.unlinkSync('./images/' + result.img);
                } catch (err) {
                    console.log(err);
                }
            } else {
                res.redirect("/list");
            }
            if (err) {
                res.send(500, err);
            } else {
                res.redirect("/list");
            }
        });
    });
    app.listen(3000, () => console.log("Server Up and running"));
});