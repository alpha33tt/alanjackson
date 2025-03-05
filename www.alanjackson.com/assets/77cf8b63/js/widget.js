// Init widgets
window.yii.widgets = window.yii.widgets || {};

// Init NavItems widget (should be initialized only once)
window.yii.widgets.NavItems = window.yii.widgets.NavItems || (function ($) {
    'use strict';

    var widget = {};

    widget.initWidget = function (widgetId) {

        var WIDGET_SELECTOR = '#' + widgetId,
            $widget         = $(WIDGET_SELECTOR);

        // console.log('Init widget for: ', $widget);

        _subscribeListeners($widget);
    };

    // -----------------------------------------------------------------------------------------------------------------
    // Private module functions

    function _subscribeListeners($widget) {

        // When dropdown open/close
        $widget.on('shown.bs.dropdown', '*', function (event, data) {

            var $itemOpened = $(event.currentTarget);

            $itemOpened
                .find('[tabindex="-1"]')
                .attr('tabindex', 0);
        });


        $widget.on('hidden.bs.dropdown', '*', function (event, data) {

            var $itemClosed = $(event.currentTarget);

            $itemClosed
                .find('[tabindex="0"]')
                .attr('tabindex', -1);
        });
    }


    return widget;

}(jQuery));

