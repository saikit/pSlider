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
		value: 25, // default value on load
		step: 1, // set increments each step
		length: 200, // set the width/height of the progress bar
		animate: false, // set whether to animate value
		speed: 200, // animation speed for click event
		thumb: 36, // size of the thumb
		flip: .1, // percentage value the number is in a flipped state
		array: [], // display values matched against an array
		onLoad: {}, // callback function that after loading slider
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
		tAdjust = (opt.length - opt.thumb) / opt.length,
		inVal,
		position,
		pLength;
		
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
			
			inVal = opt.axis == 'y' ? Math.abs((opt.value - opt.min) - range) : opt.value - opt.min;
			position = Math.floor(Math.floor((inVal * opt.length)/range) * tAdjust);
			pLength = opt.axis == 'y' ? opt.length - position : position;	

			opt.axis == 'y' ? $slider.addClass('pS-slider-y') : $slider.addClass('pS-slider-x');			
			
			if(opt.axis == 'y')
			{
				$rail.css({height : opt.length});
				$thumb.css({top : position, height: opt.thumb});
				$progressBar.css({top : position, height : pLength});
				$number.css({top : position}).text(arrayVal(opt.value));
				if(position <= opt.length * opt.flip || range == 0)
					$number.addClass('pS-flipped');
				else
					$number.removeClass('pS-flipped');
			}
			if(opt.axis == 'x')
			{
				$rail.css({width : opt.length});
				$thumb.css({left : position, width : opt.thumb});
				$progressBar.css({left: 0, width : pLength});
				$number.css({left: position}).text(arrayVal(opt.value));	
			}
			
			callback(opt.value, 'onLoad');
		};
		
		initListeners = function ()
		{
			$rail.click(handlers.onRailClick);
			$thumb.bind('mousedown touchstart click', handlers.onThumbDrag);
			$number.bind('touchstart mousedown select', handlers.onThumbDrag);			
			$up.bind('mousedown touchstart', {direction : 'up'}, handlers.onArrowClick);
			$down.bind('mousedown touchstart', {direction : 'down'}, handlers.onArrowClick);
		};
		
		handlers = {
			onRailClick : function (e)
			{
				if($(this).data('status') == 'ready' && $thumb.data('status') == 'ready')
				{
					var cVal = data.value;
					var position = opt.axis == 'y' ? e.pageY - $rail.offset().top : e.pageX - $rail.offset().left;
					var val = (Math.floor((position * range)/opt.length / opt.step)) * opt.step;
					var inVal = opt.axis == 'y' ? Math.abs(val - range) : val;
						position = Math.floor(Math.floor((val * opt.length)/range) * tAdjust);
					
					if(position < 0)
					{
						position = 0;
						inVal = opt.axis == 'y' ? opt.max : opt.min;
					}
					if(position > Math.floor(opt.length * tAdjust))
					{
						position = Math.floor(opt.length * tAdjust);
						inVal = opt.axis == 'y' ? opt.min : opt.max;
					}
					
					pLength = opt.axis == 'y' ? opt.length - position : position;
					inVal += opt.min;
					
					var animNum = function ()
					{
						if(cVal == inVal)
						{
							clearInterval(anim);
						}
						else
						{
							cVal += cVal < inVal ? opt.step : opt.step * -1;
							$number.text(arrayVal(cVal));
							callback(cVal, 'onMove');
						}
					}
					
					$(this).data({'status' : 'moving'});
					
					if(inVal >=  opt.min && opt.axis == 'y' && inVal <= opt.max)
					{
						$thumb.animate({top : position }, opt.speed);
						$number.animate({top : position }, opt.speed, function () { callback(inVal, 'onFinish') });
						$progressBar.animate({top : position, height : pLength }, opt.speed, function () 
						{ 
							$rail.data({'status' : 'ready'}) 
							
							if(opt.axis == 'y')
							{
								if(position <= opt.length * opt.flip || range == 0)
									$number.addClass('pS-flipped');
								else
									$number.removeClass('pS-flipped');
							}
						});
					}
					
					if(inVal >=  opt.min && opt.axis == 'x' && inVal <= opt.max)
					{			
						$thumb.animate({left : position }, opt.speed);
						$number.animate({left : position }, opt.speed, function () { callback(inVal, 'onFinish') });
						$progressBar.animate({width : pLength }, opt.speed, function () 
						{ 
							$rail.data({'status' : 'ready'}) 
						});
					}
					
					if(opt.animate)
					{
						var len = Math.abs(cVal - inVal);
						anim = setInterval(animNum, opt.speed / len);
					}
					else
					{
						$number.text(arrayVal(inVal));
					}
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
				
				position = opt.axis == 'y' ? e.pageY - $rail.offset().top : e.pageX - $rail.offset().left;
				val = (Math.floor((position * range)/opt.length / opt.step)) * opt.step;
				
				inVal = opt.axis == 'y' ? Math.abs(val - range) : val;
				position = Math.floor(Math.floor((val * opt.length)/range) * tAdjust);
					
				inVal += opt.min;
					
				if(position < 0)
				{
					position = 0;
					inVal = opt.axis == 'y' ? opt.max : opt.min;
				};
				
				if(position > Math.floor(opt.length * tAdjust))
				{
					position = Math.floor(opt.length * tAdjust);
					inVal = opt.axis == 'y' ? opt.min : opt.max;
				};
				
					pLength = opt.axis == 'y' ? opt.length - position : position;
				
				if(opt.axis == 'y' && inVal >=  opt.min && inVal <=  opt.max)
				{
					$thumb.css({top : position });
					$number.css({top : position }).text(arrayVal(inVal));
					$progressBar.css({top : position, height : pLength });
				}
				
				if(opt.axis == 'x' && inVal >=  opt.min && inVal <=  opt.max)
				{
					$thumb.css({left : position });
					$number.css({left : position }).text(arrayVal(inVal));
					$progressBar.css({width : pLength });
				}
				
				callback(inVal, 'onMove');
				
				$(document).bind('mouseup touchend', handlers.onMouseUp);
			},
			
			onMouseUp : function (e) 
			{
				if(e.type == 'touchend')
				{
					$rail.unbind('touchmove');
				}
				
				$thumb.removeClass('pS-dragging');
					
				if(opt.axis == 'y')
				{
					if(position <= opt.length * opt.flip || range == 0)
						$number.addClass('pS-flipped');
					else
						$number.removeClass('pS-flipped');
				}
				
				$rail.unbind('mousemove');
				$(this).unbind('mouseup touchend');
				
				// prevent iPhone from triggering click event
				setTimeout( function () { $thumb.data({'status' : 'ready'}) }, 1000);
				
				callback(inVal, 'onFinish');
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
		
		arrayVal = function ( value )
		{
			if($.isArray(opt.array) && opt.array.length > 0)
			{
				if(typeof(opt.array[value]) == 'undefined')
					return opt.array[value % opt.array.length];
				else		
					return opt.array[value];
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
				
			var val = data.value;
		
			if(direction == 'up' && val < opt.max) 
			{
				val += opt.step;
			}
			else if(direction == 'down' && val > opt.min)
			{
				val -= opt.step;
			}
			else
				return;
				
			var inVal = opt.axis == 'y' ? Math.abs(val - opt.max) : val - opt.min;
			
				 
			position = Math.floor(Math.floor((inVal * opt.length)/range) * tAdjust);
			pLength = opt.axis == 'y' ? opt.length - position : position;
			
			if(opt.axis == 'y')
			{
				if(position <= opt.length * opt.flip || range == 0)
					$number.addClass('pS-flipped');
				else
					$number.removeClass('pS-flipped');
			}
				
			if(opt.axis == 'y')
			{
				$thumb.css({top : position });
				$number.css({top : position }).text(arrayVal(val));
				$progressBar.css({top : position, height : pLength });
			}
			
			if(opt.axis == 'x')
			{
				$thumb.css({left : position });
				$number.css({left : position }).text(arrayVal(val));
				$progressBar.css({width : pLength });
			}
			
			callback(val, 'onFinish');
			
			return false;
		};
		
		// update public dataset 
		
		callback = function (value, call) {
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
