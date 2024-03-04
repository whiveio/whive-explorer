""""
{
  "pow_index": [
    {
      "symbol": "BTC",
      "BTC_USDT": 27000
    },
    {
      "symbol": "WHIVE",
      "WHIVE_USDT": 0.0008
    }
  ]
}

"""

import requests
import json
from authproxy import AuthServiceProxy, JSONRPCException

# Initialize a dictionary to store the data
output_data = {}
result = []

# URL for the 24-hour Bitcoin price API
url_blockchain_info = 'https://blockchain.info/q/24hrprice'
url_hashrate_bitcoin = "https://blockchain.info/q/hashrate"
#binance price
url_binance_price="https://api.binance.com/api/v3/avgPrice?symbol=BTCUSDT"
# URL for the Dex-Trade ticker API
url_dex_trade = 'https://api.dex-trade.com/v1/public/ticker?pair=whiveusdt'

# Make the GET request to the 24-hour price API from blockchain.info
"""
response_blockchain_info = requests.get(url_blockchain_info)
# Check if the request was successful (status code 200)
if response_blockchain_info.status_code == 200:
    # Parse the 24-hour price response
    bitcoin_price = float(response_blockchain_info.text)
    print(f'24-hour Bitcoin Price: {bitcoin_price} USD')
    output_data['24-hour Bitcoin Price'] = bitcoin_price
    result.append({'symbol': "BTC", 'Price': bitcoin_price})
else:
    print(f'Error: {response_blockchain_info.status_code} - {response_blockchain_info.text}')
"""

# Make the GET request to the binance price API
response_binance_price = requests.get(url_binance_price)

# Check if the request was successful (status code 200)
if response_binance_price.status_code == 200:
    # Parse the binance price response
    data_binance_price = json.loads(response_binance_price.text)
    binance_price = float(data_binance_price['price'])
    print(f'Binance Avg Price: {binance_price} USD')
    output_data['Binance Avg Price'] = binance_price
    result.append({'symbol': "BTC", 'Price': int(binance_price)})
else:
    print(f'Error: {response_binance_price.status_code} - {response_binance_price.text}')


# Make the GET request to the  bitcoin hashrate  API
response_hashrate_bitcoin = requests.get(url_hashrate_bitcoin)

# Check if the request was successful (status code 200)
if response_hashrate_bitcoin.status_code == 200:
    # Parse the bitcoin hashrate  response
    bitcoin_hashrate = int(response_hashrate_bitcoin.text)
    print(f'Bitcoin Hashrate: {bitcoin_hashrate} GH')
    output_data['Bitcoin Hashrate'] = (bitcoin_hashrate/1000000000)
    result.append({'symbol': "EHS", 'Hashrate': int(bitcoin_hashrate/1000000000)})
else:
    print(f'Error: {response_hashrate_bitcoin.status_code} - {response_hashrate_bitcoin.text}')


# Make the GET request to the Dex-Trade API
response_dex_trade = requests.get(url_dex_trade)

# Check if the request was successful (status code 200)
if response_dex_trade.status_code == 200:
    # Parse the Dex-Trade ticker response
    data_dex_trade = response_dex_trade.json()
    last_price = float(data_dex_trade['data']['last'])
    print(f'Last Price for WHIVE/USDT on Dex-Trade: {last_price} USDT')
    output_data['Last Price for WHIVE/USDT on Dex-Trade'] = last_price
    result.append({'symbol': "WHIVE", 'Price': last_price})
else:
    print(f'Error: {response_dex_trade.status_code} - {response_dex_trade.text}')



#call rpc getnetworkhashps to get hashrate
# Replace these with your Whive Core RPC credentials
rpc_user = 'whive'
rpc_password = 'pass'
rpc_host = 'localhost'  # Replace with the hostname or IP address of your Bitcoin Core node
rpc_port = 1867  # Default RPC port for Bitcoin Core

# Connect to the Bitcoin Core RPC server
rpc_connection = AuthServiceProxy(f'http://{rpc_user}:{rpc_password}@{rpc_host}:{rpc_port}')

try:
    # Make the getnetworkhashps RPC call
    whive_hashrate = int(rpc_connection.getnetworkhashps())
    print(f'Whive Hashrate : {whive_hashrate} KHS')
    output_data['Whive Hashrate'] = (whive_hashrate/1000)
    #result.append({'symbol': "WHIVE Hashrate", 'KHS': whive_hashrate})
    result.append({'symbol': "KHS", 'Hashrate': int(whive_hashrate/1000)})
except JSONRPCException as e:
    print(f'Error: {e}')

print(result)
# Create a root JSON object called "pow_index"
pow_index_data = {"pow_index": result}
# Write the output data to a JSON file

with open('public/pow_index.json', 'w') as json_file:
    json.dump(pow_index_data, json_file, indent=4)

print('Output data written to "pow_index.json"')
