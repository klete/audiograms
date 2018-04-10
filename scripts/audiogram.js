;(function(global, $) {

    var Adg = function() {
        return new Adg.init();
    }
    
    Adg.prototype = {};

    Adg.init = function() {
        var self = this;

        self.baseline = null;
        self.current_exams = {};

        self.cleaned_new_exam = null;
        self.exam_display_record = null;
        self.json_upload_record = null;
    }

    Adg.init.prototype = Adg.prototype;

    Adg.prototype.ears = ['left','right'];
    Adg.prototype.exam_types = ['baseline_exam','current_exam'];
    Adg.prototype.months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    Adg.prototype.normal_exam_level_cutoff = 55;  // dB
    Adg.prototype.frequencies = ['500','1000','2000','3000','4000','6000','8000'];
        
    Adg.prototype.processAudiogram = function(new_exam, baseline, current_exams) {
        this.cleanNewExam(new_exam);
        this.setBaseline(baseline);
        this.setCurrentExams(current_exams);

        this.initExamDisplayRecord();
        this.initJSONUploadRecord();

        var processed_baseline = this.processBaseline();
        var processed_new_exam = this.processNewExam();
        var comparison = this.computeSTSStatus(processed_baseline, processed_new_exam);

        this.updateJSONUploadRecord(processed_new_exam, comparison);
        this.updateExamDisplayRecord(processed_new_exam);
        this.addNewExamToCurrentExamsForDisplay();
    };

    Adg.prototype.cleanNewExam = function(record) {
        this.cleaned_new_exam = {
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
                'exam': [
                    record['LF .5k'],
                    record['LF 1k'],
                    record['LF 2k'],
                    record['LF 3k'],
                    record['LF 4k'],
                    record['LF 6k'],
                    record['LF 8k']
                ]
            },
            'right': {
                'exam': [
                    record['RT .5k'],
                    record['RT 1k'],
                    record['RT 2k'],
                    record['RT 3k'],
                    record['RT 4k'],
                    record['RT 6k'],
                    record['RT 8k']
                ]
            }
        };
    };

    Adg.prototype.setBaseline = function(baseline) {
        this.baseline = baseline;
    }

    Adg.prototype.setCurrentExams = function(current_exams) {
        // this.current_exams = Object.assign(current_exams, this.current_exams);

        for (const examKey in current_exams) {
            if (current_exams.hasOwnProperty(examKey)) {
                this.current_exams[examKey] = current_exams[examKey];
            }
        }
    };

    Adg.prototype.initExamDisplayRecord = function() {
        var self = this;

        this.exam_display_record = {
            id: 'New',              // current.id
            date: _setExamDate(),
            order: this.cleaned_new_exam.order,
            averages: {
                left: null,
                right: null
            },
            thresholds: {
                left: null,
                right: null
            },
            expandedEvaluation: {
                left: null,
                right: null
            },
            stsStatus: {
                left: null,
                right: null
            }
        };

        function _setExamDate() {
            var exam_date = new Date(self.cleaned_new_exam['test_date']);
            var exam_date_month = exam_date.getUTCMonth();
            var exam_date_day = exam_date.getUTCDate();
            var exam_date_year = exam_date.getUTCFullYear();
    
            return exam_date_day+' '+self.months[exam_date_month]+' '+exam_date_year;
        }                
    }

    Adg.prototype.updateExamDisplayRecord = function(new_exam) {
        this.exam_display_record['averages']['left'] = new_exam.left['average_threshold_ac'];
        this.exam_display_record['averages']['right'] = new_exam.right['average_threshold_ac'];
        
        this.exam_display_record['thresholds']['left'] = new_exam.left['hearing_levels'];
        this.exam_display_record['thresholds']['right'] = new_exam.right['hearing_levels'];
        
        this.exam_display_record['expandedEvaluation']['left'] = new_exam.left['expanded_eval'];
        this.exam_display_record['expandedEvaluation']['right'] = new_exam.right['expanded_eval'];
        
        this.exam_display_record['stsStatus']['left'] = new_exam.left['sts_status'];
        this.exam_display_record['stsStatus']['right'] = new_exam.right['sts_status'];        
    }

    Adg.prototype.initJSONUploadRecord = function() {
        this.json_upload_record = {
            "first_name": this.cleaned_new_exam.first_name,
            "middle_name": this.cleaned_new_exam.middle_name,
            "last_name": this.cleaned_new_exam.last_name,
            "dob": this.cleaned_new_exam.dob,
            "sex": this.cleaned_new_exam.sex,
            "ssn": this.cleaned_new_exam.ssn,
            "email_address": this.cleaned_new_exam.email,
            "person_id": this.cleaned_new_exam.person_id,
            "test_date": this.cleaned_new_exam.test_date,
            "test_time": this.cleaned_new_exam.test_time,
            "site_id": this.cleaned_new_exam.site_id,
            "group_id": this.cleaned_new_exam.group_id,
            "order": this.cleaned_new_exam.order,
            "left":{
                "age_corrected": null,
                "osha_average_ac": null,
                "exam": this.cleaned_new_exam.left.exam,
                "expanded_eval": null,
                "sts_status": null
            },
            "right":{
                "age_corrected": null,
                "osha_average_ac": null,
                "exam": this.cleaned_new_exam.right.exam,
                "expanded_eval": null,
                "sts_status": null
            }
        };    
    }

    Adg.prototype.updateJSONUploadRecord = function(new_exam, comparison) {
        this.json_upload_record['left']['sts_status'] = comparison['left']['sts_status'];
        this.json_upload_record['left']['sts_status_str'] = comparison['left']['sts_status_str'];

        this.json_upload_record['right']['sts_status'] = comparison['right']['sts_status'];
        this.json_upload_record['right']['sts_status_str'] = comparison['right']['sts_status_str'];

        this.json_upload_record['left']['age_corrected'] = new_exam['left']['age_corrected'];
        this.json_upload_record['left']['osha_average_ac'] = new_exam['left']['osha_average_ac'];
        this.json_upload_record['left']['expanded_eval'] = new_exam['left']['expanded_eval'];

        this.json_upload_record['right']['age_corrected'] = new_exam['right']['age_corrected'];
        this.json_upload_record['right']['osha_average_ac'] = new_exam['right']['osha_average_ac'];
        this.json_upload_record['right']['expanded_eval'] = new_exam['right']['expanded_eval'];
    }
    
    Adg.prototype.processBaseline = function() {        
        var test_date = this.baseline['date'];
        var hearing_levels = {
            left: this.baseline['thresholds']['left'],
            right: this.baseline['thresholds']['right']
        };
        return this.processExam(hearing_levels, test_date);
    };

    Adg.prototype.processNewExam = function() {
        var test_date = this.cleaned_new_exam['test_date'];      
        var hearing_levels = {
            left: this.cleaned_new_exam['left']['exam'],
            right: this.cleaned_new_exam['right']['exam']
        };
        return this.processExam(hearing_levels, test_date);
    }    

    Adg.prototype.processExam = function(hearing_levels, test_date) {
        var candidate_age = this.getUserAge(test_date);
        return {
            left: this.processEar(hearing_levels['left'], candidate_age),
            right: this.processEar(hearing_levels['right'], candidate_age)
        };
    }

    Adg.prototype.processEar = function(hearing_levels, candidate_age) {
        var user_responses = this.cleanUserResponses(hearing_levels);
        var user_responses_ac = this.ageCorrectUserResponses(user_responses, candidate_age);                
        
        var average_threshold = this.computeAverageThreshold(user_responses);
        var average_threshold_ac = this.computeAverageThreshold(user_responses_ac);
        var osha_average = this.computeOshaAverage(user_responses);
        var osha_average_ac = this.computeOshaAverage(user_responses_ac);

        var status = this.computeHearingStatus(average_threshold_ac);
        var expanded_eval = this.computeExpandedEval(average_threshold_ac);

        return {
            hearing_levels: user_responses,
            age_corrected: user_responses_ac,
            average_threshold: average_threshold,
            average_threshold_ac: average_threshold_ac,
            osha_average: osha_average,
            osha_average_ac: osha_average_ac,
            sts_status: 0,
            sts_status_str: 'No comparison done',
            status: status.status,
            status_str: status.status_str,
            expanded_eval: expanded_eval.expanded_eval,
            expanded_eval_str: expanded_eval.expanded_eval_str
        };
    }

    Adg.prototype.computeSTSStatus = function(baseline_exam, current_exam) {
        if (baseline_exam === null){
            return {};
        }
            
        return {
            left: _compare(baseline_exam['left'], current_exam['left']),  
            right: _compare(baseline_exam['right'], current_exam['right'])
        };

        function _compare(_baseline_exam, _current_exam){
            //    status codes:
            //    0 = no STS
            //    1 = STS
            //    2 = potentially recordable STS
            //    3 = recordable STS
            //    4 = STS improvement
            var sts_status = 0;
            var sts_status_str = '';

            var osha_shift_ac = _current_exam['osha_average_ac'] - _baseline_exam['osha_average_ac'];
    
            if (osha_shift_ac >= 10) {
                // marked change
                // marked worsening            
                if (_current_exam['osha_average'] >= 25) {
                    sts_status = 2; 
                    sts_status_str = 'STS potentially recordable';
                } else {
                    sts_status = 1;
                    sts_status_str = 'STS';    
                }
            } else if (osha_shift_ac <= -10){
                // marked change
                // marked improvement            
                sts_status = 4;
                sts_status_str = 'Marked improvement';    
            }

            return {
                sts_status: sts_status,
                sts_status_str: sts_status_str,
            };
        }        
    }

    Adg.prototype.getUserAge = function(test_date){
        var _dob = new Date(this.cleaned_new_exam.dob);
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
    }

    Adg.prototype.cleanUserResponses = function(userResponses) {
        return userResponses.map(function(val) { 
            return (val === "") ? null : val; 
        });      
    }

    Adg.prototype.ageCorrectUserResponses = function(user_responses, candidate_age) {
        var self = this;

        return user_responses.map(function(candidate_response_threshold, freq_index) {
            return self.ageCorrectResponse(candidate_response_threshold, freq_index, candidate_age);
        });
    }

    Adg.prototype.computeAverageThreshold = function(freqs) {
        var f500 = freqs[0];
        var f1k = freqs[1];
        var f2k = freqs[2];
        var f3k = freqs[3];
        return (f500 + f1k + f2k + f3k)/4.0;
    }

    Adg.prototype.computeOshaAverage = function(freqs) {
        var f2k = freqs[2];
        var f3k = freqs[3];
        var f4k = freqs[4];
        return (f2k + f3k + f4k)/3.0;
    }

    Adg.prototype.computeHearingStatus = function(average_threshold_ac) {
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

        return { status: status, status_str: status_str };
    }

    Adg.prototype.computeExpandedEval = function(average_threshold_ac) {
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

        return { expanded_eval: expanded_eval, expanded_eval_str: expanded_eval_str };
    }

    Adg.prototype.addNewExamToCurrentExamsForDisplay = function() {
        this.current_exams['recordNew'] = this.exam_display_record;
    };


    Adg.prototype.emptyStrToNull = function(val) { 
        return (val === "") ? null : val; 
    };

    Adg.prototype.ageCorrectResponse = function(candidate_response_threshold, freq_index, _age) {
        if (isNaN(parseInt(candidate_response_threshold,10))) return null;
        var _f = this.frequencies[freq_index];
        var _a = _age;
        var _g;

        if ((_f === '500') || (_f === '8000')) return candidate_response_threshold;

        if (_a > 60) _a = '60';
        
        if (this.cleaned_new_exam.sex === 2) {
            _g = 'M';
         } else if (this.cleaned_new_exam.sex === 1) {
            _g = 'F';
         } else {
            throw new Error('[Adg.prototype.ageCorrectResponse] Invalid sex: ' + this.cleaned_new_exam.sex)
         }

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
