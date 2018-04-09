;(function(global, $) {

    var Adg = function() {
        return new Adg.init();
    }
    
    Adg.prototype = {};

    Adg.init = function() {
        var self = this;

        self.processed_exam = null;
        self.json_record_for_upload = null;
        self.baseline = null;
        // self.result = null;
        self.current_exams = {};
    }

    Adg.init.prototype = Adg.prototype;

    Adg.prototype.ears = ['left','right'];
    Adg.prototype.exam_types = ['baseline_exam','current_exam'];
    Adg.prototype.months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    Adg.prototype.normal_exam_level_cutoff = 55;  // dB
    Adg.prototype.frequencies = ['500','1000','2000','3000','4000','6000','8000'];
        
    Adg.prototype.processAudiogram = function(new_exam, baseline, current_exams) {
        this.initProcessedExam(new_exam);
        this.setBaseline(baseline);
        this.setCurrentExams(current_exams);
        this.evaluateHearing();
        this.addNewExamToCurrentExams();
        this.setJSONRecordForUpload();
    };

    Adg.prototype.addNewExamToCurrentExams = function() {
        this.current_exams['recordNew'] = this.setExamDisplay();
    };

    Adg.prototype.setCurrentExams = function(current_exams) {
        // this.current_exams = Object.assign(current_exams, this.current_exams);

        for (const examKey in current_exams) {
            if (current_exams.hasOwnProperty(examKey)) {
                this.current_exams[examKey] = current_exams[examKey];
            }
        }
    };

    Adg.prototype.setJSONRecordForUpload = function() {
        this.json_record_for_upload = [{
            "first_name":this.processed_exam.first_name,
            "middle_name":this.processed_exam.middle_name,
            "last_name":this.processed_exam.last_name,
            "dob":this.processed_exam.dob,
            "sex":this.processed_exam.sex,
            "ssn":''+this.processed_exam.ssn,
            "email_address":this.processed_exam.email,
            "person_id":this.processed_exam.person_id,
            "test_date":this.processed_exam.test_date,
            "test_time":this.processed_exam.test_time,
            "site_id":this.processed_exam.site_id,
            "group_id":this.processed_exam.group_id,
            "order":this.processed_exam.order,
            "left":{
                "age_corrected":this.processed_exam.left.age_corrected,
                "osha_average_ac":this.processed_exam.left.osha_average_ac,
                "exam":this.processed_exam.left.exam,
                "expanded_eval":this.processed_exam.left.expanded_eval,
                "sts_status":this.processed_exam.left.sts_status
            },
            "right":{
                "age_corrected":this.processed_exam.right.age_corrected,
                "osha_average_ac":this.processed_exam.right.osha_average_ac,
                "exam":this.processed_exam.right.exam,
                "expanded_eval":this.processed_exam.right.expanded_eval,
                "sts_status":this.processed_exam.right.sts_status
            }
        }];
    };

    Adg.prototype.setBaseline = function(baseline) {
        this.baseline = baseline;
    }

    Adg.prototype.initProcessedExam = function(record, baseline) {
        this.processed_exam = {
            'name': record['LAST NAME']+', '+record['FIRST NAME'],
            'first_name': record['FIRST NAME'],
            'middle_name': record['INITIAL'] ? record['INITIAL'] : null,
            'last_name': record['LAST NAME'],
            'dob': record['DOB'],
            'sex': record['GENDER'] === 'M' ? 2:1,
            'ssn': record['SSN'],
            'email': record['EMAIL'] ? record['EMAIL'] : null,
            'person_id': record['ID#'] ? record['ID#'] : null,
            'test_type': record['TEST TYPE'],
            'test_date': record['DATE OF TEST'],
            'test_time': record['TIME OF TEST'],
            'site_id': record['SITE ID'],
            'group_id': record['GROUP ID'],
            'site': record['REGION'],
            'group': record['LOCATION'],
            'order': record['ORDER'],
            'left': {
                'age_corrected': null,
                'osha_average_ac': null,
                'exam': [
                    record['LF .5k'],
                    record['LF 1k'],
                    record['LF 2k'],
                    record['LF 3k'],
                    record['LF 4k'],
                    record['LF 6k'],
                    record['LF 8k']
                ],
                'expanded_eval': null,
                'sts_status': null
            },
            'right': {
                'age_corrected': null,
                'osha_average_ac': null,
                'exam': [
                    record['RT .5k'],
                    record['RT 1k'],
                    record['RT 2k'],
                    record['RT 3k'],
                    record['RT 4k'],
                    record['RT 6k'],
                    record['RT 8k']
                ],
                'expanded_eval': null,
                'sts_status': null
            }
        };
    };

    Adg.prototype.evaluateHearing = function() {
        
        var self = this;        
        var dob = self.processed_exam['dob'];
        var gender = self.processed_exam['sex'];

        var baseline_exam = processExam('baseline_exam');
        var current_exam = processExam('current_exam'); 
        var comparison = self.computeComparisons(baseline_exam, current_exam);    
                                        
        self.processed_exam['left']['age_corrected'] = current_exam['left']['age_corrected'];
        self.processed_exam['left']['osha_average_ac'] = current_exam['left']['osha_average_ac'];
        self.processed_exam['left']['expanded_eval'] = current_exam['left']['expanded_eval'];
        self.processed_exam['left']['sts_status'] = current_exam['left']['sts_status'];

        self.processed_exam['right']['age_corrected'] = current_exam['right']['age_corrected'];
        self.processed_exam['right']['osha_average_ac'] = current_exam['right']['osha_average_ac'];
        self.processed_exam['right']['expanded_eval'] = current_exam['right']['expanded_eval'];
        self.processed_exam['right']['sts_status'] = current_exam['right']['sts_status'];

        self.processed_exam.exam_display = setExamDisplay();

        function processExam(exam_type){                
    
            var test_date = setTestDate();
            var candidate_age = self.get_candidate_age(dob, test_date);
            var exam_results = {
                left: computeExamResults('left'),
                right: computeExamResults('right')
            };

            return exam_results;             

            function computeExamResults(ear) {
                var hearing_levels = getUserTestResponses(ear);    
                var user_responses = cleanUserResponses(hearing_levels);
                var user_responses_ac = ageCorrectUserResponses(user_responses);                
                
                return evaluateUserResponses(user_responses, user_responses_ac);
            };   
    
            function evaluateUserResponses(user_responses, user_responses_ac) {

                var average_threshold = self.compute_average_threshold(user_responses);
                var average_threshold_ac = self.compute_average_threshold(user_responses_ac);
                var osha_average = self.compute_osha_avg(user_responses);
                var osha_average_ac = self.compute_osha_avg(user_responses_ac);

                // compute if "severe hearing loss" is present - if we list individual audiogram records, this will show us at a glance which ones are abnormal
                var status, status_str;
            
                if (average_threshold_ac >= self.normal_exam_level_cutoff){
                    status = 2;                       // record shows impairment (severe_hearing_loss_current = True)
                    status_str = 'Record shows impairment. '+average_threshold_ac+' ('+self.normal_exam_level_cutoff+' dB cut-off)';
                }
                else{
                    status = 1;                          // record does not show impairment (severe_hearing_loss_current = False)
                    status_str = 'Record does not show impairment. '+average_threshold_ac+' ('+self.normal_exam_level_cutoff+' dB cut-off)';
                }

                var expanded_eval, expanded_eval_str;
        
                if (average_threshold_ac < 25){
                    expanded_eval = 0;
                    expanded_eval_str = 'Normal';
                } else if (average_threshold_ac < 40){
                    expanded_eval = 1;
                    expanded_eval_str = 'Mild';
                } else if (average_threshold_ac < 55){
                    expanded_eval = 2;
                    expanded_eval_str = 'Moderate';
                } else if (average_threshold_ac < 70){
                    expanded_eval = 3;
                    expanded_eval_str = 'Mod. Severe';
                } else if (average_threshold_ac < 80){
                    expanded_eval = 4;
                    expanded_eval_str = 'Severe (4)';
                } else{
                    expanded_eval = 5;
                    expanded_eval_str = 'Profound';  
                }

                var eval = {
                    candidate_age: candidate_age,
                    exam_date: test_date,
                    hearing_levels: user_responses,
                    age_corrected: user_responses_ac,
                    average_threshold: average_threshold,
                    average_threshold_ac: average_threshold_ac,
                    osha_average: osha_average,
                    osha_average_ac: osha_average_ac,
                    sts_status: 0,
                    sts_status_str: 'No comparison done',
                    status: status,
                    status_str: status_str,
                    expanded_eval: expanded_eval,
                    expanded_eval_str: expanded_eval_str
                };

                return eval;
            }

            function setTestDate() {
                if (exam_type === 'baseline_exam'){
                    // test_date = self.processed_exam[exam_type]['date'];
                    return self.baseline['date'];
                } else {                    
                    return self.processed_exam['test_date'];                         
                }                
            }

            function getUserTestResponses(ear) {
                if (exam_type === 'baseline_exam'){
                    // return  self.processed_exam[exam_type]['thresholds'][ear];
                    return  self.baseline['thresholds'][ear];
                } else {                    
                    return  self.processed_exam[ear]['exam'];
                }  
            }

            function ageCorrectUserResponses(user_responses) {
                return user_responses.map(function(candidate_response_threshold, freq_index) {
                    return self.ageCorrectResponse(candidate_response_threshold, freq_index, gender, candidate_age);
                });
            }

            function cleanUserResponses(userResponses) {
                return userResponses.map(self.emptyStrToNull);      
            }
        }
        
        function setExamDisplay() {            
            return {                
                id: null,
                date: setExamDate(),
                order: self.processed_exam['order'],
                averages: {
                    left: current_exam.left['average_threshold_ac'],
                    right: current_exam.right['average_threshold_ac']
                },
                thresholds: {
                    left: current_exam.left['hearing_levels'],
                    right: current_exam.right['hearing_levels']
                },
                expandedEvaluation: {
                    left: current_exam.left['expanded_eval'],
                    right: current_exam.right['expanded_eval']
                },
                stsStatus: {
                    left: current_exam.left['sts_status'],
                    right: current_exam.right['sts_status']
                }                
            };
        }

        function setExamDate() {
            var exam_date = new Date(self.processed_exam['test_date']);
            var exam_date_month = exam_date.getUTCMonth();
            var exam_date_day = exam_date.getUTCDate();
            var exam_date_year = exam_date.getUTCFullYear();
    
            return exam_date_day+' '+self.months[exam_date_month]+' '+exam_date_year;
        }        
    };

    Adg.prototype.setExamDisplay = function() {

        const current = this.processed_exam.exam_display;

        console.log(current);

        return {
            id: 'New',              // current.id
            date: current.date,
            order: current.order,
            averages: {
                left: current.averages.left,
                right: current.averages.right
            },
            thresholds: {
                left: current.thresholds.left,
                right: current.thresholds.right
            },
            expandedEvaluation: {
                left: current.expandedEvaluation.left,
                right: current.expandedEvaluation.right
            },
            stsStatus: {
                left: current.stsStatus.left,
                right: current.stsStatus.right
            }
        };
    };

    Adg.prototype.compute_average_threshold = function(freqs){
        var f500 = freqs[0];
        var f1k = freqs[1];
        var f2k = freqs[2];
        var f3k = freqs[3];
        return (f500 + f1k + f2k + f3k)/4.0;
    };

    Adg.prototype.compute_osha_avg = function(freqs){
        var f2k = freqs[2];
        var f3k = freqs[3];
        var f4k = freqs[4];
        return (f2k + f3k + f4k)/3.0;
    };

    Adg.prototype.computeComparisons = function(baseline_exam, current_exam) {

        if (baseline_exam === null){
            return {};
        }
        
        // var b_exam = baseline_exam.exam_results;
        // var c_exam = current_exam.exam_results;
        var b_exam = baseline_exam;
        var c_exam = current_exam;

        var _compare = function(_baseline_exam, _current_exam){
            //    status codes:
            //    0 = no STS
            //    1 = STS
            //    2 = potentially recordable STS
            //    3 = recordable STS
            //    4 = STS improvement
    
            var osha_shift_ac = _current_exam['osha_average_ac'] - _baseline_exam['osha_average_ac'];
    
            if (osha_shift_ac >= 10) {
                // marked change
                // marked worsening            
                if (_current_exam['osha_average'] >= 25) return 2;   // STS potentially recordable
                return 1;   // STS
            } else if (osha_shift_ac <= -10){
                // marked change
                // marked improvement            
                return 4;
            } else {
                return 0;
            }
        }
    
        var results = this.ears.map(function(ear){ return _compare(b_exam[ear], c_exam[ear]); });
    
        return {
            left: results[0],  
            right: results[1]
        };
    };

    Adg.prototype.emptyStrToNull = function(val) { 
        return (val === "") ? null : val; 
    };

    Adg.prototype.get_candidate_age = function(dob, test_date){
        var _dob = new Date(dob);
        var _dot = new Date(test_date);
    
        var ty = _dot.getFullYear();
        var tm = _dot.getMonth()+1;
        var td = _dot.getDay();
    
        var py = _dob.getFullYear();
        var pm = _dob.getMonth()+1;
        var pd = _dob.getDay();
    
        var years_old = ty - py;
    
        // if current month is less than the birth month, then subtract one from years
        // or
        // if current month is the same as the birth month but current day is less than birth day, then subtract one from years
        if ((tm < pm) || ((tm == pm) && (td < pd))){ years_old -= 1 }
    
        return years_old;
    };

    Adg.prototype.ageCorrectResponse = function(candidate_response_threshold, freq_index, _gender, _age) {
        if (isNaN(parseInt(candidate_response_threshold,10))) return null;
        var _f = this.frequencies[freq_index];
        var _a = _age;
        if ((_f === '500') || (_f === '8000')) return candidate_response_threshold;
        if (_a > 60) _a = '60';
        var _g = (_gender === 2) ? 'M' : 'F';

        var correction_value = this.ageCorrectionData[_g][_a][_f];
        return candidate_response_threshold - correction_value;
    };
        

    Adg.prototype.ageCorrectionData = {
        
        'M': {

            20: {
                1000: 5,
                2000: 3,
                3000: 4,
                4000: 5,
                6000: 8
            },
            21: {
                1000: 5,
                2000: 3,
                3000: 4,
                4000: 5,
                6000: 8
            },
            22: {
                1000: 5,
                2000: 3,
                3000: 4,
                4000: 5,
                6000: 8
            },
            23: {
                1000: 5,
                2000: 3,
                3000: 4,
                4000: 6,
                6000: 9
            },
            24: {
                1000: 5,
                2000: 3,
                3000: 5,
                4000: 6,
                6000: 9
            },
            25: {

                1000: 5,
                2000: 3,
                3000: 5,
                4000: 7,
                6000: 10
            },
            26: {

                1000: 5,
                2000: 4,
                3000: 5,
                4000: 7,
                6000: 10
            },
            27: {

                1000: 5,
                2000: 4,
                3000: 6,
                4000: 7,
                6000: 11
            },
            28: {
                1000: 6,
                2000: 4,
                3000: 6,
                4000: 8,
                6000: 11
            },
            29: {
                1000: 6,
                2000: 4,
                3000: 6,
                4000: 8,
                6000: 12
            },
            30: {
                1000: 6,
                2000: 4,
                3000: 6,
                4000: 9,
                6000: 12
            },
            31: {
                1000: 6,
                2000: 4,
                3000: 7,
                4000: 9,
                6000: 13
            },
            32: {
                1000: 6,
                2000: 5,
                3000: 7,
                4000: 10,
                6000: 14
            },
            33: {
                1000: 6,
                2000: 5,
                3000: 7,
                4000: 10,
                6000: 14
            },
            34: {
                1000: 6,
                2000: 5,
                3000: 8,
                4000: 11,
                6000: 15
            },
            35: {
                1000: 7,
                2000: 5,
                3000: 8,
                4000: 11,
                6000: 15
            },
            36: {
                1000: 7,
                2000: 5,
                3000: 9,
                4000: 12,
                6000: 16
            },
            37: {
                1000: 7,
                2000: 6,
                3000: 9,
                4000: 12,
                6000: 17
            },
            38: {
                1000: 7,
                2000: 6,
                3000: 9,
                4000: 13,
                6000: 17
            },
            39: {
                1000: 7,
                2000: 6,
                3000: 10,
                4000: 14,
                6000: 18
            },
            40: {
                1000: 7,
                2000: 6,
                3000: 10,
                4000: 14,
                6000: 19
            },
            41: {
                1000: 7,
                2000: 6,
                3000: 10,
                4000: 14,
                6000: 20
            },
            42: {
                1000: 8,
                2000: 7,
                3000: 11,
                4000: 16,
                6000: 20
            },
            43: {
                1000: 8,
                2000: 7,
                3000: 12,
                4000: 16,
                6000: 21
            },
            44: {
                1000: 8,
                2000: 7,
                3000: 12,
                4000: 17,
                6000: 22
            },
            45: {
                1000: 8,
                2000: 7,
                3000: 13,
                4000: 18,
                6000: 23
            },
            46: {
                1000: 8,
                2000: 8,
                3000: 13,
                4000: 19,
                6000: 24
            },
            47: {
                1000: 8,
                2000: 8,
                3000: 14,
                4000: 19,
                6000: 24
            },
            48: {
                1000: 9,
                2000: 8,
                3000: 14,
                4000: 20,
                6000: 25
            },
            49: {
                1000: 9,
                2000: 9,
                3000: 15,
                4000: 21,
                6000: 26
            },
            50: {
                1000: 9,
                2000: 9,
                3000: 16,
                4000: 22,
                6000: 27
            },
            51: {
                1000: 9,
                2000: 9,
                3000: 16,
                4000: 23,
                6000: 28
            },
            52: {
                1000: 9,
                2000: 10,
                3000: 17,
                4000: 24,
                6000: 29
            },
            53: {
                1000: 9,
                2000: 10,
                3000: 18,
                4000: 25,
                6000: 30
            },
            54: {
                1000: 10,
                2000: 10,
                3000: 18,
                4000: 26,
                6000: 31
            },
            55: {
                1000: 10,
                2000: 11,
                3000: 19,
                4000: 27,
                6000: 32
            },
            56: {
                1000: 10,
                2000: 11,
                3000: 20,
                4000: 28,
                6000: 34
            },
            57: {
                1000: 10,
                2000: 11,
                3000: 21,
                4000: 29,
                6000: 35
            },
            58: {
                1000: 10,
                2000: 12,
                3000: 22,
                4000: 31,
                6000: 36
            },
            59: {
                1000: 11,
                2000: 12,
                3000: 22,
                4000: 32,
                6000: 37
            },
            60: {
                1000: 11,
                2000: 13,
                3000: 23,
                4000: 33,
                6000: 38  
            }
        },
    
        'F': {

            20: {
                1000: 7,
                2000: 4,
                3000: 3,
                4000: 3,
                6000: 6
            },
            21: {
                1000: 7,
                2000: 4,
                3000: 4,
                4000: 3,
                6000: 6
            },
            22: {
                1000: 7,
                2000: 4,
                3000: 4,
                4000: 4,
                6000: 6
            },
            23: {
                1000: 7,
                2000: 5,
                3000: 4,
                4000: 4,
                6000: 7
            },
            24: {
                1000: 7,
                2000: 5,
                3000: 4,
                4000: 4,
                6000: 7
            },
            25: {
                1000: 8,
                2000: 5,
                3000: 4,
                4000: 4,
                6000: 7
            },
            26: {
                1000: 8,
                2000: 5,
                3000: 5,
                4000: 4,
                6000: 8
            },
            27: {
                1000: 8,
                2000: 5,
                3000: 5,
                4000: 5,
                6000: 8
            },
            28: {
                1000: 8,
                2000: 5,
                3000: 5,
                4000: 5,
                6000: 8
            },
            29: {
                1000: 8,
                2000: 5,
                3000: 5,
                4000: 5,
                6000: 9
            },
            30: {
                1000: 8,
                2000: 6,
                3000: 5,
                4000: 5,
                6000: 9
            },
            31: {
                1000: 8,
                2000: 6,
                3000: 6,
                4000: 5,
                6000: 9
            },
            32: {
                1000: 9,
                2000: 6,
                3000: 6,
                4000: 6,
                6000: 10
            },
            33: {
                1000: 9,
                2000: 6,
                3000: 6,
                4000: 6,
                6000: 10
            },
            34: {
                1000: 9,
                2000: 6,
                3000: 6,
                4000: 6,
                6000: 10
            },
            35: {
                1000: 9,
                2000: 6,
                3000: 7,
                4000: 7,
                6000: 11
            },
            36: {
                1000: 9,
                2000: 7,
                3000: 7,
                4000: 7,
                6000: 11
            },
            37: {
                1000: 9,
                2000: 7,
                3000: 7,
                4000: 7,
                6000: 12
            },
            38: {
                1000: 10,
                2000: 7,
                3000: 7,
                4000: 7,
                6000: 12
            },
            39: {
                1000: 10,
                2000: 7,
                3000: 8,
                4000: 8,
                6000: 12
            },
            40: {
                1000: 10,
                2000: 7,
                3000: 8,
                4000: 8,
                6000: 13
            },
            41: {
                1000: 10,
                2000: 8,
                3000: 8,
                4000: 8,
                6000: 13
            },
            42: {
                1000: 10,
                2000: 8,
                3000: 9,
                4000: 9,
                6000: 13
            },
            43: {
                1000: 11,
                2000: 8,
                3000: 9,
                4000: 9,
                6000: 14
            },
            44: {
                1000: 11,
                2000: 8,
                3000: 9,
                4000: 9,
                6000: 14
            },
            45: {
                1000: 11,
                2000: 8,
                3000: 10,
                4000: 10,
                6000: 15
            },
            46: {
                1000: 11,
                2000: 9,
                3000: 10,
                4000: 10,
                6000: 15
            },
            47: {
                1000: 11,
                2000: 9,
                3000: 10,
                4000: 11,
                6000: 16
            },
            48: {
                1000: 12,
                2000: 9,
                3000: 11,
                4000: 11,
                6000: 16
            },
            49: {
                1000: 12,
                2000: 9,
                3000: 11,
                4000: 11,
                6000: 16
            },
            50: {
                1000: 12,
                2000: 10,
                3000: 11,
                4000: 12,
                6000: 17
            },
            51: {
                1000: 12,
                2000: 10,
                3000: 12,
                4000: 12,
                6000: 17
            },
            52: {
                1000: 12,
                2000: 10,
                3000: 12,
                4000: 13,
                6000: 18
            },
            53: {
                1000: 13,
                2000: 10,
                3000: 13,
                4000: 13,
                6000: 18
            },
            54: {
                1000: 13,
                2000: 11,
                3000: 13,
                4000: 14,
                6000: 19
            },
            55: {
                1000: 13,
                2000: 11,
                3000: 14,
                4000: 14,
                6000: 19
            },
            56: {
                1000: 13,
                2000: 11,
                3000: 14,
                4000: 15,
                6000: 20
            },
            57: {
                1000: 13,
                2000: 11,
                3000: 15,
                4000: 15,
                6000: 20
            },
            58: {

                1000: 14,
                2000: 12,
                3000: 15,
                4000: 16,
                6000: 21
            },
            59: {
                1000: 14,
                2000: 12,
                3000: 16,
                4000: 16,
                6000: 21
            },
            60: {
                1000: 14,
                2000: 12,
                3000: 16,
                4000: 17,
                6000: 22                       
            }            
        }
    };

    global.Adg = global.A$ = Adg;

}(window, jQuery));
