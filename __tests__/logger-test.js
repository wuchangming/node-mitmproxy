'use strict';

const logger = require('../lib/logger');

describe('logger', () => {

    beforeEach(() => {
        console.log = jest.fn();
    })

    it('should log', () => {
        logger.logger();
        let msg = 'adsfsdafsdf!@!#'
        logger.log(msg);
        logger.warning(msg);
        logger.success(msg);
        logger.error(msg);
        expect(
            console.log.mock.calls.length
        ).toBe(4);
    })
    it('should be silence', () => {
        logger.logger({
            silence: true
        });
        let msg = 'adsfsdafsdf!@!#'
        logger.log(msg);
        logger.warning(msg);
        logger.success(msg);
        logger.error(msg);
        expect(
            console.log.mock.calls.length
        ).toBe(0);
    });

})
