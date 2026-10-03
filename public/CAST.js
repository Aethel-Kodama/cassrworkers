if (location.hostname !== "127.0.0.1" && location.hostname !== "localhost") {
    fetch("/me")
      .then((res) => {
        if (!res.ok) throw new Error("未ログイン");
        return res.json();
      })
      .catch(() => {
        window.location.href = "/login";
      });
}
 
//定義
    
    let direction = -1; //SSR -> INZ:1,INZ -> SSR:-1
    let terminatesta = 0;
    let startingsta = 2;
    let nowsta = startingsta;
    let nnowsta = nowsta;
    const kudaritakemin = [1,1,1,1,1,1,1,1,2,8,8,8]//index0->SSR-NSR
    const kudaritakesec = [45,55,55,55,10,15,25,55,10,10,10,10]
    const noboritakemin = [2 ,1 ,2 ,1 ,1 ,1 ,1 ,2,1 ,3 ,3 ,3]
    const noboritakesec = [15,25,10,55,10,10,10,0,40,34,34,34]
    let stoptime=[15,30,15,30,15, 15,30,15,30,15 ,15,30]//index0 = NSR,index13 = INZonsen;
    const localstopsta = [0,1,2,3,4,5,6,7,8,9,10,11,12];
    const JUNstopsta =   [0,  2,  4,5,  7,8,9,10,11,12];
    const expressstopsta=[0,  2,  4,    7,  9,10,11,12];
    const Rapexpstopsta =[0,      4,    7,  9,      12];
    const Limexpstopsta =[0,      4,        9,      12];
    const rapidstopsta = [0,  2,  4,    7,8,9,10,11,12];
    let soondep = new Audio("soondep.m4a");
    let type;
    let dept;
    let currenttime;
    let delayMs;
    let dh;
    let dm;
    let ds;
    let animating = false;
        let isplayed = false;
soondep.preload = "auto";

let audioUnlocked = false;
function unlockAudio() {
  if (audioUnlocked) return;
  soondep.muted = true;
  soondep.play().then(() => {
    soondep.pause();
    soondep.currentTime = 0;
    soondep.muted = false;
    audioUnlocked = true;
    ["click", "touchend", "pointerup"].forEach(ev =>
      document.removeEventListener(ev, unlockAudio, true)
    );
  }).catch(e => {
    soondep.muted = false;
    console.error("unlock失敗", e); // 失敗したら次のタップで再挑戦
  });
}
["click", "touchend", "pointerup"].forEach(ev =>
  document.addEventListener(ev, unlockAudio, true)
);

function delay(dat){
    const delays = document.querySelector(".発車まで");if (!delays) return;
    if (currenttime){
        if(currenttime>dat){
            delayMs = currenttime-dat;
            dh = Math.floor(delayMs / (60*60*1000));
            dm = Math.floor((delayMs % (60*60*1000)) / 60000);
            ds = Math.floor(((delayMs/1000)%60))+1
            if(dh!=0){
                delays.textContent="発車まで\u2007"+dh+" 時間 "+String(dm).padStart(2,"0")+" 分 "+String(ds).padStart(2,"0")+" 秒"
            }
            else if(dm!=0){
                delays.textContent="発車まで\u2007"+String(dm).padStart(2,"0")+" 分 "+String(ds).padStart(2,"0")+" 秒";
            }
            else if(ds!=0){
                delays.textContent="発車まで\u2007"+String(ds).padStart(2,"0")+" 秒";
            }
            else{
                delays.textContent="定刻"
            }
            if (Number(ds)===30&&isplayed===false){
                isplayed=true;
                soondep.currentTime=0;
                soondep.play(); 
            }
            if (Number(ds)!==30&&isplayed===true){
                isplayed=false;
            }
        }
        else{
            delayMs = (currenttime-dat)*-1;
            dh = Math.floor(delayMs / (60*60*1000));
            dm = Math.floor((delayMs % (60*60*1000)) / 60000);
            ds = (Math.floor((((delayMs/1000)%60)/15)) * 15);
            if(dh!=0){
                delays.textContent=dh+" 時間 "+String(dm).padStart(2,"0")+" 分 "+String(ds).padStart(2,"0")+" 秒延";
            }
            else if(dm!=0){
                delays.textContent=String(dm).padStart(2,"0")+" 分 "+String(ds).padStart(2,"0")+" 秒延";
            }
            else if(ds!=0){
                delays.textContent=String(ds).padStart(2,"0")+" 秒延";
            }
            else{
                delays.textContent="定刻"
            }
        }        
    }
}

