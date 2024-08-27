const Websocket = require("ws");

const server = new Websocket.Server({ port: 9900 });

let wsocket; // Declare a variable to hold the WebSocket object

var balance = 0;
var playerId = "";
var increaseMoney = 0;
var gameCode = "";
var awardMoney = 0;
var awardBase = 0;
var gameType = 2;
var roomId = 0;
var records = [];
var multiplierValue = [0,0,0,0,0,0];
var result = [0, 0, 0];

var count = 0;

function generateRandomString(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let randomString = '';

    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        randomString += characters.charAt(randomIndex);
    }

    return randomString;
}

function generateRandomInt(length) {
    const characters = '0123456789';
    let randomString = '';

    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        randomString += characters.charAt(randomIndex);
    }

    return randomString;
}


function loginRequest() {
    playerId = generateRandomString(8);
    balance = 200000;

    let response = {
        errCode: 0,
        errMsg: "success",
        vals: {},
    }

    response.vals = {
        type: 1,
        id: 1,
        data: {
            sessionId: generateRandomInt(10),
            errCode: 0,
            lobbyServerIp: "127.0.0.1",
            lobbyServerPort: 9900,
            playerId: playerId,
        }
    }

    return response;
}

function lobbyRequest() {

    let response = {
        errCode: 0,
        errMsg: "success",
        vals: {},
    }

    response.vals = {
        type: 3,
        id: 3,
        data: {
            gameId: generateRandomInt(6),
            errCode: 0,
            balance: balance,
            serverTime: Date.now(),
            currency: "CNY",
            walletType:2,
        }
    }
    return response;
}

function joinRoomRequest() {
    let response = {
        errCode: 0,
        errMsg: "success",
        vals: {},
    }

    betInfo = {
        gameName: "Plinko",
        minBet: 1,
        maxBet: 1024,
    }

    currencyInfo = {
        currencyId: 1,
        currency: "CNY",
    }

    response.vals = {
        type: 100000,
        id: 3,
        data: {
            subType: 100005,
            subData: [{
                gameType: gameType,
                roomId: roomId,
                errCode: 0,
                balance: balance,
                betInfo: [betInfo],
                currencyInfo: currencyInfo,
            }]
        }
    }

    return response;
}

function transferRequest() {
    let response = {
        errCode: 0,
        errMsg: "success",
        vals: {},
    }

    response.vals = {
        type: 100000,
        id: 3,
        data: {
            subType: 100069,
            subData: [{
                errCode: 0,
                balance: balance,
                increaseMoney: increaseMoney,
            }]
        }
    }

    increaseMoney = 0;
    return response;
}

function recordRequest() {
    let response = {
        errCode: 0,
        errMsg: "success",
        vals: {},
    }

    records = [
        {
            id: 321541,
            bet: 2,
            odds: 0.0,
            winMoney:0,
        },
        {
            id: 321541,
            bet: 2,
            odds: 1.5,
            winMoney: 3,
        },
    ]

    response.vals = {
        type: 100000,
        id: 3,
        data: {
            subType: 100071,
            subData: [{
                errCode: 0,
                opCode: "GetRecords",
                recordsInfo: records,
            }]
        }
    }

    return response;
}

function roomInfoRequest() {
    let response = {
        errCode: 0,
        errMsg: "success",
        vals: {},
    }

    roomInfo = {
        betOdds: multiplierValue,
        minBet: 1,
        maxBet: 1024,
        recordList: records,
    }

    response.vals = {
        type: 100000,
        id: 3,
        data: {
            subType: 100071,
            subData: [{
                errCode: 0,
                opCode: "SyncRoomInfo",
                roomInfo: roomInfo,
            }]
        }
    }

    return response;
}

function roomListRequest() {
    let response = {
        errCode: 0,
        errMsg: "success",
        vals: {},
    }

    let date = Date.now();
    date += 60 * 60 * 1000;
    response.vals = {
        type: 100000,
        id: 3,
        data: {
            gameType: gameType,
            roomIndex: roomId,
            isOccupied: true,
            reserveExpiredTime : date,
        }
    }

    return response;
}

function setBetRequest(bet, betArray) {
    awardBase = bet;
    gameCode = "#" + generateRandomString(10);
    balance -= awardBase;

    result = [0, 0, 0];
    multiplierValue = [0, 0, 0, 0, 0, 0];

    for (let i = 0; i < result.length; i++) {
        result[i] = Math.floor(Math.random() * 6) + 1;
    }

    // Count the frequency of each number in the result array
    var counts = {};
    result.forEach(function (x) {
        counts[x] = (counts[x] || 0) + 1;
    });

    // Update the multiplierValue array based on the counts
    for (let i = 1; i <= 6; i++) {
        if (counts[i] === 3) {
            multiplierValue[i - 1] = 9;  // Set multiplier to 9 if a number appears three times
        } else if (counts[i] === 2) {
            multiplierValue[i - 1] = 2;  // Set multiplier to 2 if a number appears twice
        } else if (counts[i] === 1) {
            multiplierValue[i - 1] = 1;  // Set multiplier to 1 if a number appears once
        }
    }

    let winAmount = 0;


    for (let i = 0; i < multiplierValue.length; i++) {
        winAmount += multiplierValue[i] * betArray[i];
    }

    let response = {
        errCode: 0,
        errMsg: "success",
        vals: {},
    }

    betInfo = [{
        bet: awardBase,
        balance: balance,
        index: result,
        winAmount: winAmount,
        roundId: gameCode,
        finalBalance: balance + winAmount,
    }]
    response.vals = {
        type: 100000,
        id: 3,
        data: {
            subType: 100071,
            subData: [{
                errCode: 0,
                opCode: "SetBet",
                betInfo: betInfo,
            }]
        }
    }

    balance += winAmount;

    return response;
}


server.on("connection", (ws) => {
    wsocket = ws;

    // ws.send("4515ce54-c62a-43ed-964e-0f4d4dc402b3");

    ws.on("message", (message) => {
        const jsonContent = JSON.parse(message);

        // login request
        if (jsonContent.type == 0) {
            let response = loginRequest();
            ws.send(JSON.stringify(response));
        }

        // lobby request
        if (jsonContent.type == 2) {
            let response = lobbyRequest();
            ws.send(JSON.stringify(response));
        }

        // room list request
        if (jsonContent.type == 200017) {
            let response = roomListRequest();
            ws.send(JSON.stringify(response));
        }

        if (jsonContent.type == 100000) {
            // join Room request

            if (jsonContent.data[0].subType == 100004) {
                roomId = jsonContent.data[0].subData.roomId;
                let response = joinRoomRequest();
                ws.send(JSON.stringify(response));
            }

            // transfer info request
            if (jsonContent.data[0].subType == 100068) {
                let response = transferRequest();
                ws.send(JSON.stringify(response));
            }

            // custom request
            if (jsonContent.data[0].subType == 100070) {
                // get records request
                if (jsonContent.data[0].subData[0].opCode == "GetRecords") {
                    let response = recordRequest();
                    ws.send(JSON.stringify(response));
                }
                // sync room info request
                if (jsonContent.data[0].subData[0].opCode == "SyncRoomInfo") {
                    let response = roomInfoRequest();
                    ws.send(JSON.stringify(response));
                }
                // set bet request
                if (jsonContent.data[0].subData[0].opCode == "SetBet") {
                    let bet = jsonContent.data[0].subData[0].message.bet;
                    let betArray = jsonContent.data[0].subData[0].message.betArray;
                    let response = setBetRequest(bet, betArray);
                    ws.send(JSON.stringify(response));
                }
            }
        }
    })
});