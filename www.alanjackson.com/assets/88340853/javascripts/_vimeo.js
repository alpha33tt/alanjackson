/**
 * Created by dmitry on 15/03/16.
 */

function sendVimeo(action, object)
{
    if (!object) {
        object = $('#vimeo_player');
    }

    var data = {
        method: action
    };

    var message = JSON.stringify(data);

    object[0].contentWindow.postMessage(message, '*');
}



/*
 *  Hangle messages from player
  *  refactored code from vimeo API examples
 *
 */

var playerOrigin = '*';
var vimeoOnReady = null;

// Listen for messages from the player
if (window.addEventListener) {
    window.addEventListener('message', onMessageReceived, false);
}
else {
    window.attachEvent('onmessage', onMessageReceived, false);
}

// Handle messages received from the player
function onMessageReceived(event) {
    // Handle messages from the vimeo player only
    if (!(/^https?:\/\/player.vimeo.com/).test(event.origin)) {
        return false;
    }

    var data = JSON.parse(event.data);

    switch (data.event) {
        case 'ready':
            if (vimeoOnReady)
                vimeoOnReady();
            break;
    }
}