function view(){//停車中の表示
    $(".次駅発着時刻").addClass("停車中");
    $(".発車まで").css("display","inline")
    $(".次駅詳細 .停通").css("display","none")
}
function unview(){
    $(".次駅発着時刻").removeClass("停車中");
    $(".発車まで").css("display","none")
    $(".次駅詳細 .停通").css("display","inline")
}
function nowtime(){
    const date = new Date();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();
    const nowhours = document.querySelector(".時刻 h3");
    if (nowhours) {
        nowhours.textContent = String(hours).padStart(2, "0") + ":" + String(minutes).padStart(2, "0");
    }
    const nowseconds = document.querySelector(".時刻 p");
    if (nowseconds) {
        nowseconds.textContent = String(seconds).padStart(2, "0");
    }
    delay(date);
}
//$(function(){$(".次駅 .sec").css("opacity","0")})
//alert("幅:"+window.innerWidth+"px 高さ:"+window.innerHeight+"px")
setInterval(nowtime,200);
nowtime();
const stalist = ["四城市","西四城","三城台二丁目","須津岡","府","狩川橋","比良新町","片島","鐘山公園","稲生沢","双葉茶屋","稲生沢温泉","笠浜"];
 
 
 
const nnnsta = document.querySelector(".次々々駅詳細")
const nnsta = document.querySelector(".次々駅詳細")
function staname(){
    const nownextsta = document.querySelector(".次駅詳細 .駅名");
    if (nownextsta) nownextsta.textContent = stalist[nowsta];
 
    const nownextnextsta = document.querySelector(".次々駅詳細 .駅名");
    if (nownextnextsta) nownextnextsta.textContent = stalist[nowsta + 1 * direction];
 
    const nownextnextnextsta = document.querySelector(".次々々駅詳細 .駅名");
    if (nownextnextnextsta) nownextnextnextsta.textContent = stalist[nowsta + 2 * direction];
}
function nstaname(){
    const preview0 = document.querySelector(".前駅 .プレビュー");
    if (preview0) preview0.textContent = stalist[nnowsta - 1 * direction];
 
    const preview1 = document.querySelector(".次駅 .プレビュー");
    if (preview1) preview1.textContent = stalist[nnowsta];
 
    const preview2 = document.querySelector(".次々駅 .プレビュー");
    if (preview2) preview2.textContent = stalist[nnowsta + 1 * direction];
 
    const preview3 = document.querySelector(".次々々駅 .プレビュー");
    if (preview3) preview3.textContent = stalist[nnowsta + 2 * direction];
 
    const preview4 = document.querySelector(".次々々々駅 .プレビュー");
    if (preview4) preview4.textContent = stalist[nnowsta + 3 * direction];
 
    $(function(){
        if (direction===-1){//上り
        $(".前駅 .min").text(noboritakemin[nowsta+1]); $(".前駅 .sec").text(String(noboritakesec[nowsta+1] ?? "").padStart(2,"0"));
 
        $(".次駅 .min").text(noboritakemin[nowsta]); $(".次駅 .sec").text(String(noboritakesec[nowsta] ?? "").padStart(2,"0"));
 
        $(".次々駅 .min").text(noboritakemin[nowsta-1]); $(".次々駅 .sec").text(String(noboritakesec[nowsta-1] ?? "").padStart(2,"0"));
 
        $(".次々々駅 .min").text(noboritakemin[nowsta-2]); $(".次々々駅 .sec").text(String(noboritakesec[nowsta-2] ?? "").padStart(2,"0"));
 
        $(".次々々々駅 .min").text(noboritakemin[nowsta-3]); $(".次々々々駅 .sec").text(String(noboritakesec[nowsta-3] ?? "").padStart(2,"0"));
        }
        else if (direction===1){
            $(".前駅 .min").text(kudaritakemin[nowsta-2]); $(".前駅 .sec").text(String(kudaritakesec[nowsta-2] ?? "").padStart(2,"0"));
 
            $(".次駅 .min").text(kudaritakemin[nowsta-1]); $(".次駅 .sec").text(String(kudaritakesec[nowsta-1] ?? "").padStart(2,"0"));
 
            $(".次々駅 .min").text(kudaritakemin[nowsta]); $(".次々駅 .sec").text(String(kudaritakesec[nowsta] ?? "").padStart(2,"0"));
 
            $(".次々々駅 .min").text(kudaritakemin[nowsta+1]); $(".次々々駅 .sec").text(String(kudaritakesec[nowsta+1] ?? "").padStart(2,"0"));
 
            $(".次々々々駅 .min").text(kudaritakemin[nowsta+2]); $(".次々々々駅 .sec").text(String(kudaritakesec[nowsta+2] ?? "").padStart(2,"0"));
        }
    })
}
 
