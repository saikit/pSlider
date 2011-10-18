pSlider
A jQuery slider for desktop and mobile web.
Sai-Kit Hui (@saikit)
http://areyoudesign.com
saikit@areyoudesign.com

Current features

* Works on mobile as well as desktop
* Options galore
* Put your own values to display
* Public access to slider data
* Custimizable with CSS

Future features

* Allow manipulation of the slider from elsewhere.

Installation instuctions (default values displayed)

<div id="element"></div>

 $('#element').pSlider({
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
});