var opLayer_KaisouBetsu = new Object();
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
  // "esri/tasks/FeatureSet",
  // 'jimu/utils',
  "esri/tasks/Query",
  "dojo/store/Memory",
  "dojo/data/ObjectStore",
  "dojo/on",
  "widgets/common",
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
  common
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
      // this.layerStructure = LayerStructure.getInstance();
    },

    startup: function () {
      this.inherited(arguments);

      if (!(this.config && this.config.sources)) {
        this.config.sources = [];
      }

      var self = this;

      // Initialization
      common._initKengen();
      // common._eventHandlerPrefecture();

      // Create select box
      self._createSelect(self);

      this.opLayers = this.map.itemInfo.itemData.operationalLayers;

      array.some(
        this.opLayers,
        lang.hitch(this, function (layer) {
          if (layer.layerType === "ArcGISFeatureLayer") {
            var title_array = layer.title.split(" ");
            if (title_array.length != 3) {
              return;
            }
            var layerName = title_array[2];
            switch (layerName) {
              case "japan_Prefectures":
                self.prefecture_layer_id = layer.id;
                opLayer_KaisouBetsu = new FeatureLayer(layer.layerObject.url);

                self._filter_kaisou(self, common.area_shiten_cd);

                self._initJigyoshoSelect(self);
                break;
              default:
                break;
            }
          }
        })
      );
    },

    _initJigyoshoSelect: function (self) {
      var o10 = self._createListData(
        self,
        "10",
        "",
        "shisha",
        common.area_shisha_cd
      );
      self._sleep(1, self._initJigyoshoSelect10Fin(self, o10));
    },


    _initJigyoshoSelect10Fin: function (self, o10) {
      if (!o10.isFulfilled()) {
        self._sleep(1, function () {
          self._initJigyoshoSelect10Fin(self, o10);
        });
      } else {
        if (common.kengen_lv != "00") {
          common._setDomVal("shisha", "disabled", true);
          var o20 = self._createListData(
            self,
            "20",
            common.area_shisha_cd,
            "shukan",
            common.area_shukan_center_id
          );
          self._initJigyoshoSelect20Fin(self, o20);
        } else {
          common._setDomVal("shukan", "disabled", true);
          common._setDomVal("shiten", "disabled", true);
          common._setDomVal("center", "disabled", true);
          self._sleep(1, function () {
            self.init_select = false;
            self._loadingAnim(self);
          });
        }
      }
    },

    /*30Fin, 40Fin...
     */

    _loadingAnim: function (self) {
      if (common.isAppConfigLoaded) {
        html.addClass(jimuConfig.loadingId, "loading-fadeOut");
        this.own(
          on(
            document.getElementById(jimuConfig.loadingId),
            "animationend",
            lang.hitch(this, function () {
              html.setStyle(jimuConfig.loadingId, "display", "none");
            })
          )
        );
      } else {
        console.log("common.isAppConfigLoaded :" + common.isAppConfigLoaded);
        console.log("obj.isFulfilled :" + obj.isFulfilled());
        self._sleep(5, self._loadingAnim(self));
      }
    },

    _sleep: function (waitSec, callbackFunc) {
      var spanedSec = 0;
      var id = setInterval(function () {
        spanedSec++;
        if (spanedSec >= waitSec) {
          clearInterval(id);
          if (callbackFunc) callbackFunc();
        }
      }, 100);
    },

    _createListData: function (self, kbn, jigyosho_cd, objId, value) {
      var expr = "";

      if (kbn == "10") {
        expr = "kaisou_kbn = '10' and del_flg = '0'";
      } else if (kbn == "20") {
        expr =
          "kaisou_kbn = '10' and shisha_cd = " +
          jigyosho_cd +
          "' and del_flg = '0'";
      } //.... 30,40

      var query = new Query();
      query.returnGeometry = false;
      query.returnDistinctValues = true;
      query.outFields = ["PRN"];
      query.orderByFields = ["PRN"];
      // query.where = expr;

      var list = new Array(empty);
      var obj = opLayer_KaisouBetsu
        .queryFeatures(query)
        .then(function (response) {
          list = list.concat(
            response.features.map(function (item) {
              return {
                label: item.attributes.PRN.trim(),
                id: item.attributes.PRN.trim(),
              };
            })
          );
          var objectStore = new ObjectStore({
            objectStore: new Memory({ data: list }),
          });
          dijit.byId(objId).set("store", objectStore);
          dijit.byId(objId).set("value", value);
        });
      return obj;
    },

    _filter_kaisou: function (self, state) {
      var expr = "";
      expr += "jigyosho_cd ='" + state + "' and ";
      expr += "del_flg = '0'";
      self.filterManager.applyWidgetFilter(
        self.prefecture_layer_id,
        self.id,
        expr
      );

      var layerStructure = LayerStructure.getInstance();
      var layer = layerStructure.getNodeById(self.prefecture_layer_id);
      var obj = layer.getExtent().then(
        lang.hitch(layer, function (extend) {
          layer.zoomTo(extend);
        })
      );
      return obj;
    },

    _filter_kuiki: function(self){
      var expr = "";
      if (common.area_center_cd != "-") {
        expr += "center_ten_cd = '" + common.area_center_cd + "' and ";
      }//....shiten_cd, shukan_cd, shisha_cd
      expr += "del_flg = '0'";

      // self.filterManager.applyWidgetFilter(self.syuhai_kuiki_layer_id, self.id, expr);
    },


    _createSelect: function (self) {
      new Select({
        id: "prefecture",
        store: new ObjectStore({
          objectStore: new Memory({ data: new Array(empty) }),
        }),
        sortByLabel: false,
        onChange: function (state) {
          console.log("call shiten onchange :" + state);
          if (!self.init_select) {
            console.log("shiten onchange :" + state);
            common.area_shiten_cd = state;
            common.area_center_cd = empty.id;

            if (state !== empty.id) {
              // shisha sentaku toki
              var objectStore = new ObjectStore({
                objectStore: new Memory({ data: new Array(empty) }),
              });
              common._setDomVal("center", "disabled", false);
              self._createListData(self, "40", state, "center", "-");

              self._filter_kaisou(self, state);
            } else {
              // sentaku nashi
              var objectStore = new ObjectStore({
                objectStore: new Memory({ data: new Array(empty) }),
              });
              dijit.byId("center").set("store", objectStore);
              common._setDomVal("center", "disabled", true);
            }
            self._filter_kuiki(self);
            common._eventHandlerPrefecture();
          }
        },
      })
        .placeAt(self.searchNodePrefecture)
        .startup();
    },
  });
});
