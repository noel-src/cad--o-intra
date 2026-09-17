const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const servidor = http.createServer(app);
const path = require('path');
const io = new Server(servidor);

const PORTA = process.env.PORT || 3000;;


// ==========================================
// CHAVE DO MOTORISTA
// ==========================================

// IMPORTANTE:
// Esta chave fica somente no servidor.
// Ela NÃO deve ser colocada no script.js.

const CHAVE_MOTORISTA = 'INTRA-MOTORISTA-2026';


// ==========================================
// SERVIR OS ARQUIVOS DO SITE
// ==========================================

app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});


// ==========================================
// LOCALIZAÇÕES COMPARTILHADAS
// ==========================================

let localizacoes = {};


// ==========================================
// TEMPO MÁXIMO SEM ATUALIZAÇÃO
// ==========================================

const TEMPO_MAXIMO_SEM_ATUALIZACAO = 60000;


// ==========================================
// INTERVALO MÍNIMO ENTRE ATUALIZAÇÕES
// ==========================================

// Evita que alguém tente enviar milhares
// de localizações em pouco tempo.

const INTERVALO_MINIMO_ATUALIZACAO = 1000;


// ==========================================
// CONEXÃO DOS USUÁRIOS
// ==========================================

io.on('connection', (socket) => {

    console.log(
        'Usuário conectado:',
        socket.id
    );


    // ======================================
    // AUTORIZAÇÃO
    // ======================================

    // Cada conexão começa sem autorização.

    socket.motoristaAutorizado = false;

    socket.ultimaAtualizacao = 0;


    // ======================================
    // ENVIAR LOCALIZAÇÕES ATUAIS
    // ======================================

    const localizacoesAtuais =
        Object.values(localizacoes);

    if (
        localizacoesAtuais.length > 0
    ) {

        socket.emit(
            'localizacoes-intra',
            localizacoesAtuais
        );

    }


    // ======================================
    // AUTENTICAR MOTORISTA
    // ======================================

    socket.on(
        'autenticar-motorista',
        (chave) => {

            // Verificar se a chave é uma string

            if (
                typeof chave !== 'string'
            ) {

                socket.emit(
                    'autenticacao-motorista',
                    {
                        sucesso: false,
                        mensagem: 'Chave inválida.'
                    }
                );

                return;

            }


            // Verificar a chave

            if (
                chave !== CHAVE_MOTORISTA
            ) {

                console.log(
                    'Tentativa de autenticação recusada:',
                    socket.id
                );

                socket.motoristaAutorizado = false;

                socket.emit(
                    'autenticacao-motorista',
                    {
                        sucesso: false,
                        mensagem: 'Chave incorreta.'
                    }
                );

                return;

            }


            // ==================================
            // MOTORISTA AUTORIZADO
            // ==================================

            socket.motoristaAutorizado = true;

            console.log(
                'Motorista autorizado:',
                socket.id
            );

            socket.emit(
                'autenticacao-motorista',
                {
                    sucesso: true,
                    mensagem: 'Motorista autorizado.'
                }
            );

        }
    );


    // ======================================
    // RECEBER LOCALIZAÇÃO
    // ======================================

    socket.on(
        'atualizar-localizacao',
        (dados) => {

            // ==================================
            // VERIFICAR AUTORIZAÇÃO
            // ==================================

            if (
                socket.motoristaAutorizado !== true
            ) {

                console.log(
                    'Localização rejeitada: usuário não autorizado.',
                    socket.id
                );

                return;

            }


            // ==================================
            // VERIFICAR DADOS
            // ==================================

            if (
                dados === null ||
                typeof dados !== 'object'
            ) {

                console.log(
                    'Dados de localização inválidos:',
                    socket.id
                );

                return;

            }


            // ==================================
            // VERIFICAR LATITUDE E LONGITUDE
            // ==================================

            if (
                typeof dados.latitude !== 'number' ||
                typeof dados.longitude !== 'number'
            ) {

                console.log(
                    'Coordenadas inválidas:',
                    socket.id
                );

                return;

            }


            // ==================================
            // IMPEDIR NaN E INFINITY
            // ==================================

            if (
                !Number.isFinite(dados.latitude) ||
                !Number.isFinite(dados.longitude)
            ) {

                console.log(
                    'Coordenadas não finitas:',
                    socket.id
                );

                return;

            }


            // ==================================
            // LIMITES GEOGRÁFICOS
            // ==================================

            if (
                dados.latitude < -90 ||
                dados.latitude > 90 ||
                dados.longitude < -180 ||
                dados.longitude > 180
            ) {

                console.log(
                    'Coordenadas fora dos limites:',
                    socket.id
                );

                return;

            }


            // ==================================
            // LIMITAR FREQUÊNCIA
            // ==================================

            const agora =
                Date.now();

            const tempoDesdeUltimaAtualizacao =
                agora -
                socket.ultimaAtualizacao;

            if (
                tempoDesdeUltimaAtualizacao <
                INTERVALO_MINIMO_ATUALIZACAO
            ) {

                console.log(
                    'Atualização muito rápida:',
                    socket.id
                );

                return;

            }


            socket.ultimaAtualizacao =
                agora;


            // ==================================
            // SALVAR LOCALIZAÇÃO
            // ==================================

            localizacoes[socket.id] = {

                id:
                    socket.id,

                latitude:
                    dados.latitude,

                longitude:
                    dados.longitude,

                horario:
                    agora

            };


            console.log(
                'Nova localização do motorista:',
                socket.id,
                dados.latitude,
                dados.longitude
            );


            // ==================================
            // ENVIAR LOCALIZAÇÃO
            // ==================================

            io.emit(
                'localizacoes-intra',
                Object.values(localizacoes)
            );

        }
    );


    // ======================================
    // PARAR COMPARTILHAMENTO
    // ======================================

    socket.on(
        'parar-localizacao',
        () => {

            if (
                localizacoes[socket.id]
            ) {

                console.log(
                    'Compartilhamento encerrado:',
                    socket.id
                );


                delete localizacoes[
                    socket.id
                ];


                io.emit(
                    'localizacoes-intra',
                    Object.values(localizacoes)
                );

            }

        }
    );


    // ======================================
    // DESCONECTAR
    // ======================================

    socket.on(
        'disconnect',
        () => {

            console.log(
                'Usuário desconectado:',
                socket.id
            );


            if (
                localizacoes[socket.id]
            ) {

                delete localizacoes[
                    socket.id
                ];


                io.emit(
                    'localizacoes-intra',
                    Object.values(localizacoes)
                );

            }

        }
    );

});


// ==========================================
// REMOVER LOCALIZAÇÕES ANTIGAS
// ==========================================

setInterval(
    () => {

        const agora =
            Date.now();


        let houveAlteracao =
            false;


        Object.keys(localizacoes).forEach(
            (id) => {

                const localizacao =
                    localizacoes[id];


                const tempoSemAtualizacao =
                    agora -
                    localizacao.horario;


                if (
                    tempoSemAtualizacao >
                    TEMPO_MAXIMO_SEM_ATUALIZACAO
                ) {

                    console.log(
                        'Localização expirada:',
                        id
                    );


                    delete localizacoes[
                        id
                    ];


                    houveAlteracao =
                        true;

                }

            }
        );


        // ==================================
        // AVISAR OS CLIENTES
        // ==================================

        if (
            houveAlteracao
        ) {

            io.emit(
                'localizacoes-intra',
                Object.values(localizacoes)
            );

        }

    },
    5000
);


// ==========================================
// INICIAR SERVIDOR
// ==========================================

servidor.listen(
    PORTA,
    () => {

        console.log(
            `Servidor rodando em http://localhost:${PORTA}`
        );

    }
);