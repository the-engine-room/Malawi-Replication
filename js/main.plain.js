'use strict';

(function (U, $) {

    if (!Array.from) {
        Array.from = function (object) {
            return [].slice.call(object);
        };
    }

    /*
    ** Main IPPR object holding all the info about the dom and data
    */
    var IPPR = {
        dom: {
            header: $('.Header'),
            data: $('.Data'),
            lists: {
                main: '.List--main',
                extra: '.List--extra',
                info: '.List--info',
                count: '.List-count',
                header: '.List-header',
                holder: '.List-holder',
                title: '.List-title',
                list: '.collection',
                infoName: '.List-infoName',
                headerActive: '.List-headerActive',
                headerInActive: '.List-headerInactive',
                switch: '.List-switch'
            },
            content: $('.Content'),
            tabs: $('.Header-tabs a'),
            levels: $('div[data-level]'),
            dataHolder: $('.Data-holder'),
            filters: {
                main: '.Filters',
                mobile: '.Filters--mobile',
                item: '.Filters .chip',
                select: '.Filters-select',
                trigger: $('.Filters-trigger'),
                activeHolder: $('.Filters-active'),
                remove: $('Filters-remove'),
                search: $('.Search-field'),
                searchRemove: $('.Search-remove'),
                searchTrigger: $('.Search-trigger')
            },
            map: $('.Map'),
            mapTrigger: $('.Map-trigger'),
            mapInline: $('.Map--inline'),
            showInfo: '.js-showAdditionalInfo',
            sankey: {
                mobile: '.Sankey-mobile',
                desktop: '.Sankey-desktop'
            },
            additionalInfo: $('.AdditionalInfo'),
            additionalInfoTitle: $('.AdditionalInfo-title'),
            additionalInfoHeader: $('.AdditionalInfo-header'),
            footer: $('.Footer'),
            templates: {
                main: '.main-tpl',
                extra: '.extra-tpl',
                licenceTable: '.licenceTable-tpl',
                companyTable: '.companyTable-tpl',
                ownedLicenses: '.ownedLicenses-tpl',
                hierarchy: '.hierarchy-tpl',
                shareholders: '.shareholders-tpl',
                documents: '.documents-tpl'
            },
            additionalInfoStrings: {
                licence: 'Info for Licence number <span></span>',
                company: 'Additional information'
            },
            ownedLicenses: '.OwnedLicenses',
            hierarchy: '.Hierarchy',
            table: '.Table',
            shareholders: '.Shareholders',
            documents: '.Documents'
        },
        states: {
            loading: 'is-loading',
            active: 'is-active',
            animate: 'has-animation',
            hidden: 'u-isHidden',
            visible: 'is-visible',
            selected: 'is-selected',
            mobile: false,
            desktop: false,
            view: 'companies',
            highlight: 'companies',
            map: false,
            filters: false
        },
        data: {
            apiURL: 'https://migodiyathu.carto.com/api/v2/sql/?q=',
            data: {},
            tabs: {
                0: {
                    name: 'companies',
                    sql: "SELECT l.cartodb_id as l_cartodb_id, l.license_number AS license_number, l.area AS license_area_sqkm, l.date_granted AS license_date_granted, l.date_issued AS license_date_issued, l.date_expires AS license_date_expires, c.name AS company_name, c.address AS company_address, c.cartodb_id as company_id, c.hq AS company_hq, c.jurisdiction AS company_jurisdiction, c.registration AS company_registration, c.website AS company_website FROM mw_licenses l, mw_companies c WHERE l.company_id = c.cartodb_id  AND l.license_type_id != 5",
                    groupBy: 'company_id'
                },
                1: {
                    name: 'licenses',
                    sql: "SELECT l.cartodb_id as l_cartodb_id, l.license_number AS license_number, l.area AS license_area_sqkm, l.date_granted AS license_date_granted, l.date_issued AS license_date_issued, l.date_expires AS license_date_expires, c.name AS company_name, c.address AS company_address, c.cartodb_id as company_id, c.hq AS company_hq, c.jurisdiction AS company_jurisdiction, c.registration AS company_registration, c.website AS company_website, m.mineral_id AS mineral_id, t.name AS mineral_name  FROM mw_licenses l, mw_companies c, mw_license_minerals m, mw_minerals t WHERE l.company_id = c.cartodb_id AND l.license_type_id != 5 AND m.license_id = l.cartodb_id AND m.mineral_id = t.cartodb_id",
                    groupBy: 'license_number'
                },
                2: {
                    name: 'oil',
                    sql: 'SELECT l.area AS license_area, l.date_expires AS license_data_expires, l.date_granted AS license_granted, l.date_issued AS license_issued, l.district AS license_district, l.license_number AS license_number, l.status AS license_status, c.cartodb_id AS company_id, c.name AS company_name, c.address AS company_address, c.hq AS company_hq, c.jurisdiction AS company_jurisdiction, c.registration AS company_registration, c.website AS company_website FROM mw_licenses l, mw_license_companies lc, mw_companies c WHERE  l.cartodb_id = lc.license_id AND lc.company_id = c.cartodb_id AND l.license_type_id = 5',
                    groupBy: 'license_number'
                }
            }
        },

        map: {
            map: [],
            layers: [],
            markers: [],
            styles: {
                default: {
                    weight: 1,
                    fill: true,
                    fillColor: '#5E8FB1',
                    dashArray: '',
                    color: '#000',
                    fillOpacity: 1
                },
                active: {
                    weight: 2,
                    fill: true,
                    fillColor: '#256A9A',
                    dashArray: '',
                    color: '#000',
                    fillOpacity: 1
                },
                filtered: {
                    weight: 3,
                    fill: true,
                    fillColor: '#93B4CB',
                    dashArray: '',
                    color: 'transparent',
                    fillOpacity: 1
                },
                oil: {
                    weight: 1,
                    fill: true,
                    fillColor: '#349936',
                    dashArray: '',
                    color: '#000',
                    fillOpacity: 0.65
                },
                hidden: {
                    weight: 0,
                    fill: true,
                    fillColor: '#000',
                    dashArray: '',
                    color: '#000',
                    fillOpacity: 0.0
                }

            },
            highlightLayer: function highlightLayer(key, id) {

                $.each(IPPR.map.layers[key], function (k, value) {
                    if (!IPPR.states.filters) {
                        IPPR.map.layers[key][k].setStyle(IPPR.map.styles.default);
                        $(IPPR.map.markers[key][k]._icon).removeClass(IPPR.states.active);
                        $(IPPR.map.markers[key][k]._icon).removeClass(IPPR.states.selected);
                        IPPR.map.layers[key][k].isActive = false;
                        IPPR.map.markers[key][k].isActive = false;
                    }

                    if (IPPR.states.highlight === 'licenses' && value.ID === id || IPPR.states.highlight === 'oil' && value.ID === id || IPPR.states.highlight === 'companies' && value.company_id === id) {

                        IPPR.map.layers[key][k].setStyle(IPPR.map.styles.active);
                        IPPR.map.layers[key][k].bringToFront();
                        IPPR.map.layers[key][k].isActive = true;
                        IPPR.map.markers[key][k].isActive = true;
                        $(IPPR.map.markers[key][k]._icon).addClass(IPPR.states.selected);

                        if (IPPR.states.mobile) {
                            setTimeout(function () {
                                if (IPPR.map.markers[key][k]._latlng.lat && IPPR.map.markers[key][k]._latlng.lng) {
                                    IPPR.map.map[key].setView(new L.LatLng(IPPR.map.markers[key][k]._latlng.lat, IPPR.map.markers[key][k]._latlng.lng), 6);

                                    IPPR.map.map[key].fitBounds(IPPR.map.layers[key][k].boundsCalculated);
                                }
                            }, 200);
                        } else {

                            if (key < 4) {
                                IPPR.map.map[key].fitBounds(IPPR.map.layers[key][k].boundsCalculated, {
                                    paddingTopLeft: [600, 0],
                                    maxZoom: 11
                                });
                            }
                        }
                    }
                });
            },
            resetLayers: function resetLayers() {
                $.each(IPPR.map.layers, function (k, v) {
                    $.each(v, function (index) {
                        IPPR.map.layers[k][index].setStyle(IPPR.map.styles.default);
                        $(IPPR.map.markers[k][index]._icon).removeClass(IPPR.states.active);
                        $(IPPR.map.markers[k][index]._icon).removeClass(IPPR.states.selected);
                    });
                });
            },
            searchLayers: function searchLayers(type) {

                if (!IPPR.states.filters) {
                    IPPR.map.resetLayers();
                }

                var key = type === 'companies' ? 1 : type === 'licenses' ? 2 : 3,
                    listItems = $(IPPR.dom.lists.main + ':visible').find('.collection-item'),
                    ids = [],
                    found = [];

                $.each(listItems, function (index, val) {
                    ids.push($(val).data('id'));
                });

                $.each(IPPR.map.layers[key], function (k, v) {
                    if (IPPR.states.view === 'licenses' && $.inArray(v.ID, ids) < 0 || IPPR.states.view === 'oil' && $.inArray(v.ID, ids) < 0 || IPPR.states.view === 'companies' && $.inArray(v.company_id, ids) < 0) {
                        IPPR.map.layers[key][k].setStyle(IPPR.map.styles.filtered);
                        $(IPPR.map.markers[key][k]._icon).removeClass(IPPR.states.active);
                        $(IPPR.map.markers[key][k]._icon).removeClass(IPPR.states.selected);
                        IPPR.map.layers[key][k].isActive = false;
                        IPPR.map.markers[key][k].isActive = false;
                    } else {
                        $(IPPR.map.markers[key][k]._icon).removeClass(IPPR.states.selected);
                        IPPR.map.layers[key][k].setStyle(IPPR.map.styles.default);
                        IPPR.map.layers[key][k].isActive = true;
                        IPPR.map.markers[key][k].isActive = true;

                        found.push(v.boundsCalculated);
                    }
                });

                setTimeout(function () {
                    var size = $(IPPR.dom.lists.main + ':visible').find('.collection-item').size();
                    $(IPPR.dom.lists.main).find(IPPR.dom.lists.count).html('(' + size + ')');
                    // if (found.length){
                    //     IPPR.map.map[key].fitBounds(found, {
                    //         paddingTopLeft: [600,0],
                    //         maxZoom: 11
                    //     });
                    // }
                }, 50);
            }
        },
        filters: {
            list: [],
            options: {
                valueNames: ['List-title', 'concessionNumbers', 'mineralName'],
                listClass: 'collection',
                searchClass: 'Search-input'
            },
            clear: function clear() {
                $.each(IPPR.filters.list, function (k) {
                    IPPR.filters.list[k].filter();
                });
                $(IPPR.dom.filters.item).removeClass(IPPR.states.active);
                IPPR.dom.filters.search.removeClass(IPPR.states.hidden);
                IPPR.dom.filters.activeHolder.empty();
            }
        },
        helpers: {
            groupBy: function groupBy(xs, key) {
                return xs.reduce(function (rv, x) {
                    (rv[x[key]] = rv[x[key]] || []).push(x);
                    return rv;
                }, {});
            },
            unique: function unique(value, index, self) {
                return self.indexOf(value) === index;
            }
        }
    };

    /*
    ** Set / remove loading classes while the data loads
    */
    IPPR.loading = function () {
        IPPR.dom.data.toggleClass(IPPR.states.loading);
    };

    /*
    ** Get the data for each tab and store it in the main IPPR object.
    */
    IPPR.getData = function () {

        var markup = [],
            mustacheTpl = [],
            title,
            id = false;

        /*
        ** For each tab ...
        */
        $.each(IPPR.data.tabs, function (key, tab) {

            markup[key] = '';
            mustacheTpl[key] = $('#tab-' + key).find(IPPR.dom.templates.main).html();

            /*
            ** ... get the data from carto.com
            */
            $.getJSON(IPPR.data.apiURL + tab.sql, function (data) {
                /*
                ** ... sort data - broup by, store it the main IPPR object
                */
                IPPR.data.data[key] = IPPR.helpers.groupBy(data.rows, tab.groupBy);

                /*
                ** .. run through the data, parse the templates
                */

                $.each(IPPR.data.data[key], function (k, value) {

                    /*
                    ** ... parse the template for future use
                    */
                    Mustache.parse(mustacheTpl[key]);

                    /*
                    ** ... assign data to templates
                    */
                    if (tab.name === 'companies') {
                        title = value[0].company_name;
                        id = k;
                    } else {
                        title = value[0].license_number;
                        id = value[0].license_number;
                    }

                    var minerals = '',
                        comma = '';
                    $.each(value, function (k, v) {
                        if (k + 1 < value.length) {
                            comma = ',';
                        } else {
                            comma = '';
                        }
                        minerals += v.mineral_name + comma;
                    });
                    /*
                    ** ... render templates with the data
                    */

                    markup[key] += Mustache.render(mustacheTpl[key], {
                        title: title,
                        id: id,
                        minerals: minerals ? minerals.split(',') : false
                    });
                });

                /*
                ** ... append the data to the main lists in each tab
                */
                $('#tab-' + key).find(IPPR.dom.lists.main).find(IPPR.dom.lists.list).html(markup[key]);
                $('#tab-' + key).find(IPPR.dom.lists.main).find(IPPR.dom.lists.count).html('(' + Object.keys(IPPR.data.data[key]).length + ')');

                /*
                ** ... we are done with the data, set loading to false and turn on the filtering
                */
                if (Object.keys(IPPR.data.tabs).length - 1 === parseInt(key)) {
                    IPPR.loading();
                    setTimeout(function () {
                        IPPR.filtering();
                    }, 300);
                }
            });
        });
    };

    /*
    ** Initialize the maps ...
    */
    IPPR.initMap = function () {

        /*
        ** ... get the geo json data
        */
        $.getJSON('https://migodiyathu.carto.com/api/v2/sql/?format=GeoJSON&q=SELECT * FROM mw_licenses where license_type_id != 5', function (data) {

            /*
            ** ... for each map in the dom initialize the maps and populate with layers and markers
            */
            $.each(IPPR.dom.map, function (key, val) {

                var that = $(val);

                IPPR.map.layers[key] = [];
                IPPR.map.markers[key] = [];

                /*
                ** ... init map
                */
                if (key !== 4) {
                    IPPR.map.map[key] = L.map($('.Map').eq(key)[0], {
                        scrollWheelZoom: false,
                        zoomControl: false
                    }).setView([-13.198, 30.797], 7);

                    /*
                    ** ... change zoom controls to be in the bottom right corner
                    */
                    L.control.zoom({
                        position: 'bottomright'
                    }).addTo(IPPR.map.map[key]);

                    /*
                    ** ... base layer with the map of the world
                    */
                    L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png', {
                        maxZoom: 18
                    }).addTo(IPPR.map.map[key]);
                }
                /*
                ** ... function to be executed on each layer
                */

                // data for the mineral maps and oil maps in two different arrays to populate maps selectively


                function onEachLayer(feature, layer) {

                    feature.properties.boundsCalculated = layer.getBounds();
                    /*
                    ** ... append the data to each layer
                    */
                    $.each(feature.properties, function (index, val) {
                        layer[index] = val;
                    });

                    /*
                    ** ... extra data
                    */
                    layer.ID = feature.properties.license_number;
                    layer.company_id = feature.properties.company_id;
                    layer.license_type = feature.properties.license_type_id;

                    /*
                    ** ... push the layers for later use
                    */
                    IPPR.map.layers[key].push(layer);

                    /*
                    ** ... add labels to the polygons
                    */
                    var marker = L.marker(layer.getBounds().getCenter(), {
                        icon: L.divIcon({
                            className: 'Map-label',
                            html: '<span>' + layer.license_number + '</span>'
                        })
                    }).addTo(IPPR.map.map[key]);

                    /*
                    ** ... push the labels for later use
                    */
                    IPPR.map.markers[key].push(marker);

                    /*
                    ** ... each layer AND marker/label has a click function
                    */
                    function onClick() {

                        /*
                        ** ... if the current view is filtered (has active search or filtering) restyle the layers
                        */
                        if (IPPR.states.filters) {
                            IPPR.map.searchLayers(IPPR.states.view);
                        }

                        /*
                        ** ... If this label or marker is not active remove all active filters and reset search
                        */
                        if (!this.isActive) {
                            // jshint ignore:line
                            IPPR.dom.filters.searchRemove.click();
                        }

                        /*
                        ** ... click the item in the main list, scroll list to the top
                        */
                        var elem, top;
                        if (that.is('.licenses') || that.is('.oil')) {
                            elem = $(IPPR.dom.lists.main).find('li[data-id="' + feature.properties.license_number + '"]');
                            elem.click();
                            top = elem.position().top;
                            $(IPPR.dom.lists.main).find(IPPR.dom.lists.holder).scrollTop(top);
                        } else if (that.is('.companies')) {
                            elem = $(IPPR.dom.lists.main).find('li[data-id="' + feature.properties.company_id + '"]');
                            elem.click();
                            top = elem.position().top;
                            $(IPPR.dom.lists.main).find(IPPR.dom.lists.holder).scrollTop(top);
                        }
                    }

                    /*
                    ** ... assign the click events on layers and markers/labels
                    */
                    marker.on('click', onClick);
                    layer.on('click', onClick);
                }

                /*
                ** ... parse the geojson data and add it to the map
                */

                if (key !== 4) {
                    L.geoJson([data], {
                        //style: IPPR.map.styles.default,
                        style: IPPR.map.resetLayers(),
                        onEachFeature: onEachLayer
                    }).addTo(IPPR.map.map[key]);
                }
            });
        });

        /*
        ** ... get the geo json data
        */
        $.getJSON('https://migodiyathu.carto.com/api/v2/sql/?format=GeoJSON&q=SELECT * FROM mw_licenses where license_type_id = 5', function (data) {

            /*
            ** ... for each map in the dom initialize the maps and populate with layers and markers
            */
            $.each(IPPR.dom.map, function (key, val) {

                var that = $(val);

                IPPR.map.layers[4] = [];
                IPPR.map.markers[4] = [];

                /*
                ** ... init map
                */
                if (key === 4) {
                    IPPR.map.map[key] = L.map($('.Map').eq(4)[0], {
                        scrollWheelZoom: false,
                        zoomControl: false
                    }).setView([-13.198, 30.797], 7);

                    /*
                    ** ... change zoom controls to be in the bottom right corner
                    */
                    L.control.zoom({
                        position: 'bottomright'
                    }).addTo(IPPR.map.map[4]);

                    /*
                    ** ... base layer with the map of the world
                    */
                    L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png', {
                        maxZoom: 18
                    }).addTo(IPPR.map.map[4]);
                }
                /*
                ** ... function to be executed on each layer
                */

                // data for the mineral maps and oil maps in two different arrays to populate maps selectively


                function onEachLayer(feature, layer) {

                    feature.properties.boundsCalculated = layer.getBounds();
                    /*
                    ** ... append the data to each layer
                    */
                    $.each(feature.properties, function (index, val) {
                        layer[index] = val;
                    });

                    /*
                    ** ... extra data
                    */
                    layer.ID = feature.properties.license_number;
                    layer.company_id = feature.properties.company_id;
                    layer.license_type = feature.properties.license_type_id;

                    /*
                    ** ... push the layers for later use
                    */
                    IPPR.map.layers[4].push(layer);

                    /*
                    ** ... add labels to the polygons
                    */
                    var marker = L.marker(layer.getBounds().getCenter(), {
                        icon: L.divIcon({
                            className: 'Map-label',
                            html: '<span>' + layer.license_number + '</span>'
                        })
                    }).addTo(IPPR.map.map[4]);

                    /*
                    ** ... push the labels for later use
                    */
                    IPPR.map.markers[4].push(marker);

                    /*
                    ** ... each layer AND marker/label has a click function
                    */
                    function onClick() {

                        /*
                        ** ... if the current view is filtered (has active search or filtering) restyle the layers
                        */
                        if (IPPR.states.filters) {
                            IPPR.map.searchLayers(IPPR.states.view);
                        }

                        /*
                        ** ... If this label or marker is not active remove all active filters and reset search
                        */
                        if (!this.isActive) {
                            // jshint ignore:line
                            IPPR.dom.filters.searchRemove.click();
                        }

                        /*
                        ** ... click the item in the main list, scroll list to the top
                        */
                        var elem, top;
                        if (that.is('.licenses') || that.is('.oil')) {
                            elem = $(IPPR.dom.lists.main).find('li[data-id="' + feature.properties.license_number + '"]');
                            elem.click();
                            top = elem.position().top;
                            $(IPPR.dom.lists.main).find(IPPR.dom.lists.holder).scrollTop(top);
                        } else if (that.is('.companies')) {
                            elem = $(IPPR.dom.lists.main).find('li[data-id="' + feature.properties.company_id + '"]');
                            elem.click();
                            top = elem.position().top;
                            $(IPPR.dom.lists.main).find(IPPR.dom.lists.holder).scrollTop(top);
                        }
                    }

                    /*
                    ** ... assign the click events on layers and markers/labels
                    */
                    marker.on('click', onClick);
                    layer.on('click', onClick);
                }

                /*
                ** ... parse the geojson data and add it to the map
                */

                if (key === 4) {
                    L.geoJson([data], {
                        //style: IPPR.map.styles.default,
                        style: IPPR.map.resetLayers(),
                        onEachFeature: onEachLayer
                    }).addTo(IPPR.map.map[4]);
                }
            });
        });
    };

    /*
    ** Switch from licence to company and vice versa with that licence or company selected
    */
    $(document).on('click', IPPR.dom.lists.switch, function () {
        var id = $(this).data('id'),
            view = $(this).data('to');

        IPPR.states.view = view;
        $('a[data-view="' + view + '"]').click();

        setTimeout(function () {
            $('.collection-item[data-id="' + id + '"]').click();
            var top = $('.collection-item[data-id="' + id + '"]').last().position().top;
            $(IPPR.dom.lists.main).find(IPPR.dom.lists.holder).scrollTop(top);
        }, 100);
    });

    /*
    ** Display additional data for each clicked licence and compay below the main elements (lists with map) ...
    */
    IPPR.displayAdditionalInfo = function (item, type) {

        var tableData, mustacheTpl, finalTable, hierarchyTpl, shareholdersTpl, finalShareholders, documentsTpl, finalDocuments;
        /*
        ** ... if this is company
        */
        if (type === 'company') {

            /*
            ** ... if this is company, get the data and append to the DOM
            */

            $(IPPR.dom.additionalInfoTitle).html(IPPR.dom.additionalInfoStrings[type]);
            $(IPPR.dom.additionalInfoHeader).removeClass('blue').addClass('green');

            $(IPPR.dom.sankey.desktop).addClass(IPPR.states.hidden);
            IPPR.dom.additionalInfo.removeClass(IPPR.states.hidden);

            tableData = IPPR.data.data[0][item.data('id')][0];
            // ownedLicenses = item.data('ownedlicenses');

            mustacheTpl = $(IPPR.dom.templates.companyTable).html();
            // ownedLicensesTpl = $('.ownedLicenses-tpl').html();
            hierarchyTpl = $(IPPR.dom.templates.hierarchy).html();
            shareholdersTpl = $(IPPR.dom.templates.shareholders).html();
            documentsTpl = $(IPPR.dom.templates.documents).html();

            Mustache.parse(mustacheTpl);
            // Mustache.parse(ownedLicensesTpl);
            Mustache.parse(hierarchyTpl);
            Mustache.parse(shareholdersTpl);
            Mustache.parse(documentsTpl);

            finalTable = Mustache.render(mustacheTpl, {
                tableRows: tableData
            });

            $.getJSON("https://migodiyathu.carto.com/api/v2/sql/?q=Select c1.cartodb_id as child_id, c1.name as childcompanyname, c2.cartodb_id as parent_id, c2.name as parentcompanyname from mw_company_hierarchies h JOIN mw_companies c1 on h.child_company_id = c1.cartodb_id JOIN mw_companies c2 ON h.parent_company_id = c2.cartodb_id WHERE h.parent_company_id = '" + item.data('id') + "'", function (data) {

                finalShareholders = Mustache.render(shareholdersTpl, {
                    tableRows: data.rows
                });

                if (data.rows.length) {
                    if (IPPR.states.mobile) {
                        $(IPPR.dom.lists.extra).find(IPPR.dom.shareholders).html(finalShareholders).removeClass(IPPR.states.hidden);
                    } else {
                        IPPR.dom.additionalInfo.find(IPPR.dom.shareholders).html(finalShareholders).removeClass(IPPR.states.hidden);
                    }
                } else {
                    if (IPPR.states.mobile) {
                        $(IPPR.dom.lists.extra).find(IPPR.dom.shareholders).addClass(IPPR.states.hidden);
                    } else {
                        IPPR.dom.additionalInfo.find(IPPR.dom.shareholders).addClass(IPPR.states.hidden);
                    }
                }
            });

            $.getJSON("https://migodiyathu.carto.com/api/v2/sql/?q=SELECT * FROM mw_documents WHERE company_id ='" + item.data('id') + "'", function (data) {

                finalDocuments = Mustache.render(documentsTpl, {
                    documents: data.rows
                });

                if (data.rows.length) {
                    if (IPPR.states.mobile) {
                        $(IPPR.dom.lists.extra).find(IPPR.dom.documents).html(finalDocuments).removeClass(IPPR.states.hidden);
                    } else {
                        IPPR.dom.additionalInfo.find(IPPR.dom.documents).html(finalDocuments).removeClass(IPPR.states.hidden);
                    }
                } else {
                    if (IPPR.states.mobile) {
                        $(IPPR.dom.lists.extra).find(IPPR.dom.documents).addClass(IPPR.states.hidden);
                    } else {
                        IPPR.dom.additionalInfo.find(IPPR.dom.documents).addClass(IPPR.states.hidden);
                    }
                }
            });

            if (IPPR.states.mobile) {
                $(IPPR.dom.lists.extra).find(IPPR.dom.table).html(finalTable);
                IPPR.dom.additionalInfo.addClass(IPPR.states.hidden);
            } else {
                IPPR.dom.additionalInfo.removeClass(IPPR.states.hidden);
                IPPR.dom.additionalInfo.find(IPPR.dom.table).html(finalTable).removeClass(IPPR.states.hidden);
                // IPPR.dom.additionalInfo.find('.OwnedLicenses').html(finalownedLicenses).removeClass(IPPR.states.hidden);
            }
        }
    };

    // Mobile behaviour of the app
    IPPR.mobile = function () {
        /*
        ** ... Set the desktop to false
        */
        IPPR.states.desktop = false;

        /*
        ** ... unbind the click event on the tabs
        */
        IPPR.dom.tabs.off('click.mobile');

        /*
        ** ... bind the click event on the tabs
        */
        IPPR.dom.tabs.on('click.mobile', function () {

            IPPR.states.filters = false;
            IPPR.dom.filters.searchTrigger.removeClass(IPPR.states.hidden);
            IPPR.dom.filters.searchRemove.removeClass(IPPR.states.visible);
            IPPR.dom.filters.searchRemove.click();
            IPPR.filters.clear();

            /*
            ** ... hide the footer when on mobile view
            */
            setTimeout(function () {
                IPPR.dom.footer.addClass(IPPR.states.hidden);
            }, 400);

            IPPR.map.resetLayers();

            /*
            ** ... set the content to be visible and slide in the content
            */
            IPPR.dom.content.addClass(IPPR.states.active);

            setTimeout(function () {
                IPPR.dom.content.addClass(IPPR.states.animate);
                $.each(IPPR.map.map, function (key, value) {
                    if (value) {
                        value.invalidateSize();
                    }
                });
            }, 100);

            IPPR.states.view = $(this).data('view');

            if (IPPR.states.view === 'licenses') {
                IPPR.dom.mapTrigger.addClass(IPPR.states.active);
            } else {
                IPPR.dom.map.removeClass(IPPR.states.visible);
                $(IPPR.dom.lists.main).find(IPPR.dom.lists.holder).removeClass(IPPR.states.hidden);
                IPPR.dom.mapTrigger.find('.material-icons').html('map');
            }
        });

        /*
        ** ... levels are the main header links (licence<->info), so we check and slide the content to left or right depending on the current level
        */
        $.each(IPPR.dom.levels, function (key, value) {
            var level = $(this).data('level');

            $(value).find(IPPR.dom.lists.header).off('click');
            $(value).find(IPPR.dom.lists.header).on('click', function () {
                if (level === 0) {
                    // Inital non selected view
                    IPPR.dom.footer.removeClass(IPPR.states.hidden);
                    IPPR.dom.content.removeClass(IPPR.states.animate);
                    setTimeout(function () {
                        IPPR.dom.content.removeClass(IPPR.states.active);
                    }, 100);
                    IPPR.dom.mapTrigger.removeClass(IPPR.states.active);
                } else if (level === 1) {
                    // 1st list
                    IPPR.dom.dataHolder.css({ transform: 'translate(0,0)' });
                    if (IPPR.states.view === 'licenses') {
                        IPPR.dom.mapTrigger.addClass(IPPR.states.active);
                    }
                    IPPR.dom.map.removeClass(IPPR.states.hidden);
                    $.each(IPPR.map.map, function (key, value) {
                        if (value) {
                            value.invalidateSize();
                        }
                    });
                    $(IPPR.dom.lists.extra).addClass(IPPR.states.hidden);
                    $(IPPR.dom.lists.info).addClass(IPPR.states.hidden);

                    if (IPPR.dom.mapTrigger.find('.material-icons').html() === 'map') {
                        $(IPPR.dom.lists.main).find(IPPR.dom.lists.holder).removeClass(IPPR.states.hidden);
                    }
                } else if (level === 2) {
                    // second list
                    IPPR.dom.dataHolder.css({ transform: 'translate(-33.3333%,0)' });
                }
            });
        });

        /*
        ** ... show license additional info (orange button)
        */
        $(document).on('click', IPPR.dom.showInfo, function (e) {
            e.preventDefault();

            var item = $(this).closest(IPPR.dom.dataHolder).find('.collection-item.is-active');
            IPPR.displayAdditionalInfo(item, 'licence');

            $(IPPR.dom.lists.info).removeClass(IPPR.states.hidden);
            IPPR.dom.dataHolder.css({ transform: 'translate(-66.6666%,0)' });
            $(window).scrollTop(0);
        });

        IPPR.states.mobile = true;
    };

    // Desktop behaviour of the app
    IPPR.desktop = function () {

        IPPR.states.mobile = false;
        IPPR.dom.tabs.off('click.desktop');
        $(IPPR.dom.lists.extra).removeClass(IPPR.states.hidden);

        IPPR.dom.tabs.on('click.desktop', function () {

            IPPR.states.filters = false;
            IPPR.dom.filters.searchTrigger.removeClass(IPPR.states.hidden);
            IPPR.dom.filters.searchRemove.removeClass(IPPR.states.visible);
            IPPR.dom.filters.searchRemove.click();
            IPPR.filters.clear();
            $(IPPR.dom.filters.select).val('');
            $('select').material_select();

            /*
            ** ... we need to reset the leaflet state so it repositions the map view
            */
            setTimeout(function () {
                $.each(IPPR.map.map, function (key, value) {
                    if (value) {
                        value.invalidateSize();
                    }
                });
            }, 100);
            IPPR.states.view = $(this).data('view');
            IPPR.dom.additionalInfo.addClass(IPPR.states.hidden);

            IPPR.map.resetLayers();
        });

        /*
        ** ... enable the map to be draggable
        */
        $.each(IPPR.map.map, function (k, v) {
            v.dragging.enable();
        });

        IPPR.states.desktop = true;
    };

    /*
    ** On each clicked item in the lists do something ...
    */
    IPPR.listDetails = function () {

        var markup = [],
            mustacheTpl = [];

        $.each(IPPR.data.tabs, function (key) {

            mustacheTpl[key] = $('#tab-' + key).find('.extra-tpl').html();

            $('#tab-' + key).on('click', '.collection-item', function () {

                if (IPPR.states.filters) {
                    IPPR.map.searchLayers(IPPR.states.view);
                }

                markup[key] = '';

                IPPR.dom.mapTrigger.removeClass(IPPR.states.active);

                $(this).parent().find('li').removeClass(IPPR.states.active);
                $(this).addClass(IPPR.states.active);

                if (IPPR.states.mobile) {
                    IPPR.dom.dataHolder.css({ transform: 'translate(-33.3333%,0)' });
                    if (IPPR.states.view === 'licenses' || IPPR.states.view === 'oil') {
                        IPPR.dom.map.addClass(IPPR.states.hidden);
                    } else {
                        IPPR.dom.mapInline.removeClass(IPPR.states.hidden);
                    }
                    $(window).scrollTop(0);
                } else {
                    IPPR.dom.map.removeClass(IPPR.states.hidden);
                }

                var id = $(this).data('id'),
                    size = 0;

                if (!$(this).closest(IPPR.dom.lists.extra).size()) {

                    if (IPPR.states.view === 'companies') {
                        IPPR.states.highlight = 'companies';
                    } else if (IPPR.states.view === 'licenses') {
                        IPPR.states.highlight = 'licenses';
                    } else {
                        IPPR.states.highlight = 'oil';
                    }

                    if (IPPR.states.desktop) {

                        if (IPPR.states.view === 'licenses') {
                            IPPR.displayAdditionalInfo($(this), 'licence');
                        } else if (IPPR.states.view === 'oil') {
                            IPPR.displayAdditionalInfo($(this), 'oil');
                        } else {
                            IPPR.displayAdditionalInfo($(this), 'company');
                        }
                    } else {
                        $(this).closest(IPPR.dom.lists.holder).addClass(IPPR.states.hidden);
                        if (IPPR.states.view !== 'licenses' && IPPR.states.view !== 'oil') {
                            IPPR.displayAdditionalInfo($(this), 'company');
                        }
                    }

                    var companies = [],
                        tmpCompanyId;

                    $.each(IPPR.data.data[key][id], function (k, company) {

                        if (IPPR.states.view === 'companies') {
                            companies.push(company);
                            size++;
                        } else {

                            if (tmpCompanyId !== company.company_id) {
                                Mustache.parse(mustacheTpl[key]);

                                markup[key] += Mustache.render(mustacheTpl[key], {
                                    active: key <= 2 ? true : false,
                                    companyInfo: company,
                                    company_id: company.company_id
                                });
                                size++;
                            }
                        }

                        tmpCompanyId = company.company_id;
                    });

                    if (IPPR.states.view === 'companies') {
                        size = 0;

                        $.each(IPPR.helpers.groupBy(companies, 'license_number'), function (k, value) {

                            Mustache.parse(mustacheTpl[key]);

                            markup[key] += Mustache.render(mustacheTpl[key], {
                                title: k,
                                id: value[0].license_number
                            });

                            size++;
                        });

                        if (IPPR.states.mobile) {
                            $.each(IPPR.map.markers[key], function (index, val) {
                                val.off('click');
                            });

                            $.each(IPPR.map.layers[key], function (index, val) {
                                val.off('click');
                            });

                            $.each(IPPR.map.map, function (k, v) {
                                v.dragging.disable();
                            });
                        }
                    }

                    $('#tab-' + key).find(IPPR.dom.lists.extra).removeClass(IPPR.states.hidden);
                    $('#tab-' + key).find(IPPR.dom.lists.extra).find(IPPR.dom.lists.list).html(markup[key]);
                    $('#tab-' + key).find(IPPR.dom.lists.extra).find(IPPR.dom.lists.count).html('(' + size + ')');

                    $('#tab-' + key).find(IPPR.dom.lists.headerActive).removeClass(IPPR.states.hidden);
                    $('#tab-' + key).find(IPPR.dom.lists.headerInActive).addClass(IPPR.states.hidden);

                    IPPR.map.map[key].invalidateSize();
                } else if (IPPR.states.view === 'licenses') {} else {
                    IPPR.states.highlight = 'oil';
                }

                if (IPPR.states.desktop) {

                    if (key === '1') {
                        IPPR.map.highlightLayer('2', id);
                    } else if (key === '0') {
                        IPPR.map.highlightLayer('1', id);
                    } else if (key === '2') {
                        IPPR.map.highlightLayer('4', id);
                    } else {
                        IPPR.map.highlightLayer(key, id);
                    }
                } else {
                    IPPR.map.highlightLayer(key, id);
                }

                $('.collapsible').collapsible({
                    accordion: true
                });
            });
        });
    };

    IPPR.filtering = function () {

        $.getJSON("https://migodiyathu.carto.com/api/v2/sql/?q=SELECT * FROM mw_minerals", function (data) {
            $.each($(IPPR.dom.filters.select), function (kk, vv) {
                $.each(data.rows, function (k, v) {
                    $(vv).append('<option value="' + v.name + '">' + v.name + '</option>');
                });
            });

            setTimeout(function () {
                $('select').material_select();
            }, 100);
        });

        $.each(IPPR.data.tabs, function (key) {
            IPPR.filters.list.push(new List('tab-' + key, IPPR.filters.options)); // jshint ignore:line

            $('#tab-' + key).find(IPPR.dom.filters.item).on('click', function () {

                IPPR.states.filters = true;

                if ($(this).is('.' + IPPR.states.active)) {
                    IPPR.filters.list[key].filter();
                    $(this).closest(IPPR.dom.filters.main).find('.chip').removeClass(IPPR.states.active);
                    if (IPPR.states.mobile) {
                        IPPR.filters.clear();
                        IPPR.map.resetLayers();
                    }
                } else {

                    var value = $(this).data('filter');

                    $(this).closest(IPPR.dom.filters.main).find('.chip').removeClass(IPPR.states.active);
                    $(this).addClass(IPPR.states.active);

                    if (IPPR.states.mobile) {
                        IPPR.dom.filters.search.addClass(IPPR.states.hidden);
                        var clone = $(this).clone();
                        IPPR.dom.filters.activeHolder.html(clone);
                    }

                    IPPR.filters.list[key].filter(function (item) {
                        if (item.values()[value]) {
                            return true;
                        }
                        return false;
                    });

                    IPPR.map.searchLayers(IPPR.states.view);
                }
            });

            $('#tab-' + key).find(IPPR.dom.filters.select).on('change', function () {

                var value = $(this).val();
                var type = 'mineralName';

                if (!value) {
                    IPPR.states.filters = false;
                    IPPR.filters.list[key].filter();
                    IPPR.filters.clear();
                    IPPR.map.resetLayers();
                } else {

                    IPPR.states.filters = true;

                    IPPR.filters.list[key].filter(function (item) {

                        if (item.values()[type].indexOf(value) > 0) {
                            return true;
                        }
                        return false;
                    });

                    IPPR.map.searchLayers(IPPR.states.view);
                }
            });
        });

        $.each(IPPR.filters.list, function (index, val) {
            val.on('updated', function () {
                IPPR.map.searchLayers(IPPR.states.view);
            });
        });

        $('.' + IPPR.filters.options.searchClass).on('keyup', function () {
            if ($(this).val()) {
                IPPR.states.filters = true;
                IPPR.dom.filters.searchTrigger.addClass(IPPR.states.hidden);
                IPPR.dom.filters.searchRemove.addClass(IPPR.states.visible);
            } else {
                IPPR.states.filters = false;
                IPPR.dom.filters.searchTrigger.removeClass(IPPR.states.hidden);
                IPPR.dom.filters.searchRemove.removeClass(IPPR.states.visible);
            }
        });

        IPPR.dom.filters.searchRemove.on('click', function () {
            IPPR.map.resetLayers();
            $('.' + IPPR.filters.options.searchClass).val('').trigger('keyup').blur();
            $.each(IPPR.filters.list, function (k) {
                IPPR.filters.list[k].search();
            });
            IPPR.states.filters = false;
            IPPR.dom.filters.searchTrigger.removeClass(IPPR.states.hidden);
            IPPR.dom.filters.searchRemove.removeClass(IPPR.states.visible);
            $(IPPR.dom.lists.main + ':visible').find('.collection-item').removeClass(IPPR.states.active);
        });

        if (IPPR.states.mobile) {
            IPPR.dom.filters.activeHolder.on('click', '.chip', function () {
                IPPR.filters.clear();
                IPPR.map.resetLayers();
            });
        }
    };

    IPPR.mapTrigger = function () {

        IPPR.dom.mapTrigger.on('click', function (e) {
            e.preventDefault();

            if (IPPR.states.mobile) {
                $(IPPR.dom.lists.main).find(IPPR.dom.lists.holder).toggleClass(IPPR.states.hidden);
            }

            IPPR.dom.map.toggleClass(IPPR.states.visible);

            $.each(IPPR.map.map, function (key, value) {
                if (value) {
                    value.invalidateSize();
                    value.dragging.enable();
                }
            });

            if ($(IPPR.dom.lists.main).find(IPPR.dom.lists.holder).is('.' + IPPR.states.hidden) || IPPR.dom.dataHolder.is('.' + IPPR.states.hidden)) {
                IPPR.states.map = true;
                $(this).find('.material-icons').html('view_list');
            } else {
                $(this).find('.material-icons').html('map');
            }
        });
    };

    IPPR.initApp = function () {
        if (U.vw() < 993) {
            if (!IPPR.states.mobile) {
                IPPR.mobile();
            }
        } else {
            if (!IPPR.states.desktop) {
                IPPR.desktop();
            }
        }

        IPPR.listDetails();
    };

    IPPR.sankey = function (sankeyData, sankeyElem) {

        var _self = {
            draw: function draw() {

                var data = new google.visualization.DataTable();

                data.addColumn('string', 'From');
                data.addColumn('string', 'To');
                data.addColumn('number', '');
                data.addColumn({ type: 'string', role: 'tooltip' });
                data.addRows(sankeyData);

                var colors = ['#7E9669', '#256A9A'];

                // Sets chart options.
                var options = {
                    width: '100%',
                    height: 400,
                    sankey: {
                        node: {
                            colors: colors,
                            width: 5,
                            nodePadding: 150
                        },
                        link: {
                            colorMode: 'gradient',
                            colors: colors
                        }
                    }
                };

                // Instantiates and draws our chart, passing in some options.
                var chart = new google.visualization.Sankey(document.querySelector(sankeyElem));

                chart.draw(data, options);
            }
        };

        _self.draw();

        // google.charts.setOnLoadCallback(_self.draw);

        U.addEvent(window, 'resize', U.debounce(function () {
            _self.draw();
        }, 200));
    };

    if ($('body').is('.App')) {

        IPPR.getData();
        IPPR.initMap();
        IPPR.initApp();
        IPPR.mapTrigger();
        U.addEvent(window, 'resize', U.debounce(function () {
            IPPR.initApp();
        }, 200));

        if (window.location.hash) {
            $('.Header-tabs a[href="/' + window.location.hash + '"]').click();
        }
    }

    $('.js-dropdown-trigger').dropdown({
        inDuration: 300,
        outDuration: 225,
        constrain_width: false, // Does not change width of dropdown to that of the activator
        hover: false, // Activate on hover
        gutter: 0, // Spacing from edge
        belowOrigin: true, // Displays dropdown below the button
        alignment: 'right' // Displays dropdown with edge aligned to the left of button
    });
})(window.burza.utils, jQuery);
//# sourceMappingURL=main.plain.js.map
