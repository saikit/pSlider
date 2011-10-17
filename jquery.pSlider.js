/*

pSlider : a jQuery slider plugin for desktop and mobile websites.
Author : Sai-Kit Hui (@saikit)
Website : http://areyoudesign.com/blog

*/

;(function ( $, window, document, undefined ) {

	// Enable mobile events in jQuery
	$.event.props.push('touches', 'targetTouches', 'changedTouches');
	
	var defaults = {
		axis : 'y', // 'x' for horizontal slider, 'y' for vertical slider
		min: 0, // minimum value
		max: 100, // maximim value
		value: 25, // default value on load, should be a multiple of the min and max.
		step: 1, // set increments each step
		length: 200, // set the width/height of the progress bar (px)
		animate: false, // set whether to animate value
		animSpeed: 200, // animation speed for click event (ms)
		arrowSpeed: 200, // set the interval for holding down the arrow buttons (ms)
		thumb: 36, // size of the thumb (px)
		flip: 80, // percentage value the number is in a flipped state
		plusText: '+', // text inside the up button
		minusText: '&ndash;', //text inside the down button
		array: [], // display values matched against an array
		onLoad: {}, // callback function after initializing slider
		onMove: {}, // callback function that run while slider in motion
		onFinish: {} // callback function that run after end of each action
	}
	
	var int = false; // flag that starts and stop the onArrowClick handler

$.fn.pSlider = function ( option ) {

	var slider = function (element, option) {
	
		var $el = element;
		var opt = $.extend({}, defaults, option);
		var timer = 0; // define setInterval
		
		init = function () {
			buildSlider();
			initListeners();
		};
		
		/* construct slider */
		
		buildSlider = function() {
		
			/* constants and measurements */
			var range = opt.max - opt.min; // the range
			
			opt.indexes = range/opt.step, // total number of positions in a slider
			opt.tAdjust = (opt.length - opt.thumb) / opt.length; // adjusting position so that slider is correctly positioned depending on size
				
			opt.values = [opt.min]; // array of values in a slider, starting with opt.min
			for(i = 0, len = opt.indexes; i<len; i++) {
				opt.values[i + 1] = opt.values[i] + opt.step;
			};
				
			opt.positions = []; // array of positions in a slider, set by percentage
			for(i = 0, len = opt.indexes; i<=len; i++) {
				opt.positions[i] = (i/opt.indexes) * 100;
			};
				
			var data = {}; // object of slider data that can be accessed by the callback function
		
		
			/* build the slider */
				$slider = $('<span class="pS-slider"></span>'),
				$rail = $('<span class="pS-rail"></span>').appendTo($slider),
				$thumb = $('<span class="pS-thumb"></span>').appendTo($rail),
				$progressBar = $('<span class="pS-progressBar"></span>').appendTo($rail),
				$number = $('<span class="pS-number"></span>').appendTo($rail),
				$cap = $('<span class="pS-cap-min"></span><span class="pS-cap-max"></span>').appendTo($rail),
				$arrows = $('<div class="pS-arrows"></span>').appendTo($slider),
				$up = $('<span class="pS-btn pS-btn-up"></span>').html(opt.plusText).appendTo($arrows),
				$down = $('<span class="pS-btn pS-btn-down"></span>').html(opt.minusText).appendTo($arrows);				
			
			/* store slider components in data in order for reference */
			$el.data({$thumb : $thumb, $rail : $rail, $up : $up, $down : $down, $number : $number, $progressBar : $progressBar, opt : opt, status : 'ready'});
					
			if(opt.axis == 'y') {
				$slider.addClass('pS-slider-y')
				$rail.css({height : opt.length});
				$thumb.css({height: opt.thumb});
			}
			else { // opt.axis == 'x' 
				$slider.addClass('pS-slider-x')
				$rail.css({width : opt.length});
				$thumb.css({width : opt.thumb});	
			};
			
			dataController($el, opt.positions[$.inArray(opt.value, opt.values)] * opt.length, 'onLoad');
			
			if($.browser.msie) {
				var id = $el.attr('id');
				document.getElementById(id).innerHTML = $slider;
			}
			else {
				$el.html($slider);
			};
			
			$el.html($slider);
		};
		
		initListeners = function () {
			$el.data('$rail').click(handlers.onRailClick);
			$el.data('$thumb').bind('mousedown touchstart click', handlers.onThumbDrag);
			$el.data('$number').bind('touchstart mousedown select', handlers.onThumbDrag);			
			$el.data('$up').bind('mousedown touchstart', {direction : 'up'}, handlers.onArrowClick);
			$el.data('$down').bind('mousedown touchstart', {direction : 'down'}, handlers.onArrowClick);
		};
		
		// all handlers use this to output slider position, value, and index
		
		dataController = function (element, coordinate, call) {
			coordinate = coordinate/opt.length;
			opt = element.data('opt');
			
			if(coordinate < 0) {
				var position = opt.positions[0];
				var value = opt.values[0];
				var index = 0;
			}
			else if(coordinate >= 100) {
				var position = opt.positions[opt.indexes];
				var value = opt.values[opt.indexes];
				var index = opt.indexes;
			}
			else {
				for(i = 0, len = opt.indexes; i<len; i++) {
					if(coordinate - opt.positions[i] < 1/opt.indexes || coordinate - opt.positions[i] == 0) {
						var position = opt.positions[i];
						var value = opt.values[i];
						var index = i;
						break;
					}
					else {
						continue;
					}
				}
			}
			
			// position adjusted for slider
			
			position = position * opt.tAdjust;
			
			if(opt.animate && call == 'onFinish' && int == false) {
				animateSlider(element, position, value, index, call);
			}
			else {
				setSlider(element, position, value, index, call);
			};
		};
		
		// animation from clicking on rail
		
		animateSlider = function (element, position, value, index, call) {
			_animNum = function () {
				if(cVal == value) {
					clearInterval(anim);
					element.data({status : 'ready'});
				}
				else {
					len = Math.abs(cVal - value)
					var _sAdjust = len < 10 ? 1 : Math.round(len/10);
					cVal += cVal < value ? opt.step * _sAdjust : opt.step * -1 * _sAdjust;
					element.data('$number').text(arrayVal(index, cVal));
					callback(element, cVal, position, index, 'onMove');
				}
			}
			
			var cVal = element.data('data').value,
				len = Math.abs(cVal - value),
				animSpeed = opt.animSpeed/len,
				anim = setInterval(_animNum, animSpeed);
			
			if(opt.axis == 'y') {
				element.data('$thumb').animate({bottom : position + '%'}, opt.animSpeed);
				element.data('$number').animate({bottom : position + '%'}, opt.animSpeed)
				element.data('$progressBar').animate({height : position + '%'}, opt.animSpeed);
			}
			else {
				element.data('$thumb').animate({left : position + '%'}, opt.animSpeed);
				element.data('$number').animate({bottom : position + '%'}, opt.animSpeed)
				element.data('$progressBar').animate({width : position + '%'}, opt.animSpeed);
			}
			
			if(opt.flip && position >= opt.flip) {
				element.data('$number').addClass('pS-flipped');
			}
			else {
				element.data('$number').removeClass('pS-flipped');
			};
			
			callback(element, value, position, index, call);
		};
		
		setSlider = function (element, position, value, index, call) {
			if(opt.axis == 'y') {
				element.data('$thumb').css({bottom : position + '%'});
				element.data('$number').css({bottom : position + '%'}).text(arrayVal(index, value));
				element.data('$progressBar').css({height : position + '%'});
			}
			else {
				element.data('$thumb').css({left : position + '%'});
				element.data('$number').css({left : position + '%'}).text(arrayVal(index, value));
				element.data('$progressBar').css({width : position + '%'});
			};
			
			if(opt.flip && position >= opt.flip) {
				element.data('$number').addClass('pS-flipped');
			}
			else {
				element.data('$number').removeClass('pS-flipped');
			};
			
			element.data({status : 'ready'});
			callback(element, value, position, index, call);
		};
		
		handlers = {
			onRailClick : function (e) {
				opt = $el.data('opt');
				if($el.data('status') == 'ready') {
					$el.data({'status' : 'moving'});
					var position = opt.axis == 'y' ? (opt.length - (e.pageY - $el.data('$rail').offset().top)) * 100 : (opt.length - (e.pageX - $el.data('$rail').offset().left)) * 100;
					dataController($el, position, 'onFinish');
				}
				return false;
			},
			
			onThumbDrag : function (e) {
				
				$el.data('$thumb').addClass('pS-dragging').data({'status' : 'moving'});;

				if(e.type == 'click' || e.type == 'select') {	
					return false;
				};
				if(e.type == 'touchstart') {
					$(this).unbind('mousedown');
					if(e.touches) {                                                                          
						if(e.targetTouches && e.targetTouches.length != 1) {                                        
							return false;
						};								
						e = e.touches[0];                                                          
					};
				}
					
				// allow mousemove on any part of the document	
				$(document).bind('mousemove touchmove', {element: $el}, handlers.onRailMove);
				
				return false;
			},
			
			onRailMove : function (e) {
				var $el = e.data.element;
					opt = $el.data('opt');

				if(e.type == 'touchmove') {
					if(e.touches) {                                                                          
						if(e.targetTouches && e.targetTouches.length != 1) {                                        
							return false;
						};
														
						e = e.touches[0];                                               
					}
				}
				
				var position = opt.axis == 'y' ? (opt.length - (e.pageY - $el.data('$rail').offset().top)) * 100 : (opt.length - (e.pageX - $el.data('$rail').offset().left)) * 100;
					
				dataController($el, position, 'onMove');
				
				// allow mouseup on any part of the document
				
				$(this).bind('mouseup touchend', {element: $el}, handlers.onMouseUp);
				return false;
			},
			
			onMouseUp : function (e) {
				var $el = e.data.element;
				
				if(e.type == 'touchend') {
					$(this).unbind('touchmove touchend');
				}
				else {
					$(this).unbind('mouseup mousemove');
				};
				
				$el.data('$thumb').removeClass('pS-dragging');
				
				// prevent iPhone from triggering click event
				setTimeout( function () { 
					$el.data({'status' : 'ready'});
					$el.data('$thumb').removeClass('pS-dragging');
				}, 100);
			},
			
			onArrowClick : function (e) {
				int = true;
				$(this).addClass('pS-arrowDown');
				if(e.type == "touchstart") {
					$(this).unbind('mousedown');
				};
				plusVal($el, $(this), e.data.direction)
				$(document).bind('mouseup touchend', handlers.onArrowRelease);
				return false;
			},
			
			onArrowRelease : function (e) {
				int = false;
				$(this).unbind('mouseup touchend');
			}
			
		};
		
		// Convert values based onanother array of values. 
		
		arrayVal = function ( index, value ) {
			if($.isArray(opt.array) && opt.array.length > 0) {
				if(typeof(opt.array[index]) == 'undefined') {
					return opt.array[index % opt.array.length];
				}
				else {		
					return opt.array[index];
				};
			}	
			else {
				return value;
			};
		};
		
		// Manage arrow keys
		
		plusVal = function (element, obj, direction) 
		{	
			opt = element.data('opt');
			clearInterval(timer);
			
			if(int == true && direction) {
				timer = setInterval( function () { plusVal(element, obj, direction) }, opt.arrowSpeed );
			}
			else
			{
				obj.removeClass('pS-arrowDown');
				return;
			}
				
			var value = element.data('data').value;
			
			if(direction == 'up' && value < opt.max) {
				dataController(element, opt.positions[$.inArray(value, opt.values) + 1] * opt.length, 'onFinish');
			}
			else if(direction == 'down' && value > opt.min) {
				dataController(element, opt.positions[$.inArray(value, opt.values) - 1] * opt.length, 'onFinish');
			}
			else {
				return;
			}
			
			return false;
		};
		
		// update public dataset and run callback function
		
		callback = function (element, value, position, index, call) {
			data = {
				value : value, // the displayed slider value
				arrayValue : $.isArray(opt.array) ? arrayVal(value) : value, // the displayed value matched against opt.array
				percentage : Math.round(position / opt.tAdjust), // slider position relative to slider length
				index : index // slider index
			};
			
			// update dataset in element
			element.data({data : data});
			
			// callback
			if(typeof(opt[call]) === 'function')
				opt[call].call(this, data);
		};
		
		return {
			init : init
		};
	};

	return this.each( function ()
	{
		var element = $(this);
		var s = new slider(element, option);
		s.init();
	});		 
}
	
})( jQuery, window, document );
