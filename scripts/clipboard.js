/* cSpell:disable */
$(document).ready(function() {
    
    const json_record = adg.json_record_for_upload;

    function copy() {
        var copyText = document.getElementById('jsonOutputTextarea');
        copyText.select();
        document.execCommand("Copy");
        alert("Copied the text: " + copyText.value);
    }

    $("div#jsonCopyButton").click(copy);
    $('#jsonOutputTextarea').val(JSON.stringify(json_record));
    $('#jsonOutputPre').html(JSON.stringify(json_record, null, 2));

});        
