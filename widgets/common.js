var empty = {
  label: "選択なし",
  id: "-",
};

var kengen_shubetsu = {
  honsha: "00",
  shisha: "10",
  shukan: "20",
  shiten: "30",
};

define(["libs/md5/md5"], function (md5) {
  var clazz = {};

  clazz.kengen_lv = "99";
  clazz.cmid = "";

  clazz.isAppConfigLoaded = false;

  clazz._initKengen = function () {
    var params = {};
    var query = window.location.href.split("?")[1];
    if (query) {
      var rawParams = query.split("&");
      rawParams.forEach(function (prm, i) {
        var kv = prm.split("=");
        params[kv[0]] = kv[1];
      });
    }

    Object.keys(params).forEach(function (name, i) {
      console.log("name :" + name + ", value: " + this[name]);
    }, params);

    this.kengen_lv = params["kengenLv"];


  };

  clazz._eventHandlerPrefecture = function () {
    this._onChangeDom("change_pref");
  };

  clazz._eventHandlerNimotsu = function() {
    console.log("handlerNimotsu");
  }

  clazz._onChangeDom = function (id) {
    var dom = document.getElementById(id);
    if (dom != undefined) {
      try {
        dom.onchange();
      } catch (e) {
        console.log("retry:" + id);
        setTimeout(this._onChangeDom, 100, id);
      }
    }
  };

  clazz._setDomVal = function (id, key, val) {
    var dom = dijit.byId(id);
    if (dom) {
      return dom.set(key, val);
    }
  };

  clazz._getDomVal = function (id, key) {
    var dom = dijit.byId(id);
    if (dom) {
      return dom.get(key);
    }
    return "";
  };

  return clazz;
});
