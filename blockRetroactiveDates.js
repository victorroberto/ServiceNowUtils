
/* Doesn't allow retroactive dates */

/* Business Rule */
function onChange(control, oldValue, newValue, isLoading) {
    if (isLoading || newValue == "") {
      return;
    }
    if (g_form.getValue("dateField") != "") {
      var cdt = g_form.getValue("dateField"); //First Date/Time field
  
      var dataType = "day"; //this can be day, hour, minute, second. By default it will return seconds.
  
      var ajax = new GlideAjax("ScriptInclude");
      ajax.addParam("sysparm_name", "getNowDateTimeDiff");
      ajax.addParam("sysparm_fdt", cdt);
      ajax.addParam("sysparm_difftype", dataType);
      ajax.getXML(function () {
        var answer = ajax.getAnswer();
  
        if (parseInt(answer) >= 0) {
          g_form.addErrorMessage(
            "The Date cannot be greater than or equal to the current date."
          );
          g_form.setValue("dateField", "");
        }
      });
    }
  }
  
  /* Script Include */
  getNowDateTimeDiff: function() {
    var firstDT = this.getParameter('sysparm_fdt'); //First Date-Time Field
    var diffTYPE = this.getParameter('sysparm_difftype'); // Date-Time Type to return the answer as. Can be second, minute, hour, day
    var diff = gs.dateDiff(gs.nowDate(), firstDT, true);
    var timediff = this._calcDateDiff(diffTYPE, diff);
    return timediff;
  },