staname();
const nnnnpreview = document.querySelector(".次々々々駅");
const nnnpreview = document.querySelector(".次々々駅");
const nnpreview = document.querySelector(".次々駅");
function terminatingDetail(){ // 次駅詳細系(staname()と同時=即時)
    if (nnnsta) {
        nnnsta.style.opacity =
            ((nowsta + 2 > terminatesta && direction == 1) ||
             (nowsta - 2 < terminatesta && direction == -1)) ? 0 : 1;
    }
    if (nnsta) {
        nnsta.style.opacity =
            ((nowsta + 1 > terminatesta && direction == 1) ||
             (nowsta - 1 < terminatesta && direction == -1)) ? 0 : 1;
    }
}
function terminatingPreview(){ // プレビュー系(nstaname()と同時=スクロール後)
    if (nnnnpreview) {
        nnnnpreview.style.opacity =
            ((nowsta + 3 > terminatesta && direction == 1) ||
             (nowsta - 3 < terminatesta && direction == -1)) ? 0 : 1;
    }
    if (nnnpreview) {
        nnnpreview.style.opacity =
            ((nowsta + 2 > terminatesta && direction == 1) ||
             (nowsta - 2 < terminatesta && direction == -1)) ? 0 : 1;
    }
    if (nnpreview) {
        nnpreview.style.opacity =
            ((nowsta + 1 > terminatesta && direction == 1) ||
             (nowsta - 1 < terminatesta && direction == -1)) ? 0 : 1;
    }
}
function terminating(){ // 既存の呼び出し箇所(同期する場所)はこのまま両方まとめて呼べばOK
    terminatingDetail();
    terminatingPreview();
}
 
terminating();
 
