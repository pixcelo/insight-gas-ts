
function getSheet(sheetUrl: string, sheetName: string) {
    const spreadsheet = SpreadsheetApp.openByUrl(sheetUrl);
    return spreadsheet.getSheetByName(sheetName);
}

class Config {

    appId: string = "";
    appSecret: string = "";
    accessToken: string ="";

    constructor() {
        const ws = getSheet(
            "https://docs.google.com/spreadsheets/d/1HJH0gvyzaUEdMX_YbFVafq5OZIXAN4SZo1f4fFKKgRU/edit#gid=0",
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

class Media {
    c = new Config();
    base_url = "https://graph.facebook.com";
    version = "v19.0";
    id = "";
    endpoint = "media?";
    url = `${this.base_url}/${this.version}/${this.id}/${this.endpoint}&access_token=${this.c.getAccessToken()}`;    

    async fetchMediaList() {
        try {
            console.log(this.url);
            const response = await UrlFetchApp.fetch(this.url);
            const result = JSON.parse(response.getContentText());
            console.log(result);

            const ws = getSheet(
                "https://docs.google.com/spreadsheets/d/1HJH0gvyzaUEdMX_YbFVafq5OZIXAN4SZo1f4fFKKgRU/edit#gid=0",
                "mediaList"
            );            
            if (!ws) return;

            // 初期化
            ws.clear();

            
        } catch (err) {
            Logger.log(err);
        }
    }
}

// const config = new Config();
// console.log(config.getAppId());
const media = new Media();
media.fetchMediaList();