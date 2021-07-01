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
        { value: 1, label: "1便（～12：59）", selected: true },
        { value: 2, label: "2便（13：00～17：59）" },
        { value: 3, label: "3便（18：00～）" },
      ];
      new Select({
        id: "NimotsuShousai_timezoneSelect",
        options: timezoneArray,
        disabled: false,
        onChange: function (state) {
          common.area_time_select = state;
          self._filter(self);
          common._eventHandlerNimotsu();
        },
      })
        .placeAt(self.searchNode_timezone)
        .startup();

      var itemTypeArray = [
        { value: "00", label: "全体", selected: true },
        { value: "06", label: "クール（冷蔵）" },
        { value: "07", label: "クール（冷凍）" },
        { value: "26", label: "ネコポス" },
        { value: "18", label: "アマゾン" },
        { value: "83", label: "ネコポス除外" },
        { value: "82", label: "アマゾン除外" },
        { value: "84", label: "ネコポス・アマゾン除外" },
      ];
      new Select({
        id: "NimotsuShousai_itemSelect",
        options: itemTypeArray,
        disabled: false,
        onChange: function (state) {
          common.area_item_select = state;
          self._filter(self);
          common._eventHandlerNimotsu();
        },
      })
        .placeAt(self.searchNode_itemtype)
        .startup();
    },

    _jigyoshoFilterEvent: function (self) {
      var shitenTimeLabel = document.getElementById("shitenTimeLabel");
      //...
      self._filter(self);
      common._eventHandlerNimotsu();
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