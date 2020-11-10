// This is the Turtle class for drawing the L-system
function Turtle(svgGroup) {
    // Store the SVG group
    this._svgGroup = svgGroup;

    // Line array
    this._lines = [];

    // Initialize the turtle
    this.reset();
}

// Initialize the attributes
Turtle.prototype.reset = function() {
    // Position of the turtle
    this._x = 0;
    this._y = 0;

    // Heading of the turtle
    this._heading = 0;

    // Colour of the turtle
    this._color = "black";

    // Pen width of the turtle
    this._width = 1;

    // Pen up/down
    this._penDown = true;

    // Remove all the lines
    for (var i = 0; i < this._lines.length; i++) {
        this._lines[i].remove();
    }
    this._lines.length = 0;
};

// Get the position of the turtle
Turtle.prototype.pos = function() {
    return [this._x, this._y];
}

// Get the heading of the turtle
Turtle.prototype.heading = function() {
    return this._heading;
}

// Set the color
Turtle.prototype.color = function(color) {
    this._color = color;
}

// Set the width
Turtle.prototype.width = function(width) {
    this._width = width;
}

// Lift the pen up
Turtle.prototype.up = function() {
    this._penDown = false;
}

// Put the pen down
Turtle.prototype.down = function() {
    this._penDown = true;
}

// Go to a position (x, y)
Turtle.prototype.goto = function(x, y) {
    if (this._penDown) {
        // Draw the line from the original (x, y) to the new (x, y)
        var line = 
            $(document.createElementNS("http://www.w3.org/2000/svg", "line"));
        line.attr({
            "x1": this._x, "y1": this._y,
            "x2": x, "y2": y,
            "stroke": this._color,
            "stroke-width": this._width,
            "stroke-linecap": "round"
        });
        this._svgGroup.append(line);

        this._lines.push(line);
    }

    // Update the position
    this._x = x;
    this._y = y;
};

// Go to the home position (0, 0)
Turtle.prototype.home = function() {
    this.goto(0, 0);
};

// Move forward
Turtle.prototype.forward = function(length) {
    var x = this._x + length * Math.cos(this._heading / 180 * Math.PI);
    var y = this._y + length * Math.sin(this._heading / 180 * Math.PI);

    this.goto(x, y);
};

// Move backward
Turtle.prototype.backward = function(length) {
    this.forward(-length);
};

// Turn right
Turtle.prototype.setHeading = function(heading) {
    this._heading = heading;
};

// Turn left
Turtle.prototype.left = function(angle) {
    this._heading = this._heading - angle;
};

// Turn right
Turtle.prototype.right = function(angle) {
    this._heading = this._heading + angle;
};
