
function getSheet(sheetUrl: string, sheetName: string) {
    const spreadsheet = SpreadsheetApp.openByUrl(sheetUrl);
    return spreadsheet.getSheetByName(sheetName);
}

type settings = {
    appid: string,
    appSecret: string,
    accessToken: string,
    userId: string,
    baseUrl: string,
    version: string
}

class Config {
    private appId: string = "";
    private appSecret: string = "";
    private accessToken: string = "";
    private userId: string = "";
    private baseUrl: string = "";
    private version: string = "";

    constructor() {
        const ws = getSheet(
            "https://docs.google.com/spreadsheets/d/1HJH0gvyzaUEdMX_YbFVafq5OZIXAN4SZo1f4fFKKgRU/edit#gid=1947337068",
            "config"
        );
        if (!ws) return;

        this.appSecret = ws.getRange("B1").getValue();
        this.appId = ws.getRange("B2").getValue();
        this.accessToken = ws.getRange("B3").getValue();
        this.userId = ws.getRange("B4").getValue();
        this.baseUrl = ws.getRange("B5").getValue();
        this.version = ws.getRange("B6").getValue();
    }

    getSettings(): settings {
        return {
            appid: this.appId,
            appSecret: this.appSecret,
            accessToken: this.accessToken,
            userId: this.userId,
            baseUrl: this.baseUrl,
            version: this.version
        }
    }
}

class Media {
    private config = new Config();
    private settings: settings;    
    public idList: string[] = [];

    constructor(config: Config) {
        this.config = config;
        this.settings = this.config.getSettings(); 
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
            const url = `${this.settings.baseUrl}/${this.settings.version}/${this.settings.userId}/${endpoint}&access_token=${this.settings.accessToken}`;
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
            const url = `${this.settings.baseUrl}/${this.settings.version}/${mediaId}?${endpoint}&access_token=${this.settings.accessToken}`;            
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