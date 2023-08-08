var IntegraçãoComprasSend = Class.create();
IntegraçãoComprasSend.prototype = {
  initialize: function (sys_id) {
    var gr = new GlideRecord("u_integration_control");
    gr.get(sys_id);
    this.current = gr;
  },

  execute: function () {
    this.sendTransactionToThirdParty();
  },

  sendTransactionToThirdParty: function () {
    this.current.state = 117; // State 117 = In Progress
    this.current.update();

    var r;
    var response;
    var responseBody = "";
    var httpStatus;
    var message = "";

    var gr = new GlideRecord(this.current.u_source_table);
    gr.get(this.current.parent);
    var grParent;

    if (this.current.u_source_table == "u_item_da_solicitacao_compra") {
      grParent = new GlideRecord("u_solicitacao_compra");
      grParent.get(gr.parent);
    } else if (this.current.u_source_table == "u_item_da_ordem_compra") {
      grParent = new GlideRecord("u_ordem_compra");
      grParent.get(gr.parent);
    }
    var obj;

    if (
      gr.u_sistema_de_origem == "SAPIENS" ||
      grParent.u_sistema_de_origem == "SAPIENS" ||
      gr.u_sistema_de_origem == "SAPIENS_WS" ||
      grParent.u_sistema_de_origem == "SAPIENS_WS"
    ) {
      /* Chama o Webservices de aprovação do SAPIENS */
      if (this.current.u_transaction == "approved") {
        try {
          if (this.current.u_source_table == "u_item_da_solicitacao_compra") {
            r = new sn_ws.RESTMessageV2(
              "SAPIENS Aprovar Solicitação de Compras",
              "Default POST"
            );
          } else if (
            this.current.u_source_table == "u_ordem_compra" ||
            this.current.u_source_table == "u_item_da_ordem_compra"
          ) {
            r = new sn_ws.RESTMessageV2(
              "SAPIENS Aprovar Ordem de Compras",
              "Default POST"
            );
          }

          r.setRequestBody(this.current.u_request_body);
          response = r.execute();
          responseBody = response.getBody();
          httpStatus = response.getStatusCode();
          message =
            "Error Code: " +
            response.getErrorCode() +
            "\nError Message: " +
            response.getErrorMessage();

          gs.log(
            "SAPIENS-Send: " +
              JSON.stringify({
                response: response,
                responseBody: responseBody,
                httpStatus: httpStatus,
                message: message,
              }),
            "SAPIENS-Send"
          );
        } catch (ex) {
          message = ex;
          gs.error(message, "SAPIENS-Integration");
        }

        /* Chama o Webservices de rejeição do SAPIENS */
      } else if (this.current.u_transaction == "rejected") {
        try {
          if (this.current.u_source_table == "u_item_da_solicitacao_compra") {
            r = new sn_ws.RESTMessageV2(
              "SAPIENS Rejeitar Solicitação de Compras",
              "Default POST"
            );
          } else if (
            this.current.u_source_table == "u_ordem_compra" ||
            this.current.u_source_table == "u_item_da_ordem_compra"
          ) {
            r = new sn_ws.RESTMessageV2(
              "SAPIENS Rejeitar Ordem de Compras",
              "Default POST"
            );
          }

          r.setRequestBody(this.current.u_request_body);
          response = r.execute();
          responseBody = response.getBody();
          httpStatus = response.getStatusCode();
          message =
            "Error Code: " +
            response.getErrorCode() +
            "\nError Message: " +
            response.getErrorMessage();

          gs.log(
            "SAPIENS-Send: " +
              JSON.stringify({
                response: response,
                responseBody: responseBody,
                httpStatus: httpStatus,
                message: message,
              }),
            "SAPIENS-Send"
          );
        } catch (ex) {
          message = ex;
          gs.error(message);
        }
      }
    } else if (
      gr.u_sistema_de_origem == "MV2000_WS" ||
      grParent.u_sistema_de_origem == "MV2000_WS"
    ) {
      /* Chama o Webservices de aprovação do MV2000_WS */
      if (this.current.u_transaction == "approved") {
        try {
          if (
            this.current.u_source_table == "u_item_da_solicitacao_compra" ||
            this.current.u_source_table == "u_solicitacao_compra"
          ) {
            r = new sn_ws.RESTMessageV2(
              "MV2000 - Aprovar Solicitação de Compra",
              "Default POST"
            );
          } else if (
            this.current.u_source_table == "u_ordem_compra" ||
            this.current.u_source_table == "u_item_da_ordem_compra"
          ) {
            r = new sn_ws.RESTMessageV2(
              "MV2000 - Aprovar Ordem de Compra",
              "Default POST"
            );
          }

          var data = JSON.parse(this.current.u_request_body);
          r.setStringParameterNoEscape("codigoUsuario", data.codigoUsuario);
          r.setStringParameterNoEscape(
            "codigoMultiempresa",
            data.codigoMultiempresa
          );
          r.setStringParameterNoEscape("codigo", data.codigo);

          response = r.execute();
          responseBody = response.getBody();
          httpStatus = response.getStatusCode();
          message =
            "Error Code: " +
            response.getErrorCode() +
            "\nError Message: " +
            response.getErrorMessage();

          gs.log(
            "MV2000-Send: " +
              JSON.stringify({
                response: response,
                responseBody: responseBody,
                httpStatus: httpStatus,
                message: message,
              }),
            "MV2000-Send"
          );
        } catch (ex) {
          message = ex;
          gs.error(message, "MV2000-Integration");
        }
        /* Chama o Webservices de rejeição do MV2000_WS */
      } else if (this.current.u_transaction == "rejected") {
        try {
          if (
            this.current.u_source_table == "u_item_da_solicitacao_compra" ||
            this.current.u_source_table == "u_solicitacao_compra"
          ) {
            r = new sn_ws.RESTMessageV2(
              "MV2000 - Rejeitar Solicitação de Compra",
              "Default POST"
            );
          } else if (
            this.current.u_source_table == "u_ordem_compra" ||
            this.current.u_source_table == "u_item_da_ordem_compra"
          ) {
            r = new sn_ws.RESTMessageV2(
              "MV2000 - Rejeitar Ordem de Compra",
              "Default POST"
            );
          }

          var data = JSON.parse(this.current.u_request_body);
          r.setStringParameterNoEscape("codigoUsuario", data.codigoUsuario);
          r.setStringParameterNoEscape(
            "codigoMultiempresa",
            data.codigoMultiempresa
          );
          r.setStringParameterNoEscape("codigo", data.codigo);

          response = r.execute();
          responseBody = response.getBody();
          httpStatus = response.getStatusCode();
          message =
            "Error Code: " +
            response.getErrorCode() +
            "\nError Message: " +
            response.getErrorMessage();

          gs.log(
            "MV2000-Send: " +
              JSON.stringify({
                response: response,
                responseBody: responseBody,
                httpStatus: httpStatus,
                message: message,
              }),
            "MV2000-Send"
          );
        } catch (ex) {
          message = ex;
          gs.error(message, "MV2000-Integration");
        }
      }
    } else if (
      gr.u_sistema_de_origem == "SOULMV" ||
      grParent.u_sistema_de_origem == "SOULMV"
    ) {
      /* Chama o Webservices de aprovação do SOULMV */
      if (this.current.u_transaction == "approved") {
        try {
          if (
            this.current.u_source_table == "u_item_da_solicitacao_compra" ||
            this.current.u_source_table == "u_solicitacao_compra"
          ) {
            r = new sn_ws.RESTMessageV2(
              "MV SOUL - Aprovar Solicitação de Compra",
              "Default POST"
            );
          } else if (
            this.current.u_source_table == "u_ordem_compra" ||
            this.current.u_source_table == "u_item_da_ordem_compra"
          ) {
            r = new sn_ws.RESTMessageV2(
              "MV SOUL - Aprovar Ordem de Compra",
              "Default POST"
            );
          }

          var data = JSON.parse(this.current.u_request_body);
          r.setStringParameterNoEscape("codigoUsuario", data.codigoUsuario);
          r.setStringParameterNoEscape(
            "codigoMultiempresa",
            data.codigoMultiempresa
          );
          r.setStringParameterNoEscape("codigo", data.codigo);

          response = r.execute();
          responseBody = response.getBody();
          httpStatus = response.getStatusCode();
          message =
            "Error Code: " +
            response.getErrorCode() +
            "\nError Message: " +
            response.getErrorMessage();

          gs.log(
            "MVSOUL-Send: " +
              JSON.stringify({
                response: response,
                responseBody: responseBody,
                httpStatus: httpStatus,
                message: message,
              }),
            "MVSOUL-Send"
          );
        } catch (ex) {
          message = ex;
          gs.error(message, "MV2000-Integration");
        }
        /* Chama o Webservices de rejeição do SOULMV */
      } else if (this.current.u_transaction == "rejected") {
        try {
          if (
            this.current.u_source_table == "u_item_da_solicitacao_compra" ||
            this.current.u_source_table == "u_solicitacao_compra"
          ) {
            r = new sn_ws.RESTMessageV2(
              "MV SOUL - Rejeitar Solicitação de Compra",
              "Default POST"
            );
          } else if (
            this.current.u_source_table == "u_ordem_compra" ||
            this.current.u_source_table == "u_item_da_ordem_compra"
          ) {
            r = new sn_ws.RESTMessageV2(
              "MV SOUL - Rejeitar Ordem de Compra",
              "Default POST"
            );
          }

          var data = JSON.parse(this.current.u_request_body);
          r.setStringParameterNoEscape("codigoUsuario", data.codigoUsuario);
          r.setStringParameterNoEscape(
            "codigoMultiempresa",
            data.codigoMultiempresa
          );
          r.setStringParameterNoEscape("codigo", data.codigo);

          response = r.execute();
          responseBody = response.getBody();
          httpStatus = response.getStatusCode();
          message =
            "Error Code: " +
            response.getErrorCode() +
            "\nError Message: " +
            response.getErrorMessage();

          gs.log(
            "MVSOUL-Send: " +
              JSON.stringify({
                response: response,
                responseBody: responseBody,
                httpStatus: httpStatus,
                message: message,
              }),
            "MVSOUL-Send"
          );
        } catch (ex) {
          message = ex;
          gs.error(message, "MV2000-Integration");
        }
      }
    }

    this.current.u_retry_count += 1;
    if (httpStatus == 200) {
      this.current.state = 115; // State 115 = Processed
    } else {
      this.current.state = 116; // State 116 = Error
    }

    this.current.work_notes =
      "HTTP Status: " + httpStatus + "\nMessage: \n\t" + message;

    var responseRetorno = JSON.parse(responseBody);
    this.current.u_response_body = JSON.stringify(responseRetorno.retorno);

    this.current.update();
    return 0;
  },

  type: "IntegraçãoComprasSend",
};
