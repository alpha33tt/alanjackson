/**
 * Created by dmitry on 20.06.16.
 */


function validate(input) {
    if (($(input).attr('class') !== undefined) && $(input).attr('class').indexOf('form-control') != -1) {

        inputName = input.name;

        var newKey = inputName.replace(/\[/g, '\\[').replace(/\]/g,'\\]');

        $('#message_' + newKey).hide("fast");
        $('[name="' + newKey + '"]').attr('aria-invalid', 'false');

        if (input.attributes.regexid !== undefined) {
            try {
                reg = eval("regexp_" + input.attributes.regexid.value);
                if (reg.test(input.value))
                    $(input).next().hide("fast");
                else
                    $(input).next().show("fast");
            } catch (err) {
            }
        }
    }

    if ($('#g-recaptcha-response')[0] != undefined) {
        var response = grecaptcha.getResponse();
        if (response != "") {
            if ($("input[id^='recaptcha-']")[0] != undefined) {
                $($("input[id^='recaptcha-']")[0]).val(response);
            }

            $responseObject = $('#g-recaptcha-response').parent().parent().next();

            if (!$responseObject.is('button')) {
                $responseObject.hide("fast");
            }
        }
    }
}

function setItemListeners() {
    $('.btn.btn-xs').each(function () {
        if ($(this).children('i.glyphicon').length > 0) {
            if ($(this).children('i.glyphicon')[0].className == 'glyphicon glyphicon-plus') {
                $(this).unbind('click');
                $(this).click(function () {
                    $this      = $(this);
                    var parent = $(this).parent().parent().parent();
                    //parent.append(window['$htm_' + $this[0].id]); //old style
                    $(window['$htm_' + $this[0].id]).insertAfter(parent);
                    try {
                        eval('init_' + $this[0].id + '();');
                    } catch (err) {
                    }
                    setItemNumbers();
                    setItemListeners();
                    if (parent.next().children('div.row').length > 0)
                        ($this).parent().children("div.btn-group.pull-right").children('.btn.btn-primary.btn-xs').last().show("fast");
                });

            } else if ($(this).children('i.glyphicon')[0].className == 'glyphicon glyphicon-remove') {
                $(this).unbind('click');
                $(this).click(function () {
                    $($(this).parent()[0]).remove();
                });

            } else if ($(this).children('i.glyphicon')[0].className == 'glyphicon glyphicon-arrow-up') {
                $(this).unbind('click');
                $(this).click(function () {
                    var currentObject = $(this).parent()[0];
                    var nextObject    = currentObject.previousSibling;

                    if ((nextObject === null) || ($(nextObject).prop('tagName') !== "DIV")) {
                        nextObject = $(currentObject).prev()[0];
                    }

                    if (nextObject !== null) {
                        if ($(currentObject).attr('class') === $(nextObject).attr('class'))
                            $(currentObject).swapWith($(nextObject));
                    }
                });

            } else if ($(this).children('i.glyphicon')[0].className == 'glyphicon glyphicon-arrow-down') {
                $(this).unbind('click');
                $(this).click(function () {
                    var currentObject = $(this).parent()[0];
                    var nextObject    = currentObject.nextSibling;

                    if ((nextObject === null) || ($(nextObject).prop('tagName') !== "DIV")) {
                        nextObject = $(currentObject).next()[0];
                    }

                    if (nextObject !== null) {
                        if ($(currentObject).attr('class') === $(nextObject).attr('class'))
                            $(currentObject).swapWith($(nextObject));
                    }
                });
            }
        }
    });
}

