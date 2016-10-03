let utils = exports;

utils.squeezePropsArray = function (objects, key) {
    objects = objects || []
    let propsArray = [];
    for (var i = 0; i < objects.length; i++) {
        if (objects[i][key]) {
            propsArray.push(objects[i][key])
        }
    }
    return propsArray;
}
