(function() {
    // g_approval_form_request is for approval summarizer ACLs
    // that let user read a record they need to approve. This global
    // variable is then deleted at the bottom of the script
    g_approval_form_request = true;
    var gr = $sp.getRecord();
    if (gr == null || !gr.isValid()) {
        data.isValid = false;
        return;
    }
    if (gr.getValue("approver") != gs.getUserID())
        data.approver = gr.approver.getDisplayValue();
    data.isValid = true;
    var task = getRecordBeingApproved(gr);
    if (task == null) {
        data.isValid = false;
        return;
    }

    var t = {};
    t = $sp.getFieldsObject(task, 'number,short_description,opened_by,requested_by,start_date,end_date,quantity,price,recurring_price,recurring_frequency,justification');
    t.table = task.getLabel();

    var items = [];
    var idx = 0;
    var itemsGR = new GlideRecord("sc_req_item");
    itemsGR.addQuery("request", task.sys_id);
    itemsGR.query();
    while (itemsGR.next()) {
        var item = {};
        item.short_description = itemsGR.short_description.toString();
        if (itemsGR.getValue("price") > 0)
            item.price = itemsGR.getDisplayValue("price");

        if (itemsGR.getValue("recurring_price") > 0) {
            item.recurring_price = itemsGR.getDisplayValue("recurring_price");
            item.recurring_frequency = itemsGR.getDisplayValue("recurring_frequency");
        }
        if (itemsGR)
            item.variables = new GlobalServiceCatalogUtil().getVariablesForTask(itemsGR, true);

        items[idx] = item;
        idx++;
    }

    data.items = items;
    data.sys_id = gr.getUniqueValue();
    data.task = t;
    if (task) {
        var optionsGr = task.request_item ? task.request_item.getRefRecord() : task;

        data.variables = new GlobalServiceCatalogUtil().getVariablesForTask(optionsGr, true);
        console.log(data)
    }

    function getRecordBeingApproved(gr) {
        var approvalTargetRecord;
        if (!gr.sysapproval.nil())
            approvalTargetRecord = gr.sysapproval.getRefRecord();
        else
            approvalTargetRecord = gr.document_id.getRefRecord();

        return (approvalTargetRecord.canRead()) ? approvalTargetRecord : null;
    }

    var ticketConversationOptions = {
        placeholder: gs.getMessage("Type your message here..."),
        placeholderNoEntries: gs.getMessage("Start a conversation..."),
        btnLabel: gs.getMessage("Send")
    };

    if (options.use_approval_record_activity_stream === true ||
        options.use_approval_record_activity_stream === "true") {
        ticketConversationOptions.sys_id = gr.getUniqueValue();
        ticketConversationOptions.table = gr.getRecordClassName();
        ticketConversationOptions.title = gs.getMessage("Activity Stream for Approval");
    } else {
        ticketConversationOptions.sys_id = task.getUniqueValue();
        ticketConversationOptions.table = task.getRecordClassName();
        ticketConversationOptions.title = gs.getMessage("Activity Stream for {0}", task.getLabel());
    }

    data.ticketConversation = $sp.getWidget('widget-ticket-conversation', ticketConversationOptions);
    delete g_approval_form_request;
})();