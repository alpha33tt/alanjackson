/**
 * Created by dmitry on 29/03/16.
 */

// id of player container
var playerId;

//var autoplay = false;

function addTrackTriggers() {
    // click to play track
    $('.track').click(function (e) {
        if (e.originalEvent !== undefined) {
            $("html, body").delay(200).animate({scrollTop: $('.video-player').offset().top}, 0);
            var link = $(this);
            var playerSelector = '#' + playerId;
            $(playerSelector).fadeOut(0, function () {
                $(playerSelector).trigger(stopEventName);
                $(playerSelector).trigger(startEventName, [link.attr('data-service'), link.attr('data'), link.attr('data-params')]);
                $(playerSelector).fadeIn(0, function () {
                    $(playerSelector).show();
                });
            });
        }
    });
}

jQuery(document).ready(function () {
    addTrackTriggers();
});

$('html,body').scrollTop(0);

//jplayer drag
$("#jquery_videoPlayer_1").on(
    $.jPlayer.event.ready + ' ' + $.jPlayer.event.play,
    function (event) {

        $('.jp-volume-bar').mousedown(function () {
            var parentOffset = $(this).offset(),
                width = $(this).width();
            $(window).mousemove(function (e) {
                var x = e.pageX - parentOffset.left,
                    volume = x / width
                if (volume > 1) {
                    $("#jquery_videoPlayer_1").jPlayer("volume", 1);
                } else if (volume <= 0) {
                    $("#jquery_videoPlayer_1").jPlayer("mute");
                } else {
                    $("#jquery_videoPlayer_1").jPlayer("volume", volume);
                    $("#jquery_videoPlayer_1").jPlayer("unmute");
                }
            });
            return false;
        })
            .mouseup(function () {
                $(window).unbind("mousemove");
            });

        var timeDrag = false;
        $('.jp-play-bar').mousedown(function (e) {
            timeDrag = true;
            updatebar(e.pageX);
        });
        $(document).mouseup(function (e) {
            if (timeDrag) {
                timeDrag = false;
                updatebar(e.pageX);
            }
        });
        $(document).mousemove(function (e) {
            if (timeDrag) {
                updatebar(e.pageX);
            }
        });

        var updatebar = function (x) {

            var progress = $('.jp-progress');

            var position = x - progress.offset().left;
            var percentage = 100 * position / progress.width();

            //Check within range
            if (percentage > 100) {
                percentage = 100;
            }
            if (percentage < 0) {
                percentage = 0;
            }

            $("#jquery_videoPlayer_1").jPlayer("playHead", percentage);

            $('.jp-play-bar').css('width', percentage + '%');
        };
    });

function getTrackThumbnail(trackSource, $container) {

    var thumbnail = "";

    try {
        var $tracks = $container.closest('.widget-video').find('.playlist').find('.track');

        for (i = 0; i < $tracks.length; i++) {

            if (trackSource === JSON.parse($tracks[i].dataset.params).source) {

                thumbnail = JSON.parse($tracks[i].dataset.params).preview;

                break;
            }
        }
    } catch (err) {}

    return thumbnail;
}