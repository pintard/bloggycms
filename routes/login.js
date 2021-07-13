if (process.env.NODE_ENV !== 'production')
    require('dotenv').config()
const express = require('express')
const Router = express.Router()
const bcrypt = require('bcrypt')
const JWT = require('jsonwebtoken')
const User = require('../models/user')

// TODO expire the admin.disconnected
Router.route('/')
    .get(async (request, response) => {
        const token = request.cookies.JWT_token
        if (token) {
            JWT.verify(token, process.env.ACCESS_TOKEN_HASH, (error, decoded) => {
                if (error) {
                    console.log(error.message)
                    response.render('login')
                }
                response.redirect('/')
            })
        } else {
            const admin = await User.findOne()
            admin.updateOne({ session: false }).exec()
            if (admin.disconnected) {
                // console.log('disconnected', admin.disconnected)
                response.send('content not available')
            } else response.render('login')
        }
    })
    .post(async (request, response) => {
        const admin = await User.findOne(), { password } = request.body,
            IP = request.ip
                || request.socket.remoteAddress
                || request.headers['x-real-ip']
        try {
            if (await bcrypt.compare(password, admin.hash)) {
                console.log('successful login')
                const token = JWT.sign(
                    { id: admin._id, signed: Date.now() },
                    process.env.ACCESS_TOKEN_HASH
                )
                response.cookie('JWT_token', token, { httpOnly: true })
                admin.updateOne({
                    session: true,
                    IP: IP,
                    accessed: Date.now()
                }).exec()
                response.status(200).redirect('/')
            } else {
                admin.updateOne({ $inc: { 'attempts': 1 } }).exec()
                if (admin.attempts >= 5) {
                    console.log('error: too many logins. try again later')
                    admin.updateOne({ disconnected: true }).exec()
                    response.redirect('back')
                } else {
                    console.log('wrong password attempts', await admin.attempts + 1)
                    response.sendStatus(204)
                }
            }
        } catch (error) {
            console.log(error.toString())
            response.sendStatus(500)
        }
    })

module.exports = Router