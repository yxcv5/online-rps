
// Initialize Firebase
  var config = {
    apiKey: "AIzaSyDNQ4tvRirAicC6qIcFHDAsopuwMmM8GHI",
    authDomain: "rps-test-e8dc1.firebaseapp.com",
    databaseURL: "https://rps-test-e8dc1.firebaseio.com",
    projectId: "rps-test-e8dc1",
    storageBucket: "rps-test-e8dc1.appspot.com",
    messagingSenderId: "640532163733"
  };
  firebase.initializeApp(config);

var database = firebase.database();
var numWins=0;
var numLosses = 0;
var playerList = [];
var isPlaying = false;
var promptDiv;
var subHead;
var playerId = 0;
var player;
var opponentId = 0;
var opponent;
var yourPick="";
var opponentPick="";
var round = 0;

var playersDataRef = database.ref("players");
var thisPlayerRef;
var options = ["Rock", "Paper", "Scissors"];
var choicesHtml="";
for (var i=0; i<options.length; i++) {
   choicesHtml += "<h3 class='choice' data-choice='" + options[i] + "'>" + options[i] + "</h3>";
}

var formHtml="<form class='form-inline text-center'>" + 
             "<input class='form-control' id='player-name' type='text' placeholder='Name'>" +
             "<button class='btn btn-default' id='play-button' type='submit'>Start</button></form>";

$(".game-entry").on("click", "#play-button", function(event) {

    event.preventDefault();
    player = $("#player-name").val().trim();	
    console.log(player, playerList.length);
  if(playerList.length < 2) {
    if(playerList.length===0) {       
        thisPlayerRef = playersDataRef.child("1");
       playerId = 1;
    }
    else if(playerList.length===1) {
       if(playerList[0] === 1) {
       	 thisPlayerRef = playersDataRef.child("2");
       	 playerId = 2;
       }
       else if(playerList[0] === 2) {
       	 thisPlayerRef = playersDataRef.child("1");
       	 playerId = 1;
       }
    }
    isPlaying = true;
    thisPlayerRef.set({"name": player, "wins": numWins, "losses": numLosses});
    thisPlayerRef.onDisconnect().remove();
    promptDiv = $("<h3 class='welcome-msg'>").text("Hi " + player + "! You are player " + playerId);
    console.log(promptDiv);
    $(".game-entry").empty();
    $(".game-entry").append(promptDiv);
    $("#head"+playerId).text(player);
    $("#score"+playerId).text("Wins: " + numWins + "   Losses: " + numLosses);
 }
});

