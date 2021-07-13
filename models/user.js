const Mongoose = require('mongoose')

const schema = new Mongoose.Schema({
    hash: { type: String, required: true },
    session: { type: Boolean, required: true },
    IP: { type: String },
    accessed: { type: Date },
    attempts: { type: Number, default: 0 },
    disconnected: { type: Boolean, default: false }
})

module.exports = Mongoose.model('admin', schema, 'admin')