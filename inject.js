console.log("hello this is inject.js");
console.log("?")
const YOUTUBE_URL = "https://www.youtube.com/watch?v=";
const YOUTUBE_KEY = "AIzaSyB3H6Fl0_1fx5DCGMJRBlubT4tSQgnFlOY";

const GOOGLE_API = "https://www.googleapis.com/youtube/v3/captions"
const GOOGLE_VIDEO_API = "https://video.google.com/timedtext";
const MS_URL = "https://api.microsofttranslator.com/V2/Http.svc";
const MS_KEY = "a8255cb54abf4b85b6355ce1dfae1ccb";
const MS_TOKEN_URL = "https://api.cognitive.microsoft.com/sts/v1.0/issueToken";



var ytplayer = document.getElementsByClassName("video-stream html5-main-video")[0];
var ytplayerTime = setInterval(function () {
    ytplayer = document.getElementsByClassName("video-stream html5-main-video")[0];
    ytplayerTime = ytplayer.currentTime;
}, 500);

chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        // console.log(request);
        var { videoId, lang, token } = request;
        // console.log(videoId)
        document.getElementsByClassName("video-stream html5-main-video")[0].volume = 0.2;
        getLang();
        // $('.title').html(request.videoID);

        function getLang() {
            var script;
            $.ajax({
                url: GOOGLE_API,
                data: {
                    part: "snippet",
                    videoId: videoId,
                    key: YOUTUBE_KEY
                },
                success: (result) => {
                    if (result.items.length == 1) {
                        languageFrom = result.items[0].snippet.language;
                    } else {
                        languageFrom = 'en'
                    }
                    // console.log("success in getting language");
                    script = loadScript(videoId, languageFrom);

                }
            });
        }

        function loadScript(videoId, languageFrom) {
            let script;
            $.ajax({
                url: GOOGLE_VIDEO_API,
                data: {
                    v: videoId,
                    lang: languageFrom,
                },
                success: (result) => {
                    script = result.getElementsByTagName("text"); //array of scripts
                    ytplayer.currentTime = 0;
                    script = processScript(script);
                    console.log(script)
                    for(let i = 0; i < script.length; i++){
                        // setTimeout(()=>{
                        //     translate(script[i].script, i);
                        // }, script[i].startTime*1000);
                        translate(script[i].script, i);
                    }
                }
            })
        }

        function processScript(originalScripts){
            let copiedScripts = [];

            //hard copy
            for(let i = 0; i < originalScripts.length; i++){
                let temp = {};
                temp.startTime = +originalScripts[i].getAttribute("start");
                temp.script = "" + originalScripts[i].innerHTML.replace(/\n/g," ").replace(/&amp;#39;/g, "\'").replace(/&amp;quot;/g, "\"");
                copiedScripts.push(temp);
            }

            for(let i = 0; i < copiedScripts.length; i++){
                if(isStartingWithLowerCase(copiedScripts[i].script)){
                    copiedScripts[i-1].script = (copiedScripts[i-1].script + " " + copiedScripts[i].script);
                    copiedScripts.splice(i, 1);
                    i--;
                }
            }
            return copiedScripts;
        }

        function isStartingWithLowerCase(myString) { 
            return (myString.charAt(0) == myString.charAt(0).toLowerCase()); 
        } 

        // 04/20/2018 5:24AM 현민: instead of using htmlDecode, used 'replace' to replace single and double quotes.
        // function htmlDecode(input) {
        //     var e = document.createElement('div');
        //     e.innerHTML = input;
        //     // console.log(e.childNodes[0].nodeValue);
        //     return e.childNodes.length === 0 ? "" : e.childNodes[0].nodeValue;
        // }

        function translate(script, i) {
            // script = htmlDecode(script);
            $.ajax({
                url: MS_URL + "/Translate",
                data: {
                    appid: "Bearer " + token,
                    to: lang,
                    text: script
                },
                success: (result) => {
                    console.log(script);
                    var translatedScript = (result.getElementsByTagName('string')[0].innerHTML);
                    console.log(translatedScript);
                    voiceOver(translatedScript, i);
                    console.log(document.getElementById("voice0").duration);


                }
            })
        }

        function voiceOver(translatedScript, i) {
            var VidSource = MS_URL + "/Speak?appid=Bearer " + token + "&format=audio/mp3&options=male&language=" + lang + "&text=" + translatedScript;

            // if ($("#video-source") != null) {
            //     $("#video-source").remove();
            // }
            // var aud = $("<audio>");
            // $(aud).attr({ "id": `voice${i}`, });
            // var vidSrc = $("<source>");
            // vidSrc.attr({
            //     "id": "video-source",
            //     "type": "audio/mpeg",
            //     "src": VidSource
            // });
            

            // aud.append(vidSrc);
            // $('body').append(aud);


            var aud = document.createElement("audio");
            aud.setAttribute("id", "voice"+i);
            var vidSrc = document.createElement("source");
            vidSrc.setAttribute("id", "video-source");
            vidSrc.setAttribute("type", "audio/mpeg");
            vidSrc.setAttribute("src", VidSource);            

            aud.append(vidSrc);
            // aud.onplaying = function() {
            //     console.log("The video is now playing");
            // };
            aud.onended = function() {
                console.log("AUDIO END");
                var ytplayer = document.getElementById("movie_player");
                console.log("current" + ytplayer.getCurrentTime());
            }

            document.getElementsByTagName('body')[0].append(aud);
        }

        
    }
)



