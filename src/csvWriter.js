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
                const date = timestampToTime(candle[0]);
                const obj_candle = {
                    'time': date,
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


// 引数 timestamp の単位はミリ秒であるとする
function timestampToTime(timestamp) {
    const date = new Date(timestamp * 1000);
    const yyyy = `${date.getFullYear()}`;
    // .slice(-2)で文字列中の末尾の2文字を取得する
    // `0${date.getHoge()}`.slice(-2) と書くことで０埋めをする
    const MM = `0${date.getMonth() + 1}`.slice(-2); // getMonth()の返り値は0が基点
    const dd = `0${date.getDate()}`.slice(-2);
    const HH = `0${date.getHours()}`.slice(-2);
    const mm = `0${date.getMinutes()}`.slice(-2);
    const ss = `0${date.getSeconds()}`.slice(-2);

    return `${yyyy}/${MM}/${dd} ${HH}:${mm}:${ss}`;
  }
