const loginForm = document.getElementById('login-form'),
    [loginLabel, loginField] = loginForm.children

/**
 * The interactive login validation function
 * @param {Event} event - the event to be prevented
 */
loginForm.onsubmit = async event => {
    event.preventDefault()
    const { floor, random } = Math,
        wtfArray = ['¿?¿?¿?', 'stop🤬', '💩💩💩💩', '😡😡😡'],
        randomIndex = floor(random() * wtfArray.length)
    const request = new Request('/login', {
        method: 'POST',
        credentials: 'same-origin',
        body: JSON.stringify({ password: loginField.value }),
        headers: { 'Content-Type': 'application/json' }
    })
    const response = await fetch(request)
    if (response.status === 200 && response.redirected)
        window.location.href = '/'
    else {
        console.log("wrong password", response)
        loginField.classList.add('invalid')
        loginLabel.classList.add('invalid')
        loginLabel.innerHTML = wtfArray[randomIndex]
        setTimeout(() => {
            loginField.classList.remove('invalid')
            loginLabel.classList.remove('invalid')
            loginLabel.innerHTML = 'login'
        }, 600)
        loginField.value = ''
    }
}