const STORAGE_KEY = "seat-gacha-settings";

let tables = [];

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

        const row = document.createElement("div");
        row.className = "settingRow";

        row.innerHTML = `
            <div class="tableName">${index + 1}番</div>

            <button class="smallButton minus">－</button>

            <div class="capacity">
                定員 ${table.capacity}
            </div>

            <button class="smallButton plus">＋</button>

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

        row.innerHTML=`
            <div>${index+1}番</div>
            <div>${table.remaining}/${table.capacity}</div>
        `;

        tableList.appendChild(row);

    });

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

loadSettings();

render();