'use strict';
const utils = require('../lib/utils')

describe('utils', () => {
    describe('squeezePropsArray', () => {
        it('should return empty array, when param is null', () => {
            let array = utils.squeezePropsArray(null);
            expect(Array.isArray(array)).toBe(true);
        })
    })
})
