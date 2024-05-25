
function getSheet(sheetUrl: string, sheetName: string) {
    const spreadsheet = SpreadsheetApp.openByUrl(sheetUrl);
    return spreadsheet.getSheetByName(sheetName);
}

class Config {

    private appId: string = "";
    private appSecret: string = "";
    private accessToken: string ="";

    constructor() {
        const ws = getSheet(
            "https://docs.google.com/spreadsheets/d/1HJH0gvyzaUEdMX_YbFVafq5OZIXAN4SZo1f4fFKKgRU/edit#gid=1947337068",
            "config"
        );
        if (!ws) return;

        this.appSecret = ws.getRange("B1").getValue();
        this.appId = ws.getRange("B2").getValue();
        this.accessToken = ws.getRange("B3").getValue();
    }
        
    getAppId = () => this.appId;
    getAppSecret = () => this.appSecret;
    getAccessToken = () => this.accessToken;
}

// interface mediaData {
//     id: string
// }

// interface Media {
//     dataList: mediaData[]
// }

class MediaList {
    c = new Config();
    base_url = "https://graph.facebook.com";
    version = "v19.0";
    id = "17841463939587178";
    endpoint = "media?";
    url = `${this.base_url}/${this.version}/${this.id}/${this.endpoint}&access_token=${this.c.getAccessToken()}`;    

    fetchMediaList(): void {
        try {
            const ws = getSheet(
                "https://docs.google.com/spreadsheets/d/1HJH0gvyzaUEdMX_YbFVafq5OZIXAN4SZo1f4fFKKgRU/edit#gid=0",
                "mediaList"
            );
            if (!ws) return;

            // 初期化
            ws.clear();

            console.log(this.url);
            const response = UrlFetchApp.fetch(this.url);
            const result = JSON.parse(response.getContentText());
            console.log(result);
            result.data.forEach((media: any, index: number) => {
                console.log(media.id);
                ws.getRange(index + 1, 1).setValue(media.id);
            });            
        } catch (err) {
            // Logger.log(err);
        }
    }
}

const media = new MediaList();
media.fetchMediaList();