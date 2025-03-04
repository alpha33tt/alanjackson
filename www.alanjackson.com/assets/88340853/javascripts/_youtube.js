/**
 * Function for youtube player
 * Created by dmitry on 26/02/16.
 */

var yplayer;
var yplayerOnReadyVideo = '';

function initYoutube() {
    // initializing
    var tag = document.createElement('script');

    tag.src = 'https://www.youtube.com/iframe_api';
    var firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
}

function onPlayerReady(event) {
    // if have video for start on ready
    if (yplayerOnReadyVideo) {
        //yplayer.loadVideoById(yplayerOnReadyVideo, 0, 'large');
        yplayer.cueVideoById(yplayerOnReadyVideo, 0, 'large');
        //yplayer.playVideo();
        console.log('OnReadyVideo = ' + yplayerOnReadyVideo);
        yplayerOnReadyVideo = '';
    }
}

var done = false;

function onPlayerStateChange(event) {
    if (event.data == YT.PlayerState.PLAYING && !done) {
        //setTimeout(stopVideo, 6000);
        done = true;
    }
}

function stopVideo() {
    if (yplayer) {
        yplayer.stopVideo();
    }
}

function onYouTubeIframeAPIReady() {
    yplayer = new YT.Player('youtube_player', {
        height: playerHeight,
        width: playerWidth,
        videoId: '',
        playerVars: {rel: 0},
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    });
}

initYoutube();
