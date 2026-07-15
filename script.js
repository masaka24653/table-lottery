const STORAGE_KEY = "seat-gacha-settings";

let tables = [];
let history = [];
let animationTimer = null;
let isDrawing = false;

/*
 * 設定画面を開いた時点の状態を保存する変数
 */
let settingsBackup = null;
let settingsChanged = false;

const result = document.getElementById("result");
const settingsList = document.getElementById("settingsList");
const settingsBody = document.getElementById("settingsBody");
const settingsTitle = document.getElementById("settingsTitle");
const tableList = document.getElementById("tableList");

const saveSettingsButton =
    document.getElementById("saveSettingsButton");

const cancelSettingsButton =
    document.getElementById("cancelSettingsButton");

/*
 * オブジェクトを完全にコピーする
 */
function copyTables(source) {
    return source.map(table => ({
        capacity: table.capacity,
        remaining: table.remaining
    }));
}

/*
 * 設定画面を開く
 */
function openSettings() {
    settingsBackup = copyTables(tables);
    settingsChanged = false;

    settingsBody.style.display = "block";
    settingsTitle.textContent = "⚙ 設定 ▼";

    updateSettingsButtons();
}

/*
 * 設定画面を閉じる
 */
function closeSettings() {
    settingsBody.style.display = "none";
    settingsTitle.textContent = "⚙ 設定 ▶";
}

/*
 * 保存・キャンセルボタンの状態
 */
function updateSettingsButtons() {
    saveSettingsButton.disabled = !settingsChanged;
    cancelSettingsButton.disabled = !settingsChanged;
}

settingsTitle.addEventListener("click", () => {

    if (settingsBody.style.display === "none") {

        openSettings();

    } else {

        /*
         * 変更中の場合は、そのまま閉じずに確認する
         */
        if (settingsChanged) {

            const closeWithoutSaving = confirm(
                "設定の変更をキャンセルして閉じますか？"
            );

            if (!closeWithoutSaving) {
                return;
            }

            tables = copyTables(settingsBackup);
            settingsChanged = false;

            render();
        }

        closeSettings();
    }

});

function defaultTables() {
    return [
        { capacity: 6, remaining: 6 },
        { capacity: 6, remaining: 6 },
        { capacity: 6, remaining: 6 }
    ];
}

function loadSettings() {

    const data = localStorage.getItem(STORAGE_KEY);

    if (data) {

        try {
            tables = JSON.parse(data);
        } catch (error) {
            tables = defaultTables();
            saveSettings();
        }

    } else {

        tables = defaultTables();
        saveSettings();

    }

}

function saveSettings() {
    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(tables)
    );
}

/*
 * 設定が変更されたことを記録
 */
function markSettingsChanged() {
    settingsChanged = true;
    updateSettingsButtons();
}

function renderSettings() {

    settingsList.innerHTML = "";

    tables.forEach((table, index) => {

        const row = document.createElement("div");

        row.className = "row";

        row.innerHTML = `
            <div class="tableName">${index + 1}番：</div>

            <div class="capacity">
                定員${table.capacity}名
            </div>

            <button class="smallButton plus">＋</button>

            <button class="smallButton minus">－</button>

            <button class="deleteButton">🗑</button>
        `;

        row.querySelector(".minus").onclick = () => {

            if (table.capacity <= 1) {
                return;
            }

            table.capacity--;

            /*
             * 使用済み席数を維持しながら定員を減らす
             */
            table.remaining =
                Math.min(table.remaining, table.capacity);

            markSettingsChanged();
            render();

        };

        row.querySelector(".plus").onclick = () => {

            table.capacity++;
            table.remaining++;

            markSettingsChanged();
            render();

        };

        row.querySelector(".deleteButton").onclick = () => {

            if (tables.length <= 1) {
                return;
            }

            tables.splice(index, 1);

            markSettingsChanged();
            render();

        };

        settingsList.appendChild(row);

    });

}

