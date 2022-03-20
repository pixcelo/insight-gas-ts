'use strict';

import fs from 'fs';
import config from 'config';
import ccxt from 'ccxt';

const exchangeId = 'liquid',
      exchangeClass = ccxt[exchangeId],
      exchange = new exchangeClass({
        'apiKey': config.get('liquid.apiKey'),
        'secret': config.get('liquid.apiSecret'),
        'timeout': 30000,
        'enableRateLimit': true,
    });

const SYMBOL = 'BTC/JPY';
const interval = 3000;
const LOT = 0.002; // BTC order amount (min 0.0001)
const records = [];
let orderInfo = null;

// wait time setting
let sleep = (ms) => new Promise (resolve => setTimeout (resolve, ms));

// Execution
(async function main() {

    while (true) {

        try {
            // last ticker information
            const ticker = await exchange.fetchTicker(SYMBOL);
            records.push(ticker.ask);
            if (records.length > 3){
                records.shift();
            }
            const price = ticker.ask;
            const condition = (records[0] < records[1] && records[1] < records[2]);
            console.log(`price ${price} records [${records}] condition ${condition}`);

            // Sell
            if (orderInfo) {
                const target = orderInfo.price * 1.02;

                if (price > target) {
                    const order = exchange.createMarketOrder(SYMBOL, 'sell', LOT);
                    orderInfo = null;
                    writeLog(`sold: profit ${price - orderInfo.price}`);
                    await sleep(interval);
                    continue;
                }

                console.log(`hold target:${target}`);
                await sleep(interval);
                continue;
            }

            // Buy
            if (condition) {
                const order = exchange.createMarketOrder(SYMBOL, 'buy', LOT);
                orderInfo = {
                    order: order,
                    price: price,
                }
                writeLog(`bought ${price}`);
                await sleep(interval);
                continue;
            }

        } catch (error) {
            console.error(error);
        }

    await sleep(interval);
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
