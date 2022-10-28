const express = require("express");
const app = express();
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const ticket = require("./models/tickets");
const methodOverride = require('method-override');
const tickets = require("./models/tickets");
const multer = require('multer');
const fs = require('fs');
var cookieParser = require('cookie-parser')
var csrf = require('csurf')
var bodyParser = require('body-parser');
const { DefaultDeserializer } = require("v8");
const session = require('express-session');
const flash = require('connect-flash');
var toastr = require('express-toastr');

// setup route middlewares
var csrfProtection = csrf({ cookie: true })
var parseForm = bodyParser.urlencoded({ extended: false })



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
    limits: {
        fieldSize: 1024 * 1024 * 3,
    },
    fileFilter: function(req, file, callback){
        validateFile(file, callback);
    },
}).single("image");


var validateFile = function(file, cb ){
    allowedFileTypes = /jpeg|jpg|png|gif/;
    const extension = allowedFileTypes.test(file.originalname.toLowerCase());
    const mimeType  = allowedFileTypes.test(file.mimetype);
    if(extension && mimeType){
      return cb(null, true);
    }else{
      cb("Invalid file type. Only JPEG, PNG and GIF file are allowed.")
    }
  }

dotenv.config();
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(methodOverride('_method'));
app.use(express.static("./images"));
// parse cookies
// we need this because "cookie" is true in csrfProtection
app.use(cookieParser())


// Set Cookie Parser, sessions and flash
app.use(session({
  secret : 'something',
  cookie: { maxAge: 60000 },
  resave: true,
  saveUninitialized: true
}));
app.use(flash());

app.use(toastr());

mongoose.connect('mongodb://localhost:27017/tickets', { useNewUrlParser: true }, () => {
    console.log("Connected to db!");

    app.get('/', csrfProtection, (req, res) => {
        res.render('tickets.ejs' , { csrfToken: req.csrfToken() });
    });

    // Creating a POST request
    app.post('/', upload, csrfProtection, async (req, res) => {
        // console.log(req.body,"Hello")
        // console.log(req.file);
        const ticket = require("./models/tickets");
        const ticket1 = new ticket({
            task: req.body.task,
            dis: req.body.dis,
            img: req.file.filename,          
        });
        try {
            await ticket1.save();
            // req.flash('user', "Ticket create successfully");
            req.toastr.success('Successfully Created');
            res.redirect("/list");
        } catch (err) {
            req.toastr.error('Invalid credentials.');
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
            // const userName = req.flash('user');
            // const userName = req.toastr;
            let result = await ticket.find({ "task": { $regex: ".*" + name + ".*" } }).then((tickets) => {
                res.render("list.ejs", { req: req ,tickets: tickets, name: name })
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
                req.toastr.success('Successfully Edited');
                res.redirect(`/list`)
            })
        } catch (err) {
            req.toastr.error('Invalid credentials.');
            console.log(err.message)
        }
    })

    // Creating a DELETE request
    app.route("/remove/:id").get((req, res) => {

        const id = req.params.id;
        // console.log(id)
        ticket.findByIdAndRemove(id, (err, result) => {
            if (result.img != '') {
                try {
                    fs.unlinkSync('./images/' + result.img);
                } catch (err) {
                    console.log(err);
                }
            } else {
                req.toastr.success('Successfully Deleted');
                res.redirect("/list");
            }
            if (err) {
                res.send(500, err);
            } else {
                req.toastr.success('Successfully Deleted');
                res.redirect("/list");
            }
        });
    });


    app.listen(3000, () => console.log("Server Up and running"));
});