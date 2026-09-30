const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');

const app = express();

app.get('/', (req, res) => {
    res.json({
        status: 'online',
        mensagem: 'Backend do Cadê o Intra funcionando!'
    });
});

const servidor = createServer(app);

const io = new Server(servidor, {
    cors: {
        origin: '*'
    }
});

io.on('connection', (socket) => {
    console.log('Usuário conectado:', socket.id);

    socket.emit('teste-resposta', {
        mensagem: 'Socket.IO funcionando no Vercel!'
    });

    socket.on('teste', (mensagem) => {
        console.log('Teste recebido:', mensagem);

        socket.emit('teste-resposta', {
            mensagem: 'Mensagem recebida pelo servidor!'
        });
    });

    socket.on('disconnect', () => {
        console.log('Usuário desconectado:', socket.id);
    });
});

module.exports = servidor;