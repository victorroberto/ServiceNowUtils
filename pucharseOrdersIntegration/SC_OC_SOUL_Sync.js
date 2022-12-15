/* Script responsavel por criar a solicitação de compra e seus itens ou a ordem de compra e seus itens do sistema MVSOUL */

var SC_OC_SOUL_Sync = Class.create();
SC_OC_SOUL_Sync.prototype = {
  initialize: function (codigoEmpresa, codigoFilial, numero) {},

  /* Realiza a sincronização dos aprovadores entre os sistemas */
  syncApr: function (autorizadores, gr, registroLog) {
    if (!Array.isArray(autorizadores)) {
      autorizadores = [autorizadores];
    }

    for (var i = 0; i < autorizadores.length; i++) {
      var apr = autorizadores[i];
      this.addApprover(apr.CD_USUARIO, gr, "approved");
    }
  },

  /* Esta função preenche os dados das solicitações de compra e seus itens na tabela de "Solicitações de Compra" */
  syncSc: function (integrador_gr, registroLog) {
    /* Se o u_data estiver nulo, significa que houve um erro e a integração nao retornou nada. */
    if (integrador_gr.getValue("u_data") == null) {
      /* Atualiza registro de controle na tabela SCOC Controle. Esse registro serve para acompanhamento do status da integração. */
      this._insereLog(
        "insereDescricao",
        registroLog,
        "Erro integracao null",
        "",
        ""
      );
    } else {
      /* Atualiza registro de controle na tabela SCOC Controle. Esse registro serve para acompanhamento do status da integração. */
      this._insereLog("insereDescricao", registroLog, "Processando", "", "");
      this._insereLog(
        "atualizaWorklog",
        registroLog,
        "Solicitações de Compra - MVSOUL: " + integrador_gr.getValue("u_data"),
        "",
        ""
      );
    }

    /* Adiciona dados recebidos na tabela da solicitação de compras */
    function persisteSC(grSolicitacaoCompra, sc) {
      grSolicitacaoCompra.setValue(
        "u_codigo_da_filial",
        sc.cd_multi_empresa + " - "
      );
      grSolicitacaoCompra.setValue("u_numero_da_solicitacao", sc.cd_sol_com);
      grSolicitacaoCompra.setValue("u_sistema_de_origem", "SOULMV");
      grSolicitacaoCompra.setValue("u_data_de_emissao", sc.dt_sol_com);
      grSolicitacaoCompra.setValue("u_observacao", sc.ds_mot_ped);
      grSolicitacaoCompra.setValue("u_valor_liquido", sc.vl_total);
      grSolicitacaoCompra.setValue("u_mn_setor", sc.nm_setor);
      grSolicitacaoCompra.setValue("u_cd_estoque", sc.cd_estoque);
      grSolicitacaoCompra.setValue("u_scoc_controle", registroLog);

      if (sc.tp_sol_com == "S") {
        grSolicitacaoCompra.setValue(
          "u_solicitacao_de_produto_ou_servico",
          "SERVIÇO"
        );
      } else if (sc.tp_sol_com == "P") {
        grSolicitacaoCompra.setValue(
          "u_solicitacao_de_produto_ou_servico",
          "PRODUTO"
        );
      }

      if (
        sc.nm_solicitante &&
        sc.nm_solicitante !== null &&
        sc.nm_solicitante !== "null"
      ) {
        grSolicitacaoCompra.setValue("u_solicitante", sc.nm_solicitante);
      } else {
        grSolicitacaoCompra.setValue("u_solicitante", "Não informado");
      }
    }

    /* Adiciona os dados nos itens da solicitação */
    function persisteSCItem(grItem, item, order_id, numero) {
      if (!item) return;
      grItem.setValue("parent", order_id);
      grItem.setValue("u_numero_da_solicitacao", numero);
      grItem.setValue("u_quantidade", item.QT_SOLIC);
      grItem.setValue("u_unidade_de_medida", item.DS_UNIDADE);
      grItem.setValue("u_scoc_controle", registroLog);

      if (item.TP_SOL_COM == "S") {
        grItem.setValue("u_complemento_do_item", item.NM_SERVICO);
        grItem.setValue("u_observacao", item.NM_SERVICO);
        grItem.setValue("u_sistema_de_origem", "SOULMV");
        grItem.setValue("u_tipo_solicitacao_compra", "SERVIÇO");
        grItem.setValue("u_codigo_do_servico", item.CD_SERVICO);
      } else {
        if (
          item.DS_PRODUTO &&
          item.DS_PRODUTO !== null &&
          item.DS_PRODUTO !== "null" &&
          item.DS_PRODUTO !== undefined &&
          item.DS_PRODUTO !== "undefined"
        ) {
          grItem.setValue("u_complemento_do_item", item.DS_PRODUTO);
        } else {
          grItem.setValue("u_complemento_do_item", item.NM_SERVICO);
        }
        grItem.setValue("u_codigo_do_servico", item.CD_PRODUTO);
        grItem.setValue("u_observacao", item.NM_SERVICO);
        grItem.setValue("u_tipo_solicitacao_compra", "PRODUTO");
        grItem.setValue("u_sistema_de_origem", "SOULMV");
      }
      return grItem.insert();
    }

    /* Adiciona dados recebidos na tabela de Ultima Compra */
    function persisteSCListaUltimaCompra(item, sysId_item) {
      if (!Array.isArray(item.listaUltimaCompra)) {
        item.listaUltimaCompra = [item.listaUltimaCompra];
      }

      /* Apaga todo o histórico (lista última compra) do produto */
      var grHistoricoProduto = new GlideRecord("u_produto_servico");
      grHistoricoProduto.addQuery("u_codpro", item.CD_PRODUTO);
      grHistoricoProduto.query();
      grHistoricoProduto.deleteMultiple();

      if (item.listaUltimaCompra.length <= 0) return;

      item.listaUltimaCompra.forEach(function (itemHistoricoCompra) {
        grHistoricoProduto.initialize();

        if (item.TP_SOL_COM == "S") {
          grHistoricoProduto.setValue("u_codigo_servico", item.CD_SERVICO);
          grHistoricoProduto.setValue("u_descricao", item.NM_SERVICO);
        } else {
          grHistoricoProduto.setValue("u_codpro", item.CD_PRODUTO);
          grHistoricoProduto.setValue("u_descricao", item.DS_PRODUTO);
        }
        grHistoricoProduto.setValue(
          "u_cd_sequencia",
          itemHistoricoCompra.CD_SEQUENCIA
        );
        grHistoricoProduto.setValue(
          "u_numero_da_solicitacao",
          itemHistoricoCompra.CD_TIPO
        );
        grHistoricoProduto.setValue("u_tipo", itemHistoricoCompra.TIPO);
        grHistoricoProduto.setValue(
          "u_descricao",
          itemHistoricoCompra.DS_PRODUTO
        );
        grHistoricoProduto.setValue(
          "u_qtd_entrada",
          itemHistoricoCompra.QT_ENTRADA
        );
        grHistoricoProduto.setValue(
          "u_vl_custo_real",
          itemHistoricoCompra.VL_CUSTO_REAL
        );
        grHistoricoProduto.setValue(
          "u_dt_entrada",
          itemHistoricoCompra.DT_ENTRADA
        );
        grHistoricoProduto.setValue(
          "u_cd_fornecedor",
          itemHistoricoCompra.CD_FORNECEDOR
        );
        grHistoricoProduto.setValue(
          "u_nome_do_fornecedor",
          itemHistoricoCompra.NM_FORNECEDOR
        );
        grHistoricoProduto.setValue("u_parent", sysId_item);
        grHistoricoProduto.insert();
      });
    }

    /* Formata objeto para percorrer entre as solicitações */
    var objetoResponse = JSON.parse(integrador_gr.getValue("u_data"));

    if (!objetoResponse) {
      return;
    }

    var solicitacao = objetoResponse["listaPendentes"];

    if (!solicitacao) {
      /* Atualiza registro de controle na tabela SCOC Controle. Esse registro serve para acompanhamento do status da integração. */
      this._insereLog("insereDescricao", registroLog, "Sem registros", "", "");
      this._insereLog("insereQtdSolicitacoes", registroLog, "", "", "0");
      return;
    }

    if (!Array.isArray(solicitacao)) {
      solicitacao = [solicitacao];
    }

    /* Atualiza registro de controle na tabela SCOC Controle. Esse registro serve para acompanhamento do status da integração. */
    this._insereLog(
      "insereQtdSolicitacoes",
      registroLog,
      "",
      "",
      solicitacao.length
    );

    /* Percorre todas as solicitações */
    for (var i = 0; i < solicitacao.length; i++) {
      var sc = solicitacao[i];

      if (!Array.isArray(sc.itens)) {
        sc.itens = [sc.itens];
      }

      var grSolicitacaoCompra = this.buscaSC(sc.cd_sol_com);
      var solicitacao_id;

      /* Verifica se existe um registro, se existir ele atualiza */
      if (grSolicitacaoCompra.next()) {
        solicitacao_id = grSolicitacaoCompra.getUniqueValue();
        persisteSC(grSolicitacaoCompra, sc);
        grSolicitacaoCompra.update();
      } else {
        /* Se não existe um registro, ele cria */
        grSolicitacaoCompra.initialize();
        persisteSC(grSolicitacaoCompra, sc);
        solicitacao_id = grSolicitacaoCompra.insert();
      }

      /* Verifica se existe uma solicitação de compra já criada, se existir ele atualiza ela */
      if (solicitacao_id) {
        /* Apaga itens existentes */
        var grItemUpdate = new GlideRecord("u_item_da_solicitacao_compra");
        grItemUpdate.addQuery("parent", solicitacao_id);
        grItemUpdate.query();
        grItemUpdate.deleteMultiple();

        /* Cria novos itens */
        sc.itens.map(function (item) {
          grItemUpdate.initialize();
          sysId_item = persisteSCItem(
            grItemUpdate,
            item,
            solicitacao_id,
            sc.cd_sol_com
          );
          persisteSCListaUltimaCompra(item, sysId_item);
        });

        /* Atualiza o nome da tabela dentro do registro na tabela u_integrador */
        integrador_gr.setValue(
          "u_table_name",
          grSolicitacaoCompra.getTableName()
        );
        integrador_gr.setValue(
          "u_table_sys_id",
          grSolicitacaoCompra.getUniqueValue()
        );
        integrador_gr.update();

        /* Adiciona o aprovador na tabela de solicitação de compra */
        this.addApprover(
          integrador_gr.getValue("u_approver"),
          grSolicitacaoCompra,
          "requested"
        );
      } else {
        gs.log("Erro ao criar SC = " + JSON.stringify(sc), "SC_OC_SOUL_Sync");
      }

      /* Atualiza historico de aprovações */
      if (sc.autorizadores) {
        this.syncApr(sc.autorizadores, grSolicitacaoCompra, registroLog);
      }

      /* Atualiza registro de controle na tabela SCOC Controle. Esse registro serve para acompanhamento do status da integração. */
      this._insereLog(
        "atualizaWorklog",
        registroLog,
        "Solicitação " + sc.cd_sol_com + " processada.",
        "",
        ""
      );
    }
    /* Atualiza registro de controle na tabela SCOC Controle. Esse registro serve para acompanhamento do status da integração. */
    this._insereLog(
      "atualizaWorklog",
      registroLog,
      "Todas as solicitações do MVSOUL processadas",
      "",
      ""
    );
  },

  /* Esta função preenche os dados das ordens de compra e seus itens na tabela de "Ordens de Compra" */
  syncOc: function (integrador_gr, registroLog) {
    /* Se o u_data estiver nulo, significa que houve um erro e a integração nao retornou nada. */
    if (integrador_gr.getValue("u_data") == null) {
      /* Atualiza registro de controle na tabela SCOC Controle. Esse registro serve para acompanhamento do status da integração. */
      this._insereLog(
        "insereDescricao2",
        registroLog,
        "Erro integracao null",
        "",
        ""
      );
    } else {
      /* Atualiza registro de controle na tabela SCOC Controle. Esse registro serve para acompanhamento do status da integração. */
      this._insereLog("insereDescricao2", registroLog, "Processando", "", "");
      this._insereLog(
        "atualizaWorklog",
        registroLog,
        "Ordens de Compra - MVSOUL: " + integrador_gr.getValue("u_data"),
        "",
        ""
      );
    }

    /* Adiciona dados recebidos na tabela da ordem de compra */
    function persisteOC(grOrdemCompra, oc) {
      grOrdemCompra.setValue("u_codigo_da_filial", oc.cd_multi_empresa + " - ");
      grOrdemCompra.setValue(
        "u_codigo_da_empresa",
        oc.cd_multi_empresa + " - "
      );
      grOrdemCompra.setValue("u_numero_da_ordem", oc.cd_ord_com);
      grOrdemCompra.setValue("u_sistema_de_origem", "SOULMV");
      grOrdemCompra.setValue("u_data_de_emissao", oc.dt_ord_com);
      grOrdemCompra.setValue(
        "u_condicao_de_pagamento",
        oc.ds_condicao_pagamento
      );
      grOrdemCompra.setValue("u_codigo_do_fornecedor", oc.nm_fornecedor);
      grOrdemCompra.setValue("u_valor_liquido", oc.vl_total);
      grOrdemCompra.setValue("u_situacao_da_ordem", oc.tp_situacao);
      grOrdemCompra.setValue("u_scoc_controle", registroLog);

      if (oc.tp_ord_com == "S") {
        grOrdemCompra.setValue("u_solicitacao_produto_ou_servico", "SERVIÇO");
      } else if (oc.tp_ord_com == "P") {
        grOrdemCompra.setValue("u_solicitacao_produto_ou_servico", "PRODUTO");
      }

      if (
        oc.nm_solicitante &&
        oc.nm_solicitante !== null &&
        oc.nm_solicitante !== "null"
      ) {
        grOrdemCompra.setValue("u_solicitante", oc.nm_solicitante);
      } else {
        grOrdemCompra.setValue("u_solicitante", "Não informado");
      }
    }

    /* Adiciona dados do item da ordem de compra */
    function persisteOCItem(grItem, item, order_id, numero, tp_solicitacao) {
      if (!item) return;
      grItem.setValue("parent", order_id);
      grItem.setValue("u_numero_da_ordem", numero);
      grItem.setValue("u_quantidade", item.QT_COMPRADA);
      grItem.setValue("u_unidade_de_medida", item.DS_UNIDADE);
      grItem.setValue("u_preco_unitario", item.VL_TOTAL / item.QT_COMPRADA);
      grItem.setValue("u_valor_liquido", item.VL_TOTAL);
      grItem.setValue("u_solicitacao_produto_ou_servico", item.TP_ORD_COM);
      grItem.setValue("u_scoc_controle", registroLog);

      if (tp_solicitacao == "S") {
        grItem.setValue("u_complemento_do_item", item.NM_SERVICO);
        grItem.setValue("u_solicitacao_produto_ou_servico", "SERVIÇO");
        grItem.setValue("u_codigo_do_servico", item.CD_SERVICO);
      } else {
        grItem.setValue("u_complemento_do_item", item.DS_PRODUTO);
        grItem.setValue("u_solicitacao_produto_ou_servico", "PRODUTO");
        grItem.setValue("u_codigo_do_produto", item.CD_PRODUTO);
      }
      return grItem.insert();
    }

    /* Adiciona dados recebidos na tabela de Ultima Compra */
    function persisteOcListaUltimaCompra(item, sysId_item) {
      if (!Array.isArray(item.listaUltimaCompra)) {
        item.listaUltimaCompra = [item.listaUltimaCompra];
      }

      /* Apaga todo o histórico (lista última compra) do produto */
      var grHistoricoProduto = new GlideRecord("u_produto_servico");
      grHistoricoProduto.addQuery("u_codpro", item.CD_PRODUTO);
      grHistoricoProduto.query();
      grHistoricoProduto.deleteMultiple();

      if (item.listaUltimaCompra.length <= 0) return;

      item.listaUltimaCompra.forEach(function (itemHistoricoCompra) {
        grHistoricoProduto.initialize();

        if (item.tp_ord_com == "S") {
          grHistoricoProduto.setValue("u_codigo_servico", item.CD_SERVICO);
        } else {
          grHistoricoProduto.setValue("u_codpro", item.CD_PRODUTO);
        }
        grHistoricoProduto.setValue(
          "u_cd_sequencia",
          itemHistoricoCompra.CD_SEQUENCIA
        );
        grHistoricoProduto.setValue(
          "u_numero_da_solicitacao",
          itemHistoricoCompra.CD_TIPO
        );
        grHistoricoProduto.setValue("u_tipo", itemHistoricoCompra.TIPO);
        grHistoricoProduto.setValue(
          "u_descricao",
          itemHistoricoCompra.DS_PRODUTO
        );
        grHistoricoProduto.setValue(
          "u_qtd_entrada",
          itemHistoricoCompra.QT_ENTRADA
        );
        grHistoricoProduto.setValue(
          "u_vl_custo_real",
          itemHistoricoCompra.VL_CUSTO_REAL
        );
        grHistoricoProduto.setValue(
          "u_dt_entrada",
          itemHistoricoCompra.DT_ENTRADA
        );
        grHistoricoProduto.setValue(
          "u_cd_fornecedor",
          itemHistoricoCompra.CD_FORNECEDOR
        );
        grHistoricoProduto.setValue(
          "u_nome_do_fornecedor",
          itemHistoricoCompra.NM_FORNECEDOR
        );
        grHistoricoProduto.setValue("u_parent", sysId_item);
        grHistoricoProduto.insert();
      });
    }

    /* Formata objeto para percorrer entre as solicitações */
    var objetoResponse = JSON.parse(integrador_gr.getValue("u_data"));

    if (!objetoResponse) {
      return;
    }

    var ordemCompra = objetoResponse["listaAbertas"];

    if (!ordemCompra) {
      /* Atualiza registro de controle na tabela SCOC Controle. Esse registro serve para acompanhamento do status da integração. */
      this._insereLog("insereDescricao2", registroLog, "Sem registros", "", "");
      this._insereLog("insereQtdOrdens", registroLog, "", "0", "");

      return;
    }

    if (!Array.isArray(ordemCompra)) {
      ordemCompra = [ordemCompra];
    }

    /* Atualiza registro de controle na tabela SCOC Controle. Esse registro serve para acompanhamento do status da integração. */
    this._insereLog("insereQtdOrdens", registroLog, "", ordemCompra.length, "");

    /* Percorre todas as ordens */
    for (var i = 0; i < ordemCompra.length; i++) {
      var oc = ordemCompra[i];

      if (!Array.isArray(oc.itens)) {
        oc.itens = [oc.itens];
      }

      var grOrdemCompra = this.buscaOC(oc.cd_ord_com);
      var order_id;

      /* Verifica se existe um registro, se existir ele atualiza */
      if (grOrdemCompra.next()) {
        order_id = grOrdemCompra.getUniqueValue();
        persisteOC(grOrdemCompra, oc);
        grOrdemCompra.update();
      } else {
        /* Se não existe um registro, ele cria */
        grOrdemCompra.initialize();
        persisteOC(grOrdemCompra, oc);
        order_id = grOrdemCompra.insert();
      }

      /* Verifica se existe uma ordem de compra já criada, se existir ele apaga seus itens, e cria novos */
      if (order_id) {
        var grItem = new GlideRecord("u_item_da_ordem_compra");

        /* Apaga itens existentes */
        grItem.addQuery("parent", order_id);
        grItem.query();
        grItem.deleteMultiple();

        /* Cria novos itens */
        oc.itens.map(function (item) {
          grItem.initialize();
          sysId_item = persisteOCItem(
            grItem,
            item,
            order_id,
            oc.cd_ord_com,
            oc.tp_ord_com
          );
          persisteOcListaUltimaCompra(item, sysId_item);
        });

        /* Atualiza o nome da tabela dentro do registro na tabela u_integrador */
        integrador_gr.setValue("u_table_name", grOrdemCompra.getTableName());
        integrador_gr.setValue(
          "u_table_sys_id",
          grOrdemCompra.getUniqueValue()
        );
        integrador_gr.update();

        /* Adiciona o aprovador na tabela de solicitação de compra */
        this.addApprover(
          integrador_gr.getValue("u_approver"),
          grOrdemCompra,
          "requested"
        );
      } else {
        gs.log("Erro ao criar OC = " + JSON.stringify(oc), "SC_OC_SOUL_Sync");
      }

      /* Atualiza historico de aprovações */
      if (oc.autorizadores) {
        this.syncApr(oc.autorizadores, grOrdemCompra, registroLog);
      }
      /* Atualiza registro de controle na tabela SCOC Controle. Esse registro serve para acompanhamento do status da integração. */
      this._insereLog(
        "atualizaWorklog",
        registroLog,
        "Ordem " + oc.cd_ord_com + " processada.",
        "",
        ""
      );
    }
    /* Atualiza registro de controle na tabela SCOC Controle. Esse registro serve para acompanhamento do status da integração. */
    this._insereLog(
      "atualizaWorklog",
      registroLog,
      "Todas as ordens do MV SOUL processadas",
      "",
      ""
    );
  },

  /* Adicona um novo aprovador na tabela enviada por parâmetro */
  addApprover: function (nextApprover, gr, state) {
    if (nextApprover != "NULL") {
      var grUser = new GlideRecord("sys_user");

      if (grUser.get("user_name", nextApprover)) {
        nextApproverSysId = grUser.sys_id;

        /* Chama a função 'retornaGrAprovacao' e verifica se ela retorna um aprovador */
        var approval_check_gr = this.retornaGrAprovacao(nextApproverSysId, gr);

        if (approval_check_gr) {
          /* Já existe um aprovador no chamado, atualizando a aprovação */
          if (
            state &&
            state != "not requested" &&
            approval_check_gr.getValue("state") != state
          ) {
            approval_check_gr.setValue("state", state);
            approval_check_gr.comments =
              "Rotina de Sincronização - Situação - SN";
            approval_check_gr.update();
          }
        } else {
          /* Não existe um aprovador no chamado, criando uma nova aprovação */
          var approval_gr = new GlideRecord("sysapproval_approver");
          approval_gr.initialize();
          approval_gr.state = state || "requested";
          approval_gr.source_table = gr.getTableName();
          approval_gr.approver = nextApproverSysId;
          approval_gr.sysapproval = gr.getUniqueValue();
          approval_gr.approval_column = "approval";
          approval_gr.comments = "Rotina de Sincronização SN";
          approval_gr.insert();
          var wf = new Workflow().getRunningFlows(gr);

          if (
            gr.getTableName() == "u_ordem_compra" &&
            state == "not requested"
          ) {
            while (wf.next()) {
              new Workflow().broadcastEvent(wf.sys_id, "oc.proxima.aprovacao");
            }
          }

          if (
            gr.getTableName() == "u_solicitacao_compra" &&
            state == "not requested"
          ) {
            while (wf.next()) {
              new Workflow().broadcastEvent(wf.sys_id, "sc.proxima.aprovacao");
            }
          }

          if (
            gr.getTableName() == "u_item_da_solicitacao_compra" &&
            state == "not requested"
          ) {
            while (wf.next()) {
              new Workflow().broadcastEvent(wf.sys_id, "sc.proxima.aprovacao");
            }
          }
        }
      }
    }
  },

  /* Verifica se já existe uma aprovação criada */
  retornaGrAprovacao: function (id, gr) {
    var approval_gr = new GlideRecord("sysapproval_approver");
    approval_gr.addQuery("source_table", gr.getTableName());
    approval_gr.addQuery("approver", id);
    approval_gr.addQuery("sysapproval", gr.getUniqueValue());
    approval_gr.query();

    if (approval_gr.next()) {
      return approval_gr;
    } else {
      return false;
    }
  },

  /* Retorna a busca da ordem de compra passada */
  buscaOC: function (numero) {
    var grOrdemCompra = new GlideRecord("u_ordem_compra");
    var query = gs.getMessage(
      "u_numero_da_ordem={0}^u_sistema_de_origem=SOULMV",
      [numero]
    );
    grOrdemCompra.addEncodedQuery(query);
    grOrdemCompra.query();
    return grOrdemCompra;
  },

  /* Retorna a busca da solicitação de compra passada */
  buscaSC: function (numero) {
    var grSolicitacaoCompra = new GlideRecord("u_solicitacao_compra");
    var query = gs.getMessage(
      "u_numero_da_solicitacao={0}^u_sistema_de_origem=SOULMV",
      [numero]
    );
    grSolicitacaoCompra.addEncodedQuery(query);
    grSolicitacaoCompra.query();
    return grSolicitacaoCompra;
  },

  /* Cria registro na tabela de controle. Ela serve para monitorar as execuções de integrações  */
  _insereLog: function (
    tipo,
    registroLog,
    worklog,
    qtdOrdens,
    qtdSolicitacoes
  ) {
    if (tipo == "atualizaWorklog") {
      var grLog = new GlideRecord("u_scoc_controle");
      grLog.addQuery("sys_id", registroLog);
      grLog.query();
      if (grLog.next()) {
        grLog.u_worklog = worklog;
        grLog.update();
      }
    }

    if (tipo == "insereQtdOrdens") {
      var grLog = new GlideRecord("u_scoc_controle");
      grLog.addQuery("sys_id", registroLog);
      grLog.query();
      if (grLog.next()) {
        grLog.u_quantidade_de_ordens = qtdOrdens;
        grLog.update();
      }
    }

    if (tipo == "insereQtdSolicitacoes") {
      var grLog = new GlideRecord("u_scoc_controle");
      grLog.addQuery("sys_id", registroLog);
      grLog.query();
      if (grLog.next()) {
        grLog.u_quantidade_de_solicitacoes = qtdSolicitacoes;
        grLog.update();
      }
    }

    if (tipo == "insereDescricao") {
      var grLog = new GlideRecord("u_scoc_controle");
      grLog.addQuery("sys_id", registroLog);
      grLog.query();
      if (grLog.next()) {
        grLog.u_observacao = worklog;
        grLog.update();
      }
    }

    if (tipo == "insereDescricao2") {
      var grLog = new GlideRecord("u_scoc_controle");
      grLog.addQuery("sys_id", registroLog);
      grLog.query();
      if (grLog.next()) {
        grLog.u_observacao_2 = worklog;
        grLog.update();
      }
    }
  },
  type: "SC_OC_SOUL_Sync",
};
