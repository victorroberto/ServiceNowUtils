/* Esse script é responsável por montar o payload que será usado na integração que busca as aprovações e o histórico do MV2000 */

var SC_OC_GetAprovacoesMV = Class.create();
SC_OC_GetAprovacoesMV.prototype = Object.extendsObject(AbstractAjaxProcessor, {

    /* Variáveis de ambiente do MV2000 */
    env: {},
    token: '',

    /* Função reponsável por montar o payload das aprovações para o integrador do MV2000 */
    montaPayloadAprovacoes: function (user, obj_user, registroLog) {
        this.env = new UBHEnv("mv_2000_api").env;
        this.token = this.env.auth;

        /* Monta os parâmetros das OC's do integrador do MV2000 */
        var queryOC = "codigoUsuario=" + user;
        var apiOC = "/mv-api-ordemCompra/ordemcompra";

        /* Monta os parâmetros das SC's do integrador do MV2000 */
        var querySC = "codigo=" + user;
        var apiSC = "/mv-api-solicitacao/solicitacoes";

        /* Chama a execução do integrador para as OC's do MV2000 */
        this._executaIntegrador(queryOC, apiOC, obj_user, 'function (integrador_gr) { ' +
            'new SC_OC_MV_Sync().syncOc(integrador_gr, "' + registroLog + '");' +
            '}');

        this._executaIntegrador(querySC, apiSC, obj_user, 'function (integrador_gr) { ' +
            'new SC_OC_MV_Sync().syncSc(integrador_gr, "' + registroLog + '");' +
            '}');
    },

    /* Função reponsável por chamar a execução do integrador para as aprovações e histórico de aprovações do MV2000 */
    _executaIntegrador: function (queryParams, api, obj_user, callback) {
        var timeout = 40;
        var requestData = "{}";
        var integrador = new UBH_Integrador_SC_OC();
        integrador.setDestinyAuth(this._getToken());
        integrador.setDestinyAuthType(this.env.authType);
        integrador.setDestinyContentType('application/json');
        integrador.setDestinyEndpoint(this.env.url + api);
        integrador.setDestinyMethod('GET');
        integrador.setDestinyQueryParameter(queryParams);
        integrador.setMIDServer(this.env.MIDServer);
        integrador.setRequestData("{}");
        integrador.executeCallback(callback, obj_user);
    },

    /* Função reponsável por retornar o token de autenticação do MVSOUL */
    _getToken: function () {
        return this.env.auth;
    },
    type: 'SC_OC_GetAprovacoesMV'
});