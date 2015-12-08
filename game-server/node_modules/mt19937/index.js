/*!
* mt19937: a node.js Mersenne Twister 19937 generator
* Copyright(c) 2013 Xiangyi Kong <xy.kong@gmail.com>
* MIT Licensed
*/

try {
    module.exports = require('./build/Release/mt19937');
} catch (e) {
    try {
        module.exports = require('./build/default/mt19937');
    } catch (e) {
        console.error('mt19937.node seems to not have been built. Run npm install.');
        throw e;
    } 
}
