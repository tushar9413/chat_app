const path = require('path')
const express = require('express')
const http = require('http')
const socketio = require('socket.io');
const { generateMessage, generateLocationMessage } = require('./utils/messages')
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users')

const app = express()
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT || 3000
const publicPath = path.join(__dirname, '../public')

app.use(express.static(publicPath))

io.on('connection', (socket) => {
    console.log('New Websocket connection')

    socket.on('join', ({ username, room }, callback) => {
        const { error, user } = addUser({ id: socket.id, username, room })

        if (error) {
            return callback(error)
        }

        socket.join(user.room);

        socket.emit("message", generateMessage("Admin", 'Welcome!'))
        socket.broadcast.to(room).emit('message', generateMessage("Admin", `${user.username} has joined`));
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })


        callback()
    })

    socket.on('sendMessage', (message, callback) => {

        const user = getUser(socket.id)

        io.to(user.room).emit('message', generateMessage(user.username, message));
        callback("Delivered!")

    });

    socket.on('typing', callback => {

        const user = getUser(socket.id)

        io.to(user.room).emit('typing', user.username);
    })

    socket.on('not Typing', callback => {

        const user = getUser(socket.id)

        io.to(user.room).emit('not Typing', user.username);
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id)

        if (user) {
            io.to(user.room).emit('message', generateMessage("Admin", `${user.username} has left the chat!`));
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }

    })

    socket.on('sendLocation', (location, callback) => {
        const user = getUser(socket.id)
        io.to(user.room).emit("locationMessage", generateLocationMessage(user.username, `https://google.com/maps?q=${location.latitude},${location.longitude}`))
        callback('Location Delivered!!!');
    })
})


server.listen(port, () => {
    console.log("Server is running");
})
