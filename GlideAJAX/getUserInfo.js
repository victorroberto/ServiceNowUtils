/* Script include getUserInfo */
var getEmpolyeeInfo = Class.create();
getEmpolyeeInfo.prototype = Object.extendsObject(AbstractAjaxProcessor, {

    getUserInfo: function() {
        var queryField = this.getParameter('sysparm_queryField');
        var queryValue = this.getParameter('sysparm_queryValue');
        var fields = this.getParameter('sysparm_fields').split(',');

        var usergr = new GlideRecord("sys_user");
        usergr.addQuery(queryField, queryValue);
        usergr.query();

        var objUser = {};

        if (usergr.next()) {
            for (var key = 0; key < fields.length; key++) {
                objUser[fields[key]] = usergr[fields[key]].getDisplayValue();
            }
        }
        return JSON.stringify(objUser);
    },

    getManagerInfo: function() {
        var user = this.getParameter('sysparm_user');
        var manager = false;

        var gr = new GlideRecord("sys_user");
        gr.addEncodedQuery('manager=' + user);
        gr.query();

        if (gr.next()) manager = true;
        return manager;
    },

    verifyGroup: function() {
        var user = this.getParameter('sysparm_user');

        var groupGR = new GlideRecord("sys_user_grmember");
        groupGR.addEncodedQuery('group=c24f95821b83f810b71beca0f54bcb54^user=' + user);
        groupGR.query();

        if (groupGR.next()) {
            return true;
        } else {
            return false;
        }
    },

    verifyPermission: function() {
        var user = gs.getUser();
        user.getID();

        var function1 = this.verifyGroup();
        if (function1 == true) {
            return "active=true^emailNOT LIKEunidas^emailNOT LIKEzul^emailNOT LIKEc6^user_nameNOT LIKE@^user_nameNOT LIKEteste^nameNOT LIKEuser^nameNOT LIKERobot^user_nameNOT LIKEuser^name!=System Administrator^ORname!=NULL^nameNOT LIKEVELOI^nameNOT LIKEVELOE^NQactive=true^user_nameISNOTEMPTY^user_nameNOT LIKE@^user_nameNOT LIKEteste^user_nameNOT LIKEuser^emailISEMPTY^nameNOT LIKEuser^nameNOT LIKERobot^nameNOT LIKEVELOI^nameNOT LIKEVELOE^name!=System Administrator^ORname!=NULL";
        }
        var verifyManager = this.getManagerInfo();

        if (verifyManager == true) {
            return 'manager=' + user;
        }
    },
    type: 'getEmpolyeeInfo'
});


/* Client Script getUserInfo */
function onChange(control, oldValue, newValue, isLoading) {
	if (isLoading || newValue == '') {
		return;
	}

	var ga = new GlideAjax('global.getEmpolyeeInfo');
	ga.addParam('sysparm_name','getUserInfo');
	ga.addParam('sysparm_queryField', 'sys_id');
	ga.addParam('sysparm_queryValue', newValue);
	ga.addParam('sysparm_fields', 'email,department,title,manager');
	ga.getXML(callback);

	function callback(response){
		var objUser = JSON.parse(response.responseXML.documentElement.getAttribute('answer'));
		if(objUser.department == ''){
			g_form.addErrorMessage('O usuário selecionado não possui departamento configurado no AD, portanto não poderá seguir com a solicitação. Entre em contato com o time de Gestão de Acessos para corrigir.');
			g_form.clearValue('solicitado_para');
			g_form.clearValue('e_mail');
			g_form.clearValue('area');
			g_form.clearValue('cargo');
			g_form.clearValue('gestor_a_gerente');
			return;
		}
		g_form.setValue('e_mail', objUser.email);
		g_form.setValue('area', objUser.department);
		g_form.setValue('cargo', objUser.title);
		g_form.setValue('gestor_a_gerente', objUser.manager);
	}
}