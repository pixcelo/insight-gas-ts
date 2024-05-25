
function getSheet(sheetUrl: string, sheetName: string) {
    const spreadsheet = SpreadsheetApp.openByUrl(sheetUrl);
    return spreadsheet.getSheetByName(sheetName);
}

type settings = {
    appid: string,
    appSecret: string,
    accessToken: string,
    userId: string
}

class Config {
    private appId: string = "";
    private appSecret: string = "";
    private accessToken: string = "";
    private userId: string = "";

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
    }

    getSettings(): settings {
        return {
            appid: this.appId,
            appSecret: this.appSecret,
            accessToken: this.accessToken,
            userId: this.userId
        }
    }
}

class MediaList {
    c = new Config();
    base_url = "https://graph.facebook.com";
    version = "v19.0";
    endpoint = "media?";

    mediaList: string[] = [];

    fetchMediaList(): void {
        try {
            const ws = getSheet(
                "https://docs.google.com/spreadsheets/d/1HJH0gvyzaUEdMX_YbFVafq5OZIXAN4SZo1f4fFKKgRU/edit#gid=0",
                "mediaList"
            );
            if (!ws) return;

            // シートを初期化
            ws.clear();
            const settings = this.c.getSettings();
            const url = `${this.base_url}/${this.version}/${settings.userId}/${this.endpoint}&access_token=${settings.accessToken}`;            
            const response = UrlFetchApp.fetch(url);
            const result = JSON.parse(response.getContentText());
            console.log(result);
            result.data.forEach((media: any, index: number) => {
                console.log(media.id);
                ws.getRange(index + 1, 1).setValue(media.id);
                this.mediaList.push(media.id);
            });            
        } catch (err) {
            // Logger.log(err);
        }        
    }

    // メディアリストの一覧をループして、サムネイルやID、URLを取得
}

class InsightFetcher {

    // メディアリストの一覧を受け取って、シートを作成（なければ）、そのシートの最後の行に現在のインサイトを入力する
}

const media = new MediaList();
media.fetchMediaList();