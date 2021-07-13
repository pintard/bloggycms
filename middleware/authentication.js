const JWT = require('jsonwebtoken')

function verifyToken(request, response, next) {
    const token = request.cookies.JWT_token
    if (token) {
        JWT.verify(token, process.env.ACCESS_TOKEN_HASH, (error, decoded) => {
            if (error) {
                console.log(error.message)
                response.redirect('/login')
            }
            next()
        })
    }
    else response.redirect('/login')
}

module.exports = { verifyToken }