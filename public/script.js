// ==========================================
// MAPA
// ==========================================

const mapa = L.map('map').setView(
    [-3.687, -40.348],
    15
);


// ==========================================
// MAPA BASE
// ==========================================

L.tileLayer(
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    {
        attribution: '&copy; OpenStreetMap contributors'
    }
).addTo(mapa);


// ==========================================
// ÍCONE DO ÔNIBUS
// ==========================================

const iconeOnibus = L.divIcon({
    className: 'icone-onibus',

    html: `
        <div class="bus-marker">
            🚌
        </div>
    `,

    iconSize: [50, 50],
    iconAnchor: [25, 25]
});


// ==========================================
// ÍCONE DAS PARADAS
// ==========================================

const iconeParada = L.divIcon({
    className: 'icone-parada',

    html: `
        <div class="parada-marker"></div>
    `,

    iconSize: [20, 20],
    iconAnchor: [10, 10]
});


// ==========================================
// PARADAS DO INTRA
// ==========================================

const paradas = [
    {
        nome: 'Mucambinho',
        latitude: -3.692662,
        longitude: -40.355196
    },

    {
        nome: 'Santa Casa',
        latitude: -3.692542,
        longitude: -40.359015
    },

    {
        nome: 'SPA',
        latitude: -3.688644,
        longitude: -40.353047
    },

    {
        nome: 'Cadeia Criativa',
        latitude: -3.684791,
        longitude: -40.351818
    },

    {
        nome: 'Goiabão',
        latitude: -3.683724,
        longitude: -40.342820
    },

    {
        nome: 'FAMED',
        latitude: -3.682058,
        longitude: -40.337247
    },

    {
        nome: 'Receita Federal',
        latitude: -3.683589,
        longitude: -40.342269
    },

    {
        nome: 'SPA',
        latitude: -3.688881,
        longitude: -40.353267
    }
];


// ==========================================
// COLOCAR PARADAS NO MAPA
// ==========================================

paradas.forEach(function (parada) {

    L.marker(
        [
            parada.latitude,
            parada.longitude
        ],
        {
            icon: iconeParada
        }
    )
    .addTo(mapa)
    .bindPopup(parada.nome);

});


// ==========================================
// VARIÁVEIS
// ==========================================

let marcadorOnibus = null;


// ==========================================
// CONTROLE DA ROTA
// ==========================================

// Índice da última parada que o ônibus alcançou.
// -1 significa que ainda não chegou em nenhuma.
let indiceUltimaParada = -1;


// Distância máxima para considerar que o ônibus
// chegou a uma parada.
const DISTANCIA_PARADA = 100;


// ==========================================
// ELEMENTOS DO HUD DA PÁGINA INICIAL
// ==========================================

const elementoUltimaParada =
    document.getElementById('ultima-parada');

const elementoProximaParada =
    document.getElementById('proxima-parada');


// ==========================================
// FUNÇÃO DE DISTÂNCIA
// ==========================================

function calcularDistancia(
    latitude1,
    longitude1,
    latitude2,
    longitude2
) {

    const R = 6371000;

    const diferencaLatitude =
        (latitude2 - latitude1) *
        Math.PI / 180;

    const diferencaLongitude =
        (longitude2 - longitude1) *
        Math.PI / 180;

    const latitude1Rad =
        latitude1 *
        Math.PI / 180;

    const latitude2Rad =
        latitude2 *
        Math.PI / 180;


    const a =
        Math.sin(diferencaLatitude / 2) *
        Math.sin(diferencaLatitude / 2) +

        Math.cos(latitude1Rad) *
        Math.cos(latitude2Rad) *

        Math.sin(diferencaLongitude / 2) *
        Math.sin(diferencaLongitude / 2);


    const c =
        2 *
        Math.atan2(
            Math.sqrt(a),
            Math.sqrt(1 - a)
        );


    return R * c;
}


// ==========================================
// ATUALIZAR ÚLTIMA E PRÓXIMA PARADA
// ==========================================

