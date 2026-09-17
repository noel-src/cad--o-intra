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

let marcadorMinhaLocalizacao = null;

let localizacoesRecebidas = [];

let watchID = null;

let motoristaAutorizado = false;


// ==========================================
// SOCKET.IO
// ==========================================

const socket = io();


// ==========================================
// CALCULAR DISTÂNCIA ENTRE DUAS COORDENADAS
// ==========================================

function calcularDistanciaMetros(
    latitude1,
    longitude1,
    latitude2,
    longitude2
) {

    const R = 6371000;

    const lat1 =
        latitude1 * Math.PI / 180;

    const lat2 =
        latitude2 * Math.PI / 180;

    const diferencaLatitude =
        (latitude2 - latitude1) *
        Math.PI / 180;

    const diferencaLongitude =
        (longitude2 - longitude1) *
        Math.PI / 180;

    const a =
        Math.sin(diferencaLatitude / 2) *
        Math.sin(diferencaLatitude / 2) +

        Math.cos(lat1) *
        Math.cos(lat2) *

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
// ENCONTRAR LOCALIZAÇÃO PRINCIPAL
// ==========================================

function encontrarLocalizacaoPrincipal(localizacoes) {

    if (localizacoes.length === 0) {
        return null;
    }


    const referencia = localizacoes[0];


    console.log(
        'LOCALIZAÇÃO DE REFERÊNCIA:',
        referencia.latitude,
        referencia.longitude
    );


    for (
        let i = 1;
        i < localizacoes.length;
        i++
    ) {

        const localizacao =
            localizacoes[i];


        const distancia =
            calcularDistanciaMetros(
                referencia.latitude,
                referencia.longitude,
                localizacao.latitude,
                localizacao.longitude
            );


        console.log(
            'Distância da referência:',
            distancia.toFixed(2),
            'metros'
        );


        if (distancia > 4) {

            console.log(
                'LOCALIZAÇÕES FORA DO LIMITE DE 4 METROS'
            );

            return null;
        }

    }


    return referencia;
}


// ==========================================
// RECEBER LOCALIZAÇÕES DO SERVIDOR
// ==========================================

socket.on(
    'localizacoes-intra',
    function (localizacoes) {

        console.log(
            'LOCALIZAÇÕES RECEBIDAS:',
            localizacoes
        );


        localizacoesRecebidas =
            localizacoes;


        // ==================================
        // NENHUMA LOCALIZAÇÃO
        // ==================================

        if (localizacoes.length === 0) {

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
        // ENCONTRAR LOCALIZAÇÃO PRINCIPAL
        // ==================================

        const localizacaoPrincipal =
            encontrarLocalizacaoPrincipal(
                localizacoes
            );


        // ==================================
        // LOCALIZAÇÕES NÃO CONCORDAM
        // ==================================

        if (localizacaoPrincipal === null) {

            console.log(
                'Nenhuma localização principal válida.'
            );


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
        // POSIÇÃO DO INTRA
        // ==================================

        const posicao = [

            localizacaoPrincipal.latitude,

            localizacaoPrincipal.longitude

        ];


        console.log(
            'POSIÇÃO DO INTRA:',
            posicao
        );


        // ==================================
        // CRIAR MARCADOR
        // ==================================

        if (marcadorOnibus === null) {

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


        atualizarStatusOnline();

    }
);


// ==========================================
// RECEBER RESULTADO DA AUTENTICAÇÃO
// ==========================================

socket.on(
    'autenticacao-motorista',
    function (resultado) {

        const mensagem =
            document.getElementById(
                'mensagem-motorista'
            );


        if (
            resultado.sucesso
        ) {

            motoristaAutorizado = true;


            mensagem.textContent =
                '✅ Motorista autorizado.';


            mensagem.style.color =
                'green';


            // Esconder área da chave

            document
                .getElementById(
                    'area-motorista'
                )
                .style.display =
                'none';


            // Agora começar o GPS

            iniciarGPS();

        }

        else {

            motoristaAutorizado = false;


            mensagem.textContent =
                '❌ ' + resultado.mensagem;


            mensagem.style.color =
                'red';

        }

    }
);


// ==========================================
// BOTÃO CENTRALIZAR
// ==========================================

document
    .getElementById('centralizar')
    .addEventListener(
        'click',
        function () {

            console.log(
                'Solicitando localização do dispositivo...'
            );


            if (!navigator.geolocation) {

                alert(
                    'Seu dispositivo não suporta localização.'
                );

                return;
            }


            navigator.geolocation.getCurrentPosition(

                function (posicao) {

                    const latitude =
                        posicao.coords.latitude;

                    const longitude =
                        posicao.coords.longitude;


                    console.log(
                        'MINHA LOCALIZAÇÃO:',
                        latitude,
                        longitude
                    );


                    console.log(
                        'PRECISÃO DO GPS:',
                        posicao.coords.accuracy,
                        'metros'
                    );


                    mapa.setView(
                        [
                            latitude,
                            longitude
                        ],
                        17
                    );


                    if (
                        marcadorMinhaLocalizacao === null
                    ) {

                        marcadorMinhaLocalizacao =
                            L.circleMarker(
                                [
                                    latitude,
                                    longitude
                                ],
                                {
                                    radius: 8
                                }
                            )
                            .addTo(mapa);

                    }

                    else {

                        marcadorMinhaLocalizacao.setLatLng(
                            [
                                latitude,
                                longitude
                            ]
                        );

                    }

                },

                function (erro) {

                    console.error(
                        'ERRO AO PEGAR LOCALIZAÇÃO:',
                        erro
                    );


                    alert(
                        'Não foi possível obter sua localização.'
                    );

                },

                {
                    enableHighAccuracy: true,
                    maximumAge: 0,
                    timeout: 15000
                }

            );

        }
    );


// ==========================================
// BOTÃO COMPARTILHAR LOCALIZAÇÃO
// ==========================================

document
    .getElementById('iniciar-localizacao')
    .addEventListener(
        'click',
        function () {

            // Se já estiver autorizado,
            // começa o GPS diretamente.

            if (
                motoristaAutorizado
            ) {

                iniciarGPS();

                return;

            }


            // Mostrar área para colocar a chave

            document
                .getElementById(
                    'area-motorista'
                )
                .style.display =
                'block';


            document
                .getElementById(
                    'chave-motorista'
                )
                .focus();

        }
    );


// ==========================================
// CONFIRMAR CHAVE DO MOTORISTA
// ==========================================

document
    .getElementById('confirmar-motorista')
    .addEventListener(
        'click',
        function () {

            const campo =
                document.getElementById(
                    'chave-motorista'
                );


            const chave =
                campo.value;


            if (
                chave.trim() === ''
            ) {

                document
                    .getElementById(
                        'mensagem-motorista'
                    )
                    .textContent =
                    'Digite a chave do motorista.';

                return;

            }


            document
                .getElementById(
                    'mensagem-motorista'
                )
                .textContent =
                'Verificando...';


            // ==================================
            // ENVIAR CHAVE AO SERVIDOR
            // ==================================

            socket.emit(
                'autenticar-motorista',
                chave
            );

        }
    );


// ==========================================
// PERMITIR ENTER NO CAMPO DA CHAVE
// ==========================================

document
    .getElementById('chave-motorista')
    .addEventListener(
        'keydown',
        function (evento) {

            if (
                evento.key === 'Enter'
            ) {

                document
                    .getElementById(
                        'confirmar-motorista'
                    )
                    .click();

            }

        }
    );


// ==========================================
// INICIAR GPS
// ==========================================

function iniciarGPS() {

    if (
        !motoristaAutorizado
    ) {

        console.log(
            'GPS bloqueado: motorista não autorizado.'
        );

        return;

    }


    if (!navigator.geolocation) {

        alert(
            'Seu dispositivo não suporta localização.'
        );

        return;

    }


    // Evitar dois watchPosition

    if (
        watchID !== null
    ) {

        console.log(
            'Compartilhamento já está ativo.'
        );

        return;

    }


    document
        .getElementById(
            'gps-status'
        )
        .textContent =
        'Obtendo localização...';


    // ==================================
    // ACOMPANHAR LOCALIZAÇÃO
    // ==================================

    watchID =
        navigator.geolocation.watchPosition(

            function (posicao) {

                const latitude =
                    posicao.coords.latitude;

                const longitude =
                    posicao.coords.longitude;


                console.log(
                    'LOCALIZAÇÃO COMPARTILHADA:',
                    latitude,
                    longitude
                );


                console.log(
                    'PRECISÃO DO GPS:',
                    posicao.coords.accuracy,
                    'metros'
                );


                // ==================================
                // ENVIAR AO SERVIDOR
                // ==================================

                socket.emit(
                    'atualizar-localizacao',
                    {
                        latitude:
                            latitude,

                        longitude:
                            longitude
                    }
                );


                document
                    .getElementById(
                        'gps-status'
                    )
                    .textContent =
                    'Localização compartilhada';

            },

            function (erro) {

                console.error(
                    'ERRO NO GPS:',
                    erro
                );


                document
                    .getElementById(
                        'gps-status'
                    )
                    .textContent =
                    'Erro ao obter localização';

            },

            {
                enableHighAccuracy: true,

                maximumAge: 0,

                timeout: 15000

            }

        );

}


// ==========================================
// PARAR COMPARTILHAMENTO
// ==========================================

document
    .getElementById('parar-localizacao')
    .addEventListener(
        'click',
        function () {

            if (
                watchID !== null
            ) {

                navigator.geolocation.clearWatch(
                    watchID
                );

                watchID = null;

            }


            socket.emit(
                'parar-localizacao'
            );


            document
                .getElementById(
                    'gps-status'
                )
                .textContent =
                'Localização não compartilhada';

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


    status.className =
        'status-localizado';

    indicador.className =
        'indicador-online';

    texto.textContent =
        'Intra localizado';


    document
        .getElementById(
            'atualizacao'
        )
        .textContent =
        'Localização atualizada agora';


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


    status.className =
        'status-sem-localizacao';

    indicador.className =
        'indicador-offline';

    texto.textContent =
        'Intra sem localização';


    document
        .getElementById(
            'atualizacao'
        )
        .textContent =
        'Nenhuma localização compartilhada';


    const statusLocalizacao =
        document.getElementById(
            'status-localizacao'
        );


    if (statusLocalizacao) {

        statusLocalizacao.textContent =
            'Offline';

    }

}