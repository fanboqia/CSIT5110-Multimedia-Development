// The turtle for drawing the L-system
var turtle;

// Fix the ids of the rules
function fixRuleIds() {
    var $rows = $("div.lsystem-rule-row");
    jQuery.each($rows, function(index) {
        $(this).find("input[id^=lsystem-rule-symbol]").
                 attr("id", "lsystem-rule-symbol-" + (index + 1));
        $(this).find("input[id^=lsystem-rule-replacement]").
                 attr("id", "lsystem-rule-replacement-" + (index + 1));
    });
}

// Add one more rule to the L-System
function addRule(e) {
    // Add a new row with empty fields
    var $lastRow = $("div.lsystem-rule-row:last");
    var $newRow = $lastRow.clone();
    $newRow.find("input[id^=lsystem-rule-symbol]").val("");
    $newRow.find("input[id^=lsystem-rule-replacement]").val("");
    $("#add-rule-row").before($newRow);

    // Reset the input field ids
    fixRuleIds();

    // Enable/disable the rule buttons
    var rowNumber = $("div.lsystem-rule-row").length;
    $(".lsystem-rule-delete").prop("disabled", (rowNumber == 1));
    $("#lsystem-add-rule-button").prop("disabled", (rowNumber == 5));
}

// Delete one rule from the L-System
function deleteRule(e) {
    // Remove the row
    var $row = $(e.target).parents("div.lsystem-rule-row");
    $row.remove();

    // Reset the input field ids
    fixRuleIds();

    // Enable/disable the rule button
    var rowNumber = $("div.lsystem-rule-row").length;
    $(".lsystem-rule-delete").prop("disabled", (rowNumber == 1));
}

// Fix the ids of the colours
function fixColorIds() {
    var $rows = $("div.lsystem-color-row");
    jQuery.each($rows, function(index) {
        $(this).find("input[id^=lsystem-color-symbol]").
                 attr("id", "lsystem-color-symbol-" + (index + 1));
        $(this).find("input[id^=lsystem-color-color]").
                 attr("id", "lsystem-color-color-" + (index + 1));
    });
}

// Add one more colour to the L-System
function addColor(e) {
    // Add a new row with empty fields
    var $lastRow = $("div.lsystem-color-row:last");
    var $newRow = $lastRow.clone();
    $newRow.find("input[id^=lsystem-color-symbol]").val("");
    $newRow.find("input[id^=lsystem-color-color]").val("");
    $("#add-color-row").before($newRow);

    // Reset the input field ids
    fixColorIds();

    // Enable/disable the color buttons
    var rowNumber = $("div.lsystem-color-row").length;
    $(".lsystem-color-delete").prop("disabled", (rowNumber == 1));
    $("#lsystem-add-color-button").prop("disabled", (rowNumber == 5));
}

// Delete one color from the L-System
function deleteColor(e) {
    // Remove the row
    var $row = $(e.target).parents("div.lsystem-color-row");
    $row.remove();

    // Reset the input field ids
    fixColorIds();

    // Enable/disable the colour button
    var rowNumber = $("div.lsystem-color-row").length;
    $(".lsystem-color-delete").prop("disabled", (rowNumber == 1));
}

// Set up every things when the document is fully loaded
$(document).ready(function() {
    // Set the events for the buttons
    $("#btnRefresh").on("click", refreshTextures);
    $("#lsystem-add-rule-button").on("click", addRule);
    $(document).on("click", ".lsystem-rule-delete", deleteRule);
    $("#lsystem-add-color-button").on("click", addColor);
    $(document).on("click", ".lsystem-color-delete", deleteColor);
    $("#btnDrawTree").on("click", drawTree);

    // Show the tabs
    $('#tab-controls a:first').tab('show');
    $('#lsystem-tabs a:first').tab('show');

    // Make the turtle for drawing
    turtle = new Turtle($("#tree"));
});
