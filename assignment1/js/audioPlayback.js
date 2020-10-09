function AudioPlayback() {
    /**
     * This is the internal update event to fill the buffer with the audio data
     */
    this.onAudioUpdate = function onAudioUpdate(evt) {
        var audioPlayback = this.eventHost;
        var bufferSize = audioPlayback.audioBufferSize;

        // Return if playback was stopped
        if (audioPlayback.isPlaying === false) return;

        // Reference to the audio data arrays and audio buffer
        var audioData = audioPlayback.audioDataRef;
        var leftBuffer = evt.outputBuffer.getChannelData(0);
        var rightBuffer = evt.outputBuffer.getChannelData(1);

        if (audioData.length == 1) { // Mono
            audioPlayback.copyChannelDataToBuffer(leftBuffer, audioData[0], audioPlayback.currentPlayPosition, bufferSize, audioPlayback.playStart, audioPlayback.playEnd);
            audioPlayback.currentPlayPosition = audioPlayback.copyChannelDataToBuffer(rightBuffer, audioData[0], audioPlayback.currentPlayPosition, bufferSize, audioPlayback.playStart, audioPlayback.playEnd);
        } else if (audioData.length == 2) { // stereo
            audioPlayback.copyChannelDataToBuffer(leftBuffer, audioData[0], audioPlayback.currentPlayPosition, bufferSize, audioPlayback.playStart, audioPlayback.playEnd);
            audioPlayback.currentPlayPosition = audioPlayback.copyChannelDataToBuffer(rightBuffer, audioData[1], audioPlayback.currentPlayPosition, bufferSize, audioPlayback.playStart, audioPlayback.playEnd);
        }

        // The playback is done
        if (audioPlayback.currentPlayPosition === undefined) {
            audioPlayback.stop(); // Stop playing, disconnect buffer
        }
    };

    /**
     * Copies the audio data to a channel buffer and sets the new play position. If looping is enabled,
     * the position is set automaticly.
     */
    this.copyChannelDataToBuffer = function copyChannelDataToBuffer(bufferReference, dataReference, position, len, startPosition, endPosition) {
        /* In order to enable looping, we should need to split up when the end of the audio data is reached
         * to begin with the first position. Therefore is a split into two ranges if neccessary
         */
        var firstSplitStart = position;
        var firstSplitEnd = (position + len > dataReference.length) ? dataReference.length : (position + len > endPosition) ? endPosition : (position + len);
        var firstSplitLen = firstSplitEnd - firstSplitStart;
        var secondSplitStart = (firstSplitLen < bufferReference.length) ? 0 : undefined;
        var secondSplitEnd = (secondSplitStart !== undefined) ? bufferReference.length - firstSplitLen + secondSplitStart : undefined;
        var secondSplitOffset = bufferReference.length - (firstSplitEnd - firstSplitStart);

        if (secondSplitStart === undefined) {
            this.copyIntoBuffer(bufferReference, 0, dataReference, firstSplitStart, firstSplitEnd);
            return firstSplitEnd;
        } else {
            this.copyIntoBuffer(bufferReference, 0, dataReference, firstSplitStart, firstSplitEnd);
            return undefined;
        }
    };

    /**
     * copies data from an array to the buffer with fast coping methods
     */
    this.copyIntoBuffer = function copyIntoBuffer(bufferReference, bufferOffset, dataReference, dataOffset, end) {
        bufferReference.set(dataReference.slice(dataOffset, end), bufferOffset);
    };

    this.play = function play(audioDataRef, sampleRate, start, end) {
        // Check if already playing or no data was given
        if (this.isPlaying || audioDataRef === undefined || audioDataRef.length < 1 || sampleRate === undefined || sampleRate <= 0) {
            return;
        }

        // Update playback variables
        this.audioDataRef = audioDataRef;
        this.sampleRate = sampleRate;
        this.playStart = (start === undefined || start < 0 || start >= audioDataRef[0].length) ? 0 : start;
        this.playEnd = (end === undefined || end - this.audioBufferSize < start || end >= audioDataRef[0].length) ? audioDataRef[0].length : end;
        this.currentPlayPosition = this.playStart;
        this.isPlaying = true;

        this.javaScriptNode.connect(this.audioContext.destination); // Connect the node, play!
    };

    this.stop = function stop() {
        if (this.isPlaying === false) return; // Not playing audio, nothing to stop

        this.javaScriptNode.disconnect(this.audioContext.destination); // Diconnect the node, stop!

        // Reset all playback information to default
        this.playStart = 0;
        this.playEnd = 0;
        this.currentPlayPosition = 0;
        this.isPlaying = false;
        this.lastPlaybackUpdate = 0;

        // Remove reference to the audio data
        this.audioDataRef = undefined;
        this.sampleRate = 0;
    };

    // Creation of a new audio context
    this.audioBufferSize = 1024;
    this.sampleRate = 0;
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    this.audioContext = new AudioContext();

    // The JavaScriptNode is used to modifiy the output buffer
    this.javaScriptNode = this.audioContext.createScriptProcessor(this.audioBufferSize, 1, 2);
    this.javaScriptNode.onaudioprocess = this.onAudioUpdate;
    this.javaScriptNode.eventHost = this;

    /*this.analyserNode = this.audioContext.createAnalyser();
    this.analyserNode.minDecibels = -100;
    this.analyserNode.maxDecibels = 0;
    this.analyserNode.smoothingTimeConstant = 0.0;
    this.analyserNode.connect(this.audioContext.destination);*/

    this.audioDataRef = undefined;

    // Playback information
    this.playStart = 0;
    this.playEnd = 0;
    this.currentPlayPosition = 0;
    this.isPlaying = false;

    // Callback information
    this.playbackUpdateInterval = 0.0; // in Seconds
    this.lastPlaybackUpdate = 0;
}
