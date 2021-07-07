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
        disabled: false, // true
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
        disabled: false, // true
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
              case "japan_all_stations":
                self.course_layer_id = layer.id;
                self._filter(self, [], false);
                break;
              }
            }
          }
        }));
        
      this.opLayers = this.map.itemInfo.itemData.tables;
      array.some(this.opLayers, lang.hitch(this, function(layer) {
        var title_array = layer.title.split(" ");
        // if(title_array.lenght != 3){
        //   return;
        // }
        if(layer.selfType === "table") {
          if(title_array[0] === "???") {
            self.opLayer_Shuhaikuiki = new FeatureLayer(layer.layerObject.url);
          }
        }
      }));
    },

    _patternListUpdate: function(self) {
      var query = new Query();
      query.returnGeometry = false;
      query.returnDistinctValues = true;
      // query.outFields = [];
      // query.orderByFields = [];
      query.where = " 1 = 1";

      var weekList = new Array(empty);
      self.opLayer_Shuhaikuiki.queryFeatures(query).then(function (response) {
        weekList = weekList.concat(response.features.map(function(item){
          return {
            label: "item.attributes.center_ten_cd.trim()" + " " + "item.attributes.pattern_nm",
            id: "item.attributes.center_ten_cd.trim()" + " " + "item.attributes.pattern_cd",
          }
        }));
        var objectStore = new ObjectStore({ objectStore: new Memory({ data: weekList })});
        dijit.byId("ShuhaiKuikiCouse_patternSelect").set("store". objectStore);
      });
    },

    _courseListUpdate: function(self, state) {
      var query = new Query();
      query.returnGeometry = false;
      query.returnDistinctValues = true;
      // query.outFields = [];
      // query.orderByFields = [];
      var patternArr = state.split('_');
      query.where = " 1 = 1";

      dojo.empty("ShuhaiKuikiCouse_courseSelect");
      self.opLayer_Shuhaikuiki.queryFeatures(query).then(function (response) {
        response.features.map(function(item){
          var opt = win.doc.createElement('option');
          opt.innerHTML = "item.attributes.center_ten_cd.trim()" + " " + "item.attributes.pattern_nm";
          opt.value = "item.attributes.center_ten_cd.trim()" + "_" + "item.attributes.pattern_cd" + "_" + "item.attributes.course_cd";
          dom.byId("ShuhaiKuikiCouse_courseSelect").appendChild(opt);
        });
      
      });
    },

    _filter: function(self, state, disp) {
      var expr = "";
      if(disp){
        var q = "";
        if(state.length == 1){
          q = " 1=1";
        } else {
          q = " 1=1";
        }
        
        var query = new Query();
        query.returnGeometry = false;
        // query.outFields = [];
        query.where = q;

        self.opLayer_Shuhaikuiki.queryFeatures(query).then(
          function(response) {
            var shuhaikuiki = "";
            response.features.forEach(function(item) {
              shuhaikuiki += "'" + "item.attributes.shuhai_kuiki_id" + "',";
            });
            expr += "";

            self.filterManager.applyWidgetFilter(self.course_layer_id, self.id, expr);

            var layerStructure = LayerStructure.getInstance();
            var layer = layerStructure.getNodeById(self.course_layer_id);
            layer.getExtent().then(lang.hitch(layer, function(extent){
              layer.zoomTo(extent);
            }));

          });
      } else {
        expr = "1=2";
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