$.fn.swapWith = function (to) {
    return this.each(function () {
        var copy_to   = $(to).clone(true);
        var copy_from = $(this).clone(true);
        $(to).replaceWith(copy_from);
        $(this).replaceWith(copy_to);

		// Swap fields names and ids
		var fieldPrefixArray = $(this).find('input')[0].id.split('_');
		var fieldPrefixStr = fieldPrefixArray[0] + '_' + fieldPrefixArray[1] + '_';

		var copyFromEls = copy_from.find('[id*="' + fieldPrefixStr + '"]');
		var copyToEls = copy_to.find('[id*="' + fieldPrefixStr + '"]');

		for (let i = 0; i < copyFromEls.length; i++) {
			let name = copyFromEls[i].name;
			let id = copyFromEls[i].id;

			copyFromEls[i].name = copyToEls[i].name;
			copyFromEls[i].id = copyToEls[i].id;

			copyToEls[i].name = name;
			copyToEls[i].id = id;
		}
    });
};

function setItemNumbers() {
    $('[name*="itemNumber_"]').each(function () {
        var $this = $(this),
            nameAttr = $(this).attr('name');

        for (var i = 0; i < $branchIds.length; i++) {
            var regexp = new RegExp('{itemNumber_' + $branchIds[i] + '}'),
                regexpGlobal = new RegExp('{itemNumber_' + $branchIds[i] + '}', 'g');

            var index = $('.sub_' + $branchIds[i]).last().index();
            if (index >= 1 && nameAttr && regexp.test(nameAttr)) {
                testName = nameAttr.replace(regexpGlobal, index);

                while ($('[name="' + testName + '"]').length) {
                    index++;
                    testName = name.replace(regexpGlobal, index);
                    if (index >= 10000) {
                        break;
                    }
                }

                nameAttr = nameAttr.replace(regexpGlobal, index);
                $this.attr('name', nameAttr);

                if ($this.attr('ng-model') !== undefined) {
                    $this.attr('ng-model', $this.attr('ng-model').replace(regexpGlobal, index));
                }

                if ($this.attr('regexid') !== undefined) {
                    $this.attr('regexid', $this.attr('regexid').replace(regexpGlobal, index));
                }

                var msgDiv = $this.next();
                if (msgDiv.length) {
                    msgDiv.attr('id', msgDiv.attr('id').replace(regexpGlobal, index));
                }
            }
        }
    });
}

function processUserArrayKey(keyItem) {
    var inputItem    = $(keyItem).parent().next().children('input')[0];
    var inputName    = inputItem.id;
    var inputNgModel = $(inputItem).attr('ng-model');
    var postfix      = '[' + keyItem.value + ']';

    if (!inputName.endsWith(postfix)) {
        inputItem.name = inputName + postfix;
        $(inputItem).attr({'ng-model': inputNgModel + '_' + keyItem.value});
    }
}

/**
 * Fixed recaptcha refreshing on ajax-forms
 */
function reloadRecaptcha() {
    if (typeof grecaptcha !== "undefined") {
        grecaptcha.reset();
        grecaptcha.reset();
    }

    $('[id^="recaptcha-"]').each(function() {
        $(this).removeAttr('value');
    });
}


//------------------------------------------------------------
//------------ Processing the response of from in "Custom AJAX: mode             [-azamat/istranger]

