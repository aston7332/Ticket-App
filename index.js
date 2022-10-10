const express = require("express");
const app = express();
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const ticket = require("./models/tickets");
const methodOverride = require('method-override')


dotenv.config();
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");

mongoose.connect('mongodb://localhost:27017/tickets', { useNewUrlParser: true }, () => {
    console.log("Connected to db!");

    app.get('/', (req, res) => {
        res.render('tickets.ejs');
    });

    app.post('/', async (req, res) => {
        const ticket = require("./models/tickets");
        const ticket1 = new ticket({
            task: req.body.task,
            dis: req.body.dis,
        });
        try {
            await ticket1.save();
            res.redirect("/list");
        } catch (err) {
            res.status(500).send(err);
        }
    });

    app.get("/list", (req, res) => {

        ticket.find({}, (err, tasks) => {
            res.render("list.ejs", { tickets: tasks });
        });
    });

    app.get('/ticketEdit/:id', (req, res) => {
        ticket.findById(req.params.id, function (err, tasks) {
            res.render('ticketEdit', { tickets: tasks });
        })
    })
    app.post('/ticketEdit/:id', (req, res) => {
        ticket.findByIdAndUpdate(req.params.id, req.body).then(tickets => {
            res.redirect(`/list`)
        }).catch(err => {
            console.log(err.message)
        })
    })

    app.route("/remove/:id").get((req, res) => {
        const id = req.params.id;
        ticket.findByIdAndRemove(id, err => {
            if (err) return res.send(500, err);
            res.redirect("/list");
        });
    });
    app.listen(3000, () => console.log("Server Up and running"));
});