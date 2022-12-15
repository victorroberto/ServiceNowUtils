var IntegraçãoComprasTrigger = Class.create();
IntegraçãoComprasTrigger.prototype = {
  initialize: function (sys_id) {
    var gr = new GlideRecord("sysapproval_approver");
    gr.get(sys_id);
    this.current = gr;
  },

  createIntegrationControlRecord: function () {
    var obj;
    var gr = new GlideRecord(this.current.source_table);
    gr.get(this.current.sysapproval);

    if (this.current.state == "approved") {
      obj = this.createApprovalBody();
    } else {
      obj = this.createRejectBody();
    }

    if (obj) {
      this.createIntegrationRecord(obj);
    }
  },

  createApprovalBody: function () {
    /* var vJsonMvApproved = {
            'codigoMultiEmpresa': '',
            'tipoDocumento': '',
            'codigoDocumento': '',
            'codigoUsuarioAutorizador': '',
            'acao': ''
        }; */

    var vJsonSoulOcApproved = {
      codigoUsuario: "",
      codigoMultiempresa: "",
      codigo: "",
    };

    var vJsonSoulScApproved = {
      codigo: "",
      codigoUsuario: "",
      codigoMultiempresa: "",
    };

    var vJsonMv2000OcApproved = {
      codigoUsuario: "",
      codigoMultiempresa: "",
      codigo: "",
    };

    var vJsonMv2000ScApproved = {
      codigo: "",
      codigoUsuario: "",
      codigoMultiempresa: "",
    };

    var vJsonSapiensScApproved = {
      codigoEmpresa: "",
      numeroSolicitacao: "",
      sequenciaSolicitacao: "",
      usuarioAprovacao: "",
    };
    var vJsonSapiensOcApproved = {
      codigoEmpresa: "",
      codigoFilial: "",
      numeroOrdemCompra: "",
      usuarioAprovacao: "",
    };

    var vSourceSystem = this.getInformationOfRecord();

    /* if (vSourceSystem.source == 'MV' || vSourceSystem.source == 'SOULMV' || vSourceSystem.source == 'MV2000_WS') {
                vJsonMvApproved.codigoMultiEmpresa = vSourceSystem.branch.substring(0, 2);
                vJsonMvApproved.tipoDocumento = vSourceSystem.documentType;
                vJsonMvApproved.codigoDocumento = vSourceSystem.number;
                vJsonMvApproved.codigoUsuarioAutorizador = this.current.approver.user_name.getDisplayValue().toUpperCase();
                vJsonMvApproved.acao = 'A';
                return vJsonMvApproved;
            } */

    if (this.current.source_table == "u_item_da_solicitacao_compra") {
      if (vSourceSystem.source == "MV2000_WS") {
        vJsonMv2000ScApproved.codigo = vSourceSystem.number;
        vJsonMv2000ScApproved.codigoUsuario = this.current.approver.user_name
          .getDisplayValue()
          .toUpperCase();
        vJsonMv2000ScApproved.codigoMultiempresa =
          vSourceSystem.branch.substring(0, 2);
        return vJsonMv2000ScApproved;
      }

      if (vSourceSystem.source == "SOULMV") {
        vJsonSoulScApproved.codigo = vSourceSystem.number;
        vJsonSoulScApproved.codigoUsuario = this.current.approver.user_name
          .getDisplayValue()
          .toUpperCase();
        vJsonSoulScApproved.codigoMultiempresa = vSourceSystem.branch.substring(
          0,
          2
        );
        return vJsonSoulScApproved;
      }

      if (
        vSourceSystem.source == "SAPIENS" ||
        vSourceSystem.source == "SAPIENS_WS"
      ) {
        vJsonSapiensScApproved.codigoEmpresa = vSourceSystem.company.substring(
          0,
          1
        );
        vJsonSapiensScApproved.numeroSolicitacao = vSourceSystem.number;
        vJsonSapiensScApproved.sequenciaSolicitacao = vSourceSystem.sequence;
        vJsonSapiensScApproved.usuarioAprovacao = this.getDelegate(
          vSourceSystem.approver
        );
        return vJsonSapiensScApproved;
      }
    } else {
      if (vSourceSystem.source == "MV2000_WS") {
        vJsonMv2000OcApproved.codigoUsuario = this.current.approver.user_name
          .getDisplayValue()
          .toUpperCase();
        vJsonMv2000OcApproved.codigoMultiempresa =
          vSourceSystem.branch.substring(0, 2);
        vJsonMv2000OcApproved.codigo = vSourceSystem.number;
        return vJsonMv2000OcApproved;
      }

      if (vSourceSystem.source == "SOULMV") {
        vJsonSoulOcApproved.codigoUsuario = this.current.approver.user_name
          .getDisplayValue()
          .toUpperCase();
        vJsonSoulOcApproved.codigoMultiempresa = vSourceSystem.branch.substring(
          0,
          2
        );
        vJsonSoulOcApproved.codigo = vSourceSystem.number;
        return vJsonSoulOcApproved;
      }

      if (
        vSourceSystem.source == "SAPIENS" ||
        vSourceSystem.source == "SAPIENS_WS"
      ) {
        vJsonSapiensOcApproved.codigoEmpresa = vSourceSystem.company.substring(
          0,
          1
        );
        vJsonSapiensOcApproved.codigoFilial = vSourceSystem.branch.substring(
          0,
          2
        );
        vJsonSapiensOcApproved.numeroOrdemCompra = vSourceSystem.number;
        vJsonSapiensOcApproved.usuarioAprovacao = this.getDelegate(
          vSourceSystem.approver
        );
        return vJsonSapiensOcApproved;
      }
    }
  },

  createRejectBody: function () {
    /* var vJsonMvReject = {
            'codigoMultiEmpresa': '',
            'tipoDocumento': '',
            'codigoDocumento': '',
            'codigoUsuarioAutorizador': '',
            'acao': ''
        }; */

    var vJsonSoulOcReject = {
      codigoUsuario: "",
      codigoMultiempresa: "",
      codigo: "",
    };

    var vJsonSoulScReject = {
      codigo: "",
      codigoUsuario: "",
      codigoMultiempresa: "",
    };

    var vJsonMv2000OcReject = {
      codigoUsuario: "",
      codigoMultiempresa: "",
      codigo: "",
    };

    var vJsonMv2000ScReject = {
      codigo: "",
      codigoUsuario: "",
      codigoMultiempresa: "",
    };

    var vJsonSapiensScReject = {
      codigoEmpresa: "",
      numeroSolicitacao: "",
      sequenciaSolicitacao: "",
      usuarioReprovacao: "",
    };

    var vJsonSapiensOcReject = {
      codigoEmpresa: "",
      codigoFilial: "",
      numeroOrdemCompra: "",
      usuarioReprovacao: "",
    };

    var vSourceSystem = this.getInformationOfRecord();

    if (this.current.source_table == "u_item_da_solicitacao_compra") {
      if (vSourceSystem.source == "MV2000_WS") {
        vJsonMv2000ScReject.codigo = vSourceSystem.number;
        vJsonMv2000ScReject.codigoUsuario = this.current.approver.user_name
          .getDisplayValue()
          .toUpperCase();
        vJsonMv2000ScReject.codigoMultiempresa = vSourceSystem.branch.substring(
          0,
          2
        );
        return vJsonMv2000ScReject;
      }

      if (vSourceSystem.source == "SOULMV") {
        vJsonSoulScReject.codigo = vSourceSystem.number;
        vJsonSoulScReject.codigoUsuario = this.current.approver.user_name
          .getDisplayValue()
          .toUpperCase();
        vJsonSoulScReject.codigoMultiempresa = vSourceSystem.branch.substring(
          0,
          2
        );
        return vJsonSoulScReject;
      }

      if (
        vSourceSystem.source == "SAPIENS" ||
        vSourceSystem.source == "SAPIENS_WS"
      ) {
        vJsonSapiensScReject.codigoEmpresa = vSourceSystem.company.substring(
          0,
          1
        );
        vJsonSapiensScReject.numeroSolicitacao = vSourceSystem.number;
        vJsonSapiensScReject.sequenciaSolicitacao = vSourceSystem.sequence;
        vJsonSapiensScReject.usuarioReprovacao =
          this.current.approver.user_name.getDisplayValue();
        return vJsonSapiensScReject;
      }
    } else {
      if (vSourceSystem.source == "MV2000_WS") {
        vJsonMv2000OcReject.codigoUsuario = this.current.approver.user_name
          .getDisplayValue()
          .toUpperCase();
        vJsonMv2000OcReject.codigoMultiempresa = vSourceSystem.branch.substring(
          0,
          2
        );
        vJsonMv2000OcReject.codigo = vSourceSystem.number;
        return vJsonMv2000OcReject;
      }

      if (vSourceSystem.source == "SOULMV") {
        vJsonSoulOcReject.codigoUsuario = this.current.approver.user_name
          .getDisplayValue()
          .toUpperCase();
        vJsonSoulOcReject.codigoMultiempresa = vSourceSystem.branch.substring(
          0,
          2
        );
        vJsonSoulOcReject.codigo = vSourceSystem.number;
        return vJsonSoulOcReject;
      }

      if (
        vSourceSystem.source == "SAPIENS" ||
        vSourceSystem.source == "SAPIENS_WS"
      ) {
        vJsonSapiensOcReject.codigoEmpresa = vSourceSystem.company.substring(
          0,
          1
        );
        vJsonSapiensOcReject.codigoFilial = vSourceSystem.branch.substring(
          0,
          2
        );
        vJsonSapiensOcReject.numeroOrdemCompra = vSourceSystem.number;
        vJsonSapiensOcReject.usuarioReprovacao = this.getDelegate(
          this.current.approver.user_name.getDisplayValue()
        );
        return vJsonSapiensOcReject;
      }
    }
  },

  getInformationOfRecord: function () {
    var vJsonGeneric = {
      company: "",
      branch: "",
      number: "",
      sequence: "",
      approver: "",
      source: "",
      documentType: "",
    };
    var gr = new GlideRecord(this.current.source_table);

    if (gr.get(this.current.sysapproval)) {
      /* foi quebrado em que cada uns do intes possiveis para que ficasse mais fácil de indentificar onde estava as customizações */
      if (gr.getTableName() == "u_solicitacao_compra") {
        vJsonGeneric.company = gr.u_codigo_da_empresa.toString();
        vJsonGeneric.branch = gr.u_codigo_da_filial.toString();
        vJsonGeneric.number = gr.u_numero_da_solicitacao.toString();
        vJsonGeneric.sequence = gr.u_sequencia_do_item.toString();
        vJsonGeneric.approver = gr.u_aprovador.toString();

        /* Não existe aprovação na Solicitação de Compras, Somente no Item. */

        /* esta pegando o aprovador que de fato fez a aprovação, pois neste caso podemos ter varios aprovadores definidos como Requested porém ate este momento apenas para o SAPIENS. */
        /* if (gr.u_sistema_de_origem == 'SAPIENS') {
                    vJsonGeneric.approver = this.current.approver.user_name.toString();
                } */

        vJsonGeneric.source = gr.u_sistema_de_origem.toString();
        vJsonGeneric.documentType = "SC";
        return vJsonGeneric;
      } else if (gr.getTableName() == "u_item_da_solicitacao_compra") {
        vJsonGeneric.company = gr.parent.u_codigo_da_empresa.toString();
        vJsonGeneric.branch = gr.parent.u_codigo_da_filial.toString();
        vJsonGeneric.number = gr.u_numero_da_solicitacao.toString();
        vJsonGeneric.sequence = gr.u_sequencia_do_item.toString();
        vJsonGeneric.approver =
          this.current.approver.user_name.toString() ||
          gr.u_aprovador.toString();

        /* esta pegando o aprovador que de fato fez a aprovação, pois neste caso podemos ter varios aprovadores definidos como Requested porém ate este momento apenas para o SAPIENS */
        if (gr.parent.u_sistema_de_origem == "SAPIENS") {
          vJsonGeneric.approver = this.current.approver.user_name.toString();
        }

        vJsonGeneric.source = gr.parent.u_sistema_de_origem.toString();
        vJsonGeneric.documentType = "SC";
        return vJsonGeneric;
      }
      //ordem de compras
      else {
        //segundo o pessoal do projeto (André/ Michele), não exisistirá aprovação diretamente par ao item
        vJsonGeneric.company = gr.u_codigo_da_empresa.toString();
        vJsonGeneric.branch = gr.u_codigo_da_filial.toString();
        vJsonGeneric.approver = gr.u_aprovador.toString();
        vJsonGeneric.source = gr.u_sistema_de_origem.toString();
        vJsonGeneric.documentType = "OC";
        vJsonGeneric.number = gr.u_numero_da_ordem.toString();
        vJsonGeneric.approver = this.current.approver.user_name.toString();
        return vJsonGeneric;
      }
    }
  },

  createIntegrationRecord: function (pObject) {
    var json = JSON.stringify(pObject);
    var gr = new GlideRecord(this.current.source_table);
    gr.get(this.current.sysapproval);

    var integrationControl = new GlideRecord("u_integration_control");
    integrationControl.initialize();
    integrationControl.state = 114; // State 114 = Ready;
    integrationControl.parent = this.current.sysapproval;
    integrationControl.u_source_table = this.current.source_table;
    integrationControl.u_transaction = this.current.state;
    integrationControl.u_retry_count = 0;

    if (
      this.current.source_table == "u_item_da_solicitacao_compra" ||
      this.current.source_table == "u_solicitacao_compra"
    ) {
      integrationControl.u_external_system_number = gr.u_numero_da_solicitacao;
    } else {
      integrationControl.u_external_system_number = gr.u_numero_da_ordem;
    }
    integrationControl.u_request_body = json;
    integrationControl.insert();
    return 0;
  },

  getDelegate: function (user_name) {
    var currentTime = new GlideDateTime();
    var gr = new GlideRecord("sys_user_delegate");
    gr.addQuery("user.user_name", user_name);
    gr.addQuery("ends", ">=", currentTime);
    gr.addQuery("starts", "<=", currentTime);
    gr.query();

    if (gr.next()) {
      return gr.delegate.user_name + "";
    }
    return user_name;
  },

  execute: function () {
    this.createIntegrationControlRecord();
  },

  type: "IntegraçãoComprasTrigger",
};