function renderStatus() {

    tableList.innerHTML = "";

    tables.forEach((table, index) => {

        const row = document.createElement("div");

        row.className = "row";

        if (table.remaining === 0) {
            row.style.color = "#999";
        }

        let seats = "";

        if (table.remaining === 0) {

            seats = "🚫 満席";

        } else {

            for (let i = 0; i < table.capacity; i++) {

                if (i < table.remaining) {
                    seats += "🟩";
                } else {
                    seats += "⬜";
                }

            }

        }

        row.innerHTML = `
            <div>${index + 1}番</div>
            <div>${seats}</div>
        `;

        tableList.appendChild(row);

    });

    const drawButton =
        document.getElementById("drawButton");

    const remain = tables.reduce(
        (sum, table) => sum + table.remaining,
        0
    );

    drawButton.disabled = remain === 0;

    const totalSeats = tables.reduce(
        (sum, table) => sum + table.capacity,
        0
    );

    const remainingSeats = tables.reduce(
        (sum, table) => sum + table.remaining,
        0
    );

    document.getElementById("seatSummary").textContent =
        `${remainingSeats}/${totalSeats}`;

}

function render() {
    renderSettings();
    renderStatus();
    updateSettingsButtons();
}

document.getElementById("addTableButton").onclick = () => {

    tables.push({
        capacity: 6,
        remaining: 6
    });

    markSettingsChanged();
    render();

};

/*
 * 設定を保存
 */
saveSettingsButton.onclick = () => {

    saveSettings();

    /*
     * テーブル番号や定員が変更されるため、
     * 過去の抽選取り消し履歴を消す
     */
    history = [];

    settingsBackup = copyTables(tables);
    settingsChanged = false;

    updateSettingsButtons();
    closeSettings();

    result.textContent = "設定を保存しました";

};

/*
 * 設定変更をキャンセル
 */
cancelSettingsButton.onclick = () => {

    if (!settingsChanged) {
        closeSettings();
        return;
    }

    tables = copyTables(settingsBackup);
    settingsChanged = false;

    render();
    closeSettings();

    result.textContent = "設定の変更をキャンセルしました";

};

document.getElementById("drawButton").onclick = () => {

    if (isDrawing) {
        return;
    }

    const availableSeats = [];

    tables.forEach((table, index) => {

        for (let i = 0; i < table.remaining; i++) {
            availableSeats.push(index);
        }

    });

    if (availableSeats.length === 0) {
        result.textContent = "全席満席";
        return;
    }

    isDrawing = true;

    let count = 0;

    animationTimer = setInterval(() => {

        const random =
            Math.floor(Math.random() * tables.length);

        result.textContent = `${random + 1}番`;

        count++;

        if (count >= 10) {

            clearInterval(animationTimer);

            const randomIndex =
                Math.floor(
                    Math.random() * availableSeats.length
                );

            const selectedTableIndex =
                availableSeats[randomIndex];

            const selectedTable =
                tables[selectedTableIndex];

            selectedTable.remaining--;

            history.push(selectedTableIndex);

            result.innerHTML = `
                ${selectedTableIndex + 1}番
                <div class="remainingText">
                    残り${selectedTable.remaining}席
                </div>
            `;

            saveSettings();
            renderStatus();

            isDrawing = false;

        }

    }, 80);

};

document.getElementById("undoButton").onclick = () => {

    if (history.length === 0) {
        result.textContent =
            "取り消せる抽選がありません";
        return;
    }

    const canceledTableIndex = history.pop();
    const canceledTable = tables[canceledTableIndex];

    /*
     * テーブルが存在しない場合への念のための対策
     */
    if (!canceledTable) {
        result.textContent =
            "この抽選は取り消せません";
        history = [];
        return;
    }

    canceledTable.remaining++;

    result.textContent =
        `${canceledTableIndex + 1}番を取り消しました`;

    saveSettings();
    renderStatus();

};

document.getElementById("resetButton").onclick = () => {

    if (!confirm("抽選結果をリセットしますか？")) {
        return;
    }

    tables.forEach(table => {
        table.remaining = table.capacity;
    });

    history = [];

    result.textContent = "抽選可能です";

    /*
     * リセットは設定変更とは別に即時保存
     */
    saveSettings();

    /*
     * 設定画面のバックアップも更新
     */
    settingsBackup = copyTables(tables);
    settingsChanged = false;

    render();

};

loadSettings();

settingsBody.style.display = "none";
settingsTitle.textContent = "⚙ 設定 ▶";

render();