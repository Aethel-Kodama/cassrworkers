fetch("/me")
  .then((res) => {
    if (!res.ok) throw new Error("未ログイン");
    return res.json();
  })
  .catch(() => {
    window.location.href = "/login";
  });
function nowtime(){
    const date = new Date();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();
    console.log(`現在の時刻は ${hours} 時 ${minutes} 分 ${seconds} 秒です。`);
    const nowhours = document.querySelector(".時刻 h3");
    nowhours.textContent=String(hours).padStart(2,"0")+":"+String(minutes).padStart(2,"0");
    const nowseconds = document.querySelector(".時刻 p");
    nowseconds.textContent=String(seconds).padStart(2,"0");
}

setInterval(nowtime,1000);
nowtime();
const stalist = ["四城市","西四城","三城台二丁目","須津岡","府","狩川橋","比良新町","片島","鐘山公園","稲生沢","双葉茶屋","稲生沢温泉","笠浜"];
let nowsta = 0;
function staname(){
let nownextsta = document.querySelector(".次駅詳細 .駅名");
nownextsta.textContent=stalist[nowsta]
let nownextnextsta = document.querySelector(".次々駅詳細 .駅名")
nownextnextsta.textContent=stalist[nowsta+1]
let nownextnextnextsta = document.querySelector(".次々々駅詳細 .駅名")
nownextnextnextsta.textContent=stalist[nowsta+2]
let preview0 = document.querySelector(".前駅 .プレビュー")
preview0.textContent = stalist[nowsta]
let preview1 = document.querySelector(".次駅 .プレビュー")
preview1.textContent = stalist[nowsta+1]
let preview2 = document.querySelector(".次々駅 .プレビュー")
preview2.textContent = stalist[nowsta+2]
let preview3 = document.querySelector(".次々々駅 .プレビュー")
preview3.textContent = stalist[nowsta+3]
let preview4 = document.querySelector(".次々々々駅 .プレビュー")
preview4.textContent = stalist[nowsta+4]
}
staname();
const back = document.querySelector(".戻る");
back.addEventListener("click",function(){
    nowsta = nowsta-1;
    staname();
})
const next = document.querySelector(".停車")
next.addEventListener("click",function(){
    nowsta = nowsta+1
    staname();
})