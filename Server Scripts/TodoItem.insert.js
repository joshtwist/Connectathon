// This is your primary account key from the datamarket
// This isn’t my real key, so don’t try to use it! Get your own.
var bingPrimaryAccountKey = 
    "TIjwq9cfmggy3bsYqpPNQX6/mAE6lNMNhFo4xSMkMGs=";
// This creates a basic auth token using your account key
var basicAuthHeader = 
   "Basic " + new Buffer(":" + bingPrimaryAccountKey).toString('base64');

// and now for the insert script
function insert(item, user, request) {
    request.execute({
        success: function() {
            request.respond();
            getImageFromBing(item, user,
                sendPushNotification);
        }
    });
}

// this function does all the legwork of calling bing to find the image
function getImageFromBing(item, user, callback) {
    var req = require('request');
    var url = "https://api.datamarket.azure.com/Data.ashx" +
        "/Bing/Search/v1/Composite?Sources=%27image%27&Query=%27" +
        escape(item.text) + "%27&Adult=%27Strict%27&" + 
        "ImageFilters=%27Size%3aMedium%2bAspect%3aSquare%27&$top=50&$format=Json";
    req.get({
        url: url, 
        headers: { 
            "Authorization": basicAuthHeader
        }
    }, function (e, r, b) {
        try{
            var image = JSON.parse(b).d.results[0].Image[0].MediaUrl;
            callback(item, image, user);
        } catch (exc) {
            console.error(exc);
            // in case we got no image, just send no image
            callback(item, "", user);
        }
    });
}

// send the push notification
function sendPushNotification(item, image, user)
{
    getChannels(function(results) {
        results.forEach(function(result) {
            push.wns.sendTileSquareImage(result.channelUri,
            {
                image1src: image,
            },
            {
               // logging success is handy during development
               // mobile services automatically logs failure
                success: console.log
            }); 
        });
    }, user);
}

// this is where you load the channel URLs from the database. This is
// really an exercise for the reader based on how they decided to store
// channelUrls. See the second push tutorial above for an example
function getChannels(callback, user)
{
    // this example loads all the channelUris from a table called Channel
    var sql = "SELECT channelUri FROM channels WHERE userId = ?";
    mssql.query(sql, [user.userId], {
        success: function(results) {
            callback(results);
        }
    });
}