// Retrieve the sampling rate (usually 44100 or 48000)
var sampleRate = new (window.AudioContext || window.webkitAudioContext)().sampleRate; 
var duration = 6.0 // The default duration of the  waveform, in seconds
var audioControl = null; // The 'audioController' instance
var currentWaveformType = "sine-time"; // Currently selected waveform type
var currentEffects = ["no-pp", "no-pp", "no-pp", "no-pp", "no-pp"]; // Currently selected post-processings
var currentZoomLevel = "all"; // Currently selected zoom mode
var zoomStartFrom = 0.0; // Zoom start from (in seconds)

// Event handler for the 'change' event of the zoom <select>
function changeZoomLevel(e) {
    currentZoomLevel = $("#zoomLevel").val();
    if (currentZoomLevel == "all") {
        $("#zoomStartFrom").prop("disabled", true);
    } else {
        $("#zoomStartFrom").prop("disabled", false);
    }
    zoomStartFrom = parseFloat($("#zoomStartFrom").val());
    audioControl.zoom();
}

// Trigger the waveform generation and post-processings applied to
// the newly d waveform. When the generation process is completed,
// enable the "Save" button again.
function generateNewWaveform() {
    audioControl.generateWaveform();
    $("#savelink").removeClass("disabled");
}

// Event handler for the 'change' event of different parameter controls <input>
function updateWaveformDisplay(e) {
    // Disables the "Save" button
    $("#savelink").addClass("disabled");

    // Stop the audio that is currently playing back, if any
    audioControl.stop();

    var target = $(e.target);

    // If the event is triggered by an element that has "data-active" attribute,
    // store the new value into the correct "data-ppX" attribute. The "data-ppX"
    // attribute is used by the postprocessor in the post-processing stage.
    var activePP = target.data("active");
    if (activePP) {
        target.data(activePP, target.val());
    }

    // The parameters are ready, start the waveform generation 0.5 seconds
    // later. This short delay allows the browser to update the GUI, which
    // greatly reduce the feeling of laggy.
    setTimeout(generateNewWaveform, 500);
}

// Handle the post-processings tabs
function updatePostProcessingPaneInfo(target) {
    // The "data-pp" attribute stores which stage the post-processing is, e.g. 1 for post-processing 1
    var ppStage = parseInt(target.data("pp"));

    // Update the tab's title to the newly selected post-processing
    target.parents("li").find("span.title").html(target.html());

    // Update the currently selected post-processing stored in the memory
    currentEffects[ppStage - 1] = target.attr("href").substring(1);

    // In the tab pane, find every parameters control <input>s
    $(target.attr("href") + " input").each(function(i, e) {

        // Update their values to the previously set value, if any
        var oldValue = $(e).data("p" + ppStage);
        if ($(e).data("p" + ppStage)) {
            $(e).val(oldValue);
        }

        // Set the "data-active" attribute to "pX", so that when the <input> element
        // is changed, the event handler knows which "data-pX" need to be updated,
        // and store the newly selected value
        $(e).data("active", "p" + ppStage);
    });
}

// Event handler for the 'click' event of the tabs
// The main goal of this handler is to improve the user experience by adding
// the behaviour of switching tab when the tab is clicked, in additional to
// the default behaviour which switch the tab only when the drop down menu
// items (list of choices of waveform/post-processings) are clicked
function showTab(e) {
    // The target is the 'tab', i.e. the <li>. But most of the time the event
    // is triggered from the <a> inside it, due to the area occupied is much
    // bigger and hence easier to be clicked. So we need to adjust the 'target'
    // if it is not what we want.
    var target = $(e.target);

    // Check if 'target' is actually a <li> element. If not, we need to
    // find the <li> that is a parent of the current selected element.
    if (target.prop("tagName") !== "LI") {
        target = target.parents("li");
    }

    // Find the drop down menu items (list of choices of waveform/post-processings),
    // and see if the "data-pp" attribute exist. If yes that mean it is one of the
    // post-processing tab being clicked, otherwise it is the waveform tab being
    // clicked.
    var ppStage = parseInt(target.find("ul li a").data("pp"));
    if (ppStage) {
        // Find the drop down menu item of this tab (i.e. the post-processing) that is currently selected
        target = target.find("ul li a[href='#" + currentEffects[ppStage - 1] + "']");
    } else {
        // Find the drop down menu item of this tab (i.e. the waveform) that is currently selected
        target = target.find("ul li a[href='#" + currentWaveformType + "']");
    }

    // Show the tab and make the tab active
    target.trigger('click');
}

// Event handler for the 'click' event of the tab dropdown items.
// This event handler is executed when a dropdown item is clicked on.
function changeTabs(e) {
    // The target is the drop down menu item of the tab
    var target = $(e.target);

    // Check if 'target' is actually an <a> element. If not, we need to
    // find the <a> that is a parent of the current selected element.
    if (target.prop("tagName") !== "A") {
        target = target.parents("a");
    }

    // Show the tab and make the tab active
    target.tab('show');
    target.toggleClass("active");
    target.parents(".nav-item").find(".nav-link").toggleClass("active");

    // Check if it is for the "waveform" tab
    if (target.hasClass("waveform-type")) {
        // Change the tab title to relect which waveform is selected
        target.parents("li").find("span.title").html(target.html());
        // Change the 'currentWaveformType' stored in the memory
        currentWaveformType = $(e.target).attr("href").substring(1);
    } else {
        // Handle nothing
        updatePostProcessingPaneInfo(target);
    }

    e.preventDefault();
}

