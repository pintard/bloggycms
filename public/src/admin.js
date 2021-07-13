const searchField = document.getElementById('search-field')
const container = document.getElementById('admin-main')

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

/**
 * Initializes page with delete functionality on all posts
 * Apply appearance properties to posts that are live
 * @returns {void}
 */
const initializePosts = window.onload = () => {
    applyDelete()
    applyUploaded()
}

/**
 * On input, the search field renders posts in container
 * that matches either post title or description
 *
 * Gets array of json post objects
 * Filter json post objects by the regex rules associated with
 * the the search value
 * @returns {void}
 */
searchField.oninput = async () => {
    const posts = await getPosts()
    const results = posts.filter(post => {
        const regex = new RegExp(`${searchField.value}`, 'gi')
        return post.title.match(regex) || post.description.match(regex)
    })
    container.innerHTML = renderPosts(results).join('')
    initializePosts()
}

/**
 * Accessor for list of post objects on database
 * @returns {Object[]} of JSON post objects
 */
const getPosts = () => fetch('/posts').then(response => response.json())

/**
 * Renders post objects as html markup
 * @param {Object[]} posts - the post objects to be rendered as HTML
 * @returns {string} an array of HTML markup elements for post object
 */
const renderPosts = posts => posts.map(post =>
    `<div class="content-post">
        <div class="content-post-body">
            <span>
                <a href="posts/${post.slug}">${post.title}</a>
            </span>
            <span>Created on ${new Date(post.created)}</span>
            <span>${post.description}</span>
        </div>
        <div class="content-post-control">
            <form class="upload-button">
                <button name="upload" value="${post._id}"
                    class="control-option upload ${post.uploaded ? "active" : ""}">${post.uploaded ? "uploaded" : "upload"}</button>
            </form>
            <a href="posts/edit/${post._id}" class="control-option">edit</a>
            <form class="delete-button">
                <button name="delete" value="${post._id}"
                    class="control-option delete">delete</button>
            </form>
        </div>
    </div>`
)

/**
 * Makes each post on page dynamically destructible when invoked
 * @returns {void}
 */
const applyDelete = () => {
    const deleteForms = Array.from(document.getElementsByClassName('delete-button'))
    deleteForms.forEach(form => form.onsubmit = async event => {
        event.preventDefault()
        const request = new Request('/', {
            method: 'DELETE',
            credentials: 'same-origin',
            body: JSON.stringify({ delete: form.firstElementChild.value }),
            headers: { 'Content-Type': 'application/json' }
        })
        const response = await fetch(request)
        if (response.status === 204) {
            form.parentElement.parentElement.remove()
            console.log("deleted", form.firstElementChild.value)
        }
    })
}

/**
 * Makes each post on page dynamically reflect live status
 * of article as reflected in DB
 * @returns {void}
 */
const applyUploaded = () => {
    const uploadForms = Array.from(document.getElementsByClassName('upload-button'))
    uploadForms.forEach(form => form.onsubmit = async event => {
        event.preventDefault()
        const button = form.firstElementChild
        const request = new Request('/', {
            method: 'PUT',
            credentials: 'same-origin',
            body: JSON.stringify({ upload: button.value }),
            headers: { 'Content-Type': 'application/json' }
        })
        const response = await fetch(request)
        const json = await response.json()
        if (response.status === 200) {
            if (json.uploaded) {
                button.classList.add('active')
                button.innerHTML = "uploaded"
            } else {
                button.classList.remove('active')
                button.innerHTML = "upload"
            }
            console.log("changed", button.value)
        }
    })
}