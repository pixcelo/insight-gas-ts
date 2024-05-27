
function getSheet(sheetUrl: string, sheetName: string) {
    const spreadsheet = SpreadsheetApp.openByUrl(sheetUrl);
    return spreadsheet.getSheetByName(sheetName);
}

function getSheetData(sheetUrl: string, sheetName: string): Map<string, string> {
    const spreadsheet = SpreadsheetApp.openByUrl(sheetUrl);
    const sheet = spreadsheet.getSheetByName(sheetName);
    if (!sheet) {
        throw new Error('指定されたシートが見つかりません: ' + sheetName);
    }
    
    const map = new Map();
    const lastRow = sheet.getLastRow();
    const values = sheet.getRange(`A1:B${lastRow}`).getValues();
    values.forEach(function(row) {
        if (row[0] && row[1]) {
            map.set(row[0].toString().toLowerCase(), row[1]);
        }
    });
    
    return map;
}

interface CurrentDate {
    year: string;
    month: string;
    day: string;
    hour: string;
}

function getCurrentDate(date: Date): CurrentDate {
    const year: string = date.getFullYear().toString().slice(-2);
    const month: string = (date.getMonth() + 1).toString().padStart(2, '0');
    const day: string = date.getDate().toString().padStart(2, '0');
    const hour: string = date.getHours().toString().padStart(2, '0');

    return {year, month, day, hour};
}

function createSheet(sheetName: string): void {
    const spreadsheetId = '1HJH0gvyzaUEdMX_YbFVafq5OZIXAN4SZo1f4fFKKgRU';
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    const sheet = spreadsheet.getSheetByName(sheetName);
    
    if (!sheet) {
        // シートが存在しない場合、新しいシートを作成
        const sheetIndex: number = spreadsheet.getSheets().length;
        const newSheet: GoogleAppsScript.Spreadsheet.Sheet = spreadsheet.insertSheet(sheetName, sheetIndex + 1);

        const headers: string[] = [
            "計測日",
            "計測時間",
            "リーチ数",
            "再生数",
            "いいね",
            "保存",
            "コメ",
            "フォ内外",
            "初回再生",
            "リプレイ",
            "総時間",
            "平均時間",
            "平均視聴回数",
            "ENG率",
            "保存率"
        ];

        headers.forEach((header, index) => {
            newSheet.getRange(1, index + 1).setValue(header);
        });            
        
        Logger.log('新しいシート "' + sheetName + '" を作成しました');
    }
}

interface IConfig {
    getSettings(): Map<string, string>
}

/**
 * 設定シート管理用クラス
 */
class Config implements IConfig {
    private settings: Map<string, string>;

    constructor() {
        this.settings = new Map();

        const sheetData = getSheetData(
            "https://docs.google.com/spreadsheets/d/1HJH0gvyzaUEdMX_YbFVafq5OZIXAN4SZo1f4fFKKgRU/edit#gid=1947337068",
            "config"
        );
        if (!sheetData) return;

        this.settings = sheetData;
    }

    getSettings(): Map<string, string> {
        return this.settings;
    }
}

/**
 * IGメディアシート管理用クラス
 */
class Media {
    private config: IConfig;
    private settings: Map<string, string>;
    private idList: string[];

    constructor(config: IConfig) {
        this.config = config;
        this.settings = this.config.getSettings();
        this.idList = [];
    }

    getIdList(): string[] {
        return this.idList;
    }

    /**
     * IGメディアのIDを取得
     */
    fetchIdList(): void {
        try {            
            const endpoint = "media?";
            const baseUrl = this.settings.get("baseurl");
            const version = this.settings.get("version");
            const userId = this.settings.get("userid");
            const accessToken = this.settings.get("accesstoken");
            const url = `${baseUrl}/${version}/${userId}/${endpoint}&access_token=${accessToken}`;
            const response = UrlFetchApp.fetch(url);
            const result = JSON.parse(response.getContentText());

            result.data.forEach((media: any, index: number) => {                                
                this.idList.push(media.id);
            });            
        } catch (err) {
            // Logger.log(err);
        }        
    }

    /**
     * IGメディアの詳細を取得してシートに書き込む
     */
    fetchMediaDetail(): void {
        const ws = getSheet(
            "https://docs.google.com/spreadsheets/d/1HJH0gvyzaUEdMX_YbFVafq5OZIXAN4SZo1f4fFKKgRU/edit#gid=0",
            "media"
        );
        if (!ws) return;

        // シートを初期化
        // ws.clear();

        const existList = this.readIdList(ws);

        const idList = this.idList;
        for (let i = 0; i < idList.length; i++) {
            const mediaId: string = idList[i];
            if (existList.includes(mediaId)) continue;

            // シートに存在しない場合、メディアの詳細を取得
            const endpoint: string = "fields=caption,like_count,media_url,permalink";
            const baseUrl = this.settings.get("baseurl");
            const version = this.settings.get("version");
            const accessToken = this.settings.get("accesstoken");
            const url = `${baseUrl}/${version}/${mediaId}?${endpoint}&access_token=${accessToken}`;
            const response = UrlFetchApp.fetch(url);
            const media = JSON.parse(response.getContentText());
            
            // 行のスタイルを調整
            const lastRow = ws.getLastRow();
            const row: number = lastRow + 1;
            const rowHeight: number = 80;
            ws.setRowHeight(row, rowHeight);

            // シート作成
            createSheet(mediaId);
            const spreadsheet = SpreadsheetApp.openById("1HJH0gvyzaUEdMX_YbFVafq5OZIXAN4SZo1f4fFKKgRU");
            const sheetId = spreadsheet.getSheetByName(mediaId)?.getSheetId();

            // IGメディアの詳細を書き込み
            ws.getRange(row, 1).setValue(mediaId);
            ws.getRange(row, 1).setFormula(`=HYPERLINK("${"#gid=" + sheetId}", "${mediaId}")`);
            ws.getRange(row, 2).setValue(media.like_count);
            ws.getRange(row, 3).setValue(`=IMAGE(D${row})`);
            ws.getRange(row, 4).setValue(media.media_url);
            ws.getRange(row, 5).setValue(media.permalink);
        }
    }

