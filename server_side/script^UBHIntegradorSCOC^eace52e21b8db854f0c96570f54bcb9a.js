/* Script responsavel por fazer a integração de acordo com o sistema desejado. */

var UBH_Integrador_SC_OC = Class.create();
UBH_Integrador_SC_OC.prototype = Object.extendsObject(AbstractAjaxProcessor, {

    AUTH_TYPE_ENUM: {
        "BASIC": "Basic",
        "BEARER": "Bearer"
    },

    env: '',
    gr: null,
    destinyAuth: '',
    destinyAuthType: '',
    destinyContentType: '',
    destinyEndpoint: '',
    destinyMethod: '',
    destinyQueryParameter: '',
    requestData: '',
    correlationId: '',
    midServer: '',
    
    setDestinyAuth: function (destinyAuth) {
        this.destinyAuth = destinyAuth;
    },
    setDestinyAuthType: function (destinyAuthType) {
        this.destinyAuthType = destinyAuthType;
    },
    setDestinyContentType: function (destinyContentType) {
        this.destinyContentType = destinyContentType;
    },
    setDestinyEndpoint: function (destinyEndpoint) {
        this.destinyEndpoint = destinyEndpoint;
    },
    setDestinyMethod: function (destinyMethod) {
        this.destinyMethod = destinyMethod;
    },
    setRequestData: function (requestData) {
        this.requestData = requestData;
    },
    setDestinyQueryParameter: function (queryParam) {
        this.destinyQueryParameter = queryParam;
    },
    setMIDServer: function (midServer) {
        this.midServer = midServer;
    },
    
    initialize: function () {
        /* Busca as variaveis do integrador */
        this.env = new global.UBHEnv('integrador').env;
    },
    
    /* Busca os os dados do campo data dentro do registro na tabela u_integrador */
    getData: function (id) {
        gr = new GlideRecord('u_integrador');
        gr.addQuery('u_correlation_id', id);
        gr.query();
        gr.orderByDesc('sys_created_on');
        
        if (gr.next()) {
            return gr.getValue('u_data') + '';
        } else {
            return 'Nenhum registro encontrado para id';
        }
    },
    
    /* Atualiza o status dentro da tabela u_integrador de acordo com o status da integração */
    check: function (id) {
        var requestBody;
        var responseBody;
        var status;
        var sm;

        /*Verifica se correlation ID é de midserver*/
        if (id.substr(0, 3) == "mid") {
            var gr = new GlideRecord("ecc_queue");
            gr.addEncodedQuery("topic=RESTProbe^queue=input^agent_correlator=" + id);
            gr.query();

            var payload;
            var state;
            var response;

            while (gr.next()) {
                payload = this.getPayload(gr.getValue("payload"));

                if (gr.getValue("state") == "processing" || gr.getValue("state") == "ready") {
                    state = "PROCESSING";
                }

                if (gr.getValue("state") == "error") {
                    state = "ERROR";
                }

                if (gr.getValue("state") == "processed") {
                    gs.eventQueue("integration_processed", null, '');
                    state = "DONE";
                    return JSON.stringify({
                        "destinyResponse": payload,
                        "destinyStatus": state
                    });
                }
            }
            return JSON.stringify({
                "destinyResponse": payload,
                "destinyStatus": state
            });
        }
        try {
            sm = new sn_ws.RESTMessageV2("UBH_Integrador", "Default GET");
            sm.setStringParameter("url", this.env.url_integrador);

            if (id) {
                sm.setStringParameter("id", id);
            } else {
                sm.setStringParameter("id", this.correlationId);
            }
            response = sm.execute();
            responseBody = response.haveError() ? response.getErrorMessage() : response.getBody();
            status = response.getStatusCode();
        } catch (ex) {
            responseBody = ex.getMessage();
            status = '500';
        } finally {
            requestBody = sm ? sm.getRequestBody() : null;
        }
        return responseBody;
    },
    
    /* Executa a consulta e grava os dados na tabela u_integrador */
    execute: function () {

        gs.log('Entrou na UBH_Integrador_SC_OC.execute()', 'SC_OC_PendingAproovals');
        
        var requestBody;
        var responseBody = {
            "id": ""
        };

        var status;
        var sm;

        /*Se será utilizado o midserver (sincrono) ao invés do integrador*/
        if (this.midServer) {
            var r = new sn_ws.RESTMessageV2('Integrador-MIDServer', this.destinyMethod);
            r.setStringParameterNoEscape('destinyEndpoint', this.destinyEndpoint);

            if (this.destinyQueryParameter.length > 0) {
                r.setStringParameterNoEscape("destinyEndpoint", this.destinyEndpoint + '?' + this.destinyQueryParameter);
            }

            r.setStringParameterNoEscape('requestData', this.requestData);
            r.setStringParameterNoEscape('destinyContentType', this.destinyContentType);

            if (this.destinyAuth) {
                var authType = this.AUTH_TYPE_ENUM[this.destinyAuthType];

                if (authType) {
                    var auth = gs.getMessage("{0} {1}", [authType, this.destinyAuth]);
                    r.setRequestHeader("Authorization", auth);
                }
            }
            r.setMIDServer(this.midServer);
            r.setEccParameter('skip_sensor', true);

            responseBody.id = "mid" + gs.generateGUID();
            r.setEccCorrelator(responseBody.id);
            var response = r.executeAsync();
            return JSON.stringify(responseBody);

        } else {
            try {
                /* Busca os dados */
                sm = new sn_ws.RESTMessageV2("UBH_Integrador", "Default POST");
                sm.setStringParameter("destinyAuth", this.destinyAuth);
                sm.setStringParameter("destinyAuthType", this.destinyAuthType);
                sm.setStringParameter("destinyContentType", this.destinyContentType);
                sm.setStringParameter("destinyEndpoint", this.destinyEndpoint);

                if (this.destinyQueryParameter.length > 0) {
                    sm.setStringParameterNoEscape("destinyEndpoint", this.destinyEndpoint + '?' + this.destinyQueryParameter);
                }

                sm.setStringParameter("destinyMethod", this.destinyMethod);
                sm.setStringParameterNoEscape("requestData", this.requestData);
                sm.setStringParameter("originAuth", "c2Vydl93c19zZXJ2aWNlbm93OiRUa25BT01idldAcQ==");
                sm.setStringParameter("originAuthType", "BASIC");
                sm.setStringParameter("originContentType", "application/xml");
                sm.setStringParameter("originEndpoint", this.env.url_origin);
                sm.setStringParameter("originMethod", "POST");
                sm.setStringParameter("url", this.env.url_integrador);
                response = sm.execute();
                responseBody = response.haveError() ? response.getErrorMessage() : response.getBody();
                status = response.getStatusCode();
            } catch (ex) {
                responseBody = ex.getMessage();
                status = '500';
            } finally {
                requestBody = sm ? sm.getRequestBody() : null;
            }
        }
        if (requestBody) {
            this.correlationId = requestBody.id;
        }
        return responseBody;
    },

    /* Utilizado na função check para converter o XML em objeto */
    getPayload: function (payload) {
        var xmlhelp = new XMLHelper(payload);
        var obj = xmlhelp.toObject();
        if (obj && obj.result && obj.result.output) {
            return obj.result.output;
        }
        return;
    },

    /* Cria o Registro na tabela u_integrador, adiciona no script do workflow a função enviada por parametro de acordo com o sistema */
    executeCallback: function (callback_function, obj) {
        gs.log('Entrou na UBH_Integrador_SC_OC.executeCallback()', 'SC_OC_PendingAproovals');
        var response = JSON.parse(this.execute());
        if (response) {
            this.correlationId = response.id;

            /* cria um novo registro na tabela integrador */
            var grUI = new GlideRecord('u_integrador');
            grUI.setValue('u_data', 'Aguardando retorno do integrador');
            grUI.setValue('u_state', 'Pending');
            grUI.setValue('u_correlation_id', response.id);
            grUI.setValue('u_endpoint', response.destinyEndpoint || this.destinyEndpoint);
            grUI.setValue('u_messages', this.requestData);

            if (obj.object_type) {
                if (obj.object_type == "approvalHistory") {
                    grUI.setValue('u_table_name', obj.table);
                    grUI.setValue('u_table_sys_id', obj.sys_id);
                }
            } else {
                grUI.setValue('u_approver', obj.getName());
            }

            var id = grUI.insert();
            grUI = new GlideRecord('u_integrador');
            grUI.get(id);

            /* Adiciona a função no workflow */
            var wf = new Workflow().getRunningFlows(grUI);
            if (wf.next()) {
                wf.scratchpad.callback_function = callback_function.toString();
                wf.update();
            }
        }
    },
    type: 'UBH_Integrador_SC_OC'
});