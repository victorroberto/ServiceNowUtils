var count = 0;

var gr = new GlideRecord('u_cmdb_ci_managed');
gr.addEncodedQuery('sys_id=0d79eba7db92a018a7f8a334ca961911^ORsys_id=8f059e3bdbaae814545dee0c13961923^ORsys_id=7ae5567fdbaae814545dee0c1396197b^ORsys_id=104074cadbc3a050a7f8a334ca9619f9^ORsys_id=ba71e1f8db0b2014545dee0c1396195b^ORsys_id=0a800507db83e490a7f8a334ca961948^ORsys_id=b73e59201b132090a0ab62ca234bcbf1^ORsys_id=e24e9d201b132090a0ab62ca234bcbdb^ORsys_id=6ae8eb201b532c50a62b20622a4bcb2a^ORsys_id=5deafbe41b1b2c50a62b20622a4bcb54^ORsys_id=09fd84afdb17ecd0fb5d09ccd39619c6^ORsys_id=a42969231bd3a054a0ab62ca234bcb3c^ORDERBYnumber');
gr.query();

while (gr.next()) {
    var contract = getContract(gr.u_siebel_asset_number);
    var modality = getModalityAttribute(contract);
    gr.u_modality = modality;
    gr.update();
    count++;
}

function getContract(siebelAssetNumber) {
    var gr = new GlideRecord('sn_customerservice_contract_item');
    gr.addEncodedQuery('u_siebel_asset_number=' + siebelAssetNumber);
    gr.query();
    if (gr.next()) {
        return gr.getUniqueValue();
    }
}

function getModalityAttribute(contractSysId) {
    var gr = new GlideRecord('sn_customerservice_contract_item_attributes');
    gr.addEncodedQuery('u_attribute=Modality^u_contract_item=' + contractSysId);
    gr.query();
    if (gr.next()) {
        return gr.u_value;
    }
}

gs.print("CIs atualizados: " + count);