/* Esse script inicia o fluxo da busca dos tickets para a integração GRCO/GEOP/GRCC */

var Integracao_CSM_CA = Class.create();
Integracao_CSM_CA.prototype = Object.extendsObject(AbstractAjaxProcessor, {

    /* Função responsável por iniciar o fluxo da integração GRCO/GEOP. */
    executeGEOP: function () {

        /* Declaração de variáveis */
        var description = '';
        var descriptionLong = '';
        var mdrElementIdUsuario = '';
        var mdrElementIdGrupo = '';
        var assignedGroup = '';
        var creationUserName = '';
        var idGrupoUsuarioVazio = '';
        var reasonCode = 'Ticket Respondido pela Area';

        var currentDate = gs.nowDateTime();
        var quinzeMinutosAtras = new GlideDateTime(gs.minutesAgo(15)).getDisplayValue();

        /* var timestampInicio = this._converteParaTimestamp(currentDate); //Converte data para timestamp
        var timestampFinal = this._converteParaTimestamp(quinzeMinutosAtras); //Converte data para timestamp */

        /* var timestampInicio = '1662033000';
        var timestampFinal = '1662036600'; */

        var timestampInicio = '1662980400';
        var timestampFinal = '1662984000';

        /* Chama a integração para buscar os tickets */
        var ticketsListados = this._ListarTickets(timestampInicio, timestampFinal);
        gs.log('ticketsListados.length: ' + ticketsListados.length, 'Integracao_CSM_CA');

        /* Percorre os tickets encontrados */
        for (var i = 0; i < ticketsListados.length; i++) {
            var ticket = ticketsListados[i];

            /* Verifica se existe algum ticket */
            if (!Array.isArray(ticket.ticketIdentifier)) {
                ticket.ticketIdentifier = [ticket.ticketIdentifier];

                /* Chama a integração para consultar o ticket passando o ticketIdentifier */
                var ticketForm = this._ConsultarTicket(ticket.ticketIdentifier);

                assignedGroup = ticketForm[0].assignedGroup;

                /* Verifica se o assignedGroup do ticket é 'CO_Grupo_GEOP', se for ele pega o description, descriptionLong e mdrElementIdUsuario do ticket */
                if (assignedGroup != 'CO_Grupo_GEOP') {
                    description = ticketForm[0].description;
                    descriptionLong = ticketForm[0].descriptionLong;
                    mdrElementIdUsuario = ticketForm[0].mdrElementId;

                    /* gs.log('ticketForm: ' + JSON.stringify({
                        description: description,
                        descriptionLong: descriptionLong,
                        mdrElementIdUsuario: mdrElementIdUsuario,
                    }), 'Integracao_CSM_CA'); */

                    /* Chama a integração para listar o historico do ticket passando o mdrElementIdUsuario */
                    var historico = this._ListarHistorico(mdrElementIdUsuario);
                    //gs.log('historico: ' + JSON.stringify(historico), 'Integracao_CSM_CA');
                    //gs.log('historico.length: ' + historico.length, 'Integracao_CSM_CA');

                    /* Percorre os worklogs encontrados do historico */
                    for (var k = 0; k < historico.length; k++) {
                        var workLog = historico[k];
                        var action = workLog.description;
                        //gs.log('action ' + k + ' : ' + JSON.stringify(action), 'Integracao_CSM_CA');

                        /* Verifica se o workLog contém a action de 'Assumir Ticket', se for ele pega o creationUserName do workLog*/
                        if (action.includes('Action Taken: Assumir Ticket')) {
                            //gs.log('Action Taken: Assumir Ticket', 'Integracao_CSM_CA');
                            creationUserName = workLog.creationUserName;
                            break;
                        }
                    }
                    //gs.log('creationUserName Antes: ' + creationUserName, 'Integracao_CSM_CA');

                    /* Verifica se não retornou nenhum usuário */
                    if (!creationUserName) {
                        /* Se não retornou o usuário, o idGrupoUsuarioVazio = 736 */
                        idGrupoUsuarioVazio = '736';

                    } else {
                        /* Se retornou o usuário, formata o UserName */
                        if (creationUserName.includes(' ')) {
                            creationUserName = creationUserName.split(",").reverse().join("+");
                            creationUserName = creationUserName.trim();
                        }
                        gs.log('creationUserName Depois: ' + creationUserName, 'Integracao_CSM_CA');

                        /* Chama a integração para consultar o usuário passando o creationUserName */
                        var infoUsuario = this._ListarUsuarioPorParam(creationUserName);
                        var idUsuario = infoUsuario[0].id;
                        gs.log('idUsuario: ' + idUsuario, 'Integracao_CSM_CA');

                        /* Chama a integração para consultar o grupo passando o mdrElementIdGrupo */
                        var dadosGrupos = this._ListarGrupoUsu(idUsuario);
                        gs.log('dadosGrupos: ' + dadosGrupos.length, 'Integracao_CSM_CA');

                        for (var a = 0; a < dadosGrupos.length; a++) {
                            var grupo = dadosGrupos[a];
                            var grupoPrimario = grupo.isPrimary;

                            if (grupoPrimario == 'Yes') {
                                mdrElementIdGrupo = grupo.mdrElementID;
                                break;
                            }
                        }
                        gs.log('mdrElementIdGrupo: ' + mdrElementIdGrupo, 'Integracao_CSM_CA');
                    }

                    /* Verifica se o idGrupoUsuarioVazio está vazio */
                    if (!idGrupoUsuarioVazio) {

                        var alterarTicket = this._AlterarTicket(ticketForm[0].ticketIdentifier, reasonCode, mdrElementIdGrupo, idUsuario);

                        gs.log('idGrupoUsuario não está vazio: ' + JSON.stringify({
                            ticket: ticketForm[0].ticketIdentifier,
                            reasonCode: reasonCode,
                            assignedIndividual: idUsuario,
                            mdrElementIdGrupo: mdrElementIdGrupo,
                            alterarTicket: alterarTicket
                        }), 'Integracao_CSM_CA');

                    } else {

                        var alterarTicket = this._AlterarTicket(ticketForm[0].ticketIdentifier, reasonCode, idGrupoUsuarioVazio);

                        gs.log('idGrupoUsuario está vazio:  ' + JSON.stringify({
                            ticket: ticketForm[0].ticketIdentifier,
                            reasonCode: reasonCode,
                            mdrElementIdGrupo: idGrupoUsuarioVazio,
                            alterarTicket: alterarTicket
                        }), 'Integracao_CSM_CA');
                    }
                }
            }
        }
        return ticketsListados;
    },

    /* Função responsável por iniciar o fluxo da integração GRCO/GRCC. */
    executeGRCC: function () {

        /* Declaração de variáveis */
        var caregorizationClasses = ['RE_COPARTICIPACAO', 'RE_FATURAMENTO', 'RE_FINANCEIRO', 'RE_GESTAO DE REDES', 'RE_IMPLANTACAO', 'RE_ATENCAO DOMICILIAR',
            'RE_AUTORIZACAO', 'RE_ATENCAO DOMICILIAR INTERCAMBIO', 'RE_INTERFACE INTERCAMBIO', 'RE_OPERACOES PROVIMENTOS', 'RE_ORIENTACOES SOBRE O PLANO',
            'RE_CADASTRO, RE_PROCESSOS INTERNOS', 'RE_RELACIONAMENTO COM CLIENTES CORPORATIVOS', 'RE_UTILIZACAO DO SERVICO MEDICO', 'RE_BUSCA DE REDE BH',
            'RE_REEMBOLSO', 'RE_CPT, RE_RELACIONAMENTO COM CLIENTES INDIVIDUAIS', 'RE_SOLICITACAO DE CANCELAMENTO', 'RE_ATESTADOS', 'RE_ESPACO DO CLIENTE',
            'RE_CAMPANHAS DE RELACIONAMENTO', 'RE_NUCLEO DE CONTRATOS', 'RE_SOLUCOES E QUALIDADE', 'RE_ANALISE DE INFORMACAO', 'RE_BUSCA DE REDE INTERCAMBIO',
            'RE_GESTAO DE MEDICOS COOPERADOS', 'RE_SERVICOS PROPRIOS', 'RE_CONSULTA AO ARQUIVO GERAL', 'RE_CONTAS A RECEBER', 'RE_DEMANDAS CONTABEIS',
            'RE_DEMANDAS JURIDICAS', 'RE_DEMANDAS REGULATORIAS', 'RE_ESPACO EMPRESA'
        ];

        return caregorizationClasses[0];
    },

    /* Chama integração para buscar os tickets e retorna aqueles que foram abertos nos ultimos 15 minutos */
    _ListarTickets: function (timestampInicio, timestampFinal) {
        /* Chama integração passando os parametros */
        try {
            listarTickets = new sn_ws.RESTMessageV2("Integracao_CSM_CA", "ListarTickets GET");
            listarTickets.setStringParameter("dataInicial", timestampInicio);
            listarTickets.setStringParameter("dataFinal", timestampFinal);
            response = listarTickets.execute();

            var responseBody = response.haveError() ? response.getErrorMessage() : response.getBody();
            status = response.getStatusCode();
        } catch (ex) {
            responseBody = ex.getMessage();
            status = '500';
        } finally {
            requestBody = listarTickets ? listarTickets.getRequestBody() : null;
        }

        /* Recebe os tickets encontrados */
        var retornoTickets = JSON.parse(responseBody);

        /* Se não encontrou nenhum ticket, retorna */
        if (!retornoTickets) {
            return;
        }

        /* Recebe o conteúdo dos tickets encontrados */
        var tickets = retornoTickets["content"];

        /* Se não encontrou nenhum conteúdo, retorna */
        if (!tickets) {
            return;
        }

        /* Verifica se os tickets estão em um array */
        if (!Array.isArray(tickets)) {
            tickets = [tickets];
        }
        return tickets;
    },

    /* Chama integração para buscar as informações do ticket que foi passado */
    _ConsultarTicket: function (ticketIdentifier) {
        /* Chama integração passando o parametro */
        try {
            consultarTicket = new sn_ws.RESTMessageV2("Integracao_CSM_CA", "ConsultarTicket GET");
            consultarTicket.setStringParameter("ticket", ticketIdentifier);
            response = consultarTicket.execute();

            var responseBody = response.haveError() ? response.getErrorMessage() : response.getBody();
            status = response.getStatusCode();
        } catch (ex) {
            responseBody = ex.getMessage();
            status = '500';
        } finally {
            requestBody = consultarTicket ? consultarTicket.getRequestBody() : null;
        }

        /* Recebe as informações dos tickets */
        var tickets = JSON.parse(responseBody);

        /* Se não encontrou nenhuma informação, retorna */
        if (!tickets) {
            return;
        }

        /* Recebe o conteúdo dos tickets encontrados */
        var ticketForm = tickets["content"];

        /* Se não encontrou nenhum conteúdo, retorna */
        if (!ticketForm) {
            return;
        }

        /* Verifica se os tickets estão em um array */
        if (!Array.isArray(ticketForm)) {
            ticketForm = [ticketForm];
        }
        return ticketForm;
    },

    /* Chama integração para buscar o historico do ticket que foi passado */
    _ListarHistorico: function (mdrElementId) {
        /* Chama integração passando o parametro */
        try {
            listarHistorico = new sn_ws.RESTMessageV2("Integracao_CSM_CA", "ListarHistorico GET");
            listarHistorico.setStringParameter("mdrElementId", mdrElementId);
            response = listarHistorico.execute();

            var responseBody = response.haveError() ? response.getErrorMessage() : response.getBody();
            status = response.getStatusCode();
        } catch (ex) {
            responseBody = ex.getMessage();
            status = '500';
        } finally {
            requestBody = listarHistorico ? listarHistorico.getRequestBody() : null;
        }

        /* Recebe as informações do historico */
        var listaHistorico = JSON.parse(responseBody);

        /* Se não encontrou nenhum historico, retorna */
        if (!listaHistorico) {
            return;
        }

        /* Recebe o conteúdo dos historicos encontrados */
        var historico = listaHistorico["content"];

        /* Se não encontrou nenhum conteúdo, retorna */
        if (!historico) {
            return;
        }

        /* Verifica se o historico esta em um array */
        if (!Array.isArray(historico)) {
            historico = [historico];
        }
        return historico;
    },

    _ListarUsuarioPorParam: function (usuario) {
        /* Chama integração passando os parametros */
        try {
            listarUsuarioPorParam = new sn_ws.RESTMessageV2("Integracao_CSM_CA", "ListarUsuarioPorParam GET");
            listarUsuarioPorParam.setStringParameter("usuario", usuario);
            response = listarUsuarioPorParam.execute();

            var responseBody = response.haveError() ? response.getErrorMessage() : response.getBody();
            status = response.getStatusCode();
        } catch (ex) {
            responseBody = ex.getMessage();
            status = '500';
        } finally {
            requestBody = listarUsuarioPorParam ? listarUsuarioPorParam.getRequestBody() : null;
        }

        /* Recebe as informações do historico */
        var infoUsuario = JSON.parse(responseBody);

        /* Se não encontrou nenhum historico, retorna */
        if (!infoUsuario) {
            return;
        }

        /* Recebe o conteúdo dos historicos encontrados */
        var dadosUsuario = infoUsuario["content"];

        /* Se não encontrou nenhum conteúdo, retorna */
        if (!dadosUsuario) {
            return;
        }

        /* Verifica se o historico esta em um array */
        if (!Array.isArray(dadosUsuario)) {
            dadosUsuario = [dadosUsuario];
        }
        return dadosUsuario;
    },

    _ListarGrupoUsu: function (idUsuario) {
        /* Chama integração passando os parametros */
        try {
            listarGrupoUsu = new sn_ws.RESTMessageV2("Integracao_CSM_CA", "ListarGrupoUsu GET");
            listarGrupoUsu.setStringParameter("idUsuario", idUsuario);
            response = listarGrupoUsu.execute();

            var responseBody = response.haveError() ? response.getErrorMessage() : response.getBody();
            status = response.getStatusCode();
        } catch (ex) {
            responseBody = ex.getMessage();
            status = '500';
        } finally {
            requestBody = listarGrupoUsu ? listarGrupoUsu.getRequestBody() : null;
        }

        /* Recebe as informações do grupo */
        var infoGrupo = JSON.parse(responseBody);

        /* Se não encontrou nenhum grupo, retorna */
        if (!infoGrupo) {
            return;
        }

        /* Recebe o conteúdo do grupo encontrado */
        var dadosGrupo = infoGrupo["content"];

        /* Se não encontrou nenhum conteúdo, retorna */
        if (!dadosGrupo) {
            return;
        }

        /* Verifica se o grupo esta em um array */
        if (!Array.isArray(dadosGrupo)) {
            dadosGrupo = [dadosGrupo];
        }
        return dadosGrupo;
    },

    _AlterarTicket: function (ticket, reasonCode, assignedGroupId, assignedIndividual) {
        /* Chama integração passando os parametros */
        try {

            if (!assignedIndividual) {
                listarGrupoUsu = new sn_ws.RESTMessageV2("Integracao_CSM_CA", "AlterarTicket sem Usuário | PUT");
                listarGrupoUsu.setStringParameter("ticket", ticket);
                listarGrupoUsu.setStringParameter("reasonCode", reasonCode);
                listarGrupoUsu.setStringParameter("assignedGroupId", assignedGroupId);
            } else {
                listarGrupoUsu = new sn_ws.RESTMessageV2("Integracao_CSM_CA", "AlterarTicket com Usuário | PUT");
                listarGrupoUsu.setStringParameter("ticket", ticket);
                listarGrupoUsu.setStringParameter("reasonCode", reasonCode);
                listarGrupoUsu.setStringParameter("assignedContactId", assignedIndividual);
                listarGrupoUsu.setStringParameter("assignedGroupId", assignedGroupId);
            }
            response = listarGrupoUsu.execute();

            var responseBody = response.haveError() ? response.getErrorMessage() : response.getBody();
            status = response.getStatusCode();
        } catch (ex) {
            responseBody = ex.getMessage();
            status = '500';
        } finally {
            requestBody = listarGrupoUsu ? listarGrupoUsu.getRequestBody() : null;
        }

        return JSON.parse(responseBody);
    },

    /* Função responsável por converter a data recebida e a retorna em formato timestamp */
    _converteParaTimestamp: function (data) {
        timestamp = '';
        dataTmp = new GlideDateTime(data).getNumericValue() / 1000;
        timestamp = (Math.round((dataTmp * Math.pow(10, 0)).toFixed(0 - 1)) / Math.pow(10, 0)).toFixed(0);
        return timestamp;
    },
    type: 'Integracao_CSM_CA'
});