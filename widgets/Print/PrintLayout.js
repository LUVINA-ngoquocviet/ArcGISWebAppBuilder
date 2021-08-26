define([
    'dijit/_WidgetBase',
    'dijit/_TemplatedMixin',
    'dijit/_WidgetsInTemplateMixin',
    'dojo/_base/lang',
    'dojo/dom-style',
    'dojo/dom-construct',
    'dojo/query',
    'dojo/on',
    'dojo/dom',
    'widgets/common',
    './Print'
], function (
    _WidgetBase,
    _TemplatedMixin,
    _WidgetsInTemplateMixin,
    lang,
    domStyle,
    domConstruct,
    query,
    on,
    dom,
    common,
    Print
) {
    var clazz = {};

    clazz._createGridLayout = function (map) {
        console.log("Tạo giao diện");
        domConstruct.destroy("wrapper-grid");

        var gridLayouts = domConstruct.toDom(
            `<div id="wrapper-grid" class="wrapper-grid">
                <div class="item-grid" id="item-grid-1">1</div>
                <div class="item-grid" id="item-grid-2">2</div>
                <div class="item-grid" id="item-grid-3">3</div>
                <div class="item-grid" id="item-grid-4">4</div>
                <div class="item-grid" id="item-grid-5">5</div>
                <div class="item-grid" id="item-grid-6">6</div>
                <div class="item-grid" id="item-grid-7">7</div>
                <div class="item-grid" id="item-grid-8">8</div>
                <div class="item-grid" id="item-grid-9">9</div>
                <div class="item-grid" id="item-grid-10">10</div>
                <div class="item-grid" id="item-grid-11">11</div>
                <div class="item-grid" id="item-grid-12">12</div>
                <div class="item-grid" id="item-grid-13">13</div>
                <div class="item-grid" id="item-grid-14">14</div>
                <div class="item-grid" id="item-grid-15">15</div>
              </div>`);
        domConstruct.place(gridLayouts, "map_layers", "after");

        this._visibilityWidgetsOnMap("none");

        on(dom.byId("item-grid-1"), 'click', lang.hitch(this, function (event) {
            this._onClickDiv(0, map);
            domStyle.set("wrapper-grid", {
                display: "none"
            });
            this._visibilityWidgetsOnMap("block");
        }));

        // this.own(on(dom.byId("item-grid-1"), 'click', lang.hitch(this, function (event) {
        //     this._onClickDiv(0, map);
        //     domStyle.set("wrapper-grid", {
        //         display: "none"
        //     });
        //     this._visibilityWidgetsOnMap("block");
        // })));
        // this.own(on(dom.byId("item-grid-2"), 'click', lang.hitch(this, function (event) {
        //     this._onClickDiv(1);
        // })));
        // this.own(on(dom.byId("item-grid-3"), 'click', lang.hitch(this, function (event) {
        //     this._onClickDiv(2);
        // })));
        // this.own(on(dom.byId("item-grid-4"), 'click', lang.hitch(this, function (event) {
        //     this._onClickDiv(3);
        // })));
        // this.own(on(dom.byId("item-grid-5"), 'click', lang.hitch(this, function (event) {
        //     this._onClickDiv(4);
        // })));
        // this.own(on(dom.byId("item-grid-6"), 'click', lang.hitch(this, function (event) {
        //     this._onClickDiv(5);
        // })));
        // this.own(on(dom.byId("item-grid-7"), 'click', lang.hitch(this, function (event) {
        //     this._onClickDiv(6);
        // })));
        // this.own(on(dom.byId("item-grid-8"), 'click', lang.hitch(this, function (event) {
        //     this._onClickDiv(7);
        // })));
        // this.own(on(dom.byId("item-grid-9"), 'click', lang.hitch(this, function (event) {
        //     this._onClickDiv(8);
        // })));
        // this.own(on(dom.byId("item-grid-10"), 'click', lang.hitch(this, function (event) {
        //     this._onClickDiv(9);
        // })));
        // this.own(on(dom.byId("item-grid-11"), 'click', lang.hitch(this, function (event) {
        //     this._onClickDiv(10);
        // })));
        // this.own(on(dom.byId("item-grid-12"), 'click', lang.hitch(this, function (event) {
        //     this._onClickDiv(11);
        // })));
        // this.own(on(dom.byId("item-grid-13"), 'click', lang.hitch(this, function (event) {
        //     this._onClickDiv(12);
        // })));
        // this.own(on(dom.byId("item-grid-14"), 'click', lang.hitch(this, function (event) {
        //     this._onClickDiv(13);
        // })));
        // this.own(on(dom.byId("item-grid-15"), 'click', lang.hitch(this, function (event) {
        //     this._onClickDiv(14);
        // })));
    };

    clazz._visibilityWidgetsOnMap = function (displayVal) {
        query("#map").children().forEach(function (node) {
            if (node.id !== "map_root") {
                domStyle.set(node.id, "display", displayVal);
            }
        });
    };

    clazz._onClickDiv = function (index, map) {
        var currentExtent = map.geographicExtent;
        var listCoordinates = common._getListCoordinates(currentExtent.xmin, currentExtent.ymin, currentExtent.xmax, currentExtent.ymax);

        var extentGeo = new esri.geometry.Extent();

        extentGeo.xmin = listCoordinates[index].xmin;
        extentGeo.ymin = listCoordinates[index].ymin;
        extentGeo.xmax = listCoordinates[index].xmax;
        extentGeo.ymax = listCoordinates[index].ymax;

        map.setExtent(extentGeo, true);
    };
    return clazz;

});