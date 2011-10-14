/*

pSlider : a jQuery slider plugin for desktop and mobile websites.
Author : Sai-Kit Hui (@saikit)
Website : http://areyoudesign.com/blog

*/

;(function ( $, window, document, undefined ) {

$.fn.pSlider = function ( option ) {
	
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
		flip: null, // percentage value the number is in a flipped state
		array: [], // display values matched against an array
		onLoad: {}, // callback function after initializing slider
		onMove: {}, // callback function that run while slider in motion
		onFinish: {} // callback function that run after end of each action
	}
	
	var opt = $.extend( defaults, option );
	var timer = 0; // define setInterval
	var int = false; // flag that starts and stop the onArrowClick handler
	
	/* jQuery objects */ 
	var s = $(this), // the source element
		$rail, // the track
		$thumb, // the slider
		$progressBar, // the progress track
		$number, // the returned value
		$up, // up arrow
		$down; // down arrow
		
	/* constants and measurements */	
		
	var range = opt.max - opt.min, // the range
		indexes = range/opt.step, // total number of positions in a slider
		tAdjust = (opt.length - opt.thumb) / opt.length; // adjusting position so that slider is correctly positioned depending on size
		
	var values = [opt.min]; // array of values in a slider, starting with opt.min
		for(i = 0, len = indexes; i<len; i++)
		{
			values[i + 1] = values[i] + opt.step;
		};
		
	var positions = []; // array of positions in a slider, set by percentage
		for(i = 0, len = indexes; i<=len; i++)
		{
			positions[i] = (i/indexes) * 100;
		};
		
	var data = {}; // object of slider data that can be accessed by the callback function
		
	var slider = (function() {
		
		init = function ()
		{
			buildSlider();
			initListeners();
		};
		
		/* construct slider */
		
		buildSlider = function()
		{
			$slider = $('<span class="pS-slider">'); 

			s.html($slider);
			$rail = $('<span class="pS-rail">').data({'status': 'ready'}).appendTo($slider);
			$thumb = $('<span class="pS-thumb">').data({'status': 'ready'}).appendTo($rail);
			$progressBar = $('<span class="pS-progressBar">').appendTo($rail);
			$number = $('<span class="pS-number">').appendTo($rail);
			$cap = $('<span class="pS-cap-min"></span><span class="pS-cap-max"></span>').appendTo($rail);
			$arrows = $('<div class="pS-arrows">').appendTo($slider);
			$up = $('<span class="pS-btn pS-btn-up">+</span>').appendTo($arrows);
			$down = $('<span class="pS-btn pS-btn-down">&ndash;</span>').appendTo($arrows);			

			opt.axis == 'y' ? $slider.addClass('pS-slider-y') : $slider.addClass('pS-slider-x');			
			
			if(opt.axis == 'y')
			{
				$rail.css({height : opt.length});
				$thumb.css({height: opt.thumb});
			}
			else // opt.axis == 'x'
			{
				$rail.css({width : opt.length});
				$thumb.css({width : opt.thumb});	
			}
			
			dataController(positions[$.inArray(opt.value, values)] * opt.length, 'onLoad');
		};
		
		initListeners = function ()
		{
			$rail.click(handlers.onRailClick);
			$thumb.bind('mousedown touchstart click', handlers.onThumbDrag);
			$number.bind('touchstart mousedown select', handlers.onThumbDrag);			
			$up.bind('mousedown touchstart', {direction : 'up'}, handlers.onArrowClick);
			$down.bind('mousedown touchstart', {direction : 'down'}, handlers.onArrowClick);
		};
		
		// all handlers use this to output slider position, value, and index
		
		dataController = function (coordinate, call)
		{
			coordinate = coordinate/opt.length;
		
			if(coordinate < 0)
			{
				var position = positions[0];
				var value = values[0];
				var index = 0;
			}
			else if(coordinate >= 100)
			{
				var position = positions[indexes];
				var value = values[indexes];
				var index = indexes;
			}
			else
			{
				for(i = 0, len = indexes; i<len; i++)
				{
					if(coordinate - positions[i] < 1/indexes || coordinate - positions[i] == 0)
					{
						var position = positions[i];
						var value = values[i];
						var index = i;
						break;
					}
					else
					{
						continue;
					}
				}
			}
			
			// position adjusted for slider
			
			position = position * tAdjust;
			
			if(opt.animate && call == 'onFinish' && int == false)
			{
				animateSlider(position, value, index, call);
			}
			else
			{
				setSlider(position, value, index, call);
			};
		};
		
		// animation from clicking on rail
		
		animateSlider = function (position, value, index, call)
		{	
			_animNum = function ()
			{	
				if(cVal == value)
				{
					clearInterval(anim);
					$rail.data({'status' : 'ready'});
				}
				else
				{
					len = Math.abs(cVal - value)
					var _sAdjust = len < 10 ? 1 : Math.round(len/10);
					cVal += cVal < value ? opt.step * _sAdjust : opt.step * -1 * _sAdjust;
					$number.text(arrayVal(index, cVal));
					callback(cVal, position, index, 'onMove');
				}
			}
			
			var cVal = data.value,
				len = Math.abs(cVal - value),
				animSpeed = opt.animSpeed/len,
				anim = setInterval(_animNum, animSpeed);
			
			if(opt.axis == 'y')
			{
				$thumb.animate({bottom : position + '%'}, opt.animSpeed);
				$number.animate({bottom : position + '%'}, opt.animSpeed)
				$progressBar.animate({height : position + '%'}, opt.animSpeed);
			}
			else
			{
				$thumb.animate({left : position + '%'}, opt.animSpeed);
				$number.animate({bottom : position + '%'}, opt.animSpeed)
				$progressBar.animate({width : position + '%'}, opt.animSpeed);
			}
			
			if(opt.flip && position >= opt.flip)
			{
				$number.addClass('pS-flipped');
			}
			else
			{
				$number.removeClass('pS-flipped');
			};
			
			callback(value, position, index, call);
		}
		
		setSlider = function (position, value, index, call)
		{
			if(opt.axis == 'y')
			{
				$thumb.css({bottom : position + '%'});
				$number.css({bottom : position + '%'}).text(arrayVal(index, value));
				$progressBar.css({height : position + '%'});
			}
			else
			{
				$thumb.css({left : position + '%'});
				$number.css({left : position + '%'}).text(arrayVal(index, value));
				$progressBar.css({width : position + '%'});
			};
			
			if(opt.flip && position >= opt.flip)
			{
				$number.addClass('pS-flipped');
			}
			else
			{
				$number.removeClass('pS-flipped');
			};
			
			$rail.data({'status' : 'ready'});
			callback(value, position, index, call)
		};
		
		handlers = {
			onRailClick : function (e)
			{
				if($(this).data('status') == 'ready' && $thumb.data('status') == 'ready')
				{
					$(this).data({'status' : 'moving'});
					var position = opt.axis == 'y' ? (opt.length - (e.pageY - $rail.offset().top)) * 100 : (opt.length - (e.pageX - $rail.offset().left)) * 100;
					
					dataController(position, 'onFinish');
				}
				return false;
			},
			
			onThumbDrag : function (e)
			{
				e.preventDefault();
				e.stopPropagation();
				
				$(this).data({'status' : 'moving'});
				if(e.type == 'click' || e.type == 'select')
				{	
					return false;
				};
				if(e.type == 'touchstart')
				{
					$(this).unbind('mousedown');
					if(e.touches) {                                                                          
						if(e.targetTouches && e.targetTouches.length != 1) {                                        
							return false;
						};
														
						e = e.touches[0];                                                          
					};
				}
				
				$thumb.addClass('pS-dragging');
					
				// add mousemove
					
				$(document).bind('mousemove touchmove', handlers.onRailMove);
			},
			
			onRailMove : function (e)
			{
				e.preventDefault();
				e.stopPropagation();
				if(e.type == 'touchmove')
				{
					if(e.touches) {                                                                          
						if(e.targetTouches && e.targetTouches.length != 1) {                                        
							return false;
						};
														
						e = e.touches[0];                                               
					}
				}
				
				$rail.data({'status' : 'moving'});
				
				var position = opt.axis == 'y' ? (opt.length - (e.pageY - $rail.offset().top)) * 100 : (opt.length - (e.pageX - $rail.offset().left)) * 100;
					
				dataController(position, 'onMove');
				
				// add mouseup on any part of document
				
				$(this).bind('mouseup touchend', handlers.onMouseUp);
			},
			
			onMouseUp : function (e) 
			{
				if(e.type == 'touchend')
				{
					$(this).unbind('touchmove touchend');
				}
				else
				{
					$(this).unbind('mouseup mousemove');
				};
				
				$thumb.removeClass('pS-dragging');
				
				// prevent iPhone from triggering click event
				setTimeout( function () { $thumb.data({'status' : 'ready'}) }, 1000);
			},
			
			onArrowClick : function (e)
			{
				$(this).addClass('pS-arrowDown');
				
				if(e.type == "touchstart")
					$(this).unbind('mousedown');

				int = true;
				plusVal($(this), e.data.direction)
					
				$(document).bind('mouseup touchend', handlers.onArrowRelease);
			},
			
			onArrowRelease : function (e)
			{
				int = false;
				$(this).unbind('mouseup touchend');
			}
			
		};
		
		// Convert values based onanother array of values. 
		
		arrayVal = function ( index, value )
		{
			if($.isArray(opt.array) && opt.array.length > 0)
			{
				if(typeof(opt.array[index]) == 'undefined')
					return opt.array[index % opt.array.length];
				else		
					return opt.array[index];
			}	
			else
			{
				return value;
			}
		};
		
		// Manage arrow keys
		
		plusVal = function (obj, direction) 
		{	
			clearInterval(timer);
			
			if(int == true && direction)
				timer = setInterval( function () { plusVal(obj, direction) }, opt.arrowSpeed );
			else
			{
				obj.removeClass('pS-arrowDown');
				return;
			}
				
			var value = data.value;
			
			if(direction == 'up' && value < opt.max) 
			{
				dataController(positions[$.inArray(value, values) + 1] * opt.length, 'onFinish');
			}
			else if(direction == 'down' && value > opt.min)
			{
				dataController(positions[$.inArray(value, values) - 1] * opt.length, 'onFinish');
			}
			else
			{
				return;
			}
			
			return false;
		};
		
		// update public dataset and run callback function
		
		callback = function (value, position, index, call) {
			data = {
				value : value,
				arrayValue : $.isArray(opt.array) ? arrayVal(value) : '',
				percentage : Math.round(position / tAdjust),
				index : index
			};
			
			opt[call].call(this, data);
		};
	
		return {
			init : init
		};
	
	})();

	return this.each( function ()
	{
		slider.init();
	});		 
}
	
})( jQuery, window, document );
