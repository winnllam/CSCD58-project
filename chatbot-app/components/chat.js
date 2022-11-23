function sendMessage(){
    var text = document.getElementById("input").value;
    if (text != "") {
        document.getElementById("chat").innerHTML += '<div class="chat user-chat"><p>' + text + '</p></div>';
    }
}
