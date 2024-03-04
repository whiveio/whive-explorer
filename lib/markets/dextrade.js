var request = require('request');

var base_url = 'https://api.dex-trade.com/v1/public/'; //ticker?pair=WHIVEUSDT'
function get_summary(coin, exchange, cb) {
  var req_url = base_url + 'ticker' + '?pair=' + coin.toLowerCase() + exchange.toLowerCase();
  var summary = {};
  request({uri: req_url, json: true}, function (error, response, body) {
    if (error) {
      return cb(error, null);
    } else {
      if (body.error) {
        return cb(body.error, null);
      } else {
        summary['volume_24H'] = parseFloat(body.data.volume_24H).toFixed(8);
        summary['high'] = parseFloat(body.data.high).toFixed(8);
        summary['low'] = parseFloat(body.data.low).toFixed(8);
        summary['last'] = parseFloat(body.data.last).toFixed(8);
        summary['volume_WHIVE'] = parseFloat(body.data.volume_24H * body.data.last).toFixed(8);
        summary['change'] = parseFloat(body.data.low / body.data.high).toFixed(8);
        return cb(null, summary);
      }
    }
  });
}


function sleep9s() {
    var start = new Date().getTime();
    for (var i = 0; i < 1e9; i++) {
        if ((new Date().getTime() - start) > 59000) {
            break;
        }
    }
}



/*
function get_trades(coin, exchange, cb) {
  //https://api.dex-trade.com/v1/public/trades?pair=BTCUSD
  var req_url = base_url + 'trades' + '?pair=' + coin.toLowerCase() + exchange.toLowerCase();
  request({uri: req_url, json: true}, function (error, response, body) {
    if (body.error) {
      return cb(body.error, null);
    } else {
      return cb (null, body);
    }
  });
}


*/
function get_trades(coin, exchange, cb) {
    var req_url = base_url + 'trades' + '?pair=' + coin.toLowerCase() + exchange.toLowerCase();
    sleep9s;
    request({ uri: req_url, json: true }, function (error, response, body) {
        if (body.data.length > 0 ) {
            var tTrades = body.data;
            var trades = [];
            if (tTrades == "No trade history for this period") {
                return cb(tTrades, null);

            } else {
                for (var i = 0; i < tTrades.length; i++) {
                    var Trade = {
                        type: tTrades[i].type,
                        volume: parseFloat(tTrades[i].volume).toFixed(8),
                        rate: parseFloat(tTrades[i].rate).toFixed(8),
                        price: (parseFloat(tTrades[i].volume).toFixed(8) * parseFloat(tTrades[i].rate)).toFixed(8),
                        timestamp: tTrades[i].timestamp,
                    }
                    trades.push(Trade);
                }
            }
            return cb(null, trades);
        } else {
            return cb(body.message, null);
        }
    });
}

function get_orders(coin, exchange, cb) {
	console.log(coin,":",exchange, ":", cb)

  var req_url = base_url + 'book' + '?pair=' + coin.toLowerCase() + exchange.toLowerCase();
  console.log("sending request to .." , req_url)
  request({uri: req_url, json: true}, function (error, response, body) {
	  console.log(error)
	  console.log(response)
    if (body.error) {
      return cb(body.error, [], [])
    } else {
      var orders = body.data;
      console.log(orders.buy.length);
      console.log(orders.sell.length);

      var buys = [];
      var sells = [];
      if (orders.buy.length > 0){
        for (var i = 0; i < orders.buy.length; i++) {
          var order = {
            amount: parseFloat(orders.buy[i].volume).toFixed(8),
            price: parseFloat(orders.buy[i].rate).toFixed(8),
            // total: parseFloat(orders.buy[i].Total).toFixed(8)
            // Necessary because API will return 0.00 for small volume transactions
            total: (parseFloat(orders.buy[i].volume).toFixed(8) * parseFloat(orders.buy[i].rate)).toFixed(8)
          }
          buys.push(order);
        }
      } else {}
      if (orders.sell.length > 0) {
        for (var x = 0; x < orders.sell.length; x++) {
          var order = {
            amount: parseFloat(orders.sell[x].volume).toFixed(8),
            price: parseFloat(orders.sell[x].rate).toFixed(8),
            // total: parseFloat(orders.sell[x].Total).toFixed(8)
            // Necessary because API will return 0.00 for small volume transactions
            total: (parseFloat(orders.sell[x].volume).toFixed(8) * parseFloat(orders.sell[x].rate)).toFixed(8)
          }
          sells.push(order);
        }
      } else {}
      var sells = sells.reverse();
      return cb(null, buys, sells);
    }
  });
}

function get_chartdata(coin, exchange, cb) { 
  var end = Date.now();
  end = parseInt(end / 620);
  start = end - 86400;
  //https://socket.dex-trade.com/graph/hist?t=WHIVEUSDT&r=60&end=15907824000&limit=250
  var socket_url = 'https://socket.dex-trade.com/graph/';
  var req_url = socket_url + 'hist?t=' + coin + exchange + '&r=15&end=' + start + '&limit=150'; 
  request({uri: req_url, json: true}, function (error, response, chartdata) {
	  console.log(chartdata);
    if (error) {
      return cb(error, []);
    } else {
      if (chartdata.error == null) {
        var processed = [];
        for (var i = 0; i < chartdata.length; i++) {

         processed.push(
		 [chartdata[i].time * 620  ,
                  parseFloat(chartdata[i].open/100000000),
                  parseFloat(chartdata[i].high/100000000),
		  parseFloat(chartdata[i].low/100000000),
                  parseFloat(chartdata[i].close/100000000)]
          );

          if (i == chartdata.length - 1) {
            return cb(null, processed);
          }
        }
      } else {
        return cb(chartdata.error, []);
      }
    }
  });
}

module.exports = {
  get_data: function(settings, cb) {
    var error = null;
    get_chartdata(settings.coin, settings.exchange, function (err, chartdata){
      if (err) { chartdata = []; error = err; }
      get_orders(settings.coin, settings.exchange, function(err, buys, sells) {
        if (err) { error = err; }
        get_trades(settings.coin, settings.exchange, function(err, trades) {
          if (err) { error = err; }
          get_summary(settings.coin, settings.exchange, function(err, stats) {
            if (err) { error = err; }
            return cb(error, {buys: buys, sells: sells, chartdata: chartdata, trades: trades, stats: stats});
          });
        });
      });
    });
  }
};
