// ==========================================
// CADÊ O INTRA?
// SERVIDOR PRINCIPAL
// ==========================================

import express from 'express';
import { createServer } from 'node:http';
import { Server, Socket } from 'socket.io';
import path from 'node:path';


// ==========================================
// CONFIGURAÇÃO
// ==========================================

const app = express();

const servidor = createServer(app);

const io = new Server(servidor);

const PORTA = Number(process.env.PORT) || 3000;


// ==========================================
// CHAVE DO MOTORISTA
// ==========================================

const CHAVE_MOTORISTA = 'INTRA-MOTORISTA-2026';


// ==========================================
// SERVIR OS ARQUIVOS DO SITE
// ==========================================

const pastaProjeto = process.cwd();

app.use(
    express.static(
        path.join(pastaProjeto, 'public')
    )
);


// ==========================================
// PÁGINA PRINCIPAL
// ==========================================

app.get('/', (req, res) => {

    res.sendFile(
        path.join(
            pastaProjeto,
            'index.html'
        )
    );

});


// ==========================================
// LOCALIZAÇÕES COMPARTILHADAS
// ==========================================

interface Localizacao {

    id: string;

    latitude: number;

    longitude: number;

    horario: number;

}


const localizacoes: Record<string, Localizacao> = {};

// Identificador fixo do ônibus: mantém uma única localização
// mesmo que a conexão Socket.IO do motorista seja restabelecida.
const ID_INTRA = 'intra';


// ==========================================
// ESTADO DOS MOTORISTAS
// ==========================================

interface EstadoMotorista {

    autorizado: boolean;

    ultimaAtualizacao: number;

}


const estadosMotoristas =
    new Map<string, EstadoMotorista>();


// ==========================================
// INTERVALO MÍNIMO ENTRE ATUALIZAÇÕES
// ==========================================

const INTERVALO_MINIMO_ATUALIZACAO = 1000;


// ==========================================
// CONEXÃO DOS USUÁRIOS
// ==========================================

io.on(
    'connection',
    (socket: Socket) => {

        console.log(
            'Usuário conectado:',
            socket.id
        );


        // ==================================
        // CRIAR ESTADO DO SOCKET
        // ==================================

        estadosMotoristas.set(
            socket.id,
            {
                autorizado: false,
                ultimaAtualizacao: 0
            }
        );


        // ==================================
        // ENVIAR LOCALIZAÇÕES ATUAIS
        // ==================================

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


        // ==================================
        // AUTENTICAR MOTORISTA
        // ==================================

        socket.on(
            'autenticar-motorista',
            (chave: unknown) => {

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


                if (
                    chave !== CHAVE_MOTORISTA
                ) {

                    console.log(
                        'Tentativa de autenticação recusada:',
                        socket.id
                    );


                    const estado =
                        estadosMotoristas.get(
                            socket.id
                        );


                    if (estado) {

                        estado.autorizado =
                            false;

                    }


                    socket.emit(
                        'autenticacao-motorista',
                        {
                            sucesso: false,
                            mensagem: 'Chave incorreta.'
                        }
                    );

                    return;

                }


                const estado =
                    estadosMotoristas.get(
                        socket.id
                    );


                if (estado) {

                    estado.autorizado =
                        true;

                }


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


        // ==================================
        // RECEBER LOCALIZAÇÃO
        // ==================================

        socket.on(
            'atualizar-localizacao',
            (dados: unknown) => {

                const estado =
                    estadosMotoristas.get(
                        socket.id
                    );


                // ==========================
                // VERIFICAR AUTORIZAÇÃO
                // ==========================

                if (
                    !estado ||
                    estado.autorizado !== true
                ) {

                    console.log(
                        'Localização rejeitada: usuário não autorizado.',
                        socket.id
                    );

                    return;

                }


                // ==========================
                // VALIDAR DADOS
                // ==========================

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


                const localizacaoRecebida =
                    dados as {
                        latitude?: unknown;
                        longitude?: unknown;
                    };


                // ==========================
                // VALIDAR COORDENADAS
                // ==========================

                if (
                    typeof localizacaoRecebida.latitude !== 'number' ||
                    typeof localizacaoRecebida.longitude !== 'number'
                ) {

                    console.log(
                        'Coordenadas inválidas:',
                        socket.id
                    );

                    return;

                }


                const latitude =
                    localizacaoRecebida.latitude;

                const longitude =
                    localizacaoRecebida.longitude;


                // ==========================
                // VERIFICAR NÚMEROS
                // ==========================

                if (
                    !Number.isFinite(latitude) ||
                    !Number.isFinite(longitude)
                ) {

                    console.log(
                        'Coordenadas não finitas:',
                        socket.id
                    );

                    return;

                }


                // ==========================
                // VERIFICAR LIMITES
                // ==========================

                if (
                    latitude < -90 ||
                    latitude > 90 ||
                    longitude < -180 ||
                    longitude > 180
                ) {

                    console.log(
                        'Coordenadas fora dos limites:',
                        socket.id
                    );

                    return;

                }


                // ==========================
                // LIMITAR FREQUÊNCIA
                // ==========================

                const agora =
                    Date.now();


                const tempoDesdeUltimaAtualizacao =
                    agora -
                    estado.ultimaAtualizacao;


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


                estado.ultimaAtualizacao =
                    agora;


                // ==========================
                // SALVAR LOCALIZAÇÃO
                // ==========================

                localizacoes[ID_INTRA] = {

                    id: ID_INTRA,

                    latitude: latitude,

                    longitude: longitude,

                    horario: agora

                };


                console.log(
                    'Nova localização do motorista:',
                    socket.id,
                    latitude,
                    longitude
                );


                // ==========================
                // ENVIAR PARA OS USUÁRIOS
                // ==========================

                io.emit(
                    'localizacoes-intra',
                    Object.values(localizacoes)
                );

            }
        );


        // ==================================
        // PARAR LOCALIZAÇÃO
        // ==================================

        socket.on(
            'parar-localizacao',
            () => {

                const estado =
                    estadosMotoristas.get(socket.id);

                if (!estado || estado.autorizado !== true) {
                    console.log(
                        'Tentativa não autorizada de parar a localização:',
                        socket.id
                    );
                    return;
                }

                if (localizacoes[ID_INTRA]) {

                    console.log(
                        'Compartilhamento encerrado:',
                        socket.id
                    );

                    delete localizacoes[ID_INTRA];

                    io.emit(
                        'localizacoes-intra',
                        Object.values(localizacoes)
                    );

                }

            }
        );


        // ==================================
        // DESCONECTAR
        // ==================================

        socket.on(
            'disconnect',
            () => {

                console.log(
                    'Usuário desconectado:',
                    socket.id
                );


                // Não remover a última localização na desconexão.
                // Ela só é apagada quando o motorista envia
                // o evento 'parar-localizacao'.


                estadosMotoristas.delete(
                    socket.id
                );

            }
        );

    }
);


// ==========================================
// INICIAR SERVIDOR
// ==========================================

servidor.listen(
    PORTA,
    () => {

        console.log(
            `Servidor rodando na porta ${PORTA}`
        );

    }
);