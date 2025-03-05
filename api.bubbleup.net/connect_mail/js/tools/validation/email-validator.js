/**
 * Email validator script.
 */

// Initialization of global main mailchecker object (only if does not exist)
window.mailCheckerApp = window.mailCheckerApp || {};

// Add validation module to main mailchecker object
window.mailCheckerApp.validationModule = (function ($) {
    'use strict';

    // ------------------------------------------------------------------------------
    // --- "Private" module variables

    var _apiDomain                  = null,
        _uniqidSeed                 = null,
        _pluginCommonErrorsFormsIds = [];


    // ------------------------------------------------------------------------------
    // --- Validation module (manage email validators on page)

    /**
     * Email validation module.
     */
    var validationModule = {

        // -- Main Data-attributes of validator

        /**
         * Name of data-attribute that contain embed token for the validator.
         */
        DATA_EMBED_TOKEN: 'token',

        /**
         * Name of data-attribute that contain (optional) additional options of the validator.
         */
        DATA_OPTIONS: 'options',

        /**
         * Name of data-attribute that contain (optional) additional options of the validator.
         */
        DATA_AJAX_LOADER_TYPE: 'ajax-loader-type',

        /**
         * Name of data-attribute of input that contains extra field. It will be added to request.
         */
        DATA_EXTRA_FIELD: 'mailchecker-extra-field',

        // -- URL constants:

        /**
         * URL for checking of email status using AJAX.
         * @type {String}
         */
        URL_CHECK_EMAIL_STATUS: '/api/validate-email',

        /**
         * URL for subscribing of email to mailing list.
         * @type {String}
         */
        URL_SUBSCRIBE_EMAIL_TO_LIST: '/api/subscribe-email-to-list',

        // -- CSS classes constants:

        /**
         * CSS class for input elements that should be validated by MailChecker.
         * For this inputs will be enabled validation using {@link validationModule.createEmailValidator()}
         * @type {String}
         */
        CSS_CLASS_EMAIL_INPUT_VALIDATION_INIT: 'js-mailchecker-email-validation',
        /**
         * CSS class for input element that contain first name.
         * This name will added to Mailchecker DB when checking status (only for new emails that don't exist in Mailchecker DB).
         * This is optional field.
         * Note: this options applied for all email inputs on form.
         * @type {String}
         */
        CSS_CLASS_INPUT_FIRST_NAME           : 'js-mailchecker-first-name',
        /**
         * CSS class for input element that contain last name.
         * This name will added to Mailchecker DB when checking status (only for new emails that don't exist in Mailchecker DB).
         * This is optional field.
         * Note: this options applied for all email inputs on form.
         * @type {String}
         */
        CSS_CLASS_INPUT_LAST_NAME            : 'js-mailchecker-last-name',
        /**
         * CSS class for container that should contain ajax loader.
         * This is optional element.
         * @type {String}
         */
        CSS_CLASS_AJAX_LOADER                : 'js-mailchecker-ajax-loader',

        /**
         * CSS class of DOM elements that "handled" using AJAX.
         * Used for displaying of AJAX loader on those elements.
         */
        CSS_CLASS_IS_AJAX_PROCESSED                : 'mailchecker-is-ajaxProcessed',
        /**
         * CSS class for input elements for which has been enabled validation.
         * @type {String}
         */
        CSS_CLASS_EMAIL_INPUT_VALIDATION_ENABLED   : 'mailchecker-email-validation-enabled',
        /**
         * CSS class for input elements that have been success validated.
         * @type {String}
         */
        CSS_CLASS_EMAIL_INPUT_SUCCESS_VALIDATED    : 'mailchecker-email-success-validated',
        /**
         * CSS class for input elements that have been validated with errors.
         * @type {String}
         */
        CSS_CLASS_EMAIL_INPUT_HAS_VALIDATION_ERRORS: 'mailchecker-email-has-validation-errors',

        // -- Additional options (used as data- attributes of input)

        OPTION_PLUGIN_NOTIFYJS_HINTS_ENABLE               : 'hint',
        OPTION_PLUGIN_NOTIFYJS_COMMON_ERRORS_ENABLE       : 'hintCommonErrors',
        OPTION_PLUGIN_SUBSCRIBE_TO_LIST_ENABLE            : 'subscribe',
        OPTION_PLUGIN_SUBSCRIBE_TO_LIST_FORCE_SUBSCRIPTION: 'subscribeForce',

        // -- Events constants:

        /**
         * Validator event will fire after successful initialization of validator for input element.
         * @see EmailValidator()
         */
        EVENT_VALIDATOR_INIT                   : 'init.validator.mailchecker',
        /**
         * Validator event will fire after performing of validation of input element (not necessarily successful).
         * @see EmailValidator.onFormSubmitHandler()
         */
        EVENT_VALIDATOR_VALIDATION             : 'validation.validator.mailchecker',
        /**
         * Validator event will fire after displaying/assigning of hint message for input element.
         * @see EmailValidator.setInputHint()
         */
        EVENT_VALIDATOR_HINT                   : 'hint.validator.mailchecker',
        /**
         * Form event will fire after performing of validation of all email inputs (not necessarily successful).
         */
        EVENT_FORM_VALIDATION                  : 'formvalidation.validator.mailchecker',
        /**
         * Form event will fire when form ready to submitting (all email inputs successful validated).
         */
        EVENT_FORM_SUBMIT_READY                : 'formsubmitready.validator.mailchecker',
        /**
         * Plugin event will fire after successfully subscribing of email from input element. List Id assigned into plugin config.
         * Handler accept three argument: 1. {EmailValidator}. 2. (boolean) success. 3. (string) msg - message.
         * @see validationModule.enableSubscribe2ListPlugin()
         */
        EVENT_PLUGIN_SUBSCRIBE2LIST_SUBSCRIBING: 'subscribing.subscribe2list.plugin.validator.mailchecker',

        // -- Other:

        /**
         * List of all validators on page
         */
        validators: {},

        /**
         * List script URLs that have been dynamically loaded using {@link validationModule._requireJs()}.
         * @type {String[]}
         * @private
         */
        _requireJsLoadedScriptURLs: [],

        /**
         * List of XHR objects for scripts that yet in load process. After loading XHR will delete from this list
         * and script URL will add to {@link validationModule._requireJsLoadedScriptURLs}.
         * @type {jqXHR[]}
         * @private
         * @see validationModule._requireJs()
         */
        _requireJsRequestXHRs: [],

        /**
         * Returns API domain.
         *
         * @returns {String|null}   Schema+Host, for example: 'https://mailchecker-app.net'
         *                          or =null, if domain not defined.
         */
        getApiDomain: function () {
            return _apiDomain;
        },

        /**
         * Sets API domain.
         *
         * @param {String} apiDomain    Schema+Host, acceptable value formats:
         *                              'http://example.com', 'https://example.com', '//example.com', 'example.com'
         */
        setApiDomain: function (apiDomain) {
            apiDomain = (new RegExp('\/')).test(apiDomain)     // we fix :  "example.com" -->> "//example.com"
                ? apiDomain
                : '//' + apiDomain;

            _apiDomain = apiDomain;
        },

        /**
         * Creates email validator.
         *
         * @param {HTMLElement|jQuery|*} emailInput     Email input element.
         *
         * @returns {EmailValidator}                    Newly created validator object
         */
        createEmailValidator: function (emailInput) {
            var formValidationId, validatorObj,
                module = this;

            validatorObj     = new EmailValidator(emailInput);
            formValidationId = validatorObj.getJqForm().data('validation-id');

            module.validators[formValidationId]                       = module.validators[formValidationId] || {};
            module.validators[formValidationId][validatorObj.getId()] = validatorObj;

            return validatorObj;
        },

        /**
         * Initialization of module (when document.ready)
         */
        initModule: function () {
            var defaultApiDomain, $inputs,
                module = this,
                logMsg = '';

            try {

                // Init default API domain
                if (!module.getApiDomain()) {
                    defaultApiDomain = _getDefaultApiDomain('email-validator.js');

                    if (defaultApiDomain) {
                        module.setApiDomain(defaultApiDomain);
                    } else {
                        logMsg += ' Note: default API domain cannot be defined. Set manual API domain using: mailCheckerApp.validationModule.setApiDomain() ';
                    }
                }

                // Init of input validators
                $inputs = $('.' + module.CSS_CLASS_EMAIL_INPUT_VALIDATION_INIT);
                $inputs.each(function () {
                    var $emailInput = $(this);

                    module.createEmailValidator($emailInput);
                });

                // We fire SUBMIT_READY form event after successful validation form validators (works with multiply forms with few validators)
                $.each(module.validators, function (formValidationId, formValidators) {                     // for each FORM
                    var commonValidationSignal,
                        formValidationSignals = [],
                        $form                 = $('form[data-validation-id=\'' + formValidationId + '\']');

                    // We retrieve promises from validators (only for current form)
                    $.each(formValidators,
                        /**
                         * @param {String}          validatorId
                         * @param {EmailValidator}  validatorObj
                         */
                        function (validatorId, validatorObj) {
                            formValidationSignals.push(validatorObj.getValidationSignal());
                        }
                    );

                    // We fire event after successful resolving of all promises
                    commonValidationSignal = SignalDeferred.prototype.staticWhen(formValidationSignals);
                    commonValidationSignal.then(function (resolvedArgs) {
                        var commonIsValid, commonMessages;

                        commonValidationSignal.resetState();
                        SignalDeferred.prototype.staticResetStates(formValidationSignals);

                        // We check common result of validation
                        commonIsValid  = true;
                        commonMessages = [];
                        $.each(resolvedArgs, function (k, validatorResolvedArgs) {
                            var isValid = validatorResolvedArgs[0],
                                msg     = validatorResolvedArgs[1];

                            commonIsValid = commonIsValid && isValid;
                            if (msg) {
                                commonMessages.push(msg);
                            }
                        });

                        _log(['resolvedArgs = ', resolvedArgs]);
                        _log(['commonIsValid = ', commonIsValid]);
                        _log(['commonMessages = ', commonMessages]);

                        // We fire common form events
                        $form.trigger(module.EVENT_FORM_VALIDATION, [formValidators, commonIsValid, commonMessages]);
                        if (commonIsValid) {
                            $form.trigger(module.EVENT_FORM_SUBMIT_READY, [formValidators]);
                        }
                    });

                    // We set default form handler: "forced" submit (validator will not handle this sending.)
                    $form.on(module.EVENT_FORM_SUBMIT_READY, function () {
                        $form.trigger('submit', [true]);
                    });
                });


                // Init plugins
                $.each(module.validators, function (formValidationId, formValidators) {
                    $.each(formValidators,
                        /**
                         * @param {String}          validatorId
                         * @param {EmailValidator}  validator
                         */
                        function (validatorId, validator) {
                            var $emailInput                      = validator.getJqEmailInput(),
                                enablePluginNotifyJSHints        = _hasOption($emailInput, module.OPTION_PLUGIN_NOTIFYJS_HINTS_ENABLE),
                                enablePluginNotifyJSCommonErrors = _hasOption($emailInput, module.OPTION_PLUGIN_NOTIFYJS_COMMON_ERRORS_ENABLE),
                                enablePluginSubscribe2List       = _hasOption($emailInput, module.OPTION_PLUGIN_SUBSCRIBE_TO_LIST_ENABLE),
                                enablePluginSubscribe2ListForced = _hasOption($emailInput, module.OPTION_PLUGIN_SUBSCRIBE_TO_LIST_FORCE_SUBSCRIPTION);

                            if (enablePluginNotifyJSHints) {
                                module.enableNotifyJSHintsPlugin(validator);
                            }

                            if (enablePluginNotifyJSCommonErrors) {
                                module.enableNotifyJSCommonErrorsPlugin(validator);
                            }

                            if (enablePluginSubscribe2List || enablePluginSubscribe2ListForced) {
                                module.enableSubscribe2ListPlugin(validator, enablePluginSubscribe2ListForced);
                            }

                            /**
                             * Checks (case-insensitive) whether specified email input has specified options.
                             *
                             * @param {*|HTMLElement|jQuery} $emailInput
                             * @param {String}               option
                             * @private
                             */
                            function _hasOption($emailInput, option) {
                                var dataOptions = $emailInput.data(module.DATA_OPTIONS);

                                if (dataOptions) {
                                    dataOptions = dataOptions.toLowerCase().split(' ');
                                } else {
                                    return false;
                                }

                                option = option.trim().toLowerCase();

                                return (dataOptions.indexOf(option) >= 0);
                            }
                        });
                });


                // We enable "forced" submit of forms after successful validation nested validators (works with multiply forms with few validators)
                logMsg += 'Module initialized. Enabled ' + $inputs.size() + ' validators.';

                _log(logMsg);

            } catch (exception) {
                logMsg = (exception instanceof Error)
                    ? exception.message
                    : exception;

                _log('Catch exception: ' + logMsg, true);
                _log(exception);

            }
        },


        /**
         * Enables displaying of popup messages using NotifyJS library.
         *
         * @param {EmailValidator} validator
         */
        enableNotifyJSHintsPlugin: function (validator) {
            var module = this;

            module._requireJs(module.getApiDomain() + '/js/notify.min.js', function () {

                validator.getJqEmailInput().on(module.EVENT_VALIDATOR_HINT, function (event, validator, hint) {
                    var $this = $(this);

                    if (hint) {
                        $this.notify(hint, 'error');
                    }
                });
            });
        },


        /**
         * Enables subscribing email to specified list.
         *
         * @param {EmailValidator}  validator           Validator object.
         * @param {Boolean}         forceSubscription   Force subscription? (in the case of manual confirmation user
         *                                              will subscribed immediate after confirmation his email).
         * @param {Object}          [addAjaxOptions]    Additional options of AJAX request.
         */
        enableSubscribe2ListPlugin: function (validator, forceSubscription, addAjaxOptions) {
            var module      = this,
                $emailInput = validator.getJqEmailInput();

            if (!validator.getEmbedToken()) {
                _throwException('Subscribe2ListPlugin don\'t works without token.');
            }

            // We enable force subscription: in the case of manual confirmation user will subscribed immediate after confirmation his email
            if (forceSubscription) {
                validator.addAdditionalAjaxData({forceSubscription: 1});
            }

            // After successful validation we send AJAX request for subscribing validated email into specified list
            validator.getJqForm()
            // We prevent any default submit handler
                .off(module.EVENT_FORM_SUBMIT_READY)

                // After successful validation we send subscribing-request
                .on(module.EVENT_FORM_SUBMIT_READY, function (event, formValidators) {
                    var email, ajaxOptions;

                    // Email to subscribe
                    email = $emailInput.val();

                    if (email) {

                        // We prepare ajax request options
                        ajaxOptions = $.extend({
                            type: 'post',
                            url : module.getApiDomain() + module.URL_SUBSCRIBE_EMAIL_TO_LIST,
                            data: $.extend(validator.getAdditionalAjaxData(), {
                                email: email
                            }),

                            success: function (response) {
                                if (!response || response.msg === undefined) {
                                    _throwException('Incorrect format of response of AJAX request at email subscribing');
                                }

                                $emailInput.trigger(module.EVENT_PLUGIN_SUBSCRIBE2LIST_SUBSCRIBING, [validator, response.success, response.msg]);
                            },

                            error: function () {
                                _log(['Error at email subscribing: ', arguments], true);
                                _throwException('Error at email subscribing using AJAX');
                            }
                        }, addAjaxOptions || {});

                        // We perform ajax request
                        _ajax(ajaxOptions);
                    }
                });

            // Default handler of successful subscribing event
            $emailInput.on(module.EVENT_PLUGIN_SUBSCRIBE2LIST_SUBSCRIBING, function (event, validator, success, msg) {

                module._requireJs(module.getApiDomain() + '/js/notify.min.js', function () {

                    $emailInput.notify(msg, success ? 'success' : 'error');

                });

            });
        },

        /**
         * Enables displaying of summary error messages using NotifyJS library.
         * @param {EmailValidator} validator
         */
        enableNotifyJSCommonErrorsPlugin: function (validator) {
            var module           = this,
                $form            = validator.getJqForm(),
                formValidationId = $form.data('validation-id');

            if (_pluginCommonErrorsFormsIds.indexOf(formValidationId) === -1) {

                _pluginCommonErrorsFormsIds.push(formValidationId);

                module._requireJs(module.getApiDomain() + '/js/notify.min.js', function () {

                    $form.on(module.EVENT_FORM_VALIDATION, function (event, formValidators, isValid, messages) {
                        var $emailInput = $(this);

                        if (!isValid) {
                            $.notify(messages.join(', '), 'error');
                            $emailInput.trigger('focus');
                        }
                    });

                });
            }

        },

        /**
         * Adds AJAX loader for validation module.
         * If jqXHR was passed, loader will be deleted automatically after completing of this AJAX request.
         * You can also delete loader using {@link removeAjaxLoader}.
         *
         * @param {jqXHR|$.Deferred|*}  [jqXHR]                                 Object of AJAX request
         *                                                                      (if was passed, loader will deleted after completing of this AJAX request)
         * @param {String}              [loaderCssClass='MailCheckerAjaxLoader--spinnerBgWhite']  CSS class of loader (defines loader visual style, see CSS)
         */
        addAjaxLoader: function (jqXHR, loaderCssClass) {
            loaderCssClass = (loaderCssClass === undefined) ? 'MailCheckerAjaxLoader--spinnerBgWhite' : loaderCssClass;

            var module   = this,
                $element = $('.' + module.CSS_CLASS_AJAX_LOADER),
                dataType = $element.data(module.DATA_AJAX_LOADER_TYPE);

            loaderCssClass = dataType || loaderCssClass;

            if ($element.size() > 0) {
                $element
                    .addClass(module.CSS_CLASS_IS_AJAX_PROCESSED)
                    .addClass(loaderCssClass);

                if (jqXHR) {
                    jqXHR.always(function () {
                        module.removeAjaxLoader();
                    });
                }
            }
        },

        /**
         * Removes AJAX loader of module.
         */
        removeAjaxLoader: function () {
            var module         = this,
                $element       = $('.' + module.CSS_CLASS_AJAX_LOADER),
                loaderCssClass = 'AjaxLoader--*';

            $element.removeClass(module.CSS_CLASS_IS_AJAX_PROCESSED);
            _removeClassWildcard($element, loaderCssClass);
        },

        /**
         * Executes specified callback only after downloading of specified script (and including in DOM).
         * Used {@link jQuery.getScript()} for retrieving of script.
         *
         * @param {String}      scriptUrl   URL of script
         * @param {Function}    onReady
         * @private
         *
         * @see validationModule._requireJsLoadedScriptURLs
         * @see validationModule._requireJsRequestXHRs
         */
        _requireJs: function (scriptUrl, onReady) {
            var ajaxOptions,
                module = this;

            if (module._requireJsLoadedScriptURLs.indexOf(scriptUrl) !== -1) {

                // When script already requested and loaded
                if (onReady) {
                    onReady();
                }

            } else {

                // When script yet in load process
                if (!module._requireJsRequestXHRs[scriptUrl]) {
                    ajaxOptions = {
                        dataType: 'script',
                        cache   : true,
                        url     : scriptUrl
                    };

                    module._requireJsRequestXHRs[scriptUrl] = jQuery.ajax(ajaxOptions);
                }

                // When script successful loaded
                module._requireJsRequestXHRs[scriptUrl].done(function () {
                    if (module._requireJsRequestXHRs[scriptUrl]) {
                        delete module._requireJsRequestXHRs[scriptUrl];
                        module._requireJsLoadedScriptURLs.push(scriptUrl);
                    }

                    if (onReady) {
                        setTimeout(function () {    // Hack for newly loaded script: This will delay the execution until the next tick.
                            onReady.apply(this);
                        }, 0);
                    }
                });
            }
        }
    };


    // ------------------------------------------------------------------------------
    // --- Validator object

    /**
     * Email validator object.
     *
     * @param   {*|HTMLElement|jQuery}  emailInput  Email input to validate.
     *
     * @returns {EmailValidator}
     * @constructor
     */
    var EmailValidator = function (emailInput) {

        var formUniqId,
            validator = this;

        validator._id          = _uniqId('validator', true);
        validator._$emailInput = $(emailInput);
        validator._$form       = validator.getJqEmailInput().parents('form');
        /** Validation promise which will be resolved when current email address will be successful validated. */
        validator._validationDeferred = new SignalDeferred();

        if (!validator.getJqEmailInput().is(':input')) {
            _throwException('Validator cannot validate "non-input" type elements.');
        }

        if (!validator.getJqForm()) {
            _throwException('Cannot validate input without form.');
        }

        // Additional AJAX data
        validator._ajaxData = {};

        // Embed token
        validator._embedToken = validator.getJqEmailInput().data(validationModule.DATA_EMBED_TOKEN) || null;
        if (!validator.getEmbedToken()) {
            _throwException('Validator don\'t works without token.');
        }
        validator.addAdditionalAjaxData({token: validator.getEmbedToken()});

        // Additional info fields
        validator._$firstName = validator.getJqForm().find('.' + validationModule.CSS_CLASS_INPUT_FIRST_NAME);
        validator._$lastName  = validator.getJqForm().find('.' + validationModule.CSS_CLASS_INPUT_LAST_NAME);

        // We assign IDs
        validator.getJqEmailInput()
            .attr('data-validation-id', validator.getId())
            .data('validation-id', validator.getId());

        if (!validator.getJqForm().data('validation-id')) {
            formUniqId = _uniqId('validation-form', true);
            validator.getJqForm()
                .attr('data-validation-id', formUniqId)
                .data('validation-id', formUniqId);
        }

        // We handle submit of form
        validator.getJqForm().on('submit', validator.onFormSubmitHandler.bind(validator));

        // Validator successful initialized
        validator.getJqEmailInput()
            .addClass(validationModule.CSS_CLASS_EMAIL_INPUT_VALIDATION_ENABLED)
            .data('email-validator', validator)
            .trigger(validationModule.EVENT_VALIDATOR_INIT, [validator]);
    };

    /**
     * Default handler for submit event.
     * @param event
     * @param forceSubmit
     * @returns {Boolean}
     */
    EmailValidator.prototype.onFormSubmitHandler = function (event, forceSubmit) {
        var validator   = this,
            $emailInput = validator.getJqEmailInput(),
            email       = $emailInput.val();

        // We don't handle this event on "forced" form submit.
        if (forceSubmit) {
            return;
        }

        // Callback on success validation
        function onSuccessValidation() {
            $emailInput
                .removeClass(validationModule.CSS_CLASS_EMAIL_INPUT_SUCCESS_VALIDATED)
                .removeClass(validationModule.CSS_CLASS_EMAIL_INPUT_HAS_VALIDATION_ERRORS);

            $emailInput.addClass(validationModule.CSS_CLASS_EMAIL_INPUT_SUCCESS_VALIDATED);
            validator.setInputHint(null);

            validator._validationDeferred.resolve(true, null);

            $emailInput.trigger(validationModule.EVENT_VALIDATOR_VALIDATION, [validator, true, null]);
        }

        // Callback on validation error
        function onErrorValidation(msg) {
            $emailInput
                .removeClass(validationModule.CSS_CLASS_EMAIL_INPUT_SUCCESS_VALIDATED)
                .removeClass(validationModule.CSS_CLASS_EMAIL_INPUT_HAS_VALIDATION_ERRORS);

            $emailInput.addClass(validationModule.CSS_CLASS_EMAIL_INPUT_HAS_VALIDATION_ERRORS);
            validator.setInputHint(msg);

            validator._validationDeferred.resolve(false, msg);

            $emailInput.trigger(validationModule.EVENT_VALIDATOR_VALIDATION, [validator, false, msg]);
        }


        // We check email
        if (email) {

            validator.checkStatus(email, function (isValid, msg) {

                if (isValid) {
                    onSuccessValidation();
                } else {
                    onErrorValidation(msg);
                }

            });

        } else {
            onSuccessValidation();          // Empty inputs we resolve as validated emails
        }

        // We prevent any default submit behavior
        return false;
    };

    /**
     * Returns validator ID.
     * @returns {String}
     */
    EmailValidator.prototype.getId = function () {
        return this._id;
    };

    /**
     * Returns jQ-object of form that contain email input to validate.
     * @returns {*|HTMLElement|jQuery|null} Returns jQ-object, or =null, if form not defined.
     */
    EmailValidator.prototype.getJqForm = function () {
        return (this._$form && this._$form.size() > 0)
            ? this._$form
            : null;
    };

    /**
     * Returns jQ-object of email input to validate.
     * @returns {*|HTMLElement|jQuery}
     */
    EmailValidator.prototype.getJqEmailInput = function () {
        return this._$emailInput;
    };

    /**
     * Returns jQ-object of input that contain first name using {@link validationModule.CSS_CLASS_INPUT_FIRST_NAME}.
     * @returns {*|HTMLElement|jQuery|null} Returns jQ-object, or =null, if input not defined.
     */
    EmailValidator.prototype.getJqFirstName = function () {
        return (this._$firstName && this._$firstName.size() > 0)
            ? this._$firstName
            : null;
    };

    /**
     * Returns jQ-object of input that contain last name using {@link validationModule.CSS_CLASS_INPUT_LAST_NAME}.
     * @returns {*|HTMLElement|jQuery|null} Returns jQ-object, or =null, if input not defined.
     */
    EmailValidator.prototype.getJqLastName = function () {
        return (this._$lastName && this._$lastName.size() > 0)
            ? this._$lastName
            : null;
    };

    /**
     * Returns embed token for the validator {@link validationModule.DATA_EMBED_TOKEN}.
     * @return {*|null} Token, or =null if undefined.
     */
    EmailValidator.prototype.getEmbedToken = function () {
        return this._embedToken;
    };

    /**
     * Returns additional AJAX data that will used in all validator requests.
     * @return {Object}
     */
    EmailValidator.prototype.getAdditionalAjaxData = function () {
        return this._ajaxData;
    };

    /**
     * Adds additional AJAX data that will used in all validator requests.
     * @param {Object} dataObj data in format { key : value }.
     * @return {Object} result merged object with AJAX data.
     */
    EmailValidator.prototype.addAdditionalAjaxData = function (dataObj) {
        this._ajaxData = $.extend(this._ajaxData, dataObj);

        return this.getAdditionalAjaxData();
    };

    /**
     * Returns validation promise which will be resolved when current email address will be successful validated.
     * This promise can be used only for synchronization of few validators.
     *
     * NOTE: Don't use this object for event handling! After successful validation of all form validators, this object
     *       will be reset (and subscribed callbacks will removed).
     *       Perhaps should use "Signal" like object: http://stackoverflow.com/questions/11762619/is-it-possible-to-reset-a-jquery-deferred-object-state
     *
     * @returns {$.Deferred|*}  promise object.
     */
    EmailValidator.prototype.getValidationSignal = function () {
        return this._validationDeferred;
    };

    /**
     * Checks status of specified email.
     * @param {String}      email               Email address to check.
     * @param {Function}    callback            Callback function that called after performing of AJAX query to MailChecker service.
     *                                          This function accept two argument: 1. (boolean) isValid. 2. (string) msg - error message.
     * @param {Object}      [ajaxOptions={}]    Additional options of AJAX request.
     * @returns {jqXHR}
     */
    EmailValidator.prototype.checkStatus = function (email, callback, ajaxOptions) {
        var requestData,
            validator = this;

        // Prepare request data
        requestData = $.extend(validator.getAdditionalAjaxData(), validator.getExtraFields(), {
            email: email
        });

        // Prepare AJAX options
        ajaxOptions = $.extend({
            type: 'post',
            url : validationModule.getApiDomain() + validationModule.URL_CHECK_EMAIL_STATUS,
            data: requestData,

            success: function (response) {

                if (!response || response.isValid === undefined) {
                    _throwException('Incorrect format of response of AJAX request at email checking');
                }

                callback.apply(validator, [response.isValid, response.msg]);
            },

            error: function () {
                _log(['Error at email checking: ', arguments], true);
                _throwException('Error at email checking using AJAX');
            }
        }, ajaxOptions || {});

        return _ajax(ajaxOptions);
    };

    /**
     * Sets hint message for input element {@link EmailValidator.getJqEmailInput()}.
     * @param {String|null} hint    Hint message. If =null, hint message will be removed.
     */
    EmailValidator.prototype.setInputHint = function (hint) {
        var validator   = this,
            $emailInput = validator.getJqEmailInput();

        if (hint === null) {
            $emailInput
                .removeAttr('data-hint')
                .removeAttr('title');
        } else {
            $emailInput
                .attr('data-hint', hint)
                .attr('title', hint);
        }

        $emailInput.trigger(validationModule.EVENT_VALIDATOR_HINT, [validator, hint]);
    };

    /**
     * Returns extra fields for email form.
     */
    EmailValidator.prototype.getExtraFields = function () {
        var validator = this;

        return $.extend({}, validator._getDeprecatedExtraFields(), validator._getExtraFields());
    };

    /**
     * Returns extra fields.
     *
     * @returns {Object}
     * @private
     */
    EmailValidator.prototype._getExtraFields = function () {
        var validator         = this,
            extraFields       = {},
            $extraFieldInputs = validator.getJqForm().find('[data-' + validationModule.DATA_EXTRA_FIELD + ']');


        $extraFieldInputs.each(function () {
            var $input         = $(this),
                extraFieldName = $input.data(validationModule.DATA_EXTRA_FIELD);

            extraFields[extraFieldName] = $input.val();
        });

        return extraFields;
    };

    /**
     * Returns deprecated extra fields (firstName, lastName).
     *
     * @returns {Object}
     * @private
     */
    EmailValidator.prototype._getDeprecatedExtraFields = function () {
        var validator  = this,
            dataObject = {};


        if (validator.getJqFirstName()) {
            dataObject.firstName = validator.getJqFirstName().val();
        }

        if (validator.getJqLastName()) {
            dataObject.lastName = validator.getJqLastName().val();
        }

        return dataObject;
    };

    // ------------------------------------------------------------------------------
    // --- "Signal" object: Simple object like "promise/deferred", but has reset state method. See http://stackoverflow.com/questions/11762619/is-it-possible-to-reset-a-jquery-deferred-object-state

    function SignalDeferred() {

        var signal = this;

        /**
         * The Deferred object is not yet in a completed state (neither "rejected" nor "fulfilled").
         * @type {String}
         */
        signal.STATE_PENDING = 'pending';

        /**
         * The Deferred object is in the resolved state, meaning that either deferred.resolve() has been called
         * for the object and the _fulfillCallbackQueue have been called (or are in the process of being called).
         * @type {String}
         */
        signal.STATE_FULFILLED = 'fulfilled';

        /**
         * The Deferred object is in the rejected state, meaning that either deferred.reject() has been called
         * for the object and the _rejectCallbackQueue have been called (or are in the process of being called).
         * @type {String}
         */
        signal.STATE_REJECTED = 'rejected';

        signal._state                = signal.STATE_PENDING;
        signal._fulfillCallbackQueue = [];
        signal._rejectCallbackQueue  = [];

        signal._numberFulfilledWait = 0;                       // Internal counter for SignalDeferred.prototype.staticWhen() method.
        signal._fulfilledFnArgs     = [];                          // Internal variable for SignalDeferred.prototype.staticWhen() method.
    }

    /**
     * Returns current state of object.
     *
     * @returns {String}
     *
     * @see SignalDeferred.STATE_PENDING
     * @see SignalDeferred.STATE_FULFILLED
     * @see SignalDeferred.STATE_REJECTED
     */
    SignalDeferred.prototype.getState = function () {
        return this._state;
    };

    /**
     * Add handlers to be called when the Deferred object is fulfilled or rejected.
     *
     * @param {Function} [onFulfilled]
     * @param {Function} [onRejected]
     *
     * @see https://github.com/promises-aplus/promises-spec
     */
    SignalDeferred.prototype.then = function (onFulfilled, onRejected) {
        var signal = this;

        if (typeof onFulfilled === 'function') {
            signal._fulfillCallbackQueue.push(onFulfilled);
        }

        if (typeof onRejected === 'function') {
            signal._rejectCallbackQueue.push(onFulfilled);
        }
    };

    /**
     * Returns limited version of SignalDeferred that could not change self state.
     * Allowed only assign callbacks and read it state.
     *
     * @returns {SignalDeferred}
     */
    SignalDeferred.prototype.promise = function () {
        return this; // todo implement promise version of deferred objects (perhaps simple using private flags)
    };

    /**
     * Resolve a Deferred object and call any _fulfillCallbackQueue with the specified args.
     *
     * @param {*} [args] Optional arguments that are passed to the _fulfillCallbackQueue.
     */
    SignalDeferred.prototype.resolve = function (args) {
        var i,
            signal = this;

        if (signal.getState() === signal.STATE_PENDING) {
            signal._state = signal.STATE_FULFILLED;

            for (i = 0; i < signal._fulfillCallbackQueue.length; i++) {
                signal._fulfillCallbackQueue[i].apply(signal, arguments);
            }
        }
    };

    /**
     * Reject a Deferred object and call any _rejectCallbackQueue with the specified args.
     *
     * @param {*} [args] Optional arguments that are passed to the _rejectCallbackQueue.
     */
    SignalDeferred.prototype.reject = function (args) {
        var i,
            signal = this;

        if (signal.getState() === signal.STATE_PENDING) {
            signal._state = signal.STATE_REJECTED;

            for (i = 0; i < signal._rejectCallbackQueue.length; i++) {
                signal._rejectCallbackQueue[i].apply(signal, arguments);
            }
        }
    };

    /**
     * Resets state of signal to {@link SignalDeferred.STATE_PENDING}.
     * All callbacks are keeps.
     */
    SignalDeferred.prototype.resetState = function () {
        var signal = this;

        signal._state = signal.STATE_PENDING;

        // We reset also all internal counters and variables for SignalDeferred.prototype.staticWhen() method.
        signal._numberFulfilledWait = 0;
        signal._fulfilledFnArgs     = [];
    };

    /**
     * Returns a signal-promise, that will be fulfilled only after all the items in `signals` are fulfilled.
     * If any of the `signals` items gets rejected, the signal-promise will be rejected.
     *
     * Array of resolved arguments of each specified signal will be passed to onFulfill calback of returned signal.
     *
     * @param {SignalDeferred[]} signals
     *
     * @returns {SignalDeferred}
     *
     * @static
     */
    SignalDeferred.prototype.staticWhen = function (signals) {
        var i, fnOnFulfill, fnOnReject,
            numberObserveSignals = signals.length,
            newSignal            = new SignalDeferred();

        newSignal._numberFulfilledWait = 0;
        newSignal._fulfilledFnArgs     = [];

        fnOnFulfill = function () {
            newSignal._numberFulfilledWait++;
            newSignal._fulfilledFnArgs.push(arguments);

            if (newSignal._numberFulfilledWait === numberObserveSignals) {
                newSignal.resolve(newSignal._fulfilledFnArgs);
            }
        };

        fnOnReject = function () {
            newSignal.reject();
        };

        for (i = 0; i < numberObserveSignals; i++) {
            signals[i].then(fnOnFulfill, fnOnReject);
        }

        return newSignal;
    };

    /**
     * Resets state of specified signals to {@link SignalDeferred.STATE_PENDING}.
     * All callbacks are keeps.
     * @param {SignalDeferred[]} signals
     *
     * @static
     */
    SignalDeferred.prototype.staticResetStates = function (signals) {
        var i;

        for (i = 0; i < signals.length; i++) {
            signals[i].resetState();
        }
    };

    // ------------------------------------------------------------------------------
    // --- "Private" module methods

    /**
     * Performs AJAX query with the same options as {@link jQuery.ajax}.
     *
     * @param {Object} param
     * @return {*|jqXHR}
     * @private
     */
    function _ajax(param) {
        var jqXHR,
            module = validationModule;

        jqXHR = $.ajax.apply(this, arguments);

        module.addAjaxLoader(jqXHR);

        return jqXHR;
    }

    /**
     * Throws module exception.
     *
     * @param {String} msg  Message
     * @private
     */
    function _throwException(msg) {
        throw new Error('MailChecker.EmailValidator: ' + msg);
    }

    /**
     * Logs specified message to browser console.
     *
     * @param {String|*}    msg                  Message to log
     * @param {Boolean}     [isErrorLevel=false] If =true, message will be printed using console.error(),
     *                                           otherwise - console.log()
     * @private
     */
    function _log(msg, isErrorLevel) {
        var prefix, errorLogFn;

        // default param values
        isErrorLevel = (isErrorLevel === undefined) ? false : isErrorLevel;

        // log message
        prefix = 'MailChecker.EmailValidator:>> ';

        if (isErrorLevel) {

            if (console.error) {
                errorLogFn = console.error;
            } else if (console.warn) {
                errorLogFn = console.warn;
            } else {
                errorLogFn = console.log;
            }

            errorLogFn.apply(console, [prefix, msg]);

        } else {
            console.log(prefix, msg);
        }
    }


    /**
     * Returns domain (schema+host) from which has been requested current JS script.
     *
     * @param {String} jsScriptName Name of current script (used for defining of script tag).
     * @returns {String|null}       Domain (Schema+Host) or =null, if domain not defined.
     * @private
     *
     * @see http://stackoverflow.com/questions/18148317/get-host-from-where-script-has-been-requested
     * @see https://github.com/mapstraction/mxn/blob/master/source/mxn.js#L17
     */
    function _getDefaultApiDomain(jsScriptName) {
        var hosts = [];

        jsScriptName = jsScriptName.replace(/([.])/g, "\\$1");              // escape special characters

        $('script').each(function () {
            var matches, domainRegExp, domain,
                attrSrc = this.src;

            if (new RegExp(jsScriptName).test(attrSrc)) {
                domainRegExp = new RegExp('^((https?:)?(\/\/)?[^\/]+).*$'); // determine: "http://example.com", "https://example.com", "//example.com", "example.com"
                matches      = domainRegExp.exec(attrSrc);
                domain       = matches ? matches[1] : null;

                if (domain) {
                    hosts.push(domain);
                }
            }
        });

        return hosts[0] || null;
    }


    /**
     * A JavaScript equivalent of PHP’s uniqid.
     *
     * example 1: uniqid();
     * returns 1: 'a30285b160c14'
     * example 2: uniqid('foo');
     * returns 2: 'fooa30285b1cd361'
     * example 3: uniqid('bar', true);
     * returns 3: 'bara20285b23dfd1.31879087'
     *
     * @param [prefix]
     * @param [moreEntropy]
     * @returns {String}
     *
     * @see http://phpjs.org/functions/uniqid/
     * @private
     */
    function _uniqId(prefix, moreEntropy) {

        if (typeof prefix === 'undefined') {
            prefix = '';
        }

        var retId;
        var formatSeed = function (seed, reqWidth) {
            seed = parseInt(seed, 10)
                .toString(16); // to hex str
            if (reqWidth < seed.length) {
                // so long we split
                return seed.slice(seed.length - reqWidth);
            }
            if (reqWidth > seed.length) {
                // so short we pad
                return (new Array(1 + (reqWidth - seed.length)))
                    .join('0') + seed;
            }
            return seed;
        };

        // END REDUNDANT
        if (!_uniqidSeed) {
            // init seed with big random int
            _uniqidSeed = Math.floor(Math.random() * 0x75bcd15);
        }
        _uniqidSeed++;

        // start with prefix, add current milliseconds hex string
        retId = prefix;
        retId += formatSeed(parseInt(new Date()
            .getTime() / 1000, 10), 8);
        // add seed hex string
        retId += formatSeed(_uniqidSeed, 5);
        if (moreEntropy) {
            // for more entropy we add a float lower to 10
            retId += (Math.random() * 10)
                .toFixed(8)
                .toString();
        }

        return retId;
    }

    /**
     * Removes CSS classes of element using wildcards:
     *
     * @example
     *  mcApp.utils.removeClassWildcard( $( '#foo' ), 'foo-* bar-*', 'foobar' );
     *
     * @param {jQuery|*}    $element
     * @param {String}      removals        Classes to delete, for example: 'foo-* bar-*'
     * @returns {jQuery|*}                  Passed element
     *
     * @see https://gist.github.com/peteboere/1517285
     */
    function _removeClassWildcard($element, removals) {
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
    }

    return validationModule;
}(jQuery));


jQuery(document).ready(function () {
    'use strict';

    window.mailCheckerApp.validationModule.initModule();
});