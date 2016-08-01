"use strict";


var currentInSession = false;
var firstTimeFetch = true;

var dateArray = [];
var dateEndArray = [];
var titleArray = [];
var locationArray = [];
var nsdateArray = [];

// Configure CloudKit for your app.
CloudKit.configure({
    containers: [{

        // Change this to a container identifier you own.
        containerIdentifier: 'iCloud.com.cjlondon.KCLTechConnect',

        apiTokenAuth: {
            // And generate a web token through CloudKit Dashboard.
            apiToken: '580a1698647c5f61e239507a9817e482e8a473a06d44209e8661f511a2ae0aea',

            persist: true // Sets a cookie.
        },

        environment: 'development'
    }]
});

function performQuery(
    databaseScope, zoneName, ownerRecordName, recordType,
    desiredKeys, sortByField, ascending, latitude, longitude,
    filters
) {
    var container = CloudKit.getDefaultContainer();
    var database = container.getDatabaseWithDatabaseScope(
        CloudKit.DatabaseScope[databaseScope]
    );

    // Set the query parameters.
    var query = {
        recordType: recordType
    };

    if (sortByField) {
        var sortDescriptor = {
            fieldName: sortByField,
            ascending: ascending
        };

        query.sortBy = [sortDescriptor];
    }

    // Set the options.
    var options = {

        // Restrict our returned fields to this array of keys.
        desiredKeys: desiredKeys

    };

    if (zoneName) {
        options.zoneID = {
            zoneName: zoneName
        };
        if (ownerRecordName) {
            options.zoneID.ownerRecordName = ownerRecordName;
        }
    }

    // Execute the query.
    return database.performQuery(query, options)
        .then(function(response) {
            if (response.hasErrors) {

                // Handle them in your app.
                throw response.errors[0];

            } else {
                var records = response.records;

                var numberOfRecords = records.length;
                if (numberOfRecords === 0) {
                    return render('No matching items')
                } else {

                    var skipping = true;
                    for (var i = 0; i < numberOfRecords; i++) {

                        var currentRecord = records[i].fields;

                        // Time
                        // Start Time
                        var startTime = timestampToReadableFormat(currentRecord['StartTime'].value);
                        dateArray.push(startTime);
                        nsdateArray.push(new Date(currentRecord['StartTime'].value));

                        // End Time
                        var endTime = currentRecord['EndTime'];
                        if (endTime != undefined) {
                            endTime = timestampToReadableFormat(currentRecord['EndTime'].value);
                        }
                        dateEndArray.push(endTime === undefined ? '' : endTime);

                        var now = new Date();

                        if ((now >= nsdateArray[i] && now < (endTime === undefined ? now : endTime)) || now <= nsdateArray[i]) {
                            skipping = false;
                        } else {
                            if (skipping == true) {
                                console.log("continue...");
                                continue;
                            }
                        }


                        // Title
                        var title = currentRecord['Title'].value;
                        titleArray.push(title);


                        // locationArray
                        var location = currentRecord['Location'];
                        if (location != undefined) {
                            location = currentRecord['Location'].value;
                        }
                        locationArray.push(location === undefined ? '' : location);

                    }


                    // Render webpage
                    if (firstTimeFetch == true) {
                        createList(dateArray, dateEndArray, titleArray, locationArray, nsdateArray);
                        window.setInterval(function() {
                            checkUpdate()
                        }, 10000);
                        firstTimeFetch = false;
                    } else {
                        updateList(dateArray, dateEndArray, titleArray, locationArray, nsdateArray);
                    }

                }
            }
        });
}

function timestampToReadableFormat(time) {

    // Create a new JavaScript Date object based on the timestamp
    // multiplied by 1000 so that the argument is in milliseconds, not seconds.
    var date = new Date(time);
    // Hours part from the timestamp
    var hours = "0" + date.getHours();
    // Minutes part from the timestamp
    var minutes = "0" + date.getMinutes();

    // Will display time in 10:30 format
    var formattedTime = hours.substr(-2) + ':' + minutes.substr(-2);

    return formattedTime;

}

