// This function object set up the <audiocontroller> element
function audioController(elementContext) {
    this.elementContext = elementContext; // The context of the hosting element
    this.elementContext.audioController = this; // Export this
    this.listOfChannels = []; // List of channels of this audio controller
    this.audioPlayback = new AudioPlayback(); // Create a new playback handler for this audio controller

    // Check if any channel has used the name already
    this.containsChannel = function containsChannel(name) {
        for(var i = 0; i < this.listOfChannels.length; ++i) {
            if(this.listOfChannels[i].title == name) return true;
        }
        return false;
    };

    // Add a new channel to this audio control
    this.addChannel = function addChannel(channel) {
        for(var i = 0; i < this.listOfChannels.length; ++i) {
            if(this.listOfChannels[i].title === channel.title) return;
        }
        this.listOfChannels.push(channel);
    };

    // Remove a specific channel from the aduio control
    this.removeChannel = function removeChannel(channel) {
        for(var i = 0; i < this.listOfChannels.length; ++i) {
            if(this.listOfChannels[i].title === channel.title) {
                this.listOfChannels.splice(i, 1);
            }
        }
    };

    // Create a new channel with specific name
    this.createChannel = function createChannel(name) {
        if(this.audioController.containsChannel(name) === true) return undefined;

        var channelElement = document.createElement("channel");
        channelElement.title = name;
        this.appendChild(channelElement);
        var obj = new Channel(channelElement);
        this.audioController.addChannel(obj);
        return obj;
    };

    // Remove all channels that are added to this audio control
    this.removeAllChannels = function removeAllChannels() {
        for(var i = 0; i < this.children.length; ++i) {
            if(this.children[i].nodeName.toLowerCase() == "channel") {
                this.audioController.removeChannel(this.children[i].Channel);
                this.removeChild(this.children[i]);
                --i;
            }
        }
    };

    // Zoom every channels to show all samples
    this.zoomToFit = function zoomToFit() {
        for(var i = 0; i < this.audioController.listOfChannels.length; ++i) {
            this.audioController.listOfChannels[i].zoomToFit();
        }
    };

    // Zoom every channels to show the first `numberOfCycles` cycles of the samples
    this.zoomToCycles = function zoomToCycles(numberOfCycles) {
        for(var i = 0; i < this.audioController.listOfChannels.length; ++i) {
            this.audioController.listOfChannels[i].zoomToCycles(numberOfCycles, zoomStartFrom);
        }
    };

    // Zoom every channels to show the first `numberOfSeconds` seconds of the samples
    this.zoomToSeconds = function zoomToSeconds(numberOfSeconds) {
        for(var i = 0; i < this.audioController.listOfChannels.length; ++i) {
            this.audioController.listOfChannels[i].zoomToSeconds(numberOfSeconds, zoomStartFrom);
        }
    };

    // Zoom level controller
    this.zoom = function zoom() {
        switch(currentZoomLevel) {
            case "1c":
                this.zoomToCycles(1);
                break;
            case "100ms":
                this.zoomToSeconds(0.1);
                break;
            case "200ms":
                this.zoomToSeconds(0.2);
                break;
            case "1s":
                this.zoomToSeconds(1);
                break;
            case "all":
                this.zoomToFit();
                break;
            default:
                this.zoomToFit();
        }
    };

    // Play the audio
    this.play = function play() {
        // Stop, if any, the currently playing audio
        this.audioController.audioPlayback.stop();

        // Prepare the audio sequences information
        var sampleRate = this.audioController.listOfChannels[0].audioSequenceReference.sampleRate;
        var audioDataRefs = [];
        for(var i = 0; i < this.audioController.listOfChannels.length; ++i) {
            audioDataRefs.push(this.audioController.listOfChannels[i].audioSequenceReference.data);
        }

        // Pass the audio sequences information to the audio playback handler
        this.audioController.audioPlayback.play(audioDataRefs, sampleRate);
    };

    // Stop the aduio playback
    this.stop = function stop() {
        this.audioController.audioPlayback.stop();
    };

    // Update the download link
    this.updateDownloadLink = function updateDownloadLink(saveLink) {
        var url = this.toWave().toBlobUrlAsync("application/octet-stream");
        $(savelink).attr("href", url);
        var fileName = currentWaveformType + "-" + $("#waveform-frequency").val() + "hz";
        for(i = 1; i <= currentEffects.length; ++i) {
            fileName += "-pp" + i + "-" + currentEffects[i - 1];
        }
        fileName += ".wav"
        $(savelink).attr("download", fileName);
    };

    // Update the download MIDI music link
    this.updateDownloadMidiLink = function updateDownloadMidiLink(saveMidiLink) {
        var url = this.toWave().toBlobUrlAsync("application/octet-stream");
        $(saveMidiLink).attr("href", url);
        var fileName = "midi-music-" + currentWaveformType;
        for(i = 1; i <= currentEffects.length; ++i) {
            fileName += "-pp" + i + "-" + currentEffects[i - 1];
        }
        fileName += ".wav"
        $(saveMidiLink).attr("download", fileName);
    };

    // Export to WAV format
    this.toWave = function toWave() {
        var wave = new WaveTrack();

        var sequenceList = [];
        for(var i = 0; i < this.audioController.listOfChannels.length; ++i) {
            sequenceList.push(this.audioController.listOfChannels[i].audioSequenceReference);
        }

        wave.fromAudioSequences(sequenceList);
        return wave;
    };

    // Every channels generate a new waveform according to the parameters
    this.generateWaveform = function generateWaveform() {
        for(var i = 0; i < this.audioController.listOfChannels.length; ++i) {
            this.audioController.listOfChannels[i].generateWaveform();
        }

        // Apply post-processings to the generated waveform
        this.postprocess();

        // Update the download link
        this.updateDownloadLink("#savelink");

        // Re-zoom the display
        this.zoom();
    };

    // Every channels generate music according to the JSON data
    this.generateMusicFromMIDI = function generateMusicFromMIDI(data) {
        for(var i = 0; i < this.audioController.listOfChannels.length; ++i) {
            this.audioController.listOfChannels[i].generateMusic(data);
        }

        // Apply pitch shift if needed
        var pitchShift = parseInt($("#importMidiPitchShift").val());
        if(pitchShift != 0) {
            PitchShift.apply(this.audioController.listOfChannels, pitchShift);
        }

        // Adjust the generated music to the best amplitude, if needed
        if($("#importMidiAutoAmplitude").prop("checked")) {
            Postprocessor.postprocess(this.audioController.listOfChannels, "boost", 0);
        }

        // Update the download link
        this.updateDownloadMidiLink("#saveMidiLink");

        // Re-zoom the display
        this.zoom();
    }

    // Apply post-processings to the waveform
    this.postprocess = function postprocess() {
        for(var i = 1; i <= currentEffects.length; ++i) {
            console.log("Applying postprocessing " + i + ": ", currentEffects[i - 1]);
            Postprocessor.postprocess(this.audioController.listOfChannels, currentEffects[i - 1], i);
        }
    };

    // Export some functions to the HTML element
    this.elementContext.createChannel = this.createChannel;
    this.elementContext.removeAllChannels = this.removeAllChannels;
    this.elementContext.zoomToFit = this.zoomToFit;
    this.elementContext.zoomToCycles = this.zoomToCycles;
    this.elementContext.zoomToSeconds = this.zoomToSeconds;
    this.elementContext.zoom = this.zoom;
    this.elementContext.play = this.play;
    this.elementContext.stop = this.stop;
    this.elementContext.updateDownloadLink = this.updateDownloadLink;
    this.elementContext.updateDownloadMidiLink = this.updateDownloadMidiLink;
    this.elementContext.toWave = this.toWave;
    this.elementContext.generateWaveform = this.generateWaveform;
    this.elementContext.generateMusicFromMIDI = this.generateMusicFromMIDI;
    this.elementContext.postprocess = this.postprocess;

    // Disable selection of this element
    this.elementContext.onselectstart = function() { return false; };
}

// Function for kick starting the initialization process
function initializeAudioControllers() {
    $("audioController").each(function(index, element) {
        var controller = new audioController(element);
        $("body").click(function() {
            if (controller.audioPlayback.audioContext.state != "running") {
                controller.audioPlayback.audioContext.resume().then(function() {
                    console.log("Audio Context is resumed!");
                });
            }
        });
        
    });
}
