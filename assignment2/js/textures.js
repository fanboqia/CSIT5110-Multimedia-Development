// Convert hexidecimal to floating point RGB
function hexToRGB(hex){
    hex = parseInt(hex.substring(1), 16);
    var r = hex >> 16;
    var g = hex >> 8 & 0xFF;
    var b = hex & 0xFF;
    return [r / 255, g / 255, b / 255];
}

// Refresh the texture of the environment
function refreshTextures() {
    // Cloud parameters
    var cloudColor = hexToRGB($("#cloud-color").val());
    var cloudAmount = parseFloat($("#cloud-amount").val());
    var cloudFrequency = parseFloat($("#cloud-frequency").val());

    // Grass parameters
    var grassColor1 = hexToRGB($("#grass-color-1").val());
    var grassColor2 = hexToRGB($("#grass-color-2").val());
    var grassFrequency = parseFloat($("#grass-frequency").val());

    /**
     * TODO: Add your code here to adjust the cloud texture and grass texture
     **/
     $("#sky_noise").attr("baseFrequency",cloudFrequency);

     var matrix = cloudColor[0]+" 0 0 0 0" + " 0 "+cloudColor[1]+" 0 0 0"+" 0 0 "+cloudColor[2]+" 0 0 0"+" 0 0 0 1 0";
     $("#sky_matrix").attr("value",matrix);
}