playersDataRef.on("value", function(snapshot) {
    console.log(snapshot.key);
    console.log(snapshot.val());
    var length = playerList.length;
  playerList=[];
  snapshot.forEach(function(snap) {
    console.log(snap.key);
        console.log(snap.val());
        if(snap.key === "1") {
           playerList.push(1);
        }
        if(snap.key === "2") {
           playerList.push(2);
        }
    });
    console.log(playerList);
  if(length < playerList.length) { //just added player or at the page load when there are other players

    if(playerList.length===2 && isPlaying) {

       playersDataRef.once("value", function(snap) {
          if(playerId===1) {
            opponentId = 2;
            opponent = snap.child("2").child("name").val();
          }
          else if(playerId===2) {
            opponentId = 1;
            opponent = snap.child("1").child("name").val();
          }
       });

       if(playerId===1) {
          round=1;
          console.log(round);
          database.ref("/round").set(round);
       }

    }
    else if(playerList.length===2 && !isPlaying) {
       promptDiv = $("<h3 class='welcome-msg'>").text("The session is full!");
       $(".game-entry").empty();
       $(".game-entry").append(promptDiv);
       $("#head1").html("");
       $("#head2").html("");
    }
    else if(playerList.length===1 && !isPlaying) {
       var othersId = playerList[0];
       var othersName;
       var othersWins;
       var othersLosses;
       snapshot.forEach(function(snap) {
           console.log(snap.val());
           othersName = snap.val().name;
           othersWins = snap.val().wins;
           othersLosses = snap.val().losses;
       });
       console.log(othersName, othersWins, othersLosses);
       $("#head"+othersId).text(othersName);
       $("#score"+othersId).text("Wins: " + othersWins + "   Losses: " + othersLosses);
    }
  }
  else if(length > playerList.length) {  //a player disconnects while you watch or play
      if(playerList.length===1) {
        if(isPlaying) {
           round = 0;
           database.ref().child("round").set(round);
           $(".prompt-msg").text("Waiting for another player to join.");
           $("#head"+opponentId).text("Waiting for Player " + opponentId);
           $("#score"+opponentId).empty();
           $("#choices"+opponentId).empty();
           $("#choices"+playerId).empty();
           $("#chatBox").append("<p>" + opponent +" has disconnected.</p>");
        }
        else {
           $(".game-entry").empty();
           $(".game-entry").append(formHtml);
           var othersId = playerList[0];
           var othersName;
           var othersWins;
           var othersLosses;
           snapshot.forEach(function(snap) {
              othersName = snap.val().name;
              othersWins = snap.val().wins;
              othersLosses = snap.val().losses; 
           });
           $("#head"+othersId).text(othersName);
           $("#score"+othersId).text("Wins: " + othersWins + "   Losses: " + othersLosses);
           if(othersId===1)
              $("#head2").text("Waiting for Player 2");
           else if(othersId===2)
              $("#head1").text("Waiting for Player 1");
        }
      }
      else if(playerList.length===0) { // *will the on 'value' event be triggered when both players removed?*
         console.log("both guys quited");
         location.reload();
      }   
  }
  else if(length === 0 && playerList.length === 0) { //no players at the page load
    console.log("hit here first");
      database.ref("round").set(null); 
      database.ref("chat").set(null);
  }
}, function(errorObject) {
      console.log("Errors handled: " + errorObject.code);
});

database.ref("round").on("value", function(snapshot) {
   console.log("or here first");
   round = snapshot.val();
   console.log("round " + round);
   if(isPlaying && (round>0)) { //game in session
      console.log("new round " + round);
      console.log(promptDiv);
   	  $("#choices1").empty();
   	  $("#choices2").empty();
   	  $(".game-entry").empty();
   	  $(".game-entry").append(promptDiv);
   	  $("#result").empty();

      var player1Name;
      var player1Wins;
      var player1Losses;
      var player2Name;
      var player2Wins;
      var player2Losses;     
      playersDataRef.once("value", function(snap) {
          player1Name = snap.child("1").child("name").val();
          player1Wins = snap.child("1").child("wins").val();
          player1Losses = snap.child("1").child("losses").val();
       	  player2Name = snap.child("2").child("name").val();
          player2Wins = snap.child("2").child("wins").val();
          player2Losses = snap.child("2").child("losses").val();  
          console.log(player1Name, player1Wins);
      	  console.log(player2Name, player2Wins);  
      });
      console.log("whose turn?");
   	  if(playerId===1) {
          subHead = $("<h4 class='prompt-msg'>").text("It is your turn!");
          $("#head2").text(player2Name);
          $("#score2").text("Wins: " + player2Wins + "   Losses: " + player2Losses);
          $("#choices1").html(choicesHtml);
       }
       else if(playerId===2) {
       	  console.log("player 2 wait");
          subHead = $("<h4 class='prompt-msg'>").text("Waiting for " + player1Name + " to choose.");
          $("#head1").text(player1Name);
          $("#score1").text("Wins: " + player1Wins + "   Losses: " + player1Losses);
       }
       console.log(subHead);
       $(".game-entry").append(subHead);
   }
}, function(errorObject) {
      console.log("Errors handled: " + errorObject.code);
});


$(".game-section").on("click", ".choice", function() {
    var prevPick = yourPick;
    yourPick = $(this).attr("data-choice");
    if(prevPick===yourPick) {  //needs an extra step for the code to recognize this is a new pick.
      thisPlayerRef.child("choice").set(null); 
    }
    thisPlayerRef.child("choice").set(yourPick);
    $("#choices"+playerId).empty();
    $("#choices"+playerId).html("<p class='bigFont'>" + yourPick + "</p>");
    
    if(playerId===1) {
    	console.log("player 1 wait");
       $(".prompt-msg").text("Waiting for " + opponent + " to choose.");
    }
});


