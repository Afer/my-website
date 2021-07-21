var popup = {

	loadingGif: "<img src='images/icons/network-wait.gif' id='popupLoadingGif'/>",
	underContainer: null,

	init: function(){
		popup.unregisterEvents();
		popup.unregisterTransEvents();
	},

	registerEvents: function() {
		$(".transFront .event-button")
		.on(eventMap.mouseDown, mainCtl.buttonPressEvent)
		.on(eventMap.mouseUp, mainCtl.buttonReleaseEvent);
	},

	unregisterEvents: function() {
		$(".transFront .event-button").off();
		popup.cleanCallbacks();
	},

	registerTransEvents: function() {
		$(".transBack .event-button")
		.on(eventMap.mouseDown, mainCtl.buttonPressEvent)
		.on(eventMap.mouseUp, mainCtl.buttonReleaseEvent);
	},

	unregisterTransEvents: function() {
		$(".transBack .event-button").off();
		popup.cleanTransCallbacks();
	},

	confirmWithOptions: function(options) {
		//easier and safer than replace all-ing
		options.content = options.message;

		if (!mainMenu.isToggleEnabled(TOGGLE_IDS.CONFIRMS) && !options.bypassSettings) {
			if (options.confirmCallback) {
				eval(options.confirmCallback);
			}

			return;
		}

		options.confirmLabel = options.confirmLabel != null ? options.confirmLabel : "YES";
		options.cancelLabel = options.cancelLabel != null ? options.cancelLabel : "NO";
		options.cancelCallback = options.cancelCallback != null ? options.cancelCallback : "popup.hide()";

		popup.show(options);
	},

	infoWithOptions: function(options) {
		//easier and safer than replace all-ing
		options.content = options.message;

		options.confirmLabel = options.confirmLabel != null ? options.confirmLabel : "OK";
		options.confirmCallback = options.confirmCallback != null ? options.confirmCallback : "popup.hide()";

		popup.show(options);
		
		// Hide buttons by default for this guy
		popup.updateScreen(function() {
			$("#masterPopupNo").hide();
		},
		function() {
			$(".transBack #transBackNo").hide();
		})
	},

	customWithOptions: function(options) {
		popup.show(options);

		popup.updateScreen(function() {
			$(".transFront .masterPopupControls").hide();
		},
		function() {
			$(".transBack .masterPopupControls").hide();
		})
	},
	
	transition: function(options) {
		if (popup.isOpenInTransition()) {
			popup._setFrontValues(options);
			popup.backFromTransition();
		}
		else {
			popup._setBackValues(options);
			popup.transitionPopup();
		}

		popup._applyCommonOptions(options);
	},

	showMenu: function(options){
		var appendString = "";
		var extraClass = "";

		for (var i = 0; i < options.menu.length; i++){
			var item = options.menu[i];

			item.type = item.type ? item.type : 'button';

			appendString += "  <div class='configLine settingsLine " + item.type + "'>";

            if (item.type === 'toggle'){
                extraClass = mainMenu.isToggleEnabled(item.id) ? 'enabled' : '';

                appendString += "    <div class='configLabel'>" + item.label + "</div>";
                appendString += '  <div class="switch ' + extraClass + ' event-button" data-callback="' + item.callback + '"></div>';
			}
			else {
				appendString += "    <div class='tinkerMenuItem menuButton " + item.menuClass + " event-button' data-callback='" + item.callback + "'>" + item.label + "</div>";
			}

            appendString += "  </div>";
			//appendString += "<div class='tinkerMenuItem menuButton " + options[i].menuClass + " event-button' data-callback='"+options[i].callback+";'>"+options[i].label+"</div>";
		}
		
		options.content = appendString;

		popup.customWithOptions(options);

		if (options.callback) {
			options.callback();
		}
	},

	levelNamePopup: function(confirmLabel, confirmCallback){
		var message = editorMenu.getNameLevelMessage();
		var cancelLabel = "CANCEL";

		popup.confirmWithOptions({
			message: message, 
			confirmCallback: confirmCallback, 
			cancelCallback: 'popup.hide(editorMenu.cancelLevelName);',
			closeCallbackString: 'popup.hide(editorMenu.cancelLevelName);',
			confirmLabel: confirmLabel, 
			cancelLabel: cancelLabel, 
			title: "Name your Level",
			bypassSettings: true
		});

		$("#masterPopupYes").addClass("disabled");
	},

	skillPopup: function(appendString, title, x, y) {
		popup.customWithOptions({
			content: appendString, 
			x: x, 
			y: y, 
			title: title
		});
		
		$(".masterPopupContent").addClass("skillsPopup");
	},

	mapPopup: function (tier, x, y, title) {
		var levelHtml = $("#tierLevelsContainer").html();
		// ID things cause issues or... lazy more than anything but who cares?
		$("#tierLevelsContainer").empty();

		popup.customWithOptions({
			content: levelHtml, 
			x: x, 
			y: y, 
			title: title
		});

		$("#masterPopupContent").addClass("mapPopupContent bg-tier-"+tier);
	},

	createUsername: function(){
		var appendString = "";

		appendString += "<div class='createUsernameContainer'>";
		appendString += "	<label>Create a Username</label>";
		appendString += "	<p>You must create a username to join the multiplayer fun!</p>";
		appendString += "	<input id='createUsernameInput' />";
		appendString += "	<div id='createUsernameError'></div>";
		appendString += "	<div class='menuButton main event-button' data-callback='mainCtl.createUsername()'>Create</div>";
		appendString += "	<div class='menuButton main event-button' data-callback='popup.hide(mainCtl.goBackFromMultiplayerMenu);'>Go Back</div>";
		appendString += "</div>";

		popup.customWithOptions({
			title: 'Create User',
			content: appendString
		});
	},

	networkError: function(){
		popup.error("An error occurred on the server.  Please try again later");
	},

	error: function(msg){
		popup.infoWithOptions({
			message: msg,
			title: 'Error'
		});
	},

	loading: function(){
		popup.infoWithOptions({
			message: popup.loadingGif,
			title: 'Loading...'
		});

		$(".masterPopupControls").hide();
	},

	show: function(options) {		
		if (popup.isOpen()) {
			popup.transition(options);
			return;
		}
		
		popup._setFrontValues(options);

		if (popup._displayPopup(options.x, options.y)) {
			popup._applyCommonOptions(options);

			popup.registerEvents();
			return true;
		}
	},

	hide: function(callback){
		if (popup.isOpenInTransition()) {
			popup.backFromTransition();

			if ($(".transFront").data("force-hide")) {
				popup.hide(callback);
				return;
			}
			
			if (callback) {
				callback();
			}

			return;
		}

		if (popup._discardPopup(callback)) {
			popup.unregisterEvents();
			return true;
		}
	},

	updateScreen: function(frontScreenCallback, backScreenCallback) {
		if (popup.isOpen() && !popup.isOpenInTransition()) {
			frontScreenCallback();
		}
		else {
			backScreenCallback();
		}
	},

	infoContentChange: function(options) {
		$("#popupContent").html(options.content);
		$("#masterPopupControls").css("display", "flex");
		$("#masterPopupYes").css("display", "none");
		$("#masterPopupNo").css("display", "block").html(options.confirmLabel ? options.confirmLabel : 'OK');
	},

	setFrontTitle: function(title) {
		if (!title) {
			$(".transFront .popupTitleContainer").css("display", "none");	
		}
		else {
			$(".transFront .popupTitleContainer").css("display", "block");	
			$(".transFront .popupTitle textPath").html(title);
		}
	},

	setBackTitle: function(title) {
		if (!title) {
			$(".transBack .popupTitleContainer").css("display", "none");	
		}
		else {
			$(".transBack .popupTitleContainer").css("display", "block");	
			$(".transBack .popupTitle textPath").html(title);
		}
	},

	transitionPopup: function() {
		popup.unregisterEvents();
		popup.registerTransEvents();
		$(".popupTransContainer.transBack").addClass("rotateBack");
		$(".popupTransContainer.transFront").addClass("rotateFront");
	},

	backFromTransition: function() {
		popup.registerEvents();
		popup.unregisterTransEvents();
		$(".popupTransContainer.transBack").removeClass("rotateBack");
		$(".popupTransContainer.transFront").removeClass("rotateFront");
	},

	cleanCallbacks: function(){
		$("#masterPopupYes").data("callback", null);
		$("#masterPopupNo").data("callback", "popup.hide();");
	},

	cleanTransCallbacks: function() {
		$("#transBackYes").data("callback", null).removeClass("disabled");
		$("#transBackNo").data("callback", "popup.hide();");
	},

	isOpen: function() {
		return $("#masterPopupContainer").css("display") != "none";
	},

	isOpenInTransition: function() {
		return $(".transBack").hasClass("rotateBack");
	},

	_setFrontValues: function(options) {
		popup.setFrontTitle(options.title);
		$("#popupContent").html(options.content);
		$("#masterPopupControls").css("display", "flex");
		$("#masterPopupYes").css("display", "block").html(options.confirmLabel).data("callback", options.confirmCallback);
		$("#masterPopupNo").css("display", "block").html(options.cancelLabel).data("callback", options.cancelCallback);
	},

	_setBackValues: function(options) {
		popup.setBackTitle(options.title);
		$(".transBack .popupContent").html(options.content);
		$(".transBack .masterPopupControls").css("display", "flex");
		$(".transBack #transBackYes").css("display", "block").html(options.confirmLabel).data("callback", options.confirmCallback);
		$(".transBack #transBackNo").css("display", "block").html(options.cancelLabel).data("callback", options.cancelCallback);
	},

	_applyCommonOptions: function(options) {
		if (options.forceHideAfterTrans) {
			$(".transFront").data("force-hide", true);
		}
		else {
			$(".transFront").data("force-hide", null);
		}

		if (options.closeCallbackString) {
			$('.popupBack').data("callback", options.closeCallbackString);
		}
		else {
			$('.popupBack').data("callback", "popup.hide()");
		}

		if (options.customClass) {
			$('#masterPopupContainer').addClass(options.customClass);
		}
		else {
			$('#masterPopupContainer')[0].className = '';
		}
	},
	
	_displayPopup: function(x, y) {
		if (!popup.canNav){
			return false;
		}

		popup.canNav = false;

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
			popup.canNav = true;
			$("#masterPopupContentContainer").removeClass("popupSpread").off();
			$("#masterPopupOverlay").removeClass("popupSpreadOverlay").off();
		});

		$("#masterPopupContainer").show();

		return true;
	},

	_discardPopup: function(callback) {
		if (!popup.canNav){
			return false;
		}

		$("#masterPopupOverlay").addClass("popupSpreadOverlayClose");
		$("#masterPopupContentContainer").addClass("popupSpreadClose")
		.one(ANIMATION_EVENT,
		function(event){
			
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
}
