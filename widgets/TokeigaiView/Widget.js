define([
  "dojo/_base/declare",
  "dojo/_base/lang",
  "dojo/_base/array",
  "dojo/_base/html",
  "jimu/BaseWidget",
  "jimu/FilterManager",
  "jimu/LayerStructure",
  "esri/layers/FeatureLayer",
  "esri/tasks/query",
  "widgets/common",
], function (
  declare,
  lang,
  array,
  html,
  BaseWidget,
  FilterManager,
  LayerStructure,
  FeatureLayer,
  Query,
  common
) {
  //To create a widget, you need to derive from BaseWidget.
  return declare([BaseWidget], {
    name: "tokeigaiView",
    baseClass: "jimu-widget-search-selectbox",

    postCreate: function () {
      html.setAttr(this.domNode, "aria-label", this.nls._widgetLabel);

      if (this.closeable || !this.isOnScreen) {
        html.addClass(this.searchNode, "default-width-for-openAtStart");
      }
      this.listenWidgetIds.push("framework");

      this.filterManager = FilterManager.getInstance();
      this.layerStructure = LayerStructure.getInstance();
    },

    startup: function () {
      this.inherited(arguments);

      if (!(this.config && this.config.sources)) {
        this.config.sources = [];
      }

      var self = this;
      var opLayers = this.map.itemInfo.itemData.operationalLayers;
      var opLayer = null;

      // Search condition generation timing measures
      setTimeout(function () {
        var timezoneSelect = dijit.byId("timezoneSelect");
        var itemSelect = dijit.byId("itemSelect");

        if (timezoneSelect != null) {
          timezoneSelect.on("change", function (evt) {
            self._changeVal(self, opLayer);
          });
        }
        if (itemSelect != null) {
          itemSelect.on("change", function (evt) {
            self._changeVal(self, opLayer);
          });
        }
      
      var tokeigai_sum = document.getElementById("tokeigai_hidden");
      array.some(
        opLayers,
        lang.hitch(this, function (layer) {
          console.log(layer);
          if (layer.layerType === "ArcGISFeatureLayer") {
            var layerName = self._getTableName(layer);
            console.log(layerName);
            if (layerName = "japan_lake") {
              // if (true) {
              opLayer = new FeatureLayer(layer.layerObject.url);
              console.log(opLayer);

              self._changeVal(self, opLayer);
              tokeigai_sum.onchange = function(evt){
                self._changeVal(self, opLayer);
              };

              return;
            }
          }
        }));
    },100);
  },

    _changeVal: function (self, opLayer) {
      opLayer.queryFeatures(self._queryMethod(self)).then(
        function (response) {
          var sum = 0;
          response.features.forEach(function (feature) {
            for (var key in feature.attributes) {
              sum = Number(sum) + Number(feature.attributes[key]);
            }
          });
          sum = 999; // delete later
          self._setView(sum);
        },
        function (e) {
          console.log(e);
        }
      );
    },

    _setView: function (sum) {
      document.getElementById("tokeigai_sum").innerHTML =
        sum.toLocaleString() + "個";
    },

    _queryMethod: function (self) {
      var expr = "1 = 1";
      var itemField = "";
      var itemArray = [];
      itemArray.push(itemField);

      var query = new Query();

      query.where = expr;
      // query.outFields = itemArray;

      return query;
    
    },

    _getTableName: function(layer) {
      var title_array = layer.title.split(' ');
      if(title_array.length != 3){
        return title_array[0];
      }
      return title_array[2];
    },

    _getDomVal: function (id, key) {
      var dom = dijit.byId(id);
      if (dom) {
        return dom.get(key);
      }
      return "";
    },
  });
});
