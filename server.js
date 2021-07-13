if (process.env.NODE_ENV !== 'production')
    require('dotenv').config()
const Express = require('express')
const APP = Express()
const Mongoose = require('mongoose')
const DB = Mongoose.connection
const FS = require('fs')
const cookieParser = require('cookie-parser')
const { verifyToken } = require('./middleware/authentication')
const Post = require('./models/post')
const User = require('./models/user')
const Category = require('./models/category')
const loginRouter = require('./routes/login')
const postsRouter = require('./routes/posts')
const { response } = require('express')
const port = process.env.PORT
// https://github.com/venables/node-where

/**
 * Converts standard date string into customized article string
 * @returns {string} Month, day, year format
 */
Date.prototype.toString = function () {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        M = months[this.getMonth()],
        D = this.getDate(),
        Y = this.getFullYear()
    return `${M} ${D}, ${Y}`
}

const START_TIME = (new Date()).getTime()
// Mongoose.connect(process.env.DATABASE_URI, {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
//     useCreateIndex: true,
//     useFindAndModify: false
// }, () => console.log('Connection took', ((new Date()).getTime() - START_TIME) / 1000))

// DB.on('error', error => console.error(error))
// DB.once('open', () => console.log(
//     `\x1b[34mConnected to \x1b[36m${process.env.DATABASE_URI}\x1b[0m`
// ))
APP.set('view engine', 'ejs')
APP.set('json spaces', 2)
APP.use('/public', Express.static(`${__dirname}/public`))
APP.use(Express.urlencoded({ extended: false }))
APP.use(Express.json())
APP.use(cookieParser())

APP.route('/')
    // .get(verifyToken, async (request, response) => {
    //     const posts = await Post.find().sort({ created: -1 })
    //     response.render('index', { posts: posts })
    // })
    .get ((req, res)=> {res.send('lol')})
    /**
     * Admin page POST request used for user logout
     * Invoked by view engine source
     * Uninterruptible by other admin page post requests
     */


// APP.use('/login', loginRouter)
// APP.use('/posts', postsRouter)
APP.get('*', (_, response) => response.status(404).send('404 error'))

APP.listen(port, error => error ?
    console.log("\x1b[31mERROR:\x1b[0m", error) :
    console.log(`\x1b[35mConnected to \x1b[36mport: ${port}\x1b[0m`))