function stop(){
    if (nowsta!=startingsta){
    currenttime.setSeconds(currenttime.getSeconds()+stoptime[nowsta-1*direction])
    }
    $(".次駅停車時分").text(String(currenttime.getHours()).padStart(2,"\u2007")+":"+String(currenttime.getMinutes()).padStart(2, "0"))
    if(pass===false){
        $(".次駅停車秒").text(String(currenttime.getSeconds()).padStart(2, "0")+"\u2007発")
    }
    else if(pass===true){
        $(".次駅停車秒").text(String(currenttime.getSeconds()).padStart(2, "0")+"\u2007通")
    }
}
function mstop(){
    if (nowsta!=startingsta){
    currenttime.setSeconds(currenttime.getSeconds()-stoptime[nowsta-1*direction])
    }
    $(".次駅停車時分").text(String(currenttime.getHours()).padStart(2,"\u2007")+":"+String(currenttime.getMinutes()).padStart(2, "0"))
    if(pass===false){
        $(".次駅停車秒").text(String(currenttime.getSeconds()).padStart(2, "0")+"\u2007着")
    }
    else if(pass===true){
        $(".次駅停車秒").text(String(currenttime.getSeconds()).padStart(2, "0")+"\u2007通")
    }
}
function formatTime(date){
    return [
        String(date.getHours()).padStart(2, "0"),
        String(date.getMinutes()).padStart(2, "0"),
        String(date.getSeconds()).padStart(2, "0")
    ].join(":");
}
function setNextDepartureTime(){
    const departureTime2 = document.getElementById("departureTime");
    if (!departureTime2 || departureTime2.value.trim() === "11:45:14") {
        return;
    }
 
    const nextDeparture = currenttime
        ? new Date(currenttime.getTime() + 120000)
        : new Date(Date.now() + 120000);
    let nextDepartureH = String(nextDeparture.getHours()).padStart(2,"0");
    let nextDepartureM = String(nextDeparture.getMinutes()).padStart(2,"0");
    let nextDepartureS = String(nextDeparture.getSeconds()).padStart(2,"0");
    setDepartureTimeWheel(nextDepartureH+":"+nextDepartureM+":"+nextDepartureS)
}
const stoporpass = document.querySelector(".次駅詳細 .停通");
const stoporpass2 = document.querySelector(".次々駅詳細 .停通");
const stoporpass3 = document.querySelector(".次々々駅詳細 .停通");
let pass = true;
function stoporpasses(type,nowsta){
    if (type === "快速" && !(rapidstopsta.includes(nowsta))||type === "準急" && !(JUNstopsta.includes(nowsta))||type === "急行" && !(expressstopsta.includes(nowsta))||type === "快急" && !(Rapexpstopsta.includes(nowsta))||type === "特急" && !(Limexpstopsta.includes(nowsta))){
        stoporpass.src = 'passsign.png';
        pass=true;
    }
    else{
        stoporpass.src = 'stopsign.png';
        pass=false;
    }
    if (type === "快速" && !(rapidstopsta.includes(nowsta+1*direction))||type === "準急" && !(JUNstopsta.includes(nowsta+1*direction))||type === "急行" && !(expressstopsta.includes(nowsta+1*direction))||type === "快急" && !(Rapexpstopsta.includes(nowsta+1*direction))||type === "特急" && !(Limexpstopsta.includes(nowsta+1*direction))){
        stoporpass2.src = 'passsign.png';   
    }
    else{
        stoporpass2.src = 'stopsign.png';
    } 
    if (type === "快速" && !(rapidstopsta.includes(nowsta+2*direction))||type === "準急" && !(JUNstopsta.includes(nowsta+2*direction))||type === "急行" && !(expressstopsta.includes(nowsta+2*direction))||type === "快急" && !(Rapexpstopsta.includes(nowsta+2*direction))||type === "特急" && !(Limexpstopsta.includes(nowsta+2*direction))){
        stoporpass3.src = 'passsign.png';
    }
    else{
        stoporpass3.src = 'stopsign.png';
    }
}
const back = document.querySelector(".戻る");
const next = document.querySelector(".停車");
const terminate = document.querySelector(".行先 strong");
if(terminate){terminate.textContent=stalist[terminatesta]}
nstaname();
if (back) { // 戻るボタンを押したときの挙動まとめ
    back.addEventListener("click", function(){
        if (animating) return;
        if (next.textContent!="次へ"){
            if (nowsta > startingsta && direction==1 || nowsta < startingsta && direction == -1) {
                
                nowsta = nowsta - 1 * direction;
                nnowsta = nnowsta - 1*direction;
                terminating();
                staname();
                nstaname();
                                
                meachDate();
            }
            if (next.textContent=="停車")
                next.textContent="次へ";
                
        }
        else if (next.textContent=="次へ"){next.textContent="停車";
            mstop();
            unview();
        }
        
    });
}
 
