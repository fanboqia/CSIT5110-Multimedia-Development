// This object represent the postprocessor
Postprocessor = {
    // The postprocess function takes the audio samples data and the post-processing effect name
    // and the post-processing stage as function parameters. It gathers the required post-processing
    // paramters from the <input> elements, and then applies the post-processing effect to the
    // audio samples data of every channels.
    postprocess: function(channels, effect, pass) {
        switch(effect) {
            case "no-pp":
                // Do nothing
                break;

            case "boost":
                // Find the maximum gain of all channels
                var maxGain = -1.0;
                for (var c = 0; c < channels.length; ++c) {
                    // Get the sample data of the channel
                    var audioSequence = channels[c].audioSequenceReference;
                    var gain = audioSequence.getGain();
                    if (gain > maxGain) {
                        maxGain = gain;
                    }
                }

                // Determine the boost multiplier
                var multiplier = 1.0 / maxGain;

                // Post-process every channels
                for (var c = 0; c < channels.length; ++c) {
                    // Get the sample data of the channel
                    var audioSequence = channels[c].audioSequenceReference;

                    // For every sample, apply a boost multiplier
                    for (var i = 0; i < audioSequence.data.length; ++i) {
                        audioSequence.data[i] *= multiplier;
                    }

                    // Update the sample data with the post-processed data
                    channels[c].setAudioSequence(audioSequence);
                }
                break;


            case "tremolo":
                /**
                * TODO: Complete this function
                **/

                // Obtain all the required parameters
                var tremoloFrequency = parseFloat($("#tremolo-frequency").data("p" + pass));
                var wetness = parseFloat($("#tremolo-wetness").data("p" + pass));

                // Post-process every channels
                for (var c = 0; c < channels.length; ++c) {
                    // Get the sample data of the channel
                    var audioSequence = channels[c].audioSequenceReference;

                    // For every sample, apply a tremolo multiplier
                    for (var i = 0; i < audioSequence.data.length; ++i) {
                        // TODO: Complete the tremolo postprocessor
                        var currentTime = i / sampleRate;
                        var multiplier = ((Math.sin(2*Math.PI*tremoloFrequency*currentTime-0.5*Math.PI)+1)/2*wetness+(1-wetness));
                        audioSequence.data[i] *= multiplier;
                    }

                    // Update the sample data with the post-processed data
                    channels[c].setAudioSequence(audioSequence);
                }
                break;
            case "adsr":
                /**
                * TODO: Complete this function
                **/

                // Obtain all the required parameters
                var attackDuration = parseFloat($("#adsr-attack-duration").data("p" + pass)) * sampleRate;
                var decayDuration = parseFloat($("#adsr-decay-duration").data("p" + pass)) * sampleRate;
                var releaseDuration = parseFloat($("#adsr-release-duration").data("p" + pass)) * sampleRate;
                var sustainLevel = parseFloat($("#adsr-sustain-level").data("p" + pass)) / 100.0;

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

                for (var c = 0; c < channels.length; ++c) {
                    // Get the sample data of the channel
                    var audioSequence = channels[c].audioSequenceReference;

                    for (var i = 0; i < audioSequence.data.length; ++i) {

                        // TODO: Complete the ADSR postprocessor
                        // Hint: You can use the function lerp() in utility.js
                        // for performing linear interpolation
                        if(i < stage1){
                            audioSequence.data[i] *= lerp(0,1,i/stage1);
                        }

                        if(i >= stage1 && i < stage2){
                            audioSequence.data[i] *= lerp(ratio1,sustainLevel,i/stage2);
                        }

                        if(i >= stage2 && i < stage3){
                            audioSequence.data[i] *= sustainLevel;
                        }

                        if(i >= stage3){
                            audioSequence.data[i] *= lerp(ratio2,0,i/stage4);
                        }
                        

                    }

                    // Update the sample data with the post-processed data
                    channels[c].setAudioSequence(audioSequence);
                }
                break;

            default:
                // Do nothing
                break;
        }
        return;
    }
}
