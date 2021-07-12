var opLayer_TeijshukaKensaku = new Object();
define([
	"dojo/_base/declare",
	"dojo/_base/lang",
	"dojo/_base/array",
	"dojo/_base/html",
	"dojo/_base/window",
	"dojo/store/Memory",
  "dojo/data/ObjectStore",
	"dojo/dom",
	"dijit/_WidgetBase",
	"dijit/_TemplatedMixin",
	"dijit/_WidgetsInTemplateMixin",
	"dijit/popup",
	"dijit/form/Select",
	"dijit/form/MultiSelect",
	"dijit/form/CheckBox",
	"jimu/FilterManager",
	"esri/layers/FeatureLayer",
	"esri/tasks/query",
	"widgets/common",
	"dojo/text!./templates/TeijiShuka.html"
      ], function (
	declare,
	lang,
	array,
	html,
	win,
	Memory,
	ObjectStore,
	dom,
	_WidgetBase,
	_TemplatedMixin,
	_WidgetsInTemplateMixin,
	popup,
	Select,
	MultiSelect,
  CheckBox,
	FilterManager,
	FeatureLayer,
	Query,
	common,
	template
      ) {

	return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
    widgetsInTemplate: true,
    templateString: template,
    map: null,

    _showSettings: false,

    jigyosho: ["-", "-", "-", "-"],
    teishusaki_layer_id: "",

    postCreate: function () {
      this.inherited(arguments);

      this.filterManager = FilterManager.getInstance();
    },

    startup: function () {
      this.inherited(arguments);
      var self = this;

      // SELECTsakusei
      this._createSelect(self);

      var teiji = new CheckBox(
        {
          id: "TeijshukaKensaku_teiji",
          name: "teiji",
          value: "1",
          checked: true,
          disabled: true,
          onChange: function (state) {
            common.teijishuka_teiji = state;
            self._filter(self, true);
          },
        },
        "checkBox"
      );
      teiji.placeAt(self.searchNode_TeijshukaKensaku_teiji).startup();

      var tel = new CheckBox(
        {
          id: "TeijshukaKensaku_tel",
          name: "tel",
          value: "1",
          checked: false,
          disabled: true,
          onChange: function (state) {
            common.teijishuka_tel = state;
            self._filter(self, true);
          },
        },
        "checkBox"
      );
      tel.placeAt(self.searchNode_TeijshukaKensaku_tel).startup();

      var jigyosho = document.getElementById("TeijshukaKensaku_jigyosho");
      jigyosho.onchange = function (evt) {
        self._jigyoshoFilterEvent(self);
      };

      this.opLayers = this.map.itemInfo.itemData.operationalLayers;
      array.some(
        this.opLayers,
        lang.hitch(this, function (layer) {
        if (layer.layerType === "ArcGISFeatureLayer") {
          var title_array = layer.title.split(" ");
          // if(title_array.lenght != 3){
          //   return;
          // }
          switch (title_array[0]) {
            case "japan_airport":
              opLayer_TeijshukaKensaku = new FeatureLayer(
                layer.layerObject.url
              );
              self.teishusaki_layer_id = layer.id;
              self._filter(self, false);
              break;
          }
        }
        }));
    },

    _createSelect: function (self) {
      var patternArray = [{ value: "-", label: "選択なし", selected: true }];

      var selectPattern = new Select({
        id: "TeijshukaKensaku_patternSelect",
        options: patternArray,
        sortByLabel: false,
        disabled: true,
        onChange: function (state) {
          common.teijishuka_pattern = state;
          self._courseListUpdate(self);
          self._filter(self, true);
        },
      });
      selectPattern.placeAt(self.searchNode_TeijshukaKensaku_pattern).startup();

      var courseArray = [{ value: "-", label: "選択なし", selected: true }];

      var selectPattern = new MultiSelect({
        id: "TeijshukaKensaku_courseSelect",
        options: courseArray,
        sortByLabel: false,
        disabled: true,
        onChange: function (state) {
          common.teijishuka_course = state;
          self._filter(self, true);
        },
      });
      selectPattern.placeAt(self.searchNode_TeijshukaKensaku_course).startup();

      // 曜日
      var dayArray = [
        { value: "-", label: "選択なし", selected: true },
        { value: "1", label: "月曜日" },
        { value: "2", label: "火曜日" },
        { value: "3", label: "水曜日" },
        { value: "4", label: "木曜日" },
        { value: "5", label: "金曜日" },
        { value: "6", label: "土曜日" },
        { value: "7", label: "日曜日" },
        { value: "9", label: "特定日" },
      ];

      var selectDay = new Select({
        id: "TeijshukaKensaku_daySelect",
        options: dayArray,
        disabled: true,
        onChange: function (state) {
          common.teijishuka_yobi = state;
          self._courseListUpdate(self);
          self._filter(self, true);
        },
      });
      selectDay.placeAt(self.searchNode_TeijshukaKensaku_day).startup();

      var timeFromArray = [
        { value: "-", label: "選択なし", selected: true },
        { value: "1200", label: "12:00" },
        { value: "1230", label: "12:30" },
        { value: "1300", label: "13:00" },
        { value: "1330", label: "13:30" },
        { value: "1400", label: "14:00" },
        { value: "1430", label: "14:30" },
        { value: "1500", label: "15:00" },
        { value: "1530", label: "15:30" },
        { value: "1600", label: "16:00" },
        { value: "1630", label: "16:30" },
        { value: "1700", label: "17:00" },
        { value: "1730", label: "17:30" },
        { value: "1800", label: "18:00" },
        { value: "1830", label: "18:30" },
        { value: "1900", label: "19:00" },
      ];
      var timeFrom = new Select({
        id: "TeijshukaKensaku_timeFromSelect",
        options: timeFromArray,
        disabled: true,
        onChange: function (state) {
          common.teijishuka_timeFrom = state;
          self._filter(self, true);
        },
      });
      timeFrom.placeAt(self.searchNode_TeijshukaKensaku_timeFrom).startup();

      var timeToArray = [
        { value: "-", label: "選択なし", selected: true },
        { value: "1200", label: "12:00" },
        { value: "1230", label: "12:30" },
        { value: "1300", label: "13:00" },
        { value: "1330", label: "13:30" },
        { value: "1400", label: "14:00" },
        { value: "1430", label: "14:30" },
        { value: "1500", label: "15:00" },
        { value: "1530", label: "15:30" },
        { value: "1600", label: "16:00" },
        { value: "1630", label: "16:30" },
        { value: "1700", label: "17:00" },
        { value: "1730", label: "17:30" },
        { value: "1800", label: "18:00" },
        { value: "1830", label: "18:30" },
        { value: "1900", label: "19:00" },
      ];
      var timeTo = new Select({
        id: "TeijshukaKensaku_timeToSelect",
        options: timeToArray,
        disabled: true,
        onChange: function (state) {
          common.teijishuka_timeEnd = state;
          self._filter(self, true);
        },
      });
      timeTo.placeAt(self.searchNode_TeijshukaKensaku_timeTo).startup();
    },

    _filter: function (self, disp) {
      var expr = "1 = 1 ";
      if (!disp) {
        self.filterManager.applyWidgetFilter(self.teishusaki_layer_id, self.id,expr);
        common._eventHandlerTeishu();
        return;
      }

      // select 事業所
      // if (self.jigyosho[0] != "-") {...} expr = ...

      // select pattern expr = ...
      
      // 定時集荷・電話集荷
      var teiji = common._getDomVal("TeijshukaKensaku_teiji", "value");
      if (teiji) {
        expr += " AND REF = '1'";
      }
      var tel = common._getDomVal("TeijshukaKensaku_tel", "value");
      if (tel) {
        expr += " AND INP = '5'";
      }
      // if teiji == "1" yobi =...
      // expr += "...flg = '1'" and
      var yobi = common._getDomVal("TeijshukaKensaku_daySelect", "value");
      if (yobi != "-") {
        expr += " AND AD2 = '" + yobi + "'";
      }
      var timeFrom = common._getDomVal("TeijshukaKensaku_timeFromSelect", "value");
      if (timeFrom != '-') {
        timeFrom = timeFrom.slice(0, 2) + " " + timeFrom.slice(2);
        expr += " AND OPT <= '" + timeFrom + "'";
      }
      var timeEnd = common._getDomVal("TeijshukaKensaku_timeToSelect", "value");
      if (timeEnd != '-') {
        timeEnd = timeEnd.slice(0, 2) + " " + timeEnd.slice(2);
        expr += " AND CLT >= '" + timeEnd + "'";
      }
      
      self.filterManager.applyWidgetFilter(self.teishusaki_layer_id, self.id, expr);
      common._eventHandlerTeishu();
    },

    _patternListUpdate: function (self) {
      var query = new Query();
      query.returnGeometry = false;
      query.returnDistinctValues = true;
      query.outFields = ["AAC", "FID_1","AD2", "NA3", "OPT", "CLT", "REF"];
      // query.orderByFields = ["AAC"];

      var fromFID = Number(common.area_shiten_cd) * 2;
      var toFID = fromFID + 3;
      query.where = "FID BETWEEN " + fromFID + " AND " + toFID + "";

      var weekList = new Array(empty);
      opLayer_TeijshukaKensaku.queryFeatures(query).then(function (response) {
        weekList = weekList.concat(
          response.features.map(function (item) {
            return {
              label: item.attributes.NA3,
              id: item.attributes.AAC.trim() + "_" + item.attributes.FID_1,
            };
          })
        );
        var objectStore = new ObjectStore({objectStore: new Memory({ data: weekList }) });
        dijit.byId("TeijshukaKensaku_patternSelect").set("store", objectStore);
      }, 
      function(e) {
        console.log(e);
      });
    },

    _courseListUpdate: function (self) {
      var pattern = common._getDomVal("TeijshukaKensaku_patternSelect", "value");
      if (pattern != "-") {
        common._setDomVal("TeijshukaKensaku_courseSelect", "disabled", false);
        // get pattern yobi
        var query = new Query();
        query.returnGeometry = false;
        query.returnDistinctValues = true;
        query.outFields = ["FID_1", "AAC", "COA", "DSA"];
        // query.orderByFields = [];

        var expr = "";
        var patternArr = pattern.split('_');
        expr += "AAC ='" + patternArr[0] + "'";
        query.where = expr;

        dojo.empty("TeijshukaKensaku_courseSelect");
        opLayer_TeijshukaKensaku.queryFeatures(query).then(function (response) {
          response.features.map(function (item) {
            var opt = win.doc.createElement("option");
            opt.innerHTML = item.attributes.AAC.trim() + " " + (item.attributes.DSA.trim() != '' ? item.attributes.DSA : "不明");
            opt.value = item.attributes.FID_1;
            dom.byId("TeijshukaKensaku_courseSelect").appendChild(opt);
          });
        });
      } else {
        common._setDomVal("TeijshukaKensaku_courseSelect", "value", []);
        common._setDomVal("TeijshukaKensaku_courseSelect", "disabled", true);
      }
    },

    _jigyoshoFilterEvent: function (self) {
      if (common.area_shiten_cd != "-") {
        common._setDomVal("TeijshukaKensaku_patternSelect", "disabled", false);
        dojo.empty("TeijshukaKensaku_courseSelect");
        
        common._setDomVal("TeijshukaKensaku_patternSelect",  "disabled", false);
        common._setDomVal("TeijshukaKensaku_courseSelect",   "disabled", true);
        common._setDomVal("TeijshukaKensaku_daySelect",      "disabled", false);
        common._setDomVal("TeijshukaKensaku_timeFromSelect", "disabled", false);
        common._setDomVal("TeijshukaKensaku_timeToSelect",   "disabled", false);
        common._setDomVal("TeijshukaKensaku_teiji",          "disabled", false);
        common._setDomVal("TeijshukaKensaku_tel",            "disabled", false);
        self._patternListUpdate(self);
        
      } else {
        common._setDomVal("TeijshukaKensaku_patternSelect", "value", "-");
        common._setDomVal("TeijshukaKensaku_courseSelect", "value", []);
        dojo.empty("TeijshukaKensaku_courseSelect");
        common._setDomVal("TeijshukaKensaku_daySelect",      "value", "-");
        common._setDomVal("TeijshukaKensaku_timeFromSelect", "value", "-");
        common._setDomVal("TeijshukaKensaku_timeToSelect",   "value", "-");
        common._setDomVal("TeijshukaKensaku_teiji",          "checked", true);
        common._setDomVal("TeijshukaKensaku_tel",            "checked", false);

        common._setDomVal("TeijshukaKensaku_patternSelect",  "disabled", true);
        common._setDomVal("TeijshukaKensaku_courseSelect",   "disabled", true);
        common._setDomVal("TeijshukaKensaku_daySelect",      "disabled", true);
        common._setDomVal("TeijshukaKensaku_timeFromSelect", "disabled", true);
        common._setDomVal("TeijshukaKensaku_timeToSelect",   "disabled", true);
        common._setDomVal("TeijshukaKensaku_teiji",          "disabled", true);
        common._setDomVal("TeijshukaKensaku_tel",            "disabled", true);
      }

      if (self.jigyosho[2] != common.area_shiten_cd || self.jigyosho[3] != common.area_center_cd) {
        self.jigyosho[0] = common.area_shisha_cd;
        self.jigyosho[1] = common.area_shukan_cd;
        self.jigyosho[2] = common.area_shiten_cd;
        self.jigyosho[3] = common.area_center_cd;

        self._filter(self, common.area_shiten_cd != "-");
      }
    },

    showTeijshukaKensaku: function (event) {
      event.preventDefault();
      event.stopPropagation();
      popup.open({
        popup: this.settingsDialog,
        around: this.TeijshukaKensaku,
      });
    },

    closeTeijshukaKensaku: function (event) {
      event.preventDefault();
      event.stopPropagation();
      popup.close(this.settingsDialog);
    },
  });
});
