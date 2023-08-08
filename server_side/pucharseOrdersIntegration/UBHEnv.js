/*
- Ambientes rest UnimedBH
- Property ubh_rest_env
*/

var UBHEnv = Class.create();
UBHEnv.prototype = {
  env: {},

  initialize: function (name, instance) {
    var envProperty = JSON.parse(gs.getProperty("ubh_rest_env"));
    var instanceName;

    if (instance != null && instance.trim() != "") {
      instanceName = instance.toString();
    } else {
      instanceName = gs.getProperty("instance_name");
    }

    if (name) {
      this.env = envProperty[instanceName][name];
      this.env.profileId =
        this.getBasicProfileId(
          envProperty[instanceName][name]["profile_name"]
        ) + "";
    } else {
      this.env = envProperty[instanceName];
      this.env.getBasicProfileId = this.getBasicProfileId;
    }
  },

  getRestAuthProfile: function (name) {
    var gr = new GlideRecord("sys_rest_message");
    gr.get("name", name);
    var obj = { type: "", profile_id: "" };
    obj.type = gr.authentication_type;
    obj.profile_id = gr.basic_auth_profile || gr.auth2_profile;
    return obj;
  },

  getBasicProfileId: function (name) {
    var gr = new GlideRecord("sys_auth_profile_basic");
    gr.get("name", name);
    return gr.sys_id;
  },
  type: "UBHEnv",
};
