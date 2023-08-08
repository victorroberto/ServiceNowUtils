/* Esse script inicia o fluxo da busca das aprovações de Ordens e Solicitações de Compra */

var SC_OC_GetPendingAproovals = Class.create();
SC_OC_GetPendingAproovals.prototype = Object.extendsObject(
  AbstractAjaxProcessor,
  {
    /* Função responsável por iniciar o fluxo de aprovações. Ela recebe o sistema e um usuário (se não houver um usuário, ele executa para o usuário que iniciou o processo) */
    getAprovacoes: function (sistema, userInput) {
      var user;
      var obj_user;
      var getAprovacoesSAPIENS;
      var getAprovacoesMV;
      var getAprovacoesSOUL;
      var registroLog;

      /* Verifica se foi passado algum usuário na chamada. Se não existe ele busca o usuário que iniciou o processo e seu objeto */
      if (userInput) {
        user = userInput;
        obj_user = gs.getUser();
        obj_user = obj_user.getUserByID(user);
      } else {
        user = gs.getUserName();
        obj_user = gs.getUser();
        obj_user = obj_user.getUserByID(user);
      }

      /* Cria registro de controle na tabela SCOC Controle. Esse registro serve para acompanhamento do status da integração */
      registroLog = this._insereLog(
        "criarRegistroLog",
        "",
        obj_user.getID(),
        "",
        ""
      );

      /* Verifica se existe alguma integração que rodou a menos de 2 minutos atrás */
      if (!this._permiteExecucao()) {
        gs.eventQueue("integration_processed", null, gs.getUserName());

        /* Atualiza registro de controle na tabela SCOC Controle. Esse registro serve para acompanhamento do status da integração. */
        this._insereLog(
          "atualizaLog",
          registroLog,
          "",
          "",
          "Outra execução já está em andamento."
        );
        this._insereLog(
          "atualizaDescricao",
          registroLog,
          "",
          "",
          "Outra execução já está em andamento"
        );
        this._insereLog("encerraLog", registroLog, "", "", "");

        return JSON.stringify({
          msg: "Outra execução já está em andamento.",
        });
      }

      /* Verifica se usuário possui privilegios de aprovador no ServiceNow */
      if (!obj_user.hasRole("approver_user")) {
        /* Atualiza registro de controle na tabela SCOC Controle. Esse registro serve para acompanhamento do status da integração. */
        this._insereLog(
          "atualizaLog",
          registroLog,
          "",
          "",
          "O usuário não tem permissão de Aprovador"
        );
        this._insereLog(
          "atualizaDescricao",
          registroLog,
          "",
          "",
          "O usuário não tem permissão de Aprovador"
        );
        this._insereLog("encerraLog", registroLog, "", "", "");

        return JSON.stringify({
          msg: "Você não tem permissão",
        });
      }

      /* Verifica se o usuário está vazio */
      if (!user) {
        /* Atualiza registro de controle na tabela SCOC Controle. Esse registro serve para acompanhamento do status da integração. */
        this._insereLog(
          "atualizaLog",
          registroLog,
          "",
          "",
          "Usuário não encontrado"
        );
        this._insereLog(
          "atualizaDescricao",
          registroLog,
          "",
          "",
          "Usuário não encontrado"
        );
        this._insereLog("encerraLog", registroLog, "", "", "");

        return JSON.stringify({
          msg: "Usuário não encontrado",
        });
      }

      this._apagaIntegracoes(user);

      /* Chama o script getAprovações de acordo com o sistema recebido */
      switch (sistema) {
        case "sapiens":
          this._apagaAprovacoesSapiens(obj_user);
          this._insereLog("atualizaSistemaLog", registroLog, "", "sapiens", "");

          getAprovacoesSAPIENS = new SC_OC_GetAprovacoesSAPIENS();
          getAprovacoesSAPIENS.montaPayloadAprovacoes(
            user,
            obj_user,
            registroLog
          );
          break;
        case "mv":
          this._apagaAprovacoesMV2000(obj_user);
          this._insereLog("atualizaSistemaLog", registroLog, "", "mv_2000", "");

          getAprovacoesMV = new SC_OC_GetAprovacoesMV();
          getAprovacoesMV.montaPayloadAprovacoes(user, obj_user, registroLog);
          break;
        case "soul":
          this._apagaAprovacoesSOUL(obj_user);
          this._insereLog("atualizaSistemaLog", registroLog, "", "mv_soul", "");

          getAprovacoesSOUL = new SC_OC_GetAprovacoesSOUL();
          getAprovacoesSOUL.montaPayloadAprovacoes(user, obj_user, registroLog);
          break;
        case "all":
          this._insereLog("atualizaSistemaLog", registroLog, "", "todos", "");

          this._apagaAprovacoesSapiens(obj_user);
          this._apagaAprovacoesMV2000(obj_user);
          this._apagaAprovacoesSOUL(obj_user);

          getAprovacoesSAPIENS = new SC_OC_GetAprovacoesSAPIENS();
          getAprovacoesSAPIENS.montaPayloadAprovacoes(
            user,
            obj_user,
            registroLog
          );

          getAprovacoesMV = new SC_OC_GetAprovacoesMV();
          getAprovacoesMV.montaPayloadAprovacoes(user, obj_user, registroLog);

          getAprovacoesSOUL = new SC_OC_GetAprovacoesSOUL();
          getAprovacoesSOUL.montaPayloadAprovacoes(user, obj_user, registroLog);
          break;
      }

      return JSON.stringify({
        msg: "Execução iniciada, aguarde.",
        registroLog: registroLog,
      });
    },

    /* Busca as integrações do usuário */
    _permiteExecucao: function () {
      var grIntegrador = new GlideRecord("u_integrador");
      grIntegrador.addQuery("u_approver", gs.getUserName());
      grIntegrador.query();

      /* Verifica se existe alguma integração que rodou a menos de 2 minutos atrás */
      while (grIntegrador.next()) {
        if (grIntegrador.getValue("sys_updated_on") > gs.minutesAgoEnd(2)) {
          return false;
        }
      }
      return true;
    },

    /* Apaga as aprovações do mv para o usuário passado */
    _apagaAprovacoesMV2000: function (obj_user) {
      var grSysApprover = new GlideRecord("sysapproval_approver");
      grSysApprover.addEncodedQuery(
        "state=requested^approver=" +
          obj_user.getID() +
          "^source_table=u_solicitacao_compra^ORsource_table=u_ordem_compra^ORsource_table=u_item_da_solicitacao_compra^sysapproval.ref_u_ordem_compra.u_sistema_de_origem=MV2000_WS^ORsysapproval.ref_u_solicitacao_compra.u_sistema_de_origem=MV2000_WS^ORsysapproval.ref_u_item_da_solicitacao_compra.u_sistema_de_origem=MV2000_WS^ORsysapproval.ref_u_item_da_ordem_compra.u_sistema_de_origem=MV2000_WS"
      );
      grSysApprover.query();
      grSysApprover.deleteMultiple();
    },

    /* Apaga as aprovações do soul para o usuário passado */
    _apagaAprovacoesSOUL: function (obj_user) {
      var grSysApprover = new GlideRecord("sysapproval_approver");
      grSysApprover.addEncodedQuery(
        "state=requested^approver=" +
          obj_user.getID() +
          "^source_table=u_solicitacao_compra^ORsource_table=u_ordem_compra^ORsource_table=u_item_da_solicitacao_compra^sysapproval.ref_u_ordem_compra.u_sistema_de_origem=SOULMV^ORsysapproval.ref_u_solicitacao_compra.u_sistema_de_origem=SOULMV^ORsysapproval.ref_u_item_da_solicitacao_compra.u_sistema_de_origem=SOULMV^ORsysapproval.ref_u_item_da_ordem_compra.u_sistema_de_origem=SOULMV"
      );
      grSysApprover.query();
      grSysApprover.deleteMultiple();
    },

    /* Apaga as aprovações do sapiens para o usuário passado */
    _apagaAprovacoesSapiens: function (obj_user) {
      var grSysApprover = new GlideRecord("sysapproval_approver");
      grSysApprover.addEncodedQuery(
        "state=requested^approver=" +
          obj_user.getID() +
          "^source_table=u_solicitacao_compra^ORsource_table=u_ordem_compra^ORsource_table=u_item_da_solicitacao_compra^sysapproval.ref_u_ordem_compra.u_sistema_de_origem=SAPIENS_WS^ORsysapproval.ref_u_solicitacao_compra.u_sistema_de_origem=SAPIENS_WS^ORsysapproval.ref_u_item_da_solicitacao_compra.u_sistema_de_origem=SAPIENS_WS^ORsysapproval.ref_u_item_da_ordem_compra.u_sistema_de_origem=SAPIENS_WS"
      );
      grSysApprover.query();
      grSysApprover.deleteMultiple();
    },

    /* Apaga as integrações existentes do usuário */
    _apagaIntegracoes: function (user) {
      var grIntegrador = new GlideRecord("u_integrador");
      grIntegrador.addQuery("u_approver", user);
      grIntegrador.query();
      grIntegrador.deleteMultiple();
    },

    /* Função responsável por criar e atualizar o registro de controle na tabela SCOC Controle. Esse registro serve para acompanhamento do status da integração. */
    _insereLog: function (tipo, registroLog, userId, sistema, worklog) {
      if (tipo == "criarRegistroLog") {
        var grLog = new GlideRecord("u_scoc_controle"); //('criarRegistroLog', '', user, '', '');
        grLog.initialize();
        grLog.u_state = 1; //Execução Iniciada
        grLog.u_usuario = userId;
        grLog.u_worklog = "Execução Iniciada";
        return grLog.insert();
      }

      if (tipo == "atualizaSistemaLog") {
        //('atualizaSistemaLog', registroLog, '', sistema, '');
        var grLog = new GlideRecord("u_scoc_controle");
        grLog.addQuery("sys_id", registroLog);
        grLog.query();
        if (grLog.next()) {
          grLog.u_sistema = sistema;
          grLog.update();
        }
      }

      if (tipo == "atualizaLog") {
        //('atualizaLog', registroLog, '', '', worklog);
        var grLog = new GlideRecord("u_scoc_controle");
        grLog.addQuery("sys_id", registroLog);
        grLog.query();
        if (grLog.next()) {
          grLog.u_worklog = worklog;
          grLog.update();
        }
      }

      if (tipo == "encerraLog") {
        //('encerraLog', registroLog, '', '', '')
        var grLog = new GlideRecord("u_scoc_controle");
        grLog.addQuery("sys_id", registroLog);
        grLog.query();
        if (grLog.next()) {
          grLog.u_state = 2;
          grLog.update();
        }
      }

      if (tipo == "atualizaDescricao") {
        //('atualizaDescricao', registroLog, '', '', '')
        var grLog = new GlideRecord("u_scoc_controle");
        grLog.addQuery("sys_id", registroLog);
        grLog.query();
        if (grLog.next()) {
          grLog.u_observacao = worklog;
          grLog.update();
        }
      }
    },
    type: "SC_OC_GetPendingAproovals",
  }
);
