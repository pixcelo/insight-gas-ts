
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
        ws.clear();

        const idList = this.idList;
        for (let i = 0; i < idList.length; i++) {
            const mediaId: string = idList[i];
            const endpoint: string = "fields=caption,like_count,media_url,permalink";
            const baseUrl = this.settings.get("baseurl");
            const version = this.settings.get("version");
            const accessToken = this.settings.get("accesstoken");
            const url = `${baseUrl}/${version}/${mediaId}?${endpoint}&access_token=${accessToken}`;
            const response = UrlFetchApp.fetch(url);
            const media = JSON.parse(response.getContentText());

            const row: number = i + 1;
            const rowHeight: number = 80;
            ws.setRowHeight(row, rowHeight);

            ws.getRange(row, 1).setValue(mediaId);
            ws.getRange(row, 2).setValue(media.like_count);
            ws.getRange(row, 3).setValue(`=IMAGE(D${row})`);
            ws.getRange(row, 4).setValue(media.media_url);
            ws.getRange(row, 5).setValue(media.permalink);
        }
    }
}

class InsightFetcher {

    // メディアリストの一覧を受け取って、シートを作成（なければ）、そのシートの最後の行に現在のインサイトを入力する
}

const media = new Media(new Config());
media.fetchIdList();
media.fetchMediaDetail();