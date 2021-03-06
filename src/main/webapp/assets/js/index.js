var refreshToken = "d7777fd3ba_rP3x2nmSzN5HatDI13OqwBFUKzcMDuMuON";
$(document).ready(function () {
    $.ajax({
        url: "https://developer.setmore.com/api/v1/o/oauth2/token?refreshToken=" + refreshToken,
        type: "GET",
        async: false,
        success: function (response) {
            window.accessToken = response.data.token.access_token;
        },
        error : function () {
            alert("Refresh Token Expired!!!!");
          }
    });


    $('.container').bootstrapWizard({
        onTabClick: function (tab, navigation, index) {
            return false;
        }
    });

    getServiceList();
    getStaffList();

    $("#testID").datepicker({
        inline: true,
        format: 'dd/mm/yyyy',
        todayBtn: "linked",
        todayHighlight: true,
        beforeShowDay: function () {
            window.SelectedDate = formateDate(new Date());
        },
    }).on('changeDate', getSelectedDate);
    
});

function formateDate(inputDate) {
    var today = new Date();
    var dd = today.getDate();
    var mm = today.getMonth() + 1;

    var yyyy = today.getFullYear();
    if (dd < 10) {
        dd = '0' + dd;
    }
    if (mm < 10) {
        mm = '0' + mm;
    }
    return dd + '/' + mm + '/' + yyyy;
}

function getServiceList() {
    $.ajax({
        url: 'https://developer.setmore.com/api/v1/bookingapi/services',
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader("Content-Type", "application/json");
            xhr.setRequestHeader('Authorization', 'BEARER ' + accessToken);
         
        },
        success: function (serviceResponseData) {
            let serviceList = serviceResponseData.data.services;
            for (var i = 0; i < serviceList.length; i++) {
                if (serviceList[i].key == "s2e2f1512396937312") {
                    window.StaffKeyArray = serviceList[i].staff_keys;
                }
            }
        }
    });
}


function getStaffList() {
    $.ajax({
        url: 'https://developer.setmore.com/api/v1/bookingapi/staffs',
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader("Content-Type", "application/json");
            xhr.setRequestHeader('Authorization', 'BEARER ' + accessToken);
        },
        success: function (staffResponseData) {
            let staffList = staffResponseData.data.staffs;

            for (var i = 0; i < staffList.length; i++) {

                for (var j = 0; j < StaffKeyArray.length; j++) {

                    if (staffList[i].key == StaffKeyArray[j]) {
                        var source = document.getElementById("entry-template").innerHTML;
                        var template = Handlebars.compile(source);

                        var context = {
                            id: staffList[i].key,
                            firstName: staffList[i].first_name,
                            lastName: staffList[i].last_name,
                            about: staffList[i].comment
                        };

                        if (staffList[i].hasOwnProperty("image_url")) {
                            context.url = staffList[i].image_url;
                        } else {
                            context.url = "/assets/img/staff.png";
                        }
                        var html = template(context);
                        $(".staff-list").append(html);

                    }
                }
            }
        }
    });
}

$(document).on('click', '.choice', function () {
    window.StaffKey = $(this).find("input").attr("id");
    $('.container').bootstrapWizard('next');
    generateSlot(StaffKey);
});

function generateSlot(key) {
    $(".available-slots").empty();
    var dataObject = {
        "staff_key": key,
        "service_key": "s2e2f1512396937312",
        "selected_date": SelectedDate,
        "off_hours": false,
        "double_booking": false,
        "slot_limit": 30
    };

    $.ajax({
        url: "https://developer.setmore.com/api/v1/bookingapi/slots",
        type: "POST",
        beforeSend: function (xhr) {
            xhr.setRequestHeader("Content-Type", "application/json");
            xhr.setRequestHeader('Authorization', 'BEARER ' + accessToken);
        },
        async: false,
        data: JSON.stringify(dataObject),
        success: function (response) {
            let fetchedSlots = response.data.slots;
            if (response.data.slots.length === 0) {
                $(".available-slots").append("<h4 class='h4'>No Slots Available</h4>");
            } else {
                $(".generated-slots").remove();
                let slotSource = document.getElementById("slot-template").innerHTML;
                let slotTemplate = Handlebars.compile(slotSource);
                let slotHtml = slotTemplate(fetchedSlots);
                $(".available-slots").append(slotHtml);
            }
        }
    })
}

function getSelectedDate() {
    SelectedDate = $('#testID').datepicker('getFormattedDate');
    generateSlot(StaffKey);
}

$(document).on('click', '.time-slots', function () {
    window.time = $(this).text();
    $("#employeePhone").intlTelInput({
        separateDialCode: true,
        utilsScript: "assets/js/utils.js"
      });
    $('.container').bootstrapWizard('next');
});


$("#scheduleAppt").click(function() {
    console.log("Scheduling....");
    var fullName = $("#employeeName").val().trim().split(' ').reverse();
    firstName = fullName.pop();
    lastName = fullName.join(' ');

    var tempPhone = $(".selected-dial-code").text() +" "+$("#employeePhone").val().trim();
    let Phone = tempPhone.split(' ');
    let extensionCode = Phone[0];
    let phoneNumber = Phone[Phone.length-1];

    let email = $("#employeeEmail").val().trim();

    if(firstName !== "" && email !== ""){
    var customerObject = {
        "first_name" : firstName,
        "last_name" : lastName,
        "email_id" : email,
        "country_code" : extensionCode,
        "cell_phone" : phoneNumber
    };

    $.ajax({
        url: "https://developer.setmore.com/api/v1/bookingapi/customer/create",
        type: "POST",
        beforeSend: function (xhr) {
            xhr.setRequestHeader("Content-Type", "application/json");
            xhr.setRequestHeader('Authorization', 'BEARER ' + accessToken);
        },
        async: false,
        data: JSON.stringify(customerObject),
        success: function (response) {
          window.CustomerKey  = response.data.customer.key; 
          scheduleAppointment();          } 
    });
    }
    else{
        alert("Provide your name or email address!!");
    }
  });


function scheduleAppointment(){

    let dateTimeArray = SelectedDate.split("/");
    let formattedDateAndTime = dateTimeArray[2]+"-"+dateTimeArray[1]+"-"+dateTimeArray[0]+"T"+time+":00";
    let startDate = moment(formattedDateAndTime).format();
   
    let endDate =  moment(formattedDateAndTime).add(30, 'm').format();

    let apptObject =      {
        "staff_key" : StaffKey,      
        "service_key" : "s2e2f1512396937312",      
        "customer_key" : CustomerKey,  
        "start_time" : startDate,     
        "end_time"  : endDate
    }

    $.ajax({
        url: "https://developer.setmore.com/api/v1/bookingapi/appointment/create",
        type: "POST",
        beforeSend: function (xhr) {
            xhr.setRequestHeader("Content-Type", "application/json");
            xhr.setRequestHeader('Authorization', 'BEARER ' + accessToken);
        },
        async: false,
        data: JSON.stringify(apptObject),
        success: function (response) {
            console.log(response);
            $("#successModal").modal();
}});
}

$(".go-first").click(function(){
	 $("#employeeName").val('');
     $("#employeeEmail").val('');
     $("#employeePhone").val('');
     $('.container').bootstrapWizard('first');
});

$('body').tooltip({
    selector: '[data-toggle="wizard-radio"]'
});
