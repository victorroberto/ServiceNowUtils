/* Esse script é responsável por montar o payload que será usado na integração que busca as aprovações e o histórico do SAPIENS */

var SC_OC_GetAprovacoesSAPIENS = Class.create();
SC_OC_GetAprovacoesSAPIENS.prototype = Object.extendsObject(
  AbstractAjaxProcessor,
  {
    /* Este é o template SOAP utilizado para buscar as aprovações no SAPIENS */
    SOAP_TEMPLATE:
      "<soapenv:Envelope xmlns:soapenv='http://schemas.xmlsoap.org/soap/envelope/' xmlns:ser='http://services.senior.com.br'>" +
      "   <soapenv:Header/>" +
      "   <soapenv:Body>" +
      "      <ser:{0}>" +
      "         <user>user</user>" +
      "         <password>password</password>" +
      "         <encryption>0</encryption>" +
      "         <parameters>" +
      "            {1} " +
      "         </parameters>" +
      "      </ser:{0}>" +
      "   </soapenv:Body>" +
      "</soapenv:Envelope>",
    ROTINA_SAPIENS: { OC: 12, SC: 6, CT: 15 },

    /* Função reponsável por montar o payload das aprovações para o integrador do SAPIENS */
    montaPayloadAprovacoes: function (user, obj_user, registroLog) {
      var parametros =
        "<codUsu>0</codUsu>" +
        "<indicePagina>0</indicePagina>" +
        "<limitePagina>0</limitePagina>" +
        "<token>" +
        "  <nomUsu>" +
        user +
        "</nomUsu>" +
        "</token>";

      var requestDataOC = gs.getMessage(this.SOAP_TEMPLATE, [
        "buscarOCPendentes",
        parametros,
      ]);
      var requestDataSC = gs.getMessage(this.SOAP_TEMPLATE, [
        "BuscarSCPendentes",
        parametros,
      ]);

      /* Chama a execução do integrador para as OC's do SAPIENS */
      this._executaIntegrador(
        obj_user,
        requestDataOC,
        "function (integrador_gr) { " +
          'new SC_OC_Sapiens_Sync().syncOc(integrador_gr, "' +
          registroLog +
          '");' +
          "}"
      );

      /* Chama a execução do integrador para as SC's do SAPIENS */
      this._executaIntegrador(
        obj_user,
        requestDataSC,
        "function (integrador_gr) { " +
          'new SC_OC_Sapiens_Sync().syncSc(integrador_gr, "' +
          registroLog +
          '");' +
          "}"
      );
    },

    /* Função reponsável por montar o payload do histórico de aprovações para o integrador do SAPIENS */
    montaPayloadHistorico: function (
      empresa,
      filial,
      numero,
      rotina,
      table,
      sys_id,
      callback
    ) {
      var parametros = gs.getMessage(
        "<empresa>{0}</empresa>" +
          "<filial>{1}</filial>" +
          "<numero>{2}</numero>" +
          "<rotina>{3}</rotina>",
        [empresa, filial, numero, this.ROTINA_SAPIENS[rotina]]
      );

      var approvalHistory = {
        object_type: "approvalHistory",
        table: table,
        sys_id: sys_id,
      };

      var requestData = gs.getMessage(this.SOAP_TEMPLATE, [
        "historicoAprovacoes",
        parametros,
      ]);
      this._executaIntegrador(approvalHistory, requestData, callback);
    },

    /* Função reponsável por chamar a execução do integrador para as aprovações e histórico de aprovações do SAPIENS */
    _executaIntegrador: function (obj_user, requestData, callback) {
      var integrador = new UBH_Integrador_SC_OC();
      var env = new UBHEnv().env;
      integrador.setMIDServer(env.integrador.MIDServer);
      integrador.setDestinyAuth("");
      integrador.setDestinyAuthType("BASIC");
      integrador.setDestinyContentType("text/xml;charset=UTF-8");
      integrador.setDestinyEndpoint(
        env.g5_senior_services_sapiens.url + "/Synccom_unimedbh_servicenow"
      );
      integrador.setDestinyMethod("POST");
      integrador.setRequestData(requestData);
      integrador.executeCallback(callback, obj_user);
    },
    type: "SC_OC_GetAprovacoesSAPIENS",
  }
);
