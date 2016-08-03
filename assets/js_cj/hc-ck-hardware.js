"use strict";


var currentInSession = false;
var firstTimeFetch = true;

var titleArray = [];
var amountLeftArray = [];
var totalAmountArray = [];

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

                        // Name
                        var name = currentRecord['Name'].value;
                        titleArray.push(name);

                        // Total Amount
                        var totalAmount = currentRecord['TotalAmount'].value;
                        totalAmountArray.push(totalAmount);

                        // locationArray
                        var amountLeft = currentRecord['AmountLeft'].value;
                        amountLeftArray.push(amountLeft);

                    }


                    // Render webpage
                    if (firstTimeFetch == true) {
                        createList();
                        window.setInterval(function() {
                            checkUpdate()
                        }, 10000);
                        firstTimeFetch = false;
                    } else {
                        updateList();
                    }

                }
            }
        });
}

function timestampToReadableFormat(time) {

    var d = new Date(time);
    var londonOffset = 1*60*60000;
    var userOffset = d.getTimezoneOffset() * 60000; // [min*60000 = ms]
    var utcTime = new Date(d.getTime() + userOffset + londonOffset);

    // Create a new JavaScript Date object based on the timestamp
    // multiplied by 1000 so that the argument is in milliseconds, not seconds.
    var date = new Date(utcTime);
    // Hours part from the timestamp
    var hours = "0" + date.getHours();
    // Minutes part from the timestamp
    var minutes = "0" + date.getMinutes();

    // Will display time in 10:30 format
    var formattedTime = hours.substr(-2) + ':' + minutes.substr(-2);

    return formattedTime;

}

performQuery('PUBLIC', '_defaultZone', '', 'Hardware', ['Name', 'TotalAmount', 'AmountLeft'], 'Name', true, '', '', []);


function createList() {
    console.log("create list called");

    var options = {
        item: 'liveblog-item'
    };

    var values = [];
    for (var i = 0; i < titleArray.length; i++) {

        var temp = {
            title: titleArray[i],
            amount: "Available: " + amountLeftArray[i] + "&nbsp;&nbsp; <a class=\"time-b\">Total: " + totalAmountArray[i] + "</a>"
        };
        values.push(temp);
    }

    var liveList = new List('liveblog-list', options, values);
    liveList.update();

    var list = document.getElementById('liveblog-list').getElementsByTagName("li");
    for (var i = 0; i < titleArray.length; i++) {
        if (amountLeftArray[i] <= 3) {
            list[i].classList.add("redIndicator");
        } else {
            list[i].classList.add("greenIndicator");
        }
    }

}

function updateList() {

    console.log("update list called");
    var options = {
        valueNames: ['title', 'amount']
    };
    console.log(titleArray);

    var values = [];
    for (var i = 0; i < titleArray.length; i++) {

      var temp = {
          title: titleArray[i],
          amount: "Available: " + amountLeftArray[i] + "&nbsp;&nbsp; <a class=\"time-b\">Total: " + totalAmountArray[i] + "</a>"
      };
      values.push(temp);

    }

    var liveList = new List('liveblog-list', options);
    liveList.clear();
    liveList.add(values);

    var list = document.getElementById('liveblog-list').getElementsByTagName("li");
    for (var i = 0; i < titleArray.length; i++) {
        if (amountLeftArray[i] <= 3) {
            list[i].classList.add("redIndicator");
        } else {
            list[i].classList.add("greenIndicator");
        }
    }

}

function checkUpdate() {
    titleArray = [];
    amountLeftArray = [];
    totalAmountArray = [];
    performQuery('PUBLIC', '_defaultZone', '', 'Hardware', ['Name', 'TotalAmount', 'AmountLeft'], 'Name', true, '', '', []);
}

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