    /**
     * シートに記載済みのIDリストを取得
     */
    readIdList(sheet: GoogleAppsScript.Spreadsheet.Sheet): string[] {
        const idList: string[] = [];        
        const lastRow = sheet.getLastRow();
        if (lastRow === 0) return idList;            

        const values = sheet.getRange(`A1:A${lastRow}`).getValues();
        values.forEach(function(row) {
            idList.push(row[0]);
        });
        
        return idList;
    }
}

/**
 * IGメディアのインサイトのレスポンス型
 */
interface InsightValue {
    value: number;
}

interface InsightData {
    name: string;
    period: string;
    values: InsightValue[];
    title: string;
    description: string;
    id: string;
}

interface InsightsResponse {
    data: InsightData[];
}


/**
 * IGメディアのインサイトを取得するクラス
 */
class MediaInsightFetcher {
    private config: IConfig;
    private settings: Map<string, string>;
    private currentDate: CurrentDate;

    constructor(config: IConfig) {
        this.config = config;
        this.settings = this.config.getSettings();
        this.currentDate = getCurrentDate(new Date());
    }

    fetchInsight(mediaId: string): void {
        try {
            const metric: string = "impressions,reach,saved,likes";
            const endpoint: string = `insights?metric=${metric}&period=lifetime`;
            const baseUrl = this.settings.get("baseurl");
            const version = this.settings.get("version");
            const accessToken = this.settings.get("accesstoken");
            const url = `${baseUrl}/${version}/${mediaId}/${endpoint}&access_token=${accessToken}`;
            const response = UrlFetchApp.fetch(url);
            const insights: InsightsResponse = JSON.parse(response.getContentText());
            // console.log(url);            
            this.writeInsight(mediaId, insights)
        } catch (err) {
            // ビジネスアカウントへの変更前に投稿されたメディアはインサイトを取得できない
        }        
    }

    writeInsight(mediaId: string, insights: InsightsResponse): void {
        console.log(mediaId, insights.data[0].name);

        // 変数に格納する
        const map = new Map<string, InsightData>();
        for (const data of insights.data) {
            map.set(data.name, data);
        }

        // IDごとにシート取得
        const spreadsheetId: string = '1HJH0gvyzaUEdMX_YbFVafq5OZIXAN4SZo1f4fFKKgRU';
        const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
        const sheet = spreadsheet.getSheetByName(mediaId);
        if (!sheet) return;

        // シートの最終行 +1 からスタート
        const lastRow: number = sheet.getLastRow();
        const row: number = lastRow + 1;
        let col: number = 1;

        // 最新のインサイトを書き込み        
        sheet.getRange(row, col++).setValue(`${this.currentDate.month}月${this.currentDate.day}日`); // 計測日
        sheet.getRange(row, col++).setValue(`${this.currentDate.hour}時`); // 計測時間
        sheet.getRange(row, col++).setValue(map.get("reach")?.values[0].value); // リーチ数
        sheet.getRange(row, col++).setValue(map.get("plays")?.values[0].value); // 再生数
        sheet.getRange(row, col++).setValue(map.get("likes")?.values[0].value); // いいね
        sheet.getRange(row, col++).setValue(map.get("saved")?.values[0].value); // 保存
        sheet.getRange(row, col++).setValue(map.get("comments")?.values[0].value); // コメ
        sheet.getRange(row, col++).setValue(1); // フォ内外
        sheet.getRange(row, col++).setValue(1); // 初回再生
        sheet.getRange(row, col++).setValue(1); // リプレイ
        sheet.getRange(row, col++).setValue(1); // 総時間
        sheet.getRange(row, col++).setValue(1); // 平均時間
        sheet.getRange(row, col++).setValue(1); // 平均視聴回数
        sheet.getRange(row, col++).setValue(1); // ENG率
        sheet.getRange(row, col++).setValue(1); // 保存率
    }
}

// トリガーで定期実行する
function main() {    
    // IGメディアを取得：新規があればmediaシートの一番下に追加、シート作成
    const media = new Media(new Config());
    media.fetchIdList();
    media.fetchMediaDetail();

    // mediaシートの各IDをキーに現在のインサイトを取得する
    const mediaInsightFetcher = new MediaInsightFetcher(new Config());
    const idList = media.getIdList();
    for (const id of idList) {
        mediaInsightFetcher.fetchInsight(id);
    }
}

main();