function atualizarParadas(
    latitude,
    longitude
) {

    // --------------------------------------
    // Se não existem elementos no HUD,
    // não faz nada.
    // --------------------------------------

    if (
        !elementoUltimaParada ||
        !elementoProximaParada
    ) {
        return;
    }


    // --------------------------------------
    // Procurar a parada mais próxima
    // --------------------------------------

    let indiceMaisProximo = -1;

    let menorDistancia = Infinity;


    paradas.forEach(
        function (parada, indice) {

            const distancia =
                calcularDistancia(
                    latitude,
                    longitude,
                    parada.latitude,
                    parada.longitude
                );


            if (
                distancia < menorDistancia
            ) {

                menorDistancia =
                    distancia;

                indiceMaisProximo =
                    indice;
            }

        }
    );


    if (
        indiceMaisProximo === -1
    ) {
        return;
    }


    // --------------------------------------
    // Verificar se chegou a uma parada
    // --------------------------------------

    if (
        menorDistancia <= DISTANCIA_PARADA
    ) {

        /*
         * Só avançamos na ordem da rota.
         *
         * Isso evita que o sistema volte
         * para uma parada anterior só porque
         * ela ficou mais próxima novamente.
         */

        if (
            indiceMaisProximo >
            indiceUltimaParada
        ) {

            indiceUltimaParada =
                indiceMaisProximo;
        }

    }


    // --------------------------------------
    // ÚLTIMA PARADA
    // --------------------------------------

    if (
        indiceUltimaParada === -1
    ) {

        elementoUltimaParada.textContent =
            'Nenhuma ainda';

    } else {

        elementoUltimaParada.textContent =
            paradas[
                indiceUltimaParada
            ].nome;
    }


    // --------------------------------------
    // PRÓXIMA PARADA
    // --------------------------------------

    const indiceProximaParada =
        indiceUltimaParada + 1;


    if (
        indiceProximaParada >=
        paradas.length
    ) {

        elementoProximaParada.textContent =
            'Final da rota';

    } else {

        elementoProximaParada.textContent =
            paradas[
                indiceProximaParada
            ].nome;
    }

}


// ==========================================
// SOCKET.IO
// ==========================================

const socket = io();

socket.on('connect', function() {

    console.log(
        '✅ SOCKET.IO CONECTADO:',
        socket.id
    );

});

socket.on('connect_error', function(erro) {

    console.error(
        '❌ ERRO SOCKET.IO:',
        erro.message
    );

});

socket.on('disconnect', function(motivo) {

    console.log(
        '🔴 SOCKET.IO DESCONECTADO:',
        motivo
    );

});


// ==========================================
// RECEBER LOCALIZAÇÃO DO INTRA
// ==========================================

socket.on(
    'localizacoes-intra',
    function (localizacoes) {

        console.log(
            'LOCALIZAÇÕES RECEBIDAS:',
            localizacoes
        );


        // ==================================
        // NENHUMA LOCALIZAÇÃO
        // ==================================

        if (
            !Array.isArray(localizacoes) ||
            localizacoes.length === 0
        ) {

            if (marcadorOnibus) {

                mapa.removeLayer(
                    marcadorOnibus
                );

                marcadorOnibus = null;
            }


            atualizarStatusOffline();

            return;
        }


        // ==================================
        // PEGAR LOCALIZAÇÃO DO MOTORISTA
        // ==================================

        const localizacao =
            localizacoes[0];


        // ==================================
        // VALIDAR LOCALIZAÇÃO
        // ==================================

        if (
            !localizacao ||
            typeof localizacao.latitude !== 'number' ||
            typeof localizacao.longitude !== 'number'
        ) {

            console.log(
                'Localização recebida é inválida.'
            );

            atualizarStatusOffline();

            return;
        }


        const posicao = [
            localizacao.latitude,
            localizacao.longitude
        ];


        console.log(
            'POSIÇÃO DO INTRA:',
            posicao
        );


        // ==================================
        // ATUALIZAR ÚLTIMA E PRÓXIMA PARADA
        // ==================================

        atualizarParadas(
            localizacao.latitude,
            localizacao.longitude
        );


        // ==================================
        // CRIAR MARCADOR DO ÔNIBUS
        // ==================================

        if (
            marcadorOnibus === null
        ) {

            marcadorOnibus =
                L.marker(
                    posicao,
                    {
                        icon: iconeOnibus
                    }
                )
                .addTo(mapa);

        }


        // ==================================
        // ATUALIZAR MARCADOR
        // ==================================

        else {

            marcadorOnibus.setLatLng(
                posicao
            );

        }


        // ==================================
        // ATUALIZAR STATUS
        // ==================================

        atualizarStatusOnline();

    }
);


