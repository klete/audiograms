/* cSpell:disable */
$(document).ready(function() {

    var recordSet = adg.current_exams;

    var leftBaseline = recordSet['record'+adg.baseline.id];
    var rightBaseline = recordSet['record'+adg.baseline.id];
    
    var oldLeftBaselines = [];
    var oldRightBaselines = [];    

    function selectRecord() {
        var selection = $(this).val();
    
        var selectedRecord = recordSet["record" + selection];
    
        recordsChart.get("thisLeft").update({
            data: selectedRecord.thresholds.left,
            name: selectedRecord.date + " (Left)"
        });
    
        recordsChart.get("thisRight").update({
            data: selectedRecord.thresholds.right,
            name: selectedRecord.date + " (Right)"
        });
    
        if (selectedRecord.pdfUrl) {
            $("#enlbutton .date").html(selectedRecord.date);
            $("#enlbutton").attr("href",selectedRecord.pdfUrl).show();
        } else {
            $("#enlbutton").hide().attr("href","");
        }
    
        var expandedStatuses = ["Normal Hearing","Mild Impairment","Moderate Impairment","Moderately Severe Impairment","Severe Impairment","Profound Impairment"];
    
        $("#expanded .left .text").html(expandedStatuses[selectedRecord.expandedEvaluation.left]);
        $("#expanded .right .text").html(expandedStatuses[selectedRecord.expandedEvaluation.right]);
    }
    
    function toggleAverages() {
        var selection = $("input[name=adgview]:checked").val();
    
        showingTrend = (selection == "trend");
    
        if (showingTrend) {
            $("#adghistory").removeClass("showingrecords").addClass("showingtrend");
        } else {
            $("#adghistory").removeClass("showingtrend").addClass("showingrecords");
        }
    }
    
    function toggleBaseline() {
        showingBaseline = !showingBaseline;
    
        updateCharts();
    
        if (showingBaseline) {
            $(".baseline.selector").addClass("on");
        } else {
            $(".baseline.selector").removeClass("on");
        }
    }
    
    function toggleLeft() {
        showingLeft = !showingLeft;
    
        $("#leftoption").prop("checked",showingLeft);
    
        if (!showingLeft && !showingRight) {
            toggleRight();
        }
    
        updateCharts();
    
        if (showingLeft) {
            $(".left.selector").addClass("on");
        } else {
            $(".left.selector").removeClass("on");
        }
    }
    
    function toggleRight() {
        showingRight = !showingRight;
    
        $("#rightoption").prop("checked",showingRight);
    
        if (!showingRight && !showingLeft) {
            toggleLeft();
        }
    
        updateCharts();
    
        if (showingRight) {
            $(".right.selector").addClass("on");
        } else {
            $(".right.selector").removeClass("on");
        }
    }
    
    function updateCharts() {
        var recordsVisibilities = {
            baselineLeft: showingLeft && showingBaseline,
            baselineRight: showingRight && showingBaseline,
            thisLeft: showingLeft,
            thisRight: showingRight
        };
    
        for (var prop in recordsVisibilities) {
            if (recordsVisibilities.hasOwnProperty(prop)) {
                if (recordsVisibilities[prop]) {
                    recordsChart.get(prop).show();
                } else {
                    recordsChart.get(prop).hide();
                }
            }
        }
    
        // var trendVisibilities = {
        //     left: showingLeft,
        //     right: showingRight
        // };
    
        // for (var prop in trendVisibilities) {
        //     if (trendVisibilities.hasOwnProperty(prop)) {
        //         if (trendVisibilities[prop]) {
        //             trendChart.get(prop).show();
        //         } else {
        //             trendChart.get(prop).hide();
        //         }
        //     }
        // }
    }
    
    var showingLeft = true;
    var showingRight = true;
    var showingBaseline = false;
    
    var recordsChart, trendChart;
    var orderedRecords = [];
    
    // one-time page setup
    
    if (typeof recordSet != "undefined") {
        // declare the charts
    
        recordsChart = $("#recordschartcontainer").highcharts({
            chart: {
                backgroundColor: "rgba(255,255,255,0)",
                height: 400,
                ignoreHiddenSeries: false,
                spacingLeft: 5,
                spacingRight: 0,
                type: "line"
            },
            credits: {
                enabled: false
            },
            legend: {
                enabled: false
            },
            series: [
                {
                    color: "rgba(41,88,123,0.4)",
                    dashStyle: "dash",
                    id: "baselineLeft",
                    marker: {
                        radius: 6,
                        symbol: "circle"
                    },
                    name: "Current Baseline (Left)"
                },
                {
                    color: "rgba(203,39,43,0.4)",
                    dashStyle: "dash",
                    id: "baselineRight",
                    marker: {
                        radius: 6,
                        symbol: "circle"
                    },
                    name: "Current Baseline (Right)"
                },
                {
                    color: "rgba(41,88,123,0.75)",
                    id: "thisLeft",
                    marker: {
                        radius: 6,
                        symbol: "circle"
                    }
                },
                {
                    color: "rgba(203,39,43,0.75)",
                    id: "thisRight",
                    marker: {
                        radius: 6,
                        symbol: "circle"
                    }
                }
            ],
            title: {
                text: ""
            },
            tooltip: {
                headerFormat: '<span style="color: {series.color}">{series.name}</span><br />{point.key} Hz: <b>{point.y} db</b>',
                pointFormat: ''
            },
            xAxis: {
                categories: [500,1000,2000,3000,4000,6000,8000],
                labels: {
                    format: "{value} Hz"
                },
                lineWidth: 0
            },
            yAxis: {
                min: -10,
                max: 100,
                plotBands: [
                    {
                        color: "rgba(255,255,255,1)",
                        from: -10,
                        to: 25
                    },
                    {
                        color: "rgba(0,0,0,0.05)",
                        from: 25,
                        label: {
                            style: {
                                color: "rgba(19,41,57,0.4)"
                            },
                            text: "Mild Hearing Loss"
                        },
                        to: 40
                    },
                    {
                        color: "rgba(0,0,0,0.1)",
                        from: 40,
                        label: {
                            style: {
                                color: "rgba(19,41,57,0.4)"
                            },
                            text: "Moderate Hearing Loss"
                        },
                        to: 55
                    },
                    {
                        color: "rgba(0,0,0,0.15)",
                        from: 55,
                        label: {
                            style: {
                                color: "rgba(19,41,57,0.4)"
                            },
                            text: "Moderately Severe Hearing Loss"
                        },
                        to: 70
                    },
                    {
                        color: "rgba(0,0,0,0.2)",
                        from: 70,
                        label: {
                            style: {
                                color: "rgba(19,41,57,0.4)"
                            },
                            text: "Severe Hearing Loss"
                        },
                        to: 85
                    },
                    {
                        color: "rgba(0,0,0,0.25)",
                        from: 85,
                        label: {
                            style: {
                                color: "rgba(19,41,57,0.4)"
                            },
                            text: "Profound Hearing Loss"
                        },
                        to: 100
                    }
                ],
                reversed: true,
                tickInterval: 10,
                title: {
                    text: "Hearing Threshold Level (dB)"
                }
            }
        }).highcharts();
    
        // trendChart = $("#trendchartcontainer").highcharts({
        //     chart: {
        //         backgroundColor: "rgba(255,255,255,0)",
        //         height: 400,
        //         ignoreHiddenSeries: false,
        //         spacingLeft: 5,
        //         spacingRight: 0,
        //         type: "line"
        //     },
        //     credits: {
        //         enabled: false
        //     },
        //     legend: {
        //         enabled: false
        //     },
        //     series: [
        //         {
        //             color: "rgba(41,88,123,0.75)",
        //             id: "left",
        //             marker: {
        //                 radius: 6,
        //                 symbol: "circle"
        //             },
        //             name: "Left"
        //         },
        //         {
        //             color: "rgba(203,39,43,0.75)",
        //             id: "right",
        //             marker: {
        //                 radius: 6,
        //                 symbol: "circle"
        //             },
        //             name: "Right"
        //         }
        //     ],
        //     title: {
        //         text: ""
        //     },
        //     tooltip: {
        //         headerFormat: '<span style="color: {series.color}">{series.name} OSHA Average</span><br />{point.key}: <b>{point.y} db</b>',
        //         pointFormat: ''
        //     },
        //     xAxis: {
        //         lineWidth: 0,
        //         tickLength: 0
        //     },
        //     yAxis: {
        //         min: -10,
        //         max: 100,
        //         plotBands: [
        //             {
        //                 color: "rgba(0,0,0,0.05)",
        //                 from: 25,
        //                 label: {
        //                     style: {
        //                         color: "rgba(19,41,57,0.4)"
        //                     },
        //                     text: "Mild Hearing Loss"
        //                 },
        //                 to: 40
        //             },
        //             {
        //                 color: "rgba(0,0,0,0.1)",
        //                 from: 40,
        //                 label: {
        //                     style: {
        //                         color: "rgba(19,41,57,0.4)"
        //                     },
        //                     text: "Moderate Hearing Loss"
        //                 },
        //                 to: 55
        //             },
        //             {
        //                 color: "rgba(0,0,0,0.15)",
        //                 from: 55,
        //                 label: {
        //                     style: {
        //                         color: "rgba(19,41,57,0.4)"
        //                     },
        //                     text: "Moderately Severe Hearing Loss"
        //                 },
        //                 to: 70
        //             },
        //             {
        //                 color: "rgba(0,0,0,0.2)",
        //                 from: 70,
        //                 label: {
        //                     style: {
        //                         color: "rgba(19,41,57,0.4)"
        //                     },
        //                     text: "Severe Hearing Loss"
        //                 },
        //                 to: 85
        //             },
        //             {
        //                 color: "rgba(0,0,0,0.25)",
        //                 from: 85,
        //                 label: {
        //                     style: {
        //                         color: "rgba(19,41,57,0.4)"
        //                     },
        //                     text: "Profound Hearing Loss"
        //                 },
        //                 to: 100
        //             }
        //         ],
        //         reversed: true,
        //         tickInterval: 10,
        //         title: {
        //             text: "Hearing Threshold Level (dB)"
        //         }
        //     }
        // }).highcharts();
    
        // created an ordered array of records
    
        for (var prop in recordSet) {
            if (recordSet.hasOwnProperty(prop)) {
                orderedRecords.push(recordSet[prop]);
            }
        }
    
        orderedRecords.sort(function(a,b) {
            return a.order - b.order;
        });
    
        // populate the list of records to select from
    
        for (var i = orderedRecords.length - 1; i >= 0; i--) {
          //var label = '<input id="record' + i + '" name="record" type="radio" value="' + orderedRecords[i].id + '"> <label for="record' + i + '">' + orderedRecords[i].date;
            var label = '<input id="record' + orderedRecords[i].id + '" name="record" type="radio" value="' + orderedRecords[i].id + '"> <label for="record' + orderedRecords[i].id + '">' + orderedRecords[i].date;
    
            switch (orderedRecords[i].stsStatus.left) {
                case 0:
                    break;
                case 1:
                    label += ' <span class="sts indicator">L-STS</span>';
                    break;
                case 2:
                    $("#legend").show();
    
                    label += ' <span class="sts indicator">L-STS <i class="fa icon-asterisk"></i></span>';
                    break;
                case 3:
                    label += ' <span class="recordable indicator">L-STS</span>';
                    break;
                case 4:
                    label += ' <span class="improvement indicator">L-IMP</span>';
                    break;
                case 5:
                    label += ' <span class="tts indicator">L-TTS</span>';
                    break;
            }
    
            switch (orderedRecords[i].stsStatus.right) {
                case 0:
                    break;
                case 1:
                    label += ' <span class="sts indicator">R-STS</span>';
                    break;
                case 2:
                    $("#legend").show();
    
                    label += ' <span class="sts indicator">R-STS <i class="fa icon-asterisk"></i></span>';
                    break;
                case 3:
                    label += ' <span class="recordable indicator">R-STS</span>';
                    break;
                case 4:
                    label += ' <span class="improvement indicator">R-IMP</span>';
                    break;
                case 5:
                    label += ' <span class="tts indicator">R-TTS</span>';
                    break;
            }
    
            if (orderedRecords[i] == leftBaseline) {
                label += ' <span class="leftbl indicator" title="Current Left Baseline">BL</span>';
            }
    
            if ($.inArray(orderedRecords[i].id, oldLeftBaselines) > -1) {
                label += ' <span class="leftbl-old indicator" title="Previous Left Baseline">BL</span>';
            }
    
            if (orderedRecords[i] == rightBaseline) {
                label += ' <span class="rightbl indicator" title="Current Right Baseline">BL</span>';
            }
    
            if ($.inArray(orderedRecords[i].id, oldRightBaselines) > -1) {
                label += ' <span class="rightbl-old indicator" title="Previous Right Baseline">BL</span>';
            }
    
            label += '<i class="fa icon-chevron-right"></i></label>';
    
            $("#recordlist").append(label);
        }
    
        // load appropriate data into the charts
    
        recordsChart.get("baselineLeft").update({
            data: leftBaseline.thresholds.left
        });
    
        recordsChart.get("baselineRight").update({
            data: rightBaseline.thresholds.right
        });
    
        var categories = [], leftTrends = [], rightTrends = [];
    
        for (var i = 0; i < orderedRecords.length; i++) {
            categories.push(orderedRecords[i].date);
            leftTrends.push(orderedRecords[i].averages.left);
            rightTrends.push(orderedRecords[i].averages.right);
        }
    
        // trendChart.xAxis[0].setCategories(categories);
    
        // trendChart.get("left").update({
        //     data: leftTrends,
        // });
    
        // trendChart.get("right").update({
        //     data: rightTrends
        // });
    
        updateCharts();
    
        // initially hide the trend view
    
        $("#adghistory").addClass("showingrecords");
    } else {
        $("#adghistory").addClass("showingempty");
    }
    
    $("#recordsoption, #trendoption").on("change",toggleAverages);
    $("#leftoption").on("change",toggleLeft);
    $("#rightoption").on("change",toggleRight);
    $("#baselineoption").on("change",toggleBaseline);
    $("input[name=record]").on("change",selectRecord);
    
    // select the requested record, or default to the most recent
    
    if (window.location.hash) {
        var recordToSelect = $(window.location.hash);
    
        if (recordToSelect.length > 0) {
            recordToSelect.click();
    
            $(window).scrollTop($("#adghistory").offset().top - 70);
        } else {
            $("#recordlist input").first().click();
        }
    } else {
        $("#recordlist input").first().click();
    }
});        