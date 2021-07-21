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

  clazz.area_shisha_cd = empty.id;
  clazz.area_shukan_cd = empty.id;
  clazz.area_shiten_cd = empty.id;
  clazz.area_center_cd = empty.id;

  clazz.area_time_select = 0;
  clazz.area_item_select = "0";

  clazz.teijishuka_pattern = empty.id;
  clazz.teijishuka_course = [];
  clazz.teijishuka_yobi = "";
  clazz.teijishuka_timeFrom = "-";
  clazz.teijishuka_timeEnd = "-";
  clazz.teijishuka_teiji = "1";
  clazz.teijishuka_tel = "0";
  clazz.teijishuka_expr = "";

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

  clazz._eventHandlerJighosho = function () {
    this._onChangeDom("NimotsuShousai_jigyosho");
    this._onChangeDom("TeijshukaKensaku_jigyosho");
    this._onChangeDom("ShuhaiKuikiCouse_jigyosho");
  };

  clazz._eventHandlerNimotsu = function () {
    this._onChangeDom("tokei_hidden");
    this._onChangeDom("tokeigai_hidden");
    this._onChangeDom("AttackHani_event");
  };

  clazz._eventHandlerTeishu = function () {
    this._onChangeDom("TeijishukaTable_event");
  };

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

  clazz._getListCoordinates = function (x_min, y_min, x_max, y_max) {
    const x_cell = 5;
    const y_cell = 3;
    const stepX = (x_max - x_min) / x_cell;
    const stepY = (y_max - y_min) / y_cell;

    var listCoordinates = [];

    var A1 = {
      xmin: x_min,
      ymin: y_max - stepY * 1,

      xmax: x_min + stepX * 1,
      ymax: y_max
    };
    var A2 = {
      xmin: x_min + stepX * 1,
      ymin: y_max - stepY * 1,

      xmax: x_min + stepX * 2,
      ymax: y_max
    };
    var A3 = {
      xmin: x_min + stepX * 2,
      ymin: y_max - stepY * 1,

      xmax: x_min + stepX * 3,
      ymax: y_max
    };
    var A4 = {
      xmin: x_min + stepX * 3,
      ymin: y_max - stepY * 1,

      xmax: x_min + stepX * 4,
      ymax: y_max
    };
    var A5 = {
      xmin: x_min + stepX * 4,
      ymin: y_max - stepY * 1,

      xmax: x_min + stepX * 5,
      ymax: y_max
    };
    //////////////////////////////////////////////////////////////

    var A6 = {
      xmin: x_min,
      ymin: y_max - stepY * 2,

      xmax: x_min + stepX * 1,
      ymax: y_max - stepY * 1
    };
    var A7 = {
      xmin: x_min + stepX * 1,
      ymin: y_max - stepY * 2,

      xmax: x_min + stepX * 2,
      ymax: y_max - stepY * 1
    };
    var A8 = {
      xmin: x_min + stepX * 2,
      ymin: y_max - stepY * 2,

      xmax: x_min + stepX * 3,
      ymax: y_max - stepY * 1
    };
    var A9 = {
      xmin: x_min + stepX * 3,
      ymin: y_max - stepY * 2,

      xmax: x_min + stepX * 4,
      ymax: y_max - stepY * 1
    };
    var A10 = {
      xmin: x_min + stepX * 4,
      ymin: y_max - stepY * 2,

      xmax: x_min + stepX * 5,
      ymax: y_max - stepY * 1
    };
    //////////////////////////////////////////////////////////////

    var A11 = {
      xmin: x_min,
      ymin: y_max - stepY * 3,

      xmax: x_min + stepX * 1,
      ymax: y_max - stepY * 2
    };
    var A12 = {
      xmin: x_min + stepX * 1,
      ymin: y_max - stepY * 3,

      xmax: x_min + stepX * 2,
      ymax: y_max - stepY * 2
    };
    var A13 = {
      xmin: x_min + stepX * 2,
      ymin: y_max - stepY * 3,

      xmax: x_min + stepX * 3,
      ymax: y_max - stepY * 2
    };
    var A14 = {
      xmin: x_min + stepX * 3,
      ymin: y_max - stepY * 3,

      xmax: x_min + stepX * 4,
      ymax: y_max - stepY * 2
    };
    var A15 = {
      xmin: x_min + stepX * 4,
      ymin: y_max - stepY * 3,

      xmax: x_min + stepX * 5,
      ymax: y_max - stepY * 2
    };

    listCoordinates.push(A1);
    listCoordinates.push(A2);
    listCoordinates.push(A3);
    listCoordinates.push(A4);
    listCoordinates.push(A5);
    listCoordinates.push(A6);
    listCoordinates.push(A7);
    listCoordinates.push(A8);
    listCoordinates.push(A9);
    listCoordinates.push(A10);
    listCoordinates.push(A11);
    listCoordinates.push(A12);
    listCoordinates.push(A13);
    listCoordinates.push(A14);
    listCoordinates.push(A15);

    return listCoordinates;
  };

  return clazz;
});
