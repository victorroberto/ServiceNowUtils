var demandasPersistence = Class.create();
demandasPersistence.prototype = Object.extendsObject(AbstractAjaxProcessor, {

    /**SNDOC
    @name setDefaultValues
    @description Definição dos nomes de amostra e projeto

    @param {object} [current] - idea/demand

    @example
    new demandasPersistence().setDefaultValues(current);

    @returns {void} 
    */
    setDefaultValues: function (current) {
        switch (current.u_goal.toString()) {
            case 'sample':
                current.short_description = current.number + ' + ' + current.u_empresa + ' - Solicitação de Amostra';
                current.u_fluxo = 'express';
                break;
            case 'innovation':
                current.short_description = current.number + ' + ' + current.u_empresa + ' - Projeto' + ': ' + current.u_descricao_resumida;
                break;
        }
    },
    //portal client script
    getInfoProduto: function () {
        var json = new JSON();
        var grCmdbCiBusinessCapability = new GlideRecord('cmdb_ci_business_capability');
        if (grCmdbCiBusinessCapability.get(this.getParameter('produto'))) {
            var retorno = {
                "gramatura": grCmdbCiBusinessCapability.getValue('u_grammage'),
                "tamanho": grCmdbCiBusinessCapability.getValue('u_size'),
                "quantidade": grCmdbCiBusinessCapability.getValue('fault_count')
            };
        }
        return json.encode(retorno);
    },
    //reference qualif
    listProdutos: function (linha_prod) {
        var ids = [];
        var line = linha_prod; //(linha_prod == 'paperboard_line') ? '0' : '1';
        var grCmdbCiBusinessCapability = new GlideRecord('u_produto_dnp');
        grCmdbCiBusinessCapability.addEncodedQuery("u_linha_de_produto==" + line + "^u_ativo=true");
        grCmdbCiBusinessCapability.query();
        while (grCmdbCiBusinessCapability.next()) {
            ids.push(grCmdbCiBusinessCapability.getUniqueValue());
        }
        return 'sys_idIN' + ids;
    },

    aprovaDemandaOld: function (current) {
        var camposVazios = [];
        //         var campos = ['u_leader', 'demand_manager', 'u_linha_de_produto', 'u_produto_a_ser_testado', 'u_disponivel_em_estoque', 'u_selecione_o_estoque_de_origem'];
        var campos = ['u_priorizacao'];
        for (i in campos) {
            if (current.getValue(campos[i]) == '' || current.getValue(campos[i]) == null) {
                camposVazios.push(this.getFieldLabel(campos[i]));
            }
        }

        // 		var aux = true;
        var grUItbmProduct = new GlideRecord('u_itbm_product');
        grUItbmProduct.addEncodedQuery("u_demand=" + current.getUniqueValue());
        grUItbmProduct.orderBy('name');
        grUItbmProduct.query();
        while (grUItbmProduct.next()) {
            if (grUItbmProduct.getValue('u_available_in_stock') == null) {
                return false;
            }
        }

        return true;


        //         if (current.getValue('u_fluxo') == 'express') {
        //             return true;
        //         } else {
        // 			return true;
        //             //return (camposVazios.length > 0 ? "Por favor, responda a priorização do projeto antes de seguir <br>" : true);
        //         }


    },

    aprovaDemanda: function (current) {
        var camposVazios = [];
        //         var campos = ['u_leader', 'demand_manager', 'u_linha_de_produto', 'u_produto_a_ser_testado', 'u_disponivel_em_estoque', 'u_selecione_o_estoque_de_origem'];
        var campos = ['u_priorizacao'];
        for (i in campos) {
            if (current.getValue(campos[i]) == '' || current.getValue(campos[i]) == null) {
                camposVazios.push(this.getFieldLabel(campos[i]));
            }
        }

        // 		var aux = true;
        if (current.u_goal == 'sample') {
            var grUItbmProduct = new GlideRecord('u_itbm_product');
            grUItbmProduct.addEncodedQuery("u_demand=" + current.getUniqueValue());
            grUItbmProduct.orderBy('name');
            grUItbmProduct.query();
            while (grUItbmProduct.next()) {
                if (grUItbmProduct.getValue('u_available_in_stock') == null) {
                    return false;
                }
            }
        } else {
            return true;
        }


        return true;


        //         if (current.getValue('u_fluxo') == 'express') {
        //             return true;
        //         } else {
        // 			return true;
        //             //return (camposVazios.length > 0 ? "Por favor, responda a priorização do projeto antes de seguir <br>" : true);
        //         }


    },

    getFieldLabel: function (campo) {
        var grSysDictionary = new GlideRecord('sys_dictionary');
        grSysDictionary.addEncodedQuery("element=" + campo);
        grSysDictionary.query();
        if (grSysDictionary.next()) {
            return ' ' + grSysDictionary.getValue('column_label');
        }
    },

    rejeitaDemanda: function (current) {
        var grTsp1Demand = new GlideRecord('tsp1_demand');
        grTsp1Demand.initialize();
        var demandas_relacionadas = (grTsp1Demand.getValue('u_demandas_relacionadas') == null) ? current.getUniqueValue() : grTsp1Demand.getValue('u_demandas_relacionadas') + ',' + current.getUniqueValue();
        grTsp1Demand.setValue('u_demandas_relacionadas', demandas_relacionadas);
        grTsp1Demand.setValue('short_description', current.getValue('short_description'));
        grTsp1Demand.setValue('portfolio', current.getValue('portfolio'));
        grTsp1Demand.setValue('description', current.getValue('description'));
        grTsp1Demand.setValue('u_goal', current.getValue('u_goal'));
        grTsp1Demand.setValue('u_linha_de_produto', current.getValue('u_linha_de_produto'));
        grTsp1Demand.setValue('u_gramatura', current.getValue('u_gramatura'));
        grTsp1Demand.setValue('u_quantidade', current.getValue('u_quantidade'));
        grTsp1Demand.setValue('u_disponivel_em_estoque', current.getValue('u_disponivel_em_estoque'));
        grTsp1Demand.setValue('u_selecione_o_estoque_de_origem', current.getValue('u_selecione_o_estoque_de_origem'));
        grTsp1Demand.setValue('u_produto_a_ser_testado', current.getValue('u_produto_a_ser_testado'));
        grTsp1Demand.setValue('u_tamanho', current.getValue('u_tamanho'));
        grTsp1Demand.setValue('u_tamanhos_especiais', current.getValue('u_tamanhos_especiais'));
        grTsp1Demand.setValue('u_empresa', current.getValue('u_empresa'));
        grTsp1Demand.setValue('u_contatos', current.getValue('u_contatos'));
        grTsp1Demand.setValue('u_emails', current.getValue('u_emails'));
        grTsp1Demand.setValue('u_endereco_entrega', current.getValue('u_endereco_entrega'));
        grTsp1Demand.setValue('u_codigo_cliente_sap', current.getValue('u_codigo_cliente_sap'));
        grTsp1Demand.setValue('u_telefones', current.getValue('u_telefones'));
        grTsp1Demand.setValue('u_pais_destino', current.getValue('u_pais_destino'));
        grTsp1Demand.setValue('u_cep_code', current.getValue('u_cep_code'));
        grTsp1Demand.setValue('u_volume_estimado_ton', current.getValue('u_volume_estimado_ton'));
        grTsp1Demand.setValue('u_tradding', current.getValue('u_tradding'));
        grTsp1Demand.setValue('u_canal_de_vendas', current.getValue('u_canal_de_vendas'));
        grTsp1Demand.setValue('u_vat_number', current.getValue('u_vat_number'));
        grTsp1Demand.setValue('u_vendedor', current.getValue('u_vendedor'));
        grTsp1Demand.setValue('u_leader', current.getValue('u_leader'));
        grTsp1Demand.setValue('demand_manager', current.getValue('demand_manager'));
        grTsp1Demand.setValue('project_manager', current.getValue('project_manager'));
        grTsp1Demand.setValue('u_email_vendedor', current.getValue('u_email_vendedor'));
        grTsp1Demand.setValue('u_escala_da_amostra', current.getValue('u_escala_da_amostra'));
        grTsp1Demand.insert();

        //         return ("A demanda <a href='" + gs.getProperty('glide.servlet.uri') + "tsp1_demand?sys_id=" + grTsp1Demand.getUniqueValue() + "'>" + grTsp1Demand.getValue('number') + "</a> foi criada.");
        return grTsp1Demand.getValue('number');
    },

    createProjectOld: function (current) {
        // 		var grT1D = new GlideRecord('tsp1_demand');
        // if (grT1D.get('0413342b1b6ec510059643bbe54bcbd8')) {
        //     var teste = ['u_biodegradation','u_brand_owner','u_burst_resistance','u_canal_de_vendas','u_cartao','u_cd_stiffness','u_cep_code','u_coating','u_cobb','u_codigo_cliente_sap','u_comentarios_adicionais','u_comercial_emenat','u_comercial_latam','u_comercial_napac','u_compostabilidade','u_contatos','u_converter_graphics','u_corona','u_corrugator','u_current_card','u_cut_and_crease','u_demandas_relacionadas','u_description_scope','u_disponivel_em_estoque','u_edge_wicking','u_emails','u_email_vendedor','u_empresa','u_endereco_entrega','u_escala_da_amostra','u_external','u_extrusion','u_fat','u_flatness','u_flexography','u_fluxo','u_fsc','u_goal','u_gramatura','u_grammage','u_gravure','u_hot_melt','u_hot_stamping','u_induction','u_internal','u_isega','u_kit_ol','u_kraft','u_laminacao','u_leader','u_linha_de_produto','u_md_stiffness','u_mercado_interno_cartoes','u_mercado_interno_kraft','u_offset','u_opened_by','u_others','u_oxygen','u_pais_destino','u_porosity','u_production_unit','u_produto_a_ser_testado','u_produto_s_a_ser_testado_s','u_project_name','u_pva','u_quantidade','u_rdc_88','u_roughness','u_selecione_o_estoque_de_origem','u_superficial_trat','u_tamanho','u_tamanhos_especiais','u_tear_resistance','u_telefones','u_test_robinson','u_traction_resistance','u_tradding','u_unidades_biodegradation','u_unidades_burst_resistance','u_unidades_cd_stiffness','u_unidades_coating','u_unidades_cobb','u_unidades_compostabilidade','u_unidades_corona','u_unidades_corrugator','u_unidades_cut_and_crease','u_unidades_edge_wicking','u_unidades_extrusion','u_unidades_fat','u_unidades_flatness','u_unidades_flexography','u_unidades_fsc','u_unidades_grammage','u_unidades_gravure','u_unidades_hot_melt','u_unidades_hot_stamping','u_unidades_induction','u_unidades_isega','u_unidades_kit_ol','u_unidades_laminacao','u_unidades_md_stiffness','u_unidades_offset','u_unidades_oxygen','u_unidades_porosity','u_unidades_pva','u_unidades_rdc_88','u_unidades_roughness','u_unidades_superficial_trat','u_unidades_tear_resistance','u_unidades_test_robinson','u_unidades_traction_resistance','u_unidades_vapor_de_agua','u_unidades_varnish','u_unidades_water','u_unidades_whiteness','u_vapor_de_agua','u_varnish','u_vat_number','u_vendedor','u_volume_estimado_ton','u_water','u_whiteness','short_description','description','primary_portfolio'];
        //     for(i in teste){
        //         grProject.setValue(teste[i],grT1D.getValue(teste[i]));
        //     }
        // }
        var grProject = new GlideRecord('tsp1_project');
        grProject.initialize();

        //campos custom
        grProject.setValue('u_biodegradation', current.getValue('u_biodegradation'));
        grProject.setValue('u_brand_owner', current.getValue('u_brand_owner'));
        grProject.setValue('u_burst_resistance', current.getValue('u_burst_resistance'));
        grProject.setValue('u_canal_de_vendas', current.getValue('u_canal_de_vendas'));
        grProject.setValue('u_cartao', current.getValue('u_cartao'));
        grProject.setValue('u_cd_stiffness', current.getValue('u_cd_stiffness'));
        grProject.setValue('u_cep_code', current.getValue('u_cep_code'));
        grProject.setValue('u_coating', current.getValue('u_coating'));
        grProject.setValue('u_cobb', current.getValue('u_cobb'));
        grProject.setValue('u_codigo_cliente_sap', current.getValue('u_codigo_cliente_sap'));
        grProject.setValue('u_comentarios_adicionais', current.getValue('u_comentarios_adicionais'));
        grProject.setValue('u_comercial_emenat', current.getValue('u_comercial_emenat'));
        grProject.setValue('u_comercial_latam', current.getValue('u_comercial_latam'));
        grProject.setValue('u_comercial_napac', current.getValue('u_comercial_napac'));
        grProject.setValue('u_compostabilidade', current.getValue('u_compostabilidade'));
        grProject.setValue('u_contatos', current.getValue('u_contatos'));
        grProject.setValue('u_converter_graphics', current.getValue('u_converter_graphics'));
        grProject.setValue('u_corona', current.getValue('u_corona'));
        grProject.setValue('u_corrugator', current.getValue('u_corrugator'));
        grProject.setValue('u_current_card', current.getValue('u_current_card'));
        grProject.setValue('u_cut_and_crease', current.getValue('u_cut_and_crease'));
        grProject.setValue('u_demandas_relacionadas', current.getValue('u_demandas_relacionadas'));
        grProject.setValue('u_description_scope', current.getValue('u_description_scope'));
        grProject.setValue('u_disponivel_em_estoque', current.getValue('u_disponivel_em_estoque'));
        grProject.setValue('u_edge_wicking', current.getValue('u_edge_wicking'));
        grProject.setValue('u_emails', current.getValue('u_emails'));
        grProject.setValue('u_email_vendedor', current.getValue('u_email_vendedor'));
        grProject.setValue('u_empresa', current.getValue('u_empresa'));
        grProject.setValue('u_endereco_entrega', current.getValue('u_endereco_entrega'));
        grProject.setValue('u_escala_da_amostra', current.getValue('u_escala_da_amostra'));
        grProject.setValue('u_external', current.getValue('u_external'));
        grProject.setValue('u_extrusion', current.getValue('u_extrusion'));
        grProject.setValue('u_fat', current.getValue('u_fat'));
        grProject.setValue('u_flatness', current.getValue('u_flatness'));
        grProject.setValue('u_flexography', current.getValue('u_flexography'));
        grProject.setValue('u_fluxo', current.getValue('u_fluxo'));
        grProject.setValue('u_fsc', current.getValue('u_fsc'));
        grProject.setValue('u_goal', current.getValue('u_goal'));
        grProject.setValue('u_gramatura', current.getValue('u_gramatura'));
        grProject.setValue('u_grammage', current.getValue('u_grammage'));
        grProject.setValue('u_gravure', current.getValue('u_gravure'));
        grProject.setValue('u_hot_melt', current.getValue('u_hot_melt'));
        grProject.setValue('u_hot_stamping', current.getValue('u_hot_stamping'));
        grProject.setValue('u_induction', current.getValue('u_induction'));
        grProject.setValue('u_internal', current.getValue('u_internal'));
        grProject.setValue('u_isega', current.getValue('u_isega'));
        grProject.setValue('u_kit_ol', current.getValue('u_kit_ol'));
        grProject.setValue('u_kraft', current.getValue('u_kraft'));
        grProject.setValue('u_laminacao', current.getValue('u_laminacao'));
        grProject.setValue('u_leader', current.getValue('u_leader'));
        grProject.setValue('u_linha_de_produto', current.getValue('u_linha_de_produto'));
        grProject.setValue('u_md_stiffness', current.getValue('u_md_stiffness'));
        grProject.setValue('u_mercado_interno_cartoes', current.getValue('u_mercado_interno_cartoes'));
        grProject.setValue('u_mercado_interno_kraft', current.getValue('u_mercado_interno_kraft'));
        grProject.setValue('u_offset', current.getValue('u_offset'));
        grProject.setValue('u_opened_by', current.getValue('u_opened_by'));
        grProject.setValue('u_others', current.getValue('u_others'));
        grProject.setValue('u_oxygen', current.getValue('u_oxygen'));
        grProject.setValue('u_pais_destino', current.getValue('u_pais_destino'));
        grProject.setValue('u_porosity', current.getValue('u_porosity'));
        grProject.setValue('u_production_unit', current.getValue('u_production_unit'));
        grProject.setValue('u_produto_a_ser_testado', current.getValue('u_produto_a_ser_testado'));
        grProject.setValue('u_produto_s_a_ser_testado_s', current.getValue('u_produto_s_a_ser_testado_s'));
        grProject.setValue('u_project_name', current.getValue('u_project_name'));
        grProject.setValue('u_pva', current.getValue('u_pva'));
        grProject.setValue('u_quantidade', current.getValue('u_quantidade'));
        grProject.setValue('u_rdc_88', current.getValue('u_rdc_88'));
        grProject.setValue('u_roughness', current.getValue('u_roughness'));
        grProject.setValue('u_selecione_o_estoque_de_origem', current.getValue('u_selecione_o_estoque_de_origem'));
        grProject.setValue('u_superficial_trat', current.getValue('u_superficial_trat'));
        grProject.setValue('u_tamanho', current.getValue('u_tamanho'));
        grProject.setValue('u_tamanhos_especiais', current.getValue('u_tamanhos_especiais'));
        grProject.setValue('u_tear_resistance', current.getValue('u_tear_resistance'));
        grProject.setValue('u_telefones', current.getValue('u_telefones'));
        grProject.setValue('u_test_robinson', current.getValue('u_test_robinson'));
        grProject.setValue('u_traction_resistance', current.getValue('u_traction_resistance'));
        grProject.setValue('u_tradding', current.getValue('u_tradding'));
        grProject.setValue('u_unidades_biodegradation', current.getValue('u_unidades_biodegradation'));
        grProject.setValue('u_unidades_burst_resistance', current.getValue('u_unidades_burst_resistance'));
        grProject.setValue('u_unidades_cd_stiffness', current.getValue('u_unidades_cd_stiffness'));
        grProject.setValue('u_unidades_coating', current.getValue('u_unidades_coating'));
        grProject.setValue('u_unidades_cobb', current.getValue('u_unidades_cobb'));
        grProject.setValue('u_unidades_compostabilidade', current.getValue('u_unidades_compostabilidade'));
        grProject.setValue('u_unidades_corona', current.getValue('u_unidades_corona'));
        grProject.setValue('u_unidades_corrugator', current.getValue('u_unidades_corrugator'));
        grProject.setValue('u_unidades_cut_and_crease', current.getValue('u_unidades_cut_and_crease'));
        grProject.setValue('u_unidades_edge_wicking', current.getValue('u_unidades_edge_wicking'));
        grProject.setValue('u_unidades_extrusion', current.getValue('u_unidades_extrusion'));
        grProject.setValue('u_unidades_fat', current.getValue('u_unidades_fat'));
        grProject.setValue('u_unidades_flatness', current.getValue('u_unidades_flatness'));
        grProject.setValue('u_unidades_flexography', current.getValue('u_unidades_flexography'));
        grProject.setValue('u_unidades_fsc', current.getValue('u_unidades_fsc'));
        grProject.setValue('u_unidades_grammage', current.getValue('u_unidades_grammage'));
        grProject.setValue('u_unidades_gravure', current.getValue('u_unidades_gravure'));
        grProject.setValue('u_unidades_hot_melt', current.getValue('u_unidades_hot_melt'));
        grProject.setValue('u_unidades_hot_stamping', current.getValue('u_unidades_hot_stamping'));
        grProject.setValue('u_unidades_induction', current.getValue('u_unidades_induction'));
        grProject.setValue('u_unidades_isega', current.getValue('u_unidades_isega'));
        grProject.setValue('u_unidades_kit_ol', current.getValue('u_unidades_kit_ol'));
        grProject.setValue('u_unidades_laminacao', current.getValue('u_unidades_laminacao'));
        grProject.setValue('u_unidades_md_stiffness', current.getValue('u_unidades_md_stiffness'));
        grProject.setValue('u_unidades_offset', current.getValue('u_unidades_offset'));
        grProject.setValue('u_unidades_oxygen', current.getValue('u_unidades_oxygen'));
        grProject.setValue('u_unidades_porosity', current.getValue('u_unidades_porosity'));
        grProject.setValue('u_unidades_pva', current.getValue('u_unidades_pva'));
        grProject.setValue('u_unidades_rdc_88', current.getValue('u_unidades_rdc_88'));
        grProject.setValue('u_unidades_roughness', current.getValue('u_unidades_roughness'));
        grProject.setValue('u_unidades_superficial_trat', current.getValue('u_unidades_superficial_trat'));
        grProject.setValue('u_unidades_tear_resistance', current.getValue('u_unidades_tear_resistance'));
        grProject.setValue('u_unidades_test_robinson', current.getValue('u_unidades_test_robinson'));
        grProject.setValue('u_unidades_traction_resistance', current.getValue('u_unidades_traction_resistance'));
        grProject.setValue('u_unidades_vapor_de_agua', current.getValue('u_unidades_vapor_de_agua'));
        grProject.setValue('u_unidades_varnish', current.getValue('u_unidades_varnish'));
        grProject.setValue('u_unidades_water', current.getValue('u_unidades_water'));
        grProject.setValue('u_unidades_whiteness', current.getValue('u_unidades_whiteness'));
        grProject.setValue('u_vapor_de_agua', current.getValue('u_vapor_de_agua'));
        grProject.setValue('u_varnish', current.getValue('u_varnish'));
        grProject.setValue('u_vat_number', current.getValue('u_vat_number'));
        grProject.setValue('u_vendedor', current.getValue('u_vendedor'));
        grProject.setValue('u_volume_estimado_ton', current.getValue('u_volume_estimado_ton'));
        grProject.setValue('u_water', current.getValue('u_water'));
        grProject.setValue('u_whiteness', current.getValue('u_whiteness'));
        grProject.setValue('u_related_fap', current.getValue('u_demandas_relacionadas'));



        //         if (current.getValue('u_disponivel_em_estoque') == 'sim') {
        //             grProject.setValue('state', '2');
        //         }

        grProject.setValue('u_fluxo', current.getValue('u_fluxo'));
        grProject.setValue('project_manager', current.getValue('project_manager'));
        grProject.setValue('u_gramatura', current.getValue('u_gramatura'));
        grProject.setValue('u_produto_a_ser_testado', current.getValue('u_produto_a_ser_testado'));
        grProject.setValue('u_tamanho', current.getValue('u_tamanho'));
        grProject.setValue('u_tamanhos_especiais', current.getValue('u_tamanhos_especiais'));


        //campos core
        grProject.setValue('short_description', current.getValue('short_description'));
        grProject.setValue('description', current.getValue('description'));
        grProject.setValue('primary_portfolio', current.getValue('portfolio'));


        grProject.insert();

        //return "O projeto <a href='" + gs.getProperty('glide.servlet.uri') + "tsp1_project?sys_id=" + grProject.getUniqueValue() + "'>" + grProject.number + "</a> foi criado";
        return grProject.getUniqueValue() + ',' + grProject.number;
    },

    projectInsert: function (current) {
        var grProject = new GlideRecord('tsp1_project');
        grProject.initialize();

        //campos custom
        grProject.setValue('u_selecione_o_estoque_de_origem', current.getValue('u_selecione_o_estoque_de_origem'));
        grProject.setValue('u_plataforma', current.getValue('u_plataforma'));
        grProject.setValue('u_indicador_priorizacao', current.getValue('u_media_priorizacao'));
        grProject.setValue('u_aplicacao_amostra', current.getValue('u_aplicacao_amostra'));
        grProject.setValue('u_obs_descricao_tec', current.getValue('u_obs_descricao_tec'));
        grProject.setValue('u_obs_desc_barreiras', current.getValue('u_obs_desc_barreiras'));
        grProject.setValue('u_obs_descricao_conversao', current.getValue('u_obs_descricao_conversao'));
        grProject.setValue('u_obs_descricao_print', current.getValue('u_obs_descricao_print'));
        grProject.setValue('u_obs_descricao_colagem', current.getValue('u_obs_descricao_colagem'));
        grProject.setValue('u_obs_descricao_acabamento', current.getValue('u_obs_descricao_acabamento'));
        grProject.setValue('u_observa_es_descri_o', current.getValue('u_obs_descricao_certificacoes'));
        grProject.setValue('u_incoterms', current.getValue('u_incoterms'));
        grProject.setValue('u_modal', current.getValue('u_modal'));

        grProject.setValue('u_biodegradation', current.getValue('u_biodegradation'));
        grProject.setValue('u_brand_owner', current.getValue('u_brand_owner'));
        grProject.setValue('u_burst_resistance', current.getValue('u_burst_resistance'));
        grProject.setValue('u_canal_de_vendas', current.getValue('u_canal_de_vendas'));
        grProject.setValue('u_cartao', current.getValue('u_cartao'));
        grProject.setValue('u_cd_stiffness', current.getValue('u_cd_stiffness'));
        grProject.setValue('u_cep_code', current.getValue('u_cep_code'));
        grProject.setValue('u_coating', current.getValue('u_coating'));
        grProject.setValue('u_cobb', current.getValue('u_cobb'));
        grProject.setValue('u_codigo_cliente_sap', current.getValue('u_codigo_cliente_sap'));
        grProject.setValue('u_comentarios_adicionais', current.getValue('u_comentarios_adicionais'));
        grProject.setValue('u_comercial_emenat', current.getValue('u_comercial_emenat'));
        grProject.setValue('u_comercial_latam', current.getValue('u_comercial_latam'));
        grProject.setValue('u_comercial_napac', current.getValue('u_comercial_napac'));
        grProject.setValue('u_compostabilidade', current.getValue('u_compostabilidade'));
        grProject.setValue('u_contatos', current.getValue('u_contatos'));
        grProject.setValue('u_converter_graphics', current.getValue('u_converter_graphics'));
        grProject.setValue('u_corona', current.getValue('u_corona'));
        grProject.setValue('u_corrugator', current.getValue('u_corrugator'));
        grProject.setValue('u_current_card', current.getValue('u_current_card'));
        grProject.setValue('u_cut_and_crease', current.getValue('u_cut_and_crease'));
        grProject.setValue('u_demandas_relacionadas', current.getValue('u_demandas_relacionadas'));
        grProject.setValue('u_description_scope', current.getValue('u_description_scope'));
        grProject.setValue('u_disponivel_em_estoque', current.getValue('u_disponivel_em_estoque'));
        grProject.setValue('u_edge_wicking', current.getValue('u_edge_wicking'));
        grProject.setValue('u_emails', current.getValue('u_emails'));
        grProject.setValue('u_email_vendedor', current.getValue('u_email_vendedor'));
        grProject.setValue('u_empresa', current.getValue('u_empresa'));
        grProject.setValue('u_endereco_entrega', current.getValue('u_endereco_entrega'));
        grProject.setValue('u_escala_da_amostra', current.getValue('u_escala_da_amostra'));
        grProject.setValue('u_external', current.getValue('u_external'));
        grProject.setValue('u_extrusion', current.getValue('u_extrusion'));
        grProject.setValue('u_fat', current.getValue('u_fat'));
        grProject.setValue('u_flatness', current.getValue('u_flatness'));
        grProject.setValue('u_flexography', current.getValue('u_flexography'));
        grProject.setValue('u_fluxo', current.getValue('u_fluxo'));
        grProject.setValue('u_fsc', current.getValue('u_fsc'));
        grProject.setValue('u_goal', current.getValue('u_goal'));
        grProject.setValue('u_gramatura', current.getValue('u_gramatura'));
        grProject.setValue('u_grammage', current.getValue('u_grammage'));
        grProject.setValue('u_gravure', current.getValue('u_gravure'));
        grProject.setValue('u_hot_melt', current.getValue('u_hot_melt'));
        grProject.setValue('u_hot_stamping', current.getValue('u_hot_stamping'));
        grProject.setValue('u_induction', current.getValue('u_induction'));
        grProject.setValue('u_internal', current.getValue('u_internal'));
        grProject.setValue('u_isega', current.getValue('u_isega'));
        grProject.setValue('u_kit_ol', current.getValue('u_kit_ol'));
        grProject.setValue('u_kraft', current.getValue('u_kraft'));
        grProject.setValue('u_laminacao', current.getValue('u_laminacao'));
        grProject.setValue('u_leader', current.getValue('u_leader'));
        grProject.setValue('u_linha_de_produto', current.getValue('u_linha_de_produto'));
        grProject.setValue('u_md_stiffness', current.getValue('u_md_stiffness'));
        grProject.setValue('u_mercado_interno_cartoes', current.getValue('u_mercado_interno_cartoes'));
        grProject.setValue('u_mercado_interno_kraft', current.getValue('u_mercado_interno_kraft'));
        grProject.setValue('u_offset', current.getValue('u_offset'));
        grProject.setValue('u_opened_by', current.getValue('u_opened_by'));
        grProject.setValue('u_others', current.getValue('u_others'));
        grProject.setValue('u_oxygen', current.getValue('u_oxygen'));
        grProject.setValue('u_pais_destino', current.getValue('u_pais_destino'));
        grProject.setValue('u_porosity', current.getValue('u_porosity'));
        grProject.setValue('u_production_unit', current.getValue('u_production_unit'));
        grProject.setValue('u_produto_a_ser_testado', current.getValue('u_produto_a_ser_testado'));
        grProject.setValue('u_produto_s_a_ser_testado_s', current.getValue('u_produto_s_a_ser_testado_s'));
        grProject.setValue('u_project_name', current.getValue('u_project_name'));
        grProject.setValue('u_pva', current.getValue('u_pva'));
        grProject.setValue('u_quantidade', current.getValue('u_quantidade'));
        grProject.setValue('u_rdc_88', current.getValue('u_rdc_88'));
        grProject.setValue('u_roughness', current.getValue('u_roughness'));
        grProject.setValue('u_selecione_o_estoque_de_origem', current.getValue('u_selecione_o_estoque_de_origem'));
        grProject.setValue('u_superficial_trat', current.getValue('u_superficial_trat'));
        grProject.setValue('u_tamanho', current.getValue('u_tamanho'));
        grProject.setValue('u_tamanhos_especiais', current.getValue('u_tamanhos_especiais'));
        grProject.setValue('u_tear_resistance', current.getValue('u_tear_resistance'));
        grProject.setValue('u_telefones', current.getValue('u_telefones'));
        grProject.setValue('u_test_robinson', current.getValue('u_test_robinson'));
        grProject.setValue('u_traction_resistance', current.getValue('u_traction_resistance'));
        grProject.setValue('u_tradding', current.getValue('u_tradding'));
        grProject.setValue('u_unidades_biodegradation', current.getValue('u_unidades_biodegradation'));
        grProject.setValue('u_unidades_burst_resistance', current.getValue('u_unidades_burst_resistance'));
        grProject.setValue('u_unidades_cd_stiffness', current.getValue('u_unidades_cd_stiffness'));
        grProject.setValue('u_unidades_coating', current.getValue('u_unidades_coating'));
        grProject.setValue('u_unidades_cobb', current.getValue('u_unidades_cobb'));
        grProject.setValue('u_unidades_compostabilidade', current.getValue('u_unidades_compostabilidade'));
        grProject.setValue('u_unidades_corona', current.getValue('u_unidades_corona'));
        grProject.setValue('u_unidades_corrugator', current.getValue('u_unidades_corrugator'));
        grProject.setValue('u_unidades_cut_and_crease', current.getValue('u_unidades_cut_and_crease'));
        grProject.setValue('u_unidades_edge_wicking', current.getValue('u_unidades_edge_wicking'));
        grProject.setValue('u_unidades_extrusion', current.getValue('u_unidades_extrusion'));
        grProject.setValue('u_unidades_fat', current.getValue('u_unidades_fat'));
        grProject.setValue('u_unidades_flatness', current.getValue('u_unidades_flatness'));
        grProject.setValue('u_unidades_flexography', current.getValue('u_unidades_flexography'));
        grProject.setValue('u_unidades_fsc', current.getValue('u_unidades_fsc'));
        grProject.setValue('u_unidades_grammage', current.getValue('u_unidades_grammage'));
        grProject.setValue('u_unidades_gravure', current.getValue('u_unidades_gravure'));
        grProject.setValue('u_unidades_hot_melt', current.getValue('u_unidades_hot_melt'));
        grProject.setValue('u_unidades_hot_stamping', current.getValue('u_unidades_hot_stamping'));
        grProject.setValue('u_unidades_induction', current.getValue('u_unidades_induction'));
        grProject.setValue('u_unidades_isega', current.getValue('u_unidades_isega'));
        grProject.setValue('u_unidades_kit_ol', current.getValue('u_unidades_kit_ol'));
        grProject.setValue('u_unidades_laminacao', current.getValue('u_unidades_laminacao'));
        grProject.setValue('u_unidades_md_stiffness', current.getValue('u_unidades_md_stiffness'));
        grProject.setValue('u_unidades_offset', current.getValue('u_unidades_offset'));
        grProject.setValue('u_unidades_oxygen', current.getValue('u_unidades_oxygen'));
        grProject.setValue('u_unidades_porosity', current.getValue('u_unidades_porosity'));
        grProject.setValue('u_unidades_pva', current.getValue('u_unidades_pva'));
        grProject.setValue('u_unidades_rdc_88', current.getValue('u_unidades_rdc_88'));
        grProject.setValue('u_unidades_roughness', current.getValue('u_unidades_roughness'));
        grProject.setValue('u_unidades_superficial_trat', current.getValue('u_unidades_superficial_trat'));
        grProject.setValue('u_unidades_tear_resistance', current.getValue('u_unidades_tear_resistance'));
        grProject.setValue('u_unidades_test_robinson', current.getValue('u_unidades_test_robinson'));
        grProject.setValue('u_unidades_traction_resistance', current.getValue('u_unidades_traction_resistance'));
        grProject.setValue('u_unidades_vapor_de_agua', current.getValue('u_unidades_vapor_de_agua'));
        grProject.setValue('u_unidades_varnish', current.getValue('u_unidades_varnish'));
        grProject.setValue('u_unidades_water', current.getValue('u_unidades_water'));
        grProject.setValue('u_unidades_whiteness', current.getValue('u_unidades_whiteness'));
        grProject.setValue('u_vapor_de_agua', current.getValue('u_vapor_de_agua'));
        grProject.setValue('u_varnish', current.getValue('u_varnish'));
        grProject.setValue('u_vat_number', current.getValue('u_vat_number'));
        grProject.setValue('u_vendedor', current.getValue('u_vendedor'));
        grProject.setValue('u_volume_estimado_ton', current.getValue('u_volume_estimado_ton'));
        grProject.setValue('u_water', current.getValue('u_water'));
        grProject.setValue('u_whiteness', current.getValue('u_whiteness'));
        grProject.setValue('u_related_fap', current.getValue('u_demandas_relacionadas'));



        //         if (current.getValue('u_disponivel_em_estoque') == 'sim') {
        //             grProject.setValue('state', '2');
        //         }

        grProject.setValue('u_fluxo', current.getValue('u_fluxo'));
        grProject.setValue('demand', current.getUniqueValue());
        grProject.setValue('project_manager', current.getValue('project_manager'));
        grProject.setValue('u_gramatura', current.getValue('u_gramatura'));
        grProject.setValue('u_produto_a_ser_testado', current.getValue('u_produto_a_ser_testado'));
        grProject.setValue('u_tamanho', current.getValue('u_tamanho'));
        grProject.setValue('u_tamanhos_especiais', current.getValue('u_tamanhos_especiais'));


        //campos core
        grProject.setValue('short_description', current.getValue('short_description'));
        grProject.setValue('description', current.getValue('description'));
        grProject.setValue('primary_portfolio', current.getValue('portfolio'));

        var gdt_end = new GlideDateTime();
        gdt_end.addDaysUTC(8);

        //define datas
        grProject.setDisplayValue("approved_start_date", gs.nowDateTime())
        grProject.setValue("approved_end_date", gdt_end)

        grProject.insert();
        return grProject.getUniqueValue();
    },

    createProject: function (current) {

        if (current.getValue('u_goal') == 'sample') {
            var grUIP = new GlideRecord('u_itbm_product');
            grUIP.addEncodedQuery("u_demand=" + current.getUniqueValue() + "^u_available_in_stock=yes");
            grUIP.query();
            if (grUIP.hasNext()) {
                current.setValue('u_disponivel_em_estoque', "sim");
                var sysidNovoProjeto = this.projectInsert(current);
                while (grUIP.next()) {
                    //current.update();
                    grUIP.setValue('u_project', sysidNovoProjeto);
                    grUIP.update();
                }
                //                 while (grUIP.next()) {
                //                     current.setValue('u_disponivel_em_estoque', "sim");
                //                     var sysidProjeto = this.projectInsert(current);
                //                     grUIP.setValue('u_project', sysidProjeto);
                //                     grUIP.update();
                //                 }
            }


            var grUIP2 = new GlideRecord('u_itbm_product');
            grUIP2.addEncodedQuery("u_demand=" + current.getUniqueValue() + "^u_available_in_stock=no");
            grUIP2.query();
            if (grUIP2.hasNext()) {
                current.setValue('short_description', current.short_description + " - Sem Estoque");
                current.setValue('u_disponivel_em_estoque', "nao");
                var sysidNovoProjeto = this.projectInsert(current);
                while (grUIP2.next()) {
                    grUIP2.setValue('u_project', sysidNovoProjeto);
                    grUIP2.update();
                }
            }
        } else {
            current.setValue('u_disponivel_em_estoque', "sim");
            var sysidProjeto = this.projectInsert(current);
        }
        //return "O projeto <a href='" + gs.getProperty('glide.servlet.uri') + "tsp1_project?sys_id=" + grProject.getUniqueValue() + "'>" + grProject.number + "</a> foi criado";
        return sysidProjeto + ',' + grProject.number;
    },

    /**SNDOC
    @name validateProducts
    @description Cria multiplas demandas a partir de uma ideia

    @param {object} [current] - idea

    @example
    new demandasPersistence().validateProducts(current);

    @returns {void} 
    */
    validateProducts: function (grTsp1Idea) {
        var rotulos = ['marketplace', 'conversion', 'specifications', 'finish', 'barriers', 'certifications', '	specific_technical_requirements', 'dados_produto', 'Collage', 'Print', 'dados_cliente'];
        var finalidade_amostra = JSON.parse(grTsp1Idea.variables.finalidade_amostra);
        if (grTsp1Idea.variables.u_goal == 'sample') {
            for (j in finalidade_amostra) {
                var grTsp1Demand = new GlideRecord('tsp1_demand');
                grTsp1Demand.initialize();
                grTsp1Demand.setValue('idea', grTsp1Idea.getUniqueValue());
                grTsp1Demand.setValue('u_linha_de_produto', finalidade_amostra[j]['linha_de_produto']);
                grTsp1Demand.setValue('u_produto_a_ser_testado', finalidade_amostra[j]['produto_a_ser_testado']);
                grTsp1Demand.setValue('u_gramatura', finalidade_amostra[j]['gramatura']);
                grTsp1Demand.setValue('u_tamanho', finalidade_amostra[j]['tamanho']);
                grTsp1Demand.setValue('u_quantidade', finalidade_amostra[j]['quantidade']);
                var variables = grTsp1Idea.variables.getElements();
                for (i in variables) {
                    var question = variables[i].getQuestion();

                    var name = ((question.getName()).indexOf('u_') == -1) ? 'u_' + question.getName() + '' : question.getName() + '';
                    if (!this.searchArray(rotulos, question) && question.getName() != 'description') {
                        var grSysDictionary = new GlideRecord('sys_dictionary');
                        grSysDictionary.addEncodedQuery("element=" + name + "^name=tsp1_demand^ORDERBYDESCsys_created_on");
                        grSysDictionary.query();
                        if (grSysDictionary.hasNext()) {
                            grTsp1Demand.setValue(name, question.getValue() + '');
                        }
                    }
                }
                grTsp1Demand.insert();
            }
        } else {
            var grTsp1Demand = new GlideRecord('tsp1_demand');
            grTsp1Demand.initialize();
            var variables = grTsp1Idea.variables.getElements();
            for (i in variables) {
                var question = variables[i].getQuestion();

                var name = ((question.getName()).indexOf('u_') == -1) ? 'u_' + question.getName() + '' : question.getName() + '';
                if (!this.searchArray(rotulos, question) && question.getName() != 'description') {
                    var grSysDictionary = new GlideRecord('sys_dictionary');
                    grSysDictionary.addEncodedQuery("element=" + name + "^name=tsp1_demand^ORDERBYDESCsys_created_on");
                    grSysDictionary.query();
                    if (grSysDictionary.hasNext()) {
                        grTsp1Demand.setValue(name, question.getValue() + '');
                    }
                }
            }
            grTsp1Demand.setValue('idea', grTsp1Idea.getUniqueValue());
            grTsp1Demand.insert();
        }

    },

    searchArray: function (rotulos, question) {
        var rotValid = rotulos.filter(function getRecent(rotulo, Idx) {
            if (rotulo == question.getName()) {
                return rotulo;
            }
        });

        return (rotValid.toString() != '' ? true : false);

    },

    getURL: function () {
        var json = new JSON();
        return json.encode({
            "url": gs.getProperty('glide.servlet.uri')
        });
    },

    getDemand: function () {
        var id = this.getParameter('sysparm_recordid');
        var current = new GlideRecord('tsp1_demand');
        if (current.get(id)) {
            var lc = current.work_notes.getJournalEntry(1);
            var number = lc.split('"')[1];

            var grTsp1Demand = new GlideRecord('tsp1_demand');
            grTsp1Demand.addEncodedQuery("number=" + number);
            grTsp1Demand.query();
            if (grTsp1Demand.next()) {
                var json = new JSON();
                //                 var results = {
                //                     "sys_id": grTsp1Demand.getUniqueValue(),
                //                     "message": "A Demanda <a href='"+gs.getProperty('glide.servlet.uri')+"/tsp1_demand.do?sys_id="+grTsp1Demand.getUniqueValue()+"' target='_blank'> "+number+" </a> foi criada."
                //                 };

                return ("A Demanda <a href='" + gs.getProperty('glide.servlet.uri') + "tsp1_demand.do?sys_id=" + grTsp1Demand.getUniqueValue() + "' target='_blank'> " + number + " </a> foi criada."); //json.encode(results); //
            }

        }
    },

    getUserInfo: function (id) {
        id = id || this.getParameter('sysparm_recordid');
        var grSysUser = new GlideRecord('sys_user');
        if (grSysUser.get(id)) {
            var json = new JSON();
            var retorno = {
                "email": grSysUser.getValue('email')
            };
            return json.encode(retorno);
        }
    },

    filterAttributes: function (produto, atributo, gramatura) {
        gramatura = (typeof gramatura !== 'undefined') ? gramatura : false;
        var atributos = [];
        var grUEspecificacoesDoProduto = new GlideRecord('u_especificacoes_do_produto');
        if (gramatura) {
            grUEspecificacoesDoProduto.addEncodedQuery("u_active=true^u_produto=" + produto + "^u_gramatura=" + gramatura);
        } else {
            grUEspecificacoesDoProduto.addEncodedQuery("u_active=true^u_produto=" + produto);
        }

        grUEspecificacoesDoProduto.query();
        while (grUEspecificacoesDoProduto.next()) {
            atributos.push(grUEspecificacoesDoProduto.getValue(atributo));
        }
        return 'sys_idIN' + atributos;
    },

    createDemanda: function (current) {
        var grTsp1Demand = new GlideRecord('tsp1_demand');
        grTsp1Demand.addEncodedQuery("project=" + current.getUniqueValue());
        grTsp1Demand.orderByDesc('number');
        grTsp1Demand.query();
        if (grTsp1Demand.next()) {
            grTsp1Demand.number = '';
            grTsp1Demand.state = '';
            grTsp1Demand.project = '';
            grTsp1Demand.insert();

            current.u_demanda_relacionada = grTsp1Demand.getUniqueValue();
            current.update();
        }


        // 		var grTsp1Demand = new GlideRecord('tsp1_demand');
        // 		grTsp1Demand.initialize();
        // 		grTsp1Demand.setValue('short_description', current.short_description);
        // 		grTsp1Demand.insert();
    },

    volumeCalculoOld: function (current) {
        var grTsp1DemandAggregate = new GlideAggregate('tsp1_demand');
        grTsp1DemandAggregate.addEncodedQuery("u_plataforma!=NULL");
        grTsp1DemandAggregate.groupBy('u_plataforma');
        grTsp1DemandAggregate.query();
        while (grTsp1DemandAggregate.next()) {
            var aux = 0;
            var grTsp1Demand = new GlideRecord('tsp1_demand');
            grTsp1Demand.addEncodedQuery("u_plataforma=" + grTsp1DemandAggregate.u_plataforma + '');
            grTsp1Demand.query();
            while (grTsp1Demand.next()) {
                aux += Number(grTsp1Demand.getValue('u_volume_estimado_ton'));
            }

            var grTsp1Demand2 = new GlideRecord('tsp1_demand');
            grTsp1Demand2.addEncodedQuery("u_plataforma=" + grTsp1DemandAggregate.u_plataforma + '');
            grTsp1Demand2.query();
            while (grTsp1Demand2.next()) {
                var aux2 = (Number(grTsp1Demand2.getValue('u_volume_estimado_ton')) / aux);
                aux2 = Math.pow(aux2, 0.5);
                aux2 *= 3.333;
                aux2 = aux2.toFixed(2);
                grTsp1Demand2.setValue('u_soma_volume', aux2);
                grTsp1Demand2.autoSysFields(false);
                grTsp1Demand2.setWorkflow(false);
                grTsp1Demand2.update();
            }
        }
    },

    volumeCalculo: function (current) {
        var grTsp1DemandAggregate = new GlideAggregate('tsp1_demand');
        grTsp1DemandAggregate.addEncodedQuery("u_plataforma!=NULL");
        grTsp1DemandAggregate.groupBy('u_plataforma');
        grTsp1DemandAggregate.query();
        while (grTsp1DemandAggregate.next()) {
            var aux = 0;

            //soma de todos os projetos da plataforma
            var grTsp1Demand = new GlideRecord('tsp1_demand');
            grTsp1Demand.addEncodedQuery("u_plataforma=" + grTsp1DemandAggregate.u_plataforma + '');
            grTsp1Demand.query();
            while (grTsp1Demand.next()) {
                aux += Number(grTsp1Demand.getValue('u_volume_estimado_ton'));
            }

            var aux2 = 0;
            //soma de todos os projetos ativos da plataforma
            var grTsp1Demand2 = new GlideRecord('tsp1_project');
            grTsp1Demand2.addEncodedQuery("u_plataforma=" + grTsp1DemandAggregate.u_plataforma + "^stateNOT IN30,120,130^");
            grTsp1Demand2.query();
            while (grTsp1Demand2.next()) {
                aux2 += Number(grTsp1Demand2.getValue('u_volume_estimado_ton'));
            }
            //atribui valores
            var grTsp1Demand3 = new GlideRecord('tsp1_demand');
            grTsp1Demand3.addEncodedQuery("u_plataforma=" + grTsp1DemandAggregate.u_plataforma + '');
            grTsp1Demand3.query();
            while (grTsp1Demand3.next()) {
                var aux3 = aux2 / aux;
                aux3 = Math.pow(aux3, 0.5);
                aux3 = aux3 * 3.333;
                aux3 = aux3.toFixed(2);
                grTsp1Demand3.setValue('u_soma_volume', aux3);
                grTsp1Demand3.autoSysFields(false);
                grTsp1Demand3.setWorkflow(false);
                grTsp1Demand3.update();
            }
        }
    },

    mediaPriorizacao: function () {
        var grTsp1DemandAggregate = new GlideAggregate('tsp1_demand');
        grTsp1DemandAggregate.addEncodedQuery("u_plataforma!=NULL");
        grTsp1DemandAggregate.groupBy('u_plataforma');
        grTsp1DemandAggregate.query();
        while (grTsp1DemandAggregate.next()) {
            var aux = 0;
            var i = 0;
            var grTsp1Demand = new GlideRecord('tsp1_demand');
            grTsp1Demand.addEncodedQuery("u_plataforma=" + grTsp1DemandAggregate.u_plataforma + '');
            grTsp1Demand.query();
            while (grTsp1Demand.next()) {
                i++;
                aux += Number(grTsp1Demand.getValue('u_priorizacao'));
            }
            aux = aux / i;
            var grTsp1Demand2 = new GlideRecord('tsp1_demand');
            grTsp1Demand2.addEncodedQuery("u_plataforma=" + grTsp1DemandAggregate.u_plataforma + '');
            grTsp1Demand2.query();
            while (grTsp1Demand2.next()) {
                grTsp1Demand2.setValue('u_media_priorizacao', aux);
                grTsp1Demand2.autoSysFields(false);
                grTsp1Demand2.setWorkflow(false);
                grTsp1Demand2.update();
            }
        }
    },

    createDemand: function (grTsp1Idea) {
        var rotulos = ['marketplace', 'conversion', 'specifications', 'finish', 'barriers', 'certifications', '	specific_technical_requirements', 'dados_produto', 'Collage', 'Print', 'dados_cliente'];
        var finalidade_amostra = JSON.parse(grTsp1Idea.variables.finalidade_amostra);

        //Cria demanda geral
        var grTsp1Demand = new GlideRecord('tsp1_demand');
        grTsp1Demand.initialize();
        grTsp1Demand.setValue('idea', grTsp1Idea.getUniqueValue());
        var variables = grTsp1Idea.variables.getElements();
        for (i in variables) {
            var question = variables[i].getQuestion();
            var name = ((question.getName()).indexOf('u_') == -1) ? 'u_' + question.getName() + '' : question.getName() + '';
            if (!this.searchArray(rotulos, question) && question.getName() != 'description') {
                var grSysDictionary = new GlideRecord('sys_dictionary');
                grSysDictionary.addEncodedQuery("element=" + name + "^name=tsp1_demand^ORDERBYDESCsys_created_on");
                grSysDictionary.query();
                if (grSysDictionary.hasNext()) {
                    grTsp1Demand.setValue(name, question.getValue() + '');
                }
            }
        }

        grTsp1Demand.setValue('u_incoterms', grTsp1Idea.variables.incoterm);
        grTsp1Demand.setValue('u_modal', grTsp1Idea.variables.modal_n);

        grTsp1Demand.setValue('u_comentarios_adicionais', grTsp1Idea.variables.comentarios_adicionais);
        grTsp1Demand.setValue('description', grTsp1Idea.variables.description);
        grTsp1Demand.insert();

        //Solicite sua amostra -> vincula produtos
        if (grTsp1Idea.variables.u_goal == 'sample') {
            for (j in finalidade_amostra) {

                var grUIP = new GlideRecord('u_itbm_product');
                grUIP.initialize();
                grUIP.setValue('u_product', finalidade_amostra[j]['produto_a_ser_testado']);
                grUIP.setValue('u_amount', finalidade_amostra[j]['quantidade']);
                grUIP.setValue('u_demand', grTsp1Demand.getUniqueValue());
                //grUIP.setValue('u_available_in_stock');
                //grUIP.getValue('u_project');
                grUIP.setValue('u_size', finalidade_amostra[j]['tamanho']);
                grUIP.setValue('u_grammage', finalidade_amostra[j]['gramatura']);
                grUIP.setValue('u_special_size', finalidade_amostra[j]['informar_o_tamanho_desejado']);
                grUIP.setValue('u_product_line', finalidade_amostra[j]['linha_de_produto']);
                //                 grTsp1Demand.setValue('idea', grTsp1Idea.getUniqueValue());
                //                 grTsp1Demand.setValue('u_linha_de_produto', );
                //                 grTsp1Demand.setValue('u_produto_a_ser_testado', );
                //                 grTsp1Demand.setValue('u_gramatura', );
                //                 grTsp1Demand.setValue('u_tamanho', );
                //                 grTsp1Demand.setValue('u_quantidade', );
                grUIP.insert();
            }
        }
    },

    calculaSomadeVolume: function () {
        var aux = 0;
        //calcula volume
        var grTsp1Demand = new GlideRecord('tsp1_project');
        grTsp1Demand.addEncodedQuery("u_volume_estimado_tonISNOTEMPTY");
        grTsp1Demand.orderByDesc('number');
        grTsp1Demand.query();
        while (grTsp1Demand.next()) {
            aux += Number(grTsp1Demand.getValue('u_volume_estimado_ton'));
        }

        //calcula volume individual
        var grTsp1DemandVolume = new GlideRecord('tsp1_project');
        grTsp1DemandVolume.addEncodedQuery("");
        grTsp1DemandVolume.orderByDesc('number');
        grTsp1DemandVolume.query();
        while (grTsp1DemandVolume.next()) {
            var volume = 0;
            volume = (((Number(grTsp1DemandVolume.getValue('u_volume_estimado_ton')) / aux) * 10));
            volume = Math.pow(volume, 0.5);
            volume *= 3.333;
            grTsp1DemandVolume.setValue('u_vol_sum', Number(volume));
            grTsp1DemandVolume.autoSysFields(false);
            grTsp1DemandVolume.setWorkflow(false);
            grTsp1DemandVolume.update();
        }
    },

    confirmaPriorizacao: function () {
        var count = 0;
        var grDmn = new GlideRecord('tsp1_demand');
        if (grDmn.get(this.getParameter('demandID'))) {
            return ((grDmn.getValue('u_priorizacao') == '' || grDmn.getValue('u_priorizacao') == null) ? 'true' : 'false');
        }
        return 'abacaxi';
    },

    hideButton: function () {
        return (!(gs.hasRole("dnp_user")));
    },
    type: 'demandasPersistence'
});