import http from 'http';
import { Server } from 'socket.io';

const server = http.createServer();

const io = new Server(server);

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

export default server;