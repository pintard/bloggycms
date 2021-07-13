const Mongoose = require('mongoose')
const marked = require('marked')
const slugify = require('slugify')
const { JSDOM } = require('jsdom')
const Dompurify = require('dompurify')
const purify = new Dompurify(new JSDOM().window)

const schema = new Mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    bodyMD: { type: String, required: true },
    created: { type: Date, default: Date.now },
    slug: { type: String, required: true, unique: true },
    sanitizedHTML: { type: String, required: true },
    tags: { type: [String] },
    images: { type: [String] },
    visitors: { type: [Object] },
    uploaded: { type: Boolean, default: false }
})

schema.pre('validate', function (next) {
    if (this.bodyMD)
        this.sanitizedHTML = purify.sanitize(marked(this.bodyMD))
    if (this.title) this.slug = slugify(this.title.toLowerCase())
    next()
})

module.exports = Mongoose.model('blogpost', schema)