if (next) { //進むボタンを押したときの挙動まとめ
    next.addEventListener("click", function(){
        if (animating) return;
        if (nowsta == terminatesta&&next.textContent=="停車"){
            setNextDepartureTime();
            updateArrival();
            $("#inputPanel").show();
            $("#startingstation").val(nowsta);
            
        }
        if (nowsta != terminatesta) {
            if (next.textContent === "次へ"){
                
                $(".次駅詳細 *").hide()
                
                $(".次々駅詳細 *").hide()
                
                $(".次々々駅詳細 *").hide()
                nowsta=nowsta+1*direction;
                stoporpasses(type,nowsta);
                $(".次駅詳細 *").not(".発車まで").fadeIn()
                $(".次々駅詳細 *").fadeIn()
                $(".次々々駅詳細 *").fadeIn()
                if (pass === false) {
                    unview();
                    next.textContent="停車";
                }
                terminatingDetail();
                staname();
                animating = true;
                $(".プレビュー,.標準時分")
                    .animate({top:"+=69px"},700)
                    .animate({top:"-=69px"},0)
                    .promise()
                    .done(function(){
                        animating = false;
                        nnowsta = nnowsta + 1 * direction;
                    nstaname();
                    terminatingPreview();
                    })
                $("header .行先 strong").text(stalist[terminatesta])       
                eachDate();
                if (pass === true) {stop()};        
            }
            else {
                next.textContent = "次へ";
                stop();
                view();
            };
        };
    });
};
const trainCount = document.querySelector(".両数");
if (trainCount) trainCount.textContent = "２";
function updateRestriction(){
  const restriction = document.querySelector(".制限");
  if (restriction&&startingsta<6&&6<=terminatesta&&direction==1) {
      restriction.innerHTML = stalist[startingsta].slice(0,2)+"ー比良&nbsp;<strong>120</strong> km/h<br>比良ー"+stalist[terminatesta].slice(0,2)+"&nbsp;<strong>105</strong> km/h";
  }
  else if(restriction&&direction==1&&startingsta>=6){
      restriction.innerHTML = stalist[startingsta].slice(0,2)+"ー"+stalist[terminatesta].slice(0,2)+"&nbsp;<strong>105</strong> km/h";
  }
  else if(restriction&&direction==1&&terminatesta<=6)
  {   restriction.innerHTML = stalist[startingsta].slice(0,2)+"ー"+stalist[terminatesta].slice(0,2)+"&nbsp;<strong>120</strong> km/h"}
  else if(restriction&&terminatesta<=6&&6<startingsta&&direction==-1){
      restriction.innerHTML = stalist[startingsta].slice(0,2)+"ー比良&nbsp;<strong>105</strong> km/h<br>比良ー"+stalist[terminatesta].slice(0,2)+"&nbsp;<strong>120</strong> km/h";
  }
  else if(restriction&&terminatesta>6&&direction==-1){
      restriction.innerHTML = stalist[startingsta].slice(0,2)+"ー"+stalist[terminatesta].slice(0,2)+"&nbsp;<strong>105</strong> km/h";
  }
  else if(restriction&&startingsta<=6&&direction==-1){
      restriction.innerHTML = stalist[startingsta].slice(0,2)+"ー"+stalist[terminatesta].slice(0,2)+"&nbsp;<strong>120</strong> km/h"
  }}
updateRestriction();
function startDate(deptime){//Date型に変換
    let [h, m, s] = (deptime).split(':')
    if (s === undefined) s = '00'
    let starttime = new Date();
    starttime.setHours(h,m,s,0)
    return starttime;
}
function eachDate(){
    
    if (direction===-1&&startingsta!=nowsta){//上り
        currenttime.setSeconds(currenttime.getSeconds()+noboritakesec[nowsta])
        currenttime.setMinutes(currenttime.getMinutes()+noboritakemin[nowsta])
    }
    else if (direction===1&&startingsta!=nowsta){//下り
        currenttime.setSeconds(currenttime.getSeconds()+kudaritakesec[nowsta-1])
        currenttime.setMinutes(currenttime.getMinutes()+kudaritakemin[nowsta-1])
    }
    $(".次駅停車時分").text(String(currenttime.getHours()).padStart(2,"\u2007")+":"+String(currenttime.getMinutes()).padStart(2, "0"))
    if(pass===false){
        $(".次駅停車秒").text(String(currenttime.getSeconds()).padStart(2, "0")+"\u2007着")
    }
    else if(pass===true){
        $(".次駅停車秒").text(String(currenttime.getSeconds()).padStart(2, "0")+"\u2007通")
    }
}
function meachDate(){
    if (direction==-1){//上り
        currenttime.setSeconds(currenttime.getSeconds()-noboritakesec[nowsta-1])
        currenttime.setMinutes(currenttime.getMinutes()-noboritakemin[nowsta-1])
    }
    else if (direction==1){//下り
        currenttime.setSeconds(currenttime.getSeconds()-kudaritakesec[nowsta])
        currenttime.setMinutes(currenttime.getMinutes()-kudaritakemin[nowsta])
    }
    $(".次駅停車時分").text(String(currenttime.getHours()).padStart(2,"\u2007")+":"+String(currenttime.getMinutes()).padStart(2, "0"))
    if(pass===false){
        $(".次駅停車秒").text(String(currenttime.getSeconds()).padStart(2, "0"))
    }
    else if(pass===true){
        $(".次駅停車秒").text(String(currenttime.getSeconds()).padStart(2, "0")+"\u2007通")
    }
}
 
