
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

function createSheet(sheetName: string): void {
    const spreadsheetId = '1HJH0gvyzaUEdMX_YbFVafq5OZIXAN4SZo1f4fFKKgRU';
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    const sheet = spreadsheet.getSheetByName(sheetName);
    
    if (!sheet) {
        // シートが存在しない場合、新しいシートを作成
        const sheetIndex: number = spreadsheet.getSheets().length;
        const newSheet = spreadsheet.insertSheet(sheetName, sheetIndex + 1);
        
        newSheet.getRange("A1").setValue("計測日");
        newSheet.getRange("B1").setValue("計測時間");
        newSheet.getRange("C1").setValue("リーチ数");
        newSheet.getRange("D1").setValue("再生数");
        newSheet.getRange("E1").setValue("いいね");
        newSheet.getRange("F1").setValue("保存");
        newSheet.getRange("G1").setValue("コメ");
        
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
 * IGメディアのインサイトを取得するクラス
 */
class MediaInsightFetcher {

    fetchInsight(mediaId: string): void {

    }

    writeInsight(): void {

    }
}

const media = new Media(new Config());
media.fetchIdList();
media.fetchMediaDetail();

const mediaInsightFetcher = new MediaInsightFetcher();

// トリガーで定期実行する
function main() {
    // 実行する手順
    // IGメディアを取得　新規があればmidiaシートの一番下に追加、シートを作成


    // mediaシートのＩＤの配列を取得、ループ    

    // インサイトを取得する

    // 現在のインサイトを取得する

    // IDごとにシート取得
    // シートの最終行を取得
    // 最終行＋１からスタート

    // 変数に格納する
    // 最終行＋１に書き込む
}