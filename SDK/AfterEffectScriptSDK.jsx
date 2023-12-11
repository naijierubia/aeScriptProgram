function PrefixZero(number, zeroNum) {
    return (Array(zeroNum).join(0) + number).slice(-zeroNum);
}