const STORAGE_KEY = "seat-gacha-settings";

let tables = [];
let history = [];
let animationTimer = null;
let isDrawing = false;

const result = document.getElementById("result");
const settingsList = document.getElementById("settingsList");
const settingsBody = document.getElementById("settingsBody");
const settingsTitle = document.getElementById("settingsTitle");
const tableList = document.getElementById("tableList");

settingsTitle.addEventListener("click", () => {
    if (settingsBody.style.display === "none") {
        settingsBody.style.display = "block";
        settingsTitle.textContent = "⚙ 設定 ▼";
    } else {
        settingsBody.style.display = "none";
        settingsTitle.textContent = "⚙ 設定 ▶";
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
        tables = JSON.parse(data);
    } else {
        tables = defaultTables();
        saveSettings();
    }

}

function saveSettings() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tables));
}

function renderSettings() {

    settingsList.innerHTML = "";

    tables.forEach((table, index) => {

        const row=document.createElement("div");

        row.className="row";

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

            if (table.capacity > 1) {

                table.capacity--;
                table.remaining = Math.min(table.remaining, table.capacity);

                saveSettings();
                render();

            }

        };

        row.querySelector(".plus").onclick = () => {

            table.capacity++;
            table.remaining++;

            saveSettings();
            render();

        };

        row.querySelector(".deleteButton").onclick = () => {

            if (tables.length <= 1) return;

            tables.splice(index,1);

            saveSettings();
            render();

        };

        settingsList.appendChild(row);

    });

}

function renderStatus(){

    tableList.innerHTML="";

    tables.forEach((table,index)=>{

    const row=document.createElement("div");

    row.className="row";

    if(table.remaining===0){
       row.style.color="#999";
    }

        let seats="";

        if(table.remaining===0){

            seats="🚫 満席";

        }else{

            for(let i=0;i<table.capacity;i++){

                if(i<table.remaining){
                    seats+="🟩";
                }else{
                    seats+="⬜";
                }

            }

        }

        row.innerHTML=`
            <div>${index+1}番</div>
            <div>${seats}</div>
        `;

        tableList.appendChild(row);

    });

const drawButton = document.getElementById("drawButton");

const remain = tables.reduce((sum,t)=>sum+t.remaining,0);

drawButton.disabled = remain===0;

}

function render(){

    renderSettings();

    renderStatus();

}

document.getElementById("addTableButton").onclick=()=>{

    tables.push({
        capacity:6,
        remaining:6
    });

    saveSettings();

    render();

};

document.getElementById("drawButton").onclick = () => {

    if (isDrawing) return;

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
                Math.floor(Math.random() * availableSeats.length);

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
        result.textContent = "取り消せる抽選がありません";
        return;
    }

    const canceledTableIndex = history.pop();
    const canceledTable = tables[canceledTableIndex];

    canceledTable.remaining++;

    result.textContent = `${canceledTableIndex + 1}番を取り消しました`;

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

    result.textContent = "まだ抽選していません";

    saveSettings();
    renderStatus();

};

loadSettings();

settingsBody.style.display = "none";
settingsTitle.textContent = "⚙ 設定 ▶";

render();