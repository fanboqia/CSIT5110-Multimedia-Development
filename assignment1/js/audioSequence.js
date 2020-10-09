// This function object represent the samples

function AudioSequence() {
    this.sampleRate = 0; // Sampling rate
    this.data = []; // The sample data

    // Gain level of the data (maximum value)
    this.gain = 0.0;

    // Find the gain (maximum value) of a segment of this samples data
    this.getGain = function getGain(start, len) {
        // default parameter
        if (start === undefined) start = 0;
        if (len === undefined) len = this.data.length - start;

        // requirement check
        if (start < 0 || start > this.data.length) throw "start parameter is invalid.";
        if (len < 0 || len + start > this.data.length) throw "end parameter is invalid.";

        var result = 0.0;
        for(var i = start; i < start + len; ++i) {
            // the amplitude could be positive or negative
            var absValue = Math.abs(this.data[i]);
            result = Math.max(result, absValue);
        }
        return result;
    }
}

// For creating a new AudioSequence
function CreateNewAudioSequence(data) {
    var sequence = new AudioSequence();
    sequence.sampleRate = sampleRate;
    sequence.data = [];
    if (data !== undefined) {
        for(var i = 0; i < data.length; ++i) {
            sequence.data.push(data[i]);
        }
    }
    return sequence;
}
