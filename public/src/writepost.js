const mainArea = document.getElementById('post-main'),
    previewButton = document.getElementById('md-preview-button'),
    preview = document.getElementById('view-md'),
    previewContainers = Array.from(preview.children),
    textForm = document.getElementById('create-form'),
    textAreas = Array.from(document.getElementsByClassName('create-fields')),
    addImage = document.getElementById('add-image-button'),
    discardPost = document.getElementById('discard-post'),
    savePost = document.getElementById('save-post'),
    tagField = document.getElementById('tag-field'),
    tagContainer = document.getElementById('tag-container'),
    compiledTags = document.getElementById('form-tag-input'),
    imagePanel = document.getElementById('image-panel'),
    imageNames = document.getElementById('form-image-input'),

    navButtons = Array.from(document.getElementsByClassName('nav-button')),
    boldText = document.getElementById('bold-text-button'),
    italicText = document.getElementById('italicize-text-button'),
    createList = document.getElementById('list-text-button'),
    blockQuote = document.getElementById('blockquote-button'),
    themeToggle = document.getElementById('theme-toggle')
// https://highlightjs.org/usage/

// Array of current tags for post
let tags = new Array()
// Array of current images for post
let images = new Array()

/**
 * Returns user to admin page without saving data
 * @returns {void}
 */
discardPost.onclick = () => window.location.href = '/'

/**
 * Invoke post request on save button click
 * Saves article form fields to DB as a post object
 */
savePost.onclick = () => {
    const saveButton = document.getElementById('save-button')
    const postForm = document.getElementById('create-form')
    postForm.onsubmit = async event => {
        event.preventDefault()
        const form = new FormData(event.currentTarget)
        const formData = Object.fromEntries(form.entries())
        const request = new Request(window.location.pathname, {
            method: 'POST',
            credentials: 'same-origin',
            body: JSON.stringify(formData),
            headers: { 'Content-Type': 'application/json' }
        })
        console.log("posting form", formData)
        const response = await fetch(request)
        if (response.status === 200) window.location.href = '/'
        if (response.status === 204)
            alert("ERROR: maybe another article exists with that title?")
        // TODO on post, REGEX photos to server/images instead of tmp
    }
    saveButton.click()
}

/**
 * Control flow for text field visibility and MD display
 * @returns {void}
 */
window.onload = () => {
    if (localStorage.getItem('theme') === 'dark')
        mainArea.classList.add('dark')
    textAreas.forEach((textArea, i) => {
        textArea.style.visibility = textArea.value === "" ? "" : "visible"
        textArea.style.height = 'auto'
        textArea.style.height = textArea.scrollHeight + 'px'
        if (i === 2) previewContainers[i].innerHTML = marked(textArea.value)
        else previewContainers[i].innerHTML = textArea.value
    })
}

/**
 * Toggles page contrast theme on click
 * Stores state in browser local storage
 */
themeToggle.onclick = () => {
    if (mainArea.classList.contains('dark')) {
        mainArea.classList.remove('dark')
        localStorage.setItem('theme', 'light')
    } else {
        mainArea.classList.add('dark')
        localStorage.setItem('theme', 'dark')
    }
}

boldText.onclick = () => formatText('b')
italicText.onclick = () => formatText('i')
createList.onclick = () => {
    skipToEditor()
    const textbox = textAreas[2]
    const insertListItem = () => {
        const isFirst = JSON.stringify(getCursorPosition()) === '[1,0]',
            insert = '- List item\r\r',
            start = textbox.selectionStart + 2,
            end = start + insert.length - 4
        if (isFirst) {
            textbox.setRangeText(insert)
            textbox.setSelectionRange(start, end)
        } else {
            textbox.setRangeText('\r' + insert)
            textbox.setSelectionRange(start + 1, end + 1)
        }
    }
    if (window.getSelection().toString() === 'List item') {
        textbox.setSelectionRange(textbox.selectionEnd, textbox.selectionEnd)
        insertListItem()
    }
    else
        insertListItem()
    textbox.style.height = 'auto'
    textbox.style.height = textbox.scrollHeight + 'px'
    textbox.focus()
    previewContainers[2].innerHTML = marked(textbox.value)
}

