$(document).ready(function(){

/* ==========================================================================
    Fullcalendar
    ========================================================================== */

    $('#calendar').fullCalendar({
        lang: 'es',
        header: {
            left: '',
            center: 'prev, title, next',
            right: 'today agendaDay,agendaTwoDay,agendaWeek,month'
        },
        buttonIcons: {
            prev: 'font-icon font-icon-arrow-left',
            next: 'font-icon font-icon-arrow-right',
            prevYear: 'font-icon font-icon-arrow-left',
            nextYear: 'font-icon font-icon-arrow-right'
        },
        defaultDate: new Date(),
        editable: true,
        selectable: true,
        eventLimit: 2,
        schedulerLicenseKey: 'CC-Attribution-NonCommercial-NoDerivatives',
        events: function(start, end, timezone, callback) {
            $.ajax({
                url: '/tarea_mes', 
                type: 'POST',
                dataType: 'json',
                data: {
                    start: start.format(),
                    end: end.format()
                },
                success: function(doc) {
                    var events = [];
                    $(doc).each(function() {
                        events.push({
                            title: $(this).attr('ID'), 
                            start: $(this).attr('FECHA'), 
                            allDay: true,
                            className: $(this).attr('ESTADO') == 4 ? 'event-green' : ''
                        });
                    });
                    callback(events);

                }
            });
        },
        viewRender: function(view, element) {

            if (!("ontouchstart" in document.documentElement)) {
                $('.fc-scroller').jScrollPane({
                    autoReinitialise: true,
                    autoReinitialiseDelay: 100
                });
            }

            $('.fc-popover.click').remove();
        },
        eventClick: function(event, calEvent, jsEvent, view) {

            var eventEl = $(this);
            if (!$(this).hasClass('event-clicked')) {
                $('.fc-event').removeClass('event-clicked');

                $(this).addClass('event-clicked');
            }

            $.ajax({
                url: '/resumen_detalle',
                type: 'POST',
                dataType: 'json',
                data: {
                    id: event.title 
                },
                success: function(data) {

                    $('body').append(
                        '<div class="fc-popover click">' +
                            '<div class="fc-header">' +
                                'Detalle de la tarea' +
                                '<button type="button" class="cl"><i class="font-icon-close-2"></i></button>' +
                            '</div>' +

                            '<div class="fc-body main-screen">' +
                                '<p class="color-blue-grey">Tarea: '+data.TAREA+'<br/>Servicio: '+data.SERVICIO+
                                '<br/>CODIGO: '+data.CODIGO+'<br/>EQUIPO: '+data.EQUIPO+'<br/>Fecha: '+data.FECHA+
                                '<br/>Técnico: '+data.TECNICO+'<br/>Estado: '+data.ESTADO_TAREA+'</p>' +
                                '<ul class="actions">' +
                                    '<li><a href="/protocolo/'+data.TAREA+'" target="_blank">Mas detalles</a></li>' +
                                '</ul>' +
                            '</div>' +
                        '</div>'
                    );

                    $('.fc-popover.click .datetimepicker').datetimepicker({
                        widgetPositioning: {
                            horizontal: 'right'
                        }
                    });

                    $('.fc-popover.click .datetimepicker-2').datetimepicker({
                        widgetPositioning: {
                            horizontal: 'right'
                        },
                        format: 'LT',
                        debug: true
                    });

                    function posPopover(){
                        $('.fc-popover.click').css({
                            left: eventEl.offset().left + eventEl.outerWidth()/2,
                            top: eventEl.offset().top + eventEl.outerHeight()
                        });
                    }

                    posPopover();

                    $('.fc-scroller, .calendar-page-content, body').scroll(function(){
                        posPopover();
                    });

                    $(window).resize(function(){
                        posPopover();
                    });

                    if ($('.fc-popover.click').length > 1) {
                        for (var i = 0; i < ($('.fc-popover.click').length - 1); i++) {
                            $('.fc-popover.click').eq(i).remove();
                        }
                    }

                    $('.fc-popover.click .cl, .fc-popover.click .remove-popover').click(function(){
                        $('.fc-popover.click').remove();
                        $('.fc-event').removeClass('event-clicked');
                    });

                    $('.fc-event-action-edit').click(function(e){
                        e.preventDefault();

                        $('.fc-popover.click .main-screen').hide();
                        $('.fc-popover.click .edit-event').show();
                    });

                    $('.fc-event-action-remove').click(function(e){
                        e.preventDefault();

                        $('.fc-popover.click .main-screen').hide();
                        $('.fc-popover.click .remove-confirm').show();
                    });
                    
                }
            });
        }
    });


/* ==========================================================================
    Side datepicker
    ========================================================================== */

    $('#side-datetimepicker').datetimepicker({
        inline: true,
        format: 'DD/MM/YYYY'
    });

/* ========================================================================== */

});


/* ==========================================================================
    Calendar page grid
    ========================================================================== */

(function($, viewport){
    $(document).ready(function() {

        if(viewport.is('>=lg')) {
            $('.calendar-page-content, .calendar-page-side').matchHeight();
        }

        // Execute code each time window size changes
        $(window).resize(
            viewport.changed(function() {
                if(viewport.is('<lg')) {
                    $('.calendar-page-content, .calendar-page-side').matchHeight({ remove: true });
                }
            })
        );
    });
})(jQuery, ResponsiveBootstrapToolkit);




// $(document).ready(function() {

//     var lastPopover;
    
//     $('#calendar').fullCalendar({

//         lang: 'es',
//         header: {
//             left: '',
//             center: 'prev, title, next',
//             right: 'today agendaDay,agendaTwoDay,agendaWeek,month'
//         },
//         defaultDate: new Date(),
//         editable: true,
//         selectable: true,
//         eventLimit: 2,
//         schedulerLicenseKey: 'CC-Attribution-NonCommercial-NoDerivatives',
//         events: function(start, end, timezone, callback) {
//             $.ajax({
//                 url: '/tarea_mes', 
//                 type: 'POST',
//                 dataType: 'json',
//                 data: {
//                     start: start.format(),
//                     end: end.format()
//                 },
//                 success: function(doc) {
//                     var events = [];
//                     $(doc).each(function() {
//                         events.push({
//                             title: $(this).attr('ID'), 
//                             start: $(this).attr('FECHA'), 
//                             allDay: true,
//                             color: $(this).attr('ESTADO') == 4 ? 'lightgreen' : ''
//                         });
//                     });
//                     callback(events);

//                 }
//             });
//         },
//         eventClick: function(event, jsEvent, view) {

//             if (lastPopover) {
//                 $(lastPopover).popover('hide');
//             }
            
//             $.ajax({
//                 url: '/resumen_detalle',
//                 type: 'POST',
//                 dataType: 'json',
//                 data: {
//                     id: event.title 
//                 },
//                 success: function(data) {
//                     var popoverContent = "<p>Tarea: " + data[0].IdTarea + "</p>";
//                     popoverContent += "<p>Estado: " + data[0].EstadoDesc + "</p>";
                    
//                     $(jsEvent.target).popover({
//                         title: "Detalles de la tarea",
//                         content: popoverContent,
//                         html: true,
//                         placement: 'top',
//                         trigger: 'manual'
//                     }).popover('show');

//                     lastPopover = jsEvent.target;
//                 }
//             });
//         }

//     });
    
//     $(document).on('click', function (e) {
//         if (!$(e.target).closest('.popover').length && !$(e.target).is('[data-toggle="popover"]')) { 
//             if (lastPopover) {
//                 $(lastPopover).popover('hide');
//                 lastPopover = null;
//             }
//         }
//     });
// });
