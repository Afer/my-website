
var ANIMATION_EVENT = 'webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend';

var bday = {
    init: function() {
        $(".envelopeForeground").on("click", function() {
            $("#bdayContainer").addClass("stopshakingit");
            $(".bdayCard").addClass("popout")
            .one(ANIMATION_EVENT, function() {
                $(".bdayCard").on("click", function() {
                    $(".bdayCard").off();

                    $(".card-front").addClass("openCardFront");
                    $(".card-inside-front").addClass("openCardInside");

                    $(".bdayCard").addClass("hideClick");
                });

                $(".bdayCard").addClass("permanentOut").removeClass("popout");
            });
        });
    }
};

$(function() {

    bday.init();

});