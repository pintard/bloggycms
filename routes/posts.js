const Express = require('express')
const Router = Express.Router()
const Post = require('./../models/post')
const Category = require('./../models/category')
const multer = require('multer')
const path = require('path')
const FS = require('fs')
const UUID = require('short-uuid')
const marked = require('marked')
const slugify = require('slugify')
const { JSDOM } = require('jsdom')
const Dompurify = require('dompurify')
const purify = new Dompurify(new JSDOM().window)

/**
 * Multer function for saving incoming form data as image
 * to server disk space
 */
const upload = multer({
    storage: multer.diskStorage({
        destination: function (request, file, callback) {
            callback(null, 'public/tmp/')
        },
        filename: function (request, file, callback) {
            callback(null, UUID.generate() + path.extname(file.originalname))
        }
    })
})

Router.route('/new')
    .get((request, response) => response.render('posts/new', { post: new Post() }))
    /**
     * On POST request, sends article data to DB which is later
     * rendered by admin page on GET requests
     * Handles image file transfer between client and server
     */
    .post(async (request, response) => {
        const { title, description, bodyMD, tags, images } = request.body
        const post = new Post({
            title: title,
            description: description,
            bodyMD: bodyMD,
            tags: tags?.replace(/\s+/g, '').split(','),
            images: images?.replace(/\s+/g, '').split(',')
        })
        try {
            await post.save()
        } catch (error) {
            // Possibly a duplicate title, handle in client
            console.error(error.toString())
            response.sendStatus(204)
        }
        processPostData(post)
        console.log("saved post:", post)
        response.status(200).redirect(`/posts/${post.slug}`)
    })
    /**
     * Accepts image PUT request from client side
     * and saves it to server directory
     * Sends image new location and name back to client
     */
    .put(upload.single('uploadImage'), (request, response) => {
        response.json({
            imageName: request.file.filename,
            imagePath: request.file.path
        })
    })

// API request for all available posts
Router.get('/', async (request, response) =>
    response.status(202).json(await Post.find().sort({ created: -1 })))

// API request for all available tags/categories
Router.get('/categories', async (request, response) =>
    response.status(202).json(await Category.find()))

// API request for all live posts
Router.get('/export', async (request, response) => response.status(202)
    .json(await Post.find({ uploaded: true }).sort({ created: -1 })))

Router.route('/edit/:id')
    .get(async (request, response) => {
        const post = await Post.findById(request.params.id)
        if (!post.images.includes('')) {
            const origin = image => `images/${post.id}/${image}`,
                destination = image => `public/tmp/${image}`
            for (const image of post.images) {
                if (!FS.existsSync(destination(image))) {
                    FS.copyFile(origin(image), destination(image), error => {
                        if (error) console.log(error)
                        else console.log('successful image migration')
                    })
                }
            }
        }
        response.render('posts/edit', { post: post })
    })
    .post(async (request, response) => {
        const { title, description, bodyMD, tags, images } = request.body
        const post = await Post.findByIdAndUpdate(request.params.id, {
            title: title,
            description: description,
            bodyMD: bodyMD,
            tags: tags?.replace(/\s+/g, '').split(','),
            images: images?.replace(/\s+/g, '').split(','),
            sanitizedHTML: purify.sanitize(marked(bodyMD)),
            slug: slugify(title.toLowerCase())
        }, error => {
            if (error) {
                console.error(error.toString())
                response.sendStatus(204)
            }
            else console.log('update successful')
        })
        processPostData(post)
        console.log("updated post:", post)
        response.status(200).redirect(`/posts/${post.slug}`)
    })
    .put(upload.single('uploadImage'), (request, response) => {
        response.json({
            imageName: request.file.filename,
            imagePath: request.file.path
        })
    })
    /**
     * On beforeunload event trigger, receive DELETE request
     * from client including all temporary images to be deleted
     * Delete all images only in /post/edit/*
     */
    .delete(async (request, response) => {
        for (const image of request.body.images) {
            if (FS.existsSync(`public/tmp/${image}`)) {
                FS.unlink(`public/tmp/${image}`, error => {
                    if (error) console.error(error)
                    console.log(image, "deleted")
                })
            }
        }
    })

Router.get('/:slug', async (request, response) => {
    const post = await Post.findOne({ slug: request.params.slug })
    if (post !== null) response.render('posts/display', { post: post })
})

/**
 * A set of processes to be attempted every time a post
 * is being published to database collection
 * @param {Document} post - the MongoDB document being processed
 */
const processPostData = post => {
    /**
     * If post contains images, include images from temporary
     * directory into object id directory in the images subdirectory
     * of the server root
     */
    if (!post.images.includes('')) {
        const imagesPath = `images/${post.id}`,
            origin = image => `public/tmp/${image}`,
            destination = image => imagesPath + `/${image}`
        // If post image directory doesn't exist, create it
        if (!FS.existsSync(imagesPath)) {
            FS.mkdir(imagesPath, error => {
                if (error) console.log(error)
                else console.log('directory created')
            })
        }
        /**
         * Place all images in post into the corresponding directory
         * from the temp directory
         */
        for (const image of post.images) {
            FS.rename(origin(image), destination(image), error => {
                if (error) console.log(error)
                else console.log('successful image migration')
            })
        }
    }
    /**
     * If post contains tags, check if tag category exists
     * If exists, adds a new article name to list of associated
     * articles
     * If new, creates a new category
     */
    if (!post.tags.includes('')) {
        for (const tag of post.tags) {
            Category.exists({ name: tag }, async (error, exists) => {
                if (exists) await Category.updateOne({ name: tag }, {
                    modified: Date.now(),
                    $push: { slugs: post.slug }
                }).exec()
                else await new Category({
                    name: tag,
                    slugs: [post.slug]
                }).save()
            })
        }
    }
}

module.exports = Router