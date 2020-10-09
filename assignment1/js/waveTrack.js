// This function object read and write WAV format file

function WaveTrack() {
    this.sampleRate = 0;
    this.audioSequences = [];

    var signedBorders = [0, 0xFF - 0x80, 0xFFFF - 0x8000, 0xFFFFFFFFF - 0x80000000];

    this.fromAudioSequences = function fromAudioSequences(sequences) {
        if (sequences.length === 0) return;

        var sampleRateCheck = sequences[0].sampleRate;
        var lengthCheck = sequences[0].data.length;

        for (var i = 1; i < sequences.length; ++i) {
            if (sequences[i].sampleRate != sampleRateCheck || sequences[i].data.length != lengthCheck) {
                throw "The input sequences must have the same length and sampling rate";
            }
        }

        this.sampleRate = sampleRateCheck;
        this.audioSequences = sequences;
    };

    this.toBlobUrlAsync = function toBlobUrlAsync(encoding, asyncMethod, host) {
        var encodedWave = this.encodeWaveFile();

        var blob = new Blob([encodedWave], {type: encoding});

        if (asyncMethod !== undefined) {
            var fileReader = new FileReader();
            fileReader.onloadend = function(e) {
                asyncMethod(fileReader.result, host);
            };
            fileReader.readAsDataURL(blob);
        } else {
            return window.URL.createObjectURL(blob);
        }
    };

    this.decodeWaveFile = function decodeWaveFile(data) {
        var reader = new BinaryReader(data);

        var waveChunkID = reader.readString(4);
        var waveChunkSize = reader.readUInt32();
        var waveFormat = reader.readString(4);
        reader.gotoString("fmt ");
        var waveSubchunk1ID = reader.readString(4);
        var waveSubchunk1Size = reader.readUInt32();
        var waveAudioFormat = reader.readUInt16();
        var waveNumChannels = this.channels = reader.readUInt16();
        var waveSampleRate = this.sampleRate = reader.readUInt32();
        var waveByteRate = reader.readUInt32();
        var waveBlockAlign = reader.readUInt16();
        var waveBitsPerSample = reader.readUInt16();
        // Goto the data block, sometimes there are blocks like cue before
        reader.gotoString("data");
        var waveSubchunk2ID = reader.readString(4);
        var waveSubchunk2Size = reader.readUInt32();

        var samplesPerChannel = this.samplesPerChannel = waveSubchunk2Size / waveBlockAlign;

        // prepare channels
        var channelNames = ["Left Channel", "Right Channel"];
        for (var i = 0; i < waveNumChannels; ++i) {
            this.audioSequences.push(new CreateNewAudioSequence(this.sampleRate));
            this.audioSequences[i].name = channelNames[i];
        }

        // fill channels
        var signBorderId = waveBitsPerSample / 8;
        var signedBorder = signedBorders[signBorderId];

        this.gain = 0.0;
        var getValue = (waveBitsPerSample == 8) ? reader.readUInt8 : (waveBitsPerSample == 16) ? reader.readInt16 : reader.readInt32;
        for (var i = 0; i < samplesPerChannel; ++i) {
            for (var channelId = 0; channelId < waveNumChannels; ++channelId) {
                var value = Math.min(1.0, Math.max(-1.0, getValue())); // cut off beyond the border
                // Convert into a spectrum from -1.0 to 1.0
                // Note that 8bit values are always unsigned, therefore another converting scheme is used
                var floatValue = convertIntToFloat(value, waveBitsPerSample, signedBorder);
                this.audioSequences[channelId].data.push(floatValue);
            }
        }

        for (var channelId = 0; channelId < waveNumChannels; ++channelId) {
            this.audioSequences[channelId].gain = this.audioSequences[channelId].getGain();
        }
    };

    function convertIntToFloat(value, waveBitsPerSample, signedBorder) {
        return (waveBitsPerSample == 8) ? (value == 0) ? -1.0 : value / signedBorder - 1.0 : (value == 0) ? 0 : value / signedBorder;
    }

    function convertFloatToInt(value, waveBitsPerSample, signedBorder) {
        return (waveBitsPerSample == 8) ? (value + 1.0) * signedBorder : value * signedBorder;
    }

    this.encodeWaveFile = function encodeWaveFile() {
        // prepare variables for encoding
        var waveChunkID = "RIFF";
        var waveFormat = "WAVE";
        var waveSubchunk1ID = "fmt ";
        var waveSubchunk1Size = 16;
        var waveAudioFormat = 1;
        var waveNumChannels = this.audioSequences.length;
        var waveSampleRate = this.sampleRate;
        var waveBitsPerSample = 16; // Attention! Order
        var waveByteRate = waveSampleRate * waveNumChannels * waveBitsPerSample / 8;
        var waveBlockAlign = waveNumChannels * waveBitsPerSample / 8;
        var waveBitsPerSample = 16;
        var waveSamplesPerChannel = this.audioSequences[0].data.length;
        var waveSubchunk2ID = "data";
        var waveSubchunk2Size = waveSamplesPerChannel * waveBlockAlign;
        var waveChunkSize = waveSubchunk2Size + 36; // 36 are the bytes from waveFormat till waveSubchunk2Size
        var totalSize = waveChunkSize + 8;

        // actual writing
        var writer = new BinaryWriter(totalSize);
        writer.writeString(waveChunkID);
        writer.writeUInt32(waveChunkSize);
        writer.writeString(waveFormat);

        writer.writeString(waveSubchunk1ID);
        writer.writeUInt32(waveSubchunk1Size);
        writer.writeUInt16(waveAudioFormat);
        writer.writeUInt16(waveNumChannels);
        writer.writeUInt32(waveSampleRate);
        writer.writeUInt32(waveByteRate);
        writer.writeUInt16(waveBlockAlign);
        writer.writeUInt16(waveBitsPerSample);

        writer.writeString(waveSubchunk2ID);
        writer.writeUInt32(waveSubchunk2Size);

        var signBorderId = waveBitsPerSample / 8;
        var signedBorder = signedBorders[signBorderId];

        for(var i = 0; i < waveSamplesPerChannel; ++i) {
            for (var channelId = 0; channelId < waveNumChannels; ++channelId) {
                writer.writeInt16(convertFloatToInt(this.audioSequences[channelId].data[i], waveBitsPerSample, signedBorder));
            }
        }

        return writer.data;
    };
}