blockQuote.onclick = () => {
    checkListItem()
}

/**
 * If a navigation button is clicked when the editor is invisible,
 * forces both sub-title and editor fields into view
 */
const skipToEditor = () => {
    if (textAreas[2].style.visibility === '') {
        textAreas.slice(1).forEach(box => box.style.visibility = 'visible')
        textAreas[2].focus()
    }
}

// TODO
const checkListItem = () => {
    const textbox = textAreas[2],
        lines = textbox.value.substr(0, textbox.selectionStart).split('\n'),
        currentRow = lines.length,
        currentColumn = lines[lines.length - 1].length
}

/**
 * Gets the current row and column position of the cursor respectively.
 * @returns {Array} an array of the cursor coordinates in terms of <row, col>
 */
const getCursorPosition = () => {
    const textbox = textAreas[2],
        lines = textbox.value.substr(0, textbox.selectionStart).split('\n'),
        currentRow = lines.length,
        currentColumn = lines[lines.length - 1].length
    return [currentRow, currentColumn]
}

/**
 * Apply a text decoration to highlighted text or text at the
 * current cursor position
 *
 * Also removes text decoration from highlighted text
 *
 * @param {string} type - character indicator for the type of
 * button being clicked
 */
const formatText = type => {
    skipToEditor()
    const textbox = textAreas[2],
        selection = window.getSelection(),
        i = (type === 'b') ? 2 : 1,
        insertDefault = (type === 'b') ? '**strong text**' : '*emphasized text*',
        insertSelected = (type === 'b') ? `**${selection}**` : `*${selection}*`

    /**
     * // TODO place hybrid???
     *
     * On text selection, takes an unformatted text string and applies
     * formatting, highlighting new inner-text selection
     *
     * On isolated cursor position, inserts a default strong or emphasized
     * text placeholder, highlighting the inner-text selection
     *
     * @param {string} insert - the string to be inserted into selection
     */
    const placeBoldItalic = insert => {
        const start = textbox.selectionStart + i,
            end = start + insert.length - (i * 2)
        textbox.setRangeText(insert)
        textbox.setSelectionRange(start, end)
    }

    /**
     * For selected text surrounded by hybrid formatting (bold and italics),
     * the formatting is undone in the order of which formatting button
     * was clicked
     *
     * A hybrid formatted text selection will become bold if user clicks
     * italicize button and consequently the same if done the opposite way
     */
    const undoHybrid = () => {
        const j = (type === 'b') ? 1 : 2
        const start0 = textbox.selectionStart - 3, end0 = textbox.selectionEnd + 3
        textbox.setRangeText(
            (type === 'b') ? `*${selection}*` : `**${selection}**`,
            start0,
            end0
        )
        const start = textbox.selectionStart + j, end = textbox.selectionEnd - j
        textbox.setSelectionRange(start, end)
    }

    /**
     * For selected text surrounded by either bold or italic formatting,
     * remove the formatting and highlight the unformatted text
     */
    const undoBoldItalic = () => {
        const start = textbox.selectionStart - i, end = textbox.selectionEnd + i
        textbox.setSelectionRange(start, end)
        textbox.setRangeText(selection.toString())
    }

    if (selection.toString() !== '') {
        if (checkFormat(3) === null) placeBoldItalic(insertSelected)
        else if (checkFormat(3) === 'bi') undoHybrid()
        else undoBoldItalic()
    } else {
        placeBoldItalic(insertDefault)
    }
    textbox.focus()
    previewContainers[2].innerHTML = marked(textbox.value)
}

/**
 * Determines the type of decoration that's currently selected
 * @param {int} i - the number of iterations to loop
 * @returns {string} the identifier for the type of decoration
 */
