var opLayer_Prefectures = new Object();
define([
  "dojo/_base/declare",
  "dojo/_base/lang",
  "dojo/_base/array",
  "dojo/_base/html",
  "jimu/BaseWidget",
  "dijit/form/Select",
  "jimu/FilterManager",
  "jimu/LayerStructure",
  "esri/layers/FeatureLayer",
  "esri/tasks/query",
  "dojo/store/Memory",
  "dojo/data/ObjectStore",
  "dojo/on",
  "widgets/common",
  "dojo/json"
], function (
  declare,
  lang,
  array,
  html,
  BaseWidget,
  Select,
  FilterManager,
  LayerStructure,
  FeatureLayer,
  Query,
  Memory,
  ObjectStore,
  on,
  common,
  json
) {
  //To create a widget, you need to derive from BaseWidget.
  return declare([BaseWidget], {
    name: "FilterMultipleSelectBox",
    baseClass: "jimu-widget-search-selectbox",

    prefecture_layer_id: "",
    init_select: true,

    postCreate: function () {
      html.setAttr(this.domNode, "aria-label", this.nls._widgetLabel);

      if (this.closeable || !this.isOnScreen) {
        html.addClass(this.searchNode, "default-width-for-openAtStart");
      }
      this.listenWidgetIds.push("framework");

      this.filterManager = FilterManager.getInstance();
    },

    startup: function () {
      this.inherited(arguments);

      if (!(this.config && this.config.sources)) {
        this.config.sources = [];
      }

      var self = this;

      // Initialization
      // common._initKengen();
      common._eventHandlerJighosho();


      //Get all layers
      this.opLayers = this.map.itemInfo.itemData.operationalLayers;

      //Filter layer
      array.some(
        this.opLayers,
        lang.hitch(this, function (layer) {
          if (layer.layerType === "ArcGISFeatureLayer") {
            var title_array = layer.title.split(" ");
            var layerName = title_array[0];
            switch (layerName) {
              case "japan_Prefectures":
                self.prefecture_layer_id = layer.id;
                opLayer_Prefectures = new FeatureLayer(layer.layerObject.url);
                self._createSelectBox(self, opLayer_Prefectures);
                break;
              default:
                break;
            }
          }
        })
      );
    },

    //Create Select Box with layer
    _createSelectBox: function (self, layerFeature) {
      var query = new Query();
      query.returnGeometry = false;
      query.outFields = ["*"];
      query.where = "1 = 1";

      //Get data from layer
      var dataArr = [];
      dataArr.push({ label: empty.label, value: empty.id, selected: true })

      layerFeature.queryFeatures(query).then(
        function (response) {
          response.features.forEach(function (feature) {
            var itemArr = { label: feature.attributes["PRN"], value: feature.attributes["FID"] };
            dataArr.push(itemArr)
          }
          );
        },
        function (e) {
          console.log(e);
        }
      );

      //store holding data filter
      var filterStore = new Memory({ data: dataArr, idProperty: "value" });

      //Create Select Box
      new Select({
        id: "prefecture",
        options: filterStore.data,
        style: "width: 200px;",
        sortByLabel: false,
        onChange: function (state) {
          common.area_shiten_cd = state;
          self._filter_kaisou(self, state);
          common._eventHandlerJighosho();
        },
      })
        .placeAt(self.searchNodePrefecture)
        .startup();
    },

    //zoom to map with related data
    _filter_kaisou: function (self, state) {
      var expr = "";
      expr += "FID ='" + state + "'";

      self.filterManager.applyWidgetFilter(
        self.prefecture_layer_id,
        self.id,
        expr
      );

      var layerStructure = LayerStructure.getInstance();
      var layer = layerStructure.getNodeById(self.prefecture_layer_id);

      var obj = layer.getExtent().then(
        lang.hitch(layer, function (extend) {
          console.log("extend");
          console.log(extend);
          layer.zoomTo(extend);
        })
      );
      return obj;
    },
  });
});
