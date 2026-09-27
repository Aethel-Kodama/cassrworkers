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
    let dept;
    let currenttime;
    let delayMs;
    let dh;
    let dm;
    let ds;
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
    $(".次駅停車時分").css("left","130px")
    $(".次駅停車秒").css("left","183px")
    $(".発車まで").css("display","inline")
    $(".次駅詳細 .停通").css("display","none")
}
function unview(){
    $(".次駅停車時分").css("left","0px")
    $(".次駅停車秒").css("left","53px")
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
function terminating(){ //終点到着時に次駅の表示を消す
    if (nnnnpreview) {
        if (nowsta + 3 > terminatesta && direction == 1 || nowsta - 3 < terminatesta && direction == -1) {
           nnnnpreview.style.opacity = 0;
        } else {
            nnnnpreview.style.opacity = 1;
        }
    }
    if (nnnsta&&nnnpreview) {
        if (nowsta + 2 > terminatesta && direction == 1 || nowsta - 2 < terminatesta && direction == -1) {
            nnnsta.style.opacity = 0;
            nnnpreview.style.opacity = 0;
        } else {
            nnnsta.style.opacity = 1;
            nnnpreview.style.opacity = 1;
        }
    }
    if (nnsta&&nnpreview) {
        if (nowsta + 1 > terminatesta && direction == 1 || nowsta - 1 < terminatesta && direction == -1) {
            nnsta.style.opacity = 0;
            nnpreview.style.opacity = 0;
        } else {
            nnsta.style.opacity = 1;
            nnpreview.style.opacity = 1;
        }
    }
}

terminating();

function stop(){
    if (nowsta!=startingsta){
    currenttime.setSeconds(currenttime.getSeconds()+stoptime[nowsta-1*direction])
    }
    $(".次駅停車時分").text(String(currenttime.getHours()).padStart(2,"\u2007")+":"+String(currenttime.getMinutes()).padStart(2, "0"))
    $(".次駅停車秒").text(String(currenttime.getSeconds()).padStart(2, "0")+"\u2007発")
}
function mstop(){
    if (nowsta!=startingsta){
    currenttime.setSeconds(currenttime.getSeconds()-stoptime[nowsta-1*direction])
    }
    $(".次駅停車時分").text(String(currenttime.getHours()).padStart(2,"\u2007")+":"+String(currenttime.getMinutes()).padStart(2, "0"))
    $(".次駅停車秒").text(String(currenttime.getSeconds()).padStart(2, "0")+"\u2007着")
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
    departureTime2.value = formatTime(nextDeparture);
}
const back = document.querySelector(".戻る");
const next = document.querySelector(".停車");
const terminate = document.querySelector(".行先 strong");
if(terminate){terminate.textContent=stalist[terminatesta]}
nstaname();
if (back) { // 戻るボタンを押したときの挙動まとめ
    back.addEventListener("click", function(){
        if (next.textContent!="次へ"){
            if (nowsta > startingsta && direction==1 || nowsta < startingsta && direction == -1) {
                nowsta = nowsta - 1 * direction;
                nnowsta = nnowsta - 1*direction;
                staname();
                nstaname();
                terminating();                
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
                $(".次駅詳細 *").not(".発車まで").fadeIn()
                $(".次々駅詳細 *").fadeIn()
                $(".次々々駅詳細 *").fadeIn()
                unview();
                terminating();
                next.textContent="停車";
                staname();
                $(".プレビュー,.標準時分")
                    .animate({top:"+=69px"},700)
                    .animate({top:"-=69px"},0)
                    .promise()
                    .done(function(){
                    nnowsta = nnowsta + 1 * direction;
                    nstaname();
                    })
                $("header .行先 strong").text(stalist[terminatesta])       
                eachDate();        
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
    $(".次駅停車秒").text(String(currenttime.getSeconds()).padStart(2, "0")+"\u2007着")
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
    $(".次駅停車秒").text(String(currenttime.getSeconds()).padStart(2, "0"))
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