const greeter = (person: string) => {
    return `Hello, ${person}!`;
}

function testGreeter() {
    const user = 'Grant';
    Logger.log(greeter(user));
}

function getTableFromSheet() {
    const SHEET_URL = "https://docs.google.com/spreadsheets/d/1HJH0gvyzaUEdMX_YbFVafq5OZIXAN4SZo1f4fFKKgRU/edit#gid=0";    
    const ws = SpreadsheetApp.openByUrl(SHEET_URL);
    const table = ws.getDataRange().getValues();
    console.log(table);
}

class Config {

    appId = "";
    appSecret = "";
    accessToken ="";

    constructor() {
        const SHEET_URL = "https://docs.google.com/spreadsheets/d/1HJH0gvyzaUEdMX_YbFVafq5OZIXAN4SZo1f4fFKKgRU/edit#gid=0";
        const SHEET_CONFIG = "config";
        const ssa = SpreadsheetApp.openByUrl(SHEET_URL);
        const ws = ssa.getSheetByName(SHEET_CONFIG);
        if (!ws) return;

        this.appSecret = ws.getRange("A1").getValue();
        this.appId = ws.getRange("A2").getValue();
        this.accessToken = ws.getRange("A3").getValue();
    }
        
    getAppId = () => this.appId;
    getAppSecret = () => this.appSecret;
    getAccessToken = () => this.accessToken;
}

const config = new Config();
console.log(config.getAppId());
