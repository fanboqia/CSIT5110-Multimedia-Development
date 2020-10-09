// This object represent the waveform generator
var WaveformGenerator = {
    // The generateWaveform function takes 4 parameters:
    //     - type, the type of waveform to be generated
    //     - frequency, the frequency of the waveform to be generated
    //     - amp, the maximum amplitude of the waveform to be generated
    //     - duration, the length (in seconds) of the waveform to be generated
    generateWaveform: function(type, frequency, amp, duration) {
        var nyquistFrequency = sampleRate / 2; // Nyquist frequency
        var totalSamples = Math.floor(sampleRate * duration); // Number of samples to generate
        var result = []; // The temporary array for storing the generated samples

        switch(type) {
            case "sine-time": // Sine wave, time domain
                for (var i = 0; i < totalSamples; ++i) {
                    var currentTime = i / sampleRate;
                    result.push(amp * Math.sin(2.0 * Math.PI * frequency * currentTime));
                }
                break;

            case "clarinet-additive":
                /**
                * TODO: Complete this generator
                **/

                var harmonics = [];
                for (var i = 0; i < totalSamples; ++i) {
                    var currentTime = i / sampleRate;
                    var sampleValue = 0;

                    // TODO: Adding all harmonic sine waves, until the Nyquist frequency is reached
                    var coeffs = [1,0.75,0.5,0.14,0.5,0.12,0.17];
                    var k = 1;
                    var j = 0;
                    while(j < coeffs.length && k * frequency < nyquistFrequency){
                        sampleValue = sampleValue + coeffs[j]*Math.sin(k * 2.0 * Math.PI * frequency * currentTime)
                        k+=2;
                        j++;
                    }

                    result.push(amp * sampleValue);
                }
                break;

            case "fm": // FM
                /**
                * TODO: Complete this generator
                **/

                // Obtain all the required parameters
                var carrierFrequency = parseFloat($("#fm-carrier-frequency").val());
                var carrierAmplitude = parseFloat($("#fm-carrier-amplitude").val());
                var modulationFrequency = parseFloat($("#fm-modulation-frequency").val());
                var modulationAmplitude = parseFloat($("#fm-modulation-amplitude").val());
                var useADSR = $("#fm-use-adsr").prop("checked");
                if (useADSR) { // Obtain the ADSR parameters
                    var attackDuration = parseFloat($("#fm-adsr-attack-duration").val()) * sampleRate;
                    var decayDuration = parseFloat($("#fm-adsr-decay-duration").val()) * sampleRate;
                    var releaseDuration = parseFloat($("#fm-adsr-release-duration").val()) * sampleRate;
                    var sustainLevel = parseFloat($("#fm-adsr-sustain-level").val()) / 100.0;

                    var sustainDuration = duration*sampleRate - attackDuration - decayDuration - releaseDuration;
                    var stage1 = attackDuration;
                    var stage2 = attackDuration+decayDuration;
                    var stage2_to_1_ratio = stage1/stage2;
                    var stage3 = attackDuration+decayDuration+sustainDuration;
                    var stage4 = duration*sampleRate;
                    var stage3_to_4_ratio = stage3/stage4;

                     //align the decay to the attack maximum point
                    var ratio1 = (1-stage2_to_1_ratio*sustainLevel)/(1-stage2_to_1_ratio);
                    //align the release to the sustain level
                    var ratio2 = sustainLevel/(1-stage3_to_4_ratio);
                }
                
                // Added for frequency multiplier
                var useFreqMultiplier = $("#fm-use-freq-multiplier").prop("checked");
                if (useFreqMultiplier) {

                    // TODO: Use carrierFrequency and modulationFrequency as multipliers for
                    //       the frequency value from General Settings
                    carrierFrequency = frequency * carrierFrequency;
                    modulationFrequency = frequency * modulationFrequency;

                }

                for (var i = 0; i < totalSamples; ++i) {
                    var currentTime = i / sampleRate;
                    var sampleValue = 0;

                    // TODO: Complete the FM waveform generator
                    // Hint: You can use the function lerp() in utility.js 
                    //       for performing linear interpolation

                    var modulator = Math.sin(2 * Math.PI * modulationFrequency * currentTime) * modulationAmplitude;

                    if (useADSR) {
                        if(i < stage1){
                            modulator *= lerp(0,1,i/stage1);
                        }

                        if(i >= stage1 && i < stage2){
                            modulator *= lerp(ratio1,sustainLevel,i/stage2);
                        }

                        if(i >= stage2 && i < stage3){
                            modulator *= sustainLevel;
                        }

                        if(i >= stage3){
                            modulator *= lerp(ratio2,0,i/stage4);
                        }
                    }

                    //var modulator = modulationAmplitude * Math.sin(2 * Math.PI * modulationFrequency * currentTime);
                    sampleValue = carrierAmplitude * Math.sin(2 * Math.PI * carrierFrequency * currentTime + modulator);

                    result.push(amp * sampleValue);
                }

                break;


            case "karplus-strong": // Karplus-Strong algorithm
                /**
                * TODO: Complete this generator
                **/

                // Obtain all the required parameters
                var base = $("#karplus-base>option:selected").val();
                var b = parseFloat($("#karplus-b").val());
                var delay = parseInt($("#karplus-p").val());

                // Find p from frequency
                var useFreq = $("#karplus-use-freq").prop("checked");
                if (useFreq) {

                    // TODO: Determine the delay automatically using
                    //       the frequency value from General Settings
                    delay = Math.floor(sampleRate / frequency);

                }

                // Fill the sound
                for (var i = 0; i < totalSamples; i++) {
                    var sampleValue = 0;

                    // TODO: Complete the Karplus-Strong generator
                    // The first period of the result would be either
                    // white noise or a single cycle of sawtooth
                    if(i <= delay){
                        if(base == "white-noise"){
                            sampleValue = (2 * Math.random() - 1)*amp;
                        }else{
                            // Sawtooth wave generated by sum of sine waves
                            var currentTime = i / sampleRate;
                            for(var j = 1; j <= 100; j++){
                                sampleValue += (Math.sin(2*Math.PI*j*currentTime*frequency)/(2*j));
                            }
                            sampleValue *= amp;
                        }  
                    }else{
                        var temp = 0.5*(result[i-delay]+result[i-delay-1]);
                        sampleValue = b >= Math.random() ? temp : -temp;
                    }

                    result.push(sampleValue);
                }

                break;

            default:
                break;
        }

        return result;
    }
};
