const http = require('http');
const { Server } = require('socket.io');

const servidor = http.createServer();

const io = new Server(servidor, {
    path: '/api/socket-io/socket.io',
    cors: {
        origin: '*'
    }
});

io.on('connection', (socket) => {
    console.log('Usuário conectado:', socket.id);

    console.log('Conexão Socket.IO estabelecida.');

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