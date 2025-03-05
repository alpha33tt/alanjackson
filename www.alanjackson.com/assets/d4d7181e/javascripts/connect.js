(function ($) {
    'use strict';

    var ConnectApp = {
        /**
         * CSS class of DOM elements that "handled" using AJAX.
         * Used for displaying of AJAX loader on those elements.
         */
        AJAX_STATE_CSS_CLASS: 'is-ajaxProcessed',

        /**
         * Enabled debug mode? Constant will be changed depending on PHP constant.
         * @var {Boolean}
         */
        YII_DEBUG: false
    };

    // -----------------------------------
    // ----- Common application functions

    ConnectApp.fn = {
        /**
         * Adds specified messages/variables into browser console.
         *
         * @param {...*} *  Arbitrary arguments ( arbitrary number and any type)
         */
        log: function () {
            var args;

            if (ConnectApp.YII_DEBUG) {

                args = ['Connect.log >>  '];
                $.each(arguments, function (key, val) { // We copy items form "pseudoarray" to normal array
                    args.push(val);
                });
                console.log.apply(console, args);

            }
        },

        /**
         * Returns default callback for handling of AJAX request.
         *
         * @example
         *  <code>
         *      fn.ajaxErrorHandler(function(event, object, settings){
         *          // ... If callback function returns =false, default behavior of callback will be prevented.
         *      });
         *  </code>
         *
         * @param {Function} [userHandler]   User callback that performed after default handler.
         *                                   List of arguments the same in $.ajax error handler.
         * @return {Function}
         */
        ajaxErrorHandler: function (userHandler) {
            var fn = this,
                ui = ConnectApp.ui;

            return function (event, object, settings) {

                var callbackResult = true;

                fn.log('Ajax Request Error>', object, event, settings);

                if (typeof userHandler === 'function') {
                    callbackResult = userHandler(event, object, settings);
                }

                if (callbackResult !== false) {
                    // Default behavior

                    ui.showNotification('Some error', ui.NOTY_TYPE_ERROR, true);
                }
            };
        },

        /**
         * Returns default callback for handling of AJAX request.
         * This callback implements following default behavior:
         *
         *   - If response has "msg" - it will used for displaying of notification (by default {@link ConnectApp.ui.NOTY_TYPE_INFORMATION} type).
         *   - If response has "success" and success==true - notification will displayed as {@link ConnectApp.ui.NOTY_TYPE_SUCCESS},
         *      otherwise - as {@link ConnectApp.ui.NOTY_TYPE_ERROR}.
         *
         * @example
         *  <code>
         *      fn.ajaxSuccessHandler(function(event, object, settings){
         *          // ... If callback function returns =false, default behavior of callback will be prevented.
         *      });
         *  </code>
         *
         * @param {Function} [userHandler]   User callback that performed after default handler.
         *                                   List of arguments the same in $.ajax error handler.
         * @return {Function}
         */
        ajaxSuccessHandler: function (userHandler) {
            var fn = this,
                ui = ConnectApp.ui;

            return function (response) {
                var callbackResult = true;

                fn.log('Ajax Success >', arguments);

                if (typeof userHandler === 'function') {
                    callbackResult = userHandler.apply(this, arguments);
                }

                if (callbackResult !== false) {

                    // Default behavior
                    var isSuccess = response && response.success,
                        notyMsg   = response && response.msg,
                        notyType  = isSuccess
                            ? ui.NOTY_TYPE_SUCCESS
                            : ui.NOTY_TYPE_ERROR;

                    // We display notification (if necessary)
                    if (notyMsg) {
                        ui.showNotification(notyMsg, notyType, !isSuccess);
                    }

                }
            };
        },

        /**
         * Serializes specified form to object.
         * This is alternative to form.serialize() and form.serializeArray).
         *
         * @param  {jQuery|*}  $form  jQ-object of form
         * @return {Object}
         *
         * @see   Base version: http://stackoverflow.com/a/1186309/3793592
         */
        serializeObject: function ($form) {
            var resultObj       = {},
                serializedArray = $form.serializeArray();

            $.each(serializedArray, function () {
                var name       = this.name,
                    regExp     = new RegExp('^(.+)\\[\\]$'),
                    matches    = regExp.exec(name), // will be !=null for example: DbReportOptions[state][]
                    isMultiply = Boolean(matches);

                if (isMultiply) {
                    name = matches[1];
                }

                if ((resultObj[name] !== undefined) && isMultiply) {
                    if (!resultObj[name].push) {
                        resultObj[name] = [resultObj[name]];
                    }
                    resultObj[name].push(this.value || '');
                } else {
                    resultObj[name] = this.value || '';
                }
            });

            return resultObj;
        },

        /**
         * Redirects browser to specified URL.
         * @param {String} URL
         * @param {Boolean} [addToHistory=true]
         */
        redirectTo: function (URL, addToHistory) {
            addToHistory = (addToHistory === undefined) ? true : addToHistory;

            if (addToHistory && window.history && window.history.pushState) {
                window.history.pushState({}, '', URL);
            }

            window.location.replace(URL);
        }
    };


    // -----------------------------------
    // ----- User Interface

    ConnectApp.ui = {
        /**
         * Selector of main container for page content.
         */
        PAGE_CONTENT_SELECTOR: 'body',

        AJAX_LOADER_BAR_WHITE            : 'AjaxLoader--bgWhite AjaxLoader--withOpacity',
        AJAX_LOADER_BAR_WHITE_VCENTER    : 'AjaxLoader--bgWhite AjaxLoader--withOpacity AjaxLoader--verticalAlignCenter',
        AJAX_LOADER_SPINNER_WHITE        : 'AjaxLoader--spinnerBgWhite AjaxLoader--withOpacity',
        AJAX_LOADER_SPINNER_WHITE_VCENTER: 'AjaxLoader--spinnerBgWhite AjaxLoader--withOpacity AjaxLoader--verticalAlignCenter',

        NOTY_TYPE_ALERT      : 'alert',
        NOTY_TYPE_SUCCESS    : 'success',
        NOTY_TYPE_ERROR      : 'error',
        NOTY_TYPE_WARNING    : 'warning',
        NOTY_TYPE_INFORMATION: 'information',
        NOTY_TYPE_CONFIRM    : 'confirm',

        /**
         * Adds AJAX loader on main page content container.
         * If jqXHR was passed, loader will be deleted automatically after completing of this AJAX request.
         * You can also delete loader using {@link ConnectApp.ui.removeAjaxLoader}.
         *
         * @param {jqXHR|$.Deferred|*}  [jqXHR]  Object of AJAX request
         *                                       (if was passed, loader will deleted after completing of this AJAX request)
         *
         * @return {jQuery|*}                    DOM element of page container on which has been added loader
         */
        addPageContentAjaxLoader: function (jqXHR) {
            var ui             = this,
                $pageContent   = $(ui.PAGE_CONTENT_SELECTOR),
                loaderCssClass = ui.AJAX_LOADER_BAR_WHITE_VCENTER;            // We set bar loader on the white background

            ui.addAjaxLoader($pageContent, jqXHR, loaderCssClass);

            return $pageContent;
        },

        /**
         * Removes loader from main page content container.
         */
        removePageContentAjaxLoader: function () {
            var ui           = this,
                $pageContent = $(ui.PAGE_CONTENT_SELECTOR);

            ui.removeAjaxLoader($pageContent);
        },

        /**
         * Adds AJAX loader on specified element.
         * If jqXHR was passed, loader will be deleted automatically after completing of this AJAX request.
         * You can also delete loader using {@link ConnectApp.ui.removeAjaxLoader}.
         *
         * @param {jQuery|*}            $element                                DOM element on which will add loader
         * @param {jqXHR|$.Deferred|*}  [jqXHR]                                 Object of AJAX request
         *                                                                      (if was passed, loader will deleted after completing of this AJAX request)
         * @param {String}              [loaderCssClass=ui.AJAX_LOADER_BAR_WHITE_VCENTER]  CSS class of loader (defines loader visual style, see CSS)
         */
        addAjaxLoader: function ($element, jqXHR, loaderCssClass) {
            var ui = this;

            loaderCssClass = (loaderCssClass === undefined) ? ui.AJAX_LOADER_BAR_WHITE_VCENTER : loaderCssClass;

            $element
                .addClass(ConnectApp.AJAX_STATE_CSS_CLASS)
                .addClass(loaderCssClass);

            if (jqXHR) {
                jqXHR.always(function () {
                    ui.removeAjaxLoader($element);
                });
            }
        },

        /**
         * Removes loader from specified element.
         *
         * @param {jQuery|*} $element
         */
        removeAjaxLoader: function ($element) {
            var loaderCssClass = 'AjaxLoader--*';

            $element.removeClass(ConnectApp.AJAX_STATE_CSS_CLASS);
            ConnectApp.utils.removeClassWildcard($element, loaderCssClass);
        },

        /**
         * Displays notification.
         *
         * @param {String}     text
         * @param {String}     [type=ConnectApp.ui.NOTY_TYPE_INFORMATION]
         * @param {Boolean}    [sticky=false]
         *
         * @see http://ned.im/noty/#/about
         *
         */
        showNotification: function (text, type, sticky) {
            var ui = this;

            type   = type || ui.NOTY_TYPE_INFORMATION;
            sticky = (sticky === undefined) ? false : sticky;

            return noty({
                text        : text,
                type        : type,
                layout      : 'topRight',
                theme       : 'relax',
                dismissQueue: true,
                animation   : {
                    open : 'animated bounceInRight',  // Animate.css class names
                    close: 'animated bounceOutRight', // Animate.css class names
                    speed: 500                        // unavailable - no need
                },
                force       : false,
                maxVisible  : false,
                timeout     : sticky ? false : 10000
            });

            // Available options:
            //$.noty.defaults = {
            //    layout: 'top',
            //    theme: 'defaultTheme', // or 'relax'
            //    type: 'alert',
            //    text: '', // can be html or string
            //    dismissQueue: true, // If you want to use queue feature set this true
            //    template: '<div class="noty_message"><span class="noty_text"></span><div class="noty_close"></div></div>',
            //    animation: {
            //        open: {height: 'toggle'}, // or Animate.css class names like: 'animated bounceInLeft'
            //        close: {height: 'toggle'}, // or Animate.css class names like: 'animated bounceOutLeft'
            //        easing: 'swing',
            //        speed: 500 // opening & closing animation speed
            //    },
            //    timeout: false, // delay for closing event. Set false for sticky notifications
            //    force: false, // adds notification to the beginning of queue when set to true
            //    modal: false,
            //    maxVisible: 5, // you can set max visible notification for dismissQueue true option,
            //    killer: false, // for close all notifications before show
            //    closeWith: ['click'], // ['click', 'button', 'hover', 'backdrop'] // backdrop click will close all notifications
            //    callback: {
            //        onShow: function() {},
            //        afterShow: function() {},
            //        onClose: function() {},
            //        afterClose: function() {},
            //        onCloseClick: function() {},
            //    },
            //    buttons: false // an array of buttons
            //};
        },

        /**
         * Displays a confirmation dialog.
         * The default implementation simply displays a js confirmation dialog.
         *
         * @param {String} message      the confirmation message.
         * @param {Function} [ok]       a callback to be called when the user confirms the message
         * @param {Function} [cancel]   a callback to be called when the user cancels the confirmation
         */
        showConfirmModal: function (message, ok, cancel) {
            window.yii.confirm(message, ok, cancel);
        },

        /**
         * Displays a prompt dialog with single value.
         * The default implementation simply displays a native browser prompt.
         *
         * @param {String} message      the confirmation message.
         * @param {String} defaultValue default value for the prompt.
         * @param {Function} [ok]       a callback to be called when the user confirms the message
         * @param {Function} [cancel]   a callback to be called when the user cancels the confirmation
         */
        showPromptModal: function (message, defaultValue, ok, cancel) {
            var result = window.prompt(message, defaultValue);

            if (result === null) {
                if (cancel) {
                    cancel(defaultValue);
                }
            } else {
                if (ok) {
                    ok(result);
                }
            }
        },

        /**
         * Toggles popover on specified element.
         *
         * @param {jQuery|*} $toggleElement     Element that toggle popover.
         * @param {String} [title = '']         Optional title
         * @param {String} [content = '']       Optional content
         * @param {String} [footer]             Optional footer. If not defined will rendered default buttons "Apply" and "Reset".
         * @param {Object} [popoverOptions]     Bootstrap popover options. See: http://getbootstrap.com/javascript/#popovers-options
         *
         * @returns {jQuery|*|null}             jQ-element of popover container. Returns =null in the case when popover has been closed.
         *
         * @see http://getbootstrap.com/javascript/#popovers-options
         */
        togglePopover: function ($toggleElement, title, content, footer, popoverOptions) {
            var popoverTitle, popoverFooter, popoverTemplate, handler, popoverData,
                hasPopoverCloseHandlerKey = 'has-popover-close-handler';


            // We remove popover if it already initialized
            if ($toggleElement.data('bs.popover')) {

                $toggleElement.popover('destroy');

                return null;
            }

            // Open popover
            popoverTitle = '<button type="button" class="close js-popover-close">×</button><i class="glyphicon glyphicon-edit"></i> ';
            popoverTitle += title || '';

            popoverFooter = footer || (
                    '<button title="Reset" class="btn btn-sm btn-default js-popover-reset" type="button"><i class="glyphicon glyphicon-ban-circle"></i></button>' +
                    '<button title="Apply" class="btn btn-sm btn-primary js-popover-apply" type="button"><i class="glyphicon glyphicon-save"></i></button>'
                );

            popoverTemplate =
                '<div class="js-popover popover popover-primary popover-md" role="tooltip"><div class="arrow"></div><div class="popover-title"></div>' +
                '<div class="popover-content"></div>' +
                '<div class="popover-footer"><div style="display:none" class="kv-editable-loading js-ajax-loader">&nbsp;</div>' + popoverFooter + '</div>' +
                '</div>';


            // We prepare popover options
            popoverOptions = $.extend({
                placement: 'top',
                html     : true,
                content  : content || ' ',
                title    : popoverTitle,
                template : popoverTemplate,
                trigger  : 'manual'
            }, popoverOptions || {});

            $toggleElement
                .popover(popoverOptions)
                .popover('show');

            // We assign (once) the global handler for closing popovers
            handler = function popoverCloseHandler() {
                var $popover    = $(this).parents('.js-popover'),
                    popoverId   = $popover.attr('id'),
                    $toggleElem = $('[aria-describedby=\'' + popoverId + '\']');

                $toggleElem.popover('destroy');
            };


            if (!$(document).data(hasPopoverCloseHandlerKey)) {
                $(document)
                    .on('click', '.js-popover-close', handler)
                    .data(hasPopoverCloseHandlerKey, true);
            }

            // We return popover container
            popoverData = $toggleElement.data('bs.popover');
            if (popoverData) {
                return popoverData.$tip;
            }

        }

    };


    // -----------------------------------
    // ----- Helper methods (utils)

    ConnectApp.utils = {
        /**
         * Removes CSS classes of element using wildcards:
         *
         * @example
         *  ConnectApp.utils.removeClassWildcard( $( '#foo' ), 'foo-* bar-*', 'foobar' );
         *
         * @param {jQuery|*}    $element
         * @param {String}      removals        Classes to delete, for example: 'foo-* bar-*'
         * @returns {jQuery|*}                  Passed element
         *
         * @see https://gist.github.com/peteboere/1517285
         */
        removeClassWildcard: function ($element, removals) {
            if (removals.indexOf('*') === -1) {
                // Use native jQuery methods if there is no wildcard matching
                $element.removeClass(removals);
                return $element;
            }

            var patt = new RegExp('\\s' +
                removals.replace(/\*/g, '[A-Za-z0-9-_]+').split(' ').join('\\s|\\s') +
                '\\s', 'g');

            $element.each(function (i, it) {
                var cn = ' ' + it.className + ' ';
                while (patt.test(cn)) {
                    cn = cn.replace(patt, ' ');
                }
                it.className = $.trim(cn);
            });

            return $element;
        },

        /**
         * Executes JS code.
         * @param {String} code
         */
        executeJsCode: function (code) {
            $('body').append(code);
        }
    };


    // -----------------------------------
    // ----- Debug methods (useful methods for debugging, not for production).

    ConnectApp.debug = {

        /**
         * Enables tracing of all calls of method jQuery.trigger.
         * This can be used for finding non-standard events in third-party JS libraries.
         *
         * @see http://stackoverflow.com/a/16316848/3793592
         */
        enableTraceOfjQueryTriggerFunction: function () {
            var oldJQueryEventTrigger = jQuery.event.trigger;

            jQuery.event.trigger = function (event, data, elem, onlyHandlers) {
                ConnectApp.fn.log('jQuery.trigger >> ', event, data, elem, onlyHandlers);

                oldJQueryEventTrigger(event, data, elem, onlyHandlers);
            }
        }

    };


    // -----------------------------------
    // ----- Widget collection

    ConnectApp.widgets = {};


    // -----------------------------------
    // ----- Form objects (handlers etc)

    ConnectApp.forms = {};


    // We publish this object
    window.ConnectApp = ConnectApp;

	window.ConnectApp.memberComment = {
		abuse: function (commentId, el) {
			var abused    = $(el).hasClass('abused');
			// var i         = $(el).find('i');
			// var baseClass = i.attr('class');

			// i.attr('class', 'fa fa-spinner fa-spin fa-fw');

			if (abused) {

				$.post('/comment-un-abuse', {
					commentId: commentId,
					_csrf    : yii.getCsrfToken()
				}, function (response) {
					if (response) {

						if (response.result == 'ok') {
							$(el).hide();

							$('#' + el.id.replace('unabuse-comment', 'abuse-comment')).show();
						}

						// i.attr('class', baseClass);
					}
				});
			}
			else {
				// var i = $(el).find('i');
				// if (i[0]) {
				//     $(i[0]).attr('class', 'fa fa-spinner fa-spin fa-fw');
				// }
				$.post('/comment-abuse', {
					commentId: commentId,
					_csrf    : yii.getCsrfToken()
				}, function (response) {
					if (response) {

						if (response.result == 'ok') {
							$(el).hide();

							$('#' + el.id.replace('abuse-comment', 'unabuse-comment')).show();
						}

						// i.attr('class', baseClass);
					}
				});
			}
		}
	};

}(jQuery));