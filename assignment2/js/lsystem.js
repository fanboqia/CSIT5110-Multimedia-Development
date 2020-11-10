// Check if a given symbol is a digit
function isDigit(input) {
    var digits = "0123456789";
    return (input.length == 1 && digits.indexOf(input) >= 0);
}

// Get the next number from the string and return
// the next position following the number
function getNumberFromString(string, index) {
    // Get the number
    var number = "";
    while (index < string.length && isDigit(string[index])) {
        number = number + string[index];
        index++;
    }

    // If there is no number to read, the returned number will be NaN
    return { number: parseInt(number), next: index };
}

// Draw the tree given the settings in the system
function drawTree() {
    // Get the L-system parameters
    var start = $("#lsystem-start").val().trim();
    var iterations = parseInt($("#lsystem-iterations").val());
    var length = parseFloat($("#lsystem-length").val());
    var angle = parseFloat($("#lsystem-angle").val());
    var width = parseFloat($("#lsystem-width").val());
    var lengthRatio = parseFloat($("#length-ratio").val());
    var widthRatio = parseFloat($("#width-ratio").val());
    var baseFrequency = parseFloat($("#random-frequency").val());
    var scale = parseFloat($("#random-strength").val());

    // Create the rules
    var rules = {};
    for (var i = 1; i <= 5; i++) {
        if ($("#lsystem-rule-symbol-" + i).length > 0) {
            var symbol = $("#lsystem-rule-symbol-" + i).val().trim();
            var replacement = $("#lsystem-rule-replacement-" + i).val().trim();

            if (symbol != "" && replacement != "")
                rules[symbol] = replacement;
        }
    }

    // Create the colours
    var colors = {};
    for (var i = 1; i <= 5; i++) {
        if ($("#lsystem-color-symbol-" + i).length > 0) {
            var symbol = $("#lsystem-color-symbol-" + i).val().trim();
            var color = $("#lsystem-color-color-" + i).val().trim();

            if (symbol != "") colors[symbol] = color;
        }
    }

    // Randomise the tree display
    /**
     * TODO: Add your code here to adjust the random filter
     **/
     $("#tree_noise").attr("baseFrequency",baseFrequency);
     $("#displace").attr("scale",scale);

    // Reset the tree area
    turtle.reset();

    // Go to the starting position
    /**
     * TODO: You may adjust the starting position depending
     *       on the positioning of your grass texture
     **/
    turtle.up();
    turtle.goto(250, 405);
    turtle.left(90);
    turtle.down();

    // Run the L-system
    var string = runLSystem(start, rules, iterations);

    // Put the result string in the right place
    $("#lsystem-result-string").val(string);

    // Draw the final string
    drawLSystem(turtle, string, length, angle, width,
                lengthRatio, widthRatio, colors);
}

// Run the L-system to get the final L-system string
function runLSystem(start, rules, iterations) {
    var string = start;

    // Run the L-system for the specified iterations
    for (var i = 0; i < iterations; i++) {
        var result = "";

        for (var j = 0; j < string.length;) {

            if(string[j] == "[" || string[j] == "]" || string[j] == "+" || string[j] == "-"){
                result+=string[j];
                j++;
                continue;
            }

            var symbol = string[j];

            var strObj = getNumberFromString(string,j);
            var addFactor = 0;
            var flag = isNaN(strObj["number"]);
            var temp;
            if(flag){
                temp = getNumberFromString(string,j+1);
                addFactor = temp["number"];
            }

            // Assume the replacement is the letter/symbol itself
            var replacement = symbol;

            // Update the replacement is the letter/symbol is in the rule
            if (symbol in rules) {

                replacement = "";
                flag = false;

                for(var k = 0; k < rules[symbol].length;){
                    var ruleObj = getNumberFromString(rules[symbol],k);
                    var ruleNum;
                    if(!isNaN(ruleObj["number"])){
                        ruleNum = ruleObj["number"];
                        var sum = ruleNum+addFactor;
                        replacement += sum;
                        k = ruleObj["next"];
                    }else{
                        replacement += rules[symbol][k];
                        k++;
                    }  
                }
            }

            // Add the replacement at the end of the result string
            if(flag){
                replacement+=addFactor;
            }
            result = result + replacement;
            j = temp["next"];
        }
        string = result;
    }

    return string;
}

// Draw the L-system string using the turtle
function drawLSystem(turtle, string, length, angle, width,
                     lengthRatio, widthRatio, colors) {
    /**
     * TODO: You need to prepare a stack data structure
     *       before drawing the L-system image
     **/

    var stack = [];

    for (var i = 0; i < string.length; i++) {
        // The letter/symbol to be handled
        var symbol = string[i];

        /**
         * TODO: You need to extract the associated depth number,
         *       if there is one, next to the current symbol
         **/

        // Move and draw forward
        if ("ABCDEF".indexOf(symbol) >= 0) {
            /**
             * TODO: The colour, width and length can all be different
             *       depending on the L-system settings
             **/
            var num = getNumberFromString(string,i+1)["number"];
            var len = length*Math.pow(lengthRatio,num);
            var wid = width*Math.pow(widthRatio,num);

            turtle.color(colors[symbol] == undefined ? "black" : colors[symbol]);
            turtle.width(wid);
            turtle.forward(len);
        }
        // Move forward without drawing
        else if ("GHIJKL".indexOf(symbol) >= 0) {
            /**
             * TODO: The length can be different depending
             *       on the L-system settings
             **/
            var num = getNumberFromString(string,i+1)["number"];
            var len = length*Math.pow(lengthRatio,num);

            turtle.up();
            turtle.forward(len);
            turtle.down();
        }
        // Turn left
        else if (symbol == "+") {
            turtle.left(angle);
        }
        // Turn right
        else if (symbol == "-") {
            turtle.right(angle);
        }

        /**
         * TODO: You need to extend the above if statement
         *       to include the stack symbols [ and ]
         **/
         if(symbol == "["){
            stack.push([turtle.pos(),turtle.heading()]);
         }
         if(symbol == "]"){
            var res = stack.pop();
            turtle.up();
            turtle.goto(res[0][0],res[0][1]);
            turtle.setHeading(res[1]);
            turtle.down();
         }
    }
}
