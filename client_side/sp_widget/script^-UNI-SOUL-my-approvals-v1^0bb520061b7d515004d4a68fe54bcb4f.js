data.approvals = []

var gr = new GlideRecord("sysapproval_approver");
gr.addEncodedQuery("state=requested^sysapprovalSTARTSWITHOCO^ORsysapprovalSTARTSWITHSCO^approverDYNAMIC90d1921e5f510100a9ad2572f2b477fe");
gr.query()

while (gr.next()) {
	var task = getRecordBeingApproved(gr);
	if (!task.isValidRecord())
		continue;

	var t = {};
	t.sys_id = task.getUniqueValue();
	t.app_id = gr.getUniqueValue();
	t.number = task.getDisplayValue();
	t.number_oc_sc = task.getDisplayValue('u_numero_da_ordem') || task.getDisplayValue('u_numero_da_solicitacao');
	t.sistema = task.getDisplayValue('u_sistema_de_origem');
	t.table = task.getTableName();
	t.valor = parseFloat(task.getDisplayValue('u_valor_liquido'));
	t.fornecedor = task.getDisplayValue('u_codigo_do_fornecedor');

	data.approvals.push(t);
}

data.approvals = data.approvals.filter(function (item) {
	if (item.sistema.includes("SOUL")) return item;
})

data.approvals = data.approvals.map(function (item) {
	if (item.table === "u_ordem_compra") item.abb = "OC";
	if (item.table === "u_solicitacao_compra") item.abb = "SC";
	if (item.table === "u_item_da_solicitacao_compra") item.abb = "ISC";

	return item;
})

data.approvals = data.approvals.map(function (item) {
	if (item.table === "u_ordem_compra") {
		item.items = getItemsOc(item.sys_id);
	}

	if (item.table === "u_item_da_solicitacao_compra") {
		item.items = getItemsSc(item.sys_id)
	}

	return item
})

data.approvals = data.approvals.map(function (item) {
	var approvals = new GlideRecord("sysapproval_approver");
	approvals.addQuery('sysapproval', item.sys_id);
	approvals.addEncodedQuery("^stateINapproved,rejected");
	approvals.orderByDesc('sys_updated_on');
	approvals.query();

	while (approvals.next()) {
		item.approvers = [];

		var obj = {
			state: '',
			approver: '',
			comments: '',
			description: '',
			approved_at: '',
			color: ''
		};

		obj.state = approvals.state.getDisplayValue() + '';
		obj.color = approvals.state + '';
		var str = approvals.comments.getJournalEntry(1) + '';
		if (str.indexOf('(Comments)') == -1) {
			if (str.indexOf('Comentários') == -1) {
				obj.comments = approvals.comments.getJournalEntry(1) + '';
			} else {
				var onlyNotesPT = str.split("(Comentários)\n");
				var lastWorknotePT = onlyNotesPT[1];
				obj.comments = lastWorknotePT;
			}

		} else {
			var onlyNotes = str.split("(Comments)\n") || str.split("(Comentários)\n");
			var lastWorknote = onlyNotes[1];
			obj.comments = lastWorknote;
		}

		obj.approver = approvals.approver.getDisplayValue() + '';
		obj.description = approvals.sysapproval.short_description + '';

		item.approvers.push(obj)
	}

	return item

})

if (input.action == "u_update") {
	gs.log('Chamou a SC_OC_GetPendingAproovals', 'SC_OC_GetPendingAproovals');
	var getAprovacoes = new global.SC_OC_GetPendingAproovals();
	getAprovacoes.getAprovacoes('soul');
}

if (input.action === "approve") {
	var grApproval = new GlideRecord('sysapproval_approver');
	grApproval.addQuery("sysapproval", input.sys_id);
	grApproval.query()

	if (grApproval.next()) {
		grApproval.state = 'approved';
		grApproval.update();

		if (!grApproval.sysapproval.nil()) {
			var opinion = 'Parecer Gerente: ' + grApproval.approver.name + '\n\n' + input.opinion;
			var grParent = grApproval.sysapproval.getRefRecord();
			grParent.work_notes = opinion;
			grParent.update();
		}
	}

	data.approvals = data.approvals.filter(function (item) {
		if (item.sys_id !== input.sys_id) return item;
	})

}

if (input.action === "reject") {
	if (!!!input.comment) {
		gs.addErrorMessage("Insira um comentario");
	} else {
		var grApproval = new GlideRecord('sysapproval_approver');
		grApproval.addQuery("sysapproval", input.sys_id);
		grApproval.query()

		if (grApproval.next()) {
			grApproval.state = 'rejected';
			grApproval.comments = String(input.comment);
			grApproval.update();

			if (!grApproval.sysapproval.nil()) {
				var opinion = 'Parecer Gerente: ' + grApproval.approver.name + '\n\n' + input.opinion;
				var grParent = grApproval.sysapproval.getRefRecord();
				grParent.work_notes = opinion;
				grParent.update();
			}
		}

		data.approvals = data.approvals.filter(function (item) {
			if (item.sys_id !== input.sys_id) return item;
		})
	}
}

function getRecordBeingApproved(gr) {
	if (!gr.sysapproval.nil())
		return gr.sysapproval.getRefRecord();

	return gr.document_id.getRefRecord();
}

function getItemsOc(sys_id) {
	var arr = []
	var oc = new GlideRecord('u_item_da_ordem_compra');
	oc.addQuery('parent', sys_id);
	oc.query();
	while (oc.next()) {
		arr.push({
			ordem: oc.getDisplayValue('u_numero_da_ordem'),
			sequencia: oc.getDisplayValue('u_sequencia_do_item'),
			complemento: oc.getDisplayValue('u_complemento_do_item'),
			quantidade: oc.getDisplayValue('u_quantidade'),
			preco: parseFloat(oc.getDisplayValue('u_preco_unitario')),
			total: parseFloat(oc.getDisplayValue('u_valor_liquido')),
			dtEntrega: oc.getDisplayValue('u_data_da_entrega'),
			rateio: oc.getDisplayValue('u_observacao_do_rateio').replaceAll('\n', ';').split(';')
		})
	}

	return arr
}

function getItemsSc(sys_id) {
	var os = new GlideRecord('u_item_da_solicitacao_compra');
	os.addQuery('parent', sys_id);
	os.query();

	while (os.next()) {
		data.itemsSC.push({
			number: os.getDisplayValue('number'),
			ordem: os.getDisplayValue('u_numero_da_solicitacao'),
			sequencia: os.getDisplayValue('u_sequencia_do_item'),
			codProd: os.getDisplayValue('u_item_da_solicitacao_compra'),
			complemento: os.getDisplayValue('u_complemento_do_item'),
			codAgrup: os.getDisplayValue('u_codigo_de_agrupamento_para_estoque'),
			quantidade: os.getDisplayValue('u_quantidade'),
			preco: parseFloat(os.getDisplayValue('u_valor_unitario')),
			total: parseFloat(os.getDisplayValue('u_valor_unitario')) * parseFloat(os.getDisplayValue('u_quantidade')),
			observacao: os.getDisplayValue('u_observacao')
		})
	}
}