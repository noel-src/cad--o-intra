const express = require('express');
const { Server } = require('socket.io');

const app = express();

const io = new Server(app, {
    cors: {
        origin: '*'
    }
});

io.on('connection', (socket) => {
    console.log('Usuário conectado:', socket.id);

    socket.on('teste', (mensagem) => {
        console.log('Teste recebido:', mensagem);

        socket.emit('teste-resposta', {
            mensagem: 'Servidor Vercel funcionando!'
        });
    });

    socket.on('disconnect', () => {
        console.log('Usuário desconectado:', socket.id);
    });
});

module.exports = app;