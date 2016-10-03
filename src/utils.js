exports = utils;

utils.squeezePropsArray = function (objects=[], key) {
    let propsArray;
    for (var i = 0; i < objects.length; i++) {
        if (objects[i][key]) {
            propsArray.push(objects[i][key])
        }
    }
    return propsArray;
}
