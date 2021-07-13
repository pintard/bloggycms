const Mongoose = require('mongoose')

const schema = new Mongoose.Schema({
    name: { type: String, required: true, unique: true },
    modified: { type: Date, default: Date.now },
    slugs: { type: [String] }
})

module.exports = Mongoose.model('category', schema)