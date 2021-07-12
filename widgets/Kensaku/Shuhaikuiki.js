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
  "jimu/FilterManager",
  "jimu/LayerStructure",
  "esri/layers/FeatureLayer",
  "esri/tasks/query",
  "widgets/common",
  "dojo/text!./templates/Shuhaikuiki.html"
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
  FilterManager,
  LayerStructure,
  FeatureLayer,
  Query,
  common,
  template
) {
  //To create a widget, you need to derive from BaseWidget.
  return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
    widgetsInTemplate: true,
    templateString: template,
    map: null,

    jigyosho: ["-", "-", "-", "-"],
    course_layer_id: "",
    opLayer_Shuhaikuiki: "",

    postCreate: function () {
      this.inherited(arguments);

      this.filterManager = FilterManager.getInstance();
      this.layerStructure = LayerStructure.getInstance();
    },

    startup: function () {
      this.inherited(arguments);

      var self = this;
      
      // SELECTsakusei --- bata-n ---
      var patternArray = [
        {value: "-", label: "選択なし", selected: true}
      ];

      var selectPattern = new Select({
        id: "ShuhaiKuikiCouse_patternSelect",
        options: patternArray,
        sortByLabel: false,
        disabled: true,
        onChange: function(state){
          if(state != "-"){
            common._setDomVal("ShuhaiKuikiCouse_courseSelect", "disabled", false);
            self._courseListUpdate(self, state);
          } else {
            common._setDomVal("ShuhaiKuikiCouse_courseSelect", "value", []);
            common._setDomVal("ShuhaiKuikiCouse_courseSelect", "disabled", true);
          }
        },
      });
      selectPattern.placeAt(self.searchNode_ShuhaiKuikiCouse_pattern).startup();

      var selectPattern = new MultiSelect({
        id: "ShuhaiKuikiCouse_courseSelect",
        options: patternArray,
        sortByLabel: false,
        disabled: true,
        onChange: function(state){
          self._filter(self, state, true);
        },
      });
      selectPattern.placeAt(self.searchNode_ShuhaiKuikiCouse_course).startup();

      var jigyosho = document.getElementById("ShuhaiKuikiCouse_jigyosho");
      jigyosho.onchange = function (evt) {
        self._jigyoshoFilterEvent(self);
      };

      this.opLayers = this.map.itemInfo.itemData.operationalLayers;
      array.some(this.opLayers, lang.hitch(this, function(layer) {
        if (layer.layerType === "ArcGISFeatureLayer") {
          var title_array = layer.title.split(" ");
          // if(title_array.lenght != 3){
          //   return;
          // }
          if(layer.layerType === "ArcGISFeatureLayer") {
            switch (title_array[0]){
              case "japan_railways":
                self.layerStructure.getNodeById(layer.id).show();
                self.course_layer_id = layer.id;
                self._filter(self, [], false);
                break;
              }
            }
          }
        }));
        
      // this.opLayers = this.map.itemInfo.itemData.tables;
      array.some(this.opLayers, lang.hitch(this, function(layer) {
        var title_array = layer.title.split(" ");
        // if(title_array.lenght != 3){
        //   return;
        // }
        if (layer.layerType === "ArcGISFeatureLayer") {
          if(title_array[0] == "japan_sea_ports") {
            self.opLayer_Shuhaikuiki = new FeatureLayer(layer.layerObject.url);
          }
        }
      }));
    },

    _patternListUpdate: function(self) {
      var query = new Query();
      query.returnGeometry = false;
      query.returnDistinctValues = true;
      query.outFields = ["AAC", "HBC", "NA4", "AD7", "ESD", "EOF"];
      // query.orderByFields = ["AAC"];
      var fromFID = Number(common.area_shiten_cd) * 22;
      var toFID = fromFID + 3;
      query.where = "(FID BETWEEN " + fromFID + " AND " + toFID + ") AND CH1 = '2'";

      var weekList = new Array(empty);
      self.opLayer_Shuhaikuiki.queryFeatures(query).then(function (response) {
        weekList = weekList.concat(response.features.map(function(item){
          return {
            label: item.attributes.AAC.trim() + " " + item.attributes.NA4,
            id: item.attributes.AAC.trim() + "_" + item.attributes.HBC,
          }
        }));
        var objectStore = new ObjectStore({ objectStore: new Memory({ data: weekList })});
        dijit.byId("ShuhaiKuikiCouse_patternSelect").set("store", objectStore);
      });
    },

    _courseListUpdate: function(self, state) {
      var pattern = common._getDomVal("ShuhaiKuikiCouse_patternSelect", "value");
      if (pattern != "-") {
        var query = new Query();
        query.returnGeometry = false;
        query.returnDistinctValues = true;
        query.outFields = ["AAC", "HBC", "AD7"];
        // query.orderByFields = [];

        var expr = "";
        var patternArr = pattern.split('_');
        expr += "AAC ='" + patternArr[0] + "'";
        query.where = expr;

        dojo.empty("ShuhaiKuikiCouse_courseSelect");
        self.opLayer_Shuhaikuiki.queryFeatures(query).then(function (response) {
          response.features.map(function (item) {
            var opt = win.doc.createElement('option');
            opt.innerHTML = item.attributes.HBC.trim() + " " + (item.attributes.AD7.trim() != '' ? item.attributes.AD7 : "無名");
            opt.value = item.attributes.HBC;
            dom.byId("ShuhaiKuikiCouse_courseSelect").appendChild(opt);
          });

        });
      } else {
        common._setDomVal("ShuhaiKuikiCouse_courseSelect", "value", []);
        common._setDomVal("ShuhaiKuikiCouse_courseSelect", "disabled", true);
      }
    },

    _filter: function(self, state, disp) {
      var expr = "";
      if(disp){
        var q = "";
        if(state.length >= 1){
          q = "HBC IN (";
          state.forEach(function(s){
            q += "'" + s + "',";
          });
          q = q.replace(/.$/,")");
        } else {
          q = '1=2';
        }
        
        var query = new Query();
        query.returnGeometry = false;
        query.outFields = ["HBC"];
        query.where = q;

        self.opLayer_Shuhaikuiki.queryFeatures(query).then(
          function(response) {
            var shuhaikuiki = 0;
            response.features.forEach(function(item) {
              shuhaikuiki += Number(item.attributes.HBC);
            });
            expr = shuhaikuiki != 0 ? "Join_ID = " + (shuhaikuiki % 599) : "";

            self.filterManager.applyWidgetFilter(self.course_layer_id, self.id, expr);

            var layerStructure = LayerStructure.getInstance();
            var layer = layerStructure.getNodeById(self.course_layer_id);
            layer.getExtent().then(lang.hitch(layer, function(extent){
              layer.zoomTo(extent);
            }));

          });
      } else {
        expr = "";
        self.filterManager.applyWidgetFilter(self.course_layer_id, self.id, expr);
      }
    },

    _jigyoshoFilterEvent: function(self) {
      if (common.area_shiten_cd != "-") {
        common._setDomVal("ShuhaiKuikiCouse_patternSelect", "disabled", false);
        self._patternListUpdate(self);

        common._setDomVal("ShuhaiKuikiCouse_courseSelect", "value", []);
        dojo.empty("ShuhaiKuikiCouse_courseSelect");
        common._setDomVal("ShuhaiKuikiCouse_courseSelect", "disabled", true);
      } else {
        common._setDomVal("ShuhaiKuikiCouse_patternSelect", "value", "-");
        common._setDomVal("ShuhaiKuikiCouse_courseSelect", "value", []);
        dojo.empty("ShuhaiKuikiCouse_courseSelect");
        common._setDomVal("ShuhaiKuikiCouse_patternSelect", "disabled", true);
        common._setDomVal("ShuhaiKuikiCouse_courseSelect", "disabled", true);
        self._filter(self, [], false);
      }
    },

    showShuhaiKuikiCouse: function(event) {
      event.preventDefault();
      event.stopPropagation();
      popup.open({
        popup: this.settingsDialog,
        around: this.ShuhaiKuikiCouse,
      });
    },

    closeShuhaiKuikiCouse: function(event) {
      event.preventDefault();
      event.stopPropagation();
      popup.close(this.settingsDialog);
    }

  });
});
