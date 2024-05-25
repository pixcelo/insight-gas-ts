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

class AppSetting {
    
    appId = "";
    appSecret = "";
    accessToken ="";

    constructor() {
        const SHEET_URL = "https://docs.google.com/spreadsheets/d/1HJH0gvyzaUEdMX_YbFVafq5OZIXAN4SZo1f4fFKKgRU/edit#gid=0";
        const SHEET_KEYS = "keys";
        const ssa = SpreadsheetApp.openByUrl(SHEET_URL);
        const ws = ssa.getSheetByName(SHEET_KEYS);
        if (!ws) return;

        this.appSecret = ws.getRange("A1").getValue();
        this.appId = ws.getRange("A2").getValue();        
    }
        
    getAppId = () => this.appId;
    getAppSecret = () => this.appSecret;
}

const appSetting = new AppSetting();
console.log(appSetting.getAppId());
