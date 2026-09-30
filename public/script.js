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
// SOCKET.IO
// ==========================================

const socket = io({
    path: '/api/socket-io/socket.io',
    transports: ['websocket']
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

document
    .getElementById('centralizar')
    .addEventListener(
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

}