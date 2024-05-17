/* ******************** ServiceNow Code Snippets ******************** */

/* ******************** Client Scripts ******************** */

function onLoad() {
  //Type appropriate comment here, and begin script below
}

function onSubmit() {
  //Type appropriate comment here, and begin script below
}

function onChange(control, oldValue, newValue, isLoading, isTemplate) {
  if (isLoading || newValue === "") {
    return;
  }
  //Type appropriate comment here, and begin script below
}

function onCellEdit(sysIDs, table, oldValues, newValue, callback) {
  //Type appropriate comment here, and begin script below
}


/* ******************** g_form ******************** */

g_form.getValue('fieldName');
g_form.setValue('fieldName', 'value');

g_form.setMandatory('fieldName', true);
g_form.setReadOnly('fieldName', true);
g_form.setVisible('fieldName', true);

g_form.addOption('fieldName', 'value');
g_form.removeOption('fieldName', 'value');

g_form.addErrorMessage('Message');
g_form.addFormMessage('info message', 'info/warning/error');

g_form.showFieldMsg('Message', 'error/warn/info');
g_form.hideFieldMsg('fieldName', true);

g_form.clearMessages();
g_form.clearOptions('fieldName');
g_form.clearAllFormMessages();

g_form.clearOptions('fieldName');
g_form.clearValue('fieldName');

g_form.getValue('fieldName');
g_form.getDisplayValue('fieldName');
g_form.getUniqueValue();

g_form.isNewRecord();


/* ******************** g_user ******************** */

g_user.firstName;
g_user.lastName;
g_user.userID;
g_user.userName;
g_user.getFullName();
g_user.hasRole('role');


/* ******************** GlideAjax ******************** */

/* ********** Single Parameter ********** */

/* Client Script */
function onLoad() {
  var ga = new GlideAjax('scriptIncludeName');
  ga.addParam('sysparm_name', 'functionName');
  ga.addParam('sysparm_name2', 'value');
  ga.getXMLAnswer(functionName);
}
function functionName(response) {
  alert(response);
}

/* Script include */
var scriptIncludeName = Class.create();
scriptIncludeName.prototype = Object.extendsObject(global.AbstractAjaxProcessor, {
  functionName: function () {
    var variableName = this.getParameter('sysparm_name2');
    var grUser = new GlideRecord('sys_user');
    grUser.get('user_name', variableName);
    var result = {
      'name': grUser.getDisplayValue('name')
    };
    return JSON.stringify(result);
  },
  type: 'scriptIncludeName'
});


/* ********** Multi Parameters ********** */

/* Client Script */
function onLoad() {
  var ga = new GlideAjax('scriptIncludeName');
  ga.addParam('sysparm_name', 'functionName');
  ga.addParam('sysparm_name2', 'value');
  ga.getXML(functionName);
}
function functionName(response) {
  var answer = response.responseXML.documentElement.getAttribute('answer');
  if (answer) {
    var returneddata = answer.evalJSON(true);
    alert(returneddata.sys_id, returneddata.name);
  }
}

/* Script include */
var scriptIncludeName = Class.create();
scriptIncludeName.prototype = Object.extendsObject(AbstractAjaxProcessor, {
  functionName: function () {
    var variableName = this.getParameter('sysparm_name2');
    var gr = new GlideRecord('table');
    if (gr.get(variableName)) {
      var json = new JSON();
      var results = {
        'sys_id': gr.getValue('sys_id'),
        'name': gr.getValue('name')
      };
      return json.encode(results);
    }
  },
  type: 'scriptIncludeName'
});


/* ********** Asynchronous GlideAjax ********** */

/* Client Script */
var ga = new GlideAjax('HelloWorld');
ga.addParam('sysparm_name', 'helloWorld');
ga.addParam('sysparm_user_name', 'Bob');
ga.getXML(HelloWorldParse);
function HelloWorldParse(response) {
  var answer = response.responseXML.documentElement.getAttribute('answer');
  alert(answer);
}

/* Script include */
var HelloWorld = Class.create();
HelloWorld.prototype = Object.extendsObject(AbstractAjaxProcessor, {
  helloWorld: function () { return 'Hello ' + this.getParameter('sysparm_user_name') + '!'; },
  _privateFunction: function () { // this function is not client callable     
  }
});


/* ***** Synchronous GlideAjax ***** */

/* Client Script */
var ga = new GlideAjax('HelloWorld');
ga.addParam('sysparm_name', 'helloWorld');
ga.addParam('sysparm_user_name', 'Bob');
ga.getXMLWait();
alert(ga.getAnswer());

/* Script include */
var HelloWorld = Class.create();
HelloWorld.prototype = Object.extendsObject(AbstractAjaxProcessor, {
  helloWorld: function () { return 'The Server Says Hello ' + this.getParameter('sysparm_user_name') + '!'; }
});


/* ******************** GlideRecord ******************** */

/* ***** GlideRecord Query ***** */

var gr = new GlideRecord('table');
gr.addQuery('fieldName', 'value');
gr.query();

while (gr.next()) {
  gs.log('State is ' + gr.state);
}

/* ***** GlideRecord Query GET ***** */

var gr = new GlideRecord('table');
if (gr.get('active', true)) {
  gs.log('State is ' + gr.state);
}

/* ***** GlideRecord GetRefRecord ***** */

var caller = current.caller_id.getRefRecord();
caller.email = 'test@test.com';
caller.update();

/* ***** GlideRecord Insert ***** */

var gr = new GlideRecord('table');
gr.initialize();
gr.short_description = 'Network problem';
gr.category = 'software';
gr.caller_id.setDisplayValue('Joe Employee');
gr.insert();

/* ***** GlideRecord Update ***** */

var gr = new GlideRecord('table');
gr.addQuery('active', true);
gr.query();
while (gr.next()) {
  gr.active = false;
  gr.update();
}

/* ***** GlideRecord Delete ***** */
var gr = new GlideRecord('table');
gr.addQuery('active', false);
gr.query();
gr.deleteMultiple(); //Deletes all records in the record set

while (gr.next()) {
  gr.deleteRecord(); //Delete each record in the query result set
}

/* ***** GlideRecord AddEncodedQuery ***** */

var gr = new GlideRecord('table');
var strQuery = 'active=true^category=software^ORcategory=hardware';
gr.addEncodedQuery(strQuery);
gr.query();


/* ******************** Logs ******************** */

gs.log('Label: ' + 'value', 'logSource');

gs.log('logDescription: ' + JSON.stringify({
  name: value,
  name: value,
  name: value,
  name: value,
  name: value,
}), 'logSource');