/* Esse script inicia o fluxo da busca dos tickets para a integração GRCO/GEOP/GRCC */

var UBH_Busca_Chamados_CSM_CA = Class.create();
UBH_Busca_Chamados_CSM_CA.prototype = Object.extendsObject(
  AbstractAjaxProcessor,
  {
    /* Função responsável por iniciar o fluxo da integração GRCO/GEOP. */
    executeGEOP: function (dataInicio, dataFinal) {

      /* Declaração de variáveis */
      var assignedGroup = "";
      var timestampInicio = this._converteParaTimestamp(dataInicio); //Converte data para timestamp
      var timestampFinal = this._converteParaTimestamp(dataFinal); //Converte data para timestamp
      var slaForm = "";
      var slaDate = "";

      //var timestampInicio = '1669654800';
      //var timestampFinal = '1669741200';

      /* Chama a integração para buscar os tickets */
      var ticketsListados = this._ListarTickets(dataInicio, dataFinal);

      gs.log("Tickets GEOP: " + ticketsListados.length, "UBH_Busca_Chamados_CSM_CA");

      /* Percorre os tickets encontrados */
      for (var i = 0; i < ticketsListados.length; i++) {
        var ticket = ticketsListados[i];

        /* Chama a integração para consultar o ticket passando o ticketIdentifier */
        var ticketForm = this._ConsultarTicket(ticket.ticketIdentifier);
        assignedGroup = ticketForm[0].assignedGroup;

        /* Chama a integração para consultar o sla passando o mdrElementId */
        slaForm = this._ListarSlas(ticketForm[0].mdrElementId);

        /* Verifica se retornou SLA */
        if (!slaForm) {
          slaDate = 'Sem SLA';
        } else {
          slaDate = this._converteParaDate(slaForm.slADueTimestamp);
        }

        gs.log('slaDate: ' + JSON.stringify(slaDate), 'UBH_Busca_Chamados_CSM_CA');

        /* Chama função para criar registros na tabela de u_cadastro */
        if (slaDate == 'Sem SLA') {
          this._CriaChamadoCsmGEOP(ticketForm[0], '');
        } else {
          this._CriaChamadoCsmGEOP(ticketForm[0], slaDate);
        }

        /* Verifica se o assignedGroup do ticket é 'CO_Grupo_GEOP' */
        //if (assignedGroup != 'CO_Grupo_GEOP') {
        //
        //    gs.log('ticketForm: ' + JSON.stringify(ticketForm), 'UBH_Busca_Chamados_CSM_CA');
        //
        //    /* Chama função para criar registros na tabela de u_cadastro */
        //    this._CriaChamadoCSM(ticketForm[0], 'GEOP');
        //}
      }
      return ticketsListados;
    },

    /* Função responsável por iniciar o fluxo da integração GRCO/GRCC. */
    executeGRCC: function (dataInicio, dataFinal) {

      /* Declaração de variáveis */
      var assignedGroup = "";
      var tickets = [];
      var timestampInicio = this._converteParaTimestamp(dataInicio); //Converte data para timestamp
      var timestampFinal = this._converteParaTimestamp(dataFinal); //Converte data para timestamp
      var slaForm = "";
      var slaDate = "";

      var categorizationClass = ["RE_COPARTICIPACAO", "RE_FATURAMENTO", "RE_FINANCEIRO", "RE_GESTAO DE REDES", "RE_IMPLANTACAO", "RE_ATENCAO DOMICILIAR", "RE_AUTORIZACAO", "RE_ATENCAO DOMICILIAR INTERCAMBIO", "RE_INTERFACE INTERCAMBIO", "RE_OPERACOES PROVIMENTOS", "RE_ORIENTACOES SOBRE O PLANO", "RE_CADASTRO", "RE_PROCESSOS INTERNOS", "RE_RELACIONAMENTO COM CLIENTES CORPORATIVOS", "RE_UTILIZACAO DO SERVICO MEDICO", "RE_BUSCA DE REDE BH", "RE_REEMBOLSO", "RE_CPT", "RE_RELACIONAMENTO COM CLIENTES INDIVIDUAIS", "RE_SOLICITACAO DE CANCELAMENTO", "RE_ATESTADOS", "RE_ESPACO DO CLIENTE", "RE_CAMPANHAS DE RELACIONAMENTO", "RE_NUCLEO DE CONTRATOS", "RE_SOLUCOES E QUALIDADE", "RE_ANALISE DE INFORMACAO", "RE_BUSCA DE REDE INTERCAMBIO", "RE_GESTAO DE MEDICOS COOPERADOS", "RE_SERVICOS PROPRIOS", "RE_CONSULTA AO ARQUIVO GERAL", "RE_CONTAS A RECEBER", "RE_DEMANDAS CONTABEIS", "RE_DEMANDAS JURIDICAS", "RE_DEMANDAS REGULATORIAS", "RE_ESPACO EMPRESA"];

      /* Chama a integração para buscar os tickets de cada classe acima */
      for (var i = 0; i < categorizationClass.length; i++) {
        var listaTickets = this._ListarTicketsPorClasse(dataInicio, dataFinal, categorizationClass[i]);

        gs.log('listaTickets: ' + JSON.stringify({
          'categorizationClass': categorizationClass[i],
          'listaTickets': listaTickets,
        }), 'UBH_Busca_Chamados_CSM_CA');

        if (!listaTickets) continue;

        for (var j = 0; j < listaTickets.length; j++) {
          tickets.push(listaTickets[j]);
        }
      }

      gs.log("Tickets GRCC: " + tickets.length, "UBH_Busca_Chamados_CSM_CA");

      for (var k = 0; k < tickets.length; k++) {
        var ticket = tickets[k];

        /* Chama a integração para consultar o ticket passando o ticketIdentifier */
        var ticketForm = this._ConsultarTicket(ticket.ticketIdentifier);
        assignedGroup = ticketForm[0].assignedGroup;

        /* Chama a integração para consultar o sla passando o mdrElementId */
        slaForm = this._ListarSlas(ticketForm[0].mdrElementId);

        /* Verifica se retornou SLA */
        if (!slaForm) {
          slaDate = 'Sem SLA';
        } else {
          slaDate = this._converteParaDate(slaForm.slADueTimestamp);
        }

        gs.log('ticket: ' + JSON.stringify({
          'ticketForm': ticketForm[0],
          'slaDate': slaDate,
        }), 'UBH_Busca_Chamados_CSM_CA');

        /* Chama função para criar registros na tabela de u_cadastro */
        if (slaDate == 'Sem SLA') {
          this._CriaChamadoCsmGRCC(ticketForm[0], '');
        } else {
          this._CriaChamadoCsmGRCC(ticketForm[0], slaDate);
        }


        ///* Verifica se o assignedGroup do ticket é 'RE_GFIN - CADASTRO MEE' */
        //if (assignedGroup != 'RE_GFIN - CADASTRO MEE') {
        //
        //    gs.log('ticketForm: ' + JSON.stringify(ticketForm), 'UBH_Busca_Chamados_CSM_CA');
        //
        //    /* Chama função para criar registros na tabela de u_cadastro */
        //    this._CriaChamadoCSM(ticketForm[0], 'GRCC');
        //}
      }
      return tickets;
    },

    /* Função responsável por chamar a integração para buscar os tickets e retorna aqueles que foram abertos no periodo recebido */
    _ListarTickets: function (timestampInicio, timestampFinal) {
      /* Chama integração passando os parametros */
      try {
        listarTickets = new sn_ws.RESTMessageV2(
          "Integracao_CSM_CA",
          "ListarTickets GET"
        );
        listarTickets.setStringParameter("dataInicial", timestampInicio);
        listarTickets.setStringParameter("dataFinal", timestampFinal);
        response = listarTickets.execute();

        var responseBody = response.haveError()
          ? response.getErrorMessage()
          : response.getBody();
        status = response.getStatusCode();
      } catch (ex) {
        responseBody = ex.getMessage();
        status = "500";
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

    /* Função responsável por chamar a integração para buscar os tickets e retorna aqueles que foram abertos no periodo recebido e com a classe recebida */
    _ListarTicketsPorClasse: function (
      timestampInicio,
      timestampFinal,
      categorizationClass
    ) {
      /* Chama integração passando os parametros */
      try {
        listarTickets = new sn_ws.RESTMessageV2(
          "Integracao_CSM_CA",
          "ListarTicketsPorClasse GET"
        );
        listarTickets.setStringParameter("dataInicial", timestampInicio);
        listarTickets.setStringParameter("dataFinal", timestampFinal);
        listarTickets.setStringParameter(
          "categorizationClass",
          categorizationClass
        );
        response = listarTickets.execute();

        var responseBody = response.haveError()
          ? response.getErrorMessage()
          : response.getBody();
        status = response.getStatusCode();
      } catch (ex) {
        responseBody = ex.getMessage();
        status = "500";
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

    /* Chama integração para buscar os slas do ticket que foi passado */
    _ListarSlas: function (mdrElementId) {
      /* Chama integração passando o parametro */
      try {
        ListarSlas = new sn_ws.RESTMessageV2(
          "Integracao_CSM_CA",
          "ListarSlas GET"
        );
        ListarSlas.setStringParameter("mdrElementId", mdrElementId);
        response = ListarSlas.execute();

        var responseBody = response.haveError()
          ? response.getErrorMessage()
          : response.getBody();
        status = response.getStatusCode();
      } catch (ex) {
        responseBody = ex.getMessage();
        status = "500";
      } finally {
        requestBody = ListarSlas ? ListarSlas.getRequestBody() : null;
      }

      /* Recebe as informações do historico */
      var slas = JSON.parse(responseBody);

      gs.log('slas: ' + JSON.stringify(slas), 'UBH_Busca_Chamados_CSM_CA');

      /* Se não encontrou nenhum historico, retorna */
      if (!slas) {
        return;
      }

      /* Recebe o conteúdo dos historicos encontrados */
      var slaForm = slas["content"];

      /* Se não encontrou nenhum conteúdo, retorna */
      if (!slaForm) {
        return;
      }

      var retorno = "";

      /* Percorre os dados dos grupos encontrados do historico */
      for (var i = 0; i < slaForm.length; i++) {
        var sla = slaForm[i];

        if (sla.isViolationThreshold == false) {
          continue;
        } else {
          return sla;
        }
      }
    },

    /* Função responsável por chamar a integração para buscar as informações do ticket que foi passado */
    _ConsultarTicket: function (ticketIdentifier) {
      /* Chama integração passando o parametro */
      try {
        consultarTicket = new sn_ws.RESTMessageV2(
          "Integracao_CSM_CA",
          "ConsultarTicket GET"
        );
        consultarTicket.setStringParameter("ticket", ticketIdentifier);
        response = consultarTicket.execute();

        var responseBody = response.haveError()
          ? response.getErrorMessage()
          : response.getBody();
        status = response.getStatusCode();
      } catch (ex) {
        responseBody = ex.getMessage();
        status = "500";
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

    /* Função responsável por criar o chamado na tabela de u_cadastro */
    _CriaChamadoCsmGEOP: function (ticketForm, slaDate) {

      /* Formada data timestamp para data dd-mm-yyyy hh:mm:ss */
      var gdt = new GlideDateTime(this._converteParaDate(ticketForm.creationTimestamp));
      var dataAbertura = gdt.getDisplayValue();

      /* Formata nome do atendente */
      var creationUserName = ticketForm.creationUserName;
      creationUserName = creationUserName.split(",").reverse().join(" ").trim();
      creationUserName = creationUserName.normalize("NFD").replace(/[\u0300-\u036f]/g, ""); //Remove acentos e caracteres especiais da string

      /* Formata nome do solicitante */
      var requesterUserName = ticketForm.requesterUserName;
      requesterUserName = requesterUserName.split(",").reverse().join(" ").trim();
      requesterUserName = requesterUserName.normalize("NFD").replace(/[\u0300-\u036f]/g, ""); //Remove acentos e caracteres especiais da string
      requesterUserName = requesterUserName.slice(0, 19);

      /* Formata descrição resumida */
      var description = ticketForm.description;
      description = description.normalize("NFD").replace(/[\u0300-\u036f]/g, ""); //Remove acentos, caracteres especiais e quebras de linha da string
      description = description.replace("\n", "");

      /* Formata descrição */
      var descriptionLong = ticketForm.descriptionLong;
      descriptionLong = descriptionLong.normalize("NFD").replace(/[\u0300-\u036f]/g, ""); //Remove acentos, caracteres especiais e quebras de linha da string
      descriptionLong = descriptionLong.replace("\n", "");

      gs.log("Parametros Criar Chamado" +
        JSON.stringify({
          dataAbertura: dataAbertura,
          description: descriptionLong,
          short_description: description,
          ticket_csm_ca: ticketForm.ticketIdentifier,
          usuario_atendente: creationUserName,
          usuario_solicitante: requesterUserName,
          slaDate: slaDate,
        }), "UBH_Retorna_Chamados_CSM_CA");

      /* Chama integração passando os parametros */
      try {
        criaChamadoCsm = new sn_ws.RESTMessageV2("UBH_Cria_Chamado_Integracao_CSM_GEOP", "Default POST");
        criaChamadoCsm.setStringParameter("data_de_abertura_do_ticket", dataAbertura);
        criaChamadoCsm.setStringParameter("description", descriptionLong);
        criaChamadoCsm.setStringParameter("short_description", description);
        criaChamadoCsm.setStringParameter("sla_date", slaDate);
        criaChamadoCsm.setStringParameter("ticket_csm_ca", ticketForm.ticketIdentifier);
        criaChamadoCsm.setStringParameter("usuario_atendente", creationUserName);
        criaChamadoCsm.setStringParameter("usuario_solicitante", requesterUserName);
        response = criaChamadoCsm.execute();

        var responseBody = response.haveError()
          ? response.getErrorMessage()
          : response.getBody();
        status = response.getStatusCode();
      } catch (ex) {
        responseBody = ex.getMessage();
        status = "500";
      } finally {
        requestBody = criaChamadoCsm ? criaChamadoCsm.getRequestBody() : null;
      }

      /* gs.log(criaChamadoCsm.getRequestBody(), "UBH_Busca_Chamados_CSM_CA");
      gs.log(responseBody, "UBH_Busca_Chamados_CSM_CA"); */
    },

    /* Função responsável por criar o chamado na tabela de u_cadastro */
    _CriaChamadoCsmGRCC: function (ticketForm, slaDate) {

      gs.log("Criar Chamado Antes" +
        JSON.stringify({
          dataAbertura: ticketForm.creationTimestamp,
          description: ticketForm.descriptionLong,
          short_description: ticketForm.description,
          ticket_csm_ca: ticketForm.ticketIdentifier,
          usuario_atendente: ticketForm.creationUserName,
          usuario_solicitante: ticketForm.requesterUserName,
          slaDate: slaDate,
        }), "UBH_Retorna_Chamados_CSM_CA");

      /* Formada data timestamp para data dd-mm-yyyy hh:mm:ss */
      var gdt = new GlideDateTime(this._converteParaDate(ticketForm.creationTimestamp));
      var dataAbertura = gdt.getDisplayValue();

      /* Formata nome do atendente */
      var creationUserName = ticketForm.creationUserName;
      creationUserName = creationUserName.split(",").reverse().join(" ").trim();
      creationUserName = creationUserName.normalize("NFD").replace(/[\u0300-\u036f]/g, ""); //Remove acentos e caracteres especiais da string

      /* Formata nome do solicitante */
      var requesterUserName = ticketForm.requesterUserName;
      requesterUserName = requesterUserName.split(",").reverse().join(" ").trim();
      requesterUserName = requesterUserName.normalize("NFD").replace(/[\u0300-\u036f]/g, ""); //Remove acentos e caracteres especiais da string
      requesterUserName = requesterUserName.slice(0, 19);

      /* Formata descrição resumida */
      var description = ticketForm.description;
      description = description.normalize("NFD").replace(/[\u0300-\u036f]/g, ""); //Remove acentos, caracteres especiais e quebras de linha da string
      description = description.replace("\n", "");

      /* Formata descrição */
      var descriptionLong = ticketForm.descriptionLong;
      descriptionLong = descriptionLong.normalize("NFD").replace(/[\u0300-\u036f]/g, ""); //Remove acentos, caracteres especiais e quebras de linha da string
      descriptionLong = descriptionLong.replace("\n", "");

      gs.log("Parametros Criar Chamado" +
        JSON.stringify({
          dataAbertura: dataAbertura,
          description: descriptionLong,
          short_description: description,
          ticket_csm_ca: ticketForm.ticketIdentifier,
          usuario_atendente: creationUserName,
          usuario_solicitante: requesterUserName,
          slaDate: slaDate,
        }), "UBH_Retorna_Chamados_CSM_CA");

      /* Chama integração passando os parametros */
      try {
        criaChamadoCsm = new sn_ws.RESTMessageV2("UBH_Cria_Chamado_Integracao_CSM_Cadastro", "Default POST");
        criaChamadoCsm.setStringParameter("data_de_abertura_do_ticket", dataAbertura);
        criaChamadoCsm.setStringParameter("description", descriptionLong);
        criaChamadoCsm.setStringParameter("short_description", description);
        criaChamadoCsm.setStringParameter("sla_date", slaDate);
        criaChamadoCsm.setStringParameter("ticket_csm_ca", ticketForm.ticketIdentifier);
        criaChamadoCsm.setStringParameter("usuario_atendente", creationUserName);
        criaChamadoCsm.setStringParameter("usuario_solicitante", requesterUserName);
        response = criaChamadoCsm.execute();

        var responseBody = response.haveError()
          ? response.getErrorMessage()
          : response.getBody();
        status = response.getStatusCode();
      } catch (ex) {
        responseBody = ex.getMessage();
        status = "500";
      } finally {
        requestBody = criaChamadoCsm ? criaChamadoCsm.getRequestBody() : null;
      }

      /* gs.log(criaChamadoCsm.getRequestBody(), "UBH_Busca_Chamados_CSM_CA");
      gs.log(responseBody, "UBH_Busca_Chamados_CSM_CA"); */

      gs.log("Response criaChamado" + JSON.stringify({
        requestBody: criaChamadoCsm.getRequestBody(),
        responseBody: responseBody
      }), "UBH_Retorna_Chamados_CSM_CA");
    },

    /* Função responsável por converter a data recebida e a retorna em formato timestamp */
    _converteParaTimestamp: function (data) {
      timestamp = "";
      dataTmp = new GlideDateTime(data).getNumericValue() / 1000;
      timestamp = (
        Math.round((dataTmp * Math.pow(10, 0)).toFixed(0 - 1)) / Math.pow(10, 0)
      ).toFixed(0);
      return timestamp;
    },

    /* Função responsável por converter o timestamp recebido para a data */
    _converteParaDate: function (timestamp) {
      var gdt = new GlideDateTime();
      gtd = gdt.setNumericValue(timestamp);
      return gdt.getDisplayValue();
    },

    type: "UBH_Busca_Chamados_CSM_CA",
  }
);
