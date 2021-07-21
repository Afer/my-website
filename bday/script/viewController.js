var ANDROID_MAP = {
	'mainMenuContainer': null,
	'introStoryContainer': mainUI.introStoryBack,
	'gameMenuContainer': mainUI.gameMenuBack, //
	'multiplayerMenuContainer': mainCtl.goBackFromMultiplayerMenu, //
	'levelEditorContainer': editorMenu.showMenu, //
	'gameplayContainer': mainUI.gameplayMenuBack, //
	'skillsContainer': mainUI.loadGameMenuContainer, //
	'multiplayerLevelsContainer': multiplayer.ctl.multiplayerLevelsMenuBack, //
	'shopContainer': mainUI.loadGameMenuContainer, //
	'popupContainer': popup.hide
};

var ANIMATION_EVENT = 'webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend';

var viewControl = {

	currentContainer: 'mainMenuContainer',
	canNav: true,

	loadInGame: async function(callbackOnStart, callbackOnFinish) {
		await viewControl.showLoadingScreen();

		// THis could affect UI so wait until it's blacked out (this loading screen is totally uncessary otherwise really)
		callbackOnStart();

		viewControl.hideLoadingScreen(function() {
			callbackOnFinish();
			DJConfig.playTime = 0;
		});
	},

    showLoadingScreen: function() {
		$("#bodycover").off()
		.removeClass("fadeBodyCover")
		.addClass("showBodyCover")
		.show();

		return new Promise(function(resolve) {

			$("#bodycoverLoading").off()
			.removeClass("shrinkLoadingIcon")
			.addClass("growLoadingIcon")
			.show()
			.one(ANIMATION_EVENT,
				function(event){
					$("#bodycoverLoading").off();
					// Timeout needed because bodycover animation event fires for loading icon inside, even though it
					// SHOULD BE done at this point. just need that extra few ticks to make it work, plus a lil extra for good measure
					setTimeout(function() {
						resolve();
					}, 100);
			});
		},
		function(reject) { console.log('rejected', reject)});
    },

	hideLoadingScreen: function(callback) {
		$("#bodycoverLoading").off()
		.removeClass("growLoadingIcon")
		.addClass("shrinkLoadingIcon")
		.one(ANIMATION_EVENT,
			function(event){
				$("#bodycoverLoading").hide().off();

				// do the callback here cuz it's mostly for the game and it loads better
				if (callback){
					callback();
				}

				// Timeout needed because bodycover animation event fires for loading icon inside, even though it
				// SHOULD BE done at this point. just need that extra few ticks to make it work, plus a lil extra for good measure
				setTimeout(function() {
					$("#bodycover")
						.removeClass("showBodyCover")
						.addClass("fadeBodyCover")
						.one(ANIMATION_EVENT,
							function(event){
								$("#bodycover").hide().off();

								/*if (callback){
									callback();
								}*/
						});
				}, 100);
		});
	},

	slideContainerOut: function(container, newContainer){
		if (!viewControl.canNav){
			return false;
		}

		if (viewControl.currentContainer == 'popupContainer') {
			viewControl.hidePopup(function() {
				viewControl.slideContainerOut(container, newContainer);
			});

			return;
		}

		viewControl.canNav = false;

		var nodes = $(".container");
		for (var i = 0; i < nodes.length; i++){
			if (nodes[i] != container && nodes[i] != newContainer){
				$(nodes[i]).css("display", "none").removeClass("slideOutLeft").removeClass("slideInLeft");
			}
		}

		$(newContainer).css("display", "block");
		$(container)
			.addClass("slideOutLeft animated")
			.one(ANIMATION_EVENT,
			function(){
				viewControl.currentContainer = newContainer.id;
				viewControl.canNav = true;
				$(container).css("display", "none").removeClass("slideOutLeft").off();
		});

		music.handleTransitionForward(container, newContainer);

		viewControl.handleNav(newContainer);

		return true;
	},

	slideContainerIn: function(newContainer){
		if (!viewControl.canNav){
			return false;
		}

		if (viewControl.currentContainer == 'popupContainer') {
			viewControl.hidePopup(function() {
				viewControl.slideContainerIn(newContainer);
			});

			return;
		}

		viewControl.canNav = false;

		music.handleTransitionBack(viewControl.currentContainer, newContainer);

		$(newContainer)
			.css("display", "block")
			.removeClass("slideOutLeft").removeClass("slideInLeft")
			.addClass("slideInLeft animated")
			.on(ANIMATION_EVENT,
			function(event){
				if (event.target.id != newContainer.id) {
					return;
				}
				
				viewControl.currentContainer = newContainer.id;
				viewControl.canNav = true;
				$(newContainer).removeClass("slideInLeft").off();
		});
		
		viewControl.handleNav(newContainer);

		return true;
	},

	showPopup: function(x, y) {
		if (!viewControl.canNav){
			return false;
		}

		viewControl.canNav = false;

		var regex = new RegExp(/transform-origin:(.*);/);
		var curStyleString = $("#popupStyle").html();
		popup.transformX = x ? (x + 'px ') : '50% ';
		popup.transformY = y ? (y + 'px;') : '50%; ';

		curStyleString = curStyleString.replace(regex, 'transform-origin: ' + popup.transformX + popup.transformY);
		$("#popupStyle").html(curStyleString);

		$("#masterPopupOverlay").addClass("popupSpreadOverlay");
		$("#masterPopupContentContainer").addClass("popupSpread")
		.one(ANIMATION_EVENT,
		function(event){
			popup.underContainer = viewControl.currentContainer;
			viewControl.currentContainer = "popupContainer";
			viewControl.canNav = true;
			$("#masterPopupContentContainer").removeClass("popupSpread").off();
			$("#masterPopupOverlay").removeClass("popupSpreadOverlay").off();
		});

		$("#masterPopupContainer").show();

		return true;
	},

	hidePopup: function(callback) {
		if (!viewControl.canNav){
			return false;
		}

		//viewControl.canNav = false;

		if (!popup.isOpen()) {
			// TODO - THIS IS A BUG - NOT SURE HOW THIS HAPPENS BUT THE POPUP GETS ALL MAMMA JAMMAED SO 
			// THIS CODE MIGHT FIX IT TEMPORARILY BUT OOEEEE IT'S HARD TO REPRODUCE
			// Something happens and like a zillion 'animationend' events trigger forcing the popup closed
			// but making everything else think it's still open


			// EYooooo I figured it out. So the "confirmWithOptions" feature only works if the popup
			// is ALREADY OPEN. If it's not, it triggers this and then the animation events are FUckkkked
			// Wondering if there's a way to prevent that better.... but eh it should be fine now so why worry?

			// oh and leaving this in here in case it happens again I guess
			console.log('shouldnt be here find out why');
			return;
		}

		$("#masterPopupOverlay").addClass("popupSpreadOverlayClose");
		$("#masterPopupContentContainer").addClass("popupSpreadClose")
		.one(ANIMATION_EVENT,
		function(event){
			viewControl.currentContainer = popup.underContainer;
			//viewControl.canNav = true;
			$("#masterPopupContentContainer").removeClass("popupSpreadClose").off();
			$("#masterPopupOverlay").removeClass("popupSpreadOverlayClose").off();

			$(".popupTitleContainer").show();
			$("#masterPopupContent").removeClass().addClass("masterPopupContent");

			$(".popupTransContainer.transBack").removeClass("rotateBack");
			$(".popupTransContainer.transFront").removeClass("rotateFront").data("force-hide", null);

			$("#masterPopupContent .iconButton.back").data("callback", "popup.hide();");

			$("#masterPopupContainer").hide();

			$("#masterPopupYes").removeClass("disabled");

			if (callback) {
				callback();
			}
		});

		return true;
	},

	goBack: function(event) {
		if (!viewControl.canNav) {

			if (event) {
				event.preventDefault();
				event.stopPropagation();
			}

			return false;
		}

		if (ANDROID_MAP[viewControl.currentContainer]) {
			ANDROID_MAP[viewControl.currentContainer]();

			if (event) {
				event.preventDefault();
				event.stopPropagation();
			}

			return false;
		}

		if (event) {
			// Exit from main menu
			navigator.app.exitApp();
		}
	},

	handleNav: function(newContainer) {
		var className = '.c_' + newContainer.id;

		//$(".topNavControlContainer>div").not(className).animate({opacity: '0'});
		//$(".topNavControlContainer " + className).animate({opacity: '1'});
		
		$(".topNavControlContainer>div").not(className).fadeOut();
		$(".topNavControlContainer " + className).fadeIn();
	}
}
