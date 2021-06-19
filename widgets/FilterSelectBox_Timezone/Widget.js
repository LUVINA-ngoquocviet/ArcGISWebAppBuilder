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
  common
) {
  //To create a widget, you need to derive from BaseWidget.
  return declare([BaseWidget], {
    name: "FilterSelectBox_Timezone",
    baseClass: "jimu-widget-search-selectbox",

    municipal_layer_id: "",
    // attack_layer_id: "",
    // shuhaikuiki_suryo_id: "",

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

      // Create select box
      self._createSelect(self);

      var jigyosho = document.getElementById("NimotsuShousai_jigyosho");
      jigyosho.onchange = function (evt) {
        self._jigyoshoFilterEvent(self);
      };

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
                self.municipal_layer_id = layer.id;

                self._filter(self);
                // common._eventHandlerNimotsu();

                break;
              case "shuuhaikuiki(suuryou)":
              // self.shuhaikuiki_suryou_id = layer.id;
              default:
                break;
            }
          }
        })
      );
    },

    _createSelect: function (self) {
      var timezoneArray = [
        { value: 1, label: "1", selected: true },
        { value: 2, label: "22" },
        { value: 3, label: "333" },
      ];
      new Select({
        id: "NimotsuShousai_timezoneSelect",
        options: timezoneArray,
        disabled: true,
        onChange: function (state) {
          common.area_time_select = state;
          self._filter(self);
          common._evendHandlerNimotsu();
        },
      })
        .placeAt(self.searchNode_timezone)
        .startup();
      //....
    },

    _jigyoshoFilterEvent: function (self) {
      var shitenTimeLabel = document.getElementById("shitenTimeLabel");
      //...
      self._filter(self);
      common._evendHandlerNimotsu();
    },

    _filter: function (self) {
      var expr = "";
      var exprShuhaikuikiSuryo = "";

      //...
      self.filterManager.applyWidgetFilter(self.attack_layer_id, self.id, expr);
      self.filterManager.applyWidgetFilter(
        self.shuhaikuiki_suryo_id,
        self.id,
        exprShuhaikuikiSuryo
      );

      var target = dijit.byId("jimu_dijit_DrawBox_0");
      if (target != null) {
        target.clear();
        target.emit("user-clear");
      }
    },
  });
});