function processCustomAjaxResponse(response) {
    var isCorrectResponse = response && $.isPlainObject(response);

    if (isCorrectResponse) {

        var promiseQueue = $.Deferred(),
            startPromise = promiseQueue,
            commands     = response.commands || [];

        // Preparing command queue
        ConnectApp.fn.log('Started processing of AJAX form response. Preparing queue of ' + commands.length + ' commands.');

        $.each(commands, function (index, commandObj) {
            var commandName = commandObj.name,
                commandData = commandObj.data,
                handler     = _getHandler(commandName);


            if (handler) {

                // Next handler will execute only after competes previous handler. Additionally any handler can return promise for async operations.
                // Promise chains see here: http://solutionoptimist.com/2013/12/27/javascript-promise-chains-2/
                // Test example see here: https://jsfiddle.net/IStranger/9k1Lb636/
                promiseQueue = promiseQueue.then(function () {
                    var result = handler(commandData);

                    ConnectApp.fn.log('Executed command "' + commandName + '" with data ', commandData, ' with handler = ', (handler ? ('ConnectApp.forms.handlers.' + commandName) : null), 'handler result = ', result);

                    return $.when(result);  // Promise normalization::  Any type will be converted to $.Deferred(). Non-deferred objects/types will be converted to resolved promise. Deferreds (for example from $.ajax) will be converted to the promise with the same state.

                }, function () {

                    throw new Error('Aborted promise queue!');

                })

            }
        });


        // Starting command queue
        ConnectApp.fn.log('Start queue.');
        startPromise.resolve();

        promiseQueue.then(function () {
            ConnectApp.fn.log('Queue successfully complete.');
        });


    } else {
        throw new Error('method processCustomAjaxResponse() can\'t process incorrect AJAX response = ', response);
    }


    // ---------------------------------------
    /**
     * Returns handler.
     * @param {String} commandName
     * @return {null}
     * @private
     */
    function _getHandler(commandName) {
        var handler;

        if (ConnectApp && ConnectApp.forms) {

            handler = ConnectApp.forms.handlers
                ? ConnectApp.forms.handlers[commandName]
                : null;

            return handler && $.isFunction(handler)
                ? handler
                : null;

        } else {
            throw new Error('Not available AJAX form hadlers');
        }
    }
}


// -----------------------------------------------------------------------------
// ---------------------------------- AJAX Form Handlers------------------------        [-azamat/istranger]

