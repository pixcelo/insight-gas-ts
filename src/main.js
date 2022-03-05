'use strict';

import fs from 'fs';
import config from 'config';
import fetch from 'node-fetch';
import ccxt from 'ccxt';

const exchangeId = 'liquid',
      exchangeClass = ccxt[exchangeId],
      exchange = new exchangeClass({
        'apiKey': config.get('liquid.apiKey'),
        'secret': config.get('liquid.apiSecret'),
        'timeout': 30000,
        'enableRateLimit': true,
    });

const GET_KLINE_URL = 'https://api.cryptowat.ch/markets/liquid/btcjpy/ohlc?periods=60';

const SYMBOL = 'BTC/JPY';
const interval = 3000;    // apiにリクエスト飛ばす感覚
const LOT = 0.0001; // BTC min 0.0001
let orderInfo = null; // 注文情報の格納

// wait time setting
let sleep = (ms) => new Promise (resolve => setTimeout (resolve, ms));

// Execution
(async function main() {

    while (true) {

        const res = await fetch(GET_KLINE_URL);
        const data = await res.json();
        const kline = data['result']['60'];

        let sum = 0;
        for(let i = 0; i <= 99; i++) {
            sum += kline[i][4]; // close
        }

        const sma = sum / 100;
        console.log('sma100', sma);

        // last ticker information
        const ticker = await exchange.fetchTicker(SYMBOL);
        const price = ticker.ask;

        // Sell
        if (orderInfo) {
            const target = orderInfo.price * 1.01;

            if (price > target) {
                const order = exchange.createMarketOrder(SYMBOL, 'sell', LOT);
                orderInfo = null;
                writeLog('sold: profit', price - orderInfo.price);
                await sleep(interval);
                continue;
            }

            console.log("hold");
            await sleep(interval);
            continue;
        }

        // Buy
        if (price > sma) {
            console.log("buy: surge flag");
            const order = exchange.createMarketOrder(SYMBOL, 'buy', LOT);
            orderInfo = {
                order: order,
                price: price,
            }
            writeLog("bought", price);
            await sleep(interval);
            continue;
        }

    }

})();

function writeLog(text) {
    const date = new Date().toLocaleString('sv').replace(/\D/g, '');
    text = date + ':' + text + '\n',
    console.log(text);
    fs.appendFileSync('./log/info.log', text, (err) => {
        if (err) throw err;
    });
}
