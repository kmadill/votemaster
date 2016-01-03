$(document).ready(function() {

    var ref = new Firebase("https://votingappkm.firebaseio.com/users/");
    var authData = ref.getAuth();
    var currentLocation = location.pathname.split("/")[location.pathname.split("/").length - 1];
    var numOptions = 2;
    /*
        console.log(authData);
        if (authData) {
            $("#messages").html('<div class="alert alert-success" role="alert">Logged in as: ' + authData.uid + '</div>');

            if (currentLocation === "" || currentLocation === "index.html") {
                window.location.href = "main.html";
            }
        } 

        */

    if (currentLocation === "main.html") {

        if (authData === null) {
            window.location.href = "index.html";
        }

        showUserInfo(authData);
        ref.child(authData.uid + "/polls").on('child_added', function(childSnapshot, preChildKey) {
            $("#existingPolls").append('<li class="list-group-item" id="li_' + childSnapshot.key() + '"><button id="btnDeletePoll" name="' + childSnapshot.key() + '" class="btn btn-danger btn-circle-micro deleteButton"><i class="fa fa-trash-o"></i></button> <a href="poll.html?id=' + childSnapshot.key() + '&user=' + authData.uid + '">' + childSnapshot.child("pollName").val() + '</a></li>');
        });

        ref.child(authData.uid + "/polls").on('child_removed', function(oldChildSnapshot) {
            var liToDelete = "#li_" + oldChildSnapshot.key();
            $(liToDelete).remove();
        });
    } else if (currentLocation === "poll.html") {

        if (authData) {
            showUserInfo(authData);
            $('#btnVoteAddOption').show();
            $('#btnSharePoll').show();
            $('#pollBreadcrump').show();
        }

        var pollID = getParameterByName('id');
        var userID = getParameterByName('user');

        //ref.child(authData.uid + "/polls/"+pollID).on('value', function(dataSnapshot) {
        ref.child(userID + "/polls/" + pollID).on('value', function(dataSnapshot) {

            var chartLabel = dataSnapshot.val().pollName;
            $("#pollContent").html('<b>' + chartLabel + '</b>');
            $("#votePollOptions").html("");

            var labels = [];
            var data = [];

            var i = 0;
            for (var prop in dataSnapshot.val().pollOptions) {
                labels.push(dataSnapshot.val().pollOptions[prop].optionName);
                data.push(dataSnapshot.val().pollOptions[prop].optionVotes);

                $("#votePollOptions").append('<div class="radio"><label><input type="radio" name="optionsRadios" id="optionsRadios1" value="' + Object.keys(dataSnapshot.val().pollOptions)[i] + '">' + dataSnapshot.val().pollOptions[prop].optionName + '</label></div>');
                i += 1;
            }
            drawBarChart(chartLabel, labels, data);

        });
    }


    $("#loginButton").click(function() {
        ref.authWithPassword({
            "email": $("#email").val(),
            "password": $("#password").val()
        }, function(error, authData) {
            if (error) {
                $("#messages").html('<div class="alert alert-danger" role="alert">Login failed: ' + error + '</div>');
            } else {
                login(authData);
            }
        });
    });

    $("#githubLoginButton").click(function() {
        ref.authWithOAuthPopup("github", function(error, authData) {
            if (error) {
                $("#messages").html('<div class="alert alert-danger" role="alert">Login failed: ' + error + '</div>');
            } else {
                login(authData);
            }
        });
    });

    $("#googleLoginButton").click(function() {
        ref.authWithOAuthPopup("google", function(error, authData) {
            if (error) {
                $("#messages").html('<div class="alert alert-danger" role="alert">Login failed: ' + error + '</div>');
            } else {
                login(authData);
            }
        });
    });

    $("#logoutButton").click(function() {
        ref.off('value');
        ref.unauth();
        authData = null;
        $("#messages").html('<div class="alert alert-info" role="alert">Log in above!</div>');
        window.location.href = "index.html";
    });

    $("#createUserButton").click(function() {
        ref.createUser({
            email: $("#email").val(),
            password: $("#password").val()
        }, function(error, userData) {
            if (error) {
                $("#messages").html('<div class="alert alert-danger" role="alert">Error creating user: ' + error + '</div>');
            } else {
                $("#messages").html('<div class="alert alert-success" role="alert">Successfully created user account with uid: ' + userData.uid + '<br><h3>Please <a href="index.html">login</h3></a>.</div>');
            }
        });
    });

    $("#btnAddPoll").click(function() {
        $("#panelAddPoll").slideToggle();
    });

    $("#btnCancelPoll").click(function() {
        $("#panelAddPoll").slideToggle();
    });

    $("#btnAddOption").click(function() {
        numOptions += 1;
        $("#moreOptions").append('<input type="text" class="form-control" id="pollOption' + numOptions + '">');
    });

    $("#btnRemoveOption").click(function() {
        if (numOptions > 2) {
            numOptions -= 1;
            $("#moreOptions").html("");
            for (i = 3; i <= numOptions; i++) {
                $("#moreOptions").append('<input type="text" class="form-control" id="pollOption' + numOptions + '">');
            }
        }
    });

    $("#btnSavePoll").click(function() {
        var authData = ref.getAuth();
        var optionArray = [];
        var optionObject = {
            pollName: $("#pollName").val()
        };

        var newMessageRef = ref.child(authData.uid).child("polls").push();
        newMessageRef.set(optionObject);

        for (i = 1; i <= numOptions; i++) {
            var pollOption = {
                optionName: $("#pollOption" + i).val(),
                optionVotes: 0
            };
            newMessageRef.child("pollOptions").push(pollOption);
        }

        $("#panelAddPoll").slideToggle();
    });

    $(document).on("click", ".deleteButton", function(e) {
        var recToDelete = e.currentTarget.name;
        ref.child(authData.uid + "/polls/" + recToDelete).remove();
    });

    $("#btnAddVote").click(function() {
        $("#panelVote").slideToggle();
    });

    $("#btnCancelVote").click(function() {
        $("#panelVote").slideToggle();
    });

    $("#btnSaveVote").click(function() {
        var authData = ref.getAuth();
        var voteOptionID = $('input[name=optionsRadios]:checked').val();
        var pollID = getParameterByName('id');
        var userID = getParameterByName('user');

        if (voteOptionID) {
            ref.child(userID + '/polls/' + pollID + '/pollOptions/' + voteOptionID + '/optionVotes').transaction(function(currentValue) {
                return currentValue + 1;
            });
            $("#panelVote").slideToggle();
        }
    });

    $("#btnSharePoll").click(function() {
        var pollURL = "http://" + window.location.hostname + window.location.pathname + '?id=' + getParameterByName('id') + '%26user=' + getParameterByName('user');
        window.open('mailto:?subject=Take this poll!&body=' + pollURL);
    });

    $("#btnVoteAddOption").click(function() {
        var newOption = prompt("Please enter the option you would like to add", "");
        // var authData = ref.getAuth();

        var pollOption = {
            optionName: newOption,
            optionVotes: 0
        };
        //  newMessageRef.child("pollOptions").push(pollOption);

        ref.child(getParameterByName('user') + '/polls/' + getParameterByName('id') + '/pollOptions/').push(pollOption);

        //console.log(authData);
    });

    function showUserInfo(authData) {

        $('#navbarLogoutButton').html('<button class="btn btn-danger navbar-btn logoutbtn" type="button" id="logoutButton"><i class="fa fa-sign-out"></i> Logout</button>');

        switch (authData.provider) {
            case "github":
                $("#navbarLoggedIn").html("Logged in as " + authData.github.displayName);
                break;
            case "google":
                $("#navbarLoggedIn").html("Logged in as " + authData.google.displayName);
                break;
            case "password":
                $("#navbarLoggedIn").html("Logged in as " + authData.password.email);
                break;
            default:
                break;
        }
    }

    function login(authData) {
        authData = ref.getAuth();

        ref.on('value', function(dataSnapshot) {
            $("#numTimes").html(dataSnapshot.child(authData.uid + "/numclicks").val());
        });

        $("#messages").html('<div class="alert alert-success" role="alert">Logged in as: ' + authData.uid + '</div>');
        window.location.href = "main.html";
    }

    function getParameterByName(name) {
        name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
        var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
            results = regex.exec(location.search);
        return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
    }

    function drawBarChart(chartLabel, labels, data) {
        var chartData = {
            labels: labels,
            datasets: [{
                label: chartLabel,
                fillColor: "rgba(151,187,205,0.5)",
                strokeColor: "rgba(151,187,205,0.8)",
                highlightFill: "rgba(151,187,205,0.75)",
                highlightStroke: "rgba(151,187,205,1)",
                data: data
            }]
        };
        var context = document.getElementById('myBarChart').getContext('2d');
        var skillsChart = new Chart(context).Bar(chartData);
    }


});