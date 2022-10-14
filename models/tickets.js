const mongoose = require('mongoose');
const ticketsSchema = new mongoose.Schema({
    task: {
        type: String,
        required: true
    },
    dis: {
        type: String,
        required: true
    },
    img:
    {
        type: String,
        required: true 
    },
    date: {
        type: Date,
        default: Date.now
    },
    created_at: {
		type : Date,
		default: Date.now,
	},
	updated_at: {
		type : Date,
		default: Date.now,
	}
})
module.exports = mongoose.model('ticket', ticketsSchema);