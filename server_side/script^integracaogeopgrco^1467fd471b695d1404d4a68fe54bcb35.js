/* Esse script inicia o fluxo da busca dos tickets para a integração GRCO/GEOP */

var integracao_geop_grco = Class.create();
integracao_geop_grco.prototype = Object.extendsObject(AbstractAjaxProcessor, {

    /* Função responsável por iniciar o fluxo da integração GRCO/GEOP. */
    execute: function () {

        /* Declaração de variáveis */
        var description = '';
        var descriptionLong = '';
        var mdrElementIdUsuario = '';
        var mdrElementIdGrupo = '';
        var assignedGroup = '';
        var idGrupoBackup = '736';
        
        var currentDate = gs.nowDateTime();
        var quinzeMinutosAtras = new GlideDateTime(gs.minutesAgo(15)).getDisplayValue();

        /* var timestampInicio = this._converteParaTimestamp(currentDate); //Converte data para timestamp
        var timestampFinal = this._converteParaTimestamp(quinzeMinutosAtras); //Converte data para timestamp */

        var timestampInicio = '1662033000';
        var timestampFinal = '1662036600';

        /* var timestampInicio = '1662318000';
        var timestampFinal = '1662490800'; */

        /* Chama a integração para buscar os tickets */
        var ticketsListados = this._ListarTickets(timestampInicio, timestampFinal);
        gs.log('ticketsListados.length: ' + ticketsListados.length, 'integracao_geop_grco');

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
                if (assignedGroup == 'CO_Grupo_GEOP') {
                    description = ticketForm[0].description;
                    descriptionLong = ticketForm[0].descriptionLong;
                    mdrElementIdUsuario = ticketForm[0].mdrElementId;

                    /* gs.log('ticketForm: ' + JSON.stringify({
                        description: description,
                        descriptionLong: descriptionLong,
                        mdrElementIdUsuario: mdrElementIdUsuario,
                    }), 'integracao_geop_grco'); */
                    
                    /* Chama a integração para listar o historico do ticket passando o mdrElementIdUsuario */
                    var historico = this._ListarHistorico(mdrElementIdUsuario);
                    //gs.log('historico: ' + JSON.stringify(historico), 'integracao_geop_grco');
                    //gs.log('historico.length: ' + historico.length, 'integracao_geop_grco');

                    /* Percorre os worklogs encontrados do historico */
                    for (var k = 0; k < historico.length; k++) {
                        var workLog = historico[k];
                        var action = workLog.description;
                        //gs.log('action ' + k + ' : ' + JSON.stringify(action), 'integracao_geop_grco');

                        /* Verifica se o workLog contém a action de 'Assumir Ticket', se for ele pega o creationUserName do workLog*/
                        if (action.includes('Action Taken: Assumir Ticket')) {
                            //gs.log('Action Taken: Assumir Ticket', 'integracao_geop_grco');
                            creationUserName = workLog.creationUserName;
                            break;
                        }
                    }
                    //gs.log('creationUserName Antes: ' + creationUserName, 'integracao_geop_grco');

                    /* Formata o UserName */
                    if (creationUserName.includes(' ')) {
                        creationUserName = creationUserName.split(",").reverse().join("+");
                        creationUserName = creationUserName.trim();
                    }
                    gs.log('creationUserName Depois: ' + creationUserName, 'integracao_geop_grco');

                    /* Chama a integração para consultar o usuário passando o creationUserName */
                    var infoUsuario = this._ListarUsuarioPorParam(creationUserName);
                    //gs.log('infoUsuario: ' + infoUsuario, 'integracao_geop_grco');
                    var idUsuario = infoUsuario[0].id;
                    gs.log('idUsuario: ' + idUsuario, 'integracao_geop_grco');

                    /* Chama a integração para consultar o grupo passando o mdrElementIdGrupo */
                    var dadosGrupos = this._ListarGrupoUsu(idUsuario);
                    gs.log('dadosGrupos: ' + dadosGrupos.length, 'integracao_geop_grco');
                    
                    for (var a = 0; a < dadosGrupos.length; a++) {
                        var grupo = dadosGrupos[a];
                        var grupoPrimario = grupo.isPrimary;
                        
                        if (grupoPrimario == 'Yes') {
                            mdrElementIdGrupo = grupo.mdrElementID;
                            break;
                        }
                    }
                    gs.log('mdrElementIdGrupo: ' + mdrElementIdGrupo, 'integracao_geop_grco');
                    
                    
                }
            }
        }
        return ticketsListados;
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

    /* Função responsável por converter a data recebida e a retorna em formato timestamp */
    _converteParaTimestamp: function (data) {
        timestamp = '';
        dataTmp = new GlideDateTime(data).getNumericValue() / 1000;
        timestamp = (Math.round((dataTmp * Math.pow(10, 0)).toFixed(0 - 1)) / Math.pow(10, 0)).toFixed(0);
        return timestamp;
    },
    type: 'integracao_geop_grco'
});