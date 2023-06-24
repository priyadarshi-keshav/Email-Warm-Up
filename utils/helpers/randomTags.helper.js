const RandomTagsGenerator = () => {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let counter = 0;
    while (counter < 3) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
        counter += 1;
    }
    return `[${result}]`;
}

module.exports = { RandomTagsGenerator };