const checkFormat = i => {
    const textbox = textAreas[2], text = textbox.value
    const before = text.charAt(textbox.selectionStart - i) === '*'
    const after = text.charAt(textbox.selectionEnd + Math.abs(1 - i)) === '*'
    if (before && after) {
        switch (true) {
            case i === 3: return 'bi'
            case i === 2: return 'b'
            case i === 1: return 'i'
        }
    }
    if (i === 1) return null
    return checkFormat(i - 1)
}

/**
 * Controls appropriate text field cursor placement when
 * form is clicked from out-of-focus
 *
 * Will focus the last available field if it has been invoked
 * as visible
 *
 * @param {Event} event - for recognizing text form click
 * // TODO switch issue
 */
textForm.onclick = event => {
    if (event.target === event.currentTarget) {
        const fields = Array.from(textForm.children).slice(0, 3),
            toggableFields = fields.slice(1),
            visibleFields = [fields[0]]
        toggableFields.forEach(field => {
            if (field.style.visibility === 'visible') visibleFields.push(field)
        })
        const field = visibleFields.pop()
        field.focus()
        field.setSelectionRange(field.value.length, field.value.length)
    }
}

/**
 * textForm and preview must scroll simultaneously
 * // TODO fix padding?
 */
textForm.onscroll = function () {
    preview.scrollTop = this.scrollTop
}

preview.onscroll = function () {
    textForm.scrollTop = this.scrollTop
}

/**
 * Arrow, tab and enter behavior for each individual
 * text area in the post form
 */
textAreas.forEach((textArea, i) => {
    switch (i) {
        case 0: textArea.onkeydown = event => {
            if (event.key === "Enter"
                || (event.key === "ArrowDown" && event.target.value.length > 0))
                nextField(event, textAreas[i + 1])
            if (event.key === "Tab") event.preventDefault()
        }; break
        case 1: textArea.onkeydown = event => {
            if (event.key === "ArrowDown" || event.key === "Enter")
                nextField(event, textAreas[i + 1])
            if (event.key === "ArrowUp"
                || (event.key === "Backspace" && event.target.value === ""))
                prevField(event, textAreas[i - 1])
            if (event.key === "Tab") event.preventDefault()
        }; break
        case 2: {
            textArea.onkeydown = event => {
                if ((event.key === "Backspace" && event.target.value === "")
                    || (event.key === "ArrowUp" && getRowNumber(event.target) === 1))
                    prevField(event, textAreas[i - 1])
                if (event.key === "Tab") tabHandle(event)
                if (event.ctrlKey && event.key === "Enter")
                    document.getElementById('save-button').click()
            }
            textArea.oninput = event => {
                previewContainers[i].innerHTML = marked(textArea.value)
                wrapText(event)
            }
        }
    }
    if (i !== 2) textArea.oninput = event => {
        previewContainers[i].innerHTML = textArea.value
        wrapText(event)
    }
})

/**
 * Using a text area, find the row numbers
 * @param {HTMLElement} textarea - the text area to manipulate
 * @returns {int} the row number deciphered by the textarea
 */
const getRowNumber = textarea => textarea.value
    .substr(0, textarea.selectionStart)
    .split("\n").length

/**
 * Determine visibility action for following element through
 * use of directional keyboard input
 * @param {Event} event - to prevent and capture invoked element
 * @param {HTMLElement} next - the next element to analyze
 */
const nextField = (event, next) => {
    const current = event.target
    event.preventDefault()
    current.value = current.value.trim()
    next.style.visibility = "visible"
    next.focus()
}

/**
 * Determine visibility action for the preceding element through
 * use of directional keyboard input
 * @param {Event} event - to prevent and capture invoked element
 * @param {HTMLElement} previous - the previous element to analyze
 */
const prevField = (event, previous) => {
    const current = event.target
    event.preventDefault()
    if (current.value === "" && event.target !== textAreas[1])
        current.style.visibility = ""

    previous.focus()
}

/**
 * Force text wrapping on the targeted text area element
 * @param {HTMLElement} target - the targeted text area
 */
