const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

const users = {};

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('set-username', (username) => {
        if (username) {
            users[username] = socket.id;
            socket.username = username;
            console.log(`Username set for ${socket.id}: ${username}`);
        } else {
            delete users[socket.username];
            socket.username = null;
        }
        io.emit('user-list', users);
    });

    socket.on('offer', (data) => {
        const { offer, username, targetUsername } = data;
        const targetSocketId = users[targetUsername];
        if (targetSocketId) {
            io.to(targetSocketId).emit('offer', { offer, username });
        }
    });

    socket.on('answer', (data) => {
        const { answer, username, targetUsername } = data;
        const targetSocketId = users[targetUsername];
        if (targetSocketId) {
            io.to(targetSocketId).emit('answer', { answer, username });
        }
    });

    socket.on('ice-candidate', (data) => {
        const { candidate, username, targetUsername } = data;
        const targetSocketId = users[targetUsername];
        if (targetSocketId) {
            io.to(targetSocketId).emit('ice-candidate', { candidate, username });
        }
    });

    socket.on('hangup', (data) => {
        const { username, targetUsername } = data;
        const targetSocketId = users[targetUsername];
        if (targetSocketId) {
            io.to(targetSocketId).emit('hangup');
        }
    });

    socket.on('disconnect', () => {
        if (socket.username) {
            delete users[socket.username];
            io.emit('user-list', users);
        }
        console.log('User disconnected:', socket.id);
    });
});

server.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});