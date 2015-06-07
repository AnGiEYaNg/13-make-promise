/*----------------------------------------------------------------
 Promises Workshop: build the pledge.js deferral-style promise library
 ----------------------------------------------------------------*/
// YOUR CODE HERE:

function isFn(value) {
    return typeof value === 'function';
}

$Promise = function () {
    this.state = 'pending';
    this.handlerGroups = [];
};

$Promise.prototype.catch = function (errorFn) {
    return this.then(null, errorFn);
};

$Promise.prototype.then = function (successFn, errorFn) {

    var group = {
        successCb: isFn(successFn) ? successFn : null,
        errorCb: isFn(errorFn) ? errorFn : null,
        forwarder: defer()
    };

    this.handlerGroups.push(group);
    this.callHandlers();

    return group.forwarder.$promise;
};

$Promise.prototype.callHandlers = function () {

    if (this.state === 'pending') return;

    var groups = this.handlerGroups;
    var group, returnValue;

    while (groups.length !== 0) {

        group = groups.shift();

        if (this.state === 'resolved') {

            if (isFn(group.successCb)) {
                try {
                    returnValue = group.successCb(this.value);
                    if (returnValue instanceof $Promise) {

                        returnValue.then(function (resolvedValue) {
                            group.forwarder.resolve(resolvedValue);
                        }, function (rejectedValue) {
                            group.forwarder.reject(rejectedValue);
                        });

                    } else {
                        group.forwarder.resolve(returnValue);
                    }

                } catch (e) {
                    group.forwarder.reject(e);
                }
            } else {
                group.forwarder.resolve(this.value);
            }

        } else if (this.state === 'rejected') {
            if (isFn(group.errorCb)) {
                try {
                    returnValue = group.errorCb(this.value);
                    if (returnValue instanceof $Promise) {

                        returnValue.then(function (resolvedValue) {
                            group.forwarder.resolve(resolvedValue);
                        }, function (rejectedValue) {
                            group.forwarder.reject(rejectedValue);
                        });

                    } else {
                        group.forwarder.resolve(returnValue);
                    }
                } catch (e) {
                    group.forwarder.reject(e);
                }
            } else {
                group.forwarder.reject(this.value);
            }
        }

    }

};

Deferral = function () {
    this.$promise = new $Promise();
};

Deferral.prototype.settle = function (state, value) {
    if (this.$promise.state === 'pending') {
        this.$promise.state = state;
        this.$promise.value = value;
        this.$promise.callHandlers();
    }
};

Deferral.prototype.resolve = function (value) {
    this.settle('resolved', value);
};

Deferral.prototype.reject = function (value) {
    this.settle('rejected', value);
};

defer = function () {
    var d = new Deferral();
    return d;
};


/*-------------------------------------------------------
 The spec was designed to work with Test'Em, so we don't
 actually use module.exports. But here it is for reference:
 module.exports = {
 defer: defer,
 };
 So in a Node-based project we could write things like this:
 var pledge = require('pledge');
 …
 var myDeferral = pledge.defer();
 var myPromise1 = myDeferral.$promise;
 --------------------------------------------------------*/