var Toolbar = (function() {
	function textToHTML(text) {
		return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
	}

	function addHandler(handler) {
		this.handlers.push(handler);
		if (this.element) {
			this._bindHandlers();
		}
		return this;
	}

	////////////////////////////////////////////////////////////////////////////////
	// Toolbar
	////////////////////////////////////////////////////////////////////////////////

	function Toolbar(parentNode) {
		if (!Toolbar._nextID) Toolbar._nextID = 0;
		this.contents = [];
		this.element = document.createElement('div');
		this.element.id = 'mac-toolbar-' + Toolbar._nextID++;
		this.element.className = 'mac-toolbar';
		(parentNode || document.body).appendChild(this.element);

		// prevent selection and dragging
		$(this.element).mousedown(function(e) {
			return e.target.tagName.toLowerCase() == 'input';
		});
	}

	Toolbar.prototype.height = function() {
		return $(this.element).outerHeight();
	};

	Toolbar.prototype.setContents = function(contents) {
		// generate the html
		var html = '';
		for (var i = 0; i < contents.length; i++) {
			html += contents[i]._toHTML(this.element.id + '-' + i);
		}
		this.element.innerHTML = html;

		// bind the handlers
		for (var i = 0; i < contents.length; i++) {
			contents[i].element = document.getElementById(this.element.id + '-' + i);
			contents[i]._bindHandlers();
		}
		this.contents = contents;
	};

	////////////////////////////////////////////////////////////////////////////////
	// Toolbar.Button
	////////////////////////////////////////////////////////////////////////////////

	Toolbar.Button = function(name, image) {
		this.image = image;
		this.name = name;
		this.element = null;
		this.handlers = [];
		this.element = null;

		// dynamically load the image since we draw the image to a canvas for darkening
		var this_ = this;
		this.image = new Image();
		this.image.onload = function() {
			if (this_.element) this_._setImage();
		};
		this.image.src = image;
	};

	Toolbar.Button.prototype.click = addHandler;

	Toolbar.Button.prototype._toHTML = function(id) {
		return '<div id="' + id + '" class="section button"><canvas></canvas><div class="label">' + textToHTML(this.name) + '</div></div>';
	};

	Toolbar.Button.prototype._bindHandlers = function() {
		var this_ = this;
		for (var i = 0; i < this.handlers.length; i++) {
			$(this.element).click(this.handlers[i]);
		}

		$(this.element).mouseover(function() {
			$(this).addClass('hovered');
			this_._setImage();
		});
		$(this.element).mouseout(function() {
			$(this).removeClass('hovered');
			this_._setImage();
		});

		$(this.element).mousedown(function() {
			$(this).addClass('pressed');
			this_._setImage();

			var mouseup = function() {
				$(document).unbind('mouseup', mouseup);
				$(this_.element).removeClass('pressed');
				this_._setImage();
			};
			$(document).mouseup(mouseup);
		});

		this._setImage();
	};

	Toolbar.Button.prototype._setImage = function() {
		var c = this.element.firstChild.getContext('2d');
		var w = c.canvas.width = this.image.width;
		var h = c.canvas.height = this.image.height;
		c.drawImage(this.image, 0, 0);

		// darken the image during clicking
		// for security reasons, this only works when the image is on the same domain!
		if ($(this.element).is('.hovered.pressed')) {
			var data = c.getImageData(0, 0, w, h);
			for (var x = 0; x < w; x++) {
				for (var y = 0; y < h; y++) {
					var i = (x + y * w) * 4;
					data.data[i + 0] *= 0.6;
					data.data[i + 1] *= 0.6;
					data.data[i + 2] *= 0.6;
				}
			}
			c.putImageData(data, 0, 0, 0, 0, w, h);
		}
	};

	////////////////////////////////////////////////////////////////////////////////
	// Toolbar.Segments
	////////////////////////////////////////////////////////////////////////////////

	Toolbar.Segments = function(name, names) {
		this.name = name;
		this.names = names;
		this.selectedIndex = -1;
		this.handlers = [];
		this.element = null;
	};

	Toolbar.Segments.prototype.change = addHandler;

	Toolbar.Segments.prototype.setSelectedIndex = function(index) {
		$(this.element).find('.segment').each(function(segmentIndex) {
			if (segmentIndex == index) {
				$(this).addClass('selected');
			} else {
				$(this).removeClass('selected');
			}
		});
		this.selectedIndex = index;
		for (var i = 0; i < this.handlers.length; i++) {
			this.handlers[i](index);
		}
		return this;
	};

	Toolbar.Segments.prototype._toHTML = function(id) {
		var html = '';
		for (var i = 0; i < this.names.length; i++) {
			html += '<div class="segment';
			html += (i == 0 ? ' first' : i == this.names.length - 1 ? ' last' : '');
			html += (i == this.selectedIndex ? ' selected' : '');
			html += '">' + textToHTML(this.names[i]) + '</div>';
		}
		return '<div id="' + id + '" class="section segments">' + html + '<div class="label">' + textToHTML(this.name) + '</div></div>';
	};

	Toolbar.Segments.prototype._bindHandlers = function() {
		var this_ = this;
		$(this.element).find('.segment').each(function(index) {
			$(this).mousedown(function() {
				this_.setSelectedIndex(index);
			});
		});
	};

	////////////////////////////////////////////////////////////////////////////////
	// Toolbar.Search
	////////////////////////////////////////////////////////////////////////////////

	Toolbar.Search = function(name, placeholder) {
		this.name = name || 'Search';
		this.placeholder = placeholder || '';
		this.text = '';
		this.handlers = [];
		this.element = null;
	};

	Toolbar.Search.prototype.change = addHandler;

	Toolbar.Search.prototype.setText = function(text) {
		$(this.element).val(text);
		this.text = text;
		for (var i = 0; i < this.handlers.length; i++) {
			this.handlers[i](text);
		}
		return this;
	};

	Toolbar.Search.prototype._toHTML = function(id) {
		var html = '<input type="text" placeholder="' + textToHTML(this.placeholder) + '" value="' + textToHTML(this.text) + '">';
		return '<div id="' + id + '" class="section search">' + html + '<div class="label">' + textToHTML(this.name) + '</div></div>';
	};

	Toolbar.Search.prototype._bindHandlers = function() {
		var this_ = this;
		var input = this.element.firstChild;
		function update() {
			this_.setText(input.value);
		}
		$(input).change(update);
		$(input).bind('input', update);
		$(input).bind('textInput', update);
	};

	return Toolbar;
})();