performQuery('PUBLIC', '_defaultZone', '', 'Schedule', ['Title', 'Location', 'StartTime', 'EndTime'], 'StartTime', true, '', '', []);


function performAnnouncementQuery() {

    var container = CloudKit.getDefaultContainer();
    var database = container.getDatabaseWithDatabaseScope(
        CloudKit.DatabaseScope['PUBLIC']
    );

    // Set the query parameters.
    var query = {
        recordType: 'Announcement'
    };

    var sortDescriptor = {
        fieldName: 'Index',
        ascending: true
    };

    query.sortBy = [sortDescriptor];


    // Set the options.
    var options = {

        // Restrict our returned fields to this array of keys.
        desiredKeys: ['Content', 'Index']

    };

    options.zoneID = {
        zoneName: '_defaultZone'
    };


    // Execute the query.
    return database.performQuery(query, options)
        .then(function(response) {
            if (response.hasErrors) {

                // Handle them in your app.
                throw response.errors[0];

            } else {
                var records = response.records;

                var numberOfRecords = records.length;
                if (numberOfRecords === 0) {
                    console.log("no items");
                } else {

                    var string = "";

                    for (var i = 0; i < numberOfRecords; i++) {

                        var currentRecord = records[i].fields;
                        var messageContent = currentRecord['Content'].value;

                        string += messageContent;

                        if (i != numberOfRecords - 1) {
                            string += "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";
                        }

                    }

                    document.getElementById("marqueetext").innerHTML = string;

                }

            }
        })


}


performAnnouncementQuery();


function createList(dateArray, dateEndArray, titleArray, locationArray, nsdateArray) {
    console.log("create list called");

    var options = {
        item: 'liveblog-item'
    };

    var values = [];
    for (var i = 0; i < titleArray.length; i++) {

        var time = '';
        if (dateEndArray[i] == "") {
            time = dateArray[i];
        } else {
            time = dateArray[i] + ' - ' + dateEndArray[i];
        }

        if (locationArray[i] != "") {
            time += "&nbsp;&nbsp; <a class=\"time-b\">" + locationArray[i] + "</a>";
        }

        var temp = {
            title: titleArray[i],
            time: time,
        };
        values.push(temp);
    }

    var liveList = new List('liveblog-list', options, values);
    liveList.update();

    var list = document.getElementById('liveblog-list').getElementsByTagName("li");
    for (var i = 0; i < titleArray.length; i++) {
        if (nsdateArray[i].getDate() == 7) {
            list[i].classList.add("greenIndicator");
        }
    }

}

function updateList(dateArray, dateEndArray, titleArray, locationArray) {

    console.log("update list called");
    var options = {
        valueNames: ['title', 'time']
    };
    console.log(titleArray);

    var values = [];
    for (var i = 0; i < titleArray.length; i++) {

        var time = '';
        if (dateEndArray[i] == "") {
            time = dateArray[i];
        } else {
            time = dateArray[i] + ' - ' + dateEndArray[i];
        }

        if (locationArray[i] != "") {
            time += "&nbsp;&nbsp; <a class=\"time-b\">" + locationArray[i] + "</a>";
        }

        var temp = {
            title: titleArray[i],
            time: time,
            location: locationArray[i],
        };
        values.push(temp);
    }

    var liveList = new List('liveblog-list', options);
    liveList.clear();
    liveList.add(values);

    var list = document.getElementById('liveblog-list').getElementsByTagName("li");
    for (var i = 0; i < titleArray.length; i++) {
        if (nsdateArray[i].getDate() == 7) {
            list[i].classList.add("greenIndicator");
        }
    }

}

function checkUpdate() {
    dateArray = [];
    dateEndArray = [];
    titleArray = [];
    locationArray = [];
    nsdateArray = [];
    performQuery('PUBLIC', '_defaultZone', '', 'Schedule', ['Title', 'Location', 'StartTime', 'EndTime'], 'StartTime', true, '', '', []);
    performAnnouncementQuery();
}
