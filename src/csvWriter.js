'use strict';

import axios from 'axios';
import {createObjectCsvWriter} from 'csv-writer'

// Cryptowatch API からマーケットデータを取得してCSV出力する
(async function main() {

    try {
        getOHLCV(14400);
    } catch (error) {
        console.error(error);
    }

})();

// https://docs.cryptowat.ch/rest-api/markets/ohlc
async function getOHLCV(period) {
    axios({
        method: 'get',
        url: 'https://api.cryptowat.ch/markets/liquid/btcjpy/ohlc?periods=' + period
      })
        .then(function (response) {
            const candles = response.data['result'][period];

            //console.log(candles);
            const kline = [];

            for (const candle of candles) {
                const obj_candle = {
                    'time': candle[0],
                    'open': candle[1],
                    'high': candle[2],
                    'low': candle[3],
                    'close': candle[4],
                    'volume': candle[5],
                    'quoteVolume': candle[6]
                }
                kline.push(obj_candle);
            }

            //console.log(kline);
            const csvWriter = createObjectCsvWriter({
                path: 'csv/' + period + '_kline.csv',

                // 出力する項目(ここにない項目はスキップされる)
                header: [
                    'time',
                    'open',
                    'high',
                    'low',
                    'close',
                    'volume',
                    'quoteVolume'
                  ]
            })

            // 書き込み
            csvWriter.writeRecords(kline)
                .then(() => {
                    console.log('done');
                });
        });
}
