const http = require('http');
const { Server } = require('socket.io');

const servidor = http.createServer();

const io = new Server(servidor, {
    addTrailingSlash: false,
    cors: {
        origin: '*'
    }
});

io.on('connection', (socket) => {
    console.log('USUÁRIO CONECTADO:', socket.id);

    socket.emit('teste-resposta', {
        mensagem: 'Socket.IO funcionando no Vercel!'
    });

    socket.on('teste', (mensagem) => {
        console.log('TESTE RECEBIDO:', mensagem);

        socket.emit('teste-resposta', {
            mensagem: 'Mensagem recebida pelo servidor!'
        });
    });

    socket.on('disconnect', () => {
        console.log('USUÁRIO DESCONECTADO:', socket.id);
    });
});

module.exports = servidor;