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
var oddsValue = [2, 3, 4, 9, 49, 97];
var indexArray = [];
var index = 0;

var round = 0; // 0 = reset, 1 = betting, 2 = start, 3 = game over
var roundDelayCount = [3, 10, 13, 5];
var roundCount = 0;

var currentTotalBetValue = [0, 0, 0, 0, 0, 0];
var currentPlayerBetValue = [0, 0, 0, 0, 0, 0];
var currentPlayerTotalBetValue = 0;

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
        betOdds: oddsValue,
        minBet: 1,
        maxBet: 1024,
        recordList: records,
        round: round,
        roundCount: roundDelayCount[round] - roundCount,
        maxRoundCount: roundDelayCount[round],
        indexArray: indexArray,
        index:index,

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

function resetResponse() {

    const defaultOdds = [2, 3, 4, 9, 49, 97];
    oddsValue = [...defaultOdds]; // Create a copy of the defaultOdds array

    // Fisher-Yates shuffle algorithm to randomize the array
    for (let i = oddsValue.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1)); // Generate a random index from 0 to i
        [oddsValue[i], oddsValue[j]] = [oddsValue[j], oddsValue[i]]; // Swap elements
    }

    let response = {
        errCode: 0,
        errMsg: "success",
        vals: {},
    }

    response.vals = {
        type: 100000,
        id: 3,
        data: {
            subType: 100071,
            subData: [{
                errCode: 0,
                opCode: "Reset",
                roundCount: roundDelayCount[0] - roundCount,
                maxRoundCount: roundDelayCount[0],
                odds: oddsValue,
                records: records,
            }]
        }
    }

    return response;
}

function startBetResponse() {
    let response = {
        errCode: 0,
        errMsg: "success",
        vals: {},
    }

    response.vals = {
        type: 100000,
        id: 3,
        data: {
            subType: 100071,
            subData: [{
                errCode: 0,
                opCode: "StartBet",
                roundCount: roundDelayCount[1] - roundCount,
                maxRoundCount: roundDelayCount[1],
                odds: oddsValue,
            }]
        }
    }

    return response;
}

function resultResponse() {
    const numbers = [1, 2, 3, 4, 5, 6];

    index = Math.floor(Math.random() * 6) + 1;

    for (let i = 0; i < 12; i++) {
        // Create a copy of the numbers array
        const array = [...numbers];

        // If it's the last iteration, set the chosen number as the first index
        if (i === 11) {
            // Remove the chosen number from its current position
            const indexOfChosenNumber = array.indexOf(index);
            array.splice(indexOfChosenNumber, 1);

            // Insert the chosen number at the first index
            array.unshift(index);
        } else {
            // Shuffle the array for other iterations
            for (let j = array.length - 1; j > 0; j--) {
                const k = Math.floor(Math.random() * (j + 1));
                [array[j], array[k]] = [array[k], array[j]];
            }
        }

        // Add the created array to indexArray
        indexArray.push(array);
    }

    gameCode = "#" + generateRandomString(6);

    let response = {
        errCode: 0,
        errMsg: "success",
        vals: {},
    }

    betInfo = {
        index: index,
        indexArray: indexArray,
        roundId: gameCode,
    }

    response.vals = {
        type: 100000,
        id: 3,
        data: {
            subType: 100071,
            subData: [{
                errCode: 0,
                opCode: "Result",
                roundCount: roundDelayCount[1] - roundCount,
                maxRoundCount: roundDelayCount[1],
                betInfo: [betInfo],
            }]
        }
    }

    return response;
}

function setBetRequest(bet, betArray) {
    // validate bet
    currentPlayerBetValue = betArray;
    currentPlayerTotalBetValue = bet;

    gameCode = "#" + generateRandomString(6);
    for (var i = 0; i < betArray.length; i++) {
        balance -= betArray[i];
    }

    let response = {
        errCode: 0,
        errMsg: "success",
        vals: {},
    }

    betInfo = {
        betArray: currentPlayerBetValue,
        balance: balance,
    }
    response.vals = {
        type: 100000,
        id: 3,
        data: {
            subType: 100071,
            subData: [{
                errCode: 0,
                opCode: "SetBet",
                betInfo: [betInfo],
            }]
        }
    }

    globalBetResponse();

    return response;
}

function globalBetResponse() {

    let response = {
        errCode: 0,
        errMsg: "success",
        vals: {},
    }

    betInfo = {
        betArray: currentTotalBetValue,
    }
    response.vals = {
        type: 100000,
        id: 3,
        data: {
            subType: 100071,
            subData: [{
                errCode: 0,
                opCode: "GlobalBet",
                betInfo: [betInfo],
            }]
        }
    }
    if (wsocket && wsocket.readyState === Websocket.OPEN) {
        wsocket.send(JSON.stringify(response));
    }
}

function gameOverResponse() {
    let playerWinlose = 0;
    if (currentPlayerBetValue[index - 1] > 0) {
        playerWinlose = currentPlayerBetValue[index - 1] * oddsValue[index - 1];
    }

    playerWinlose = Math.floor(playerWinlose);

    increaseMoney = playerWinlose;
    balance += playerWinlose;

    let response = {
        errCode: 0,
        errMsg: "success",
        vals: {},
    }

    betInfo = {
        balance: balance,
        winAmount: playerWinlose,
        odds: oddsValue[index - 1],
        index: index,
    }
    response.vals = {
        type: 100000,
        id: 3,
        data: {
            subType: 100071,
            subData: [{
                errCode: 0,
                opCode: "CashOut",
                betInfo: [betInfo],
            }]
        }
    }


    return response;
}


// Define your custom function that you want to run independently
function commonIntervalInit() {
    // Keep the server running indefinitely
    setInterval(() => {
        roundCount += 1;
        if (roundCount > roundDelayCount[round]) {
            round += 1;
            roundCount = 1;
            // reset
            if (round > roundDelayCount.length - 1) {
                round = 0;
            }
        }

        // reset action
        if (round == 0) {
            if (roundCount == 1) {
                currentPlayerBetValue = [0, 0, 0, 0, 0, 0];
                currentTotalBetValue = [0, 0, 0, 0, 0, 0];
                currentPlayerTotalBetValue = 0;
                indexArray = [];
                let response = resetResponse();
                if (wsocket && wsocket.readyState === Websocket.OPEN) {
                    wsocket.send(JSON.stringify(response));
                }
            }
        }

        // start betting action
        if (round == 1) {
            if (roundCount == 1) {
                let response = startBetResponse();
                if (wsocket && wsocket.readyState === Websocket.OPEN) {
                    wsocket.send(JSON.stringify(response));
                }
            }
        }

        if (round == 2) {
            if (roundCount == 1) {
                let response = resultResponse();
                if (wsocket && wsocket.readyState === Websocket.OPEN) {
                    wsocket.send(JSON.stringify(response));
                }
            }
        }

        // game over action
        if (round == 3) {

            if (roundCount == 1) {
                if (records.length > 10) {
                    records.shift();
                }

                let response = gameOverResponse();
                if (wsocket && wsocket.readyState === Websocket.OPEN) {
                    wsocket.send(JSON.stringify(response));
                }
            }
        }
    }, 1000);
}

commonIntervalInit();

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