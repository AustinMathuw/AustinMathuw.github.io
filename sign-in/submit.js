$(function () {
    // when the form is submitted

    $('.form-signin').validator().on('submit', async function (e) {
        console.log(e.isDefaultPrevented());
        if (e.isDefaultPrevented()) {
          // handle the invalid form...
        } else {
            e.preventDefault();
            submit();
        }
        return false;
      })

    async function submit() {
        var url_string = window.location.href;
        var url = new URL(url_string);
        var type = url.searchParams.get("type");
        if(type == "alexa"){
            var key = url.searchParams.get("key");
            var state = url.searchParams.get("state");
            var name = url.searchParams.get("client_id");
            var response_type = url.searchParams.get("response_type");
            var redirectURI = url.searchParams.get("redirect_uri");
            console.log(key);
            console.log(state);
            console.log(name);
            console.log(response_type);
            console.log(redirectURI);

            const PUBG = new API(key);

            var playerName = document.getElementById('playerName').value;  
            var c = document.getElementById("country");
            var playerCountry = c.options[c.selectedIndex].value;

            var response = await PUBG.getPlayerInfo(playerName, playerCountry);
            console.log(response);



            if(!response.errors) {
                var playerData = response.data[0];
                console.log(playerData.id);
                var redirect_url =  url.searchParams.get("redirect_uri")+"#state="+state+"&access_token="+playerData.id+"&token_type=Bearer"; //playerData.id.replace("account.", "")
                console.log(redirect_url);
                window.location.replace(redirect_url);
            } else {
                console.log("error");
                var errorBox = document.getElementById('error');
                errorBox.style.display = "block";
                errorBox.innerText = "Error: " + response.errors[0].detail;
            }
        }
    }
});