// ==========================================
// BOTÃO CENTRALIZAR NO ÔNIBUS
// ==========================================

const botaoCentralizar =
    document.getElementById('centralizar');


if (botaoCentralizar) {

    botaoCentralizar.addEventListener(
        'click',
        function () {

            console.log(
                'Centralizando no Intra...'
            );


            // ==================================
            // VERIFICAR SE O ÔNIBUS ESTÁ NO MAPA
            // ==================================

            if (
                marcadorOnibus === null
            ) {

                alert(
                    'O Intra ainda não possui localização.'
                );

                return;
            }


            // ==================================
            // PEGAR POSIÇÃO ATUAL DO ÔNIBUS
            // ==================================

            const posicao =
                marcadorOnibus.getLatLng();


            console.log(
                'POSIÇÃO DO INTRA:',
                posicao.lat,
                posicao.lng
            );


            // ==================================
            // CENTRALIZAR MAPA
            // ==================================

            mapa.setView(
                [
                    posicao.lat,
                    posicao.lng
                ],
                17,
                {
                    animate: true
                }
            );

        }
    );

}


// ==========================================
// STATUS ONLINE
// ==========================================

function atualizarStatusOnline() {

    const status =
        document.getElementById(
            'status-container'
        );

    const indicador =
        document.getElementById(
            'status-indicator'
        );

    const texto =
        document.getElementById(
            'status-onibus'
        );


    if (status) {

        status.className =
            'status-localizado';

    }


    if (indicador) {

        indicador.className =
            'indicador-online';

    }


    if (texto) {

        texto.textContent =
            'Intra localizado';

    }


    const atualizacao =
        document.getElementById(
            'atualizacao'
        );


    if (atualizacao) {

        atualizacao.textContent =
            'Localização atualizada agora';

    }


    const statusLocalizacao =
        document.getElementById(
            'status-localizacao'
        );


    if (statusLocalizacao) {

        statusLocalizacao.textContent =
            'Online';

    }

}


// ==========================================
// STATUS OFFLINE
// ==========================================

function atualizarStatusOffline() {

    const status =
        document.getElementById(
            'status-container'
        );

    const indicador =
        document.getElementById(
            'status-indicator'
        );

    const texto =
        document.getElementById(
            'status-onibus'
        );


    if (status) {

        status.className =
            'status-sem-localizacao';

    }


    if (indicador) {

        indicador.className =
            'indicador-offline';

    }


    if (texto) {

        texto.textContent =
            'Intra sem localização';

    }


    const atualizacao =
        document.getElementById(
            'atualizacao'
        );


    if (atualizacao) {

        atualizacao.textContent =
            'Nenhuma localização compartilhada';

    }


    const statusLocalizacao =
        document.getElementById(
            'status-localizacao'
        );


    if (statusLocalizacao) {

        statusLocalizacao.textContent =
            'Offline';

    }


    // ======================================
    // LIMPAR HUD
    // ======================================

    if (elementoUltimaParada) {

        elementoUltimaParada.textContent =
            'Aguardando localização';

    }


    if (elementoProximaParada) {

        elementoProximaParada.textContent =
            'Aguardando localização';

    }

}