// Event handler for the 'click' event of the 'btnImportMIDI'
// Read the JSON file from the file input
function importMIDI(e) {
    // Stop the audio that is currently playing back, if any
    audioControl.stop();

    // Disable the 'Import' and 'Save Music' buttons
    $("#saveMidiLink").addClass("disabled");
    $("#btnImportMIDI").prop("disabled", true);

    console.log("Generating music from MIDI...");

    if ($("#importMidiJSONFile")[0].files && $("#importMidiJSONFile")[0].files.length > 0) {
        var file = $("#importMidiJSONFile")[0].files[0];

        if (file.name.split('.').pop() == "json") { // Ignore non-JSON file
            var reader = new FileReader();

            reader.onload = (function(file) {
                return function(e) {
                    try {
                        var data = JSON.parse(e.target.result);
                        // Start generating the music
                        audioControl.generateMusicFromMIDI(data);
                        // Enable the 'Import' and 'Save Music' buttons
                        $("#saveMidiLink").removeClass("disabled");
                    } catch (err) {
                        console.log(err);
                        alert("Failed to load the JSON file");
                    } finally {
                        // Enable the 'Import' button
                        $("#btnImportMIDI").prop("disabled", false);
                    }
                }
            })(file);

            reader.readAsText(file);
        }
    } else {
        alert("Please select a JSON file first!");
        // Enable the 'Import' button
        $("#btnImportMIDI").prop("disabled", false);
    }
}

// Toggle the enable/disable state of the UI controls
function toggleControl(e) {
    if ($(e.target).data("toggleTarget") === undefined) return;

    var UIControlsToToggle = $(e.target).data("toggleTarget").split(",");

    if ($(e.target).attr("type") == "checkbox") {
        for (var i = 0; i < UIControlsToToggle.length; ++i) {
            var target = $("#" + UIControlsToToggle[i]);
            target.prop("disabled", !target.prop("disabled"));
        }
    } else {
        if ($(e.target).data("disableIf") == $(e.target).val()) {
            for (var i = 0; i < UIControlsToToggle.length; ++i) {
                var target = $("#" + UIControlsToToggle[i]);
                target.prop("disabled", true);
            }
        } else {
            for (var i = 0; i < UIControlsToToggle.length; ++i) {
                var target = $("#" + UIControlsToToggle[i]);
                target.prop("disabled", false);
            }
        }
    }
}

// Set up every things when the document is fully loaded
$(document).ready(function() {
    // Check if the required WebAPIs are available
    if (typeof(window.AudioContext || window.webkitAudioContext) === 'undefined') {
        alert('Your browser has no web audio API support! Try using another browser like Google Chrome.');
        return;
    }

    if (!window.File || !window.FileReader || !window.FileList || !window.Blob) {
        alert('Your browser has no file API support! Try using another browser like Google Chrome.');
        return;
    }

    // Great! Start setting up

    // First of all, bring the <audioController> online.
    // The constructor will takes the first <audioController> element and prepares
    // all the visual properties of it, sets it up so that we can use it like a normal
    // HTML DOM element.
    initializeAudioControllers();

    // Find the only <audioController> element, which has an ID "audioController"
    audioControl = document.querySelector("#audioController");

    // Remove any predefined channels attached to it
    audioControl.removeAllChannels();

    // Add two channels to it with label "Left Channel" and "Right Channel"
    // which are used as the left and right channels of our stereo music
    audioControl.createChannel("Left Channel");
    audioControl.createChannel("Right Channel");

    // Enable Bootstrap Toggle
    $("input[type=checkbox]").bootstrapToggle();

    // Set up the event handlers
    $("#zoomLevel").on("change", changeZoomLevel); // Zoom level changed
    $("#zoomStartFrom").on("change", changeZoomLevel); // Zoom start time changed
    $('a.nav-link').on("click", showTab); // Tab clicked
    $('a.dropdown-item').on("click", changeTabs); // Tab item clicked
    $('a.dropdown-item').on('shown.bs.tab', updateWaveformDisplay); // After tab pane is shown
    $('.toggle-control').on('change', toggleControl); // Toggle-able is toggled
	
    // Any changes made to the <input> elements will trigger the waveform generation
    // procedure 'updateWaveformDisplay'.
    // After setting up the event handler, we also take the first element in the set
    // and programmatically trigger a 'change' event.
    $("#karplus-base, #additiveSynthExample, input").not("[id^=import], #zoomStartFrom").on("change", updateWaveformDisplay).first().change();

    // Play and Stop button
    $("#btnPlay").on("click", function() { audioControl.play(); });
    $("#btnStop").on("click", function() { audioControl.stop(); });

    // Import MIDI (in JSON format)
    $("#btnImportMIDI").on("click", importMIDI);
});
