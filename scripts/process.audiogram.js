/* cSpell:disable */
var new_exam = {
    'FIRST NAME': 'VINCENT',
    'INITIAL': 'ANTHONY',
    'LAST NAME': 'CZYZ',
    'DOB': '06/16/1984',
    'GENDER': 'M',
    'EMAIL': 'VINNIE.CZYZ@DENBURY.COM',
    'SSN': 9549,
    'ID#': 73817,
    'TEST TYPE': 'A',
    'DATE OF TEST': '03/29/2018',
    'TIME OF TEST': '00:00:00',
    'REGION': 'NORTH REGION',
    'LOCATION': 'GILLETTE WY',
    'HIRE DATE': '03/01/2013',
    'EXAMINER': 'UNKNOWN',
    'MODEL': 'MONITOR MI 5000',
    'SERIAL#': '61244',
    'CAL. DATE': '04/19/2017',
    'PROTECTOR TYPE': null,
    'LF OTOSCOPE': null,
    'RT OTOSCOPE': null,
    'NOTES': null,
    'LF .5k': 10,
    'LF 1k': 10,
    'LF 2k': 0,
    'LF 3k': 5,
    'LF 4k': 5,
    'LF 6k': 10,
    'LF 8k': 5,
    'RT .5k': 5,
    'RT 1k': 5,
    'RT 2k': 0,
    'RT 3k': 5,
    'RT 4k': 0,
    'RT 6k': 5,
    'RT 8k': 10,
    'SITE ID': 1690,
    'GROUP ID': 1360,
    'ORDER': 3
};

var baseline_from_api = {
    'id': 52509,
    'date': '9/18/2014',
    'thresholds': {
        'left': [5, 5, 5, 5, 10, 5, 5],
        'right': [5, 5, 0, 0, 5, 10, 5],
    }
};

var current_exams = {
                
    record52509: {
        id: 52509,
        date: '18 Sep 2014',
        order: 1,
        averages: {
            left: 0.33,
            right: -4.67
        },
        thresholds: {
            left: [
                5,
                5,
                5,
                5,
                10,
                5,
                5
            ],
            right: [
                5,
                5,
                0,
                0,
                5,
                10,
                5
            ]
        },
        expandedEvaluation: {
            left: 0,
            right: 0
        },
        stsStatus: {
            left: 0,
            right: 0
        }
    },
    record52510: {
        id: 52510,
        date: '6 Aug 2015',
        order: 2,
        averages: {
            left: 0.0,
            right: 0.0
        },
        thresholds: {
            left: [
                5,
                5,
                0,
                5,
                15,
                5,
                10
            ],
            right: [
                5,
                5,
                5,
                5,
                10,
                15,
                0
            ]
        },
        expandedEvaluation: {
            left: 0,
            right: 0
        },
        stsStatus: {
            left: 0,
            right: 0
        }
    }
};

var adg = A$();

adg.processAudiogram(new_exam, baseline_from_api, current_exams);
