// This function object represent a single channel
// Visually it is the waveform display of the audio sequence data of this channel
function Channel(elementContext) {
    this.elementContext = elementContext;
    this.elementContext.channel = this;

    // References to the elements
    this.audioController = undefined; // The <audiocontroller> this channel is attached to
    this.canvasReference = undefined; // Used for waveform display
    this.audioSequenceReference = undefined; // The audio sequence data this channel stores

    // Size
    this.canvasHeight = 150;
    this.canvasWidth = elementContext.parentNode.parentNode.clientWidth - 50;

    // Colors
    this.backgroundColor = "rgba(0, 0, 0, 1)"; // Background color
    this.plotColor = "rgba(255, 255, 0, 0.9)"; // Color used to plot the waveform
    this.overlayLineColor = "rgba(255, 255, 255, 0.5)";
    this.overlayTextColor = "rgba(255, 255, 255, 1)";

    // Font
    this.overlayTextFont = "14px Arial";

    // Data points used for drawing the waveform display
    this.visualizationData = [];

    // Zoom
    this.viewResolution = 10; // Default 10 seconds
    this.viewPos = 0; // at 0 seconds

    // Create the visual display of the waveform using a <canvas>
    this.createDisplay = function createDisplay() {
        // Create a canvas element from code and append it to the <audiocontroller>
        this.canvasReference = document.createElement("canvas");
        this.canvasReference.width = this.canvasWidth;
        this.canvasReference.height = this.canvasHeight;
        this.canvasReference.style['border'] = '1px solid #EEE';
        this.elementContext.appendChild(this.canvasReference);
        this.repaint(); // Do an intial repaint
    };

    // Assign a new audio sequence data to this channel
    this.setAudioSequence = function setAudioSequence(newAudioSequenceReference) {
        this.audioSequenceReference = newAudioSequenceReference;
        this.updateVisualizationData();
    };

    // Update the data points used for drawing the waveform display, and then update the waveform display
    this.updateVisualizationData = function updateVisualizationData() {
        this.visualizationData = [];
        var data = this.audioSequenceReference.data;
        var length = Math.round(this.viewResolution);

        // Check if there are too many data points
        if(length > this.canvasReference.width) {
            var dataPerPixel = length / this.canvasReference.width; // Combine data points into 1 single data
            for(var i = 0; i < this.canvasReference.width; ++i) {
                var dataFrom = this.viewPos + Math.round(i * dataPerPixel);
                var dataTo = this.viewPos + Math.round((i + 1) * dataPerPixel) + 1;

                // Check if the start and end of the set of data points are inside the valid range
                if(dataFrom >= 0 && dataFrom < data.length && dataTo >= 0 && dataTo < data.length) {
                    var peakAtFrame = this.getPeakInFrame(dataFrom, dataTo, data);
                    this.visualizationData.push(peakAtFrame);
                } else { // The start or end of the set of data points are outside the valid range
                    this.visualizationData.push({ min: 0.0, max: 0.0 });
                }
            }
            // Change to use plot technique 1, see `paintWaveform()` for the details
            this.visualizationData.plotTechnique = 1;
        } else { // We have at least 1 pixel to draw 1 data point
            // The horizontal space (in pixel) between 2 data points
            var pixelPerData = this.canvasReference.width / length;
            var x = 0;
            for(var i = 0, j = this.viewPos; i <= length && j < data.length; ++i, ++j) {
                // If the data point is outside the valid range, use 0 for the amplitude
                if(j < 0 || j >= data.length) {
                    this.visualizationData.push({ x: x, y: 0.0 });
                } else {
                    this.visualizationData.push({ x: x, y : data[j] });
                }
                x += pixelPerData;
            }
            // Change to use plot technique 2, see `paintWaveform()` for the details
            this.visualizationData.plotTechnique = 2;
        }

        this.repaint(); // Do an intial repaint
    };

    // Repaint the waveform display
    this.repaint = function repaint() {
        if(this.canvasReference === undefined) return; // No canvas, no paint

        // Get the context of the canvas for drawing
        var canvasContext = this.canvasReference.getContext('2d');
        this.clearCanvas(canvasContext); // Clear the drawing area
        this.paintBackground(canvasContext); // Draw background

        // If no audio sequence is attached, nothing can be rendered
        if(this.audioSequenceReference !== undefined) {
            this.paintWaveform(canvasContext); // Draw the waveform
        }
        this.paintOverlayMarkings(canvasContext); // Draw the overlay markings
    };

    // Clear the waveform display
    this.clearCanvas = function clearCanvas(canvasContext) {
        canvasContext.clearRect(0, 0, this.canvasReference.width, this.canvasReference.height);
    };

    // A helper function to limit the floating point number to `numberOfDecimalPlaces` d.p.
    this.toDP = function toDP(input, numberOfDecimalPlaces) {
        var adjustment = Math.pow(10, numberOfDecimalPlaces);
        return Math.floor(input * adjustment) / adjustment;
    };

    // Draw different markings on top of the waveform
    this.paintOverlayMarkings = function paintOverlayMarkings(canvasContext) {
        // Some variable for positioning and sizing
        var height = this.canvasReference.height;
        var width = this.canvasReference.width;
        var halfHeight = this.canvasReference.height / 2;
        var halfWidth = this.canvasReference.width / 2;
        var textOffset = 14;

        // Draw the horizontal zero reference line
        canvasContext.strokeStyle = this.overlayLineColor;
        canvasContext.beginPath();
        canvasContext.moveTo(0, halfHeight);
        canvasContext.lineTo(width, halfHeight);
        canvasContext.stroke();

        canvasContext.font = this.overlayTextFont;
        canvasContext.fillStyle = this.overlayTextColor;
        canvasContext.textAlign = "left";

        // Draw the chaneel title on the top left hand corner
        canvasContext.fillText(this.title, 2, textOffset);

        // Draw the time references
        // The starting seconds
        var t = this.toDP(this.getSampleToSeconds(this.viewPos), 4);
        canvasContext.fillText(t + "s", 2, halfHeight + textOffset);

        // The `duration`
        canvasContext.textAlign = "right";
        t = this.toDP(this.getSampleToSeconds(this.viewPos + this.viewResolution), 4);
        canvasContext.fillText(t + "s", width, halfHeight + textOffset);

        // The half of `duration`
        canvasContext.textAlign = "center";
        t = this.toDP(this.getSampleToSeconds(this.viewPos + this.viewResolution / 2), 4);
        canvasContext.fillText(t + "s", halfWidth, halfHeight + textOffset);
    };

    // Fill the waveform display
    this.paintBackground = function paintBackground(canvasContext) {
        canvasContext.fillStyle = this.backgroundColor;
        canvasContext.fillRect(0, 0, this.canvasReference.width, this.canvasReference.height);
    };

    // Draw the waveform
    this.paintWaveform = function paintWaveform(canvasContext) {
        var audioSequence = this.audioSequenceReference;
        var center = this.canvasReference.height / 2;

        // Move to the center left position to start drawing
        canvasContext.strokeStyle = this.plotColor;
        canvasContext.beginPath();
        canvasContext.moveTo(0, center);

        // Choose the drawing style of the waveform
        if(this.visualizationData.plotTechnique === 1) { // More than 1 data point per pixel
            for(var i = 0; i < this.canvasReference.width; ++i) {
                var peakAtFrame = this.visualizationData[i];

                // Draw a vertical line from min to max. To make sure something is drawing
                // even when min === max, a 1.0 offset is added.
                canvasContext.moveTo(i + 0.5, center + peakAtFrame.min * -center);
                canvasContext.lineTo(i + 0.5, (center + peakAtFrame.max * -center) + 1.0);
            }
        } else if(this.visualizationData.plotTechnique === 2) {
            for(var i = 0; i < this.visualizationData.length; ++i) {
                var x = this.visualizationData[i].x;
                var y = center + this.visualizationData[i].y * -center;

                canvasContext.lineTo(x, y);

                // Draw edges around each data point
                canvasContext.moveTo(x + 1, y - 1);
                canvasContext.lineTo(x + 1, y + 1);
                canvasContext.moveTo(x - 1, y - 1);
                canvasContext.lineTo(x - 1, y + 1);
                canvasContext.moveTo(x - 1, y + 1);
                canvasContext.lineTo(x + 1, y + 1);
                canvasContext.moveTo(x - 1, y - 1);
                canvasContext.lineTo(x + 1, y - 1);

                canvasContext.moveTo(x, y);
            }
        }

        // Draw the waveform
        canvasContext.stroke();
    };

    // Find the minimum and maximum values in a given time frame
    this.getPeakInFrame = function getPeakInFrame(from, to, data) {
        var fromRounded = Math.round(from); // This should be integer
        var toRounded = Math.round(to); // This should be integer
        var min = 1.0; // Set a high enough value for the minimum
        var max = -1.0; // Set a low enough value for the maximum

        if(fromRounded < 0 || toRounded > data.length) debugger;

        for(var i = fromRounded; i < toRounded; ++i) {
            var sample = data[i];
            max = (sample > max) ? sample : max;
            min = (sample < min) ? sample : min;
        }

        return { min : min, max : max };
    };

    // Convert from samples to seconds
    this.getSampleToSeconds = function getSampleToSeconds(sampleIndex) {
        return sampleIndex / sampleRate;
    };

    // Convert from seconds to samples
    this.getSecondsToSample = function getSecondsToSample(seconds) {
        return seconds * sampleRate;
    };

    // Zoom the visual display to show only the first `numberOfSamples` samples
    this.zoom = function zoom(numberOfSamples, zoomStartFrom) {
        this.viewPos = Math.floor(zoomStartFrom) || 0;
        this.viewResolution = numberOfSamples;
        this.updateVisualizationData();
        this.repaint();
    }

    // Zoom using number of seconds
    this.zoomToSeconds = function zoomToSeconds(numberOfSeconds, zoomStartFrom) {
        var numberOfSamples = numberOfSeconds * this.audioSequenceReference.sampleRate;
        this.zoom(numberOfSamples, zoomStartFrom * this.audioSequenceReference.sampleRate);
    };

    // Zoom using number of cycles
    this.zoomToCycles = function zoomToCycles(numberOfCycles, zoomStartFrom) {
        var samplePerCycle = this.audioSequenceReference.sampleRate / parseInt($("#waveform-frequency").val());
        var numberOfSamples = numberOfCycles * samplePerCycle;
        this.zoom(numberOfSamples, zoomStartFrom * this.audioSequenceReference.sampleRate);
    };

    // Zoom to show everything
    this.zoomToFit = function zoomToFit() {
        this.zoom(this.audioSequenceReference.data.length);
    };

    // Generate a new waveform according to the parameters
    this.generateWaveform = function generateWaveform() {
        // Gather the basic parameters
        var selectedWaveType = currentWaveformType;
        var freq = parseInt($("#waveform-frequency").val());
        var stereoPosition = parseFloat($("#waveform-position").val());

        // Adjust the maximum amplitude of this channel
        var amp = 1.0;
        if(this.title === "Left Channel") {
            amp *= (1 - stereoPosition);
        } else {
            amp *= stereoPosition;
        }

        // Show the information of what is being generated in the console
        console.log(this.title + ": Generating waveform of type '" + selectedWaveType + "' with frequency " + freq + "Hz and amplitude " + amp);

        // Generate the audio samples data
        var newWaveformAudioSequence = WaveformGenerator.generateWaveform(selectedWaveType, freq, amp, duration);

        // Create a AudioSequence object with the audio samples data
        var newAudioSequenceReference = new CreateNewAudioSequence(newWaveformAudioSequence);

        // Attach the newly created AudioSequence to this channel
        this.setAudioSequence(newAudioSequenceReference);
    };

    // Generate a new waveform according to the JSON
    this.generateMusic = function generateMusic(data) {
        // Gather the basic parameters
        var selectedWaveType = currentWaveformType;

        var stereoPosition = parseFloat($("#waveform-position").val());

        var enabledPostProcessing = $("#importMidiEnablePostProcessing").is(":checked");

        var pass = currentEffects.indexOf("adsr");
        var durationAdjustment = 0;
        if(enabledPostProcessing && pass !== -1) {
            durationAdjustment = parseFloat($("#adsr-release-duration").data("p" + (pass + 1)))
        }

        // Adjust the maximum amplitude of this channel
        var amp = 1.0;
        if(this.title === "Left Channel") {
            amp *= (1 - stereoPosition);
        } else {
            amp *= stereoPosition;
        }

        var useDuration = $("#importMidiUseDuration").is(":checked");

        var maxDuration = 0;

        // Find the duration of the music
        for(var i = 0; i < data.length; ++i) {
            var newDuration = data[i].startTime;
            newDuration += useDuration ? data[i].duration + durationAdjustment : 6.0;
            maxDuration = Math.max(newDuration, maxDuration);
        }
        maxDuration = Math.ceil(maxDuration * sampleRate);

        // Create the array for storing the music samples data
        var newMusicAudioSequence = Array(maxDuration);
        for(var i = 0; i < newMusicAudioSequence.length; ++i) {
            newMusicAudioSequence[i] = 0.0;
        }

        // Generate the notes and add them to the music samples data
        for(var i = 0; i < data.length; ++i) {
            // Calculate the frequency from the pitch
            var freq = getFrequenceyFromPitch(data[i].pitch);
            var noteAmp = data[i].vol / 127.0 * amp;

            // Generate a long enough waveform
            var newWaveformAudioSequence;
            if(useDuration) {
                newWaveformAudioSequence = WaveformGenerator.generateWaveform(selectedWaveType, freq, noteAmp, data[i].duration + durationAdjustment);
            } else {
                newWaveformAudioSequence = WaveformGenerator.generateWaveform(selectedWaveType, freq, noteAmp, 6.0);
            }

            // Apply post-processings, if enabled
            if(enabledPostProcessing) {
                // Create an AudioSequence object and attach it to this channel, so that we can post-process it
                var tempAudioSequence = new CreateNewAudioSequence(newWaveformAudioSequence);
                this.setAudioSequence(tempAudioSequence)

                for(var pp = 1; pp <= currentEffects.length; ++pp) {
                    Postprocessor.postprocess([this], currentEffects[pp - 1], pp);
                }

                // Get back the post-processed samples data
                newWaveformAudioSequence = tempAudioSequence.data;
            }

            // Add the note to the music
            var startIndex = Math.floor(data[i].startTime * sampleRate);
            for(var j = 0; j < newWaveformAudioSequence.length && startIndex + j < newMusicAudioSequence.length; ++j) {
                newMusicAudioSequence[startIndex + j] += newWaveformAudioSequence[j];
            }
        }

        // Create a AudioSequence object with the music samples data
        var newAudioSequenceReference = new CreateNewAudioSequence(newMusicAudioSequence);

        // Attach the newly created AudioSequence to this channel
        this.setAudioSequence(newAudioSequenceReference);
    };

    // Calculate the frequency of the pitch
    function getFrequenceyFromPitch(pitch) {
        return 27.5 * Math.pow(2, (pitch - 21) / 12.0);
    }

    // Scan for attributes during the creation
    if((typeof this.elementContext.attributes.title !== undefined) && this.elementContext.attributes.title !== null) {
        this.title = this.elementContext.attributes.title.value;
    }

    // Create this element's visual display
    this.createDisplay();
}