function terminatearr(starttime,startsta,termsta){
    let timearr = new Date;
    let timetoarrm = 0;
    let timetoarrs = 0;
    for (let i = 0; i < Math.abs(termsta-startsta); i++){
        if (startsta>termsta){//上り
            timetoarrm+=noboritakemin[startsta-i]
            timetoarrs+=noboritakesec[startsta-i]
            if (i!=0&&i!=Math.abs(termsta-startsta)){
                timetoarrs+=stoptime[startsta-1-i]}
            
        }
        if (startsta<termsta){//下り
            timetoarrm+=kudaritakemin[startsta+i]
            timetoarrs+=kudaritakesec[startsta+i]
            if (i!=0&&i!=Math.abs(termsta-startsta)){
                timetoarrs+=stoptime[startsta-1+i]}
        }
    }
    timetoarrm+=Math.floor(timetoarrs/60)
        timetoarrs=timetoarrs%60
        
        let $dep=startDate(starttime);
        $dep.setMinutes($dep.getMinutes()+timetoarrm)
        $dep.setSeconds($dep.getSeconds()+timetoarrs)
        let hh = String($dep.getHours()).padStart(2, "0");
        let mm = String($dep.getMinutes()).padStart(2, "0");
        let ss = String($dep.getSeconds()).padStart(2, "0");
        return hh+":"+mm+":"+ss;
}
function updateArrival(){
    $(".laststoparr").text(
        terminatearr($("#departureTime").val(), Number($("#startingstation").val()), Number($("#destination").val()))
    );
}
$("select,input").on("change", updateArrival);
$(function(){
   
  // 終点の選択肢リストz
  var staList = ["四城市","西四城","三城台二丁目","須津岡","府","狩川橋","比良新町","片島","鐘山公園","稲生沢","双葉茶屋","稲生沢温泉","笠浜"];
 
  // staListの内容をプルダウンに反映
  var $destination = $("#destination");
  $.each(staList, function(i, name){
    $destination.append($("<option>").val(stalist.indexOf(name)).text(name));
  });
  var $startingstation = $("#startingstation");
  $.each(staList, function(i, name){
    $startingstation.append($("<option>").val(stalist.indexOf(name)).text(name));
  });
  $("#startingstation").val(nowsta);
  // 列車情報を格納する変数
  var trainData = {
    type: "",
    destination: "",
    startingstation: "",
    departureTime: ""
  };
  updateArrival();
  $("#inputPanel").show();
  //$("#inputPanel").hide();
  $("#applyBtn").on("click", function(){
    if (!$("#departureTime").val().trim()) {
        setNextDepartureTime();
    }
    trainData.type            = $("#trainType").val();
    trainData.destination     = $("#destination").val();
    trainData.startingstation  = $("#startingstation").val();
    trainData.departureTime   = $("#departureTime").val();
    terminatesta = Number(trainData.destination);
    startingsta=Number(trainData.startingstation);
    type=trainData.type;
    dept=trainData.departureTime;
    nowsta = startingsta;
    currenttime=startDate(dept)
    if(terminatesta>nowsta){direction=1}
    else{direction=-1}
    updateRestriction();
    staname();
    nstaname();
    terminating();
    $(".行先 strong").text(stalist[terminatesta])
    $("#inputPanel").hide()
    eachDate();
    stop();
    view();
  });
});
    // #stage を画面サイズに合わせて拡大縮小して常に中央に表示する
        (function () {
            var DESIGN_W = 504;
            var DESIGN_H = 600;
            var stage = document.getElementById('stage');
 
            function fitStage() {
                var vw = window.innerWidth;
                var vh = window.innerHeight;
                // 画面に収まる最大倍率(はみ出さないよう小さい方に合わせる)
                var scale = Math.min(vw / DESIGN_W, vh / DESIGN_H);
                stage.style.transform = 'scale(' + scale + ')';
            }
 
            window.addEventListener('resize', fitStage);
            window.addEventListener('orientationchange', fitStage);
            fitStage();
        })();
 
        // 始発駅発車時刻:時・分・秒のホイールピッカー
        // (iOS SafariのネイティブUIには秒がないため、独自実装に置き換え)
        // ★ setDepartureTimeWheel は columns / ITEM_H / updateSelected / syncHiddenInput を
        //   使うので、このIIFEの"内側"に置くこと(外に出すとReferenceErrorになる)
        (function () {
            var ITEM_H = 32;   // 1項目の高さ(px)。CSS側の .time-wheel-item と合わせる
            var hiddenInput = document.getElementById('departureTime');
 
            var columns = [
                { el: document.getElementById('wheelHour'), max: 23, value: 11 },
                { el: document.getElementById('wheelMinute'), max: 59, value: 45 },
                { el: document.getElementById('wheelSecond'), max: 59, value: 14 }
            ];
            // 初期値(hidden inputのvalue="HH:MM:SS")を読み取る
            (function readInitialValue() {
                var parts = (hiddenInput.value || '').split(':');
                if (parts.length >= 3) {
                    columns[0].value = parseInt(parts[0], 10) || 0;
                    columns[1].value = parseInt(parts[1], 10) || 0;
                    columns[2].value = parseInt(parts[2], 10) || 0;
                }
            })();
 
            function pad2(n) {
                return (n < 10 ? '0' : '') + n;
            }
 
            function buildColumn(col) {
                var el = col.el;
                el.innerHTML = '';
                for (var i = 0; i <= col.max; i++) {
                    var item = document.createElement('div');
                    item.className = 'time-wheel-item';
                    item.textContent = pad2(i);
                    item.dataset.value = i;
                    el.appendChild(item);
                }
                el.scrollTop = col.value * ITEM_H;
                updateSelected(col);
            }
 
            function updateSelected(col) {
                var items = col.el.querySelectorAll('.time-wheel-item');
                for (var i = 0; i < items.length; i++) {
                    items[i].classList.toggle('selected', i === col.value);
                }
            }
 
            function syncHiddenInput() {
                var h = pad2(columns[0].value);
                var m = pad2(columns[1].value);
                var s = pad2(columns[2].value);
                hiddenInput.value = h + ':' + m + ':' + s;
                // jQueryやCAST.js側でchangeを監視している場合のために発火しておく
                hiddenInput.dispatchEvent(new Event('change', { bubbles: true }));
            }
 
            // "HH:MM:SS" 形式の文字列を受け取り、3つのホイールを丸ごとその時刻に
            // 設定し直す。行路が変わったときなど、何度でも呼び出してよい。
            // 例: setDepartureTimeWheel('09:03:40')
            function setDepartureTimeWheel(timeStr, opts) {
                var animate = !(opts && opts.animate === false);
                var parts = (timeStr || '').split(':');
                var h = Math.max(0, Math.min(23, parseInt(parts[0], 10) || 0));
                var m = Math.max(0, Math.min(59, parseInt(parts[1], 10) || 0));
                var s = Math.max(0, Math.min(59, parseInt(parts[2], 10) || 0));
                var values = [h, m, s];
 
                columns.forEach(function (col, i) {
                    col.value = values[i];
                    col.el.scrollTo({
                        top: col.value * ITEM_H,
                        behavior: animate ? 'smooth' : 'auto'
                    });
                    updateSelected(col);
                });
                syncHiddenInput();
            }
            // ここで公開しているので、CAST.js内の他の場所(setNextDepartureTimeなど)
            // からも window を介さず setDepartureTimeWheel(...) の形でそのまま呼べる
            window.setDepartureTimeWheel = setDepartureTimeWheel;
 
            columns.forEach(function (col) {
                buildColumn(col);
 
                var scrollTimer = null;
                col.el.addEventListener('scroll', function () {
                    if (scrollTimer) clearTimeout(scrollTimer);
                    scrollTimer = setTimeout(function () {
                        var index = Math.round(col.el.scrollTop / ITEM_H);
                        index = Math.max(0, Math.min(col.max, index));
                        // ぴったり揃うようスナップさせる
                        col.el.scrollTo({ top: index * ITEM_H, behavior: 'smooth' });
                        col.value = index;
                        updateSelected(col);
                        syncHiddenInput();
                    }, 120); // スクロールが止まってから確定
                }, { passive: true });
 
                // タップで直接その項目を選ぶことも可能に
                col.el.addEventListener('click', function (e) {
                    var item = e.target.closest('.time-wheel-item');
                    if (!item) return;
                    var index = parseInt(item.dataset.value, 10);
                    col.el.scrollTo({ top: index * ITEM_H, behavior: 'smooth' });
                });
            });
            syncHiddenInput();
        })();