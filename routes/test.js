

var testModule = module.exports = function(rpcProvider){
console.log("rpcProvider = " + rpcProvider);
	this._rpcProvider = rpcProvider;
}


testModule.prototype = {

	case1 : function(val1){

		console.log("****** testModule val1 = "+val1+" rpcProvider = "+this._rpcProvider);
	}

	,case2 : function(val2){

		console.log("****** testModule val2 = "+val2+" rpcProvider = "+this._rpcProvider);
	}
}




//To create Singleton 
const testHandle = (function () {
    var instancesHash = {};
 
    function createInstance(rpcProvider) {
        var object = new testModule(rpcProvider);
        return object;
    }

    return {
        getInstance: function (rpcProvider) {
            if (!instancesHash[rpcProvider]) {
            	console.log("rpcProvider : create instance");

                instance = createInstance(rpcProvider);
                instancesHash[rpcProvider] = instance;

                console.log("***instancesHash : ")
                console.log(instancesHash)
            }

            return instancesHash[rpcProvider];
        }
    };
})();

module.exports = testHandle;