const wrapText = ({ target }) => {
    target.style.height = 'auto'
    target.style.height = target.scrollHeight + 'px'
}

/**
 * Overrides standard tab key behavior for typical character body
 * shifting
 * @param {Event} event - to prevent and capture invoked element
 */
const tabHandle = event => {
    event.preventDefault()
    const { target } = event,
        start = target.selectionStart,
        end = target.selectionEnd
    target.value = target.value.substring(0, start)
        + "\t" + target.value.substring(end)
    target.selectionStart = target.selectionEnd = start + 1
}

/**
 * On click, toggles markdown preview and prioritizes raw
 * input view
 */
previewButton.onclick = () => {
    if (preview.style.display === "none") {
        preview.style.display = ""
        textForm.style.width = ""
    } else {
        preview.style.display = "none"
        textForm.style.width = "100%"
    }
}

/**
 * Adds image to temporary buffer to be sent to server if article
 * is saved to DB
 * Points article to corresponding image files on server
 * Should discard buffer images if article is unsaved
 */
addImage.onclick = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.onchange = async event => {
        // Build image for sending to server
        const formData = new FormData()
        formData.append('uploadImage', event.target.files[0])
        const request = new Request('/posts/new',
            { method: 'PUT', body: formData }),
            response = await fetch(request),
            json = await response.json()
        // Retrieve image location to display to client
        const image = new Image()
        image.src = `../../${json.imagePath}`
        image.onclick = ({ target }) => {
            console.log(target.src)
            // TODO insert image link at cursor position
        }
        imagePanel.appendChild(image)
        // Compile all image names to send with form submission
        images.push(json.imageName)
        imageNames.value = images.join(',')
        // Destroy input source
        setTimeout(() => input.remove(), 100)
        console.log(images)
    }
    input.click()
}

/**
 * Takes a string of text and convert it to an HTML render of a
 * an article tag used for categorizing posts
 * @param {string} text - to be converted to an article tag
 * @returns {HTMLElement} a tag component
 */
const createTag = text => {
    const tag = document.createElement('span')
    tag.className = 'tag'
    tag.innerHTML = text
    tag.onclick = () => {
        tag.remove()
        tags = tags.filter(val => val !== tag.innerHTML)
        compiledTags.value = tags.join(',')
        console.log(tags)
    }
    tagContainer.appendChild(tag)
    return tag
}

/**
 * The function for adding a new tag to the article's compiled tags
 * @param {Event} event (key and target) - the on enter action
 * for recognizing a new tag
 */
tagField.onkeydown = ({ key, target }) => {
    if (key === 'Enter') {
        if (!tags.includes(target.value.toLowerCase())) {
            const tag = createTag(target.value.toLowerCase())
            tags.push(tag.innerHTML)
            target.value = ''
            compiledTags.value = tags.join(',')
            console.log(tags)
        } else {
            tagField.classList.add('invalid')
            setTimeout(() => tagField.classList.remove('invalid'), 600)
        }
    }
}

/**
 * For the /edit route as opposed to the /new route:
 * Display the tags associated with existing post
 * Display the images associated with existing post
 * Accept continual data and deletion of existing data
 */
if (window.location.pathname.includes('/edit/')) {
    // TODO on load, REGEX photos to tmp instead of server/images

    if (compiledTags.value.length > 0)
        compiledTags.value.split(',').forEach(val => {
            tags.push(val)
            createTag(val)
        })
    if (imageNames.value.length > 0) {
        imageNames.value.split(',').forEach(imageName => {
            images.push(imageName)
            const image = new Image()
            image.src = `/public/tmp/${imageName}`
            imagePanel.appendChild(image)
        })
    }
    window.onbeforeunload = async event => { // TODO apply to /new too
        const id = window.location.pathname.split('/').pop()
        fetch(new Request(`/posts/edit/${id}`, {
            method: 'DELETE',
            body: JSON.stringify({ images: images }),
            headers: { 'Content-Type': 'application/json' }
        }))
    }
}