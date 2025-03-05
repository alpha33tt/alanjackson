/**
 * Created by riley on 6/13/2017.
 */

var recaptchaLoaded = function () {

	var dataParams = [
		'sitekey', 'callback', 'expired-callback', 'theme', 'type', 'size', 'tabindex',
	];

	var elements = document.querySelectorAll('.g-recaptcha');

	if (elements && elements.length > 0) {
		for (var i = 0; i < elements.length; i++) {

			var ele = elements[i];
			var renderOptions = {};
			for (var j = 0; j < dataParams.length; j++) {
				var param = dataParams[j];
				var eleAttr = ele.getAttribute(('data-' + param));
				if (eleAttr) {
					renderOptions[param] = eleAttr;
				}
			}

			grecaptcha.render(ele, renderOptions);

		}
	}

};
