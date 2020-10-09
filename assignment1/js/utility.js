function lerp(value1, value2, percentage) {
    if(percentage < 0) return value1;
    if(percentage > 1) return value2;
    return value1 + (value2 - value1) * percentage;
}