playersDataRef.child("1").child("choice").on("value", function(snap) {
    if(playerId === 2 && snap.val()) {
    	 console.log("player 2 pick");
       opponentPick = snap.val();
       $(".prompt-msg").text("It is your turn!");
       $("#choices2").html(choicesHtml);
    }
}, function(errorObject) {
      console.log("Errors handled: " + errorObject.code);
});

playersDataRef.child("2").child("choice").on("value", function(snap) {
  if(isPlaying && snap.val()) {
    console.log(snap.val());
    if(playerId === 1) {
       opponentPick = snap.val();
    }
    console.log("after player2 pick");
    console.log(yourPick, opponentPick);
    var result = rpsResult(yourPick, opponentPick); 
    if(result === "win") {
    	 console.log("player win?");
       $("#result").html("<p class='bigFont'>" + player + " Wins!</p>");
       playersDataRef.child(""+playerId).update({"wins": numWins+1});
       thisPlayerRef.child("wins").once("value", function(childsnap) {
           numWins = childsnap.val();
           console.log(numWins);
       });
    }
    else if(result === "lose") {
    	 console.log("player lose?");
       $("#result").html("<p class='bigFont'>" + opponent + " Wins!</p>");
       playersDataRef.child(""+playerId).update({"losses": numLosses+1});
       thisPlayerRef.child("losses").once("value", function(childsnap) {
           numLosses = childsnap.val();
           console.log(numLosses);
       });
    }
    else if(result === "tie") {
    	 console.log("a tie?");
       $("#result").html("<p class='bigFont'>Tie Game!</p>");
    }
    var herWins;
    var herLosses;
    playersDataRef.child(""+opponentId).child("wins").once("value", function(childsnap) {
           herWins = childsnap.val();
    });
    playersDataRef.child(""+opponentId).child("losses").once("value", function(childsnap) {
           herLosses = childsnap.val();
    });
    $("#choices"+opponentId).html("<p class='bigFont'>" + opponentPick + "</p>");
    $("#score"+opponentId).text("Wins: " + herWins + "   Losses: " + herLosses);
    $("#score"+playerId).text("Wins: " + numWins + "   Losses: " + numLosses);
    if(playerId === 1) 
    	 setTimeout(updateRound, 2000);
  }
}, function(errorObject) {
      console.log("Errors handled: " + errorObject.code);
});

$("#send").on("click", function(event) {
    event.preventDefault();
    if(isPlaying) {
       var msg = $("#message").val().trim();
       var str = " " + player +": " + msg;
       $("#chatBox").append("<p>" + player +": " + msg + "</p>");
       database.ref().child("chat").push().set({"name": player, "message": msg});
       $("#message").val("");
    }
});

database.ref("chat").on("child_added", function(snap) {
  if(isPlaying) {
     var who = snap.val().name;
     if(who === opponent)
      $("#chatBox").append("<p>" + opponent +": " + snap.val().message + "</p>");
  }
}, function(errorObject) {
      console.log("Errors handled: " + errorObject.code);
});

function rpsResult(yourpick, opponentpick) {
    
	if ((yourpick === "Rock") || (yourpick === "Paper") || (yourpick === "Scissors")) {
        if ((yourpick === "Rock") && (opponentpick === "Scissors")) {
          return "win";
        } else if ((yourpick === "Rock") && (opponentpick === "Paper")) {
          return "lose";
        } else if ((yourpick === "Scissors") && (opponentpick === "Rock")) {
          return "lose";
        } else if ((yourpick === "Scissors") && (opponentpick === "Paper")) {
          return "win";
        } else if ((yourpick === "Paper") && (opponentpick === "Rock")) {
          return "win";
        } else if ((yourpick === "Paper") && (opponentpick === "Scissors")) {
          return "lose";
        } else if (yourpick === opponentpick) {
          return "tie";
        }
    }
}

function updateRound() {
	database.ref().child("round").once("value", function(snap) {
    round = snap.val() + 1;
  });
  database.ref().child("round").set(round);
  console.log(round);
}

