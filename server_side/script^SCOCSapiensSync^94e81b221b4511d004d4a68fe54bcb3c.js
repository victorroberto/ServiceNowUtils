/* Script responsavel por criar a solicitação de compra e seus itens ou a ordem de compra e seus itens do sistema SAPIENS */

var SC_OC_Sapiens_Sync = Class.create();
SC_OC_Sapiens_Sync.prototype = {

    sit_desc: {
        'Aprovado': 'approved',
        'Reprovado': 'rejected',
        'Cancelado': 'cancelled',
        'Em Análise': 'not requested'
    },

    initialize: function (codigoEmpresa, codigoFilial, numero) { },

    /* Retorna a busca da ordem de compra passada */
    getOcByExternalId: function (codigoEmpresa, codigoFilial, numero) {
        var grOrdemCompra = new GlideRecord("u_ordem_compra");
        var query = gs.getMessage("u_numero_da_ordem={0}^u_codigo_da_empresaSTARTSWITH{1} -^u_codigo_da_filialSTARTSWITH{2} -^u_sistema_de_origem=SAPIENS_WS", [numero, codigoEmpresa, codigoFilial]);
        grOrdemCompra.addEncodedQuery(query);
        grOrdemCompra.query();
        return grOrdemCompra;
    },

    /* Retorna a busca da solicitação de compra passada */
    getScByExternalId: function (codigoEmpresa, codigoFilial, numero) {
        var grOrdemCompra = new GlideRecord("u_solicitacao_compra");
        var query = gs.getMessage("u_numero_da_solicitacao={0}^u_codigo_da_empresaSTARTSWITH{1} -^u_codigo_da_filialSTARTSWITH{2} -^u_sistema_de_origem=SAPIENS_WS", [numero, codigoEmpresa, codigoFilial]);
        grOrdemCompra.addEncodedQuery(query);
        grOrdemCompra.query();
        return grOrdemCompra;
    },

    /* Realiza a sincronização dos aprovadores entre os sistemas */
    syncApr: function (integrador_gr, registroLog) {
        var xmlString = XMLUtilJS.unescapeForXMLText(integrador_gr.getValue('u_data'));
        xmlString = xmlString.replace(/\&/g, '&amp;');

        var helper = new XMLHelper(xmlString);
        var obj = helper.toObject();
        var h = obj["S:Body"]["ns2:historicoAprovacoesResponse"]["result"]["aprovacoes"];
        var sit = obj["S:Body"]["ns2:historicoAprovacoesResponse"]["result"]["situacao"];
        var eventName;

        var gr = new GlideRecord(integrador_gr.getValue("u_table_name"));

        if (gr.get(integrador_gr.getValue("u_table_sys_id"))) {

            if (gr.isNewRecord()) {
                return;
            }

            if (sit) {

                var sit_code = {
                    "APR": "Aprovado",
                    "REP": "Reprovado",
                    "CAN": "Cancelado",
                    "ANA": "Em Análise",
                    "Aprovado": "Aprovado",
                };

                var sit_desc = {
                    'Aprovado': 'approved',
                    'Reprovado': 'rejected',
                    'Cancelado': 'cancelled',
                    'Em Análise': 'not requested'
                };

                if (gr.getTableName() == 'u_ordem_compra') {
                    gr.setValue("u_situacao_da_ordem", sit_code[sit]);
                    eventName = "oc.proxima.aprovacao";
                }

                if (gr.getTableName() == 'u_item_da_solicitacao_compra') {
                    gr.setValue("u_situacao_do_item", sit_code[sit]);
                    eventName = "sc.proxima.aprovacao";
                }

                workflow.info(JSON.stringify(sit_code));
                workflow.info(sit);
                workflow.info(sit_code[sit]);
                gr.update();

                if (sit_code[sit] == "Aprovado" && eventName) {
                    var wf = new Workflow().getRunningFlows(gr);
                    while (wf.next()) {
                        new Workflow().broadcastEvent(wf.sys_id, eventName);
                    }
                }
            }

            if (!Array.isArray(h)) {
                h = [h];
            }

            var dt_hr;
            gr.update();

            for (var i = 0; i < h.length; i++) {
                var apr = h[i];
                if (!apr.dataApr) continue;
                dt_hr = apr.dataApr + " " + apr.horaApr;

                new SC_OC_Sapiens_Sync().addApprover(apr.aprovador, gr, sit_desc[apr.situacao], dt_hr);
            }
        }
    },

    /* Esta função preenche os dados das solicitações de compra e seus itens na tabela de "Solicitações de Compra" */
    syncSc: function (integrador_gr, registroLog) {

        /* Se o u_data estiver nulo, significa que houve um erro e a integração nao retornou nada. */
        if (integrador_gr.getValue('u_data') == null) {
            /* Atualiza registro de controle na tabela SCOC Controle. Esse registro serve para acompanhamento do status da integração. */
            this._insereLog('insereDescricao', registroLog, 'Erro integracao null', '', '');
        } else {
            /* Atualiza registro de controle na tabela SCOC Controle. Esse registro serve para acompanhamento do status da integração. */
            this._insereLog('insereDescricao', registroLog, 'Processando', '', '');
            this._insereLog('atualizaWorklog', registroLog, 'Solicitações de Compra - Sapiens: ' + integrador_gr.getValue('u_data'), '', '');
        }

        var xmlString = XMLUtilJS.unescapeForXMLText(integrador_gr.getValue('u_data'));
        xmlString = xmlString.replace(/\&/g, '&amp;');

        /* Adiciona dados recebidos na tabela da solicitação de compras */
        function persisteSc(grSolicitacaoCompra, sc) {
            grSolicitacaoCompra.setValue("u_codigo_da_empresa", sc.codigoEmpresa + ' - ' + sc.nomeEmpresa);
            grSolicitacaoCompra.setValue("u_codigo_da_filial", sc.codigoFilial + ' - ' + sc.nomeFilial);
            grSolicitacaoCompra.setValue("u_numero_da_solicitacao", sc.numero);
            grSolicitacaoCompra.setValue("u_sistema_de_origem", "SAPIENS_WS");
            grSolicitacaoCompra.setValue("u_tp_ordem", sc.tp_ord_com);
            grSolicitacaoCompra.setValue("u_data_de_emissao", sc.dataSolicitacao);
            grSolicitacaoCompra.setValue("u_solicitante", sc.nomeSolicitante);
            grSolicitacaoCompra.setValue("u_observacao", sc.observacao);
            grSolicitacaoCompra.setValue("u_valor_liquido", (sc.valorUnitario * sc.quantidadeSolicitada));
            grSolicitacaoCompra.setValue("u_scoc_controle", registroLog);
        }

        /* Busca registro na tabela de item da solicitação de compras e chama a função para adicionar os itens */
        function persisteItem(item, order_id, numero) {
            var grItem = new GlideRecord("u_item_da_solicitacao_compra");
            grItem.addQuery("parent", order_id);
            grItem.addQuery("u_numero_da_solicitacao", numero);
            grItem.addQuery("u_sequencia_do_item", item.sequencia);
            grItem.query();

            if (grItem.next()) {
                addValues(grItem, item, order_id, numero);
                grItem.update();
                return grItem;
            }

            grItem.initialize();
            addValues(grItem, item, order_id, numero);
            grItem.insert();
            return grItem;
        }

        /* Adiciona dados recebidos na tabela de item da solicitação de compras */
        function addValues(grItem, item, order_id, numero) {
            grItem.setValue("parent", order_id);
            grItem.setValue("u_numero_da_solicitacao", numero);
            grItem.setValue("u_sequencia_do_item", item.sequencia);
            grItem.setValue("u_data_da_entrega", item.dataSolicitacao);
            grItem.setValue("u_usuario_responsavel_pela_solicitacao", item.nomeSolicitante);
            grItem.setValue("u_solicitante", item.nomeSolicitante);
            grItem.setValue("u_complemento_do_item", item.descricaoProdutoServico);
            grItem.setValue("u_observacao", item.observacao);
            grItem.setValue("u_quantidade", item.quantidadeSolicitada);
            grItem.setValue("u_unidade_de_medida", item.unidadeMedida);
            grItem.setValue("u_valor_liquido", (item.valorUnitario * item.quantidadeSolicitada));
            grItem.setValue("u_valor_unitario", item.valorUnitario);
            grItem.setValue("u_sistema_de_origem", "SAPIENS_WS");
            grItem.setValue("u_scoc_controle", registroLog);

            /* Preenche informações do rateio */
            var rateios = item.rateio;
            var totalRateio = 0;
            var OBSERVACAO_DO_RATEIO;
            var arr_obs_rateio = [];

            if (!Array.isArray(rateios)) {
                rateios = [rateios];
            }

            rateios.forEach(function (rateio) {
                totalRateio += parseFloat(rateio.valorRateio);
            });

            rateios.forEach(function (rateio) {
                OBSERVACAO_DO_RATEIO = "CC" + rateio.codigoCentroCustos + " - " +
                    rateio.abreviaturaCentroCustos + '. ' + '\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0' +
                    ((parseFloat(rateio.valorRateio) * 100) / parseFloat(totalRateio)).toFixed(2) + "% -> R$ " +
                    rateio.valorRateio;
                arr_obs_rateio.push(OBSERVACAO_DO_RATEIO);
            });
            grItem.setValue('u_observacao_do_rateio', arr_obs_rateio.join('\n'));
        }

        /* Formata objeto para percorrer entre as solicitações */
        var helper = new XMLHelper(xmlString);
        var obj = helper.toObject();
        var scs = obj["S:Body"]["ns2:BuscarSCPendentesResponse"]["result"]["solicitacao"];

        if (!scs) {
            /* Atualiza registro de controle na tabela SCOC Controle. Esse registro serve para acompanhamento do status da integração. */
            this._insereLog('insereDescricao', registroLog, 'Sem registros', '', '');
            return;
        }

        if (!Array.isArray(scs)) {
            scs = [scs];
        }

        /* Atualiza registro de controle na tabela SCOC Controle. Esse registro serve para acompanhamento do status da integração. */
        this._insereLog('insereQtdSolicitacoes', registroLog, '', '', scs.length);

        /* Percorre todas as solicitações */
        for (var i = 0; i < scs.length; i++) {
            var sc = scs[i];

            if (!Array.isArray(sc.item)) {
                sc.item = [sc.item];
            }

            var grSolicitacaoCompra = this.getScByExternalId(sc.codigoEmpresa, sc.codigoFilial, sc.numero);

            /* Verifica se existe uma solicitação de compra já criada, se existir ele atualiza ela */
            if (grSolicitacaoCompra.next()) {
                order_id = grSolicitacaoCompra.getUniqueValue();
                persisteSc(grSolicitacaoCompra, sc);
                grSolicitacaoCompra.update();
                grItem = persisteItem(sc, order_id, sc.numero);
            } else {
                /* Se não existe uma solicitação de compra, ele cria ela */
                grSolicitacaoCompra.initialize();
                persisteSc(grSolicitacaoCompra, sc);
                order_id = grSolicitacaoCompra.insert();
                grItem = persisteItem(sc, order_id, sc.numero);
            }

            if (grItem.sys_id) {
                /* Atualiza o nome da tabela dentro do registro na tabela u_integrador */
                integrador_gr.setValue("u_table_name", grSolicitacaoCompra.getTableName());
                integrador_gr.setValue("u_table_sys_id", grSolicitacaoCompra.getUniqueValue());
                integrador_gr.update();

                /* Adiciona o aprovador na tabela de solicitação de compra */
                this.addApprover(integrador_gr.getValue("u_approver"), grItem, "requested");
            } else {
                gs.log('Erro ao criar SC = ' + JSON.stringify(sc), 'SC_OC_Sapiens_Sync');
            }

            /* Atualiza historico de aprovações */
            if (sc.autorizadores) {
                this.syncApr(sc.autorizadores, grSolicitacaoCompra);
            }
            var numeroSequencia = sc.numero + '/' + sc.sequencia;

            /* Monta a função para ser passada por callback para o syncApr */
            var callback = 'function (integrador_gr) {' +
                'new SC_OC_Sapiens_Sync().syncApr(integrador_gr, "' + registroLog + '");' +
                '}';

            /* Chama a função 'montaPayloadHistorico' no script 'SC_OC_GetAprovacoesSAPIENS'. Onde executa a busca do historico das aprovações */
            new SC_OC_GetAprovacoesSAPIENS().montaPayloadHistorico(sc.codigoEmpresa, sc.codigoFilial, numeroSequencia, "SC", grItem.getTableName(), grItem.getUniqueValue(), callback);

            /* Atualiza registro de controle na tabela SCOC Controle. Esse registro serve para acompanhamento do status da integração. */
            this._insereLog('atualizaWorklog', registroLog, 'Solicitação ' + sc.numero + ' processada.', '', '');
        }
        /* Atualiza registro de controle na tabela SCOC Controle. Esse registro serve para acompanhamento do status da integração. */
        this._insereLog('atualizaWorklog', registroLog, 'Todas as solicitações processadas', '', '');
    },

    /* Esta função preenche os dados das ordens de compra e seus itens na tabela de "Ordens de Compra" */
    syncOc: function (integrador_gr, registroLog) {

        /* Se o u_data estiver nulo, significa que houve um erro e a integração nao retornou nada. */
        if (integrador_gr.getValue('u_data') == null) {
            /* Atualiza registro de controle na tabela SCOC Controle. Esse registro serve para acompanhamento do status da integração. */
            this._insereLog('insereDescricao2', registroLog, 'Erro integracao null', '', '');
        } else {
            /* Atualiza registro de controle na tabela SCOC Controle. Esse registro serve para acompanhamento do status da integração. */
            this._insereLog('insereDescricao2', registroLog, 'Processando', '', '');
            this._insereLog('atualizaWorklog', registroLog, 'Ordens de Compra - Sapiens: ' + integrador_gr.getValue('u_data'), '', '');
        }

        var xmlString = XMLUtilJS.unescapeForXMLText(integrador_gr.getValue('u_data'));
        xmlString = xmlString.replace(/\&/g, '&amp;');

        /* Adiciona dados recebidos na tabela das ordens de compras */
        function persisteOc(grOrdemCompra, oc) {
            grOrdemCompra.setValue("u_codigo_da_empresa", oc.codigoEmpresa + ' - ' + oc.nomeEmpresa);
            grOrdemCompra.setValue("u_codigo_da_filial", oc.codigoFilial + ' - ' + oc.nomeFilial);
            grOrdemCompra.setValue("u_numero_da_ordem", oc.numero);
            grOrdemCompra.setValue("u_sistema_de_origem", "SAPIENS_WS");
            grOrdemCompra.setValue("u_data_de_emissao", oc.dataEmissao);
            grOrdemCompra.setValue("u_observacao", oc.observacao);
            grOrdemCompra.setValue("u_codigo_do_fornecedor", oc.nomeFornecedor);
            grOrdemCompra.setValue("u_valor_liquido", oc.totalAprovacao);
            grOrdemCompra.setValue("u_tp_ordem", oc.tp_ord_com);
            grOrdemCompra.setValue("u_scoc_controle", registroLog);

            if (oc.nomeSolicitante && oc.nomeSolicitante !== null && oc.nomeSolicitante !== "null") {
                grOrdemCompra.setValue("u_solicitante", oc.nomeSolicitante);
            } else {
                grOrdemCompra.setValue("u_solicitante", 'Não informado');
            }
        }

        /* Adiciona dados recebidos na tabela de item da ordem de compra */
        function persisteItem(grItem, item, order_id, numero) {
            grItem.setValue("parent", order_id);
            grItem.setValue("u_numero_da_ordem", numero);
            grItem.setValue("u_complemento_do_item", item.descricao);
            grItem.setValue("u_observacao", item.observacao);
            grItem.setValue("u_quantidade", item.quantidadeSolicitada);
            grItem.setValue("u_unidade_de_medida", item.unidadeMedida);
            grItem.setValue("u_valor_liquido", item.valorLiquido);
            grItem.setValue("u_preco_unitario", item.valorUnitario);
            grItem.setValue("u_scoc_controle", registroLog);

            /* Preenche informações do rateio */
            var rateios = item.rateio;
            var totalRateio = 0;
            var OBSERVACAO_DO_RATEIO;
            var arr_obs_rateio = [];

            if (!Array.isArray(rateios)) {
                rateios = [rateios];
            }

            rateios.forEach(function (rateio) {
                totalRateio += parseFloat(rateio.valorRateio);
            });

            rateios.forEach(function (rateio) {
                OBSERVACAO_DO_RATEIO = "CC" + rateio.codigoCentroCustos + " - " +
                    rateio.abreviaturaCentroCustos + '.' + '\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0' +
                    ((parseFloat(rateio.valorRateio) * 100) / parseFloat(totalRateio)).toFixed(2) + "% -> R$ " +
                    rateio.valorRateio;
                arr_obs_rateio.push(OBSERVACAO_DO_RATEIO);
            });
            grItem.setValue('u_observacao_do_rateio', arr_obs_rateio.join('\n'));
        }

        /* Formata objeto para percorrer entre as solicitações */
        var helper = new XMLHelper(xmlString);
        var obj = helper.toObject();
        var ocs = obj["S:Body"]["ns2:buscarOCPendentesResponse"]["result"]["ordemCompra"];

        if (!ocs) {
            /* Atualiza registro de controle na tabela SCOC Controle. Esse registro serve para acompanhamento do status da integração. */
            this._insereLog('insereDescricao2', registroLog, 'Sem registros', '', '');
            return;
        }

        if (!Array.isArray(ocs)) {
            ocs = [ocs];
        }

        /* Atualiza registro de controle na tabela SCOC Controle. Esse registro serve para acompanhamento do status da integração. */
        this._insereLog('insereQtdOrdens', registroLog, '', ocs.length, '');

        /* Percorre todas as ordens */
        for (var i = 0; i < ocs.length; i++) {
            var oc = ocs[i];

            if (!Array.isArray(oc.item)) {
                oc.item = [oc.item];
            }
            var grOrdemCompra = this.getOcByExternalId(oc.codigoEmpresa, oc.codigoFilial, oc.numero);

            /* Verifica se existe um registro, se existir ele atualiza */
            if (grOrdemCompra.next()) {
                order_id = grOrdemCompra.getUniqueValue();
                persisteOc(grOrdemCompra, oc);
                grOrdemCompra.update();
            } else {
                /* Se não existe um registro, ele cria */
                grOrdemCompra.initialize();
                persisteOc(grOrdemCompra, oc);
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
                oc.item.map(function (item) {
                    grItem.initialize();
                    persisteItem(grItem, item, order_id, oc.numero);
                    grItem.insert();
                });

                /* Atualiza o nome da tabela dentro do registro na tabela u_integrador */
                integrador_gr.setValue("u_table_name", grOrdemCompra.getTableName());
                integrador_gr.setValue("u_table_sys_id", grOrdemCompra.getUniqueValue());
                integrador_gr.update();

                /* Adiciona o aprovador na tabela de ordem de compra */
                this.addApprover(integrador_gr.getValue("u_approver"), grOrdemCompra, "requested");
            } else {
                gs.log('Erro ao criar OC = ' + JSON.stringify(oc), 'SC_OC_Sapiens_Sync');
            }

            /* Atualiza historico de aprovações */
            if (oc.autorizadores) {
                this.syncApr(oc.autorizadores, grOrdemCompra);
            }

            /* Monta a função para ser passada por callback para o syncApr */
            var callback = 'function (integrador_gr) {' +
                'new SC_OC_Sapiens_Sync().syncApr(integrador_gr, "' + registroLog + '");' +
                '}';

            /* Chama a função 'montaPayloadHistorico' no script 'SC_OC_GetAprovacoesSAPIENS'. Onde executa a busca do historico das aprovações */
            new SC_OC_GetAprovacoesSAPIENS().montaPayloadHistorico(oc.codigoEmpresa, oc.codigoFilial, oc.numero, "OC", grOrdemCompra.getTableName(), grOrdemCompra.getUniqueValue(), callback);

            /* Atualiza registro de controle na tabela SCOC Controle. Esse registro serve para acompanhamento do status da integração. */
            this._insereLog('atualizaWorklog', registroLog, 'Ordem ' + oc.numero + ' processada.', '', '');
        }
        /* Atualiza registro de controle na tabela SCOC Controle. Esse registro serve para acompanhamento do status da integração. */
        this._insereLog('atualizaWorklog', registroLog, 'Todas as ordens processadas', '', '');
    },

    /* Verifica se usuário faz parte do grupo de aprovadores, se sim retorna seu sysid */
    getApprover: function (aprovador) {
        var grAprov = new GlideRecord('sys_user_grmember');
        grAprov.addEncodedQuery('group=f643c8096f4513001d86d7aabb3ee43e^user.user_name=' + aprovador);
        grAprov.query();

        if (grAprov.next()) {
            return grAprov.user.sys_id + '';
        }
        return null;
    },

    /* Adicona um novo aprovador na tabela enviada por parâmetro */
    addApprover: function (nextApprover, gr, state, dt_hr_aprovacao) {
        if (nextApprover != 'NULL') {
            /* Chama a função 'getApprover' e verifica se ela retorna um aprovador */
            var nextApproverSysId = this.getApprover(nextApprover);

            if (nextApproverSysId) {
                var approval_check_gr = this.approverAlreadySet(nextApproverSysId, gr);

                /* Já existe um aprovador no chamado, atualizando a aprovação */
                if (approval_check_gr) {
                    if (state && state != "not requested" && approval_check_gr.getValue("state") != state) {
                        approval_check_gr.setValue("state", state);
                        approval_check_gr.comments = 'Rotina de Sincronização - Situação - SN';
                        approval_check_gr.update();
                    }
                } else {
                    /* Não existe um aprovador no chamado, criando uma nova aprovação */
                    var approval_gr = new GlideRecord('sysapproval_approver');
                    approval_gr.initialize();
                    approval_gr.state = state || 'requested';
                    approval_gr.source_table = gr.getTableName();
                    approval_gr.approver = nextApproverSysId;
                    approval_gr.sysapproval = gr.getUniqueValue();
                    approval_gr.approval_column = "approval";
                    approval_gr.comments = 'Rotina de Sincronização SN';
                    approval_gr.insert();

                    if (state == "not requested") {
                        var wf = new Workflow().getRunningFlows(gr);

                        if (gr.getTableName() == "u_ordem_compra") {
                            while (wf.next()) {
                                new Workflow().broadcastEvent(wf.sys_id, "oc.proxima.aprovacao");
                            }
                        }

                        if (gr.getTableName() == "u_item_da_solicitacao_compra") {
                            while (wf.next()) {
                                new Workflow().broadcastEvent(wf.sys_id, "sc.proxima.aprovacao");
                            }
                        }
                    }
                }
            } else {
                /* Se a função 'getApprover' não retorna um aprovador, ele insere uma aprovação com o usuário 'admin' */
                var apr_gr = new GlideRecord('sysapproval_approver');
                apr_gr.initialize();
                apr_gr.state = state || 'Approved';
                apr_gr.source_table = gr.getTableName();
                apr_gr.approver = 'admin';
                apr_gr.sysapproval = gr.getUniqueValue();
                apr_gr.approval_column = "approval";
                apr_gr.comments = 'Este item foi aprovado por: ' + nextApprover + ' em ' + dt_hr_aprovacao;
                apr_gr.insert();
            }
        }
    },

    /* Verifica se já existe uma aprovação criada */
    approverAlreadySet: function (id, gr) {
        var approval_gr = new GlideRecord('sysapproval_approver');
        approval_gr.addQuery('source_table', gr.getTableName());
        approval_gr.addQuery('approver', id);
        approval_gr.addQuery('sysapproval', gr.getUniqueValue());
        approval_gr.query();

        if (approval_gr.next()) {
            return approval_gr;
        } else {
            return false;
        }
    },

    /* Função responsável por criar e atualizar o registro de controle na tabela SCOC Controle. Esse registro serve para acompanhamento do status da integração. */
    _insereLog: function (tipo, registroLog, worklog, qtdOrdens, qtdSolicitacoes) {

        if (tipo == 'atualizaWorklog') {
            var grLog = new GlideRecord('u_scoc_controle');
            grLog.addQuery('sys_id', registroLog);
            grLog.query();
            if (grLog.next()) {
                grLog.u_worklog = worklog;
                grLog.update();
            }
        }

        if (tipo == 'insereQtdOrdens') {
            var grLog = new GlideRecord('u_scoc_controle');
            grLog.addQuery('sys_id', registroLog);
            grLog.query();
            if (grLog.next()) {
                grLog.u_quantidade_de_ordens = qtdOrdens;
                grLog.update();
            }
        }

        if (tipo == 'insereQtdSolicitacoes') {
            var grLog = new GlideRecord('u_scoc_controle');
            grLog.addQuery('sys_id', registroLog);
            grLog.query();
            if (grLog.next()) {
                grLog.u_quantidade_de_solicitacoes = qtdSolicitacoes;
                grLog.update();
            }
        }

        if (tipo == 'insereDescricao') {
            var grLog = new GlideRecord('u_scoc_controle');
            grLog.addQuery('sys_id', registroLog);
            grLog.query();
            if (grLog.next()) {
                grLog.u_observacao = worklog;
                grLog.update();
            }
        }

        if (tipo == 'insereDescricao2') {
            var grLog = new GlideRecord('u_scoc_controle');
            grLog.addQuery('sys_id', registroLog);
            grLog.query();
            if (grLog.next()) {
                grLog.u_observacao_2 = worklog;
                grLog.update();
            }
        }
    },
    type: 'SC_OC_Sapiens_Sync'
};