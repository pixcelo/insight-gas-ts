
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

class Config {
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

class Media {
    private config: Config;
    private settings: Map<string, string>;    
    private idList: string[];

    constructor(config: Config) {
        this.config = config;
        this.settings = this.config.getSettings();
        this.idList = [];
    }

    fetchIdList(): void {
        try {
            const ws = getSheet(
                "https://docs.google.com/spreadsheets/d/1HJH0gvyzaUEdMX_YbFVafq5OZIXAN4SZo1f4fFKKgRU/edit#gid=0",
                "mediaList"
            );
            if (!ws) return;

            // シートを初期化
            ws.clear();
            
            const endpoint = "media?";
            const baseUrl = this.settings.get("baseurl");
            const version = this.settings.get("version");
            const userId = this.settings.get("userid");
            const accessToken = this.settings.get("accesstoken");
            const url = `${baseUrl}/${version}/${userId}/${endpoint}&access_token=${accessToken}`;
            const response = UrlFetchApp.fetch(url);
            const result = JSON.parse(response.getContentText());
            // console.log(result);

            result.data.forEach((media: any, index: number) => {
                // console.log(media.id);
                ws.getRange(index + 1, 1).setValue(media.id);
                this.idList.push(media.id);
            });            
        } catch (err) {
            // Logger.log(err);
        }        
    }

    // メディアリストの一覧をループして、サムネイルやID、URLを取得
    fetchMediaDetail(): void {
        const idList = media.idList;
        for (let i = 0; i < idList.length; i++) {
            // console.log(idList[i]);
            const mediaId = idList[i];            
            const endpoint = "fields=caption,like_count,media_url";
            const baseUrl = this.settings.get("baseurl");
            const version = this.settings.get("version");            
            const accessToken = this.settings.get("accesstoken");
            const url = `${baseUrl}/${version}/${mediaId}?${endpoint}&access_token=${accessToken}`;            
            const response = UrlFetchApp.fetch(url);
            const result = JSON.parse(response.getContentText());
            console.log(result.caption, result.like_count, result.media_url);
        }
    }
}

class InsightFetcher {

    // メディアリストの一覧を受け取って、シートを作成（なければ）、そのシートの最後の行に現在のインサイトを入力する
}

const media = new Media(new Config());
media.fetchIdList();
media.fetchMediaDetail();