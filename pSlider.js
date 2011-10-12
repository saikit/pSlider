/*

pSlider : a jQuery slider plugin for desktop and mobile websites.
Author : Sai-Kit Hui
Website : http://areyoudesign.com

*/

(function ( $ ) {

$.fn.pSlider = function ( option ) {
	
	// Enable mobile events in jQuery
	$.event.props.push('touches', 'targetTouches', 'changedTouches');
	
	var defaults = {
		axis : 'y', // 'x' for horizontal, 'y' for vertical slider
		min: 0, // minimum value
		max: 100, // maximim value
		value: 25, // default value on load, should be a multiple of the min and max.
		step: 1, // set increments each step
		length: 200, // set the width/height of the progress bar
		animate: false, // set whether to animate value
		speed: 200, // animation speed for click event
		thumb: 36, // size of the thumb
		flip: 10, // percentage value the number is in a flipped state
		array: [], // display values matched against an array
		onLoad: {}, // callback function after loading slider
		onMove: {}, // callback function that run while slider in motion
		onFinish: {} // callback function that run after each action
	}
	
	var opt = $.extend( defaults, option );
	var timer = 0;
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
		
	var range = opt.max - opt.min,
		indexes = range/opt.step;
		tAdjust = (opt.length - opt.thumb) / opt.length,
		values = [opt.min];
		positions = [];
		
		for(i = 0, len = indexes; i<len; i++)
		{
			values[i + 1] = values[i] + opt.step;
		};
		
		for(i = 0, len = indexes; i<=len; i++)
		{
			positions[i] = (i/indexes) * 100;
		}
		
	var data = {}; // object of slider data that can be accessed by the callback function
		
	var slider = (function() {
		
		init = function ()
		{
			buildSlider();
			initListeners();
		};
		
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
			if(opt.axis == 'x')
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
		
		dataController = function (coordinate, call)
		{
			coordinate = coordinate/opt.length;
		
			if(coordinate < 0)
			{
				var position = positions[0];
				var value = values[0];
			}
			else if(coordinate >= 100)
			{
				var position = positions[indexes];
				var value = values[indexes];
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
			
			if(opt.animate && call == 'onFinish')
			{
				animateSlider(position, value, index, call);
			}
			else
			{
				setSlider(position, value, index, call);
			}
		};
		
		animateSlider = function (position, value, index, call)
		{
			var cVal = data.value;
			position = position * tAdjust;
					
			_animNum = function ()
			{
				if(cVal == value)
				{
					clearInterval(anim);
				}
				else
				{
					cVal += cVal < value ? opt.step : opt.step * -1;
					$number.text(arrayVal(index, value));
					callback(cVal, position, index, 'onMove');
				}
			}
			
			if(opt.axis == 'y')
			{
				$thumb.animate({bottom : position + '%'}, opt.speed);
				$number.animate({bottom : position + '%'}, opt.speed)
				$progressBar.animate({height : position + '%'}, opt.speed);
			}
			else
			{
				$thumb.animate({left : position + '%'}, opt.speed);
				$number.animate({bottom : position + '%'}, opt.speed)
				$progressBar.animate({width : position + '%'}, opt.speed);
			}
			
			var len = Math.abs(cVal - value);
			anim = setInterval(_animNum, opt.speed / len);
			
			if($rail.data('status') == 'moving')
			{
				$rail.data({'status' : 'ready'});
			}
			
			callback(value, position, index, call);
		}
		
		setSlider = function (position, value, call)
		{
			position = position * tAdjust;
		
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
			}
			
			if($rail.data('status') == 'moving')
			{
				$rail.data({'status' : 'ready'});
			}
			
			callback(value, position, call)
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
					
				$rail.bind('mousemove touchmove', handlers.onRailMove);
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
				
				$(this).data({'status' : 'moving'});
				
				var position = opt.axis == 'y' ? (opt.length - (e.pageY - $rail.offset().top)) * 100 : (opt.length - (e.pageX - $rail.offset().left)) * 100;
					
				dataController(position, 'onMove');
				
				$(document).bind('mouseup touchend', handlers.onMouseUp);
			},
			
			onMouseUp : function (e) 
			{
				if(e.type == 'touchend')
				{
					$rail.unbind('touchmove');
				}
				
				$thumb.removeClass('pS-dragging');
					
				$rail.unbind('mousemove');
				$(this).unbind('mouseup touchend');
				
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
		
		// transforms number display depending on type
		
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
				timer = setInterval( function () { plusVal(obj, direction) }, 200 );
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
		
		// update public dataset 
		
		callback = function (value, position, call) {
			data = {
				value : value,
				arrayValue : $.isArray(opt.array) ? arrayVal(value) : ''
			}
			
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
	
})( jQuery );