(function () {

    'use strict';


    if (ConnectApp && ConnectApp.forms) {

        ConnectApp.forms.handlers = ConnectApp.forms.handlers || {};

        // ------------------------------------------------
        // ------ Defining list of command handlers. TODO probably these handlers may be defined on server side (like yii Validators)


        // redirectTo
        ConnectApp.forms.handlers.redirectTo = function (data) {

            var url = _getRequiredParam(data, 'url');

            ConnectApp.fn.redirectTo(url);
        };


        // showNotification
        ConnectApp.forms.handlers.showNotification = function (data) {
            var msg     = _getRequiredParam(data, 'msg'),
                msgType = _getOptionalParam(data, 'msgType', ConnectApp.ui.NOTY_TYPE_INFORMATION);

            ConnectApp.ui.showNotification(msg, msgType);
        };


        // executeJsCode
        ConnectApp.forms.handlers.executeJsCode = function (data) {
            var code = _getRequiredParam(data, 'code');

            ConnectApp.utils.executeJsCode(code);
        };


        // subscribeToConnectMail
        ConnectApp.forms.handlers.subscribeToConnectMail = function (data) {
            var $email, $lastName, $firstName, $listSelector, $form, userData, email, mailingListTokens, mailingListTokensFromForm, promises, resultPromise,
                module                                 = mailCheckerApp.validationModule,
                apiUrl                                 = _getRequiredParam(data, 'apiUrl'),
                CONNECT_MAIL_INPUT_ROLE_EMAIL          = _getRequiredParam(data, 'CONNECT_MAIL_INPUT_ROLE_EMAIL'),
                CONNECT_MAIL_INPUT_ROLE_FIRST_NAME     = _getRequiredParam(data, 'CONNECT_MAIL_INPUT_ROLE_FIRST_NAME'),
                CONNECT_MAIL_INPUT_ROLE_LAST_NAME      = _getRequiredParam(data, 'CONNECT_MAIL_INPUT_ROLE_LAST_NAME'),
                CONNECT_MAIL_INPUT_ROLE_CHECKBOX_ALLOW = _getRequiredParam(data, 'CONNECT_MAIL_INPUT_ROLE_CHECKBOX_ALLOW'),
                CONNECT_MAIL_INPUT_ROLE_LIST_SELECTOR  = _getRequiredParam(data, 'CONNECT_MAIL_INPUT_ROLE_LIST_SELECTOR');

            promises = [];

            // For correct working of validation module.
            module.setApiDomain(apiUrl);

            // Defining the ConnectMail fields (few may be undefined)
            $email        = $('[data-connect-mail-role="' + CONNECT_MAIL_INPUT_ROLE_EMAIL + '"]');
            $lastName     = $('[data-connect-mail-role="' + CONNECT_MAIL_INPUT_ROLE_FIRST_NAME + '"]');
            $firstName    = $('[data-connect-mail-role="' + CONNECT_MAIL_INPUT_ROLE_LAST_NAME + '"]');
            $listSelector = $('[data-connect-mail-role="' + CONNECT_MAIL_INPUT_ROLE_LIST_SELECTOR + '"]');
            $form         = $email.parents('form');

            // If subscription enabled on form.
            if ($email.size()) {

                // Preparing data for validation and subscription
                email    = $email.val();
                userData = {
                    firstName: $firstName.val(),
                    lastName : $lastName.val()
                };

                // Mailing Lists (assigned via FormConstructor + defined on form)
                mailingListTokens = $email.attr('data-connect-mail-tokens');
                mailingListTokens = mailingListTokens
                    ? JSON.parse(mailingListTokens)
                    : null;
                mailingListTokens = mailingListTokens || [];

                mailingListTokensFromForm = $listSelector.val();
                mailingListTokensFromForm = $.isArray(mailingListTokensFromForm)
                    ? mailingListTokensFromForm
                    : [];

                mailingListTokens = mailingListTokens.concat(mailingListTokensFromForm);


                // Subscription will performed only if defined mailing lists
                if (mailingListTokens.length) {

                    $.each(mailingListTokens, function (index, mailingListToken) {
                        var promise;

                        // Validation and subscription
                        promise = _validateAndSubscribe(email, mailingListToken, userData, function (success, msg) {
                            ConnectApp.fn.log('_validateAndSubscribe ::>> success = ', success, ' msg = ', msg);
                        });

                        promises.push(promise);
                    });

                }
            }

            // Summary promise will be resolved after all subscriptions
            resultPromise = $.when.apply($, promises);


            // If queue is not completed, show AJAX loader
            if (resultPromise.state() === 'pending') {
                ConnectApp.ui.addAjaxLoader($form, resultPromise);
            }

            return resultPromise;
        };


        // commandForBCOnly
        ConnectApp.forms.handlers.commandForBCOnly = function commandForBCOnly(data) {

            ConnectApp.fn.log('Command handler "commandForBCOnly" do nothing. Handler data = ', data);
        };

    } else {
        throw new Error('Not available "ConnectApp.forms". Form JS handlers didn\'t initialize.');
    }


    //------------------------------------------------------------
    //------------------- Private module functions                              [-azamat/istranger]

    /**
     * Returns required param value. If param not found, will be thrown exception.
     *
     * @param {Object} data         Command data (params list).
     * @param {String} paramName    Param name.
     * @return {*}
     * @private
     */
    function _getRequiredParam(data, paramName) {

        if (data && data[paramName]) {
            return data[paramName];
        } else {
            throw new Error('Command: Missing required param "' + paramName + '".');
        }
    }

    /**
     * Returns required param value. If param not found, will be returned specified default value.
     *
     * @param {Object} data                 Command data (params list).
     * @param {String} paramName            Param name.
     * @param {*}      [defaultValue=null]  Default value that will be returned when paramName not found.
     * @return {*}
     * @private
     */
    function _getOptionalParam(data, paramName, defaultValue) {
        defaultValue = (defaultValue === undefined) ? null : defaultValue;

        if (data && data[paramName]) {
            return data[paramName];
        } else {
            return defaultValue;
        }
    }


    //------------ Initialization of ConnectMail Integration                [-azamat/istranger]
    /**
     * Validates and subscribes specified email to mailing list.
     * @param {String}   email
     * @param {String}   mailingListToken       API token for API access and mailing list subscription.
     * @param {Object}   userData               Additional user data like firstName, lastName
     * @param {Function} [callback]
     * @private
     */
    function _validateAndSubscribe(email, mailingListToken, userData, callback) {

        var xhrValidate,
            xhrSubscribe = $.Deferred();

        xhrValidate = _validateEmail(email, userData, mailingListToken, true, function (isValid, msg) {

            if (isValid) {

                _subscribeToMailingList(email, mailingListToken, function (success, msg) {

                    if ($.isFunction(callback)) {
                        callback(success, msg);
                    }

                }).then(
                    function () {
                        xhrSubscribe.resolve();
                    },
                    function () {
                        xhrSubscribe.reject();
                    }
                );

            } else {

                if ($.isFunction(callback)) {
                    callback(false, msg);
                }

                xhrSubscribe = xhrSubscribe.resolve();

            }
        });

        return $.when(xhrValidate, xhrSubscribe);
    }

    /**
     * Subscribes email from specified email input.
     *
     * @param {String}   email
     * @param {Object}   userData               Additional user data like firstName, lastName
     * @param {String}   apiAccessToken         API Token that opens API access.
     * @param {Boolean}  forceSubscription      Force subscription?
     * @param {Function} [callback]             Success callback
     *
     * @return {jqXHR}                          Deferred object of AJAX request
     *
     * @private
     */
    function _validateEmail(email, userData, apiAccessToken, forceSubscription, callback) {

        userData          = userData || {};
        forceSubscription = forceSubscription || false;

        var ajaxOptions,
            module = mailCheckerApp.validationModule;

        // Preparing ajax request options
        ajaxOptions = {
            type: 'post',
            url : module.getApiDomain() + module.URL_CHECK_EMAIL_STATUS,
            data: {
                token            : apiAccessToken,
                email            : email,
                firstName        : userData.firstName,
                lastName         : userData.lastName,
                forceSubscription: forceSubscription ? 1 : 0
            },

            success: function (response) {
                if (!response || response.msg === undefined) {
                    _throwException('Incorrect format of response of AJAX request at email validation');
                }

                if ($.isFunction(callback)) {
                    callback.apply(this, [response.isValid, response.msg]);
                }
            },

            error: function () {
                console.log(['Error at email subscribing: ', arguments], true);
                _throwException('Error at email subscribing using AJAX');
            }
        };

        // Performing ajax request
        return $.ajax(ajaxOptions);
    }

    /**
     * Subscribes email from specified email input.
     *
     * @param {String}   email
     * @param {String}   mailingListToken       API token for API access and mailing list subscription.
     * @param {Function} [onSuccess]
     *
     * @return {jqXHR}                          Deferred object of AJAX request
     *
     * @private
     */
    function _subscribeToMailingList(email, mailingListToken, onSuccess) {

        var ajaxOptions,
            module = mailCheckerApp.validationModule;

        // Preparing ajax request options
        ajaxOptions = {
            type: 'post',
            url : module.getApiDomain() + module.URL_SUBSCRIBE_EMAIL_TO_LIST,
            data: {
                token: mailingListToken,
                email: email
            },

            success: function (response) {
                if (!response || response.msg === undefined) {
                    _throwException('Incorrect format of response of AJAX request at email subscribing');
                }

                if ($.isFunction(onSuccess)) {
                    onSuccess.apply(this, [response.success, response.msg]);
                }
            },

            error: function () {
                console.log(['Error at email subscribing: ', arguments], true);
                _throwException('Error at email subscribing using AJAX');
            }
        };


        // Performing ajax request
        return $.ajax(ajaxOptions);
    }

    /**
     * Throws exception.
     *
     * @param {String} msg
     * @private
     */
    function _throwException(msg) {
        throw new Error(msg);
    }

}());