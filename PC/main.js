let device;
let selectedHue1 = 0;
let selectedHue2 = 0;
let lastClickPosition1 = null;
let lastClickPosition2 = null;

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded event fired');
    drawColorWheel('colorWheel1');
    drawColorWheel('colorWheel2');

    const connectButton = document.getElementById('connect');
    const sendButton = document.getElementById('send');
    const disconnectButton = document.getElementById('disconnect');
    const reconnectButton = document.getElementById('reconnect');
    const colorWheel1 = document.getElementById('colorWheel1');
    const colorWheel2 = document.getElementById('colorWheel2');

    connectButton.addEventListener('click', async () => {
        try {
            device = await navigator.serial.requestPort();
            await device.open({ baudRate: 9600 });
            addLog('デバイスに接続しました');
        } catch (error) {
            addLog(`接続エラー: ${error}`);
        }
    });

    sendButton.addEventListener('click', async () => {
        if (!device) {
            addLog('デバイスに接続されていません');
            return;
        }

        // 選択した色相をint16_tの形式でエンコード
        const buffer = new ArrayBuffer(4);
        const view = new DataView(buffer);
        view.setInt16(0, selectedHue1, true); // リトルエンディアンで設定
        view.setInt16(2, selectedHue2, true); // リトルエンディアンで設定

        // シリアル通信の送信者
        const writer = device.writable.getWriter(); // 送信者にロックがかかる
        await writer.write(buffer); // 命令を送信
        writer.releaseLock(); // 送信者にロックを開放

        // シリアル通信の受信者
        if (device.readable.locked) {
            addLog('読み取りストリームが既にロックされています');
            return;
        }
        const reader = device.readable.getReader(); // 受信者にロック��かかる
        try {
            const response = await reader.read(); // デバイスからの電文を受信
            if (response.value) {
                const decodedResponse = new TextDecoder().decode(response.value);
                addLog(`デバイスからの応答: ${decodedResponse}`);
            } else {
                addLog('デバイスからの応答がありません');
            }
        } catch (error) {
            addLog(`読み取りエラー: ${error}`);
        } finally {
            reader.cancel(); // 読み取りをキャンセルしてロックを解除
            reader.releaseLock(); // 受信者にロックを開放
        }
    });

    disconnectButton.addEventListener('click', async () => {
        if (!device) {
            addLog('デバイスに接続されていません');
            return;
        }

        await device.close();
        addLog('デバイスとの接続を切断しました');
        device = null;
    });

    reconnectButton.addEventListener('click', async () => {
        if (device) {
            await device.close();
        }
        try {
            device = await navigator.serial.requestPort();
            await device.open({ baudRate: 9600 });
            addLog('デバイスに再接続しました');
        } catch (error) {
            addLog(`再接続エラー: ${error}`);
        }
    });

    colorWheel1.addEventListener('click', (event) => {
        console.log('colorWheel1 clicked');
        const hue = getHueFromClick(event, 'colorWheel1');
        if (hue !== null) {
            selectedHue1 = hue;
            document.getElementById('selectedHue1').textContent = selectedHue1;
            drawClickIndicator(event, 'colorWheel1', lastClickPosition1);
            lastClickPosition1 = { x: event.clientX, y: event.clientY };
        }
    });

    colorWheel2.addEventListener('click', (event) => {
        console.log('colorWheel2 clicked');
        const hue = getHueFromClick(event, 'colorWheel2');
        if (hue !== null) {
            selectedHue2 = hue;
            document.getElementById('selectedHue2').textContent = selectedHue2;
            drawClickIndicator(event, 'colorWheel2', lastClickPosition2);
            lastClickPosition2 = { x: event.clientX, y: event.clientY };
        }
    });
});

function drawColorWheel(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
        console.error(`Canvas element with id ${canvasId} not found`);
        return;
    }
    console.log(`Drawing color wheel on canvas with id ${canvasId}`);
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const radius = canvas.width / 2;
    const innerRadius = radius - 20; // 内側の半径
    const toRad = Math.PI / 180;

    // キャンバスをクリア
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let angle = 0; angle < 360; angle++) {
        const startAngle = (angle - 1) * toRad;
        const endAngle = angle * toRad;
        ctx.beginPath();
        ctx.arc(radius, radius, radius, startAngle, endAngle, false);
        ctx.arc(radius, radius, innerRadius, endAngle, startAngle, true);
        ctx.closePath();
        ctx.fillStyle = `hsl(${angle}, 100%, 50%)`;
        ctx.fill();
    }
}

function getHueFromClick(event, canvasId) {
    const canvas = document.getElementById(canvasId);
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const radius = canvas.width / 2;
    const innerRadius = radius - 20;
    const distanceFromCenter = Math.sqrt(Math.pow(x - radius, 2) + Math.pow(y - radius, 2));

    // 内側の円の外側かつ外側の円の内側をクリックした場合のみ色相を取得
    if (distanceFromCenter < innerRadius || distanceFromCenter > radius) {
        console.log('Clicked outside the color wheel');
        return null;
    }

    console.log(`Click coordinates: (${x}, ${y})`);
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const imageData = ctx.getImageData(x, y, 1, 1).data;
    const r = imageData[0];
    const g = imageData[1];
    const b = imageData[2];
    console.log(`RGB values: (${r}, ${g}, ${b})`);
    return rgbToHue(r, g, b);
}

function rgbToHue(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h;
    if (max === min) {
        h = 0;
    } else if (max === r) {
        h = (60 * (g - b) / (max - min) + 360) % 360;
    } else if (max === g) {
        h = (60 * (b - r) / (max - min) + 120) % 360;
    } else {
        h = (60 * (r - g) / (max - min) + 240) % 360;
    }
    console.log(`Hue: ${h}`);
    return Math.round(h);
}

function drawClickIndicator(event, canvasId, lastClickPosition) {
    const canvas = document.getElementById(canvasId);
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const radius = canvas.width / 2;
    const innerRadius = radius - 20;
    const distanceFromCenter = Math.sqrt(Math.pow(x - radius, 2) + Math.pow(y - radius, 2));
    const indicatorRadius = (radius + innerRadius) / 2; // 色相環の幅の中心

    // 前回のクリック位置の灰色の円をクリア
    if (lastClickPosition) {
        ctx.clearRect(lastClickPosition.x - 10, lastClickPosition.y - 10, 20, 20);
        drawColorWheel(canvasId); // 色相環を再描画
    }

    // クリック位置に灰色の円を描画
    ctx.beginPath();
    ctx.arc(radius + (x - radius) * (indicatorRadius / distanceFromCenter), radius + (y - radius) * (indicatorRadius / distanceFromCenter), 10, 0, 2 * Math.PI); // 円の半径を大きくする
    ctx.fillStyle = '#4d4d4d'; // 濃い灰色に変更
    ctx.fill();
}

function addLog(message) {
    const output = document.getElementById('output');
    const lines = output.textContent.split('\n');
    if (lines.length >= 5) {
        lines.shift();
    }
    lines.push(message);
    output.textContent = lines.join('\n');
}