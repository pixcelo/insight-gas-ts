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
const interval = 300000; // 5min
const LOT = 0.01; // BTC order amount (min 0.0001)
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
            console.log(`${getTime(new Date())} price ${price} records [${records}] condition ${condition}`);

            // Sell
            if (orderInfo) {
                const target = orderInfo.price * 1.03;

                if (price > target) {
                    const order = exchange.createMarketOrder(SYMBOL, 'sell', LOT);
                    writeLog(`sold: profit ${price - orderInfo.price}`);
                    orderInfo = null;
                    await sleep(interval);
                    continue;
                }

                console.log(` hold target ${roundDecimal(target, 2)}`);
                await sleep(interval);
                continue;
            }

            // Buy
            if (condition) {
                if (!await hasEnoughJpy(price * LOT)) {
                    continue;
                }
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

// 法定通貨残高の取得
async function hasEnoughJpy(required_balance) {
    // 個別APIの命名規則 private + {メソッドがgetならGet、postならPost} + {private APIの名前}
    const data = await exchange.privateGetFiatAccounts();
    console.log(`jpy ${data[0]['balance']}`);
    if(data[0]['balance'] >= required_balance) {
        return true;
    }
    console.log('has not enough JPY');
    return false;
}

function roundDecimal(value, n) {
    return Math.round(value * Math.pow(10, n) ) / Math.pow(10, n);
}

function writeLog(text) {
    const date = new Date().toLocaleString('sv').replace(/\D/g, '');
    text = date + ':' + text + '\n',
    console.log(text);
    fs.appendFileSync('./log/info.log', text, (err) => {
        if (err) throw err;
    });
}

function getTime(now) {
    const Year = now.getFullYear();
    const Month = now.getMonth()+1;
    const Date = now.getDate();
    const Hour = now.getHours();
    const Min = now.getMinutes();
    const Sec = now.getSeconds();

    return Year + '-' + Month + '-' + Date + '/' + Hour + ':' + Min + ':' + Sec;
}
